import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { spendWax, getTierConfig } from '@/lib/wax-engine'
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

    // Check stock for limited items
    if (item.stock !== null && item.soldCount >= item.stock) {
      return errorResponse('Item is sold out', 400)
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

    // Spend the wax
    const result = await spendWax(
      user.id,
      item.waxPrice,
      txType,
      `Purchased ${item.name}`,
      { itemId, itemType: item.type }
    )

    if (!result.success) {
      return errorResponse(result.error || 'Insufficient Wax', 400)
    }

    // Create user item and update sold count in a transaction
    const purchaseNum = item.isLimited ? item.soldCount + 1 : null

    await prisma.$transaction([
      prisma.userItem.create({
        data: {
          userId: user.id,
          itemId,
          purchaseNum,
        }
      }),
      prisma.shopItem.update({
        where: { id: itemId },
        data: { soldCount: { increment: 1 } }
      })
    ])

    return successResponse({
      success: true,
      spent: item.waxPrice,
      newBalance: result.newBalance,
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
      },
      purchaseNum,
      message: purchaseNum 
        ? `You got #${purchaseNum} of ${item.stock}!`
        : `Successfully purchased ${item.name}!`,
    })

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
