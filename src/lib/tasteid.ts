/**
 * TASTEID - Music Taste Fingerprint System
 * POLARITY 1.2 - Cognitive Modeling for Music
 *
 * Core algorithm for computing persistent taste profiles.
 * Connects WaxFeed to Polarity's CCX (Conversational Connectomics) research.
 * Taste graphs ARE knowledge graphs.
 *
 * Polarity 1.2 adds:
 * - Music Networks (like Yeo 7-Networks) - HOW you engage with music
 * - Listening Signature (like BrainID) - Your characteristic patterns
 * - Memory Architecture - Consolidation of taste over time
 * - Future Selves - Where your musical taste is heading
 */

import { prisma } from '@/lib/prisma'

// ============================================
// POLARITY 1.2 - MUSIC NETWORKS
// ============================================

/**
 * Music Networks - Analogous to Yeo 7-Network cognitive model
 * Each network represents a different mode of musical engagement
 */
export const MUSIC_NETWORKS = {
  DISCOVERY: {
    id: 'discovery',
    name: 'Discovery Mode',
    description: 'Active exploration, seeking new music',
    yeoAnalog: 'FP (Frontoparietal)',
    icon: '🔍',
  },
  COMFORT: {
    id: 'comfort',
    name: 'Comfort Mode',
    description: 'Returning to favorites, nostalgia',
    yeoAnalog: 'DMN (Default Mode)',
    icon: '🏠',
  },
  DEEP_DIVE: {
    id: 'deep_dive',
    name: 'Deep Dive Mode',
    description: 'Focused artist/genre exploration',
    yeoAnalog: 'DA (Dorsal Attention)',
    icon: '🎯',
  },
  REACTIVE: {
    id: 'reactive',
    name: 'Reactive Mode',
    description: 'Responding to trends, recommendations',
    yeoAnalog: 'VA (Ventral Attention)',
    icon: '📡',
  },
  EMOTIONAL: {
    id: 'emotional',
    name: 'Emotional Mode',
    description: 'Strong ratings, visceral reactions',
    yeoAnalog: 'LIM (Limbic)',
    icon: '💜',
  },
  SOCIAL: {
    id: 'social',
    name: 'Social Mode',
    description: 'Friend activity, community engagement',
    yeoAnalog: 'SMN (Somatomotor)',
    icon: '👥',
  },
  AESTHETIC: {
    id: 'aesthetic',
    name: 'Aesthetic Mode',
    description: 'Album art attraction, visual discovery',
    yeoAnalog: 'VIS (Visual)',
    icon: '🎨',
  },
} as const

export type MusicNetworkId = keyof typeof MUSIC_NETWORKS

export interface ListeningSignature {
  discovery: number    // 0-1 activation
  comfort: number
  deep_dive: number
  reactive: number
  emotional: number
  social: number
  aesthetic: number
}

export interface SignaturePattern {
  id: string
  name: string
  description: string
  networks: string[]  // Networks involved in the pattern
  strength: number    // 0-1 how strongly detected
}

export interface MemorableMoment {
  type: 'first_10' | 'first_0' | 'genre_discovery' | 'artist_revelation' | 'emotional_review'
  albumId: string
  albumTitle: string
  artistName: string
  rating?: number
  date: Date
  description?: string
}

export interface MusicalFutureSelf {
  id: string
  name: string
  description: string
  progress: number    // 0-1 how far along the path
  nextSteps: string[]
  relatedGenres: string[]
  relatedArtists: string[]
}

// ============================================
// ARCHETYPES
// ============================================

export const ARCHETYPES = {
  // Genre-based archetypes
  HIP_HOP_HEAD: {
    id: 'hip-hop-head',
    name: 'Hip-Hop Head',
    description: 'Lives and breathes hip-hop culture',
    genres: ['hip-hop', 'rap', 'trap', 'southern hip hop', 'east coast hip hop', 'west coast hip hop'],
    icon: '🎤',
  },
  JAZZ_EXPLORER: {
    id: 'jazz-explorer',
    name: 'Jazz Explorer',
    description: 'Drawn to improvisation and complexity',
    genres: ['jazz', 'jazz fusion', 'bebop', 'modal jazz', 'free jazz', 'contemporary jazz'],
    icon: '🎷',
  },
  ROCK_PURIST: {
    id: 'rock-purist',
    name: 'Rock Purist',
    description: 'Guitar-driven music runs through their veins',
    genres: ['rock', 'classic rock', 'hard rock', 'alternative rock', 'indie rock', 'punk rock'],
    icon: '🎸',
  },
  ELECTRONIC_PIONEER: {
    id: 'electronic-pioneer',
    name: 'Electronic Pioneer',
    description: 'Synths, beats, and futuristic sounds',
    genres: ['electronic', 'house', 'techno', 'ambient', 'edm', 'drum and bass', 'dubstep'],
    icon: '🎹',
  },
  SOUL_SEARCHER: {
    id: 'soul-searcher',
    name: 'Soul Searcher',
    description: 'Connects with music on an emotional level',
    genres: ['soul', 'r&b', 'neo soul', 'motown', 'funk', 'gospel'],
    icon: '💜',
  },
  METAL_MAVEN: {
    id: 'metal-maven',
    name: 'Metal Maven',
    description: 'Heavy riffs and intense energy',
    genres: ['metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal', 'metalcore'],
    icon: '🤘',
  },
  INDIE_DEVOTEE: {
    id: 'indie-devotee',
    name: 'Indie Devotee',
    description: 'Champions the underground and obscure',
    genres: ['indie', 'indie pop', 'indie folk', 'lo-fi', 'bedroom pop', 'art pop'],
    icon: '🎧',
  },
  POP_CONNOISSEUR: {
    id: 'pop-connoisseur',
    name: 'Pop Connoisseur',
    description: 'Appreciates craft in mainstream music',
    genres: ['pop', 'synth-pop', 'dance pop', 'electropop', 'k-pop', 'j-pop'],
    icon: '⭐',
  },
  COUNTRY_SOUL: {
    id: 'country-soul',
    name: 'Country Soul',
    description: 'Stories, twang, and heartland vibes',
    genres: ['country', 'americana', 'bluegrass', 'folk', 'country rock', 'outlaw country'],
    icon: '🤠',
  },
  CLASSICAL_MIND: {
    id: 'classical-mind',
    name: 'Classical Mind',
    description: 'Appreciates composition and orchestration',
    genres: ['classical', 'orchestral', 'chamber music', 'opera', 'contemporary classical', 'baroque'],
    icon: '🎻',
  },

  // Behavior-based archetypes
  GENRE_FLUID: {
    id: 'genre-fluid',
    name: 'Genre Fluid',
    description: 'Refuses to be boxed in - listens to everything',
    genres: [],
    behavioral: true,
    icon: '🌈',
  },
  DECADE_DIVER: {
    id: 'decade-diver',
    name: 'Decade Diver',
    description: 'Obsessed with a specific era of music',
    genres: [],
    behavioral: true,
    icon: '⏰',
  },
  DEEP_CUTTER: {
    id: 'deep-cutter',
    name: 'Deep Cutter',
    description: 'Goes beyond the hits, finds the gems',
    genres: [],
    behavioral: true,
    icon: '💎',
  },
  CHART_CHASER: {
    id: 'chart-chaser',
    name: 'Chart Chaser',
    description: 'Always on top of what\'s hot',
    genres: [],
    behavioral: true,
    icon: '📈',
  },
  THE_CRITIC: {
    id: 'the-critic',
    name: 'The Critic',
    description: 'High standards, few 10s given',
    genres: [],
    behavioral: true,
    icon: '🧐',
  },
  THE_ENTHUSIAST: {
    id: 'the-enthusiast',
    name: 'The Enthusiast',
    description: 'Finds joy in almost everything',
    genres: [],
    behavioral: true,
    icon: '🎉',
  },
  ESSAY_WRITER: {
    id: 'essay-writer',
    name: 'Essay Writer',
    description: 'Reviews are mini dissertations',
    genres: [],
    behavioral: true,
    icon: '📝',
  },
  ALBUM_ARCHAEOLOGIST: {
    id: 'album-archaeologist',
    name: 'Album Archaeologist',
    description: 'Digs into music history',
    genres: [],
    behavioral: true,
    icon: '🏛️',
  },
  NEW_RELEASE_HUNTER: {
    id: 'new-release-hunter',
    name: 'New Release Hunter',
    description: 'First to review the latest drops',
    genres: [],
    behavioral: true,
    icon: '🆕',
  },
  TASTE_TWIN_SEEKER: {
    id: 'taste-twin-seeker',
    name: 'Taste Twin Seeker',
    description: 'Always comparing and connecting with others',
    genres: [],
    behavioral: true,
    icon: '👯',
  },
} as const

