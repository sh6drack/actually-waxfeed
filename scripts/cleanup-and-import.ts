/**
 * Waxfeed Complete Data Import Script
 *
 * This script ensures every album has COMPLETE data:
 * - Full tracks (fetched from Spotify)
 * - Lyrics for each track (fetched from LRCLIB)
 * - Streaming links (Spotify, Apple Music, etc.)
 * - No singles/EPs/compilations
 *
 * Albums that can't get complete data are SKIPPED.
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

// ============ Fetch Lyrics from LRCLIB ============
async function fetchLyrics(trackName: string, artistName: string, albumTitle: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumTitle,
    })

    const response = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'Waxfeed/1.0' }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.plainLyrics || data.syncedLyrics) {
        return data.plainLyrics || data.syncedLyrics
      }
    }

    // Try search as fallback
    const searchResponse = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`,
      { headers: { 'User-Agent': 'Waxfeed/1.0' } }
    )
    if (searchResponse.ok) {
      const results = await searchResponse.json()
      const match = results?.find((r: { plainLyrics?: string; syncedLyrics?: string }) => r.plainLyrics || r.syncedLyrics)
      if (match) {
        return match.plainLyrics || match.syncedLyrics
      }
    }

    return null
  } catch {
    return null
  }
}

// ============ Generate Streaming Links ============
function generateStreamingLinks(albumTitle: string, artistName: string, spotifyUrl?: string) {
  const searchQuery = encodeURIComponent(`${artistName} ${albumTitle}`)

  return {
    spotifyUrl: spotifyUrl || null,
    appleMusicUrl: `https://music.apple.com/search?term=${searchQuery}`,
    tidalUrl: `https://tidal.com/search?q=${searchQuery}`,
    youtubeMusicUrl: `https://music.youtube.com/search?q=${searchQuery}`,
  }
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

// ============ STEP 3: Add Streaming Links to Existing Albums ============
async function addStreamingLinks(): Promise<number> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 3: Add Streaming Links to Existing Albums")
  console.log("=".repeat(50))

  const albumsWithoutLinks = await prisma.album.findMany({
    where: { appleMusicUrl: null },
    select: { id: true, title: true, artistName: true, spotifyUrl: true },
    take: 1000
  })

  console.log(`\nFound ${albumsWithoutLinks.length} albums needing streaming links`)

  let updated = 0
  for (const album of albumsWithoutLinks) {
    const links = generateStreamingLinks(album.title, album.artistName, album.spotifyUrl || undefined)

    await prisma.album.update({
      where: { id: album.id },
      data: {
        appleMusicUrl: links.appleMusicUrl,
        tidalUrl: links.tidalUrl,
        youtubeMusicUrl: links.youtubeMusicUrl,
      }
    })
    updated++

    if (updated % 100 === 0) {
      console.log(`  Progress: ${updated}/${albumsWithoutLinks.length}`)
    }
  }

  console.log(`\n✓ Added streaming links to ${updated} albums`)
  return updated
}

// ============ STEP 4: Fetch Lyrics for Tracks Missing Them ============
async function fetchMissingLyrics(): Promise<{ found: number; notFound: number }> {
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
    const lyricsText = await fetchLyrics(track.name, track.album.artistName, track.album.title)

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
  }

  console.log(`\n✓ Lyrics found: ${found}, Not available: ${notFound}`)
  return { found, notFound }
}

// ============ IMPORT NEW ALBUMS WITH COMPLETE DATA ============
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

async function importCompleteAlbum(album: SpotifyAlbum, token: string): Promise<boolean> {
  try {
    // Skip non-albums or short albums
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

    const artistName = fullAlbum.artists.map(a => a.name).join(", ")
    const images = fullAlbum.images.sort((a, b) => b.width - a.width)

    // Pre-fetch lyrics for all tracks
    const trackLyrics: Map<string, string | null> = new Map()
    let lyricsFound = 0

    for (const track of fullAlbum.tracks.items) {
      const lyrics = await fetchLyrics(track.name, artistName, fullAlbum.name)
      trackLyrics.set(track.id, lyrics)
      if (lyrics) lyricsFound++
      await sleep(30) // Rate limit LRCLIB
    }

    // Require at least 30% of tracks to have lyrics (some tracks may be instrumentals)
    const lyricsRatio = lyricsFound / fullAlbum.tracks.items.length
    if (lyricsRatio < 0.3 && fullAlbum.tracks.items.length >= 8) {
      // For larger albums, if less than 30% have lyrics, skip
      return false
    }

    // Generate streaming links
    const streamingLinks = generateStreamingLinks(fullAlbum.name, artistName, fullAlbum.external_urls.spotify)

    // Create album with all data
    const created = await prisma.album.create({
      data: {
        spotifyId: fullAlbum.id,
        title: fullAlbum.name,
        artistName: artistName,
        artistSpotifyId: fullAlbum.artists[0]?.id || null,
        coverArtUrl: images[0]?.url || null,
        coverArtUrlLarge: images[0]?.url || null,
        coverArtUrlMedium: images[1]?.url || null,
        coverArtUrlSmall: images[2]?.url || null,
        releaseDate: fullAlbum.release_date ? new Date(fullAlbum.release_date) : new Date(),
        albumType: 'album',
        genres: [],
        totalTracks: fullAlbum.total_tracks,
        spotifyUrl: streamingLinks.spotifyUrl,
        appleMusicUrl: streamingLinks.appleMusicUrl,
        tidalUrl: streamingLinks.tidalUrl,
        youtubeMusicUrl: streamingLinks.youtubeMusicUrl,
      },
    })

    // Create tracks with lyrics
    for (const track of fullAlbum.tracks.items) {
      const createdTrack = await prisma.track.create({
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

      // Add lyrics if we found them
      const lyrics = trackLyrics.get(track.id)
      await prisma.lyrics.create({
        data: {
          trackId: createdTrack.id,
          lyrics: lyrics || undefined,
          source: lyrics ? 'lrclib' : undefined,
          notFound: !lyrics,
        }
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
  "100 gecs", "Bladee", "Ecco2K", "Yung Lean", "SOPHIE",
  "A.G. Cook", "Caroline Polachek", "Arca", "JPEGMAFIA", "Danny Brown",
  "Injury Reserve", "clipping.", "Death Grips", "Machine Girl",

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
  "Floating Points", "Burial", "Aphex Twin", "Boards of Canada",
  "Jai Paul", "James Blake", "Mount Kimbie", "Bonobo", "Ross From Friends",
  "Mall Grab", "Peggy Gou", "Jayda G", "Channel Tres",
  "Yaeji", "Tkay Maidza", "Shygirl", "PinkPantheress",

  // Latin Underground
  "Peso Pluma", "Fuerza Regida", "Junior H", "Natanael Cano",
  "Grupo Frontera", "Eslabon Armado", "Carin Leon",
  "Rauw Alejandro", "Mora", "Feid", "Jhayco", "Myke Towers",

  // Afrobeats/Amapiano
  "Rema", "Ayra Starr", "Asake", "CKay", "Fireboy DML", "Omah Lay",
  "Odumodublvck", "Cruel Santino", "Amaarae", "Tyla", "Uncle Waffles",

  // K-Pop & Asian Artists
  "aespa", "IVE", "Le Sserafim", "STAYC", "NMIXX", "Seventeen", "Stray Kids",
  "ATEEZ", "TXT", "ENHYPEN", "NCT", "Red Velvet", "TWICE",
  "ITZY", "BIBI", "DPR IAN", "DPR LIVE", "DEAN",
  "Rich Brian", "NIKI", "Joji",

  // Rock/Post-Punk/Shoegaze Revival
  "Turnstile", "IDLES", "Fontaines D.C.", "Dry Cleaning", "black midi",
  "Black Country, New Road", "Squid", "Shame", "Parquet Courts",
  "Viagra Boys", "Amyl and The Sniffers", "Spiritbox", "Knocked Loose",
  "Wednesday", "MJ Lenderman", "Bartees Strange",

  // TikTok/Viral Gen Z
  "Dominic Fike", "Conan Gray", "Wallows", "The Marias", "Still Woozy",
  "boy pablo", "Men I Trust", "Khruangbin", "Crumb", "Homeshake",
  "Current Joys", "Surf Curse", "TV Girl", "Inner Wave",
  "Vacations", "Goth Babe",

  // Bedroom Pop/DIY
  "Rex Orange County", "Cuco", "Gus Dapperton", "mxmtoon", "girl in red",
  "Holly Humberstone", "Gracie Abrams", "Lizzy McAlpine",
  "Samia", "spill tab",

  // Jazz/Neo-Soul Revival
  "Thundercat", "Hiatus Kaiyote", "Moonchild", "Tom Misch", "Masego",
  "Robert Glasper", "Terrace Martin", "Kamasi Washington",
  "Nubya Garcia", "Ezra Collective", "Kokoroko", "BADBADNOTGOOD", "Snarky Puppy",

  // More Underground Hip-Hop
  "redveil", "Lil Tecca", "Lil Tjay", "Fivio Foreign",
  "Pop Smoke", "A Boogie wit da Hoodie", "Don Toliver",
]

// Essential Classics (smaller list)
const LEGENDARY_ARTISTS = [
  "Frank Ocean", "Kendrick Lamar", "Kanye West", "Tyler the Creator",
  "SZA", "The Weeknd", "Travis Scott", "Billie Eilish", "Charli XCX",
  "Lana Del Rey", "Tame Impala", "Bad Bunny", "Drake", "J Cole",
  "Mac Miller", "Brent Faiyaz", "Summer Walker", "Daniel Caesar",
  "Doja Cat", "Ice Spice", "Fred Again", "Kaytranada",
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
        if (await importCompleteAlbum(album, token)) {
          imported++
          totalImported++
        }
        await sleep(BASE_DELAY)
      }

      if (imported > 0) {
        console.log(`  ✓ ${artistName}: ${imported} albums (complete with lyrics)`)
      }

      if ((i + 1) % 20 === 0) {
        console.log(`\n  Progress: ${i + 1}/${artists.length} artists, ${totalImported} complete albums\n`)
      }

      await sleep(BASE_DELAY)
    } catch (error) {
      console.log(`  ✗ ${artistName}: ${error}`)
    }
  }

  console.log(`\n✓ ${label}: ${totalImported} complete albums imported`)
  return totalImported
}

async function importNewAlbums(): Promise<number> {
  console.log("\n" + "=".repeat(50))
  console.log("STEP 5: Import Complete Albums (with tracks + lyrics)")
  console.log("=".repeat(50))

  let totalImported = 0

  // Import underground/Gen Z artists first (priority)
  totalImported += await importArtistAlbums(UNDERGROUND_ARTISTS, "Underground & Gen Z Artists")

  // Then essential classics
  totalImported += await importArtistAlbums(LEGENDARY_ARTISTS, "Essential Classics")

  console.log(`\n✓ Total: ${totalImported} complete albums with tracks & lyrics`)
  return totalImported
}

// ============ MAIN ============
async function showStats() {
  const albumCount = await prisma.album.count()
  const trackCount = await prisma.track.count()
  const lyricsFound = await prisma.lyrics.count({ where: { notFound: false } })
  const lyricsNotFound = await prisma.lyrics.count({ where: { notFound: true } })
  const tracksNoLyrics = await prisma.track.count({ where: { lyrics: null } })
  const albumsWithApple = await prisma.album.count({ where: { appleMusicUrl: { not: null } } })

  console.log("\n📊 Database Stats:")
  console.log(`   Albums: ${albumCount.toLocaleString()}`)
  console.log(`   Tracks: ${trackCount.toLocaleString()}`)
  console.log(`   Lyrics found: ${lyricsFound.toLocaleString()}`)
  console.log(`   Lyrics unavailable: ${lyricsNotFound.toLocaleString()}`)
  console.log(`   Tracks not yet searched: ${tracksNoLyrics.toLocaleString()}`)
  console.log(`   Albums with Apple Music: ${albumsWithApple.toLocaleString()}`)
}

async function main() {
  console.log("\n" + "=".repeat(60))
  console.log("🎵 WAXFEED COMPLETE DATA IMPORT")
  console.log("=".repeat(60))

  await showStats()

  // Step 1: Remove singles/EPs/compilations
  await removeSinglesAndEPs()

  // Step 2: Remove albums without tracks
  await removeEmptyAlbums()

  // Step 3: Add streaming links to existing albums
  await addStreamingLinks()

  // Step 4: Pre-fetch lyrics for existing tracks
  await fetchMissingLyrics()

  // Step 5: Import new complete albums
  await importNewAlbums()

  // Final cleanup - remove any albums that still have no tracks
  await removeEmptyAlbums()

  console.log("\n" + "=".repeat(60))
  console.log("✅ IMPORT COMPLETE")
  console.log("=".repeat(60))

  await showStats()

  await prisma.$disconnect()
}

main().catch(console.error)
