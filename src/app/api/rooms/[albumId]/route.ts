import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
  getPagination,
} from '@/lib/api-utils'
import { hasReviewedAlbum, ROOM_MESSAGE_MAX_LENGTH } from '@/lib/messaging'

interface RouteParams {
  params: Promise<{ albumId: string }>
}

/**
 * GET /api/rooms/[albumId]
 * Get messages in an album room (requires user to have reviewed the album).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { albumId } = await params
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    // Check if album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        title: true,
        artistName: true,
        coverArtUrlMedium: true,
        coverArtUrlLarge: true,
        totalReviews: true,
      },
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check if user has reviewed this album
    const reviewCheck = await hasReviewedAlbum(user.id, albumId)
    if (!reviewCheck.reviewed) {
      return errorResponse('You must review this album to join the room', 403)
    }

    // Get or create room
    const room = await prisma.albumRoom.upsert({
      where: { albumId },
      create: { albumId },
      update: {},
    })

    // Get messages
    const messages = await prisma.roomMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        user: {
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

    // Get total count
    const totalMessages = await prisma.roomMessage.count({
      where: { roomId: room.id },
    })

    // Get member count (users who reviewed this album)
    const memberCount = await prisma.review.count({
      where: { albumId },
    })

    return successResponse({
      room: {
        id: room.id,
        album,
        messageCount: room.messageCount,
        memberCount,
        lastActivity: room.lastActivity,
      },
      messages: messages.reverse(),
      pagination: {
        total: totalMessages,
        hasMore: skip + messages.length < totalMessages,
      },
      userBadge: reviewCheck.badge,
      userReviewPosition: reviewCheck.reviewPosition,
    })
  } catch (error) {
    console.error('Failed to get room:', error)
    return errorResponse('Failed to load room', 500)
  }
}

/**
 * POST /api/rooms/[albumId]
 * Send a message to an album room.
 * Body: { content: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { albumId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return errorResponse('Message content is required', 400)
    }

    if (content.length > ROOM_MESSAGE_MAX_LENGTH) {
      return errorResponse(`Message must be ${ROOM_MESSAGE_MAX_LENGTH} characters or less`, 400)
    }

    // Check if album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check if user has reviewed this album
    const reviewCheck = await hasReviewedAlbum(user.id, albumId)
    if (!reviewCheck.reviewed) {
      return errorResponse('You must review this album to send messages', 403)
    }

    // Get or create room
    const room = await prisma.albumRoom.upsert({
      where: { albumId },
      create: { albumId },
      update: {},
    })

    // Create message with denormalized badge info
    const message = await prisma.roomMessage.create({
      data: {
        roomId: room.id,
        userId: user.id,
        content: content.trim(),
        userFirstSpinBadge: reviewCheck.badge,
        userReviewPosition: reviewCheck.reviewPosition,
      },
      include: {
        user: {
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

    // Update room stats
    await prisma.albumRoom.update({
      where: { id: room.id },
      data: {
        messageCount: { increment: 1 },
        lastActivity: new Date(),
      },
    })

    return successResponse({ message }, 201)
  } catch (error) {
    console.error('Failed to send room message:', error)
    return errorResponse('Failed to send message', 500)
  }
}
