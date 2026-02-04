import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import {
  getTrackWaveform,
  getTrackAudioFeatures,
  SpotifyAudioFeatures,
  computeAlbumAudioProfile,
  storeAlbumAudioProfile,
} from '@/lib/spotify'

// Use Deezer API - free, no auth required, provides 30-second previews
const DEEZER_API = 'https://api.deezer.com'

export interface TrackWithAudioData {
  id: string
  name: string
  trackNumber: number
  previewUrl: string | null
  durationMs: number
  waveform: number[] | null
  audioFeatures: {
    energy: number
    valence: number
    danceability: number
    acousticness: number
    instrumentalness: number
    speechiness: number
    tempo: number
    loudness: number
  } | null
}

export interface AlbumAudioData {
  tracks: TrackWithAudioData[]
  albumProfile: {
    avgEnergy: number
    avgValence: number
    avgDanceability: number
    avgAcousticness: number
    avgTempo: number
    energyVariance: number
    valenceVariance: number
  } | null
}

// GET /api/albums/[id]/tracks - Get track previews for an album
// Query params:
// - includeAudioFeatures=true - Include Spotify audio features for prediction system
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const { searchParams } = new URL(request.url)
    const includeAudioFeatures = searchParams.get('includeAudioFeatures') === 'true'

    // Get album details from our database
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        title: true,
        artistName: true,
        spotifyId: true,
        audioProfile: true,
      }
    })

    if (!album) {
      return successResponse({ tracks: [], albumProfile: null })
    }

    // Search Deezer for the album
    const searchQuery = encodeURIComponent(`${album.artistName} ${album.title}`)
    const searchRes = await fetch(`${DEEZER_API}/search/album?q=${searchQuery}&limit=1`)

    if (!searchRes.ok) {
      console.error('Deezer search error:', searchRes.status)
      return successResponse({ tracks: [], albumProfile: null })
    }

    const searchData = await searchRes.json()
    const deezerAlbum = searchData.data?.[0]

    if (!deezerAlbum) {
      console.log('No Deezer album found for:', album.title, album.artistName)
      return successResponse({ tracks: [], albumProfile: null })
    }

    // Fetch ALL album tracks from Deezer (limit=50 covers most albums)
    const tracksRes = await fetch(`${DEEZER_API}/album/${deezerAlbum.id}/tracks?limit=50`)

    if (!tracksRes.ok) {
      console.error('Deezer tracks error:', tracksRes.status)
      return successResponse({ tracks: [], albumProfile: null })
    }

    const tracksData = await tracksRes.json()

    // Map all Deezer tracks to our format + fetch waveforms and audio features in parallel
    const trackPromises = (tracksData.data || []).map(async (track: any, index: number) => {
      // Get real waveform from Spotify Audio Analysis
      const waveform = await getTrackWaveform(track.title, album.artistName).catch(() => null)

      // Get audio features if requested
      let audioFeatures: TrackWithAudioData['audioFeatures'] = null
      if (includeAudioFeatures) {
        const features = await getTrackAudioFeatures(track.title, album.artistName).catch(() => null)
        if (features) {
          audioFeatures = {
            energy: features.energy,
            valence: features.valence,
            danceability: features.danceability,
            acousticness: features.acousticness,
            instrumentalness: features.instrumentalness,
            speechiness: features.speechiness,
            tempo: features.tempo,
            loudness: features.loudness,
          }
        }
      }

      return {
        id: String(track.id),
        name: track.title,
        trackNumber: track.track_position || index + 1,
        previewUrl: track.preview || null, // 30-second preview URL
        durationMs: track.duration * 1000, // Deezer gives seconds
        waveform, // Real Spotify waveform data (40 bars, 0-1 values) or null
        audioFeatures,
      }
    })

    const tracks = await Promise.all(trackPromises)

    // Get or compute album audio profile
    let albumProfile: AlbumAudioData['albumProfile'] = null

    if (includeAudioFeatures) {
      // Check if we have a cached profile
      if (album.audioProfile) {
        const profile = album.audioProfile as any
        albumProfile = {
          avgEnergy: profile.avgEnergy,
          avgValence: profile.avgValence,
          avgDanceability: profile.avgDanceability,
          avgAcousticness: profile.avgAcousticness,
          avgTempo: profile.avgTempo,
          energyVariance: profile.energyVariance,
          valenceVariance: profile.valenceVariance,
        }
      } else if (album.spotifyId) {
        // Compute and store album profile in background
        computeAlbumAudioProfile(album.spotifyId).then(async (profile) => {
          if (profile) {
            await storeAlbumAudioProfile(album.id, album.spotifyId, profile)
          }
        }).catch(err => console.error('Failed to compute album audio profile:', err))

        // For now, compute from track features we already have
        const tracksWithFeatures = tracks.filter(t => t.audioFeatures)
        if (tracksWithFeatures.length > 0) {
          const avgOf = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
          const variance = (arr: number[]) => {
            const mean = avgOf(arr)
            return avgOf(arr.map(x => (x - mean) ** 2))
          }

          const energies = tracksWithFeatures.map(t => t.audioFeatures!.energy)
          const valences = tracksWithFeatures.map(t => t.audioFeatures!.valence)
          const danceabilities = tracksWithFeatures.map(t => t.audioFeatures!.danceability)
          const acousticnesses = tracksWithFeatures.map(t => t.audioFeatures!.acousticness)
          const tempos = tracksWithFeatures.map(t => t.audioFeatures!.tempo)

          albumProfile = {
            avgEnergy: avgOf(energies),
            avgValence: avgOf(valences),
            avgDanceability: avgOf(danceabilities),
            avgAcousticness: avgOf(acousticnesses),
            avgTempo: avgOf(tempos),
            energyVariance: variance(energies),
            valenceVariance: variance(valences),
          }
        }
      }
    }

    console.log(`Found ${tracks.length} tracks for "${album.title}" via Deezer (${tracks.filter(t => t.waveform).length} with waveforms${includeAudioFeatures ? `, ${tracks.filter(t => t.audioFeatures).length} with audio features` : ''})`)

    return successResponse({ tracks, albumProfile })

  } catch (error) {
    console.error('Error fetching tracks:', error)
    return successResponse({ tracks: [], albumProfile: null })
  }
}
