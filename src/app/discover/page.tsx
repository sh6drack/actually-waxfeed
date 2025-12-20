import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { AlbumCard } from "@/components/album-card"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getRecommendations(userId: string | undefined) {
  if (!userId) {
    // For logged out users, show popular albums
    return {
      forYou: [],
      becauseYouLiked: null,
      popularInGenre: null,
      newReleases: await getNewReleases(),
      trending: await getTrending(),
    }
  }

  // Get user's reviews with high ratings (7+)
  const userReviews = await prisma.review.findMany({
    where: {
      userId,
      rating: { gte: 7 }
    },
    include: {
      album: {
        select: {
          id: true,
          artistName: true,
          genres: true,
          title: true,
        }
      }
    },
    orderBy: { rating: "desc" },
    take: 20,
  })

  if (userReviews.length === 0) {
    return {
      forYou: [],
      becauseYouLiked: null,
      popularInGenre: null,
      newReleases: await getNewReleases(),
      trending: await getTrending(),
    }
  }

  // Extract favorite artists and genres
  const favoriteArtists = [...new Set(userReviews.map(r => r.album.artistName))]
  const favoriteGenres = [...new Set(userReviews.flatMap(r => r.album.genres))]
  const reviewedAlbumIds = userReviews.map(r => r.album.id)

  // Pick a random liked album for "Because you liked..."
  const randomLikedAlbum = userReviews[Math.floor(Math.random() * userReviews.length)].album

  // Get albums by same artists that user hasn't reviewed
  const byFavoriteArtists = await prisma.album.findMany({
    where: {
      artistName: { in: favoriteArtists.slice(0, 5) },
      id: { notIn: reviewedAlbumIds },
    },
    take: 8,
    orderBy: { averageRating: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
    }
  })

  // Get popular albums in user's favorite genres
  let popularInGenre = null
  if (favoriteGenres.length > 0) {
    const topGenre = favoriteGenres[0]
    const genreAlbums = await prisma.album.findMany({
      where: {
        genres: { has: topGenre },
        id: { notIn: reviewedAlbumIds },
        totalReviews: { gte: 1 },
      },
      take: 8,
      orderBy: { averageRating: "desc" },
      select: {
        id: true,
        spotifyId: true,
        title: true,
        artistName: true,
        coverArtUrl: true,
        averageRating: true,
        totalReviews: true,
      }
    })

    if (genreAlbums.length > 0) {
      popularInGenre = {
        genre: topGenre,
        albums: genreAlbums,
      }
    }
  }

  // Get albums similar users liked (collaborative filtering)
  // Find users who gave high ratings to same albums
  const similarUserIds = await prisma.review.findMany({
    where: {
      albumId: { in: reviewedAlbumIds.slice(0, 5) },
      rating: { gte: 7 },
      userId: { not: userId },
    },
    select: { userId: true },
    distinct: ["userId"],
    take: 10,
  })

  let forYou: typeof byFavoriteArtists = []
  if (similarUserIds.length > 0) {
    // Get albums those similar users liked that current user hasn't reviewed
    forYou = await prisma.album.findMany({
      where: {
        id: { notIn: reviewedAlbumIds },
        reviews: {
          some: {
            userId: { in: similarUserIds.map(u => u.userId) },
            rating: { gte: 8 },
          }
        }
      },
      take: 8,
      orderBy: { averageRating: "desc" },
      select: {
        id: true,
        spotifyId: true,
        title: true,
        artistName: true,
        coverArtUrl: true,
        averageRating: true,
        totalReviews: true,
      }
    })
  }

  // Fallback to byFavoriteArtists if collaborative filtering didn't work
  if (forYou.length === 0) {
    forYou = byFavoriteArtists
  }

  return {
    forYou,
    becauseYouLiked: {
      album: randomLikedAlbum,
      recommendations: byFavoriteArtists.filter(a => a.artistName === randomLikedAlbum.artistName).slice(0, 4),
    },
    popularInGenre,
    newReleases: await getNewReleases(),
    trending: await getTrending(),
  }
}

async function getNewReleases() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return prisma.album.findMany({
    where: { releaseDate: { gte: thirtyDaysAgo } },
    take: 8,
    orderBy: { releaseDate: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
    }
  })
}

async function getTrending() {
  return prisma.album.findMany({
    where: { billboardRank: { not: null } },
    take: 8,
    orderBy: { billboardRank: "asc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
    }
  })
}

export default async function DiscoverPage() {
  const session = await auth()
  const recommendations = await getRecommendations(session?.user?.id)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-8">Discover</h1>

      {/* For You - Personalized recommendations */}
      {recommendations.forYou.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">For You</h2>
          <p className="text-xs text-[#888] mb-4">Based on your listening history</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {recommendations.forYou.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                spotifyId={album.spotifyId}
                title={album.title}
                artistName={album.artistName}
                coverArtUrl={album.coverArtUrl}
                averageRating={album.averageRating}
                totalReviews={album.totalReviews}
              />
            ))}
          </div>
        </section>
      )}

      {/* Because you liked... */}
      {recommendations.becauseYouLiked && recommendations.becauseYouLiked.recommendations.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">
            Because you liked "{recommendations.becauseYouLiked.album.title}"
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recommendations.becauseYouLiked.recommendations.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                spotifyId={album.spotifyId}
                title={album.title}
                artistName={album.artistName}
                coverArtUrl={album.coverArtUrl}
                averageRating={album.averageRating}
                totalReviews={album.totalReviews}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular in genre */}
      {recommendations.popularInGenre && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">
            Popular in <span className="capitalize">{recommendations.popularInGenre.genre}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {recommendations.popularInGenre.albums.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                spotifyId={album.spotifyId}
                title={album.title}
                artistName={album.artistName}
                coverArtUrl={album.coverArtUrl}
                averageRating={album.averageRating}
                totalReviews={album.totalReviews}
              />
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {recommendations.newReleases.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">New Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {recommendations.newReleases.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                spotifyId={album.spotifyId}
                title={album.title}
                artistName={album.artistName}
                coverArtUrl={album.coverArtUrl}
                averageRating={album.averageRating}
                totalReviews={album.totalReviews}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {recommendations.trending.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Trending</h2>
            <Link href="/trending" className="text-sm text-[#888] hover:text-white no-underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {recommendations.trending.map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                spotifyId={album.spotifyId}
                title={album.title}
                artistName={album.artistName}
                coverArtUrl={album.coverArtUrl}
                averageRating={album.averageRating}
                totalReviews={album.totalReviews}
              />
            ))}
          </div>
        </section>
      )}

      {/* No reviews prompt */}
      {session && recommendations.forYou.length === 0 && (
        <div className="text-center py-12 border border-[#222]">
          <p className="text-[#888] mb-2">Start reviewing albums to get personalized recommendations!</p>
          <Link
            href="/search"
            className="inline-block bg-white text-black px-4 py-2 font-bold no-underline hover:bg-gray-100"
          >
            Find Albums
          </Link>
        </div>
      )}

      {/* Not logged in prompt */}
      {!session && (
        <div className="text-center py-12 border border-[#222]">
          <p className="text-[#888] mb-2">Sign in to get personalized recommendations</p>
          <Link
            href="/login"
            className="inline-block bg-white text-black px-4 py-2 font-bold no-underline hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  )
}
