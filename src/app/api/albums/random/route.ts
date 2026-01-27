import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'

// Unlock spin wheel from the very first review
const MIN_REVIEWS_REQUIRED = 1

// Spin limits based on user review count
const SPIN_LIMITS: Record<number, number> = {
  1: 5,    // 1 review = 5 spins/day
  2: 8,    // 2 reviews = 8 spins/day
  3: 12,   // 3 reviews = 12 spins/day
  5: 20,   // 5+ reviews = 20 spins/day
  10: 50,  // 10+ reviews = 50 spins/day
  15: -1,  // 15+ reviews = unlimited
}

function getSpinLimit(reviewCount: number): number {
  if (reviewCount >= 15) return -1 // unlimited
  if (reviewCount >= 10) return 50
  if (reviewCount >= 5) return 20
  if (reviewCount >= 3) return 12
  if (reviewCount >= 2) return 8
  return 5
}

// Algorithm weights - tune these for different recommendation styles
const WEIGHTS = {
  GENRE_MATCH: 0.40,        // How much to weight genre preferences (increased for tailored)
  RATING_QUALITY: 0.20,     // Prefer albums with good community ratings
  ARTIST_SIMILARITY: 0.15,  // Same/similar artists
  COLLABORATIVE: 0.15,      // What similar taste users liked
  FRESHNESS: 0.10,          // Slight boost for newer releases
}

// Rating thresholds
const HIGH_RATING_THRESHOLD = 7.5
const MIN_REVIEWS_FOR_QUALITY = 3

