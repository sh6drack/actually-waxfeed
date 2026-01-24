/**
 * Spotify Metadata Import Script
 *
 * Imports albums from Anna's Archive Spotify metadata SQLite database
 * into the waxfeed PostgreSQL database.
 *
 * Source: '/Volumes/360 4TB/spotifymetadata/spotify_clean.sqlite3'
 * ~59M albums, ~15M artists, ~256M tracks
 *
 * Usage:
 *   npx tsx scripts/import-spotify-metadata.ts [--batch-size=10000] [--offset=0] [--limit=1000000]
 */

import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'

const SQLITE_PATH = '/Volumes/360 4TB/spotifymetadata/spotify_clean.sqlite3'
const DEFAULT_BATCH_SIZE = 5000
const DEFAULT_LIMIT = 0 // 0 = unlimited

interface SpotifyAlbum {
  spotify_id: string
  name: string
  album_type: string
  release_date: string
  release_date_precision: string
  popularity: number
  label: string
  total_tracks: number
  artist_name: string
  artist_id: string
  image_640: string | null
  image_300: string | null
  image_64: string | null
  genres: string | null
}

function parseArgs(): { batchSize: number; offset: number; limit: number; minPopularity: number } {
  const args = process.argv.slice(2)
  let batchSize = DEFAULT_BATCH_SIZE
  let offset = 0
  let limit = DEFAULT_LIMIT
  let minPopularity = 0

  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--offset=')) {
      offset = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--min-popularity=')) {
      minPopularity = parseInt(arg.split('=')[1], 10)
    }
  }

  return { batchSize, offset, limit, minPopularity }
}

function parseDateWithPrecision(dateStr: string, precision: string): { date: Date; precision: string } {
  // Handle different date formats
  // year: "2024"
  // month: "2024-06"
  // day: "2024-06-15"

  let date: Date

  if (precision === 'year' || dateStr.length === 4) {
    date = new Date(`${dateStr}-01-01`)
    precision = 'year'
  } else if (precision === 'month' || dateStr.length === 7) {
    date = new Date(`${dateStr}-01`)
    precision = 'month'
  } else {
    date = new Date(dateStr)
    precision = 'day'
  }

  // Validate date
  if (isNaN(date.getTime())) {
    date = new Date('1970-01-01')
    precision = 'year'
  }

  return { date, precision }
}

async function main() {
  const { batchSize, offset, limit, minPopularity } = parseArgs()

  console.log('='.repeat(60))
  console.log('Spotify Metadata Import Script')
  console.log('='.repeat(60))
  console.log(`SQLite Path: ${SQLITE_PATH}`)
  console.log(`Batch Size: ${batchSize}`)
  console.log(`Offset: ${offset}`)
  console.log(`Limit: ${limit === 0 ? 'unlimited' : limit}`)
  console.log(`Min Popularity: ${minPopularity}`)
  console.log('='.repeat(60))

  // Connect to SQLite
  console.log('\nOpening SQLite database...')
  const sqlite = new Database(SQLITE_PATH, { readonly: true })

  // Connect to PostgreSQL via Prisma
  console.log('Connecting to PostgreSQL...')
  const prisma = new PrismaClient()

  try {
    // Get total count (simple query without joins - faster)
    const countResult = sqlite.prepare(`
      SELECT COUNT(*) as count FROM albums WHERE popularity >= ?
    `).get(minPopularity) as { count: number }

    const totalAlbums = countResult.count
    console.log(`\nTotal albums to process (approx): ${totalAlbums.toLocaleString()}`)

    // Prepare the query - get albums with their primary artist and images
    const stmt = sqlite.prepare(`
      SELECT
        a.id as spotify_id,
        a.name,
        a.album_type,
        a.release_date,
        a.release_date_precision,
        a.popularity,
        a.label,
        a.total_tracks,
        ar.name as artist_name,
        ar.id as artist_id,
        MAX(CASE WHEN ai.width = 640 THEN ai.url END) as image_640,
        MAX(CASE WHEN ai.width = 300 THEN ai.url END) as image_300,
        MAX(CASE WHEN ai.width = 64 THEN ai.url END) as image_64,
        GROUP_CONCAT(DISTINCT ag.genre) as genres
      FROM albums a
      JOIN artist_albums aa ON a.rowid = aa.album_rowid AND aa.is_appears_on = 0
      JOIN artists ar ON aa.artist_rowid = ar.rowid
      LEFT JOIN album_images ai ON a.rowid = ai.album_rowid
      LEFT JOIN artist_genres ag ON ar.rowid = ag.artist_rowid
      WHERE a.popularity >= ?
      GROUP BY a.rowid
      ORDER BY a.popularity DESC, a.rowid
      LIMIT ? OFFSET ?
    `)

    let processed = 0
    let inserted = 0
    let skipped = 0
    let errors = 0
    let currentOffset = offset

    const effectiveLimit = limit === 0 ? totalAlbums : Math.min(limit, totalAlbums - offset)
    const totalBatches = Math.ceil(effectiveLimit / batchSize)

    console.log(`Processing ${effectiveLimit.toLocaleString()} albums in ${totalBatches} batches...\n`)

    while (processed < effectiveLimit) {
      const batchLimit = Math.min(batchSize, effectiveLimit - processed)
      const albums = stmt.all(minPopularity, batchLimit, currentOffset) as SpotifyAlbum[]

      if (albums.length === 0) break

      const batchNumber = Math.floor(processed / batchSize) + 1
      console.log(`\nBatch ${batchNumber}/${totalBatches} - Processing ${albums.length} albums...`)

      // Transform albums for Prisma
      const albumsToInsert = albums.map(album => {
        const { date, precision } = parseDateWithPrecision(album.release_date, album.release_date_precision)
        const genres = album.genres ? album.genres.split(',').filter(Boolean) : []

        return {
          spotifyId: album.spotify_id,
          title: album.name.slice(0, 500), // Truncate if too long
          artistName: album.artist_name.slice(0, 500),
          artistSpotifyId: album.artist_id,
          releaseDate: date,
          releaseDatePrecision: precision,
          coverArtUrl: album.image_640 || album.image_300 || album.image_64,
          coverArtUrlSmall: album.image_64,
          coverArtUrlMedium: album.image_300,
          coverArtUrlLarge: album.image_640,
          genres: genres,
          albumType: album.album_type,
          totalTracks: album.total_tracks,
          spotifyUrl: `https://open.spotify.com/album/${album.spotify_id}`,
        }
      })

      // Use createMany with skipDuplicates to handle existing albums
      try {
        const result = await prisma.album.createMany({
          data: albumsToInsert,
          skipDuplicates: true,
        })
        inserted += result.count
        skipped += albums.length - result.count
      } catch (error) {
        console.error(`Error in batch ${batchNumber}:`, error)
        errors += albums.length
      }

      processed += albums.length
      currentOffset += albums.length

      // Progress update
      const progress = ((processed / effectiveLimit) * 100).toFixed(2)
      console.log(`Progress: ${progress}% | Inserted: ${inserted.toLocaleString()} | Skipped: ${skipped.toLocaleString()} | Errors: ${errors}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('Import Complete!')
    console.log('='.repeat(60))
    console.log(`Total Processed: ${processed.toLocaleString()}`)
    console.log(`Total Inserted: ${inserted.toLocaleString()}`)
    console.log(`Total Skipped (duplicates): ${skipped.toLocaleString()}`)
    console.log(`Total Errors: ${errors}`)
    console.log('='.repeat(60))

  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main().catch(console.error)