export type ArchetypeId = keyof typeof ARCHETYPES

// ============================================
// TYPES
// ============================================

export interface GenreVector {
  [genre: string]: number // 0-1 affinity score
}

export interface ArtistDNA {
  artistName: string
  weight: number // 0-1 importance
  avgRating: number
  reviewCount: number
}

export interface DecadePreferences {
  [decade: string]: number // 0-1 preference
}

export interface TasteIDComputation {
  genreVector: GenreVector
  artistDNA: ArtistDNA[]
  decadePreferences: DecadePreferences
  primaryArchetype: string
  secondaryArchetype: string | null
  archetypeConfidence: number
  adventurenessScore: number
  ratingSkew: 'harsh' | 'lenient' | 'balanced'
  averageRating: number
  ratingStdDev: number
  reviewDepth: 'rater' | 'writer' | 'essayist'
  reviewCount: number
  avgReviewLength: number
  topGenres: string[]
  topArtists: string[]
  signatureAlbums: string[]
  polarityScore: number

  // Polarity 1.2 fields
  listeningSignature: ListeningSignature
  signaturePatterns: string[]
  memorableMoments: MemorableMoment[]
  futureSelvesMusic: MusicalFutureSelf[]
  polarityScore2: number
}

interface ReviewWithAlbum {
  id: string
  rating: number
  text: string | null
  createdAt: Date
  album: {
    id: string
    genres: string[]
    artistName: string
    releaseDate: Date
    title: string
    averageRating: number | null
    totalReviews: number
  }
}

// ============================================
// COMPUTATION ENGINE
// ============================================

/**
 * Compute a user's complete TasteID from their reviews
 */
