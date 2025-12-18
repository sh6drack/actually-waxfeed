import { prisma } from "@/lib/prisma"
import { AlbumCard } from "@/components/album-card"
import { ReviewCard } from "@/components/review-card"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getTrendingAlbums() {
  // Get Billboard 200 chart albums sorted by rank
  return prisma.album.findMany({
    where: { billboardRank: { not: null } },
    orderBy: { billboardRank: "asc" },
    take: 50,
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
      billboardRank: true,
    },
  })
}

async function getTrendingReviews() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  return prisma.review.findMany({
    take: 8,
    where: {
      createdAt: { gte: threeDaysAgo },
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

async function getRecentReleases() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return prisma.album.findMany({
    where: {
      releaseDate: { gte: thirtyDaysAgo },
    },
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
      releaseDate: true,
    },
  })
}

export default async function TrendingPage() {
  const [trendingAlbums, trendingReviews, recentReleases] = await Promise.all([
    getTrendingAlbums(),
    getTrendingReviews(),
    getRecentReleases(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-8 md:mb-12">Trending</h1>

      {/* Top Section: Billboard 200 (left) + Hot Reviews (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 mb-12 md:mb-16">
        {/* Billboard 200 - Left Side */}
        <div className="lg:col-span-3">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Billboard 200</h2>
          {trendingAlbums.length === 0 ? (
            <p className="text-[#888]">No trending albums yet.</p>
          ) : (
            <div className="space-y-2">
              {trendingAlbums.map((album, index) => (
                <Link
                  key={album.id}
                  href={`/album/${album.spotifyId}`}
                  className="flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-[#111] transition-colors no-underline group"
                >
                  <span className="text-lg md:text-xl font-bold text-[#444] w-6 md:w-8 flex-shrink-0">
                    {album.billboardRank}
                  </span>
                  <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 bg-[#222]">
                    {album.coverArtUrl && (
                      <img
                        src={album.coverArtUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate group-hover:underline text-sm md:text-base">
                      {album.title}
                    </p>
                    <p className="text-[#888] text-xs md:text-sm truncate">
                      {album.artistName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {album.averageRating !== null && (
                      <p className="font-bold text-sm md:text-base">{album.averageRating.toFixed(1)}</p>
                    )}
                    <p className="text-[#666] text-xs">
                      {album.totalReviews} {album.totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Hot Reviews - Right Side */}
        <div className="lg:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Hot Reviews</h2>
          {trendingReviews.length === 0 ? (
            <p className="text-[#888]">No recent reviews.</p>
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
        </div>
      </div>

      {/* Recent Releases - Full Width Below */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Recent Releases</h2>
        {recentReleases.length === 0 ? (
          <p className="text-[#888]">No recent releases.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {recentReleases.map((album) => (
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
