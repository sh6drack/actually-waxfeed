import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { getTrackWaveform } from '@/lib/spotify'

// Use Deezer API - free, no auth required, provides 30-second previews
const DEEZER_API = 'https://api.deezer.com'

// GET /api/albums/[id]/tracks - Get track previews for an album
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params

    // Get album details from our database
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        title: true,
        artistName: true,
        spotifyId: true,
      }
    })

    if (!album) {
      return successResponse([])
    }

    // Search Deezer for the album
    const searchQuery = encodeURIComponent(`${album.artistName} ${album.title}`)
    const searchRes = await fetch(`${DEEZER_API}/search/album?q=${searchQuery}&limit=1`)

    if (!searchRes.ok) {
      console.error('Deezer search error:', searchRes.status)
      return successResponse([])
    }

    const searchData = await searchRes.json()
    const deezerAlbum = searchData.data?.[0]

    if (!deezerAlbum) {
      console.log('No Deezer album found for:', album.title, album.artistName)
      return successResponse([])
    }

    // Fetch ALL album tracks from Deezer (limit=50 covers most albums)
    const tracksRes = await fetch(`${DEEZER_API}/album/${deezerAlbum.id}/tracks?limit=50`)

    if (!tracksRes.ok) {
      console.error('Deezer tracks error:', tracksRes.status)
      return successResponse([])
    }

    const tracksData = await tracksRes.json()

    // Map all Deezer tracks to our format + fetch waveforms in parallel
    const trackPromises = (tracksData.data || []).map(async (track: any, index: number) => {
      // Get real waveform from Spotify Audio Analysis
      const waveform = await getTrackWaveform(track.title, album.artistName).catch(() => null)

      return {
        id: String(track.id),
        name: track.title,
        trackNumber: track.track_position || index + 1,
        previewUrl: track.preview || null, // 30-second preview URL
        durationMs: track.duration * 1000, // Deezer gives seconds
        waveform, // Real Spotify waveform data (40 bars, 0-1 values) or null
      }
    })

    const tracks = await Promise.all(trackPromises)

    console.log(`Found ${tracks.length} tracks for "${album.title}" via Deezer (${tracks.filter(t => t.waveform).length} with waveforms)`)

    return successResponse(tracks)

  } catch (error) {
    console.error('Error fetching tracks:', error)
    return successResponse([])
  }
}