export async function computeTasteID(userId: string): Promise<TasteIDComputation | null> {
  // Fetch all user reviews with album data
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      album: {
        select: {
          id: true,
          genres: true,
          artistName: true,
          releaseDate: true,
          title: true,
          averageRating: true,
          totalReviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (reviews.length === 0) {
    return null
  }

  // Apply recency weighting - more recent reviews matter more
  const weightedReviews = applyRecencyWeighting(reviews)

  // 1. Compute genre vector
  const genreVector = computeGenreVector(weightedReviews)

  // 2. Compute artist DNA
  const artistDNA = computeArtistDNA(weightedReviews)

  // 3. Compute decade preferences
  const decadePreferences = computeDecadePreferences(weightedReviews)

  // 4. Rating analysis
  const ratings = reviews.map(r => r.rating)
  const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
  const ratingStdDev = Math.sqrt(
    ratings.reduce((sum, r) => sum + Math.pow(r - averageRating, 2), 0) / ratings.length
  )
  const ratingSkew = getRatingSkew(averageRating)

  // 5. Review depth analysis
  const reviewLengths = reviews.map(r => (r.text?.split(/\s+/).length || 0))
  const avgReviewLength = reviewLengths.reduce((a, b) => a + b, 0) / reviewLengths.length
  const reviewDepth = getReviewDepth(avgReviewLength)

  // 6. Adventureness score (genre diversity)
  const adventurenessScore = computeAdventurenessScore(genreVector)

  // 7. Classify archetype
  const { primary, secondary, confidence } = classifyArchetype(
    genreVector,
    adventurenessScore,
    ratingSkew,
    reviewDepth,
    avgReviewLength,
    reviews
  )

  // 8. Extract display data
  const topGenres = Object.entries(genreVector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre)

  const topArtists = artistDNA
    .slice(0, 10)
    .map(a => a.artistName)

  // 9. Find signature albums (highly rated, distinctly theirs)
  const signatureAlbums = findSignatureAlbums(reviews)

  // 10. Compute Polarity Score (Bayesian edge strength)
  const polarityScore = computePolarityScore(reviews, genreVector, adventurenessScore)

  // ============================================
  // POLARITY 1.2 COMPUTATIONS
  // ============================================

  // 11. Compute Listening Signature (like BrainID)
  const listeningSignature = computeListeningSignature(reviews)

  // 12. Detect Signature Patterns
  const signaturePatterns = detectSignaturePatterns(reviews, listeningSignature)

  // 13. Extract Memorable Moments (Episodic Memory)
  const memorableMoments = extractMemorableMoments(reviews)

  // 14. Detect Musical Future Selves (Prospective Memory)
  const futureSelvesMusic = detectMusicalFutureSselves(reviews, genreVector)

  // 15. Compute Polarity Score 2.0 (Enhanced with cognitive factors)
  const polarityScore2 = computePolarityScore2(reviews, listeningSignature, signaturePatterns, polarityScore)

  return {
    genreVector,
    artistDNA,
    decadePreferences,
    primaryArchetype: primary,
    secondaryArchetype: secondary,
    archetypeConfidence: confidence,
    adventurenessScore,
    ratingSkew,
    averageRating,
    ratingStdDev,
    reviewDepth,
    reviewCount: reviews.length,
    avgReviewLength: Math.round(avgReviewLength),
    topGenres,
    topArtists,
    signatureAlbums,
    polarityScore,

    // Polarity 1.2
    listeningSignature,
    signaturePatterns,
    memorableMoments,
    futureSelvesMusic,
    polarityScore2,
  }
}

/**
 * Apply recency weighting - recent reviews weighted more heavily
 */
function applyRecencyWeighting(reviews: ReviewWithAlbum[]): Array<ReviewWithAlbum & { weight: number }> {
  const now = new Date()
  const maxAge = 365 * 2 // 2 years for decay

  return reviews.map(review => {
    const ageInDays = (now.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    // Exponential decay with half-life of 180 days
    const weight = Math.exp(-ageInDays / 180)
    // Bonus for written reviews (stronger signal)
    const textBonus = review.text && review.text.length > 50 ? 1.3 : 1
    return { ...review, weight: weight * textBonus }
  })
}

/**
 * Compute genre affinity vector
 */
function computeGenreVector(reviews: Array<ReviewWithAlbum & { weight: number }>): GenreVector {
  const genreScores: Record<string, { total: number; count: number }> = {}

  for (const review of reviews) {
    for (const genre of review.album.genres) {
      const normalizedGenre = genre.toLowerCase()
      if (!genreScores[normalizedGenre]) {
        genreScores[normalizedGenre] = { total: 0, count: 0 }
      }
      // Weight by both recency and rating
      const ratingFactor = review.rating / 10 // 0-1
      genreScores[normalizedGenre].total += review.weight * ratingFactor
      genreScores[normalizedGenre].count += review.weight
    }
  }

  // Normalize to 0-1 scale
  const maxScore = Math.max(...Object.values(genreScores).map(g => g.total / g.count), 0.001)
  const vector: GenreVector = {}

  for (const [genre, { total, count }] of Object.entries(genreScores)) {
    vector[genre] = (total / count) / maxScore
  }

  return vector
}

/**
 * Compute artist DNA - top defining artists
 */
function computeArtistDNA(reviews: Array<ReviewWithAlbum & { weight: number }>): ArtistDNA[] {
  const artistScores: Record<string, { totalWeight: number; totalRating: number; count: number }> = {}

  for (const review of reviews) {
    const artist = review.album.artistName
    if (!artistScores[artist]) {
      artistScores[artist] = { totalWeight: 0, totalRating: 0, count: 0 }
    }
    artistScores[artist].totalWeight += review.weight
    artistScores[artist].totalRating += review.rating
    artistScores[artist].count += 1
  }

  const artists = Object.entries(artistScores)
    .map(([artistName, data]) => ({
      artistName,
      weight: data.totalWeight,
      avgRating: data.totalRating / data.count,
      reviewCount: data.count,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20)

  // Normalize weights
  const maxWeight = Math.max(...artists.map(a => a.weight), 0.001)
  return artists.map(a => ({
    ...a,
    weight: a.weight / maxWeight,
  }))
}

/**
 * Compute decade preferences
 */
function computeDecadePreferences(reviews: Array<ReviewWithAlbum & { weight: number }>): DecadePreferences {
  const decadeScores: Record<string, { total: number; count: number }> = {}

  for (const review of reviews) {
    const year = new Date(review.album.releaseDate).getFullYear()
    const decade = `${Math.floor(year / 10) * 10}s`
    if (!decadeScores[decade]) {
      decadeScores[decade] = { total: 0, count: 0 }
    }
    decadeScores[decade].total += review.weight * (review.rating / 10)
    decadeScores[decade].count += review.weight
  }

  const maxScore = Math.max(...Object.values(decadeScores).map(d => d.total / d.count), 0.001)
  const preferences: DecadePreferences = {}

  for (const [decade, { total, count }] of Object.entries(decadeScores)) {
    preferences[decade] = (total / count) / maxScore
  }

  return preferences
}

/**
 * Determine rating skew
 */
function getRatingSkew(averageRating: number): 'harsh' | 'lenient' | 'balanced' {
  if (averageRating < 5.5) return 'harsh'
  if (averageRating > 7.5) return 'lenient'
  return 'balanced'
}

/**
 * Determine review depth
 */
function getReviewDepth(avgWordCount: number): 'rater' | 'writer' | 'essayist' {
  if (avgWordCount < 20) return 'rater'
  if (avgWordCount < 100) return 'writer'
  return 'essayist'
}

/**
 * Compute adventureness score (how diverse is their taste)
 */
function computeAdventurenessScore(genreVector: GenreVector): number {
  const genres = Object.keys(genreVector)
  if (genres.length <= 1) return 0

  // Shannon entropy normalized
  const values = Object.values(genreVector)
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum === 0) return 0

  const probs = values.map(v => v / sum)
  const entropy = -probs.reduce((acc, p) => {
    if (p > 0) acc += p * Math.log2(p)
    return acc
  }, 0)

  // Normalize by max possible entropy (uniform distribution)
  const maxEntropy = Math.log2(genres.length)
  return maxEntropy > 0 ? entropy / maxEntropy : 0
}

/**
 * Classify user archetype based on taste profile
 */
function classifyArchetype(
  genreVector: GenreVector,
  adventurenessScore: number,
  ratingSkew: string,
  reviewDepth: string,
  avgReviewLength: number,
  reviews: ReviewWithAlbum[]
): { primary: string; secondary: string | null; confidence: number } {
  const scores: Record<string, number> = {}

  // Check behavioral archetypes first
  if (adventurenessScore > 0.75) {
    scores['genre-fluid'] = adventurenessScore
  }

  if (ratingSkew === 'harsh') {
    scores['the-critic'] = 0.8
  } else if (ratingSkew === 'lenient') {
    scores['the-enthusiast'] = 0.8
  }

  if (reviewDepth === 'essayist' || avgReviewLength > 150) {
    scores['essay-writer'] = 0.85
  }

  // Check decade obsession
  const decadeCount: Record<string, number> = {}
  for (const review of reviews) {
    const year = new Date(review.album.releaseDate).getFullYear()
    const decade = `${Math.floor(year / 10) * 10}s`
    decadeCount[decade] = (decadeCount[decade] || 0) + 1
  }
  const totalReviews = reviews.length
  for (const [decade, count] of Object.entries(decadeCount)) {
    if (count / totalReviews > 0.6) {
      scores['decade-diver'] = count / totalReviews
    }
  }

  // Check genre-based archetypes
  for (const [key, archetype] of Object.entries(ARCHETYPES)) {
    if ('behavioral' in archetype && archetype.behavioral) continue

    let matchScore = 0
    for (const genre of archetype.genres) {
      if (genreVector[genre]) {
        matchScore += genreVector[genre]
      }
    }
    if (archetype.genres.length > 0) {
      scores[archetype.id] = matchScore / archetype.genres.length
    }
  }

  // Sort and pick top 2
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0.1)
    .sort((a, b) => b[1] - a[1])

  if (sorted.length === 0) {
    return { primary: 'genre-fluid', secondary: null, confidence: 0.5 }
  }

  return {
    primary: sorted[0][0],
    secondary: sorted[1]?.[0] || null,
    confidence: sorted[0][1],
  }
}

/**
 * Find signature albums that define user's taste
 */
function findSignatureAlbums(reviews: ReviewWithAlbum[]): string[] {
  // High rating + written review + not super mainstream
  return reviews
    .filter(r => r.rating >= 8 && r.text && r.text.length > 50)
    .filter(r => !r.album.averageRating || r.album.totalReviews < 100) // Not super mainstream
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(r => r.album.id)
}

/**
 * Compute Polarity Score - Bayesian edge strength from CCX
 * Measures how distinctive and confident the taste profile is
 */
function computePolarityScore(
  reviews: ReviewWithAlbum[],
  genreVector: GenreVector,
  adventurenessScore: number
): number {
  // Factors that contribute to Polarity Score:
  // 1. Review count (more data = more confident)
  const countFactor = Math.min(reviews.length / 50, 1) // Max out at 50 reviews

  // 2. Rating consistency (consistent raters have clearer preferences)
  const ratings = reviews.map(r => r.rating)
  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
  const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length
  const consistencyFactor = 1 - Math.min(variance / 10, 1) // Lower variance = higher consistency

  // 3. Genre distinctiveness (focused taste = higher polarity)
  const distinctivenessFactor = 1 - adventurenessScore * 0.5 // Being focused gives higher score, but not penalize adventurous too much

  // 4. Engagement depth (written reviews = stronger signal)
  const writtenCount = reviews.filter(r => r.text && r.text.length > 50).length
  const engagementFactor = Math.min(writtenCount / reviews.length + 0.3, 1)

  // Combine with Bayesian-style weighting
  const polarityScore =
    countFactor * 0.3 +
    consistencyFactor * 0.25 +
    distinctivenessFactor * 0.25 +
    engagementFactor * 0.2

  return Math.round(polarityScore * 100) / 100
}

// ============================================
// POLARITY 1.2 - LISTENING SIGNATURE COMPUTATION
// ============================================

/**
 * Compute Listening Signature - Music network activation baseline
 * Analogous to BrainID cognitive fingerprint
 */
function computeListeningSignature(reviews: ReviewWithAlbum[]): ListeningSignature {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentReviews = reviews.filter(r => r.createdAt > thirtyDaysAgo)

  // Discovery Mode: New artists, diverse genres
  const uniqueArtists = new Set(reviews.map(r => r.album.artistName))
  const uniqueGenres = new Set(reviews.flatMap(r => r.album.genres))
  const discoveryScore = Math.min(
    (uniqueArtists.size / Math.max(reviews.length, 1)) * 0.5 +
    (uniqueGenres.size / Math.max(reviews.length * 2, 1)) * 0.5,
    1
  )

  // Comfort Mode: Re-ratings, same-artist clusters, older music
  const artistCounts: Record<string, number> = {}
  reviews.forEach(r => {
    artistCounts[r.album.artistName] = (artistCounts[r.album.artistName] || 0) + 1
  })
  const repeatArtistRatio = Object.values(artistCounts).filter(c => c > 1).length / Math.max(uniqueArtists.size, 1)
  const comfortScore = Math.min(repeatArtistRatio * 1.5 + 0.1, 1)

  // Deep Dive Mode: Multiple albums from same artist in sequence
  let deepDiveScore = 0
  const sortedByDate = [...reviews].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  for (let i = 1; i < sortedByDate.length; i++) {
    if (sortedByDate[i].album.artistName === sortedByDate[i-1].album.artistName) {
      deepDiveScore += 0.1
    }
  }
  deepDiveScore = Math.min(deepDiveScore / Math.max(reviews.length / 10, 1), 1)

  // Reactive Mode: Recent release engagement, quick ratings
  const currentYear = now.getFullYear()
  const recentReleases = reviews.filter(r => {
    const releaseYear = new Date(r.album.releaseDate).getFullYear()
    return releaseYear >= currentYear - 1
  })
  const reactiveScore = Math.min(recentReleases.length / Math.max(reviews.length, 1) * 2, 1)

  // Emotional Mode: Rating extremes (0-2, 8-10), long emotional reviews
  const extremeRatings = reviews.filter(r => r.rating <= 2 || r.rating >= 8)
  const emotionalReviews = reviews.filter(r => r.text && r.text.length > 100 && /[!?]{2,}|love|hate|amazing|terrible/i.test(r.text))
  const emotionalScore = Math.min(
    (extremeRatings.length / Math.max(reviews.length, 1)) * 0.6 +
    (emotionalReviews.length / Math.max(reviews.length, 1)) * 0.4,
    1
  )

  // Social Mode: This would require friend activity data, estimate from recent activity patterns
  // For now, base on engagement frequency
  const socialScore = Math.min(recentReviews.length / 10, 1) * 0.3

  // Aesthetic Mode: Would require vinyl/physical media tracking, estimate from genre diversity
  const aestheticScore = Math.min(uniqueGenres.size / 20, 1) * 0.3

  // Normalize to ensure they sum to ~1 for relative comparison
  const total = discoveryScore + comfortScore + deepDiveScore + reactiveScore + emotionalScore + socialScore + aestheticScore
  const normalizer = total > 0 ? 1 / total : 1

  return {
    discovery: Math.round(discoveryScore * normalizer * 100) / 100,
    comfort: Math.round(comfortScore * normalizer * 100) / 100,
    deep_dive: Math.round(deepDiveScore * normalizer * 100) / 100,
    reactive: Math.round(reactiveScore * normalizer * 100) / 100,
    emotional: Math.round(emotionalScore * normalizer * 100) / 100,
    social: Math.round(socialScore * normalizer * 100) / 100,
    aesthetic: Math.round(aestheticScore * normalizer * 100) / 100,
  }
}

/**
 * Detect signature patterns from listening behavior
 * Enhanced with more nuanced patterns from Polarity 1.2
 */
function detectSignaturePatterns(
  reviews: ReviewWithAlbum[],
  signature: ListeningSignature
): string[] {
  const patterns: string[] = []
  const ratings = reviews.map(r => r.rating)
  const avgRating = ratings.reduce((a, b) => a + b, 0) / Math.max(ratings.length, 1)

  // ===========================================
  // SIGNATURE-BASED PATTERNS
  // ===========================================

  // Discovery↔Comfort Oscillation - Healthy balance between new and familiar
  if (signature.discovery > 0.18 && signature.comfort > 0.15) {
    patterns.push('Discovery↔Comfort Oscillation')
  }

  // Deep Dive Sprints - Goes all-in on artists
  if (signature.deep_dive > 0.15) {
    patterns.push('Deep Dive Sprints')
  }

  // New Release Hunter - Stays on top of current music
  if (signature.reactive > 0.2) {
    patterns.push('New Release Hunter')
  }

  // Emotional Listener - Strong reactions to music
  if (signature.emotional > 0.25) {
    patterns.push('Emotional Listener')
  }

  // ===========================================
  // RATING DISTRIBUTION PATTERNS
  // ===========================================

  // Harsh Critic vs Music Optimist
  if (avgRating < 5.5) {
    patterns.push('Critical Ear')
  } else if (avgRating > 7.5) {
    patterns.push('Music Optimist')
  }

  // Bimodal Rater - Loves it or hates it (high ratings at extremes)
  const extremeCount = ratings.filter(r => r <= 3 || r >= 8).length
  const middleCount = ratings.filter(r => r > 3 && r < 8).length
  if (extremeCount > middleCount * 1.5 && reviews.length > 10) {
    patterns.push('Polarized Taste')
  }

  // Generous Perfectionist - Gives 10s but rarely anything between 6-9
  const perfectScores = ratings.filter(r => r === 10).length
  const nearPerfectScores = ratings.filter(r => r >= 8 && r < 10).length
  if (perfectScores > nearPerfectScores && perfectScores >= 3) {
    patterns.push('Perfection Seeker')
  }

  // ===========================================
  // ARTIST & GENRE PATTERNS
  // ===========================================

  // Track artist engagement
  const artistCounts: Record<string, number> = {}
  const artistRatings: Record<string, number[]> = {}
  reviews.forEach(r => {
    artistCounts[r.album.artistName] = (artistCounts[r.album.artistName] || 0) + 1
    if (!artistRatings[r.album.artistName]) {
      artistRatings[r.album.artistName] = []
    }
    artistRatings[r.album.artistName].push(r.rating)
  })

  const maxArtistAlbums = Math.max(...Object.values(artistCounts), 0)

  // Discography Completionist - Deep dives into artist catalogs
  if (maxArtistAlbums >= 5) {
    patterns.push('Discography Completionist')
  }

  // Loyal Fan - High average rating for repeat artists
  const loyalArtists = Object.entries(artistRatings)
    .filter(([, ratings]) => ratings.length >= 3)
    .filter(([, ratings]) => ratings.reduce((a, b) => a + b, 0) / ratings.length >= 7)
  if (loyalArtists.length >= 3) {
    patterns.push('Artist Loyalist')
  }

  // Genre Explorer - Wide genre coverage
  const uniqueGenres = new Set(reviews.flatMap(r => r.album.genres))
  if (uniqueGenres.size > 15) {
    patterns.push('Genre Explorer')
  }

  // Genre Specialist - 70%+ reviews in top 3 genres
  const genreCounts: Record<string, number> = {}
  reviews.forEach(r => {
    r.album.genres.forEach(g => {
      genreCounts[g.toLowerCase()] = (genreCounts[g.toLowerCase()] || 0) + 1
    })
  })
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])
  const topGenreCount = sortedGenres.slice(0, 3).reduce((sum, [, c]) => sum + c, 0)
  if (topGenreCount / reviews.length > 0.7 && reviews.length > 10) {
    patterns.push('Genre Specialist')
  }

  // ===========================================
  // TEMPORAL PATTERNS
  // ===========================================

  // Archive Diver - Prefers older music (average album age > 15 years)
  const currentYear = new Date().getFullYear()
  const albumAges = reviews.map(r => currentYear - new Date(r.album.releaseDate).getFullYear())
  const avgAlbumAge = albumAges.reduce((a, b) => a + b, 0) / Math.max(albumAges.length, 1)
  if (avgAlbumAge > 15) {
    patterns.push('Archive Diver')
  }

  // Decade Obsessed - 60%+ of reviews from one decade
  const decadeCounts: Record<string, number> = {}
  reviews.forEach(r => {
    const year = new Date(r.album.releaseDate).getFullYear()
    const decade = `${Math.floor(year / 10) * 10}s`
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
  })
  const maxDecadePercent = Math.max(...Object.values(decadeCounts)) / reviews.length
  if (maxDecadePercent > 0.6) {
    patterns.push('Era Specialist')
  }

  // ===========================================
  // ENGAGEMENT PATTERNS
  // ===========================================

  // Essay Writer - Long, thoughtful reviews
  const reviewLengths = reviews.map(r => r.text?.split(/\s+/).length || 0)
  const avgReviewLength = reviewLengths.reduce((a, b) => a + b, 0) / Math.max(reviewLengths.length, 1)
  if (avgReviewLength > 100) {
    patterns.push('Essay Writer')
  }

  // Contrarian - Often differs from consensus (rates highly-rated albums lower or vice versa)
  let contrarianCount = 0
  reviews.forEach(r => {
    if (r.album.averageRating) {
      const diff = Math.abs(r.rating - r.album.averageRating)
      if (diff > 3) contrarianCount++
    }
  })
  if (contrarianCount / reviews.length > 0.3 && reviews.length > 10) {
    patterns.push('Contrarian')
  }

  // Consensus Builder - Usually aligns with popular opinion
  let consensusCount = 0
  reviews.forEach(r => {
    if (r.album.averageRating) {
      const diff = Math.abs(r.rating - r.album.averageRating)
      if (diff <= 1) consensusCount++
    }
  })
  if (consensusCount / reviews.length > 0.6 && reviews.length > 10) {
    patterns.push('Consensus Builder')
  }

  // Hidden Gem Hunter - High ratings for low-popularity albums
  const hiddenGems = reviews.filter(r =>
    r.rating >= 8 && r.album.totalReviews < 50
  )
  if (hiddenGems.length / reviews.length > 0.3 && reviews.length > 10) {
    patterns.push('Hidden Gem Hunter')
  }

  return patterns.slice(0, 8) // Limit to most relevant patterns
}

/**
 * Extract memorable moments from review history
 */
function extractMemorableMoments(reviews: ReviewWithAlbum[]): MemorableMoment[] {
  const moments: MemorableMoment[] = []
  const sortedByDate = [...reviews].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // First 10 rating
  const first10 = sortedByDate.find(r => r.rating === 10)
  if (first10) {
    moments.push({
      type: 'first_10',
      albumId: first10.album.id,
      albumTitle: first10.album.title,
      artistName: first10.album.artistName,
      rating: 10,
      date: first10.createdAt,
      description: 'First perfect score',
    })
  }

  // First 0 rating
  const first0 = sortedByDate.find(r => r.rating === 0)
  if (first0) {
    moments.push({
      type: 'first_0',
      albumId: first0.album.id,
      albumTitle: first0.album.title,
      artistName: first0.album.artistName,
      rating: 0,
      date: first0.createdAt,
      description: 'First zero - memorable for a reason',
    })
  }

  // Emotional reviews (long, passionate reviews)
  const emotionalReviews = reviews
    .filter(r => r.text && r.text.length > 200)
    .sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0))
    .slice(0, 3)

  emotionalReviews.forEach(r => {
    moments.push({
      type: 'emotional_review',
      albumId: r.album.id,
      albumTitle: r.album.title,
      artistName: r.album.artistName,
      rating: r.rating,
      date: r.createdAt,
      description: 'Deeply felt review',
    })
  })

  return moments.slice(0, 10) // Limit to 10 memorable moments
}

