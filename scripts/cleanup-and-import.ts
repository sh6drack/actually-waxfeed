import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

const BASE_DELAY = 300
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 5000

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
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

async function getSpotifyToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await response.json()
  return data.access_token
}

interface SpotifyAlbum {
  id: string
  name: string
  artists: { name: string; id: string }[]
  images: { url: string; width: number }[]
  release_date: string
  album_type: string
  total_tracks: number
  external_urls: { spotify: string }
}

// Reset stale review counts
async function resetReviewCounts(): Promise<number> {
  console.log("\n🔄 Resetting stale review counts...")

  const reviewCounts = await prisma.review.groupBy({
    by: ['albumId'],
    _count: { id: true },
    _avg: { rating: true },
  })

  const countMap = new Map<string, { count: number; avg: number | null }>()
  for (const r of reviewCounts) {
    countMap.set(r.albumId, { count: r._count.id, avg: r._avg.rating })
  }

  const albums = await prisma.album.findMany({ select: { id: true, totalReviews: true, averageRating: true } })

  let fixed = 0
  for (const album of albums) {
    const actual = countMap.get(album.id) || { count: 0, avg: null }
    if (album.totalReviews !== actual.count || album.averageRating !== actual.avg) {
      await prisma.album.update({
        where: { id: album.id },
        data: { totalReviews: actual.count, averageRating: actual.avg },
      })
      fixed++
    }
  }
  return fixed
}

