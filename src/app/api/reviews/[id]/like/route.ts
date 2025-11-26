import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth, createNotification } from '@/lib/api-utils'

// POST /api/reviews/[id]/like - Like a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    const user = await requireAuth()

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        album: { select: { title: true } },
        user: { select: { id: true } }
      }
    })

    if (!review) {
      return errorResponse('Review not found', 404)
    }

    // Check if already liked
    const existing = await prisma.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } }
    })

    if (existing) {
      return errorResponse('Already liked', 409)
    }

    // Create like
    await prisma.reviewLike.create({
      data: { reviewId, userId: user.id }
    })

    // Increment like count
    await prisma.review.update({
      where: { id: reviewId },
      data: { likeCount: { increment: 1 } }
    })

    // Notify review author (if not liking own review)
    if (review.user.id !== user.id) {
      await createNotification(review.user.id, 'like', {
        actorId: user.id,
        actorName: user.username || user.name,
        reviewId,
        albumTitle: review.album.title,
      })
    }

    return successResponse({ liked: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error liking review:', error)
    return errorResponse('Failed to like review', 500)
  }
}

// DELETE /api/reviews/[id]/like - Unlike a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    const user = await requireAuth()

    const existing = await prisma.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } }
    })

    if (!existing) {
      return errorResponse('Not liked', 404)
    }

    await prisma.reviewLike.delete({
      where: { reviewId_userId: { reviewId, userId: user.id } }
    })

    await prisma.review.update({
      where: { id: reviewId },
      data: { likeCount: { decrement: 1 } }
    })

    return successResponse({ liked: false })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error unliking review:', error)
    return errorResponse('Failed to unlike review', 500)
  }
}
