import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  requireAuth,
  getPagination,
  updateAlbumStats,
  createNotification
} from '@/lib/api-utils'
import { z } from 'zod'

const createReviewSchema = z.object({
  albumId: z.string().min(1),
  rating: z.number().min(0).max(10),
  text: z.string().max(5000).optional(),
})

// GET /api/reviews - List reviews (trending, recent, etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    const sort = searchParams.get('sort') || 'recent'
    const albumId = searchParams.get('albumId')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}

    if (albumId) {
      where.albumId = albumId
    }

    if (userId) {
      where.userId = userId
    }

    let orderBy: Record<string, string>[]
    switch (sort) {
      case 'popular':
        orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }]
        break
      case 'controversial':
        orderBy = [{ replyCount: 'desc' }, { createdAt: 'desc' }]
        break
      case 'highest':
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }]
        break
      case 'lowest':
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }]
        break
      default:
        orderBy = [{ createdAt: 'desc' }]
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
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
            }
          },
          _count: {
            select: { replies: true }
          }
        }
      }),
      prisma.review.count({ where }),
    ])

    return successResponse({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: Math.floor(skip / limit) + 1,
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return errorResponse('Failed to fetch reviews', 500)
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const validation = createReviewSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const { albumId, rating, text } = validation.data

    // Check album exists
    const album = await prisma.album.findUnique({ where: { id: albumId } })
    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check for existing review
    const existingReview = await prisma.review.findUnique({
      where: { userId_albumId: { userId: user.id, albumId } }
    })

    if (existingReview) {
      return errorResponse('You have already reviewed this album', 409)
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        albumId,
        rating,
        text,
      },
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
            title: true,
            artistName: true,
            coverArtUrl: true,
          }
        }
      }
    })

    // Update album stats
    await updateAlbumStats(albumId)

    // Delete any draft for this album
    await prisma.reviewDraft.deleteMany({
      where: { userId: user.id, albumId }
    })

    // Notify friends about new review
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      }
    })

    for (const friendship of friendships) {
      const friendId = friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id
      await createNotification(friendId, 'friend_review', {
        actorId: user.id,
        actorName: user.username || user.name,
        reviewId: review.id,
        albumTitle: album.title,
        albumId: album.id,
      })
    }

    return successResponse(review, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating review:', error)
    return errorResponse('Failed to create review', 500)
  }
}
