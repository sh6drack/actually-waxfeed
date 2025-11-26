import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  requireAuth,
  getAuthenticatedUser,
  updateAlbumStats,
  isBlocked
} from '@/lib/api-utils'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.number().min(0).max(10).optional(),
  text: z.string().max(5000).optional(),
})

// GET /api/reviews/[id] - Get single review with replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            isVerified: true,
            bio: true,
          }
        },
        album: {
          select: {
            id: true,
            spotifyId: true,
            title: true,
            artistName: true,
            coverArtUrl: true,
            coverArtUrlLarge: true,
            releaseDate: true,
            genres: true,
            spotifyUrl: true,
          }
        },
        replies: {
          orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
          include: {
            user: {
              select: {
                id: true,
                username: true,
                image: true,
                isVerified: true,
              }
            }
          }
        },
        _count: {
          select: { likes: true, waxAwards: true }
        }
      }
    })

    if (!review) {
      return errorResponse('Review not found', 404)
    }

    // Check if blocked
    if (user && await isBlocked(review.userId, user.id)) {
      return errorResponse('Review not found', 404)
    }

    // Check if user has liked this review
    let hasLiked = false
    let hasGivenWax = false
    if (user) {
      const [like, wax] = await Promise.all([
        prisma.reviewLike.findUnique({
          where: { reviewId_userId: { reviewId: id, userId: user.id } }
        }),
        prisma.waxAward.findUnique({
          where: { reviewId_giverId: { reviewId: id, giverId: user.id } }
        })
      ])
      hasLiked = !!like
      hasGivenWax = !!wax
    }

    return successResponse({
      ...review,
      hasLiked,
      hasGivenWax,
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    return errorResponse('Failed to fetch review', 500)
  }
}

// PATCH /api/reviews/[id] - Update review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()

    const validation = updateReviewSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true, rating: true, text: true, editHistory: true }
    })

    if (!review) {
      return errorResponse('Review not found', 404)
    }

    if (review.userId !== user.id) {
      return errorResponse('You can only edit your own reviews', 403)
    }

    const { rating, text } = validation.data

    // Build edit history
    const existingHistory = Array.isArray(review.editHistory) ? review.editHistory : []
    const editHistory = [
      ...existingHistory,
      {
        rating: review.rating,
        text: review.text,
        editedAt: new Date().toISOString(),
      }
    ]

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ?? review.rating,
        text: text ?? review.text,
        isEdited: true,
        editHistory: editHistory as object[],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            isVerified: true,
          }
        },
        album: {
          select: {
            id: true,
            title: true,
            artistName: true,
            coverArtUrl: true,
          }
        }
      }
    })

    // Update album stats if rating changed
    if (rating !== undefined && rating !== review.rating) {
      await updateAlbumStats(updated.albumId)
    }

    return successResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error updating review:', error)
    return errorResponse('Failed to update review', 500)
  }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true, albumId: true }
    })

    if (!review) {
      return errorResponse('Review not found', 404)
    }

    if (review.userId !== user.id) {
      return errorResponse('You can only delete your own reviews', 403)
    }

    await prisma.review.delete({ where: { id } })

    // Update album stats
    await updateAlbumStats(review.albumId)

    return successResponse({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error deleting review:', error)
    return errorResponse('Failed to delete review', 500)
  }
}
