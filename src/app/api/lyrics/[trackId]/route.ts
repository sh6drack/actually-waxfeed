import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN

// LRCLIB API for actual lyrics
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

async function fetchLrcLib(trackName: string, artistName: string, albumName?: string, duration?: number): Promise<LrcLibResponse | null> {
  try {
    // Try exact match first
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

    // If exact match fails, try search
    const searchResponse = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`,
      { headers: { 'User-Agent': 'Waxfeed/1.0' } }
    )

    if (searchResponse.ok) {
      const results = await searchResponse.json()
      if (results && results.length > 0) {
        // Return first result with lyrics
        return results.find((r: LrcLibResponse) => r.plainLyrics || r.syncedLyrics) || null
      }
    }

    return null
  } catch (error) {
    console.error('LRCLIB fetch error:', error)
    return null
  }
}

interface GeniusSearchHit {
  result: {
    id: number
    title: string
    artist_names: string
    url: string
    song_art_image_url: string
    primary_artist: {
      name: string
      image_url: string
    }
  }
}

interface GeniusSong {
  id: number
  title: string
  artist_names: string
  url: string
  song_art_image_url: string
  description: {
    plain: string
  }
  apple_music_player_url: string
  release_date_for_display: string
  album?: {
    name: string
    cover_art_url: string
  }
  primary_artist: {
    name: string
    image_url: string
  }
  writer_artists: Array<{ name: string }>
  producer_artists: Array<{ name: string }>
}

// Search Genius for a song
async function searchGenius(trackName: string, artistName: string): Promise<GeniusSearchHit | null> {
  if (!GENIUS_ACCESS_TOKEN) {
    console.error('GENIUS_ACCESS_TOKEN not configured')
    return null
  }

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

    if (!response.ok) {
      console.error('Genius search failed:', response.status)
      return null
    }

    const data = await response.json()
    const hits = data.response?.hits || []

    // Find best match - prioritize exact artist match
    const artistLower = artistName.toLowerCase()
    const trackLower = trackName.toLowerCase()

    for (const hit of hits) {
      const hitArtist = hit.result.artist_names.toLowerCase()
      const hitTitle = hit.result.title.toLowerCase()

      // Check if artist matches and title is similar
      if (hitArtist.includes(artistLower) || artistLower.includes(hitArtist.split(',')[0])) {
        if (hitTitle.includes(trackLower) || trackLower.includes(hitTitle)) {
          return hit
        }
      }
    }

    // Return first result as fallback
    return hits[0] || null
  } catch (error) {
    console.error('Genius search error:', error)
    return null
  }
}

// Get song details from Genius
async function getGeniusSong(songId: number): Promise<GeniusSong | null> {
  if (!GENIUS_ACCESS_TOKEN) return null

  try {
    const response = await fetch(
      `https://api.genius.com/songs/${songId}`,
      {
        headers: {
          Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.response?.song || null
  } catch (error) {
    console.error('Genius song fetch error:', error)
    return null
  }
}

// GET /api/lyrics/[trackId] - Get lyrics for a track
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params

    // Get track info
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        album: {
          select: {
            artistName: true,
            title: true,
            coverArtUrl: true,
          }
        },
        lyrics: true,
      }
    })

    if (!track) {
      return errorResponse('Track not found', 404)
    }

    // Check if we have cached lyrics
    if (track.lyrics) {
      // If we previously found nothing, tell the client
      if (track.lyrics.notFound) {
        return successResponse({
          track: {
            id: track.id,
            name: track.name,
            artistName: track.album.artistName,
            albumTitle: track.album.title,
            coverArtUrl: track.album.coverArtUrl,
          },
          lyrics: null,
          geniusUrl: null,
          notFound: true,
        })
      }

      return successResponse({
        track: {
          id: track.id,
          name: track.name,
          artistName: track.album.artistName,
          albumTitle: track.album.title,
          coverArtUrl: track.album.coverArtUrl,
        },
        lyrics: track.lyrics.lyrics,
        geniusUrl: track.lyrics.geniusUrl,
        geniusId: track.lyrics.geniusId,
        source: track.lyrics.source,
        notFound: false,
      })
    }

    // Try LRCLIB first for actual lyrics
    const lrcResult = await fetchLrcLib(
      track.name,
      track.album.artistName,
      track.album.title,
      track.durationMs
    )

    // Also search Genius for metadata
    const searchResult = await searchGenius(track.name, track.album.artistName)
    const song = searchResult ? await getGeniusSong(searchResult.result.id) : null

    // If we found lyrics from LRCLIB
    if (lrcResult && (lrcResult.plainLyrics || lrcResult.syncedLyrics)) {
      const lyricsText = lrcResult.plainLyrics || lrcResult.syncedLyrics

      // Cache the result
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

      return successResponse({
        track: {
          id: track.id,
          name: track.name,
          artistName: track.album.artistName,
          albumTitle: track.album.title,
          coverArtUrl: track.album.coverArtUrl,
        },
        lyrics: lyricsText,
        geniusUrl: searchResult?.result.url || null,
        geniusId: searchResult?.result.id.toString() || null,
        source: 'lrclib',
        notFound: false,
        songDetails: song ? {
          description: song.description?.plain?.slice(0, 500),
          releaseDate: song.release_date_for_display,
          writers: song.writer_artists?.map(w => w.name) || [],
          producers: song.producer_artists?.map(p => p.name) || [],
          albumName: song.album?.name,
        } : null,
      })
    }

    // No lyrics found from LRCLIB, but we have Genius metadata
    if (searchResult) {
      await prisma.lyrics.create({
        data: {
          trackId: track.id,
          geniusId: searchResult.result.id.toString(),
          geniusUrl: searchResult.result.url,
          source: 'genius',
          notFound: false,
        }
      })

      return successResponse({
        track: {
          id: track.id,
          name: track.name,
          artistName: track.album.artistName,
          albumTitle: track.album.title,
          coverArtUrl: track.album.coverArtUrl,
        },
        lyrics: null,
        geniusUrl: searchResult.result.url,
        geniusId: searchResult.result.id.toString(),
        source: 'genius',
        notFound: false,
        songDetails: song ? {
          description: song.description?.plain?.slice(0, 500),
          releaseDate: song.release_date_for_display,
          writers: song.writer_artists?.map(w => w.name) || [],
          producers: song.producer_artists?.map(p => p.name) || [],
          albumName: song.album?.name,
        } : null,
      })
    }

    // Nothing found at all
    await prisma.lyrics.create({
      data: {
        trackId: track.id,
        notFound: true,
      }
    })

    return successResponse({
      track: {
        id: track.id,
        name: track.name,
        artistName: track.album.artistName,
        albumTitle: track.album.title,
        coverArtUrl: track.album.coverArtUrl,
      },
      lyrics: null,
      geniusUrl: null,
      notFound: true,
    })
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return errorResponse('Failed to fetch lyrics', 500)
  }
}
