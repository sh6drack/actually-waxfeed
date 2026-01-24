import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
} from '@/lib/api-utils'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

/**
 * PATCH /api/messages/[conversationId]/read
 * Mark all messages in a conversation as read for the current user.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { conversationId } = await params

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return errorResponse('Conversation not found', 404)
    }

    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) {
      return errorResponse('Not authorized', 403)
    }

    // Mark all messages from the other user as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return successResponse({ 
      markedAsRead: result.count,
    })
  } catch (error) {
    console.error('Failed to mark messages as read:', error)
    return errorResponse('Failed to mark messages as read', 500)
  }
}
