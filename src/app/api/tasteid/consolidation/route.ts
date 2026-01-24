import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'
import {
  computeTasteConsolidation,
  getConsolidationSummary,
  ArtistDNA,
} from '@/lib/tasteid'

/**
 * GET /api/tasteid/consolidation
 * Get the current user's taste consolidation analysis
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 401)
    }

    const userId = session.user.id

    // Get TasteID
    const tasteId = await prisma.tasteID.findUnique({
      where: { userId },
    })

    if (!tasteId) {
      return errorResponse('TasteID not found', 404)
    }

    // Get reviews for consolidation analysis
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        album: {
          select: {
            genres: true,
            artistName: true,
            releaseDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (reviews.length < 10) {
      return successResponse({
        consolidation: [],
        summary: {
          headline: 'Building your taste profile',
          details: 'Keep reviewing to see what tastes stick!',
          coreGenres: [],
          coreArtists: [],
        },
      })
    }

    const genreVector = tasteId.genreVector as Record<string, number>
    const artistDNA = tasteId.artistDNA as unknown as ArtistDNA[]

    const consolidation = computeTasteConsolidation(
      reviews.map(r => ({
        rating: r.rating,
        createdAt: r.createdAt,
        album: r.album,
      })),
      genreVector,
      artistDNA
    )

    const summary = getConsolidationSummary(consolidation)

    return successResponse({
      consolidation,
      summary,
    })
  } catch (error) {
    console.error('Error computing consolidation:', error)
    return errorResponse('Failed to compute consolidation', 500)
  }
}
