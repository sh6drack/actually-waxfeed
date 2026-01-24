import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
  getPagination,
} from '@/lib/api-utils'
import { belongsToCircle, CIRCLE_MESSAGE_MAX_LENGTH, seedTasteCircles } from '@/lib/messaging'

interface RouteParams {
  params: Promise<{ archetype: string }>
}

/**
 * GET /api/circles/[archetype]
 * Get messages in a taste circle (requires user to have the archetype).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { archetype } = await params
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    // Ensure circles exist
    await seedTasteCircles()

    // Get circle
    const circle = await prisma.tasteCircle.findUnique({
      where: { archetype },
    })

    if (!circle) {
      return errorResponse('Circle not found', 404)
    }

    // Check if user belongs to this circle
    const isMember = await belongsToCircle(user.id, archetype)
    if (!isMember) {
      return errorResponse('You must have this archetype to join the circle', 403)
    }

    // Get user's TasteID for display
    const userTasteId = await prisma.tasteID.findUnique({
      where: { userId: user.id },
      select: {
        primaryArchetype: true,
        secondaryArchetype: true,
      },
    })

    // Get messages
    const messages = await prisma.circleMessage.findMany({
      where: { circleId: circle.id },
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
    const totalMessages = await prisma.circleMessage.count({
      where: { circleId: circle.id },
    })

    return successResponse({
      circle: {
        id: circle.id,
        archetype: circle.archetype,
        displayName: circle.displayName,
        description: circle.description,
        memberCount: circle.memberCount,
      },
      messages: messages.reverse(),
      pagination: {
        total: totalMessages,
        hasMore: skip + messages.length < totalMessages,
      },
      isPrimaryArchetype: userTasteId?.primaryArchetype === archetype,
    })
  } catch (error) {
    console.error('Failed to get circle:', error)
    return errorResponse('Failed to load circle', 500)
  }
}

/**
 * POST /api/circles/[archetype]
 * Send a message to a taste circle.
 * Body: { content: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { archetype } = await params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return errorResponse('Message content is required', 400)
    }

    if (content.length > CIRCLE_MESSAGE_MAX_LENGTH) {
      return errorResponse(`Message must be ${CIRCLE_MESSAGE_MAX_LENGTH} characters or less`, 400)
    }

    // Ensure circles exist
    await seedTasteCircles()

    // Get circle
    const circle = await prisma.tasteCircle.findUnique({
      where: { archetype },
    })

    if (!circle) {
      return errorResponse('Circle not found', 404)
    }

    // Check if user belongs to this circle
    const isMember = await belongsToCircle(user.id, archetype)
    if (!isMember) {
      return errorResponse('You must have this archetype to send messages', 403)
    }

    // Get user's TasteID for denormalization
    const userTasteId = await prisma.tasteID.findUnique({
      where: { userId: user.id },
      select: { primaryArchetype: true },
    })

    // Get user's tastemaker score
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tastemakeScore: true },
    })

    // Create message
    const message = await prisma.circleMessage.create({
      data: {
        circleId: circle.id,
        userId: user.id,
        content: content.trim(),
        userArchetype: userTasteId?.primaryArchetype || archetype,
        userTasteScore: userData?.tastemakeScore || 0,
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

    return successResponse({ message }, 201)
  } catch (error) {
    console.error('Failed to send circle message:', error)
    return errorResponse('Failed to send message', 500)
  }
}
