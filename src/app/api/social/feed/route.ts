import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, getAuthenticatedUser, getPagination } from '@/lib/api-utils'

// GET /api/social/feed - Get personalized feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)
    const filter = searchParams.get('filter') || 'everyone' // 'everyone', 'friends'

    const currentUser = await getAuthenticatedUser()

    if (filter === 'friends' && !currentUser) {
      return errorResponse('Authentication required for friends feed', 401)
    }

    // Get blocked users to filter out
    let blockedIds: string[] = []
    let friendIds: string[] = []

    if (currentUser) {
      const [blocked, friendships] = await Promise.all([
        prisma.block.findMany({
          where: {
            OR: [
              { blockerId: currentUser.id },
              { blockedId: currentUser.id }
            ]
          },
          select: { blockerId: true, blockedId: true }
        }),
        prisma.friendship.findMany({
          where: {
            OR: [
              { user1Id: currentUser.id },
              { user2Id: currentUser.id }
            ]
          },
          select: { user1Id: true, user2Id: true }
        })
      ])

      blockedIds = blocked.flatMap(b => [b.blockerId, b.blockedId])
        .filter(id => id !== currentUser.id)

      friendIds = friendships.map(f =>
        f.user1Id === currentUser.id ? f.user2Id : f.user1Id
      )
    }

    // Build where clause
    const baseWhere = {
      userId: { notIn: blockedIds },
    }

    let reviews
    let total

    if (filter === 'friends' && friendIds.length > 0) {
      // Friends-only feed
      [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: {
            ...baseWhere,
            userId: { in: friendIds },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                image: true,
                isVerified: true,
              }
            },
            album: {
              select: {
                id: true,
                spotifyId: true,
                title: true,
                artistName: true,
                coverArtUrl: true,
                coverArtUrlMedium: true,
                genres: true,
              }
            },
            _count: {
              select: { replies: true, likes: true }
            }
          }
        }),
        prisma.review.count({
          where: {
            ...baseWhere,
            userId: { in: friendIds },
          }
        })
      ])
    } else {
      // Everyone feed with smart prioritization
      // Get reviews with scoring for prioritization

      // First, get friends' recent activity (highest priority)
      const friendReviews = friendIds.length > 0 ? await prisma.review.findMany({
        where: {
          ...baseWhere,
          userId: { in: friendIds },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        },
        orderBy: { createdAt: 'desc' },
        take: Math.floor(limit / 2),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
              isVerified: true,
            }
          },
          album: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
              coverArtUrl: true,
              coverArtUrlMedium: true,
              genres: true,
            }
          },
          _count: {
            select: { replies: true, likes: true }
          }
        }
      }) : []

      // Then, get trending reviews
      const trendingReviews = await prisma.review.findMany({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          userId: { notIn: [...(friendIds || []), ...(blockedIds || [])] }
        },
        orderBy: [
          { likeCount: 'desc' },
          { replyCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: Math.floor(limit / 2),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
              isVerified: true,
            }
          },
          album: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
              coverArtUrl: true,
              coverArtUrlMedium: true,
              genres: true,
            }
          },
          _count: {
            select: { replies: true, likes: true }
          }
        }
      })

      // Merge and dedupe
      const seenIds = new Set<string>()
      reviews = []

      for (const review of [...friendReviews, ...trendingReviews]) {
        if (!seenIds.has(review.id)) {
          seenIds.add(review.id)
          reviews.push({
            ...review,
            feedSource: friendReviews.includes(review) ? 'friend' : 'trending'
          })
        }
      }

      // If not enough, fill with recent reviews
      if (reviews.length < limit) {
        const fillReviews = await prisma.review.findMany({
          where: {
            ...baseWhere,
            id: { notIn: Array.from(seenIds) }
          },
          orderBy: { createdAt: 'desc' },
          take: limit - reviews.length,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                image: true,
                isVerified: true,
              }
            },
            album: {
              select: {
                id: true,
                spotifyId: true,
                title: true,
                artistName: true,
                coverArtUrl: true,
                coverArtUrlMedium: true,
                genres: true,
              }
            },
            _count: {
              select: { replies: true, likes: true }
            }
          }
        })

        reviews = [...reviews, ...fillReviews.map(r => ({ ...r, feedSource: 'recent' }))]
      }

      total = await prisma.review.count({ where: baseWhere })
    }

    return successResponse({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: Math.floor(skip / limit) + 1,
      }
    })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return errorResponse('Failed to fetch feed', 500)
  }
}
