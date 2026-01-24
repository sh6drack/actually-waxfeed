import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/tracks/search - Search for tracks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const { limit, skip } = getPagination(searchParams)

    if (!query || query.length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400)
    }

    // Search tracks by name
    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        take: limit,
        skip,
        orderBy: [
          { totalReviews: 'desc' },
          { name: 'asc' }
        ],
        select: {
          id: true,
          spotifyId: true,
          name: true,
          trackNumber: true,
          durationMs: true,
          previewUrl: true,
          averageRating: true,
          totalReviews: true,
          album: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
              coverArtUrl: true,
              coverArtUrlMedium: true,
            }
          }
        }
      }),
      prisma.track.count({
        where: {
          name: { contains: query, mode: 'insensitive' }
        }
      })
    ])

    return successResponse({
      tracks,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: Math.floor(skip / limit) + 1,
      }
    })
  } catch (error) {
    console.error('Error searching tracks:', error)
    return errorResponse('Failed to search tracks', 500)
  }
}
