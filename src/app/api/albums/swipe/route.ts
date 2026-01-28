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

    // Include tracks in selection for preview playback
    const trackSelect = {
      tracks: {
        select: {
          id: true,
          name: true,
          trackNumber: true,
          previewUrl: true,
          durationMs: true,
        },
        where: { previewUrl: { not: null } },
        orderBy: { trackNumber: 'asc' as const },
        take: 3,
      },
    }

    const albumSelect = {
      id: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      coverArtUrlLarge: true,
      releaseDate: true,
      genres: true,
      ...trackSelect,
    }

    // For onboarding, return popular albums for broader appeal
    if (isOnboarding) {
      // First try: Get Billboard charting albums (most recognizable)
      let popularAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: reviewedIds },
          coverArtUrl: { not: null },
          billboardRank: { not: null },
        },
        select: albumSelect,
        take: limit * 2,
        orderBy: { billboardRank: 'asc' },
      })

      // Fallback: If not enough Billboard albums, get any albums with cover art
      if (popularAlbums.length < limit) {
        const fallbackAlbums = await prisma.album.findMany({
          where: {
            id: { notIn: [...reviewedIds, ...popularAlbums.map(a => a.id)] },
            coverArtUrl: { not: null },
            albumType: { not: 'single' },
          },
          select: albumSelect,
          take: (limit * 2) - popularAlbums.length,
          orderBy: [
            { totalReviews: 'desc' },
            { releaseDate: 'desc' },
          ],
        })
        popularAlbums = [...popularAlbums, ...fallbackAlbums]
      }

      // Deduplicate by title+artist combination
      const seenOnboarding = new Set<string>()
      const deduped = popularAlbums.filter(album => {
        const key = `${album.title.toLowerCase()}|${album.artistName.toLowerCase()}`
        if (seenOnboarding.has(key)) return false
        seenOnboarding.add(key)
        return true
      })

      // Shuffle and return
      const shuffled = deduped
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)

      return successResponse(shuffled)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PERSONALIZED ALGORITHM - Based on TasteID + Review History
    // ═══════════════════════════════════════════════════════════════════════

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

    // Get user's highly-rated albums for artist/genre inference
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
      orderBy: { createdAt: 'desc' },
    })

    // Extract favorite artists from reviews
    const favoriteArtists = [...new Set(likedReviews.map(r => r.album.artistName))]

    // Extract genres from liked albums
    const likedGenres = [...new Set(likedReviews.flatMap(r => r.album.genres))]

    // Combine with TasteID genres
    const userGenres = tasteId?.topGenres?.length
      ? [...new Set([...tasteId.topGenres, ...likedGenres])]
      : likedGenres

    // Determine adventureness - more adventurous users get more discovery
    const adventureness = tasteId?.adventurenessScore ?? 0.5
    const discoveryRatio = 0.2 + (adventureness * 0.3) // 20-50% discovery based on score

    let albums: Array<{
      id: string
      title: string
      artistName: string
      coverArtUrl: string | null
      coverArtUrlLarge: string | null
      releaseDate: Date
      genres: string[]
      tracks?: Array<{
        id: string
        name: string
        trackNumber: number
        previewUrl: string | null
        durationMs: number
      }>
    }> = []

    // Calculate allocation
    const artistAlloc = Math.ceil(limit * 0.25) // 25% - artists you like
    const genreAlloc = Math.ceil(limit * (0.55 - discoveryRatio)) // 35-55% - genres you like
    const discoveryAlloc = Math.ceil(limit * discoveryRatio) // 20-50% - expand your taste

    // ═══════════════════════════════════════════════════════════════════════
    // STRATEGY 1: Albums by favorite artists (25%)
    // ═══════════════════════════════════════════════════════════════════════
    if (favoriteArtists.length > 0) {
      const artistAlbums = await prisma.album.findMany({
        where: {
          artistName: { in: favoriteArtists.slice(0, 20) },
          id: { notIn: reviewedIds },
          coverArtUrl: { not: null },
        },
        select: albumSelect,
        take: artistAlloc * 2, // Get extra for shuffling
        orderBy: { releaseDate: 'desc' }, // Prioritize newer releases
      })

      // Shuffle artist albums
      const shuffledArtist = artistAlbums.sort(() => Math.random() - 0.5).slice(0, artistAlloc)
      albums.push(...shuffledArtist)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STRATEGY 2: Albums in user's genres - NO social proof requirement
    // ═══════════════════════════════════════════════════════════════════════
    if (userGenres.length > 0) {
      // Get albums in user's genres - don't require reviews
      const genreAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: [...reviewedIds, ...albums.map(a => a.id)] },
          coverArtUrl: { not: null },
          genres: { hasSome: userGenres.slice(0, 15) },
          albumType: { not: 'single' }, // Skip singles for better experience
        },
        select: albumSelect,
        take: genreAlloc * 3, // Get extra pool for randomization
        orderBy: { releaseDate: 'desc' },
      })

      // Shuffle and take allocation
      const shuffledGenre = genreAlbums.sort(() => Math.random() - 0.5).slice(0, genreAlloc)
      albums.push(...shuffledGenre)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STRATEGY 3: Discovery - albums OUTSIDE comfort zone
    // ═══════════════════════════════════════════════════════════════════════
    const currentIds = [...reviewedIds, ...albums.map(a => a.id)]

    // Get a random sample of albums outside user's main genres
    const discoveryAlbums = await prisma.album.findMany({
      where: {
        id: { notIn: currentIds },
        coverArtUrl: { not: null },
        albumType: { not: 'single' },
        // Exclude user's top genres for true discovery
        ...(userGenres.length >= 3 ? {
          NOT: {
            genres: { hasSome: userGenres.slice(0, 3) },
          },
        } : {}),
      },
      select: albumSelect,
      take: discoveryAlloc * 4, // Large pool for better randomization
      orderBy: { releaseDate: 'desc' },
    })

    // Randomly sample from discovery pool
    const shuffledDiscovery = discoveryAlbums.sort(() => Math.random() - 0.5).slice(0, discoveryAlloc)
    albums.push(...shuffledDiscovery)

    // ═══════════════════════════════════════════════════════════════════════
    // FALLBACK: Fill remaining slots with random quality albums
    // ═══════════════════════════════════════════════════════════════════════
    const remaining = limit - albums.length
    if (remaining > 0) {
      // Get a random sample of any albums with cover art
      const fallbackAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: [...reviewedIds, ...albums.map(a => a.id)] },
          coverArtUrl: { not: null },
          albumType: { not: 'single' },
        },
        select: albumSelect,
        take: remaining * 3,
        orderBy: { releaseDate: 'desc' },
      })

      const shuffledFallback = fallbackAlbums.sort(() => Math.random() - 0.5).slice(0, remaining)
      albums.push(...shuffledFallback)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FINAL: Deduplicate and shuffle for presentation
    // ═══════════════════════════════════════════════════════════════════════

    // Deduplicate by title+artist (same album can have different IDs)
    const seen = new Set<string>()
    albums = albums.filter(album => {
      const key = `${album.title.toLowerCase()}|${album.artistName.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Final shuffle - but weight artist matches higher (appear earlier)
    const finalAlbums = albums
      .map((album) => {
        const isArtistMatch = favoriteArtists.includes(album.artistName)
        const isGenreMatch = userGenres.some(g => album.genres.includes(g))
        // Artist matches: 0-0.3, Genre matches: 0.3-0.6, Discovery: 0.6-1.0
        const weight = isArtistMatch
          ? Math.random() * 0.3
          : isGenreMatch
            ? 0.3 + Math.random() * 0.3
            : 0.6 + Math.random() * 0.4
        return { album, weight }
      })
      .sort((a, b) => a.weight - b.weight)
      .map(({ album }) => album)
      .slice(0, limit)

    return successResponse(finalAlbums)

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error getting swipe albums:', error)
    return errorResponse('Failed to get albums', 500)
  }
}
