/**
 * Mass Import Script - Anna's Archive Spotify Metadata
 *
 * Imports all albums (excluding singles) from the Anna's Archive Spotify dump
 * into WaxFeed's PostgreSQL database.
 *
 * Source: /Volumes/360/annas_archive_spotify_2025_07_metadata/spotify_clean.sqlite3
 * Total albums to import: ~12M (albums + compilations, all years)
 */

import { PrismaClient } from "@prisma/client"
import Database from "better-sqlite3"

const prisma = new PrismaClient()

// Path to Anna's Archive SQLite database
const SQLITE_PATH = "/Volumes/360/annas_archive_spotify_2025_07_metadata/spotify_clean.sqlite3"

// Batch size for PostgreSQL inserts (larger = faster, more memory)
const BATCH_SIZE = 10000

// Number of concurrent batch inserts
const CONCURRENCY = 10

// Progress reporting interval
const PROGRESS_INTERVAL = 10000

interface SpotifyAlbumRow {
  spotify_id: string
  title: string
  artist_name: string
  artist_spotify_id: string | null
  release_date: string
  release_date_precision: string
  album_type: string
  total_tracks: number
  popularity: number
  label: string | null
}

interface AlbumImageRow {
  album_rowid: number
  width: number
  height: number
  url: string
}

interface ArtistGenreRow {
  artist_rowid: number
  genre: string
}

function parseReleaseDate(dateStr: string, precision: string): Date {
  const parts = dateStr.split("-")

  if (precision === "day" && parts.length >= 3) {
    return new Date(dateStr)
  } else if (precision === "month" && parts.length >= 2) {
    return new Date(`${parts[0]}-${parts[1]}-01`)
  } else {
    // Year only or fallback
    const year = parseInt(parts[0]) || 1970
    return new Date(`${year}-01-01`)
  }
}