/**
 * Detect potential musical future selves
 */
function detectMusicalFutureSselves(
  reviews: ReviewWithAlbum[],
  genreVector: GenreVector
): MusicalFutureSelf[] {
  const futures: MusicalFutureSelf[] = []

  // Get genre trends (what genres are they exploring?)
  const genreEntries = Object.entries(genreVector).sort((a, b) => b[1] - a[1])
  const topGenres = genreEntries.slice(0, 5).map(([g]) => g)
  const emergingGenres = genreEntries.slice(5, 10).filter(([, v]) => v > 0.2).map(([g]) => g)

  // Jazz Connoisseur path
  const jazzGenres = ['jazz', 'jazz fusion', 'bebop', 'modal jazz', 'free jazz']
  const jazzScore = jazzGenres.reduce((sum, g) => sum + (genreVector[g] || 0), 0)
  if (jazzScore > 0.3) {
    futures.push({
      id: 'jazz-connoisseur',
      name: 'Jazz Connoisseur',
      description: 'Deep appreciation for improvisation and complexity',
      progress: Math.min(jazzScore / 2, 1),
      nextSteps: ['Explore bebop classics', 'Discover modal jazz', 'Try free jazz'],
      relatedGenres: jazzGenres,
      relatedArtists: ['Miles Davis', 'John Coltrane', 'Thelonious Monk'],
    })
  }

  // Hip-Hop Historian
  const hiphopGenres = ['hip-hop', 'rap', 'southern hip hop', 'east coast hip hop', 'west coast hip hop']
  const hiphopScore = hiphopGenres.reduce((sum, g) => sum + (genreVector[g] || 0), 0)
  if (hiphopScore > 0.3) {
    futures.push({
      id: 'hip-hop-historian',
      name: 'Hip-Hop Historian',
      description: 'Master of hip-hop\'s evolution and subgenres',
      progress: Math.min(hiphopScore / 2, 1),
      nextSteps: ['Trace regional styles', 'Explore underground scenes', 'Study production evolution'],
      relatedGenres: hiphopGenres,
      relatedArtists: ['Kendrick Lamar', 'OutKast', 'Wu-Tang Clan'],
    })
  }

  // Electronic Explorer
  const electronicGenres = ['electronic', 'house', 'techno', 'ambient', 'drum and bass']
  const electronicScore = electronicGenres.reduce((sum, g) => sum + (genreVector[g] || 0), 0)
  if (electronicScore > 0.3) {
    futures.push({
      id: 'electronic-explorer',
      name: 'Electronic Explorer',
      description: 'Navigator of electronic music\'s vast landscape',
      progress: Math.min(electronicScore / 2, 1),
      nextSteps: ['Discover classic house', 'Explore Detroit techno', 'Try ambient'],
      relatedGenres: electronicGenres,
      relatedArtists: ['Aphex Twin', 'Boards of Canada', 'Daft Punk'],
    })
  }

  // Genre Bridge Builder (high adventureness)
  const uniqueGenreCount = Object.keys(genreVector).length
  if (uniqueGenreCount > 10) {
    futures.push({
      id: 'genre-bridge-builder',
      name: 'Genre Bridge Builder',
      description: 'Connecting disparate sounds into a unified taste map',
      progress: Math.min(uniqueGenreCount / 30, 1),
      nextSteps: ['Find cross-genre artists', 'Create genre playlists', 'Map your taste universe'],
      relatedGenres: emergingGenres,
      relatedArtists: [],
    })
  }

  return futures.slice(0, 4) // Limit to 4 future selves
}

