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
  isQuickRate: z.boolean().optional(), // Quick rate mode (swipe) - no text required, no First Spin
  vibes: z.array(z.string()).max(3).optional(), // Vibe tags for TasteID Polarity Model
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

    const { albumId, rating, text, isQuickRate, vibes } = validation.data

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

    // Calculate review position (First Spin tracking)
    const currentReviewCount = await prisma.review.count({
      where: { albumId }
    })
    const reviewPosition = currentReviewCount + 1

    // ANTI-GAMING: First 100 reviews MUST have written text
    // This prevents people from spamming empty reviews just to get Gold/Silver/Bronze Spins
    // Exception: Quick rate mode (swipe) bypasses this but doesn't qualify for First Spin badges
    const MIN_REVIEW_LENGTH = 20 // At least 20 characters
    const FIRST_SPIN_THRESHOLD = 100

    if (reviewPosition <= FIRST_SPIN_THRESHOLD && !isQuickRate) {
      if (!text || text.trim().length < MIN_REVIEW_LENGTH) {
        return errorResponse(
          `The first ${FIRST_SPIN_THRESHOLD} reviews must include a written review (at least ${MIN_REVIEW_LENGTH} characters). ` +
          `You're position #${reviewPosition} - share your thoughts to earn your spot!`,
          400
        )
      }
    }

    // Create review with position and vibes
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        albumId,
        rating,
        text,
        vibes: vibes || [], // Store vibe tags for TasteID Polarity Model
        reviewPosition,
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
            totalReviews: true,
          }
        }
      }
    })

    // Update album stats
    await updateAlbumStats(albumId)

    // Update user streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastReviewDate: true, currentStreak: true, longestStreak: true }
    })

    if (userData) {
      let newStreak = 1
      if (userData.lastReviewDate) {
        const lastReview = new Date(userData.lastReviewDate)
        lastReview.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === 0) {
          // Same day, keep current streak
          newStreak = userData.currentStreak
        } else if (daysDiff === 1) {
          // Next day, increment streak
          newStreak = userData.currentStreak + 1
        }
        // If daysDiff > 1, streak resets to 1
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, userData.longestStreak),
          lastReviewDate: new Date(),
        }
      })
    }

    // Delete any draft for this album
    await prisma.reviewDraft.deleteMany({
      where: { userId: user.id, albumId }
    })

    // First Spin: Simple +5 Wax for any review (no complex rules)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          waxBalance: { increment: 5 },
          lifetimeWaxEarned: { increment: 5 },
        }
      })
      
      await prisma.waxTransaction.create({
        data: {
          userId: user.id,
          amount: 5,
          type: 'REVIEW_REWARD',
          description: `Review: ${album.title}`,
          metadata: { albumId, reviewId: review.id, position: reviewPosition }
        }
      })
    } catch (error) {
      console.error('Error granting wax:', error)
    }

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

    // Quick rates don't qualify for First Spin badges
    const firstSpinMessage = isQuickRate ? null : (
      reviewPosition <= 10
        ? `You're reviewer #${reviewPosition}! If this album trends, you'll earn a Gold Spin.`
        : reviewPosition <= 50
          ? `You're reviewer #${reviewPosition}! If this album trends, you'll earn a Silver Spin.`
          : reviewPosition <= 100
            ? `You're reviewer #${reviewPosition}! If this album trends, you'll earn a Bronze Spin.`
            : null
    )

    return successResponse({
      ...review,
      reviewPosition,
      waxEarned: 5,
      isQuickRate: !!isQuickRate,
      firstSpinMessage,
    }, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating review:', error)
    return errorResponse('Failed to create review', 500)
  }
}
