import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { auth } from '@/lib/auth'

// GET /api/albums/[id]/tracks - Get album tracks with user's ratings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const session = await auth()
    const userId = session?.user?.id

    // Fetch album with tracks
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        title: true,
        artistName: true,
        coverArtUrl: true,
        tracks: {
          orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
          select: {
            id: true,
            spotifyId: true,
            name: true,
            trackNumber: true,
            discNumber: true,
            durationMs: true,
            previewUrl: true,
            averageRating: true,
            totalReviews: true,
          }
        },
        _count: {
          select: { tracks: true }
        }
      }
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // If user is logged in, fetch their track reviews
    let userTrackReviews: Record<string, { rating: number; isFavorite: boolean; text: string | null }> = {}
    
    if (userId) {
      const reviews = await prisma.trackReview.findMany({
        where: {
          userId,
          trackId: { in: album.tracks.map(t => t.id) }
        },
        select: {
          trackId: true,
          rating: true,
          isFavorite: true,
          text: true,
        }
      })

      userTrackReviews = reviews.reduce((acc, r) => {
        acc[r.trackId] = { rating: r.rating, isFavorite: r.isFavorite, text: r.text }
        return acc
      }, {} as Record<string, { rating: number; isFavorite: boolean; text: string | null }>)
    }

    // Combine tracks with user's reviews
    const tracksWithReviews = album.tracks.map(track => ({
      ...track,
      userRating: userTrackReviews[track.id]?.rating ?? null,
      userIsFavorite: userTrackReviews[track.id]?.isFavorite ?? false,
      userNote: userTrackReviews[track.id]?.text ?? null,
    }))

    // Calculate album progress
    const totalTracks = album._count.tracks
    const ratedTracks = Object.keys(userTrackReviews).length
    const progressPercent = totalTracks > 0 ? Math.round((ratedTracks / totalTracks) * 100) : 0

    // Calculate average of user's track ratings for this album
    const userRatings = Object.values(userTrackReviews).map(r => r.rating)
    const userAverageRating = userRatings.length > 0
      ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length
      : null

    return successResponse({
      album: {
        id: album.id,
        title: album.title,
        artistName: album.artistName,
        coverArtUrl: album.coverArtUrl,
      },
      tracks: tracksWithReviews,
      progress: {
        total: totalTracks,
        rated: ratedTracks,
        percent: progressPercent,
        userAverageRating,
        isComplete: ratedTracks === totalTracks && totalTracks > 0,
      }
    })
  } catch (error) {
    console.error('Error fetching album tracks:', error)
    return errorResponse('Failed to fetch album tracks', 500)
  }
}
