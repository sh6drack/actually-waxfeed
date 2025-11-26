import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth, createNotification } from '@/lib/api-utils'

// POST /api/reviews/[id]/wax - Give wax to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { waxType = 'standard' } = body

    // Validate wax type
    if (waxType === 'premium') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isPremium: true }
      })
      if (!dbUser?.isPremium) {
        return errorResponse('Premium wax requires premium subscription', 403)
      }
    }

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

    // Can't give wax to own review
    if (review.user.id === user.id) {
      return errorResponse('Cannot give wax to your own review', 400)
    }

    // Check if already gave wax
    const existing = await prisma.waxAward.findUnique({
      where: { reviewId_giverId: { reviewId, giverId: user.id } }
    })

    if (existing) {
      return errorResponse('Already gave wax to this review', 409)
    }

    // Create wax award
    await prisma.waxAward.create({
      data: {
        reviewId,
        giverId: user.id,
        waxType,
      }
    })

    // Update review wax counts
    if (waxType === 'premium') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { premiumWaxCount: { increment: 1 } }
      })
      // Update user's premium wax score
      await prisma.user.update({
        where: { id: review.user.id },
        data: { premiumWaxScore: { increment: 1 } }
      })
    } else {
      await prisma.review.update({
        where: { id: reviewId },
        data: { waxCount: { increment: 1 } }
      })
      // Update user's wax score
      await prisma.user.update({
        where: { id: review.user.id },
        data: { waxScore: { increment: 1 } }
      })
    }

    // Notify review author
    await createNotification(review.user.id, 'wax', {
      actorId: user.id,
      actorName: user.username || user.name,
      reviewId,
      albumTitle: review.album.title,
      waxType,
    })

    return successResponse({ awarded: true, waxType })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error giving wax:', error)
    return errorResponse('Failed to give wax', 500)
  }
}
