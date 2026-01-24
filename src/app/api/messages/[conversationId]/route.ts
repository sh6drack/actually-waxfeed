/**
 * API: /api/messages/[conversationId]
 * Individual conversation operations
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    const { conversationId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Check if user is participant
    const isParticipant1 = conversation.participant1Id === session.user.id
    const isParticipant2 = conversation.participant2Id === session.user.id

    if (!isParticipant1 && !isParticipant2) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Get messages
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    // Get sender info
    const senderIds = [...new Set(messages.map(m => m.senderId))]
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, username: true, image: true },
    })
    const senderMap = Object.fromEntries(senders.map(s => [s.id, s]))

    const enrichedMessages = messages.map(m => ({
      ...m,
      sender: senderMap[m.senderId],
      isMine: m.senderId === session.user.id,
    }))

    // Get other user
    const otherId = isParticipant1 ? conversation.participant2Id : conversation.participant1Id
    const otherUser = await prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, username: true, image: true },
    })

    // Mark messages as read
    const unreadField = isParticipant1 ? "participant1Unread" : "participant2Unread"
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { [unreadField]: 0 },
    })

    // Mark individual messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
      },
      messages: enrichedMessages.reverse(), // Oldest first for display
      hasMore: messages.length === limit,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    })
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    const { conversationId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const isParticipant1 = conversation.participant1Id === session.user.id
    const isParticipant2 = conversation.participant2Id === session.user.id

    if (!isParticipant1 && !isParticipant2) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { content, type = "text", metadata } = body

    if (!content) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content,
        type,
        metadata,
      },
    })

    // Update conversation
    const unreadField = isParticipant1 ? "participant2Unread" : "participant1Unread"

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.slice(0, 100),
        [unreadField]: { increment: 1 },
      },
    })

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, username: true, image: true },
    })

    return NextResponse.json({
      message: {
        ...message,
        sender,
        isMine: true,
      },
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
