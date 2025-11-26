import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

async function getSpotifyToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
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
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await response.json()
  return data.albums?.items?.[0] || null
}

async function importAlbum(album: SpotifyAlbum, rank: number, chartDate: Date): Promise<boolean> {
  if (album.album_type === "single" && album.total_tracks < 4) return false

  try {
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
        releaseDate: album.release_date ? new Date(album.release_date) : new Date(),
        genres: [],
        totalTracks: album.total_tracks,
        spotifyUrl: album.external_urls.spotify,
        billboardRank: rank,
        billboardDate: chartDate,
      },
    })
    return true
  } catch {
    return false
  }
}

// Billboard 200 top albums - November 22, 2025
const BILLBOARD_ALBUMS = [
  { rank: 1, title: "The Life Of A Showgirl", artist: "Taylor Swift" },
  { rank: 2, title: "I'm The Problem", artist: "Morgan Wallen" },
  { rank: 3, title: "KPop Demon Hunters", artist: "Soundtrack" },
  { rank: 4, title: "Lux", artist: "Rosalia" },
  { rank: 5, title: "The Art Of Loving", artist: "Olivia Dean" },
  { rank: 6, title: "Man's Best Friend", artist: "Sabrina Carpenter" },
  { rank: 7, title: "SOS", artist: "SZA" },
  { rank: 8, title: "Am I The Drama?", artist: "Cardi B" },
  { rank: 9, title: "One Thing At A Time", artist: "Morgan Wallen" },
  { rank: 10, title: "No Labels", artist: "YEONJUN" },
  { rank: 11, title: "I Barely Know Her", artist: "sombr" },
  { rank: 12, title: "Ego Death At A Bachelorette Party", artist: "Hayley Williams" },
  { rank: 13, title: "You'll Be Alright Kid", artist: "Alex Warren" },
  { rank: 14, title: "Stick Season", artist: "Noah Kahan" },
  { rank: 15, title: "Lil Herb", artist: "G Herbo" },
  { rank: 16, title: "Dangerous: The Double Album", artist: "Morgan Wallen" },
  { rank: 17, title: "Debi Tirar Mas Fotos", artist: "Bad Bunny" },
  { rank: 18, title: "Short n' Sweet", artist: "Sabrina Carpenter" },
  { rank: 19, title: "Hit Me Hard And Soft", artist: "Billie Eilish" },
  { rank: 20, title: "So Close To What", artist: "Tate McRae" },
  { rank: 21, title: "30 Number One Hits", artist: "Jason Aldean" },
  { rank: 22, title: "Take Care", artist: "Drake" },
  { rank: 23, title: "Rumours", artist: "Fleetwood Mac" },
  { rank: 24, title: "CHROMAKOPIA", artist: "Tyler, the Creator" },
  { rank: 25, title: "Christmas", artist: "Michael Buble" },
  { rank: 26, title: "GNX", artist: "Kendrick Lamar" },
  { rank: 27, title: "eternal sunshine", artist: "Ariana Grande" },
  { rank: 28, title: "The Tortured Poets Department", artist: "Taylor Swift" },
  { rank: 29, title: "GUTS", artist: "Olivia Rodrigo" },
  { rank: 30, title: "Cowboy Carter", artist: "Beyonce" },
]

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Clear previous Billboard rankings
    await prisma.album.updateMany({
      where: { billboardRank: { not: null } },
      data: { billboardRank: null, billboardDate: null },
    })

    const token = await getSpotifyToken()
    const chartDate = new Date()
    let imported = 0

    for (const { rank, title, artist } of BILLBOARD_ALBUMS) {
      const spotifyAlbum = await searchAlbum(token, `${title} ${artist}`)
      if (spotifyAlbum) {
        const success = await importAlbum(spotifyAlbum, rank, chartDate)
        if (success) imported++
      }
      await new Promise((r) => setTimeout(r, 50))
    }

    return NextResponse.json({
      success: true,
      imported,
      total: BILLBOARD_ALBUMS.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Billboard import failed:", error)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}
