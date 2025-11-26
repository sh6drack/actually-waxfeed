import { prisma } from "@/lib/prisma"
import { AlbumCard } from "@/components/album-card"
import { ReviewCard } from "@/components/review-card"

export const dynamic = "force-dynamic"

async function getTrendingAlbums() {
  // Get Billboard chart albums sorted by rank
  return prisma.album.findMany({
    where: { billboardRank: { not: null } },
    orderBy: { billboardRank: "asc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
    },
  })
}

async function getTrendingReviews() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  return prisma.review.findMany({
    take: 10,
    where: {
      createdAt: { gte: oneDayAgo },
    },
    orderBy: [
      { likeCount: "desc" },
      { replyCount: "desc" },
    ],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
          isVerified: true,
        },
      },
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })
}

async function getRecentAlbums() {
  return prisma.album.findMany({
    take: 10,
    orderBy: { releaseDate: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
    },
  })
}

export default async function TrendingPage() {
  const [trendingAlbums, trendingReviews, recentAlbums] = await Promise.all([
    getTrendingAlbums(),
    getTrendingReviews(),
    getRecentAlbums(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tighter mb-12">Trending</h1>

      {/* Popular Albums */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Popular Albums</h2>
        {trendingAlbums.length === 0 ? (
          <p className="text-[#888]">No albums with reviews yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trendingAlbums.map((album) => (
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
        )}
      </section>

      {/* Hot Reviews */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Hot Reviews (24h)</h2>
        {trendingReviews.length === 0 ? (
          <p className="text-[#888]">No reviews in the last 24 hours.</p>
        ) : (
          <div className="space-y-4">
            {trendingReviews.map((review) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                rating={review.rating}
                text={review.text}
                createdAt={review.createdAt}
                isEdited={review.isEdited}
                likeCount={review.likeCount}
                replyCount={review._count.replies}
                user={review.user}
                album={review.album}
                compact
              />
            ))}
          </div>
        )}
      </section>

      {/* New Releases */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Recent Releases</h2>
        {recentAlbums.length === 0 ? (
          <p className="text-[#888]">No albums yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {recentAlbums.map((album) => (
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
        )}
      </section>
    </div>
  )
}
