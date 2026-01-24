import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth, getPagination } from '@/lib/api-utils'
import { getRecentTransactions } from '@/lib/wax-engine'
import { prisma } from '@/lib/prisma'

// GET /api/wax/transactions - Get user's wax transaction history
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    // Get total count
    const total = await prisma.waxTransaction.count({
      where: { userId: user.id }
    })

    // Get transactions
    const transactions = await prisma.waxTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    return successResponse({
      transactions,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error getting transactions:', error)
    return errorResponse('Failed to get transactions', 500)
  }
}
