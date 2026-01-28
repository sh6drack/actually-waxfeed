import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// GET /api/bookmarks - Get user's bookmarked albums
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const offset = (page - 1) * limit

    const [bookmarks, total] = await Promise.all([
      prisma.albumBookmark.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          album: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
              coverArtUrl: true,
              coverArtUrlSmall: true,
              coverArtUrlMedium: true,
              releaseDate: true,
              genres: true,
              averageRating: true,
              totalReviews: true,
            }
          }
        }
      }),
      prisma.albumBookmark.count({
        where: { userId: user.id }
      })
    ])

    return successResponse({
      bookmarks: bookmarks.map(b => ({
        id: b.id,
        createdAt: b.createdAt,
        album: b.album
      })),
      total,
      page,
      hasMore: offset + bookmarks.length < total
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error fetching bookmarks:', error)
    return errorResponse('Failed to fetch bookmarks', 500)
  }
}
