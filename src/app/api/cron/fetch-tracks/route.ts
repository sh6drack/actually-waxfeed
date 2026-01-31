import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAlbum, importAlbumToDatabase } from "@/lib/spotify"

// This endpoint fetches tracks for albums that don't have them
// Run via Vercel Cron: every 6 hours
export const maxDuration = 300 // 5 minutes max

export async function GET(request: Request) {
  try {
    // Verify cron secret - REQUIRED in production
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Always require CRON_SECRET in production
    if (!cronSecret && process.env.NODE_ENV === 'production') {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Verify the secret if set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find albums without tracks (limit to 100 per run to avoid timeout)
    const albumsWithoutTracks = await prisma.album.findMany({
      where: {
        tracks: { none: {} }
      },
      select: {
        id: true,
        spotifyId: true,
        title: true,
        artistName: true,
      },
      take: 100,
      orderBy: { createdAt: "desc" } // Process newer albums first
    })

    console.log(`Found ${albumsWithoutTracks.length} albums without tracks`)

    let fetched = 0
    let failed = 0
    const errors: string[] = []

    for (const album of albumsWithoutTracks) {
      if (!album.spotifyId) continue

      try {
        // Fetch full album data from Spotify (includes tracks)
        const spotifyAlbum = await getAlbum(album.spotifyId, true)

        // Import to database (will upsert album and create tracks)
        await importAlbumToDatabase(spotifyAlbum)

        fetched++
        console.log(`Fetched tracks for: ${album.title} by ${album.artistName}`)

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        failed++
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        errors.push(`${album.title}: ${errorMsg}`)
        console.error(`Failed to fetch tracks for ${album.title}:`, errorMsg)
      }
    }

    const remaining = await prisma.album.count({
      where: {
        tracks: { none: {} }
      }
    })

    return NextResponse.json({
      success: true,
      fetched,
      failed,
      remaining,
      errors: errors.slice(0, 10), // Only return first 10 errors
    })
  } catch (error) {
    console.error("Fetch tracks cron error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    )
  }
}
