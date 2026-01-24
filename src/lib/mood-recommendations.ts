import { prisma } from "@/lib/prisma"
import { ListeningSignature } from "@/lib/tasteid"

// Mood types based on TasteID Music Networks
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

// Derive the current listening mood from a user's listening signature
export function deriveCognitiveState(signature: ListeningSignature): ListeningMood {
  // Find the dominant mode
  let maxMode: ListeningMood = "comfort"
  let maxValue = 0

  const moodMap: Record<string, ListeningMood> = {
    discovery: "discovery",
    comfort: "comfort",
    deep_dive: "depth",
    reactive: "reactive",
    emotional: "emotional",
  }

  Object.entries(signature).forEach(([key, value]) => {
    if (moodMap[key] && value > maxValue) {
      maxValue = value
      maxMode = moodMap[key]
    }
  })

  return maxMode
}

// Get mood-aware recommendations based on current listening state
export async function getMoodAwareRecommendations(
  userId: string,
  mood: ListeningMood,
  limit: number = 6
): Promise<MoodRecommendation[]> {
  // Get the user's taste profile
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
            select: {
              artistName: true,
            },
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

  // Different recommendation strategies based on mood
  let albums: MoodRecommendation[] = []

  switch (mood) {
    case "comfort":
      // Recommend albums from favorite artists they haven't reviewed
      albums = await getComfortRecommendations(
        favoriteArtists,
        reviewedAlbumIds,
        limit
      )
      break

    case "discovery":
      // Recommend albums from unfamiliar genres or new artists
      albums = await getDiscoveryRecommendations(
        topGenres,
        reviewedAlbumIds,
        limit
      )
      break

    case "depth":
      // Recommend deeper cuts from artists they've reviewed positively
      albums = await getDepthRecommendations(
        user.reviews,
        reviewedAlbumIds,
        limit
      )
      break

    case "reactive":
      // Recommend new releases and trending albums
      albums = await getReactiveRecommendations(reviewedAlbumIds, limit)
      break

    case "emotional":
      // Recommend highly-rated albums that match emotional resonance
      albums = await getEmotionalRecommendations(
        topGenres,
        reviewedAlbumIds,
        limit
      )
      break
  }

  return albums
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
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      genres: true,
    },
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
  // Find albums in adjacent genres
  const albums = await prisma.album.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      averageRating: { gte: 7 },
    },
    take: limit * 3,
    orderBy: { averageRating: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      genres: true,
    },
  })

  // Filter to albums that aren't in their top genres
  const discoveryAlbums = albums.filter((album) => {
    const albumGenres = album.genres || []
    return !topGenres.some((g) => albumGenres.includes(g))
  })

  return discoveryAlbums.slice(0, limit).map((album) => ({
    album,
    reason: `Expand your horizons`,
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
    orderBy: { releaseDate: "asc" }, // Get earlier albums
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      genres: true,
    },
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
  // Get recently released albums
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const albums = await prisma.album.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      releaseDate: { gte: sixMonthsAgo },
    },
    take: limit * 2,
    orderBy: { releaseDate: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      genres: true,
    },
  })

  return albums.slice(0, limit).map((album) => ({
    album,
    reason: `Fresh release`,
    moodMatch: 0.92,
  }))
}

async function getEmotionalRecommendations(
  topGenres: string[],
  excludeIds: Set<string>,
  limit: number
): Promise<MoodRecommendation[]> {
  // Get highly-rated albums in their favorite genres
  const albums = await prisma.album.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      averageRating: { gte: 8.5 },
    },
    take: limit * 3,
    orderBy: { averageRating: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      genres: true,
    },
  })

  // Prefer albums in their favorite genres
  const sortedAlbums = albums.sort((a, b) => {
    const aMatch = (a.genres || []).some((g) => topGenres.includes(g)) ? 1 : 0
    const bMatch = (b.genres || []).some((g) => topGenres.includes(g)) ? 1 : 0
    return bMatch - aMatch
  })

  return sortedAlbums.slice(0, limit).map((album) => ({
    album,
    reason: `Emotionally resonant`,
    moodMatch: 0.95,
  }))
}
