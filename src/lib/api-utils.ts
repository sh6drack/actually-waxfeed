import { NextResponse } from 'next/server'
import { auth } from './auth'
import { prisma } from './prisma'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status })
}

export async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session.user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

// Check if a user is blocked
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: { blockerId, blockedId }
    }
  })
  return !!block
}

// Check if users are friends
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const [id1, id2] = [userId1, userId2].sort()
  const friendship = await prisma.friendship.findUnique({
    where: {
      user1Id_user2Id: { user1Id: id1, user2Id: id2 }
    }
  })
  return !!friendship
}

// Check if user is following another
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId }
    }
  })
  return !!follow
}

// Update album stats
export async function updateAlbumStats(albumId: string) {
  const reviews = await prisma.review.findMany({
    where: { albumId },
    select: { rating: true }
  })

  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : null

  // Calculate rating distribution
  const distribution: Record<string, number> = {}
  for (let i = 0; i <= 10; i++) {
    distribution[i.toString()] = 0
  }
  for (const review of reviews) {
    const bucket = Math.round(review.rating).toString()
    distribution[bucket] = (distribution[bucket] || 0) + 1
  }

  await prisma.album.update({
    where: { id: albumId },
    data: {
      totalReviews,
      totalRatings: totalReviews,
      averageRating,
      ratingDistribution: distribution,
    }
  })
}

// Create notification helper
export async function createNotification(
  userId: string,
  type: string,
  content: Record<string, unknown>
) {
  // Check notification settings
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  })

  // Map notification types to settings fields
  const settingsMap: Record<string, string> = {
    reply: 'replies',
    like: 'likes',
    friend_request: 'friendRequests',
    friend_accept: 'friendRequests',
    new_follower: 'newFollowers',
    friend_review: 'friendReviews',
    review_trending: 'reviewTrending',
  }

  const settingKey = settingsMap[type]
  if (settings && settingKey) {
    const isEnabled = settings[settingKey as keyof typeof settings]
    if (!isEnabled) {
      return null // User has disabled this notification type
    }
  }

  return prisma.notification.create({
    data: {
      userId,
      type,
      content: content as object,
    }
  })
}

// Pagination helper
export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