/**
 * Compute Polarity Score 2.0 - Enhanced with cognitive factors
 */
function computePolarityScore2(
  reviews: ReviewWithAlbum[],
  signature: ListeningSignature,
  patterns: string[],
  polarityScore1: number
): number {
  // Original factors (from polarityScore1)
  const baseFactor = polarityScore1 * 0.4

  // Signature strength - how clear/distinct is the listening signature?
  const signatureValues = Object.values(signature)
  const maxSignature = Math.max(...signatureValues)
  const signatureStrength = maxSignature > 0.3 ? 0.8 : maxSignature > 0.2 ? 0.6 : 0.4
  const signatureFactor = signatureStrength * 0.2

  // Pattern consistency - how many detectable patterns?
  const patternFactor = Math.min(patterns.length / 5, 1) * 0.15

  // Engagement consistency - regular activity over time
  const reviewDates = reviews.map(r => r.createdAt.getTime())
  const timeSpan = Math.max(...reviewDates) - Math.min(...reviewDates)
  const daysCovered = timeSpan / (1000 * 60 * 60 * 24)
  const activityDensity = reviews.length / Math.max(daysCovered / 7, 1) // Reviews per week
  const consistencyFactor = Math.min(activityDensity / 5, 1) * 0.15

  // Future clarity - how clear are musical trajectories?
  const futureFactor = 0.1 // Base value, adjusted by future selves detection

  const score = baseFactor + signatureFactor + patternFactor + consistencyFactor + futureFactor
  return Math.round(score * 100) / 100
}

