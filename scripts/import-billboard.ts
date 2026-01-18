import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

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
  artists: { name: string }[]
  images: { url: string }[]
  release_date: string
  album_type: string
  total_tracks: number
  external_urls: { spotify: string }
}

async function searchAlbum(token: string, query: string): Promise<SpotifyAlbum | null> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  const data = await response.json()
  return data.albums?.items?.[0] || null
}

async function importAlbum(album: SpotifyAlbum, rank: number): Promise<boolean> {
  try {
    if (album.album_type === "single" && album.total_tracks < 4) {
      return false
    }

    const chartDate = new Date()

    await prisma.album.upsert({
      where: { spotifyId: album.id },
      update: {
        billboardRank: rank,
        billboardDate: chartDate,
      },
      create: {
        spotifyId: album.id,
        title: album.name,
        artistName: album.artists.map((a) => a.name).join(", "),
        coverArtUrl: album.images[0]?.url || null,
        releaseDate: album.release_date ? new Date(album.release_date) : null,
        genres: [],
        totalTracks: album.total_tracks,
        spotifyUrl: album.external_urls.spotify,
        billboardRank: rank,
        billboardDate: chartDate,
      },
    })
    return true
  } catch (error) {
    console.error(`Failed to import ${album.name}:`, error)
    return false
  }
}

// Current Billboard 200 chart - January 10, 2026
// Source: https://creativedisc.com/2026/01/billboard-200-albums-chart-10-jan-2026/
const BILLBOARD_200_CURRENT: { rank: number; title: string; artist: string }[] = [
  { rank: 1, title: "The Life Of A Showgirl", artist: "Taylor Swift" },
  { rank: 2, title: "I'm The Problem", artist: "Morgan Wallen" },
  { rank: 3, title: "KPop Demon Hunters", artist: "Soundtrack" },
  { rank: 4, title: "The Art Of Loving", artist: "Olivia Dean" },
  { rank: 5, title: "Man's Best Friend", artist: "Sabrina Carpenter" },
  { rank: 6, title: "DINASTIA", artist: "Peso Pluma & Tito Double P" },
  { rank: 7, title: "SOS", artist: "SZA" },
  { rank: 8, title: "So Close To What", artist: "Tate McRae" },
  { rank: 9, title: "One Thing At A Time", artist: "Morgan Wallen" },
  { rank: 10, title: "Short n' Sweet", artist: "Sabrina Carpenter" },
  { rank: 11, title: "You'll Be Alright, Kid", artist: "Alex Warren" },
  { rank: 12, title: "Debi Tirar Mas Fotos", artist: "Bad Bunny" },
  { rank: 13, title: "Stick Season", artist: "Noah Kahan" },
  { rank: 14, title: "The Diamond Collection", artist: "Post Malone" },
  { rank: 15, title: "Rumours", artist: "Fleetwood Mac" },
  { rank: 16, title: "Hit Me Hard And Soft", artist: "Billie Eilish" },
  { rank: 17, title: "Beautiful Chaos", artist: "KATSEYE" },
  { rank: 18, title: "Dangerous: The Double Album", artist: "Morgan Wallen" },
  { rank: 19, title: "DO IT", artist: "Stray Kids" },
  { rank: 20, title: "The Tortured Poets Department", artist: "Taylor Swift" },
  { rank: 21, title: "Thy Will Be Done", artist: "$uicideboy$" },
  { rank: 22, title: "Take Care", artist: "Drake" },
  { rank: 23, title: "Am I The Drama?", artist: "Cardi B" },
  { rank: 24, title: "The Rise And Fall Of A Midwest Princess", artist: "Chappell Roan" },
  { rank: 25, title: "I Barely Know Her", artist: "sombr" },
  { rank: 26, title: "30 Number One Hits", artist: "Jason Aldean" },
  { rank: 27, title: "Diamonds", artist: "Elton John" },
  { rank: 28, title: "GNX", artist: "Kendrick Lamar" },
  { rank: 29, title: "Rebel", artist: "EsDeeKid" },
  { rank: 30, title: "Midnights", artist: "Taylor Swift" },
  { rank: 31, title: "$ome $exy $ongs 4 U", artist: "PARTYNEXTDOOR & Drake" },
  { rank: 32, title: "Folklore", artist: "Taylor Swift" },
  { rank: 33, title: "CHROMAKOPIA", artist: "Tyler, The Creator" },
  { rank: 34, title: "+-=÷x (Tour Collection)", artist: "Ed Sheeran" },
  { rank: 35, title: "Un Verano Sin Ti", artist: "Bad Bunny" },
  { rank: 36, title: "Sour", artist: "Olivia Rodrigo" },
  { rank: 37, title: "What Happened To The Streets?", artist: "21 Savage" },
  { rank: 38, title: "The Secret Of Us", artist: "Gracie Abrams" },
  { rank: 39, title: "good kid, m.A.A.d city", artist: "Kendrick Lamar" },
  { rank: 40, title: "Hungover", artist: "Ella Langley" },
  { rank: 41, title: "Ultimate Christmas", artist: "Bing Crosby" },
  { rank: 42, title: "Lover", artist: "Taylor Swift" },
  { rank: 43, title: "Curtain Call: The Hits", artist: "Eminem" },
  { rank: 44, title: "Hazbin Hotel: Season Two", artist: "Soundtrack" },
  { rank: 45, title: "111XPANTIA", artist: "Fuerza Regida" },
  { rank: 46, title: "Where I've Been, Isn't Where I'm Going", artist: "Shaboozey" },
  { rank: 47, title: "I Hope You're Happy", artist: "BigXthaPlug" },
  { rank: 48, title: "Ctrl", artist: "SZA" },
  { rank: 49, title: "Views", artist: "Drake" },
  { rank: 50, title: "Greatest Hits", artist: "Queen" },
]

async function main() {
  console.log("Importing Billboard 200 Top 50...")
  console.log("Chart date: January 10, 2026\n")

  // Clear previous Billboard rankings before importing new chart
  console.log("Clearing previous Billboard rankings...")
  await prisma.album.updateMany({
    where: { billboardRank: { not: null } },
    data: { billboardRank: null, billboardDate: null },
  })

  const token = await getSpotifyToken()
  let imported = 0
  let skipped = 0
  let failed = 0

  for (const { rank, title, artist } of BILLBOARD_200_CURRENT) {
    const query = `${title} ${artist}`
    console.log(`#${rank} Searching: ${query}`)

    const spotifyAlbum = await searchAlbum(token, query)

    if (spotifyAlbum) {
      const success = await importAlbum(spotifyAlbum, rank)
      if (success) {
        console.log(`  ✓ Imported: ${spotifyAlbum.name} by ${spotifyAlbum.artists[0]?.name}`)
        imported++
      } else {
        console.log(`  - Skipped (single): ${spotifyAlbum.name}`)
        skipped++
      }
    } else {
      console.log(`  ✗ Not found: ${title} by ${artist}`)
      failed++
    }

    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`)

  const totalAlbums = await prisma.album.count()
  console.log(`Total albums in database: ${totalAlbums}`)

  await prisma.$disconnect()
}

main().catch(console.error)
