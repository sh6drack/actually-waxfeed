import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'

const MIN_REVIEWS_REQUIRED = 10

// Algorithm weights - tune these for different recommendation styles
const WEIGHTS = {
  GENRE_MATCH: 0.35,        // How much to weight genre preferences
  RATING_QUALITY: 0.25,     // Prefer albums with good community ratings
  DISCOVERY: 0.20,          // Chance for pure discovery (outside comfort zone)
  COLLABORATIVE: 0.15,      // What similar taste users liked
  FRESHNESS: 0.05,          // Slight boost for newer releases
}

// Rating thresholds
const HIGH_RATING_THRESHOLD = 7.5
const MIN_REVIEWS_FOR_QUALITY = 3

interface ScoredAlbum {
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
  score: number
  scoreBreakdown: {
    genre: number
    quality: number
    collaborative: number
    freshness: number
  }
}

// GET /api/albums/random - Get a smart, personalized random album
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const mode = searchParams.get('mode') || 'smart' // 'smart' | 'discovery' | 'quality' | 'pure-random'

    if (!userId) {
      return errorResponse('Sign in to use Spin the Wheel', 401)
    }

    // Get user's reviews with ratings for preference analysis
    const userReviews = await prisma.review.findMany({
      where: { userId },
      include: {
        album: {
          select: {
            id: true,
            genres: true,
            artistName: true,
          },
        },
      },
    })

    if (userReviews.length < MIN_REVIEWS_REQUIRED) {
      return errorResponse(
        `You need at least ${MIN_REVIEWS_REQUIRED} reviews to unlock Spin the Wheel. You have ${userReviews.length}.`,
        403
      )
    }

    const reviewedAlbumIds = new Set(userReviews.map(r => r.album.id))
    const reviewedArtists = new Set(userReviews.map(r => r.album.artistName))

    // Build user taste profile
    const tasteProfile = buildTasteProfile(userReviews)

    // Find users with similar taste for collaborative filtering
    const similarUserIds = await findSimilarUsers(userId, tasteProfile.topGenres)

    // Get candidate albums
    const candidates = await getCandidateAlbums(
      reviewedAlbumIds,
      tasteProfile,
      mode
    )

    if (candidates.length === 0) {
      return errorResponse('No albums available to discover', 404)
    }

    // Score and rank candidates
    const scoredAlbums = await scoreAlbums(
      candidates,
      tasteProfile,
      similarUserIds,
      reviewedArtists,
      mode
    )

    // Select album using weighted random from top candidates
    const selectedAlbum = selectFromTopCandidates(scoredAlbums, mode)

    if (!selectedAlbum) {
      return errorResponse('No album found', 404)
    }

    // Determine why this album was recommended
    const recommendationReason = getRecommendationReason(selectedAlbum, tasteProfile)

    return successResponse({
      album: {
        id: selectedAlbum.id,
        spotifyId: selectedAlbum.spotifyId,
        title: selectedAlbum.title,
        artistName: selectedAlbum.artistName,
        releaseDate: selectedAlbum.releaseDate,
        coverArtUrl: selectedAlbum.coverArtUrl,
        coverArtUrlMedium: selectedAlbum.coverArtUrlMedium,
        genres: selectedAlbum.genres,
        albumType: selectedAlbum.albumType,
        averageRating: selectedAlbum.averageRating,
        totalReviews: selectedAlbum.totalReviews,
      },
      recommendation: {
        reason: recommendationReason,
        score: Math.round(selectedAlbum.score * 100),
        breakdown: selectedAlbum.scoreBreakdown,
        mode,
      },
      userStats: {
        reviewCount: userReviews.length,
        topGenres: tasteProfile.topGenres.slice(0, 3),
        averageRating: tasteProfile.averageRating,
      },
    })
  } catch (error) {
    console.error('Error fetching random album:', error)
    return errorResponse('Failed to fetch random album', 500)
  }
}

interface TasteProfile {
  topGenres: string[]
  genreWeights: Record<string, number>
  averageRating: number
  ratingVariance: number
  preferredDecades: string[]
  highRatedGenres: string[] // Genres user rates highly
}

