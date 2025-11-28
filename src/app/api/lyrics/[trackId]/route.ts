import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN

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

    // Search Genius for this track
    const searchResult = await searchGenius(track.name, track.album.artistName)

    if (!searchResult) {
      // Cache the "not found" result
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
    }

    // Get full song details
    const song = await getGeniusSong(searchResult.result.id)

    // Cache the result (we don't fetch the actual lyrics text - just link to Genius)
    const cached = await prisma.lyrics.create({
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
      lyrics: null, // We link to Genius rather than store lyrics (copyright)
      geniusUrl: searchResult.result.url,
      geniusId: cached.geniusId,
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
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return errorResponse('Failed to fetch lyrics', 500)
  }
}
