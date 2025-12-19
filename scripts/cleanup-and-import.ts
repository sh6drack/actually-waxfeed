/**
 * Waxfeed Data Cleanup & Complete Import Script
 *
 * This script ensures every album has:
 * - Full tracks (fetched from Spotify)
 * - Lyrics (fetched from LRCLIB)
 * - No singles/EPs/compilations
 *
 * Run with: npx tsx scripts/cleanup-and-import.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

const BASE_DELAY = 100
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 5000

let spotifyToken: string | null = null
let tokenExpiresAt = 0

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function getSpotifyToken(): Promise<string> {
  if (spotifyToken && Date.now() < tokenExpiresAt - 60000) {
    return spotifyToken
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await response.json()
  spotifyToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000
  return spotifyToken!
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options)
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      const waitTime = retryAfter ? Math.min(parseInt(retryAfter) * 1000, 120000) : INITIAL_BACKOFF * Math.pow(2, attempt)
      console.log(`⚠️  Rate limited. Waiting ${waitTime/1000}s...`)
      await sleep(waitTime)
      continue
    }
    if (!response.ok && attempt < retries) {
      await sleep(INITIAL_BACKOFF * Math.pow(2, attempt))
      continue
    }
    return response
  }
  throw new Error(`Failed after ${retries} retries`)
}

// ============ STEP 1: Remove Singles, EPs, Compilations ============
async function removeSinglesAndEPs(): Promise<number> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 1: Remove Singles, EPs, and Compilations")
  console.log("=".repeat(50))

  const counts = await prisma.album.groupBy({
    by: ['albumType'],
    _count: true
  })

  console.log("\nCurrent album types:")
  counts.forEach(c => console.log(`  ${c.albumType}: ${c._count}`))

  const deleted = await prisma.album.deleteMany({
    where: {
      OR: [
        { albumType: 'single' },
        { albumType: 'ep' },
        { albumType: 'compilation' }
      ]
    }
  })

  console.log(`\n✓ Deleted ${deleted.count} singles/EPs/compilations`)
  return deleted.count
}

// ============ STEP 2: Remove Albums Without Tracks ============
async function removeEmptyAlbums(): Promise<number> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 2: Remove Albums Without Tracks")
  console.log("=".repeat(50))

  const emptyAlbums = await prisma.album.count({
    where: { tracks: { none: {} } }
  })

  console.log(`\nFound ${emptyAlbums} albums without tracks`)

  if (emptyAlbums > 0) {
    const deleted = await prisma.album.deleteMany({
      where: { tracks: { none: {} } }
    })
    console.log(`✓ Deleted ${deleted.count} empty albums`)
    return deleted.count
  }

  return 0
}

// ============ STEP 3: Fetch Tracks for Albums Missing Them ============
async function fetchMissingTracks(): Promise<{ fetched: number; failed: number }> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 3: Fetch Missing Tracks from Spotify")
  console.log("=".repeat(50))

  const albumsNeedingTracks = await prisma.album.findMany({
    where: {
      spotifyId: { not: "" },
      tracks: { none: {} }
    },
    select: { id: true, spotifyId: true, title: true, artistName: true },
    take: 200 // Process in batches
  })

  console.log(`\nFound ${albumsNeedingTracks.length} albums needing tracks`)

  let fetched = 0
  let failed = 0
  const token = await getSpotifyToken()

  for (const album of albumsNeedingTracks) {
    if (!album.spotifyId) continue

    try {
      const response = await fetchWithRetry(
        `https://api.spotify.com/v1/albums/${album.spotifyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()

      if (data.tracks?.items?.length > 0) {
        for (const track of data.tracks.items) {
          await prisma.track.upsert({
            where: { spotifyId: track.id },
            update: {
              name: track.name,
              trackNumber: track.track_number,
              discNumber: track.disc_number,
              durationMs: track.duration_ms,
              spotifyUrl: track.external_urls?.spotify,
            },
            create: {
              spotifyId: track.id,
              albumId: album.id,
              name: track.name,
              trackNumber: track.track_number,
              discNumber: track.disc_number,
              durationMs: track.duration_ms,
              spotifyUrl: track.external_urls?.spotify,
            },
          })
        }
        fetched++
        console.log(`  ✓ ${album.title} - ${data.tracks.items.length} tracks`)
      } else {
        failed++
      }
      await sleep(BASE_DELAY)
    } catch (error) {
      failed++
      console.log(`  ✗ ${album.title}: ${error}`)
    }
  }

  console.log(`\n✓ Fetched tracks for ${fetched} albums, ${failed} failed`)
  return { fetched, failed }
}

// ============ STEP 4: Pre-fetch Lyrics ============
async function prefetchLyrics(): Promise<{ found: number; notFound: number }> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 4: Pre-fetch Lyrics from LRCLIB")
  console.log("=".repeat(50))

  const tracksWithoutLyrics = await prisma.track.findMany({
    where: { lyrics: null },
    include: {
      album: { select: { artistName: true, title: true } }
    },
    take: 500
  })

  console.log(`\nFound ${tracksWithoutLyrics.length} tracks without lyrics (processing batch)`)

  let found = 0
  let notFound = 0

  for (const track of tracksWithoutLyrics) {
    try {
      const params = new URLSearchParams({
        track_name: track.name,
        artist_name: track.album.artistName,
        album_name: track.album.title,
      })

      const response = await fetch(`https://lrclib.net/api/get?${params}`, {
        headers: { 'User-Agent': 'Waxfeed/1.0' }
      })

      let lyricsText: string | null = null

      if (response.ok) {
        const data = await response.json()
        lyricsText = data.plainLyrics || data.syncedLyrics || null
      }

      if (!lyricsText) {
        // Try search
        const searchResponse = await fetch(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(track.name)}&artist_name=${encodeURIComponent(track.album.artistName)}`,
          { headers: { 'User-Agent': 'Waxfeed/1.0' } }
        )
        if (searchResponse.ok) {
          const results = await searchResponse.json()
          const match = results?.find((r: { plainLyrics?: string; syncedLyrics?: string }) => r.plainLyrics || r.syncedLyrics)
          if (match) {
            lyricsText = match.plainLyrics || match.syncedLyrics
          }
        }
      }

      if (lyricsText) {
        await prisma.lyrics.create({
          data: {
            trackId: track.id,
            lyrics: lyricsText,
            source: 'lrclib',
            notFound: false,
          }
        })
        found++
      } else {
        await prisma.lyrics.create({
          data: {
            trackId: track.id,
            notFound: true,
          }
        })
        notFound++
      }

      if ((found + notFound) % 50 === 0) {
        console.log(`  Progress: ${found + notFound}/${tracksWithoutLyrics.length} (${found} found)`)
      }

      await sleep(30) // Rate limiting
    } catch {
      // Skip errors
    }
  }

  console.log(`\n✓ Lyrics found: ${found}, Not available: ${notFound}`)
  return { found, notFound }
}

// ============ IMPORT NEW ALBUMS ============
interface SpotifyAlbum {
  id: string
  name: string
  artists: { name: string; id: string }[]
  images: { url: string; width: number }[]
  release_date: string
  album_type: string
  total_tracks: number
  external_urls: { spotify: string }
  tracks?: { items: SpotifyTrack[] }
}

interface SpotifyTrack {
  id: string
  name: string
  track_number: number
  disc_number: number
  duration_ms: number
  external_urls: { spotify: string }
}

async function importFullAlbum(album: SpotifyAlbum, token: string): Promise<boolean> {
  try {
    // Skip non-albums
    if (album.album_type !== 'album') return false
    if (album.total_tracks < 4) return false

    // Check if exists
    const existing = await prisma.album.findUnique({ where: { spotifyId: album.id } })
    if (existing) return false

    // Fetch full album data with tracks
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/albums/${album.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const fullAlbum: SpotifyAlbum = await response.json()

    if (!fullAlbum.tracks?.items?.length) return false

    const images = fullAlbum.images.sort((a, b) => b.width - a.width)

    // Create album
    const created = await prisma.album.create({
      data: {
        spotifyId: fullAlbum.id,
        title: fullAlbum.name,
        artistName: fullAlbum.artists.map(a => a.name).join(", "),
        artistSpotifyId: fullAlbum.artists[0]?.id || null,
        coverArtUrl: images[0]?.url || null,
        coverArtUrlLarge: images[0]?.url || null,
        coverArtUrlMedium: images[1]?.url || null,
        coverArtUrlSmall: images[2]?.url || null,
        releaseDate: fullAlbum.release_date ? new Date(fullAlbum.release_date) : new Date(),
        albumType: 'album',
        genres: [],
        totalTracks: fullAlbum.total_tracks,
        spotifyUrl: fullAlbum.external_urls.spotify,
      },
    })

    // Create tracks
    for (const track of fullAlbum.tracks.items) {
      await prisma.track.create({
        data: {
          spotifyId: track.id,
          albumId: created.id,
          name: track.name,
          trackNumber: track.track_number,
          discNumber: track.disc_number,
          durationMs: track.duration_ms,
          spotifyUrl: track.external_urls.spotify,
        },
      })
    }

    return true
  } catch {
    return false
  }
}

// Gen Z Underground & Zeitgeist Artists
const UNDERGROUND_ARTISTS = [
  // Hyperpop & Experimental
  "100 gecs", "Bladee", "Ecco2K", "Yung Lean", "Drain Gang", "SOPHIE",
  "A.G. Cook", "Caroline Polachek", "Arca", "JPEGMAFIA", "Danny Brown",
  "Injury Reserve", "clipping.", "Death Grips", "Machine Girl", "Black Dresses",

  // Underground Rap & SoundCloud Era
  "Yeat", "Ken Carson", "Destroy Lonely", "Lancey Foux", "Lucki", "Cochise",
  "$NOT", "Trippie Redd", "Ski Mask the Slump God", "Denzel Curry", "Rico Nasty",
  "slowthai", "Little Simz", "Dave", "Central Cee", "Knucks", "Loyle Carner",
  "Saba", "Smino", "Noname", "Mick Jenkins", "Joey Bada$$", "Westside Gunn",
  "Conway the Machine", "Benny the Butcher", "Boldy James", "Larry June",
  "Vince Staples", "Earl Sweatshirt", "MIKE", "Navy Blue", "Pink Siifu",
  "Armand Hammer", "billy woods", "Quelle Chris", "Roc Marciano", "Ka",

  // Indie/Alt R&B Underground
  "Steve Lacy", "Omar Apollo", "Ravyn Lenae", "Jean Dawson", "Dijon",
  "Emotional Oranges", "Kali Uchis", "Snoh Aalegra", "Jorja Smith", "Mahalia",
  "Joy Crookes", "Arlo Parks", "Beabadoobee", "Clairo", "Remi Wolf",
  "Faye Webster", "Soccer Mommy", "Snail Mail", "Alex G", "Adrianne Lenker",
  "Big Thief", "Mitski", "Weyes Blood", "Angel Olsen", "Aldous Harding",

  // Electronic/Club/DJ
  "Floating Points", "Burial", "Aphex Twin", "Boards of Canada", "Autechre",
  "Jai Paul", "James Blake", "Mount Kimbie", "Bonobo", "Ross From Friends",
  "Mall Grab", "DJ Seinfeld", "Peggy Gou", "Jayda G", "Channel Tres",
  "Yaeji", "Tkay Maidza", "Shygirl", "PinkPantheress", "ENNY",

  // Latin Underground
  "Peso Pluma", "Fuerza Regida", "Junior H", "Natanael Cano", "Yahritza y Su Esencia",
  "Grupo Frontera", "Eslabon Armado", "Carin Leon", "Xavi", "DannyLux",
  "Rauw Alejandro", "Mora", "Feid", "Jhayco", "Myke Towers", "Eladio Carrion",

  // Afrobeats/Amapiano
  "Rema", "Ayra Starr", "Asake", "CKay", "Fireboy DML", "Omah Lay",
  "Odumodublvck", "Cruel Santino", "Amaarae", "Tyla", "Uncle Waffles",

  // K-Pop & Asian Artists
  "aespa", "IVE", "Le Sserafim", "STAYC", "NMIXX", "Seventeen", "Stray Kids",
  "ATEEZ", "TXT", "ENHYPEN", "NCT", "EXO", "SHINee", "Red Velvet", "TWICE",
  "ITZY", "BIBI", "eaJ", "DPR IAN", "DPR LIVE", "DEAN", "Crush", "Zico",
  "88rising", "Rich Brian", "NIKI", "Joji", "beabadoobee",

  // Rock/Post-Punk/Shoegaze Revival
  "Turnstile", "IDLES", "Fontaines D.C.", "Dry Cleaning", "black midi",
  "Black Country, New Road", "Squid", "Shame", "Parquet Courts", "Protomartyr",
  "Viagra Boys", "Amyl and The Sniffers", "Spiritbox", "Knocked Loose",
  "Show Me the Body", "Drain", "Scowl", "Militarie Gun", "Fiddlehead",
  "Wednesday", "MJ Lenderman", "Bartees Strange", "Horsegirl",

  // TikTok/Viral Gen Z
  "Dominic Fike", "Conan Gray", "Wallows", "The Marias", "Still Woozy",
  "boy pablo", "Men I Trust", "Khruangbin", "Crumb", "Homeshake",
  "Current Joys", "Surf Curse", "TV Girl", "The Marías", "Inner Wave",
  "Vacations", "Goth Babe", "Jakob Ogawa", "No Rome", "BENEE",

  // Bedroom Pop/DIY
  "Rex Orange County", "Cuco", "Gus Dapperton", "mxmtoon", "girl in red",
  "Conan Gray", "Holly Humberstone", "Gracie Abrams", "Lizzy McAlpine",
  "Samia", "spill tab", "Paris Texas", "Momma", "Geese",

  // Jazz/Neo-Soul Revival
  "Thundercat", "Hiatus Kaiyote", "Moonchild", "Tom Misch", "Masego",
  "Robert Glasper", "Terrace Martin", "Kamasi Washington", "Shabaka Hutchings",
  "Nubya Garcia", "Ezra Collective", "Kokoroko", "BADBADNOTGOOD", "Snarky Puppy",

  // More Underground Hip-Hop
  "Danny Brown", "Zelooperz", "Bruiser Wolf", "Paris Texas", "redveil",
  "Lil Tecca", "Lil Tjay", "Fivio Foreign", "Sleepy Hallow", "Sheff G",
  "Pop Smoke", "A Boogie wit da Hoodie", "Don Toliver", "Kali", "Anycia",
]

// Legacy Artists (keeping some classics)
const LEGENDARY_ARTISTS = [
  "The Beatles", "Pink Floyd", "Radiohead", "Frank Ocean", "Kendrick Lamar",
  "Kanye West", "Tyler the Creator", "SZA", "The Weeknd", "Travis Scott",
  "Billie Eilish", "Charli XCX", "Lana Del Rey", "Tame Impala", "Bad Bunny",
]

async function importArtistAlbums(artists: string[], label: string): Promise<number> {
  console.log(`\n📀 Importing ${label} (${artists.length} artists)`)
  console.log("-".repeat(40))

  let totalImported = 0
  const token = await getSpotifyToken()

  for (let i = 0; i < artists.length; i++) {
    const artistName = artists[i]

    try {
      // Search for artist
      const searchResponse = await fetchWithRetry(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const searchData = await searchResponse.json()
      const artist = searchData.artists?.items?.[0]
      if (!artist) continue

      // Get artist's albums
      const albumsResponse = await fetchWithRetry(
        `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const albumsData = await albumsResponse.json()
      const albums: SpotifyAlbum[] = albumsData.items || []

      let imported = 0
      for (const album of albums) {
        if (await importFullAlbum(album, token)) {
          imported++
          totalImported++
        }
        await sleep(BASE_DELAY)
      }

      if (imported > 0) {
        console.log(`  ✓ ${artistName}: ${imported} albums`)
      }

      if ((i + 1) % 20 === 0) {
        console.log(`\n  Progress: ${i + 1}/${artists.length} artists, ${totalImported} new albums\n`)
      }

      await sleep(BASE_DELAY)
    } catch (error) {
      console.log(`  ✗ ${artistName}: ${error}`)
    }
  }

  console.log(`\n✓ ${label}: ${totalImported} albums imported`)
  return totalImported
}

async function importNewAlbums(): Promise<number> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 5: Import New Albums (with tracks)")
  console.log("=".repeat(50))

  let totalImported = 0

  // Import underground/Gen Z artists first (priority)
  totalImported += await importArtistAlbums(UNDERGROUND_ARTISTS, "Underground & Gen Z Artists")

  // Then legacy essentials
  totalImported += await importArtistAlbums(LEGENDARY_ARTISTS, "Essential Classics")

  console.log(`\n✓ Total: ${totalImported} new albums with tracks`)
  return totalImported
}

// ============ MAIN ============
async function showStats() {
  const albumCount = await prisma.album.count()
  const trackCount = await prisma.track.count()
  const lyricsFound = await prisma.lyrics.count({ where: { notFound: false } })
  const lyricsNotFound = await prisma.lyrics.count({ where: { notFound: true } })
  const tracksNoLyrics = await prisma.track.count({ where: { lyrics: null } })

  console.log("\n📊 Database Stats:")
  console.log(`   Albums: ${albumCount.toLocaleString()}`)
  console.log(`   Tracks: ${trackCount.toLocaleString()}`)
  console.log(`   Lyrics found: ${lyricsFound.toLocaleString()}`)
  console.log(`   Lyrics unavailable: ${lyricsNotFound.toLocaleString()}`)
  console.log(`   Tracks not yet searched: ${tracksNoLyrics.toLocaleString()}`)
}

async function main() {
  console.log("\n" + "=".repeat(60))
  console.log("🎵 WAXFEED COMPLETE DATA CLEANUP & IMPORT")
  console.log("=".repeat(60))

  await showStats()

  // Step 1: Remove singles/EPs/compilations
  await removeSinglesAndEPs()

  // Step 2: Remove albums without tracks
  await removeEmptyAlbums()

  // Step 3: Fetch tracks for remaining albums that need them
  await fetchMissingTracks()

  // Step 4: Pre-fetch lyrics
  await prefetchLyrics()

  // Step 5: Import new complete albums
  await importNewAlbums()

  // Final cleanup - remove any albums that still have no tracks
  await removeEmptyAlbums()

  console.log("\n" + "=".repeat(60))
  console.log("✅ CLEANUP COMPLETE")
  console.log("=".repeat(60))

  await showStats()

  await prisma.$disconnect()
}

main().catch(console.error)
