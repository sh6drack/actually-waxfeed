import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK RATE ALBUM SELECTION v2 - "The Taste Algorithm"
// Uses TasteID, Audio DNA, Skip Signals, and Quality Metrics
// ═══════════════════════════════════════════════════════════════════════════════

interface ScoredAlbum {
  album: AlbumWithTracks
  score: number
  source: 'artist' | 'genre' | 'audio' | 'quality' | 'discovery'
}

interface AlbumWithTracks {
  id: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge: string | null
  releaseDate: Date
  genres: string[]
  billboardRank: number | null
  averageRating: number | null
  totalReviews: number
  tracks?: Array<{
    id: string
    name: string
    trackNumber: number
    previewUrl: string | null
    durationMs: number
  }>
  audioProfile?: {
    avgEnergy: number
    avgValence: number
    avgDanceability: number
    avgAcousticness: number
    avgTempo: number
  } | null
}

// GET /api/albums/swipe - Get personalized albums for Quick Rate mode
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const isOnboarding = searchParams.get('onboarding') === 'true'

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Build exclusion list (reviewed + skipped albums)
    // ═══════════════════════════════════════════════════════════════════════
    const [reviewedAlbums, skippedAlbums] = await Promise.all([
      prisma.review.findMany({
        where: { userId: user.id },
        select: { albumId: true },
      }),
      // Exclude skips, but "not_now" can resurface after 14 days
      prisma.albumSkip.findMany({
        where: {
          userId: user.id,
          OR: [
            { reason: { in: ['not_interested', 'already_know'] } },
            { reason: 'not_now', createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
            { reason: null, createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { albumId: true },
      }),
    ])

    const excludeIds = [...new Set([
      ...reviewedAlbums.map(r => r.albumId),
      ...skippedAlbums.map(s => s.albumId),
    ])]

    // Track selection for preview playback
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
      billboardRank: true,
      averageRating: true,
      totalReviews: true,
      audioProfile: {
        select: {
          avgEnergy: true,
          avgValence: true,
          avgDanceability: true,
          avgAcousticness: true,
          avgTempo: true,
        },
      },
      ...trackSelect,
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ONBOARDING MODE - Billboard hits + popular albums for new users
    // ═══════════════════════════════════════════════════════════════════════
    if (isOnboarding) {
      const popularAlbums = await prisma.album.findMany({
        where: {
          id: { notIn: excludeIds },
          coverArtUrl: { not: null },
          albumType: { not: 'single' },
          OR: [
            { billboardRank: { not: null } },
            { totalReviews: { gte: 5 } },
          ],
        },
        select: albumSelect,
        take: limit * 3,
        orderBy: [
          { billboardRank: 'asc' },
          { totalReviews: 'desc' },
        ],
      })

      // Shuffle and dedupe
      const shuffled = dedupeAndShuffle(popularAlbums as AlbumWithTracks[])
      return successResponse(shuffled.slice(0, limit))
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Fetch user intelligence data
    // ═══════════════════════════════════════════════════════════════════════
    const [tasteId, audioDNA, recentReviews, skipsByGenre] = await Promise.all([
      prisma.tasteID.findUnique({
        where: { userId: user.id },
        select: {
          genreVector: true,
          topGenres: true,
          topArtists: true,
          adventurenessScore: true,
          artistDNA: true,
        },
      }),
      prisma.userAudioDNA.findUnique({
        where: { userId: user.id },
        select: {
          preferredEnergy: true,
          preferredValence: true,
          preferredDanceability: true,
          featureCorrelations: true,
        },
      }),
      // Recent high-rated reviews (last 30 days, rating >= 7)
      prisma.review.findMany({
        where: {
          userId: user.id,
          rating: { gte: 7 },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          album: { select: { artistName: true, genres: true } },
        },
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
      // Skip patterns by genre
      prisma.albumSkip.findMany({
        where: { userId: user.id },
        include: {
          album: { select: { genres: true } },
        },
      }),
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Compute skip signals (penalize high-skip genres)
    // ═══════════════════════════════════════════════════════════════════════
    const genreSkipCounts: Record<string, number> = {}
    for (const skip of skipsByGenre) {
      for (const genre of skip.album.genres) {
        genreSkipCounts[genre] = (genreSkipCounts[genre] || 0) + 1
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Extract user preferences
    // ═══════════════════════════════════════════════════════════════════════
    const genreVector = (tasteId?.genreVector as Record<string, number>) || {}
    const topGenres = tasteId?.topGenres || []
    const adventureness = tasteId?.adventurenessScore ?? 0.5

    // Recent favorite artists (recency-weighted)
    const recentArtists = [...new Set(recentReviews.map(r => r.album.artistName))]
    const allFavoriteArtists = tasteId?.topArtists || []

    // Combine recent + all-time, prioritizing recent
    const favoriteArtists = [...new Set([...recentArtists, ...allFavoriteArtists])].slice(0, 25)

    // Parse audio preferences
    const audioPrefs = audioDNA ? {
      energy: parseAudioPref(audioDNA.preferredEnergy),
      valence: parseAudioPref(audioDNA.preferredValence),
      danceability: parseAudioPref(audioDNA.preferredDanceability),
    } : null

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Fetch candidate albums from multiple pools
    // ═══════════════════════════════════════════════════════════════════════
    const poolSize = limit * 5 // Get a large pool for scoring

    // Use random offset for true variety (not just shuffling same top results)
    const totalAlbums = await prisma.album.count({
      where: {
        id: { notIn: excludeIds },
        coverArtUrl: { not: null },
        albumType: { not: 'single' },
      },
    })
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalAlbums - poolSize))

    const [artistPool, genrePool, qualityPool, discoveryPool] = await Promise.all([
      // Pool 1: Albums by favorite artists
      favoriteArtists.length > 0 ? prisma.album.findMany({
        where: {
          artistName: { in: favoriteArtists },
          id: { notIn: excludeIds },
          coverArtUrl: { not: null },
          albumType: { not: 'single' },
        },
        select: albumSelect,
        take: poolSize,
      }) : Promise.resolve([]),

      // Pool 2: Albums in user's top genres
      topGenres.length > 0 ? prisma.album.findMany({
        where: {
          id: { notIn: excludeIds },
          coverArtUrl: { not: null },
          albumType: { not: 'single' },
          genres: { hasSome: topGenres },
        },
        select: albumSelect,
        take: poolSize,
        skip: Math.floor(Math.random() * 100), // Random offset within genre
      }) : Promise.resolve([]),

      // Pool 3: Quality albums (Billboard + highly rated)
      prisma.album.findMany({
        where: {
          id: { notIn: excludeIds },
          coverArtUrl: { not: null },
          albumType: { not: 'single' },
          OR: [
            { billboardRank: { not: null } },
            { averageRating: { gte: 7 }, totalReviews: { gte: 3 } },
          ],
        },
        select: albumSelect,
        take: poolSize,
        orderBy: [
          { billboardRank: 'asc' },
          { averageRating: 'desc' },
        ],
      }),

      // Pool 4: Discovery albums (outside comfort zone)
      prisma.album.findMany({
        where: {
          id: { notIn: excludeIds },
          coverArtUrl: { not: null },
          albumType: { not: 'single' },
          // Exclude top 5 genres for true discovery
          ...(topGenres.length >= 3 ? {
            NOT: { genres: { hasSome: topGenres.slice(0, 3) } },
          } : {}),
        },
        select: albumSelect,
        take: poolSize,
        skip: randomOffset,
      }),
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: Score all candidate albums
    // ═══════════════════════════════════════════════════════════════════════
    const scoredAlbums: ScoredAlbum[] = []
    const seenIds = new Set<string>()

    // Score artist matches
    for (const album of artistPool as AlbumWithTracks[]) {
      if (seenIds.has(album.id)) continue
      seenIds.add(album.id)

      const artistIndex = favoriteArtists.indexOf(album.artistName)
      const recencyBoost = artistIndex < recentArtists.length ? 0.2 : 0
      const artistScore = 1 - (artistIndex / favoriteArtists.length) + recencyBoost

      scoredAlbums.push({
        album,
        score: computeAlbumScore(album, genreVector, genreSkipCounts, audioPrefs, artistScore),
        source: 'artist',
      })
    }

    // Score genre matches
    for (const album of genrePool as AlbumWithTracks[]) {
      if (seenIds.has(album.id)) continue
      seenIds.add(album.id)

      scoredAlbums.push({
        album,
        score: computeAlbumScore(album, genreVector, genreSkipCounts, audioPrefs, 0),
        source: 'genre',
      })
    }

    // Score quality albums
    for (const album of qualityPool as AlbumWithTracks[]) {
      if (seenIds.has(album.id)) continue
      seenIds.add(album.id)

      const qualityBoost = album.billboardRank ? 0.3 * (1 - album.billboardRank / 200) : 0
      scoredAlbums.push({
        album,
        score: computeAlbumScore(album, genreVector, genreSkipCounts, audioPrefs, qualityBoost),
        source: 'quality',
      })
    }

    // Score discovery albums (lower base score but contributes to variety)
    for (const album of discoveryPool as AlbumWithTracks[]) {
      if (seenIds.has(album.id)) continue
      seenIds.add(album.id)

      // Discovery score scales with user's adventureness
      const discoveryBoost = adventureness * 0.3
      scoredAlbums.push({
        album,
        score: computeAlbumScore(album, genreVector, genreSkipCounts, audioPrefs, discoveryBoost) * 0.7,
        source: 'discovery',
      })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: Select and interleave for variety
    // ═══════════════════════════════════════════════════════════════════════

    // Sort by score
    scoredAlbums.sort((a, b) => b.score - a.score)

    // Calculate allocation based on adventureness
    // More adventurous users get more discovery, less get more familiar
    const artistAlloc = Math.ceil(limit * 0.25)
    const genreAlloc = Math.ceil(limit * (0.35 + (1 - adventureness) * 0.15)) // 35-50%
    const qualityAlloc = Math.ceil(limit * 0.15)
    const discoveryAlloc = Math.ceil(limit * (0.15 + adventureness * 0.15)) // 15-30%

    // Take top from each category
    const artistPicks = scoredAlbums.filter(s => s.source === 'artist').slice(0, artistAlloc)
    const genrePicks = scoredAlbums.filter(s => s.source === 'genre').slice(0, genreAlloc)
    const qualityPicks = scoredAlbums.filter(s => s.source === 'quality').slice(0, qualityAlloc)
    const discoveryPicks = scoredAlbums.filter(s => s.source === 'discovery').slice(0, discoveryAlloc)

    // Interleave: artist, genre, quality, discovery, genre, artist, ...
    const interleaved: AlbumWithTracks[] = []
    const maxLen = Math.max(artistPicks.length, genrePicks.length, qualityPicks.length, discoveryPicks.length)

    for (let i = 0; i < maxLen && interleaved.length < limit; i++) {
      if (artistPicks[i]) interleaved.push(artistPicks[i].album)
      if (genrePicks[i * 2]) interleaved.push(genrePicks[i * 2].album)
      if (qualityPicks[i]) interleaved.push(qualityPicks[i].album)
      if (discoveryPicks[i]) interleaved.push(discoveryPicks[i].album)
      if (genrePicks[i * 2 + 1]) interleaved.push(genrePicks[i * 2 + 1].album)
    }

    // Fill remaining slots from overall top scored
    if (interleaved.length < limit) {
      const usedIds = new Set(interleaved.map(a => a.id))
      for (const scored of scoredAlbums) {
        if (interleaved.length >= limit) break
        if (!usedIds.has(scored.album.id)) {
          interleaved.push(scored.album)
          usedIds.add(scored.album.id)
        }
      }
    }

    // Final dedupe by title+artist (same album different IDs)
    const finalAlbums = dedupeAndShuffle(interleaved, false).slice(0, limit)

    return successResponse(finalAlbums)

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error getting swipe albums:', error)
    return errorResponse('Failed to get albums', 500)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function computeAlbumScore(
  album: AlbumWithTracks,
  genreVector: Record<string, number>,
  genreSkipCounts: Record<string, number>,
  audioPrefs: { energy: AudioPref, valence: AudioPref, danceability: AudioPref } | null,
  bonusScore: number
): number {
  let score = 0.5 + bonusScore // Base score

  // Genre affinity (from TasteID genreVector)
  const genreAffinities = album.genres.map(g => genreVector[g] || 0.3)
  if (genreAffinities.length > 0) {
    const avgAffinity = genreAffinities.reduce((a, b) => a + b, 0) / genreAffinities.length
    score += avgAffinity * 0.3 // Up to +0.3
  }

  // Skip penalty (reduce score for high-skip genres)
  const genreSkips = album.genres.map(g => genreSkipCounts[g] || 0)
  if (genreSkips.length > 0) {
    const maxSkips = Math.max(...genreSkips)
    if (maxSkips >= 5) {
      score -= Math.min(0.3, maxSkips * 0.02) // Up to -0.3
    }
  }

  // Audio DNA matching
  if (audioPrefs && album.audioProfile) {
    const audioScore = computeAudioMatch(album.audioProfile, audioPrefs)
    score += audioScore * 0.2 // Up to +0.2
  }

  // Quality signals
  if (album.billboardRank) {
    score += 0.1 * (1 - album.billboardRank / 200) // +0.1 for #1, less for lower
  }
  if (album.averageRating && album.averageRating >= 7 && album.totalReviews >= 3) {
    score += 0.1 // Bonus for well-reviewed albums
  }

  // Small random factor for variety
  score += Math.random() * 0.1

  return Math.max(0, Math.min(1, score))
}

interface AudioPref {
  min: number
  max: number
  sweetSpot: number
  weight: number
}

function parseAudioPref(pref: unknown): AudioPref {
  if (typeof pref === 'object' && pref !== null) {
    const p = pref as Record<string, number>
    return {
      min: p.min ?? 0,
      max: p.max ?? 1,
      sweetSpot: p.sweetSpot ?? 0.5,
      weight: p.weight ?? 0.5,
    }
  }
  return { min: 0, max: 1, sweetSpot: 0.5, weight: 0.5 }
}

function computeAudioMatch(
  profile: NonNullable<AlbumWithTracks['audioProfile']>,
  prefs: { energy: AudioPref, valence: AudioPref, danceability: AudioPref }
): number {
  let totalScore = 0
  let totalWeight = 0

  // Energy match
  totalScore += matchFeature(profile.avgEnergy, prefs.energy) * prefs.energy.weight
  totalWeight += prefs.energy.weight

  // Valence match
  totalScore += matchFeature(profile.avgValence, prefs.valence) * prefs.valence.weight
  totalWeight += prefs.valence.weight

  // Danceability match
  totalScore += matchFeature(profile.avgDanceability, prefs.danceability) * prefs.danceability.weight
  totalWeight += prefs.danceability.weight

  return totalWeight > 0 ? totalScore / totalWeight : 0.5
}

function matchFeature(value: number, pref: AudioPref): number {
  // Score based on distance from sweet spot, with range tolerance
  if (value < pref.min || value > pref.max) {
    return 0.2 // Outside preferred range
  }
  const distFromSweet = Math.abs(value - pref.sweetSpot)
  const maxDist = Math.max(pref.sweetSpot - pref.min, pref.max - pref.sweetSpot)
  return 1 - (distFromSweet / maxDist) * 0.5 // 0.5-1.0 within range
}

function dedupeAndShuffle(albums: AlbumWithTracks[], shuffle = true): AlbumWithTracks[] {
  const seen = new Set<string>()
  const deduped = albums.filter(album => {
    const key = `${album.title.toLowerCase()}|${album.artistName.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (shuffle) {
    return deduped.sort(() => Math.random() - 0.5)
  }
  return deduped
}
