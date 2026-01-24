import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
  getPagination,
} from '@/lib/api-utils'
import { MESSAGE_MAX_LENGTH } from '@/lib/messaging'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

/**
 * GET /api/messages/[conversationId]
 * Get messages in a conversation.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            tastemakeScore: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            tastemakeScore: true,
          },
        },
      },
    })

    if (!conversation) {
      return errorResponse('Conversation not found', 404)
    }

    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) {
      return errorResponse('Not authorized to view this conversation', 403)
    }

    // Get messages (newest first for pagination, then reverse for display)
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        albumContext: {
          select: {
            id: true,
            title: true,
            artistName: true,
            coverArtUrlSmall: true,
          },
        },
      },
    })

    // Get total count
    const totalMessages = await prisma.message.count({
      where: { conversationId },
    })

    // Get other user
    const otherUser = conversation.user1Id === user.id 
      ? conversation.user2 
      : conversation.user1

    return successResponse({
      conversation: {
        id: conversation.id,
        tasteMatchScore: conversation.tasteMatchScore,
        otherUser,
        createdAt: conversation.createdAt,
      },
      messages: messages.reverse(), // Oldest first for display
      pagination: {
        total: totalMessages,
        hasMore: skip + messages.length < totalMessages,
      },
    })
  } catch (error) {
    console.error('Failed to get messages:', error)
    return errorResponse('Failed to load messages', 500)
  }
}

/**
 * POST /api/messages/[conversationId]
 * Send a message in an existing conversation.
 * Body: { content: string, albumContextId?: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { conversationId } = await params
    const body = await request.json()
    const { content, albumContextId } = body

    if (!content || typeof content !== 'string') {
      return errorResponse('Message content is required', 400)
    }

    if (content.length > MESSAGE_MAX_LENGTH) {
      return errorResponse(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`, 400)
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return errorResponse('Conversation not found', 404)
    }

    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) {
      return errorResponse('Not authorized to send messages here', 403)
    }

    // If albumContextId provided, verify album exists
    if (albumContextId) {
      const album = await prisma.album.findUnique({
        where: { id: albumContextId },
      })
      if (!album) {
        return errorResponse('Album not found', 404)
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        albumContextId: albumContextId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        albumContext: {
          select: {
            id: true,
            title: true,
            artistName: true,
            coverArtUrlSmall: true,
          },
        },
      },
    })

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    })

    // Create notification for other user
    const otherUserId = conversation.user1Id === user.id 
      ? conversation.user2Id 
      : conversation.user1Id

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'message',
        content: {
          conversationId,
          senderId: user.id,
          senderName: user.username || user.name,
          senderImage: user.image,
          preview: content.substring(0, 100),
        },
      },
    })

    return successResponse({ message }, 201)
  } catch (error) {
    console.error('Failed to send message:', error)
    return errorResponse('Failed to send message', 500)
  }
}
