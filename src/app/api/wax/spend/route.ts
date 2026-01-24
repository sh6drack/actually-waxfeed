import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { spendWax, getTierConfig } from '@/lib/wax-engine'
import { WAX_SPEND_COSTS } from '@/lib/stripe'
import { TxType } from '@prisma/client'

type SpendAction = 'boost_review_24h' | 'boost_review_7d' | 'pin_review' | 'username_change' | 'tasteid_analysis' | 'unlock_stats'

const ACTION_COSTS: Record<SpendAction, { cost: number; type: TxType; description: string }> = {
  boost_review_24h: {
    cost: WAX_SPEND_COSTS.BOOST_REVIEW_24H,
    type: 'BOOST_REVIEW',
    description: 'Boost review for 24 hours',
  },
  boost_review_7d: {
    cost: WAX_SPEND_COSTS.BOOST_REVIEW_7D,
    type: 'BOOST_REVIEW',
    description: 'Boost review for 7 days',
  },
  pin_review: {
    cost: WAX_SPEND_COSTS.PIN_REVIEW,
    type: 'BOOST_REVIEW',
    description: 'Pin review to profile',
  },
  username_change: {
    cost: WAX_SPEND_COSTS.USERNAME_CHANGE,
    type: 'USERNAME_CHANGE',
    description: 'Username change',
  },
  tasteid_analysis: {
    cost: WAX_SPEND_COSTS.TASTEID_ANALYSIS,
    type: 'BUY_BADGE', // Reusing for now
    description: 'TasteID deep analysis',
  },
  unlock_stats: {
    cost: WAX_SPEND_COSTS.UNLOCK_STATS,
    type: 'BUY_BADGE',
    description: 'Unlock hidden stats',
  },
}

// POST /api/wax/spend - Spend wax on various actions
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { action, targetId } = body as { action: SpendAction; targetId?: string }

    if (!action || !ACTION_COSTS[action]) {
      return errorResponse('Invalid action', 400)
    }

    const actionConfig = ACTION_COSTS[action]

    // Check if user is premium (free username changes for premium)
    if (action === 'username_change') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { subscriptionTier: true }
      })

      if (dbUser?.subscriptionTier !== 'FREE') {
        // Premium users get free username changes
        return successResponse({
          spent: 0,
          message: 'Username change is free for subscribers!',
          isPremiumPerk: true,
        })
      }
    }

    // Spend the wax
    const result = await spendWax(
      user.id,
      actionConfig.cost,
      actionConfig.type,
      actionConfig.description,
      targetId ? { targetId } : undefined
    )

    if (!result.success) {
      return errorResponse(result.error || 'Insufficient Wax', 400)
    }

    // Perform the action
    if (action === 'boost_review_24h' || action === 'boost_review_7d') {
      if (!targetId) {
        return errorResponse('Review ID required', 400)
      }

      const boostDuration = action === 'boost_review_24h' ? 24 : 7 * 24
      const boostExpiresAt = new Date(Date.now() + boostDuration * 60 * 60 * 1000)

      await prisma.review.update({
        where: { id: targetId },
        data: {
          isBoosted: true,
          boostExpiresAt,
        }
      })
    }

    if (action === 'pin_review' && targetId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pinnedReviewId: targetId }
      })
    }

    return successResponse({
      spent: result.spent,
      newBalance: result.newBalance,
      message: `Spent ${result.spent} Wax on ${actionConfig.description}`,
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error spending wax:', error)
    return errorResponse('Failed to spend Wax', 500)
  }
}
