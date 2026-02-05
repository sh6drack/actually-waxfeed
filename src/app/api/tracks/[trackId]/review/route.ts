import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  requireAuth,
  updateAlbumStats,
} from '@/lib/api-utils'
import { z } from 'zod'

// Minimum percentage of tracks that need to be rated to aggregate into album rating
const TRACK_COMPLETION_THRESHOLD = 0.5 // 50%

const reviewSchema = z.object({
  rating: z.number().min(0).max(10),
  text: z.string().max(1000).optional(),
  isFavorite: z.boolean().optional(),
})

// GET /api/tracks/[trackId]/review - Get user's review for a track
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await requireAuth()
    const { trackId } = await params

    const review = await prisma.trackReview.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            trackNumber: true,
            album: {
              select: {
                id: true,
                title: true,
                artistName: true,
                coverArtUrl: true,
              }
            }
          }
        }
      }
    })

    return successResponse({ review })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error fetching track review:', error)
    return errorResponse('Failed to fetch track review', 500)
  }
}

// POST /api/tracks/[trackId]/review - Create or update track review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await requireAuth()
    const { trackId } = await params
    const body = await request.json()

    const validation = reviewSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const { rating, text, isFavorite } = validation.data

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        album: {
          select: { id: true, title: true, artistName: true }
        }
      }
    })

    if (!track) {
      return errorResponse('Track not found', 404)
    }

    // Upsert the review
    const review = await prisma.trackReview.upsert({
      where: { userId_trackId: { userId: user.id, trackId } },
      create: {
        userId: user.id,
        trackId,
        rating,
        text: text || null,
        isFavorite: isFavorite || false,
      },
      update: {
        rating,
        text: text || null,
        isFavorite: isFavorite || false,
      },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            trackNumber: true,
            album: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    })

    // Update track aggregate stats
    const trackStats = await prisma.trackReview.aggregate({
      where: { trackId },
      _avg: { rating: true },
      _count: true,
    })

    await prisma.track.update({
      where: { id: trackId },
      data: {
        averageRating: trackStats._avg.rating,
        totalReviews: trackStats._count,
      }
    })

    // Check if we should aggregate track ratings into album rating
    const albumAggregateResult = await aggregateTrackRatingsToAlbum(user.id, track.album.id)

    // Award small Wax for track rating (1 Wax per track, capped)
    try {
      // Check if this is a new rating (vs update)
      const isNewRating = review.createdAt.getTime() === review.updatedAt.getTime()
      if (isNewRating) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            waxBalance: { increment: 1 },
            lifetimeWaxEarned: { increment: 1 },
          }
        })
      }
    } catch (error) {
      console.error('Error granting wax for track review:', error)
    }

    return successResponse({
      review,
      waxEarned: 1,
      message: `Rated "${track.name}"`,
      albumAggregated: albumAggregateResult?.aggregated ?? false,
      albumRating: albumAggregateResult?.rating ?? null,
      trackCompletion: albumAggregateResult?.completion ?? null,
    }, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating track review:', error)
    return errorResponse('Failed to create track review', 500)
  }
}

// DELETE /api/tracks/[trackId]/review - Delete track review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await requireAuth()
    const { trackId } = await params

    await prisma.trackReview.delete({
      where: { userId_trackId: { userId: user.id, trackId } }
    })

    // Update track aggregate stats
    const trackStats = await prisma.trackReview.aggregate({
      where: { trackId },
      _avg: { rating: true },
      _count: true,
    })

    await prisma.track.update({
      where: { id: trackId },
      data: {
        averageRating: trackStats._count > 0 ? trackStats._avg.rating : null,
        totalReviews: trackStats._count,
      }
    })

    return successResponse({ message: 'Track review deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error deleting track review:', error)
    return errorResponse('Failed to delete track review', 500)
  }
}

// ============================================
// TRACK-TO-ALBUM AGGREGATION
// When user rates enough tracks on an album, auto-generate/update album rating
// ============================================

interface AggregateResult {
  aggregated: boolean
  rating: number | null
  completion: number
}

async function aggregateTrackRatingsToAlbum(
  userId: string,
  albumId: string
): Promise<AggregateResult | null> {
  try {
    // Get album track count
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, totalTracks: true, title: true }
    })

    if (!album || album.totalTracks === 0) return null

    // Get user's track ratings for this album
    const trackRatings = await prisma.trackReview.findMany({
      where: {
        userId,
        track: { albumId }
      },
      select: { rating: true, isFavorite: true }
    })

    const completion = trackRatings.length / album.totalTracks

    // Only aggregate if user rated at least 50% of tracks
    if (completion < TRACK_COMPLETION_THRESHOLD) {
      return { aggregated: false, rating: null, completion }
    }

    // Calculate average rating from track ratings
    const avgRating = trackRatings.reduce((sum, r) => sum + r.rating, 0) / trackRatings.length
    const roundedRating = Math.round(avgRating * 10) / 10 // Round to 1 decimal

    // Check if user has existing album review
    const existingReview = await prisma.review.findUnique({
      where: { userId_albumId: { userId, albumId } },
      select: { id: true, text: true, vibes: true, isTrackAggregate: true }
    })

    if (existingReview) {
      // Only update rating if this is a track-aggregate review OR if no text/vibes
      // Don't overwrite manual reviews with real content
      const hasManualContent = existingReview.text || (existingReview.vibes && existingReview.vibes.length > 0)

      if (existingReview.isTrackAggregate || !hasManualContent) {
        await prisma.review.update({
          where: { id: existingReview.id },
          data: {
            rating: roundedRating,
            isTrackAggregate: true,
          }
        })
      }
    } else {
      // Create new album review from track ratings
      // Get the current count to set review position
      const reviewCount = await prisma.review.count({ where: { albumId } })

      await prisma.review.create({
        data: {
          userId,
          albumId,
          rating: roundedRating,
          isQuickRate: false,
          isTrackAggregate: true,
          vibes: [],
          reviewPosition: reviewCount + 1,
        }
      })
    }

    // Update album stats
    await updateAlbumStats(albumId)

    console.log(`[Track Aggregation] User ${userId} → Album "${album.title}": ${roundedRating}/10 (${Math.round(completion * 100)}% completion)`)

    return { aggregated: true, rating: roundedRating, completion }
  } catch (error) {
    console.error('Error aggregating track ratings to album:', error)
    return null
  }
}
