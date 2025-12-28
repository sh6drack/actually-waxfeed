import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Genius and LRCLIB APIs
const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN

interface LrcLibResponse {
  id: number
  name: string
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

interface GeniusSearchHit {
  result: {
    id: number
    title: string
    artist_names: string
    url: string
  }
}

async function fetchLrcLib(trackName: string, artistName: string, albumName?: string, duration?: number): Promise<LrcLibResponse | null> {
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    })
    if (albumName) params.append('album_name', albumName)
    if (duration) params.append('duration', Math.round(duration / 1000).toString())

    const response = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'Waxfeed/1.0' }
    })

    if (response.ok) {
      return await response.json()
    }

    // Try search as fallback
    const searchResponse = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`,
      { headers: { 'User-Agent': 'Waxfeed/1.0' } }
    )

    if (searchResponse.ok) {
      const results = await searchResponse.json()
      if (results && results.length > 0) {
        return results.find((r: LrcLibResponse) => r.plainLyrics || r.syncedLyrics) || null
      }
    }

    return null
  } catch {
    return null
  }
}

async function searchGenius(trackName: string, artistName: string): Promise<GeniusSearchHit | null> {
  if (!GENIUS_ACCESS_TOKEN) return null

  try {
    const query = `${trackName} ${artistName}`
    const response = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const hits = data.response?.hits || []

    const artistLower = artistName.toLowerCase()
    const trackLower = trackName.toLowerCase()

    for (const hit of hits) {
      const hitArtist = hit.result.artist_names.toLowerCase()
      const hitTitle = hit.result.title.toLowerCase()

      if (hitArtist.includes(artistLower) || artistLower.includes(hitArtist.split(',')[0])) {
        if (hitTitle.includes(trackLower) || trackLower.includes(hitTitle)) {
          return hit
        }
      }
    }

    return hits[0] || null
  } catch {
    return null
  }
}

// This endpoint fetches lyrics for tracks that don't have them
// Run via Vercel Cron: every 12 hours
export const maxDuration = 300 // 5 minutes max

export async function GET(request: Request) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find tracks without lyrics (limit to 50 per run to avoid timeout)
    // Prioritize tracks from Billboard albums
    const tracksWithoutLyrics = await prisma.track.findMany({
      where: {
        lyrics: null
      },
      select: {
        id: true,
        name: true,
        durationMs: true,
        album: {
          select: {
            id: true,
            title: true,
            artistName: true,
            billboardRank: true,
          }
        }
      },
      take: 50,
      orderBy: [
        { album: { billboardRank: { sort: "asc", nulls: "last" } } },
        { album: { createdAt: "desc" } }
      ]
    })

    console.log(`Found ${tracksWithoutLyrics.length} tracks without lyrics`)

    let fetched = 0
    let failed = 0
    let notFound = 0
    const errors: string[] = []

    for (const track of tracksWithoutLyrics) {
      try {
        // Try LRCLIB first for actual lyrics
        const lrcResult = await fetchLrcLib(
          track.name,
          track.album.artistName,
          track.album.title,
          track.durationMs
        )

        // Also search Genius for metadata
        const searchResult = await searchGenius(track.name, track.album.artistName)

        // If we found lyrics from LRCLIB
        if (lrcResult && (lrcResult.plainLyrics || lrcResult.syncedLyrics)) {
          const lyricsText = lrcResult.plainLyrics || lrcResult.syncedLyrics

          await prisma.lyrics.create({
            data: {
              trackId: track.id,
              lyrics: lyricsText,
              geniusId: searchResult?.result.id.toString(),
              geniusUrl: searchResult?.result.url,
              source: 'lrclib',
              notFound: false,
            }
          })

          fetched++
          console.log(`Fetched lyrics for: ${track.name} by ${track.album.artistName}`)
        }
        // If we only have Genius metadata
        else if (searchResult) {
          await prisma.lyrics.create({
            data: {
              trackId: track.id,
              geniusId: searchResult.result.id.toString(),
              geniusUrl: searchResult.result.url,
              source: 'genius',
              notFound: false,
            }
          })

          fetched++
          console.log(`Fetched Genius metadata for: ${track.name} by ${track.album.artistName}`)
        }
        // Nothing found
        else {
          await prisma.lyrics.create({
            data: {
              trackId: track.id,
              notFound: true,
            }
          })

          notFound++
          console.log(`No lyrics found for: ${track.name} by ${track.album.artistName}`)
        }

        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        failed++
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        errors.push(`${track.name}: ${errorMsg}`)
        console.error(`Failed to fetch lyrics for ${track.name}:`, errorMsg)
      }
    }

    const remaining = await prisma.track.count({
      where: {
        lyrics: null
      }
    })

    return NextResponse.json({
      success: true,
      fetched,
      failed,
      notFound,
      remaining,
      errors: errors.slice(0, 10), // Only return first 10 errors
    })
  } catch (error) {
    console.error("Fetch lyrics cron error:", error)
    return NextResponse.json(
      { error: "Failed to fetch lyrics" },
      { status: 500 }
    )
  }
}
