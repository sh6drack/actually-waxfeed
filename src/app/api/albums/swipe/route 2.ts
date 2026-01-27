import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

// GET /api/albums/swipe - Get personalized albums for Quick Rate mode
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const isOnboarding = searchParams.get('onboarding') === 'true'

    // Get IDs of albums the user has already reviewed
    const reviewedAlbumIds = await prisma.review.findMany({
      where: { userId: user.id },
      select: { albumId: true },
    })
    const reviewedIds = reviewedAlbumIds.map(r => r.albumId)

    // For onboarding, return popular/well-reviewed albums for broader appeal
    if (isOnboarding) {
      const popularAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: reviewedIds },
          coverArtUrl: { not: null },
          totalReviews: { gte: 3 },
          averageRating: { gte: 6 },
        },
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          releaseDate: true,
          genres: true,
        },
        take: limit * 2, // Get extra for shuffling
        orderBy: [
          { totalReviews: 'desc' },
          { averageRating: 'desc' },
        ],
      })

      // Shuffle and return
      const shuffled = popularAlbums
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)

      return successResponse(shuffled)
    }

    // Get user's TasteID for personalization
    const tasteId = await prisma.tasteID.findUnique({
      where: { userId: user.id },
      select: {
        topGenres: true,
        topArtists: true,
        genreVector: true,
        adventurenessScore: true,
      },
    })

    // Get user's highly-rated albums for artist inference
    const likedReviews = await prisma.review.findMany({
      where: {
        userId: user.id,
        rating: { gte: 7 },
      },
      include: {
        album: {
          select: { artistName: true, genres: true },
        },
      },
      take: 50,
    })

    // Extract favorite artists from reviews
    const favoriteArtists = [...new Set(likedReviews.map(r => r.album.artistName))]

    // Extract genres from liked albums (more reliable than TasteID sometimes)
    const likedGenres = [...new Set(likedReviews.flatMap(r => r.album.genres))]

    // Combine with TasteID genres
    const userGenres = tasteId?.topGenres?.length
      ? [...new Set([...tasteId.topGenres, ...likedGenres])]
      : likedGenres

    let albums: Array<{
      id: string
      title: string
      artistName: string
      coverArtUrl: string | null
      coverArtUrlLarge: string | null
      releaseDate: Date
      genres: string[]
    }> = []

    // Strategy 1: Albums by favorite artists (30% of results)
    if (favoriteArtists.length > 0) {
      const artistAlbums = await prisma.album.findMany({
        where: {
          artistName: { in: favoriteArtists.slice(0, 20) },
          id: { notIn: reviewedIds },
          coverArtUrl: { not: null },
        },
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          releaseDate: true,
          genres: true,
        },
        take: Math.ceil(limit * 0.3),
        orderBy: { totalReviews: 'desc' },
      })
      albums.push(...artistAlbums)
    }

    // Strategy 2: Albums in user's genres (50% of results)
    if (userGenres.length > 0) {
      const genreAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: [...reviewedIds, ...albums.map(a => a.id)] },
          coverArtUrl: { not: null },
          genres: { hasSome: userGenres.slice(0, 10) },
          totalReviews: { gte: 1 }, // Some social proof
        },
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          releaseDate: true,
          genres: true,
        },
        take: Math.ceil(limit * 0.5),
        orderBy: [
          { averageRating: 'desc' },
          { totalReviews: 'desc' },
        ],
      })
      albums.push(...genreAlbums)
    }

    // Strategy 3: Discovery - well-rated albums outside comfort zone (20% of results)
    const discoveryCount = limit - albums.length
    if (discoveryCount > 0) {
      const discoveryAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: [...reviewedIds, ...albums.map(a => a.id)] },
          coverArtUrl: { not: null },
          averageRating: { gte: 7 }, // Only highly-rated discoveries
          totalReviews: { gte: 5 }, // Social proof
          // Exclude user's main genres for discovery
          ...(userGenres.length > 0 ? {
            NOT: {
              genres: { hasSome: userGenres.slice(0, 3) }, // Avoid top 3 genres
            },
          } : {}),
        },
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          releaseDate: true,
          genres: true,
        },
        take: discoveryCount,
        orderBy: { averageRating: 'desc' },
      })
      albums.push(...discoveryAlbums)
    }

    // Fallback: If we still don't have enough, get popular albums
    const remaining = limit - albums.length
    if (remaining > 0) {
      const fallbackAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: [...reviewedIds, ...albums.map(a => a.id)] },
          coverArtUrl: { not: null },
          totalReviews: { gte: 1 },
        },
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          releaseDate: true,
          genres: true,
        },
        take: remaining,
        orderBy: [
          { averageRating: 'desc' },
          { totalReviews: 'desc' },
        ],
      })
      albums.push(...fallbackAlbums)
    }

    // Deduplicate
    const seen = new Set<string>()
    albums = albums.filter(album => {
      if (seen.has(album.id)) return false
      seen.add(album.id)
      return true
    })

    // Shuffle for variety (but keep some taste-matched ones near the top)
    const shuffled = albums
      .map((album, index) => ({ album, sortKey: index < 5 ? Math.random() * 0.5 : Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ album }) => album)
      .slice(0, limit)

    return successResponse(shuffled)

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error getting swipe albums:', error)
    return errorResponse('Failed to get albums', 500)
  }
}
