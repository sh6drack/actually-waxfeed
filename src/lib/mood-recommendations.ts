import { prisma } from "@/lib/prisma"
import type { ListeningSignature } from "@/lib/tasteid"

// Mood types derived from TasteID Music Networks
export type ListeningMood = "comfort" | "discovery" | "depth" | "reactive" | "emotional"

interface MoodRecommendation {
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl: string | null
    averageRating: number | null
    genres: string[]
  }
  reason: string
  moodMatch: number
}

// Map listening signature keys to mood types
const SIGNATURE_TO_MOOD: Record<string, ListeningMood> = {
  discovery: "discovery",
  comfort: "comfort",
  deep_dive: "depth",
  reactive: "reactive",
  emotional: "emotional",
}

/**
 * Derive the current listening mood from a user's listening signature
 */
export function deriveCognitiveState(signature: ListeningSignature): ListeningMood {
  let maxMode: ListeningMood = "comfort"
  let maxValue = 0

  for (const [key, value] of Object.entries(signature)) {
    const mood = SIGNATURE_TO_MOOD[key]
    if (mood && value > maxValue) {
      maxValue = value
      maxMode = mood
    }
  }

  return maxMode
}

// Album selection fields for queries
const ALBUM_SELECT = {
  id: true,
  spotifyId: true,
  title: true,
  artistName: true,
  coverArtUrl: true,
  averageRating: true,
  genres: true,
} as const

/**
 * Get mood-aware recommendations based on current listening state
 */
export async function getMoodAwareRecommendations(
  userId: string,
  mood: ListeningMood,
  limit: number = 6
): Promise<MoodRecommendation[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasteId: {
        select: {
          topGenres: true,
          topArtists: true,
          genreVector: true,
          listeningSignature: true,
        },
      },
      reviews: {
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          albumId: true,
          rating: true,
          album: {
            select: { artistName: true },
          },
        },
      },
    },
  })

  if (!user?.tasteId) {
    return []
  }

  const reviewedAlbumIds = new Set(user.reviews.map((r) => r.albumId))
  const favoriteArtists = user.tasteId.topArtists || []
  const topGenres = user.tasteId.topGenres || []

  const moodHandlers: Record<ListeningMood, () => Promise<MoodRecommendation[]>> = {
    comfort: () => getComfortRecommendations(favoriteArtists, reviewedAlbumIds, limit),
    discovery: () => getDiscoveryRecommendations(topGenres, reviewedAlbumIds, limit),
    depth: () => getDepthRecommendations(user.reviews, reviewedAlbumIds, limit),
    reactive: () => getReactiveRecommendations(reviewedAlbumIds, limit),
    emotional: () => getEmotionalRecommendations(topGenres, reviewedAlbumIds, limit),
  }

  return moodHandlers[mood]()
}

async function getComfortRecommendations(
  favoriteArtists: string[],
  excludeIds: Set<string>,
  limit: number
): Promise<MoodRecommendation[]> {
  const albums = await prisma.album.findMany({
    where: {
      artistName: { in: favoriteArtists },
      id: { notIn: Array.from(excludeIds) },
    },
    take: limit * 2,
    orderBy: { averageRating: "desc" },
    select: ALBUM_SELECT,
  })

  return albums.slice(0, limit).map((album) => ({
    album,
    reason: `More from ${album.artistName}`,
    moodMatch: 0.9,
  }))
}

async function getDiscoveryRecommendations(
  topGenres: string[],
  excludeIds: Set<string>,
  limit: number
): Promise<MoodRecommendation[]> {
  const albums = await prisma.album.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      averageRating: { gte: 7 },
    },
    take: limit * 3,
    orderBy: { averageRating: "desc" },
    select: ALBUM_SELECT,
  })

  // Filter to albums that are NOT in their top genres
  const discoveryAlbums = albums.filter((album) => {
    const albumGenres = album.genres || []
    return !topGenres.some((g) => albumGenres.includes(g))
  })

  return discoveryAlbums.slice(0, limit).map((album) => ({
    album,
    reason: "Expand your horizons",
    moodMatch: 0.85,
  }))
}

async function getDepthRecommendations(
  reviews: { albumId: string; rating: number; album: { artistName: string } }[],
  excludeIds: Set<string>,
  limit: number
): Promise<MoodRecommendation[]> {
  // Find artists they've rated highly
  const highlyRatedArtists = reviews
    .filter((r) => r.rating >= 8)
    .map((r) => r.album.artistName)
  const uniqueArtists = [...new Set(highlyRatedArtists)]

  const albums = await prisma.album.findMany({
    where: {
      artistName: { in: uniqueArtists.slice(0, 10) },
      id: { notIn: Array.from(excludeIds) },
    },
    take: limit * 2,
    orderBy: { releaseDate: "asc" },
    select: ALBUM_SELECT,
  })

  return albums.slice(0, limit).map((album) => ({
    album,
    reason: `Deep cut from ${album.artistName}`,
    moodMatch: 0.88,
  }))
}

async function getReactiveRecommendations(
  excludeIds: Set<string>,
  limit: number
): Promise<MoodRecommendation[]> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const albums = await prisma.album.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      releaseDate: { gte: sixMonthsAgo },
    },
    take: limit * 2,
    orderBy: { releaseDate: "desc" },
    select: ALBUM_SELECT,
  })

  return albums.slice(0, limit).map((album) => ({
    album,
    reason: "Fresh release",
    moodMatch: 0.92,
  }))
}

async function getEmotionalRecommendations(
  topGenres: string[],
  excludeIds: Set<string>,
  limit: number
): Promise<MoodRecommendation[]> {
  const albums = await prisma.album.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      averageRating: { gte: 8.5 },
    },
    take: limit * 3,
    orderBy: { averageRating: "desc" },
    select: ALBUM_SELECT,
  })

  // Sort to prefer albums in their favorite genres
  const sortedAlbums = albums.sort((a, b) => {
    const aMatch = (a.genres || []).some((g) => topGenres.includes(g)) ? 1 : 0
    const bMatch = (b.genres || []).some((g) => topGenres.includes(g)) ? 1 : 0
    return bMatch - aMatch
  })

  return sortedAlbums.slice(0, limit).map((album) => ({
    album,
    reason: "Emotionally resonant",
    moodMatch: 0.95,
  }))
}
