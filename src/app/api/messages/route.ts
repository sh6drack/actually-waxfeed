/**
 * API: /api/messages
 * Direct Messages / Conversations
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all conversations for user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    })

    // Get other participants
    const otherUserIds = conversations.map(c =>
      c.participant1Id === session.user.id ? c.participant2Id : c.participant1Id
    )

    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: { id: true, username: true, image: true },
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    const enrichedConversations = conversations.map(c => {
      const isParticipant1 = c.participant1Id === session.user.id
      const otherId = isParticipant1 ? c.participant2Id : c.participant1Id
      const unreadCount = isParticipant1 ? c.participant1Unread : c.participant2Unread

      return {
        id: c.id,
        otherUser: userMap[otherId],
        lastMessageText: c.lastMessageText,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
      }
    })

    // Count total unread
    const totalUnread = enrichedConversations.reduce((sum, c) => sum + c.unreadCount, 0)

    return NextResponse.json({
      conversations: enrichedConversations,
      totalUnread,
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, content, type = "text", metadata } = body

    if (!recipientId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if conversation exists
    const [p1, p2] = [session.user.id, recipientId].sort()

    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
    })

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: p1,
          participant2Id: p2,
        },
      })
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        content,
        type,
        metadata,
      },
    })

    // Update conversation
    const isParticipant1 = conversation.participant1Id === session.user.id
    const unreadField = isParticipant1 ? "participant2Unread" : "participant1Unread"

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.slice(0, 100),
        [unreadField]: { increment: 1 },
      },
    })

    // Create notification for recipient
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    })

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "direct_message",
        content: {
          conversationId: conversation.id,
          actorId: session.user.id,
          actorName: sender?.username || "Someone",
          preview: content.slice(0, 50),
        },
      },
    })

    return NextResponse.json({ message, conversationId: conversation.id })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
