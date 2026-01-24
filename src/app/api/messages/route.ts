import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
  getPagination,
} from '@/lib/api-utils'
import { 
  canMessage, 
  getOrCreateConversation,
  TASTE_MATCH_THRESHOLD,
  MESSAGE_MAX_LENGTH,
} from '@/lib/messaging'

/**
 * GET /api/messages
 * List user's conversations with last message and unread count.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id },
        ],
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip,
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
          },
        },
      },
    })

    // Get unread counts per conversation
    const conversationData = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            isRead: false,
          },
        })

        // Get the other user
        const otherUser = conv.user1Id === user.id ? conv.user2 : conv.user1
        const lastMessage = conv.messages[0] || null

        return {
          id: conv.id,
          otherUser,
          tasteMatchScore: conv.tasteMatchScore,
          lastMessage,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        }
      })
    )

    // Get total unread
    const totalUnread = conversationData.reduce((sum, c) => sum + c.unreadCount, 0)

    return successResponse({
      conversations: conversationData,
      totalUnread,
    })
  } catch (error) {
    console.error('Failed to list conversations:', error)
    return errorResponse('Failed to load conversations', 500)
  }
}

/**
 * POST /api/messages
 * Start a new conversation with a user (requires 60%+ taste match).
 * Body: { targetUserId: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { targetUserId, message } = body

    if (!targetUserId) {
      return errorResponse('Target user ID is required', 400)
    }

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required', 400)
    }

    if (message.length > MESSAGE_MAX_LENGTH) {
      return errorResponse(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`, 400)
    }

    if (targetUserId === user.id) {
      return errorResponse('Cannot message yourself', 400)
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, 
        username: true, 
        name: true, 
        image: true,
        tastemakeScore: true,
      },
    })

    if (!targetUser) {
      return errorResponse('User not found', 404)
    }

    // Check if they can message (taste match gate)
    const canMsg = await canMessage(user.id, targetUserId)
    if (!canMsg.allowed) {
      return errorResponse(canMsg.reason || `Taste match must be ${TASTE_MATCH_THRESHOLD}% or higher`, 403)
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(user.id, targetUserId)

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: message.trim(),
      },
    })

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: newMessage.createdAt },
    })

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'message',
        content: {
          conversationId: conversation.id,
          senderId: user.id,
          senderName: user.username || user.name,
          senderImage: user.image,
          preview: message.substring(0, 100),
        },
      },
    })

    return successResponse({
      conversation: {
        id: conversation.id,
        otherUser: targetUser,
        tasteMatchScore: conversation.tasteMatchScore,
      },
      message: {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        createdAt: newMessage.createdAt,
      },
    }, 201)
  } catch (error) {
    console.error('Failed to start conversation:', error)
    const message = error instanceof Error ? error.message : 'Failed to start conversation'
    return errorResponse(message, 500)
  }
}
