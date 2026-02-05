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

export async function requireAdmin() {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }
  return user
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize user-generated text to prevent XSS
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

// ============================================
// SECURE LOGGING
// ============================================

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'cookie']

function sanitizeForLogging(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const sanitized = { ...data as Record<string, unknown> }
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }
  return sanitized
}

export function secureLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data ? sanitizeForLogging(data) : '')
  }
}

export function secureError(message: string, error?: unknown): void {
  const sanitized = error instanceof Error
    ? { message: error.message, name: error.name }
    : sanitizeForLogging(error)
  console.error(message, sanitized)
}

export function hasPremiumAccess(user: { role?: string; isPremium?: boolean }): boolean {
  return user.role === 'ADMIN' || user.role === 'PREMIUM' || user.isPremium === true
}

export function isAdmin(user: { role?: string }): boolean {
  return user.role === 'ADMIN'
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

export async function updateAlbumStats(albumId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { albumId },
    select: { rating: true }
  })

  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : null

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

  // Dynamic import to avoid circular dependencies
  const { checkAlbumTrending } = await import('./first-spin')
  await checkAlbumTrending(albumId)
}

const NOTIFICATION_SETTINGS_MAP: Record<string, string> = {
  reply: 'replies',
  like: 'likes',
  friend_request: 'friendRequests',
  friend_accept: 'friendRequests',
  friend_review: 'friendReviews',
  review_trending: 'reviewTrending',
}

export async function createNotification(
  userId: string,
  type: string,
  content: Record<string, unknown>
) {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  })

  const settingKey = NOTIFICATION_SETTINGS_MAP[type]
  if (settings && settingKey) {
    const isEnabled = settings[settingKey as keyof typeof settings]
    if (!isEnabled) {
      return null
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

export function getPagination(searchParams: URLSearchParams): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
