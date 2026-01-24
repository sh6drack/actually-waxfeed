import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  requireAuth,
} from '@/lib/api-utils'
import { z } from 'zod'

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