function buildTasteProfile(userReviews: Array<{
  rating: number
  album: { genres: string[]; artistName: string }
}>): TasteProfile {
  const genreCount: Record<string, number> = {}
  const genreRatingSum: Record<string, number> = {}
  const genreRatingCount: Record<string, number> = {}
  let totalRating = 0

  for (const review of userReviews) {
    totalRating += review.rating

    for (const genre of review.album.genres) {
      genreCount[genre] = (genreCount[genre] || 0) + 1
      genreRatingSum[genre] = (genreRatingSum[genre] || 0) + review.rating
      genreRatingCount[genre] = (genreRatingCount[genre] || 0) + 1
    }
  }

  const averageRating = totalRating / userReviews.length

  // Calculate rating variance to understand if user is generous or harsh critic
  const ratingVariance = userReviews.reduce(
    (sum, r) => sum + Math.pow(r.rating - averageRating, 2),
    0
  ) / userReviews.length

  // Sort genres by frequency
  const sortedGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)

  // Calculate genre weights (normalized)
  const totalGenreCount = Object.values(genreCount).reduce((a, b) => a + b, 0)
  const genreWeights: Record<string, number> = {}
  for (const [genre, count] of Object.entries(genreCount)) {
    genreWeights[genre] = count / totalGenreCount
  }

  // Find genres user rates highly (above their average)
  const highRatedGenres = Object.entries(genreRatingSum)
    .filter(([genre]) => genreRatingCount[genre] >= 2)
    .map(([genre, sum]) => ({
      genre,
      avgRating: sum / genreRatingCount[genre],
    }))
    .filter(g => g.avgRating > averageRating + 0.5)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5)
    .map(g => g.genre)

  return {
    topGenres: sortedGenres.slice(0, 10),
    genreWeights,
    averageRating,
    ratingVariance,
    preferredDecades: [], // Could expand this based on releaseDate analysis
    highRatedGenres,
  }
}

async function findSimilarUsers(
  userId: string,
  userTopGenres: string[]
): Promise<string[]> {
  if (userTopGenres.length === 0) return []

  // Find users who have reviewed albums in similar genres with similar ratings
  const similarUsers = await prisma.review.groupBy({
    by: ['userId'],
    where: {
      userId: { not: userId },
      album: {
        genres: { hasSome: userTopGenres.slice(0, 3) },
      },
      rating: { gte: 6 }, // Users who liked similar genre albums
    },
    _count: { userId: true },
    having: {
      userId: { _count: { gte: 3 } }, // At least 3 overlapping tastes
    },
    orderBy: { _count: { userId: 'desc' } },
    take: 20,
  })

  return similarUsers.map(u => u.userId)
}

async function getCandidateAlbums(
  reviewedAlbumIds: Set<string>,
  tasteProfile: TasteProfile,
  mode: string
): Promise<Array<{
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
}>> {
  const baseWhere = {
    albumType: { not: 'single' },
    coverArtUrl: { not: null },
    id: { notIn: Array.from(reviewedAlbumIds) },
  }

  // Different candidate selection based on mode
  let whereClause: Record<string, unknown> = baseWhere

  if (mode === 'quality') {
    // Focus on highly-rated albums
    whereClause = {
      ...baseWhere,
      averageRating: { gte: HIGH_RATING_THRESHOLD },
      totalReviews: { gte: MIN_REVIEWS_FOR_QUALITY },
    }
  } else if (mode === 'discovery') {
    // Explicitly avoid user's top genres for maximum discovery
    whereClause = {
      ...baseWhere,
      NOT: {
        genres: { hasSome: tasteProfile.topGenres.slice(0, 3) },
      },
    }
  } else if (mode === 'smart') {
    // Mix of familiar and new - get a broad candidate pool
    // No additional filters, scoring will handle preferences
  }

  // Get more candidates than we need for better selection
  const candidateCount = await prisma.album.count({ where: whereClause })
  const sampleSize = Math.min(100, candidateCount)

  if (sampleSize === 0) {
    // Fallback to base where if filtered search returns nothing
    return prisma.album.findMany({
      where: baseWhere,
      take: 50,
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
      },
    })
  }

  // Random sampling with skip
  const randomOffset = Math.floor(Math.random() * Math.max(1, candidateCount - sampleSize))

  return prisma.album.findMany({
    where: whereClause,
    skip: randomOffset,
    take: sampleSize,
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
  })
}

