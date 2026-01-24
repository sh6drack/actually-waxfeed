import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { getWalletStats } from '@/lib/wax-engine'

// GET /api/wax/balance - Get user's wax wallet stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const stats = await getWalletStats(user.id)

    return successResponse(stats)

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error getting wax balance:', error)
    return errorResponse('Failed to get balance', 500)
  }
}
