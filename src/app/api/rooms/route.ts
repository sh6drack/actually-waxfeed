import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  getAuthenticatedUser,
  getPagination,
} from '@/lib/api-utils'

/**
 * GET /api/rooms
 * List album rooms the user can access (albums they've reviewed).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)
    const sortBy = searchParams.get('sort') || 'activity' // activity, recent, alphabetical

    // Get albums the user has reviewed
    const userReviews = await prisma.review.findMany({
      where: { userId: user.id },
      select: { 
        albumId: true,
        reviewPosition: true,
        createdAt: true,
      },
    })

    const reviewedAlbumIds = userReviews.map(r => r.albumId)
    const reviewMap = new Map(userReviews.map(r => [r.albumId, r]))

    if (reviewedAlbumIds.length === 0) {
      return successResponse({
        rooms: [],
        message: 'Review albums to access their chat rooms',
      })
    }

    // Get or create rooms for these albums
    // First, ensure rooms exist
    for (const albumId of reviewedAlbumIds) {
      await prisma.albumRoom.upsert({
        where: { albumId },
        create: { albumId },
        update: {},
      })
    }

    // Build sort order
    let orderBy: Record<string, string> = {}
    if (sortBy === 'activity') {
      orderBy = { lastActivity: 'desc' }
    } else if (sortBy === 'recent') {
      orderBy = { createdAt: 'desc' }
    }

    // Get rooms with album info
    const rooms = await prisma.albumRoom.findMany({
      where: {
        albumId: { in: reviewedAlbumIds },
      },
      orderBy: sortBy === 'alphabetical' ? undefined : orderBy,
      take: limit,
      skip,
      include: {
        album: {
          select: {
            id: true,
            title: true,
            artistName: true,
            coverArtUrlMedium: true,
            totalReviews: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })

    // Sort alphabetically if needed (Prisma can't sort by relation field easily)
    let sortedRooms = rooms
    if (sortBy === 'alphabetical') {
      sortedRooms = [...rooms].sort((a, b) => 
        a.album.title.localeCompare(b.album.title)
      )
    }

    // Add user's badge info
    const roomsWithBadges = sortedRooms.map(room => {
      const review = reviewMap.get(room.albumId)
      let badge: string | null = null
      if (review?.reviewPosition) {
        if (review.reviewPosition <= 10) badge = 'gold'
        else if (review.reviewPosition <= 50) badge = 'silver'
        else if (review.reviewPosition <= 100) badge = 'bronze'
      }

      return {
        id: room.id,
        album: room.album,
        messageCount: room.messageCount,
        lastActivity: room.lastActivity,
        lastMessage: room.messages[0] || null,
        userBadge: badge,
        userReviewPosition: review?.reviewPosition || null,
      }
    })

    return successResponse({
      rooms: roomsWithBadges,
      totalReviewed: reviewedAlbumIds.length,
    })
  } catch (error) {
    console.error('Failed to list rooms:', error)
    return errorResponse('Failed to load rooms', 500)
  }
}