// ============================================
// MATCHING ENGINE
// ============================================

/**
 * Compute taste compatibility between two users
 */
export async function computeTasteMatch(
  userId1: string,
  userId2: string
): Promise<{
  overallScore: number
  genreOverlap: number
  artistOverlap: number
  ratingAlignment: number
  sharedGenres: string[]
  sharedArtists: string[]
  sharedAlbums: string[]
  matchType: string
} | null> {
  // Get both TasteIDs
  const [taste1, taste2] = await Promise.all([
    prisma.tasteID.findUnique({ where: { userId: userId1 } }),
    prisma.tasteID.findUnique({ where: { userId: userId2 } }),
  ])

  if (!taste1 || !taste2) return null

  const genre1 = taste1.genreVector as GenreVector
  const genre2 = taste2.genreVector as GenreVector

  // 1. Genre overlap (cosine similarity)
  const genreOverlap = computeCosineSimilarity(genre1, genre2)

  // 2. Artist overlap
  const artists1 = new Set(taste1.topArtists)
  const artists2 = new Set(taste2.topArtists)
  const sharedArtists = [...artists1].filter(a => artists2.has(a))
  const artistOverlap = sharedArtists.length / Math.max(artists1.size, artists2.size, 1)

  // 3. Rating alignment
  const ratingDiff = Math.abs(taste1.averageRating - taste2.averageRating)
  const ratingAlignment = Math.max(0, 1 - ratingDiff / 5)

  // 4. Shared genres (top overlap)
  const sharedGenres = taste1.topGenres.filter(g => taste2.topGenres.includes(g))

  // 5. Find shared highly-rated albums
  const reviews1 = await prisma.review.findMany({
    where: { userId: userId1, rating: { gte: 8 } },
    select: { albumId: true },
  })
  const reviews2 = await prisma.review.findMany({
    where: { userId: userId2, rating: { gte: 8 } },
    select: { albumId: true },
  })
  const albums1 = new Set(reviews1.map(r => r.albumId))
  const albums2 = new Set(reviews2.map(r => r.albumId))
  const sharedAlbums = [...albums1].filter(a => albums2.has(a)).slice(0, 10)

  // 6. Compute overall score
  const overallScore = Math.round(
    (genreOverlap * 40 + artistOverlap * 30 + ratingAlignment * 20 + (sharedAlbums.length / 10) * 10)
  )

  // 7. Determine match type
  let matchType = 'genre_buddy'
  if (overallScore > 80) {
    matchType = 'taste_twin'
  } else if (genreOverlap < 0.3 && artistOverlap < 0.2) {
    matchType = 'complementary'
  } else if (
    (taste1.adventurenessScore > 0.7 && taste2.adventurenessScore < 0.4) ||
    (taste2.adventurenessScore > 0.7 && taste1.adventurenessScore < 0.4)
  ) {
    matchType = 'explorer_guide'
  }

  return {
    overallScore,
    genreOverlap: Math.round(genreOverlap * 100),
    artistOverlap: Math.round(artistOverlap * 100),
    ratingAlignment: Math.round(ratingAlignment * 100),
    sharedGenres,
    sharedArtists,
    sharedAlbums,
    matchType,
  }
}

/**
 * Compute cosine similarity between two genre vectors
 */