async function main() {
  console.log("=".repeat(70))
  console.log("ANNA'S ARCHIVE MASS IMPORT - All Albums")
  console.log("=".repeat(70))

  // Open SQLite database (read-only)
  console.log("\nOpening SQLite database...")
  const sqlite = new Database(SQLITE_PATH, { readonly: true })

  // Get total count for progress tracking
  const countResult = sqlite.prepare(`
    SELECT COUNT(*) as count
    FROM albums
    WHERE album_type IN ('album', 'compilation')
  `).get() as { count: number }

  const totalAlbums = countResult.count
  console.log(`Total albums to import: ${totalAlbums.toLocaleString()}`)

  // Prepare the main query - join albums with primary artist
  console.log("\nPreparing query...")
  const albumQuery = sqlite.prepare(`
    SELECT
      a.rowid as album_rowid,
      a.id as spotify_id,
      a.name as title,
      ar.name as artist_name,
      ar.id as artist_spotify_id,
      a.release_date,
      a.release_date_precision,
      a.album_type,
      a.total_tracks,
      a.popularity,
      a.label
    FROM albums a
    LEFT JOIN artist_albums aa ON aa.album_rowid = a.rowid AND aa.index_in_album = 0
    LEFT JOIN artists ar ON ar.rowid = aa.artist_rowid
    WHERE a.album_type IN ('album', 'compilation')
  `)

  // Prepare image query
  const imageQuery = sqlite.prepare(`
    SELECT width, height, url
    FROM album_images
    WHERE album_rowid = ?
    ORDER BY width DESC
  `)

  // Prepare artist genres query (for primary artist)
  const genreQuery = sqlite.prepare(`
    SELECT genre
    FROM artist_genres ag
    JOIN artist_albums aa ON aa.artist_rowid = ag.artist_rowid
    WHERE aa.album_rowid = ? AND aa.index_in_album = 0
  `)

  console.log("\nStarting import...")
  const startTime = Date.now()

  let processed = 0
  let imported = 0
  let skipped = 0
  let errors = 0
  let batch: NonNullable<Parameters<typeof prisma.album.createMany>[0]>["data"] = []
  let pendingBatches: typeof batch[] = []

  // Iterate through all albums
  for (const row of albumQuery.iterate() as Iterable<SpotifyAlbumRow & { album_rowid: number }>) {
    processed++

    try {
      // Get images for this album
      const images = imageQuery.all(row.album_rowid) as AlbumImageRow[]
      const coverArtUrlLarge = images[0]?.url || null
      const coverArtUrlMedium = images.find(i => i.width <= 300)?.url || coverArtUrlLarge
      const coverArtUrlSmall = images.find(i => i.width <= 64)?.url || coverArtUrlMedium

      // Get genres from primary artist
      const genreRows = genreQuery.all(row.album_rowid) as ArtistGenreRow[]
      const genres = genreRows.map(g => g.genre)

      // Parse release date
      const releaseDate = parseReleaseDate(row.release_date, row.release_date_precision)

      // Build album record
      batch.push({
        spotifyId: row.spotify_id,
        title: row.title,
        artistName: row.artist_name || "Unknown Artist",
        artistSpotifyId: row.artist_spotify_id,
        releaseDate,
        releaseDatePrecision: row.release_date_precision,
        coverArtUrl: coverArtUrlLarge,
        coverArtUrlSmall,
        coverArtUrlMedium,
        coverArtUrlLarge,
        genres,
        albumType: row.album_type,
        totalTracks: row.total_tracks,
        spotifyUrl: `https://open.spotify.com/album/${row.spotify_id}`,
      })

      // Flush batch when full - use concurrent inserts
      if (batch.length >= BATCH_SIZE) {
        pendingBatches.push(batch)
        batch = []

        // When we have enough pending batches, flush them concurrently
        if (pendingBatches.length >= CONCURRENCY) {
          const results = await Promise.all(
            pendingBatches.map(b =>
              prisma.album.createMany({ data: b, skipDuplicates: true })
            )
          )
          for (const result of results) {
            imported += result.count
          }
          const totalInBatches = pendingBatches.reduce((sum, b) => sum + b.length, 0)
          skipped += totalInBatches - results.reduce((sum, r) => sum + r.count, 0)
          pendingBatches = []
        }
      }

      // Progress report
      if (processed % PROGRESS_INTERVAL === 0) {
        const elapsed = (Date.now() - startTime) / 1000
        const rate = processed / elapsed
        const remaining = (totalAlbums - processed) / rate
        const percent = ((processed / totalAlbums) * 100).toFixed(2)

        console.log(
          `[${percent}%] Processed: ${processed.toLocaleString()} | ` +
          `Imported: ${imported.toLocaleString()} | ` +
          `Skipped: ${skipped.toLocaleString()} | ` +
          `Rate: ${rate.toFixed(0)}/s | ` +
          `ETA: ${(remaining / 60).toFixed(1)} min`
        )
      }
    } catch (error) {
      errors++
      if (errors <= 10) {
        console.error(`Error processing ${row.spotify_id}:`, error)
      }
    }
  }

  // Flush remaining batches
  if (batch.length > 0) {
    pendingBatches.push(batch)
  }
  if (pendingBatches.length > 0) {
    const results = await Promise.all(
      pendingBatches.map(b =>
        prisma.album.createMany({ data: b, skipDuplicates: true })
      )
    )
    for (const result of results) {
      imported += result.count
    }
    const totalInBatches = pendingBatches.reduce((sum, b) => sum + b.length, 0)
    skipped += totalInBatches - results.reduce((sum, r) => sum + r.count, 0)
  }

  // Close SQLite
  sqlite.close()

  // Final stats
  const totalTime = (Date.now() - startTime) / 1000
  const finalCount = await prisma.album.count()

  console.log("\n" + "=".repeat(70))
  console.log("IMPORT COMPLETE")
  console.log("=".repeat(70))
  console.log(`Total processed: ${processed.toLocaleString()}`)
  console.log(`Imported: ${imported.toLocaleString()}`)
  console.log(`Skipped (duplicates): ${skipped.toLocaleString()}`)
  console.log(`Errors: ${errors.toLocaleString()}`)
  console.log(`Total time: ${(totalTime / 60).toFixed(1)} minutes`)
  console.log(`Average rate: ${(processed / totalTime).toFixed(0)} albums/sec`)
  console.log(`\nTotal albums in database: ${finalCount.toLocaleString()}`)
  console.log("=".repeat(70))

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error("Fatal error:", error)
  await prisma.$disconnect()
  process.exit(1)
})
