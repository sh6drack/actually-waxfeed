import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { claimDailyLogin, getWalletStats } from '@/lib/wax-engine'

// POST /api/wax/claim-daily - Claim daily login reward
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const result = await claimDailyLogin(user.id)

    if (result.earned === 0 && result.message === 'Already claimed today!') {
      return errorResponse(result.message, 400)
    }

    // Get updated stats
    const stats = await getWalletStats(user.id)

    return successResponse({
      earned: result.earned,
      capped: result.capped,
      newBalance: stats.balance,
      message: result.message || `Claimed ${result.earned} Wax!`,
      stats,
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error claiming daily wax:', error)
    return errorResponse('Failed to claim daily reward', 500)
  }
}
