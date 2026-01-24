import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
} from '@/lib/api-utils'
import { seedTasteCircles, TASTE_CIRCLES } from '@/lib/messaging'

/**
 * GET /api/circles
 * List taste circles the user belongs to (based on their archetypes).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    // Ensure circles exist
    await seedTasteCircles()

    // Get user's TasteID
    const tasteId = await prisma.tasteID.findUnique({
      where: { userId: user.id },
      select: {
        primaryArchetype: true,
        secondaryArchetype: true,
      },
    })

    if (!tasteId) {
      return successResponse({
        userCircles: [],
        allCircles: TASTE_CIRCLES.map(c => ({
          ...c,
          memberCount: 0,
          isMember: false,
        })),
        message: 'Review more albums to discover your taste archetype!',
      })
    }

    const userArchetypes = [
      tasteId.primaryArchetype,
      tasteId.secondaryArchetype,
    ].filter(Boolean) as string[]

    // Get all circles with member counts
    const circles = await prisma.tasteCircle.findMany({
      orderBy: { memberCount: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
    })

    // Update member counts (could be done as a background job)
    for (const circle of circles) {
      const count = await prisma.tasteID.count({
        where: {
          OR: [
            { primaryArchetype: circle.archetype },
            { secondaryArchetype: circle.archetype },
          ],
        },
      })
      if (count !== circle.memberCount) {
        await prisma.tasteCircle.update({
          where: { id: circle.id },
          data: { memberCount: count },
        })
        circle.memberCount = count
      }
    }

    // Separate user's circles from others
    const userCircles = circles.filter(c => userArchetypes.includes(c.archetype))
    const otherCircles = circles.filter(c => !userArchetypes.includes(c.archetype))

    return successResponse({
      userArchetypes,
      userCircles: userCircles.map(c => ({
        id: c.id,
        archetype: c.archetype,
        displayName: c.displayName,
        description: c.description,
        memberCount: c.memberCount,
        lastMessage: c.messages[0] || null,
        isPrimary: c.archetype === tasteId.primaryArchetype,
      })),
      otherCircles: otherCircles.map(c => ({
        id: c.id,
        archetype: c.archetype,
        displayName: c.displayName,
        description: c.description,
        memberCount: c.memberCount,
      })),
    })
  } catch (error) {
    console.error('Failed to list circles:', error)
    return errorResponse('Failed to load circles', 500)
  }
}
