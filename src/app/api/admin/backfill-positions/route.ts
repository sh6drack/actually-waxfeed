import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { backfillReviewPositions } from '@/lib/first-spin'

// POST /api/admin/backfill-positions - Recalculate review positions
// Only reviews with 20+ chars of text get positions (badge eligible)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only allow admin users (you can adjust this check)
    if (user.email !== 'shadrack@brown.edu') {
      return errorResponse('Unauthorized', 403)
    }

    const result = await backfillReviewPositions()

    return successResponse({
      message: 'Backfill complete',
      processed: result.processed,
      cleared: result.cleared,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error running backfill:', error)
    return errorResponse('Failed to run backfill', 500)
  }
}
