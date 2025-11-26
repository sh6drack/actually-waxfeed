import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/albums - List albums with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    const sortBy = searchParams.get('sort') || 'recent'
    const genre = searchParams.get('genre')
    const albumType = searchParams.get('type')

    const where: Record<string, unknown> = {}

    if (genre) {
      where.genres = { has: genre }
    }

    if (albumType && albumType !== 'all') {
      where.albumType = albumType
    }

    let orderBy: Record<string, string>
    switch (sortBy) {
      case 'rating':
        orderBy = { averageRating: 'desc' }
        break
      case 'reviews':
        orderBy = { totalReviews: 'desc' }
        break
      case 'release':
        orderBy = { releaseDate: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          releaseDate: true,
          coverArtUrl: true,
          coverArtUrlMedium: true,
          genres: true,
          albumType: true,
          averageRating: true,
          totalReviews: true,
        },
      }),
      prisma.album.count({ where }),
    ])

    return successResponse({
      albums,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: Math.floor(skip / limit) + 1,
      },
    })
  } catch (error) {
    console.error('Error fetching albums:', error)
    return errorResponse('Failed to fetch albums', 500)
  }
}
