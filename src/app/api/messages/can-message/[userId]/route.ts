import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
} from '@/lib/api-utils'
import { canMessage, TASTE_MATCH_THRESHOLD } from '@/lib/messaging'

interface RouteParams {
  params: Promise<{ userId: string }>
}

/**
 * GET /api/messages/can-message/[userId]
 * Check if the current user can message another user.
 * Returns taste match score and whether messaging is allowed.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { userId: targetUserId } = await params

    if (targetUserId === user.id) {
      return successResponse({
        canMessage: false,
        score: null,
        threshold: TASTE_MATCH_THRESHOLD,
        reason: 'Cannot message yourself',
      })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, 
        username: true, 
        name: true, 
        image: true,
      },
    })

    if (!targetUser) {
      return errorResponse('User not found', 404)
    }

    // Check if they can message
    const result = await canMessage(user.id, targetUserId)

    // Check if conversation already exists
    const [id1, id2] = [user.id, targetUserId].sort()
    const existingConversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: { user1Id: id1, user2Id: id2 },
      },
      select: { id: true },
    })

    return successResponse({
      canMessage: result.allowed,
      score: result.score,
      threshold: TASTE_MATCH_THRESHOLD,
      reason: result.reason,
      existingConversationId: existingConversation?.id || null,
      targetUser,
    })
  } catch (error) {
    console.error('Failed to check messaging eligibility:', error)
    return errorResponse('Failed to check messaging eligibility', 500)
  }
}
