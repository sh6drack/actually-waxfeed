import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
} from '@/lib/api-utils'
import { getUnreadCount } from '@/lib/messaging'

/**
 * GET /api/messages/unread
 * Get total unread message count for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const unreadCount = await getUnreadCount(user.id)

    return successResponse({ unreadCount })
  } catch (error) {
    console.error('Failed to get unread count:', error)
    return errorResponse('Failed to get unread count', 500)
  }
}
