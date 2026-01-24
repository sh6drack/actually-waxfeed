import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, getAuthenticatedUser, getPagination } from '@/lib/api-utils'
import { ItemType } from '@prisma/client'

// GET /api/shop/items - Get shop items
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    const type = searchParams.get('type') as ItemType | null
    const showLimited = searchParams.get('limited') === 'true'

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }

    if (type) {
      where.type = type
    }

    if (showLimited) {
      where.isLimited = true
    }

    // Get items
    const [items, total] = await Promise.all([
      prisma.shopItem.findMany({
        where,
        orderBy: [
          { isLimited: 'desc' }, // Limited items first
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip,
      }),
      prisma.shopItem.count({ where }),
    ])

    // If user is logged in, mark owned items
    let ownedItemIds: string[] = []
    if (user) {
      const userItems = await prisma.userItem.findMany({
        where: { userId: user.id },
        select: { itemId: true }
      })
      ownedItemIds = userItems.map(ui => ui.itemId)
    }

    // Enrich items with ownership and availability
    const enrichedItems = items.map(item => ({
      ...item,
      owned: ownedItemIds.includes(item.id),
      available: item.stock === null || item.stock > item.soldCount,
      remaining: item.stock !== null ? item.stock - item.soldCount : null,
    }))

    return successResponse({
      items: enrichedItems,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Error getting shop items:', error)
    return errorResponse('Failed to get shop items', 500)
  }
}