// Delete duplicates
async function deleteDuplicates(): Promise<number> {
  console.log("\n🔍 Finding duplicate albums...")

  const albums = await prisma.album.findMany({
    select: { id: true, title: true, artistName: true, createdAt: true, totalReviews: true },
    orderBy: { createdAt: 'asc' }
  })

  const groups = new Map<string, typeof albums>()
  for (const album of albums) {
    const key = `${album.title.toLowerCase().trim()}|||${album.artistName.toLowerCase().trim()}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(album)
  }

  const duplicateGroups = Array.from(groups.entries()).filter(([_, a]) => a.length > 1)
  console.log(`Found ${duplicateGroups.length} groups of duplicates`)

  let deleted = 0
  for (const [_, dupes] of duplicateGroups) {
    const sorted = dupes.sort((a, b) => {
      if (a.totalReviews !== b.totalReviews) return b.totalReviews - a.totalReviews
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
    for (const album of sorted.slice(1)) {
      try {
        await prisma.album.delete({ where: { id: album.id } })
        deleted++
      } catch { /* has relations */ }
    }
  }
  return deleted
}

// Import helpers
async function searchArtist(token: string, name: string): Promise<{ id: string } | null> {
  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.artists?.items?.[0] || null
  } catch { return null }
}

async function getArtistAlbums(token: string, artistId: string): Promise<SpotifyAlbum[]> {
  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.items || []
  } catch { return [] }
}

async function searchAlbums(token: string, query: string): Promise<SpotifyAlbum[]> {
  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.albums?.items || []
  } catch { return [] }
}

async function importAlbum(album: SpotifyAlbum): Promise<boolean> {
  try {
    if (album.album_type === "single" && album.total_tracks < 4) return false
    if (album.album_type === "compilation") return false
    const existing = await prisma.album.findUnique({ where: { spotifyId: album.id } })
    if (existing) return false
    const images = album.images.sort((a, b) => b.width - a.width)
    await prisma.album.create({
      data: {
        spotifyId: album.id,
        title: album.name,
        artistName: album.artists.map(a => a.name).join(", "),
        artistSpotifyId: album.artists[0]?.id || null,
        coverArtUrl: images[0]?.url || null,
        coverArtUrlLarge: images[0]?.url || null,
        coverArtUrlMedium: images[1]?.url || null,
        coverArtUrlSmall: images[2]?.url || null,
        releaseDate: album.release_date ? new Date(album.release_date) : new Date(),
        genres: [],
        totalTracks: album.total_tracks,
        spotifyUrl: album.external_urls.spotify,
      },
    })
    return true
  } catch { return false }
}

const LEGENDARY_ARTISTS = [
  "The Beatles", "Led Zeppelin", "Pink Floyd", "The Rolling Stones", "Queen",
  "David Bowie", "Fleetwood Mac", "Stevie Wonder", "Marvin Gaye", "Prince",
  "Michael Jackson", "Whitney Houston", "Aretha Franklin", "James Brown",
  "Nirvana", "Radiohead", "Wu-Tang Clan", "Nas", "The Notorious B.I.G.", "2Pac",
  "OutKast", "Lauryn Hill", "D'Angelo", "Erykah Badu", "TLC", "Aaliyah",
  "Daft Punk", "Bjork", "Portishead", "Massive Attack",
  "Kanye West", "Eminem", "Jay-Z", "Beyonce", "Usher", "Alicia Keys",
  "Amy Winehouse", "Adele", "Coldplay", "Arctic Monkeys", "The Strokes",
  "Kendrick Lamar", "J Cole", "Drake", "Travis Scott", "Frank Ocean", "The Weeknd",
  "SZA", "Tyler the Creator", "Mac Miller", "Post Malone",
  "Taylor Swift", "Ariana Grande", "Billie Eilish", "Dua Lipa", "Harry Styles",
  "Bad Bunny", "Rosalia", "WizKid", "Burna Boy", "Tems",
  "Bob Marley", "Miles Davis", "John Coltrane", "Johnny Cash", "Dolly Parton",
  "Bob Dylan", "Joni Mitchell", "Neil Young", "U2", "Depeche Mode", "The Cure",
  "Brent Faiyaz", "Summer Walker", "Giveon", "Daniel Caesar", "H.E.R.", "Kehlani",
  "21 Savage", "Future", "Young Thug", "Lil Baby", "Gunna", "Lil Uzi Vert",
  "Playboi Carti", "A$AP Rocky", "Baby Keem", "JID", "Nicki Minaj", "Cardi B",
  "Megan Thee Stallion", "Doja Cat", "Ice Spice", "Disclosure", "Fred Again",
  "Kaytranada", "Jamie xx", "Four Tet", "BTS", "BLACKPINK", "NewJeans",
  "Tame Impala", "Phoebe Bridgers", "Japanese Breakfast", "Charli XCX", "Lana Del Rey",
]

const ALBUM_SEARCHES = [
  "greatest albums of all time", "best albums 2024", "best albums 2023",
  "classic hip hop", "classic r&b", "neo soul essential", "afrobeats essential",
  "grammy album of the year", "critically acclaimed albums",
]

async function main() {
  console.log("=" .repeat(60))
  console.log("🧹 CLEANUP & IMPORT")
  console.log("=" .repeat(60))

  const startCount = await prisma.album.count()
  console.log(`\n📊 Starting with ${startCount.toLocaleString()} albums`)

  const fixed = await resetReviewCounts()
  console.log(`✅ Fixed ${fixed} albums with stale counts`)

  const deleted = await deleteDuplicates()
  console.log(`✅ Deleted ${deleted} duplicates`)

  let token = await getSpotifyToken()
  let totalImported = 0

  console.log("\n📀 Importing albums...")
  for (let i = 0; i < LEGENDARY_ARTISTS.length; i++) {
    const artistName = LEGENDARY_ARTISTS[i]
    if (i > 0 && i % 100 === 0) token = await getSpotifyToken()
    const artist = await searchArtist(token, artistName)
    if (!artist) continue
    const albums = await getArtistAlbums(token, artist.id)
    let imported = 0
    for (const album of albums) {
      if (await importAlbum(album)) { imported++; totalImported++ }
    }
    if (imported > 0) console.log(`  ✓ ${artistName}: ${imported}`)
    await sleep(BASE_DELAY)
    if ((i + 1) % 30 === 0) console.log(`\n📊 ${i + 1}/${LEGENDARY_ARTISTS.length} artists, ${totalImported} new\n`)
  }

  console.log("\n🔍 Search-based discovery...")
  for (const query of ALBUM_SEARCHES) {
    const albums = await searchAlbums(token, query)
    let imported = 0
    for (const album of albums) {
      if (await importAlbum(album)) { imported++; totalImported++ }
    }
    if (imported > 0) console.log(`  ✓ "${query}": ${imported}`)
    await sleep(BASE_DELAY)
  }

  const finalCount = await prisma.album.count()
  console.log("\n" + "=" .repeat(60))
  console.log("✅ COMPLETE!")
  console.log(`   Fixed: ${fixed} | Deleted: ${deleted} | Imported: ${totalImported}`)
  console.log(`   Total albums: ${finalCount.toLocaleString()}`)
  console.log("=" .repeat(60))

  await prisma.$disconnect()
}

main().catch(console.error)
