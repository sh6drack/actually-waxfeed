import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
  isBlocked,
  areFriends
} from '@/lib/api-utils'

// GET /api/users/[username] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await getAuthenticatedUser()

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bio: true,
        socialLinks: true,
        role: true,
        waxScore: true,
        premiumWaxScore: true,
        isPremium: true,
        isVerified: true,
        usernameChangesUsed: true,
        pinnedReviewId: true,
        pinnedListId: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            lists: true,
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
          }
        }
      }
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Check if blocked
    if (currentUser && await isBlocked(user.id, currentUser.id)) {
      return errorResponse('User not found', 404)
    }

    // Calculate stats
    const stats = {
      totalReviews: user._count.reviews,
      totalLists: user._count.lists,
      friends: user._count.friendshipsAsUser1 + user._count.friendshipsAsUser2,
    }

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      where: { userId: user.id },
      _avg: { rating: true }
    })

    // Get genre stats
    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        album: { select: { genres: true } }
      }
    })

    const genreCounts: Record<string, number> = {}
    for (const review of reviews) {
      for (const genre of review.album.genres) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }))

    // Get rating distribution
    const ratingDistribution: Record<string, number> = {}
    for (let i = 0; i <= 10; i++) {
      ratingDistribution[i.toString()] = 0
    }
    for (const review of reviews) {
      const bucket = Math.round(review.rating).toString()
      ratingDistribution[bucket]++
    }

    // Get pinned content
    let pinnedReview = null
    let pinnedList = null

    if (user.pinnedReviewId) {
      pinnedReview = await prisma.review.findUnique({
        where: { id: user.pinnedReviewId },
        include: {
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
    }

    if (user.pinnedListId) {
      pinnedList = await prisma.list.findUnique({
        where: { id: user.pinnedListId },
        include: {
          items: {
            take: 5,
            orderBy: { position: 'asc' },
            include: {
              album: {
                select: {
                  id: true,
                  coverArtUrl: true,
                  coverArtUrlMedium: true,
                }
              }
            }
          },
          _count: { select: { items: true } }
        }
      })
    }

    // Check relationship with current user
    let relationship = {
      isFriend: false,
      hasPendingRequest: false,
    }

    if (currentUser && currentUser.id !== user.id) {
      const [friends, pendingRequest] = await Promise.all([
        areFriends(currentUser.id, user.id),
        prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUser.id, receiverId: user.id, status: 'pending' },
              { senderId: user.id, receiverId: currentUser.id, status: 'pending' },
            ]
          }
        })
      ])

      relationship = {
        isFriend: friends,
        hasPendingRequest: !!pendingRequest,
      }
    }

    return successResponse({
      ...user,
      stats,
      averageRating: avgRating._avg.rating,
      topGenres,
      ratingDistribution,
      pinnedReview,
      pinnedList,
      relationship,
      isOwnProfile: currentUser?.id === user.id,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return errorResponse('Failed to fetch user profile', 500)
  }
}
