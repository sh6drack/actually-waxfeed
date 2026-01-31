import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { SubTier } from '@prisma/client'

// POST /api/shop/purchase - Purchase a shop item with Wax
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { itemId } = body

    if (!itemId) {
      return errorResponse('Item ID required', 400)
    }

    // Get the item
    const item = await prisma.shopItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return errorResponse('Item not found', 404)
    }

    // Check if item is active and not expired
    if (!item.isActive) {
      return errorResponse('Item is no longer available', 400)
    }

    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
      return errorResponse('Item has expired', 400)
    }

    // Check tier requirement
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, waxBalance: true }
    })

    if (!dbUser) {
      return errorResponse('User not found', 404)
    }

    const tierOrder: Record<SubTier, number> = {
      FREE: 0,
      WAX_PLUS: 1,
      WAX_PRO: 2,
    }

    if (tierOrder[dbUser.subscriptionTier] < tierOrder[item.minTier]) {
      return errorResponse(`This item requires ${item.minTier} subscription`, 403)
    }

    // Check if already owned
    const existing = await prisma.userItem.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } }
    })

    if (existing) {
      return errorResponse('You already own this item', 400)
    }

    // Determine transaction type based on item type
    const txType = item.type === 'BADGE' ? 'BUY_BADGE'
      : item.type === 'FRAME' ? 'BUY_FRAME'
      : 'BUY_BADGE'

    // Use a transaction to atomically check stock, spend wax, and create item
    // This prevents overselling of limited items
    try {
      const purchaseResult = await prisma.$transaction(async (tx) => {
        // Re-check stock inside transaction to prevent race conditions
        const currentItem = await tx.shopItem.findUnique({
          where: { id: itemId },
          select: { stock: true, soldCount: true, isLimited: true }
        })

        if (!currentItem) {
          throw new Error('Item not found')
        }

        // Check stock for limited items (inside transaction)
        if (currentItem.stock !== null && currentItem.soldCount >= currentItem.stock) {
          throw new Error('Item is sold out')
        }

        // Check and spend wax atomically
        const userWithBalance = await tx.user.findUnique({
          where: { id: user.id },
          select: { waxBalance: true }
        })

        if (!userWithBalance || userWithBalance.waxBalance < item.waxPrice) {
          throw new Error(`Insufficient Wax. Need ${item.waxPrice}, have ${userWithBalance?.waxBalance ?? 0}`)
        }

        // Deduct wax
        await tx.user.update({
          where: { id: user.id },
          data: {
            waxBalance: { decrement: item.waxPrice },
            lifetimeWaxSpent: { increment: item.waxPrice },
          }
        })

        // Log wax transaction
        await tx.waxTransaction.create({
          data: {
            userId: user.id,
            amount: -item.waxPrice,
            type: txType,
            description: `Purchased ${item.name}`,
            metadata: { itemId, itemType: item.type }
          }
        })

        // Calculate purchase number
        const purchaseNum = currentItem.isLimited ? currentItem.soldCount + 1 : null

        // Create user item
        await tx.userItem.create({
          data: {
            userId: user.id,
            itemId,
            purchaseNum,
          }
        })

        // Update sold count
        await tx.shopItem.update({
          where: { id: itemId },
          data: { soldCount: { increment: 1 } }
        })

        // Get new balance
        const updatedUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { waxBalance: true }
        })

        return {
          purchaseNum,
          newBalance: updatedUser?.waxBalance ?? 0
        }
      })

      return successResponse({
        success: true,
        spent: item.waxPrice,
        newBalance: purchaseResult.newBalance,
        item: {
          id: item.id,
          name: item.name,
          type: item.type,
        },
        purchaseNum: purchaseResult.purchaseNum,
        message: purchaseResult.purchaseNum
          ? `You got #${purchaseResult.purchaseNum} of ${item.stock}!`
          : `Successfully purchased ${item.name}!`,
      })
    } catch (txError) {
      const message = txError instanceof Error ? txError.message : 'Purchase failed'
      return errorResponse(message, 400)
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error purchasing item:', error)
    return errorResponse('Failed to purchase item', 500)
  }
}

// GET /api/shop/purchase - Get user's owned items
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const userItems = await prisma.userItem.findMany({
      where: { userId: user.id },
      include: {
        item: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse({
      items: userItems.map(ui => ({
        ...ui.item,
        equipped: ui.equipped,
        purchaseNum: ui.purchaseNum,
        acquiredAt: ui.createdAt,
      }))
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error getting owned items:', error)
    return errorResponse('Failed to get owned items', 500)
  }
}
