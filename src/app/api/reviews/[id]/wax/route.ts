import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth, createNotification } from '@/lib/api-utils'
import { spendWax, grantWaxReceived, getWaxAwardCost, canAwardWaxType } from '@/lib/wax-engine'

type WaxType = 'standard' | 'premium' | 'gold'

// POST /api/reviews/[id]/wax - Give wax to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { waxType = 'standard' } = body as { waxType: WaxType }

    // Get user's subscription tier
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, waxBalance: true }
    })

    if (!dbUser) {
      return errorResponse('User not found', 404)
    }

    // Check if user can award this wax type
    if (!canAwardWaxType(dbUser.subscriptionTier, waxType)) {
      if (waxType === 'premium') {
        return errorResponse('Premium Wax requires Wax+ or Wax Pro subscription', 403)
      }
      if (waxType === 'gold') {
        return errorResponse('GOLD Wax requires Wax Pro subscription', 403)
      }
      return errorResponse('Cannot award this wax type', 403)
    }

    // Get the cost to award this wax type
    const waxCost = getWaxAwardCost(dbUser.subscriptionTier, waxType)
    if (waxCost === null) {
      return errorResponse('Invalid wax type', 400)
    }

    // Check if user has enough wax
    if (dbUser.waxBalance < waxCost) {
      return errorResponse(
        `Insufficient Wax. Need ${waxCost} Wax, you have ${dbUser.waxBalance}`,
        400
      )
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

    // Determine transaction type based on wax type
    const txType = waxType === 'gold' ? 'AWARD_GOLD' 
      : waxType === 'premium' ? 'AWARD_PREMIUM' 
      : 'AWARD_STANDARD'

    // Spend wax from giver
    const spendResult = await spendWax(
      user.id,
      waxCost,
      txType,
      `Gave ${waxType} Wax to review`,
      { reviewId, waxType }
    )

    if (!spendResult.success) {
      return errorResponse(spendResult.error || 'Failed to spend Wax', 400)
    }

    // Create wax award
    await prisma.waxAward.create({
      data: {
        reviewId,
        giverId: user.id,
        waxType,
        waxCost,
      }
    })

    // Update review wax counts and user scores based on wax type
    if (waxType === 'gold') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { goldWaxCount: { increment: 1 } }
      })
      await prisma.user.update({
        where: { id: review.user.id },
        data: { goldWaxScore: { increment: 1 } }
      })
    } else if (waxType === 'premium') {
      await prisma.review.update({
        where: { id: reviewId },
        data: { premiumWaxCount: { increment: 1 } }
      })
      await prisma.user.update({
        where: { id: review.user.id },
        data: { premiumWaxScore: { increment: 1 } }
      })
    } else {
      await prisma.review.update({
        where: { id: reviewId },
        data: { waxCount: { increment: 1 } }
      })
      await prisma.user.update({
        where: { id: review.user.id },
        data: { waxScore: { increment: 1 } }
      })
    }

    // Grant wax to the recipient (they earn wax for receiving)
    await grantWaxReceived(review.user.id, waxType)

    // Notify review author
    await createNotification(review.user.id, 'wax', {
      actorId: user.id,
      actorName: user.username || user.name,
      reviewId,
      albumTitle: review.album.title,
      waxType,
    })

    return successResponse({
      awarded: true,
      waxType,
      waxSpent: waxCost,
      newBalance: spendResult.newBalance,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error giving wax:', error)
    return errorResponse('Failed to give wax', 500)
  }
}
