import { NextRequest } from 'next/server'
import { successResponse, errorResponse, getPagination } from '@/lib/api-utils'
import { searchAndImportAlbums, searchAlbums } from '@/lib/spotify'
import { prisma } from '@/lib/prisma'

// GET /api/albums/search - Search albums (Spotify + local)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const source = searchParams.get('source') || 'both' // 'spotify', 'local', 'both'
    const { limit } = getPagination(searchParams)

    if (!query || query.trim().length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400)
    }

    const results: {
      spotify: Awaited<ReturnType<typeof searchAlbums>>['albums']
      local: {
        id: string
        spotifyId: string
        title: string
        artistName: string
        releaseDate: Date
        coverArtUrl: string | null
        coverArtUrlMedium: string | null
        genres: string[]
        albumType: string
        averageRating: number | null
        totalReviews: number
      }[]
    } = {
      spotify: [],
      local: [],
    }

    // Search local database
    if (source === 'local' || source === 'both') {
      results.local = await prisma.album.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { artistName: { contains: query, mode: 'insensitive' } },
              ]
            },
            // CRITICAL: NEVER show singles
            { albumType: { not: 'single' } }
          ]
        },
        take: limit,
        orderBy: { totalReviews: 'desc' },
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
        }
      })
    }

    // Search Spotify and import
    if (source === 'spotify' || source === 'both') {
      try {
        const { albums } = await searchAlbums(query, limit)
        results.spotify = albums
      } catch (error) {
        console.error('Spotify search error:', error)
        // Continue with local results if Spotify fails
      }
    }

    return successResponse(results)
  } catch (error) {
    console.error('Error searching albums:', error)
    return errorResponse('Failed to search albums', 500)
  }
}

// POST /api/albums/search - Search and import albums to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 20 } = body

    if (!query || query.trim().length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400)
    }

    const { albums } = await searchAndImportAlbums(query, limit)

    return successResponse({
      imported: albums.length,
      albums,
    })
  } catch (error) {
    console.error('Error importing albums:', error)
    return errorResponse('Failed to import albums', 500)
  }
}