function computeCosineSimilarity(vec1: GenreVector, vec2: GenreVector): number {
  const allGenres = new Set([...Object.keys(vec1), ...Object.keys(vec2)])

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (const genre of allGenres) {
    const v1 = vec1[genre] || 0
    const v2 = vec2[genre] || 0
    dotProduct += v1 * v2
    norm1 += v1 * v1
    norm2 += v2 * v2
  }

  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Find users with similar taste
 */
export async function findSimilarTasters(
  userId: string,
  limit: number = 10
): Promise<Array<{
  userId: string
  username: string
  image: string | null
  compatibility: number
  sharedGenres: string[]
  archetype: string
}>> {
  const userTaste = await prisma.tasteID.findUnique({
    where: { userId },
    include: { user: { select: { id: true } } },
  })

  if (!userTaste) return []

  // Get all other TasteIDs
  const otherTastes = await prisma.tasteID.findMany({
    where: { userId: { not: userId } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    take: 100, // Sample for performance
  })

  const userGenres = userTaste.genreVector as GenreVector

  // Score each user
  const scored = otherTastes.map(taste => {
    const theirGenres = taste.genreVector as GenreVector
    const similarity = computeCosineSimilarity(userGenres, theirGenres)
    const sharedGenres = userTaste.topGenres.filter(g => taste.topGenres.includes(g))

    return {
      userId: taste.userId,
      username: taste.user.username || 'Unknown',
      image: taste.user.image,
      compatibility: Math.round(similarity * 100),
      sharedGenres,
      archetype: taste.primaryArchetype,
    }
  })

  return scored
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, limit)
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Save or update a user's TasteID
 */
export async function saveTasteID(userId: string, computation: TasteIDComputation) {
  return prisma.tasteID.upsert({
    where: { userId },
    create: {
      userId,
      genreVector: computation.genreVector as object,
      artistDNA: computation.artistDNA as unknown as object,
      decadePreferences: computation.decadePreferences as object,
      primaryArchetype: computation.primaryArchetype,
      secondaryArchetype: computation.secondaryArchetype,
      archetypeConfidence: computation.archetypeConfidence,
      adventurenessScore: computation.adventurenessScore,
      ratingSkew: computation.ratingSkew,
      averageRating: computation.averageRating,
      ratingStdDev: computation.ratingStdDev,
      reviewDepth: computation.reviewDepth,
      reviewCount: computation.reviewCount,
      avgReviewLength: computation.avgReviewLength,
      topGenres: computation.topGenres,
      topArtists: computation.topArtists,
      signatureAlbums: computation.signatureAlbums,
      polarityScore: computation.polarityScore,
      // Polarity 1.2 fields
      listeningSignature: computation.listeningSignature as object,
      signaturePatterns: computation.signaturePatterns,
      memorableMoments: computation.memorableMoments as unknown as object,
      futureSelvesMusic: computation.futureSelvesMusic as unknown as object,
      polarityScore2: computation.polarityScore2,
    },
    update: {
      genreVector: computation.genreVector as object,
      artistDNA: computation.artistDNA as unknown as object,
      decadePreferences: computation.decadePreferences as object,
      primaryArchetype: computation.primaryArchetype,
      secondaryArchetype: computation.secondaryArchetype,
      archetypeConfidence: computation.archetypeConfidence,
      adventurenessScore: computation.adventurenessScore,
      ratingSkew: computation.ratingSkew,
      averageRating: computation.averageRating,
      ratingStdDev: computation.ratingStdDev,
      reviewDepth: computation.reviewDepth,
      reviewCount: computation.reviewCount,
      avgReviewLength: computation.avgReviewLength,
      topGenres: computation.topGenres,
      topArtists: computation.topArtists,
      signatureAlbums: computation.signatureAlbums,
      polarityScore: computation.polarityScore,
      // Polarity 1.2 fields
      listeningSignature: computation.listeningSignature as object,
      signaturePatterns: computation.signaturePatterns,
      memorableMoments: computation.memorableMoments as unknown as object,
      futureSelvesMusic: computation.futureSelvesMusic as unknown as object,
      polarityScore2: computation.polarityScore2,
      lastComputedAt: new Date(),
    },
  })
}

/**
 * Create a monthly snapshot of TasteID
 */
export async function createTasteIDSnapshot(tasteId: string) {
  const taste = await prisma.tasteID.findUnique({ where: { id: tasteId } })
  if (!taste) return null

  const now = new Date()

  return prisma.tasteIDSnapshot.upsert({
    where: {
      tasteIdId_year_month: {
        tasteIdId: tasteId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
    },
    create: {
      tasteIdId: tasteId,
      genreVector: taste.genreVector as object,
      artistDNA: taste.artistDNA as object,
      primaryArchetype: taste.primaryArchetype,
      adventurenessScore: taste.adventurenessScore,
      reviewCount: taste.reviewCount,
      // Polarity 1.2
      listeningSignature: taste.listeningSignature ? (taste.listeningSignature as object) : undefined,
      polarityScore2: taste.polarityScore2,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    update: {
      genreVector: taste.genreVector as object,
      artistDNA: taste.artistDNA as object,
      primaryArchetype: taste.primaryArchetype,
      adventurenessScore: taste.adventurenessScore,
      reviewCount: taste.reviewCount,
      // Polarity 1.2
      listeningSignature: taste.listeningSignature ? (taste.listeningSignature as object) : undefined,
      polarityScore2: taste.polarityScore2,
    },
  })
}

/**
 * Get archetype display info
 */
export function getArchetypeInfo(archetypeId: string) {
  const archetype = Object.values(ARCHETYPES).find(a => a.id === archetypeId)
  return archetype || {
    id: archetypeId,
    name: archetypeId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: 'Unique taste profile',
    genres: [],
    icon: '🎵',
  }
}

/**
 * Get music network display info
 */
export function getMusicNetworkInfo(networkId: string) {
  const network = Object.values(MUSIC_NETWORKS).find(n => n.id === networkId)
  return network || {
    id: networkId,
    name: networkId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Mode',
    description: 'Listening behavior pattern',
    yeoAnalog: 'Unknown',
    icon: '🎵',
  }
}

/**
 * Get dominant music networks from listening signature
 */
export function getDominantNetworks(signature: ListeningSignature, topN: number = 3): Array<{
  id: string
  name: string
  description: string
  icon: string
  activation: number
}> {
  const entries = Object.entries(signature) as [keyof ListeningSignature, number][]
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, activation]) => {
      const info = getMusicNetworkInfo(id)
      return {
        id: info.id,
        name: info.name,
        description: info.description,
        icon: info.icon,
        activation: Math.round(activation * 100),
      }
    })
}

/**
 * Typical ranges for listening networks (based on Polarity's concept)
 * These represent the "average" user baseline for comparison
 */
export const TYPICAL_NETWORK_RANGES: Record<keyof ListeningSignature, { min: number; max: number; typical: number }> = {
  discovery: { min: 0.15, max: 0.30, typical: 0.22 },
  comfort: { min: 0.18, max: 0.32, typical: 0.25 },
  deep_dive: { min: 0.08, max: 0.20, typical: 0.14 },
  reactive: { min: 0.10, max: 0.22, typical: 0.16 },
  emotional: { min: 0.08, max: 0.20, typical: 0.14 },
  social: { min: 0.03, max: 0.12, typical: 0.06 },
  aesthetic: { min: 0.02, max: 0.10, typical: 0.05 },
}

/**
 * Format listening signature for display
 */
export function formatListeningSignature(signature: ListeningSignature): Array<{
  network: string
  name: string
  icon: string
  percentage: number
  bar: string
  typicalRange: { min: number; max: number }
  deviation: 'above' | 'below' | 'typical'
  deviationAmount: number
}> {
  const entries = Object.entries(signature) as [keyof ListeningSignature, number][]
  const maxActivation = Math.max(...entries.map(([, v]) => v))

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([id, activation]) => {
      const info = getMusicNetworkInfo(id)
      const percentage = Math.round(activation * 100)
      const barLength = Math.round((activation / maxActivation) * 20)
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength)

      const typical = TYPICAL_NETWORK_RANGES[id]
      let deviation: 'above' | 'below' | 'typical' = 'typical'
      let deviationAmount = 0

      if (activation > typical.max) {
        deviation = 'above'
        deviationAmount = Math.round((activation - typical.max) * 100)
      } else if (activation < typical.min) {
        deviation = 'below'
        deviationAmount = Math.round((typical.min - activation) * 100)
      }

      return {
        network: id,
        name: info.name,
        icon: info.icon,
        percentage,
        bar,
        typicalRange: { min: Math.round(typical.min * 100), max: Math.round(typical.max * 100) },
        deviation,
        deviationAmount,
      }
    })
}

/**
 * Compute signature uniqueness score - how different is this signature from typical?
 */
export function computeSignatureUniqueness(signature: ListeningSignature): {
  score: number  // 0-1, higher = more unique
  standoutNetworks: Array<{ network: string; direction: 'high' | 'low'; deviation: number }>
} {
  const entries = Object.entries(signature) as [keyof ListeningSignature, number][]
  let totalDeviation = 0
  const standoutNetworks: Array<{ network: string; direction: 'high' | 'low'; deviation: number }> = []

  for (const [network, value] of entries) {
    const typical = TYPICAL_NETWORK_RANGES[network]
    const typicalMid = (typical.min + typical.max) / 2
    const deviation = Math.abs(value - typicalMid)
    totalDeviation += deviation

    if (value > typical.max) {
      standoutNetworks.push({
        network,
        direction: 'high',
        deviation: Math.round((value - typical.max) * 100),
      })
    } else if (value < typical.min) {
      standoutNetworks.push({
        network,
        direction: 'low',
        deviation: Math.round((typical.min - value) * 100),
      })
    }
  }

  // Normalize: 0 deviation = 0 uniqueness, max possible deviation = 1
  const maxPossibleDeviation = entries.length * 0.5 // Each network can deviate by max 0.5
  const score = Math.min(totalDeviation / maxPossibleDeviation, 1)

  return {
    score: Math.round(score * 100) / 100,
    standoutNetworks: standoutNetworks.sort((a, b) => b.deviation - a.deviation).slice(0, 3),
  }
}

// ============================================
// POLARITY 1.2 - CONSOLIDATION TRACKING
// ============================================