interface ScoredAlbum {
  id: string
  spotifyId: string
  title: string
  artistName: string
  artistSpotifyId: string | null
  releaseDate: Date
  coverArtUrl: string | null
  coverArtUrlMedium: string | null
  genres: string[]
  albumType: string
  averageRating: number | null
  totalReviews: number
  spotifyUrl: string | null
  score: number
  scoreBreakdown: {
    genre: number
    artist: number
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
    // 'tailored' is now the default - maximally personalized to user's taste
    // 'discovery' pushes users outside their comfort zone
    // 'quality' focuses on highly-rated albums regardless of taste match
    // 'smart' is the balanced hybrid
    const mode = searchParams.get('mode') || 'tailored'

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
            artistSpotifyId: true,
          },
        },
      },
    })

    if (userReviews.length < MIN_REVIEWS_REQUIRED) {
      return errorResponse(
        `Review at least ${MIN_REVIEWS_REQUIRED} album to unlock Spin the Wheel.`,
        403
      )
    }

    // Calculate spin limit based on user's review count
    const spinLimit = getSpinLimit(userReviews.length)

    const reviewedAlbumIds = new Set(userReviews.map(r => r.album.id))
    const reviewedArtists = new Set(userReviews.map(r => r.album.artistName))
    const reviewedArtistIds = new Set(
      userReviews
        .map(r => r.album.artistSpotifyId)
        .filter((id): id is string => id !== null)
    )

    // Build user taste profile
    const tasteProfile = buildTasteProfile(userReviews)

    // Find users with similar taste for collaborative filtering
    const similarUserIds = await findSimilarUsers(userId, tasteProfile.topGenres)

    // Get candidate albums based on mode
    const candidates = await getCandidateAlbums(
      reviewedAlbumIds,
      tasteProfile,
      mode,
      reviewedArtistIds
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
    const recommendationReason = getRecommendationReason(selectedAlbum, tasteProfile, mode)

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
        spotifyUrl: selectedAlbum.spotifyUrl,
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
        spinLimit, // -1 = unlimited
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
  topArtists: string[]
  artistWeights: Record<string, number>
  highRatedArtists: string[] // Artists user rates highly
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
  const artistCount: Record<string, number> = {}
  const artistRatingSum: Record<string, number> = {}
  const artistRatingCount: Record<string, number> = {}
  let totalRating = 0

  for (const review of userReviews) {
    totalRating += review.rating

    // Track artist preferences
    const artist = review.album.artistName
    artistCount[artist] = (artistCount[artist] || 0) + 1
    artistRatingSum[artist] = (artistRatingSum[artist] || 0) + review.rating
    artistRatingCount[artist] = (artistRatingCount[artist] || 0) + 1

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

  // Sort artists by frequency
  const sortedArtists = Object.entries(artistCount)
    .sort((a, b) => b[1] - a[1])
    .map(([artist]) => artist)

  // Calculate genre weights (normalized)
  const totalGenreCount = Object.values(genreCount).reduce((a, b) => a + b, 0)
  const genreWeights: Record<string, number> = {}
  for (const [genre, count] of Object.entries(genreCount)) {
    genreWeights[genre] = count / totalGenreCount
  }

  // Calculate artist weights (normalized)
  const totalArtistCount = Object.values(artistCount).reduce((a, b) => a + b, 0)
  const artistWeights: Record<string, number> = {}
  for (const [artist, count] of Object.entries(artistCount)) {
    artistWeights[artist] = count / totalArtistCount
  }

  // Find genres user rates highly (above their average)
  const highRatedGenres = Object.entries(genreRatingSum)
    .filter(([genre]) => genreRatingCount[genre] >= 1) // Lowered threshold for new users
    .map(([genre, sum]) => ({
      genre,
      avgRating: sum / genreRatingCount[genre],
    }))
    .filter(g => g.avgRating >= averageRating) // Include at or above average
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 8)
    .map(g => g.genre)

  // Find artists user rates highly
  const highRatedArtists = Object.entries(artistRatingSum)
    .map(([artist, sum]) => ({
      artist,
      avgRating: sum / artistRatingCount[artist],
    }))
    .filter(a => a.avgRating >= 7) // Albums rated 7+
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 15)
    .map(a => a.artist)

  return {
    topGenres: sortedGenres.slice(0, 10),
    genreWeights,
    topArtists: sortedArtists.slice(0, 20),
    artistWeights,
    highRatedArtists,
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
  mode: string,
  reviewedArtistIds: Set<string>
): Promise<Array<{
  id: string
  spotifyId: string
  title: string
  artistName: string
  artistSpotifyId: string | null
  releaseDate: Date
  coverArtUrl: string | null
  coverArtUrlMedium: string | null
  genres: string[]
  albumType: string
  averageRating: number | null
  totalReviews: number
  spotifyUrl: string | null
}>> {
  const baseWhere = {
    albumType: { not: 'single' },
    coverArtUrl: { not: null },
    id: { notIn: Array.from(reviewedAlbumIds) },
  }

  // Different candidate selection based on mode
  let whereClause: Record<string, unknown> = baseWhere

  if (mode === 'tailored') {
    // TAILORED MODE: Maximally personalized
    // Prioritize albums that match user's taste profile
    // Include albums from artists they've liked AND similar genres
    const favoriteArtists = tasteProfile.topArtists.slice(0, 10)
    const favoriteGenres = tasteProfile.topGenres.slice(0, 5)

    whereClause = {
      ...baseWhere,
      OR: [
        // Albums from artists user has reviewed highly
        { artistName: { in: favoriteArtists } },
        // Albums in user's favorite genres
        { genres: { hasSome: favoriteGenres } },
        // Albums in genres user rates highly (even if not most reviewed)
        { genres: { hasSome: tasteProfile.highRatedGenres } },
      ],
    }
  } else if (mode === 'quality') {
    // Focus on highly-rated albums
    whereClause = {
      ...baseWhere,
      averageRating: { gte: HIGH_RATING_THRESHOLD },
      totalReviews: { gte: MIN_REVIEWS_FOR_QUALITY },
    }
  } else if (mode === 'discovery') {
    // Explicitly avoid user's top genres AND artists for maximum discovery
    whereClause = {
      ...baseWhere,
      NOT: {
        OR: [
          { genres: { hasSome: tasteProfile.topGenres.slice(0, 5) } },
          { artistName: { in: tasteProfile.topArtists.slice(0, 10) } },
        ],
      },
    }
  } else if (mode === 'smart') {
    // Mix of familiar and new - get a broad candidate pool
    // No additional filters, scoring will handle preferences
  }

  // Get more candidates than we need for better selection
  const candidateCount = await prisma.album.count({ where: whereClause })
  const sampleSize = Math.min(150, candidateCount) // Increased sample size for better variety

  if (sampleSize === 0) {
    // Fallback to base where if filtered search returns nothing
    return prisma.album.findMany({
      where: baseWhere,
      take: 75,
      orderBy: { totalReviews: 'desc' },
      select: {
        id: true,
        spotifyId: true,
        title: true,
        artistName: true,
        artistSpotifyId: true,
        releaseDate: true,
        coverArtUrl: true,
        coverArtUrlMedium: true,
        genres: true,
        albumType: true,
        averageRating: true,
        totalReviews: true,
        spotifyUrl: true,
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
      artistSpotifyId: true,
      releaseDate: true,
      coverArtUrl: true,
      coverArtUrlMedium: true,
      genres: true,
      albumType: true,
      averageRating: true,
      totalReviews: true,
      spotifyUrl: true,
    },
  })
}

async function scoreAlbums(
  candidates: Array<{
    id: string
    spotifyId: string
    title: string
    artistName: string
    artistSpotifyId: string | null
    releaseDate: Date
    coverArtUrl: string | null
    coverArtUrlMedium: string | null
    genres: string[]
    albumType: string
    averageRating: number | null
    totalReviews: number
    spotifyUrl: string | null
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
      artist: 0,
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
    breakdown.genre += highRatedMatch.length * 0.15

    // Normalize to 0-1
    breakdown.genre = Math.min(1, breakdown.genre)

    // 2. Artist match score (NEW)
    if (tasteProfile.highRatedArtists.includes(album.artistName)) {
      // User has rated this artist highly before
      breakdown.artist = 1
    } else if (tasteProfile.topArtists.includes(album.artistName)) {
      // User has reviewed this artist
      const weight = tasteProfile.artistWeights[album.artistName] || 0
      breakdown.artist = 0.5 + weight * 0.5
    }

    // 3. Quality score (community rating)
    if (album.averageRating && album.totalReviews >= MIN_REVIEWS_FOR_QUALITY) {
      // Normalize rating to 0-1 scale (assuming 0-10 ratings)
      breakdown.quality = (album.averageRating - 5) / 5 // -1 to 1 range
      breakdown.quality = Math.max(0, (breakdown.quality + 1) / 2) // 0 to 1
    } else if (album.averageRating) {
      // Lower confidence for albums with few reviews
      breakdown.quality = ((album.averageRating - 5) / 5 + 1) / 2 * 0.7
    } else {
      // No rating yet - slight default for unreviewed albums
      breakdown.quality = 0.3
    }

    // 4. Collaborative filtering score
    if (collaborativeBoostIds.has(album.id)) {
      breakdown.collaborative = 1
    }

    // 5. Freshness score (newer albums get slight boost)
    const releaseDate = new Date(album.releaseDate)
    if (releaseDate > oneYearAgo) {
      // Released within last year
      breakdown.freshness = 1
    } else {
      // Decay over 5 years
      const yearsOld = (now.getTime() - releaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
      breakdown.freshness = Math.max(0, 1 - yearsOld / 5)
    }

    // Artist diversity penalty - lighter for tailored mode
    const artistPenalty = reviewedArtists.has(album.artistName)
      ? (mode === 'tailored' ? 0.15 : 0.3) // Less penalty in tailored mode
      : 0

    // Calculate final score based on mode
    let score: number

    if (mode === 'tailored') {
      // TAILORED MODE: Maximum personalization to user's demonstrated taste
      // Heavy weight on genre and artist preferences
      score =
        breakdown.genre * 0.35 +
        breakdown.artist * 0.30 +
        breakdown.quality * 0.15 +
        breakdown.collaborative * 0.15 +
        breakdown.freshness * 0.05 -
        artistPenalty
    } else if (mode === 'discovery') {
      // Discovery mode: invert genre/artist scores, boost quality and collaborative
      score =
        (1 - breakdown.genre) * 0.30 +
        (1 - breakdown.artist) * 0.20 +
        breakdown.quality * 0.30 +
        breakdown.collaborative * 0.15 +
        breakdown.freshness * 0.05 -
        artistPenalty
    } else if (mode === 'quality') {
      // Quality mode: heavy focus on ratings
      score =
        breakdown.genre * 0.15 +
        breakdown.artist * 0.10 +
        breakdown.quality * 0.55 +
        breakdown.collaborative * 0.15 +
        breakdown.freshness * 0.05 -
        artistPenalty
    } else {
      // Smart mode: balanced blend of all factors
      score =
        breakdown.genre * WEIGHTS.GENRE_MATCH +
        breakdown.artist * WEIGHTS.ARTIST_SIMILARITY +
        breakdown.quality * WEIGHTS.RATING_QUALITY +
        breakdown.collaborative * WEIGHTS.COLLABORATIVE +
        breakdown.freshness * WEIGHTS.FRESHNESS -
        artistPenalty

      // Small random element for variety (5% chance)
      if (Math.random() < 0.05) {
        score = score * 0.5 + Math.random() * 0.5
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
  tasteProfile: TasteProfile,
  mode: string
): string {
  const { scoreBreakdown } = album

  // Mode-specific reasons
  if (mode === 'discovery') {
    if (scoreBreakdown.quality > 0.7) {
      return 'Critically acclaimed discovery'
    }
    if (scoreBreakdown.collaborative > 0.5) {
      return 'Hidden gem from similar listeners'
    }
    return 'Outside your comfort zone'
  }

  if (mode === 'quality') {
    if (album.averageRating && album.averageRating >= 8.5) {
      return 'Essential listening'
    }
    if (album.averageRating && album.averageRating >= 7.5) {
      return 'Highly acclaimed'
    }
    return 'Quality pick'
  }

  // Tailored and Smart mode reasons
  const factors = [
    { key: 'artist', value: scoreBreakdown.artist, reason: `More from artists you love` },
    { key: 'genre', value: scoreBreakdown.genre, reason: 'Matches your taste' },
    { key: 'quality', value: scoreBreakdown.quality, reason: 'Highly rated' },
    { key: 'collaborative', value: scoreBreakdown.collaborative, reason: 'Similar listeners loved this' },
    { key: 'freshness', value: scoreBreakdown.freshness, reason: 'Fresh release' },
  ]

  const sorted = factors.sort((a, b) => b.value - a.value)

  // High artist match
  if (scoreBreakdown.artist > 0.8 && tasteProfile.highRatedArtists.includes(album.artistName)) {
    return `Because you loved ${album.artistName}`
  }

  // Check if this is a discovery pick (low genre + artist match)
  if (scoreBreakdown.genre < 0.2 && scoreBreakdown.artist < 0.2) {
    return 'Something new for you'
  }

  // Return the dominant reason
  if (sorted[0].value > 0.6) {
    return sorted[0].reason
  }

  // Combine top two factors
  if (sorted[0].value > 0.3 && sorted[1].value > 0.3) {
    // Don't duplicate artist mentions
    if (sorted[0].key === 'artist' && sorted[1].key === 'genre') {
      return 'Tailored to your taste'
    }
    return `${sorted[0].reason}`
  }

  // Default for tailored mode
  if (mode === 'tailored') {
    return 'Picked for you'
  }

  return 'Curated for you'
}
