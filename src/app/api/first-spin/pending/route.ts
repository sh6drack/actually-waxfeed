import { NextRequest } from 'next/server'
import { successResponse, errorResponse, getAuthenticatedUser } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

// GET /api/first-spin/pending - Get user's potential badges (albums they reviewed that might trend)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return successResponse({ pending: [], count: 0 })
    }

    // Find albums user reviewed that are approaching trending (50-99 reviews)
    // and where their position would qualify for a badge (<=100)
    const pendingBadges = await prisma.review.findMany({
      where: {
        userId: user.id,
        reviewPosition: { lte: 100 },
        album: {
          isTrending: false,
          totalReviews: { gte: 30 }, // Only show if album has some traction
        }
      },
      orderBy: {
        album: { totalReviews: 'desc' }
      },
      take: 10,
      select: {
        id: true,
        reviewPosition: true,
        createdAt: true,
        album: {
          select: {
            id: true,
            spotifyId: true,
            title: true,
            artistName: true,
            coverArtUrl: true,
            totalReviews: true,
          }
        }
      }
    })

    // Calculate potential badge for each
    const pending = pendingBadges.map(review => {
      const position = review.reviewPosition || 999
      let potentialBadge: 'GOLD' | 'SILVER' | 'BRONZE' | null = null
      let potentialWax = 0

      if (position <= 10) {
        potentialBadge = 'GOLD'
        potentialWax = 100
      } else if (position <= 50) {
        potentialBadge = 'SILVER'
        potentialWax = 50
      } else if (position <= 100) {
        potentialBadge = 'BRONZE'
        potentialWax = 25
      }

      const progress = Math.min((review.album.totalReviews / 100) * 100, 100)
      const reviewsToTrend = Math.max(100 - review.album.totalReviews, 0)

      return {
        reviewId: review.id,
        position,
        potentialBadge,
        potentialWax,
        progress,
        reviewsToTrend,
        album: review.album,
      }
    })

    // Count albums that are very close (80+)
    const closeCount = pending.filter(p => p.album.totalReviews >= 80).length

    return successResponse({ 
      pending,
      count: pending.length,
      closeCount,
    })

  } catch (error) {
    console.error('Error getting pending badges:', error)
    return errorResponse('Failed to get pending badges', 500)
  }
}