export interface ConsolidatedTaste {
  type: 'genre' | 'artist' | 'decade' | 'pattern'
  name: string
  strength: number  // 0-1 how consolidated
  consistency: number  // How consistent over time
  trend: 'strengthening' | 'stable' | 'fading'
}

/**
 * Compute taste consolidation - what tastes are "sticking"
 * Based on Polarity's memory consolidation concept
 */
export function computeTasteConsolidation(
  reviews: Array<{ rating: number; createdAt: Date; album: { genres: string[]; artistName: string; releaseDate: Date } }>,
  genreVector: Record<string, number>,
  artistDNA: Array<{ artistName: string; weight: number; avgRating: number; reviewCount: number }>
): ConsolidatedTaste[] {
  const consolidated: ConsolidatedTaste[] = []
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  const recentReviews = reviews.filter(r => r.createdAt > sixMonthsAgo)
  const olderReviews = reviews.filter(r => r.createdAt <= sixMonthsAgo)

  // ===========================================
  // GENRE CONSOLIDATION
  // ===========================================
  const recentGenreCounts: Record<string, { count: number; totalRating: number }> = {}
  const olderGenreCounts: Record<string, { count: number; totalRating: number }> = {}

  recentReviews.forEach(r => {
    r.album.genres.forEach(g => {
      const genre = g.toLowerCase()
      if (!recentGenreCounts[genre]) recentGenreCounts[genre] = { count: 0, totalRating: 0 }
      recentGenreCounts[genre].count++
      recentGenreCounts[genre].totalRating += r.rating
    })
  })

  olderReviews.forEach(r => {
    r.album.genres.forEach(g => {
      const genre = g.toLowerCase()
      if (!olderGenreCounts[genre]) olderGenreCounts[genre] = { count: 0, totalRating: 0 }
      olderGenreCounts[genre].count++
      olderGenreCounts[genre].totalRating += r.rating
    })
  })

  // Find genres that are consolidated (present in both periods with good ratings)
  const allGenres = new Set([...Object.keys(recentGenreCounts), ...Object.keys(olderGenreCounts)])
  allGenres.forEach(genre => {
    const recent = recentGenreCounts[genre]
    const older = olderGenreCounts[genre]

    if (recent && older && recent.count >= 2 && older.count >= 2) {
      const recentAvg = recent.totalRating / recent.count
      const olderAvg = older.totalRating / older.count
      const vectorStrength = genreVector[genre] || 0

      // High ratings in both periods = consolidated
      if (recentAvg >= 6 && olderAvg >= 6) {
        const trend = recentAvg > olderAvg + 0.5
          ? 'strengthening'
          : recentAvg < olderAvg - 0.5
          ? 'fading'
          : 'stable'

        consolidated.push({
          type: 'genre',
          name: genre,
          strength: vectorStrength,
          consistency: 1 - Math.abs(recentAvg - olderAvg) / 10,
          trend,
        })
      }
    }
  })

  // ===========================================
  // ARTIST CONSOLIDATION
  // ===========================================
  const artistHistory: Record<string, { ratings: number[]; recent: boolean; older: boolean }> = {}

  reviews.forEach(r => {
    const artist = r.album.artistName
    if (!artistHistory[artist]) {
      artistHistory[artist] = { ratings: [], recent: false, older: false }
    }
    artistHistory[artist].ratings.push(r.rating)
    if (r.createdAt > sixMonthsAgo) {
      artistHistory[artist].recent = true
    } else {
      artistHistory[artist].older = true
    }
  })

  // Artists reviewed in both periods
  Object.entries(artistHistory)
    .filter(([, data]) => data.recent && data.older && data.ratings.length >= 3)
    .forEach(([artist, data]) => {
      const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
      const dnaEntry = artistDNA.find(a => a.artistName === artist)

      if (avgRating >= 7) {
        consolidated.push({
          type: 'artist',
          name: artist,
          strength: dnaEntry?.weight || 0.5,
          consistency: 1 - (Math.max(...data.ratings) - Math.min(...data.ratings)) / 10,
          trend: 'stable', // Artists with consistent engagement are stable
        })
      }
    })

  // Sort by strength and return top entries
  return consolidated
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10)
}

/**
 * Get a human-readable consolidation summary
 */
export function getConsolidationSummary(consolidated: ConsolidatedTaste[]): {
  headline: string
  details: string
  coreGenres: string[]
  coreArtists: string[]
} {
  const genres = consolidated.filter(c => c.type === 'genre')
  const artists = consolidated.filter(c => c.type === 'artist')
  const strengthening = consolidated.filter(c => c.trend === 'strengthening')
  const fading = consolidated.filter(c => c.trend === 'fading')

  let headline = 'Your taste is evolving.'
  let details = ''

  if (genres.length >= 3 && artists.length >= 2) {
    headline = 'Strong taste foundation.'
    details = `Your love for ${genres.slice(0, 2).map(g => g.name).join(' and ')} is well-established, along with consistent appreciation for ${artists.slice(0, 2).map(a => a.name).join(' and ')}.`
  } else if (genres.length >= 2) {
    headline = 'Core genres emerging.'
    details = `${genres[0].name} and ${genres[1]?.name || 'related sounds'} are becoming your musical home.`
  } else if (strengthening.length > fading.length) {
    headline = 'Taste is crystallizing.'
    details = 'Your preferences are becoming clearer and more defined.'
  } else if (fading.length > strengthening.length) {
    headline = 'Taste in flux.'
    details = "You're in an exploration phase - old favorites are making room for new discoveries."
  }

  return {
    headline,
    details,
    coreGenres: genres.slice(0, 3).map(g => g.name),
    coreArtists: artists.slice(0, 3).map(a => a.name),
  }
}

/**
 * Compare two listening signatures (for taste drift tracking)
 */
export function compareSignatures(
  current: ListeningSignature,
  previous: ListeningSignature
): {
  overallDrift: number  // 0-1, how much has changed
  networkChanges: Array<{
    network: string
    change: number  // positive = increased, negative = decreased
    direction: 'increased' | 'decreased' | 'stable'
  }>
  interpretation: string
} {
  const entries = Object.entries(current) as [keyof ListeningSignature, number][]
  let totalChange = 0
  const networkChanges: Array<{
    network: string
    change: number
    direction: 'increased' | 'decreased' | 'stable'
  }> = []

  for (const [network, currentValue] of entries) {
    const previousValue = previous[network] || 0
    const change = currentValue - previousValue
    totalChange += Math.abs(change)

    let direction: 'increased' | 'decreased' | 'stable' = 'stable'
    if (change > 0.05) direction = 'increased'
    else if (change < -0.05) direction = 'decreased'

    networkChanges.push({
      network,
      change: Math.round(change * 100),
      direction,
    })
  }

  const overallDrift = Math.min(totalChange / 2, 1) // Normalize

  // Generate interpretation
  const significantChanges = networkChanges.filter(c => Math.abs(c.change) > 5)
  let interpretation = 'Your listening signature has remained stable.'

  if (significantChanges.length > 0) {
    const increased = significantChanges.filter(c => c.direction === 'increased').map(c => c.network)
    const decreased = significantChanges.filter(c => c.direction === 'decreased').map(c => c.network)

    const parts: string[] = []
    if (increased.length > 0) {
      parts.push(`More ${increased.join(', ')} mode`)
    }
    if (decreased.length > 0) {
      parts.push(`less ${decreased.join(', ')} mode`)
    }
    interpretation = `Your taste is evolving: ${parts.join(', ')}.`
  }

  return {
    overallDrift: Math.round(overallDrift * 100) / 100,
    networkChanges: networkChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
    interpretation,
  }
}