async function scoreAlbums(
  candidates: Array<{
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
  }>,
  tasteProfile: TasteProfile,
  similarUserIds: string[],
  reviewedArtists: Set<string>,
  mode: string
): Promise<ScoredAlbum[]> {
  // Get albums that similar users have rated highly
  const collaborativeBoostIds = new Set<string>()

  if (similarUserIds.length > 0) {
    const similarUserFavorites = await prisma.review.findMany({
      where: {
        userId: { in: similarUserIds },
        rating: { gte: 8 },
        albumId: { in: candidates.map(c => c.id) },
      },
      select: { albumId: true },
    })
    similarUserFavorites.forEach(r => collaborativeBoostIds.add(r.albumId))
  }

  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  return candidates.map(album => {
    const breakdown = {
      genre: 0,
      quality: 0,
      collaborative: 0,
      freshness: 0,
    }

    // 1. Genre match score
    const matchingGenres = album.genres.filter(g => tasteProfile.topGenres.includes(g))
    const highRatedMatch = album.genres.filter(g => tasteProfile.highRatedGenres.includes(g))

    // Weight by how much user listens to these genres
    breakdown.genre = matchingGenres.reduce(
      (sum, g) => sum + (tasteProfile.genreWeights[g] || 0),
      0
    )
    // Bonus for genres user rates highly
    breakdown.genre += highRatedMatch.length * 0.1

    // Normalize to 0-1
    breakdown.genre = Math.min(1, breakdown.genre)

    // 2. Quality score (community rating)
    if (album.averageRating && album.totalReviews >= MIN_REVIEWS_FOR_QUALITY) {
      // Normalize rating to 0-1 scale (assuming 0-10 ratings)
      breakdown.quality = (album.averageRating - 5) / 5 // -1 to 1 range
      breakdown.quality = Math.max(0, (breakdown.quality + 1) / 2) // 0 to 1
    } else if (album.averageRating) {
      // Lower confidence for albums with few reviews
      breakdown.quality = ((album.averageRating - 5) / 5 + 1) / 2 * 0.5
    }

    // 3. Collaborative filtering score
    if (collaborativeBoostIds.has(album.id)) {
      breakdown.collaborative = 1
    }

    // 4. Freshness score (newer albums get slight boost)
    const releaseDate = new Date(album.releaseDate)
    if (releaseDate > oneYearAgo) {
      // Released within last year
      breakdown.freshness = 1
    } else {
      // Decay over 5 years
      const yearsOld = (now.getTime() - releaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
      breakdown.freshness = Math.max(0, 1 - yearsOld / 5)
    }

    // Artist diversity penalty (avoid recommending same artist user already reviewed)
    const artistPenalty = reviewedArtists.has(album.artistName) ? 0.3 : 0

    // Calculate final score based on mode
    let score: number

    if (mode === 'discovery') {
      // Discovery mode: invert genre score, boost quality
      score =
        (1 - breakdown.genre) * 0.4 +
        breakdown.quality * 0.4 +
        breakdown.collaborative * 0.1 +
        breakdown.freshness * 0.1 -
        artistPenalty
    } else if (mode === 'quality') {
      // Quality mode: heavy focus on ratings
      score =
        breakdown.genre * 0.2 +
        breakdown.quality * 0.6 +
        breakdown.collaborative * 0.15 +
        breakdown.freshness * 0.05 -
        artistPenalty
    } else {
      // Smart mode: balanced
      score =
        breakdown.genre * WEIGHTS.GENRE_MATCH +
        breakdown.quality * WEIGHTS.RATING_QUALITY +
        breakdown.collaborative * WEIGHTS.COLLABORATIVE +
        breakdown.freshness * WEIGHTS.FRESHNESS -
        artistPenalty

      // Add random discovery factor
      if (Math.random() < WEIGHTS.DISCOVERY) {
        score = Math.random() // Pure random for discovery
      }
    }

    return {
      ...album,
      score: Math.max(0, Math.min(1, score)),
      scoreBreakdown: breakdown,
    }
  })
}

function selectFromTopCandidates(
  scoredAlbums: ScoredAlbum[],
  mode: string
): ScoredAlbum | null {
  if (scoredAlbums.length === 0) return null

  // Sort by score
  const sorted = [...scoredAlbums].sort((a, b) => b.score - a.score)

  if (mode === 'pure-random') {
    // Completely random selection
    return sorted[Math.floor(Math.random() * sorted.length)]
  }

  // Take top 20% of candidates
  const topCount = Math.max(5, Math.ceil(sorted.length * 0.2))
  const topCandidates = sorted.slice(0, topCount)

  // Weighted random selection from top candidates
  // Higher scored albums have higher probability
  const totalScore = topCandidates.reduce((sum, a) => sum + a.score + 0.1, 0) // +0.1 to avoid zero scores
  let random = Math.random() * totalScore

  for (const album of topCandidates) {
    random -= album.score + 0.1
    if (random <= 0) {
      return album
    }
  }

  return topCandidates[0]
}

function getRecommendationReason(
  album: ScoredAlbum,
  _tasteProfile: TasteProfile
): string {
  const { scoreBreakdown } = album

  // Find the dominant factor
  const factors = [
    { key: 'genre', value: scoreBreakdown.genre, reason: 'Matches your taste' },
    { key: 'quality', value: scoreBreakdown.quality, reason: 'Highly rated' },
    { key: 'collaborative', value: scoreBreakdown.collaborative, reason: 'Loved by similar listeners' },
    { key: 'freshness', value: scoreBreakdown.freshness, reason: 'Fresh release' },
  ]

  const sorted = factors.sort((a, b) => b.value - a.value)

  // Check if this is a discovery pick (low genre match)
  if (scoreBreakdown.genre < 0.2) {
    return 'Something different'
  }

  // Return the dominant reason, or combine top two
  if (sorted[0].value > 0.5) {
    return sorted[0].reason
  }

  if (sorted[0].value > 0.3 && sorted[1].value > 0.3) {
    return `${sorted[0].reason} + ${sorted[1].reason.toLowerCase()}`
  }

  return 'Curated for you'
}
