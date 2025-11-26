import { prisma } from "@/lib/prisma"
import { ReviewCard } from "@/components/review-card"
import { AlbumCard } from "@/components/album-card"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getRecentReviews() {
  return prisma.review.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
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

async function getTopAlbums() {
  // Get Billboard chart albums sorted by rank
  return prisma.album.findMany({
    take: 12,
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

async function getStats() {
  const [albumCount, reviewCount, userCount] = await Promise.all([
    prisma.album.count(),
    prisma.review.count(),
    prisma.user.count(),
  ])
  return { albumCount, reviewCount, userCount }
}

export default async function Home() {
  const [reviews, albums, stats] = await Promise.all([
    getRecentReviews(),
    getTopAlbums(),
    getStats(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-16">
        {/* Stats - Centered */}
        <div className="flex justify-center gap-16 mb-8 pb-8 border-b border-[#222]">
          <div className="text-center">
            <p className="text-5xl font-bold">{stats.albumCount.toLocaleString()}</p>
            <p className="text-[#888] text-sm">Albums</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold">{stats.reviewCount.toLocaleString()}</p>
            <p className="text-[#888] text-sm">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold">{stats.userCount.toLocaleString()}</p>
            <p className="text-[#888] text-sm">Users</p>
          </div>
        </div>
        {/* Descriptor */}
        <p className="text-center text-[#888] max-w-xl mx-auto">
          A social music review platform.
          Rate albums, build lists, discover new music through friends.
        </p>
      </section>

      {/* Two Column Layout - 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Popular Albums */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Albums</h2>
            <Link href="/trending" className="text-sm text-[#888] hover:text-white no-underline">
              View All →
            </Link>
          </div>
          {albums.length === 0 ? (
            <p className="text-[#888] text-sm">No albums yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  id={album.id}
                  spotifyId={album.spotifyId}
                  title={album.title}
                  artistName={album.artistName}
                  coverArtUrl={album.coverArtUrl}
                  averageRating={album.averageRating}
                  size="sm"
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Reviews */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Reviews</h2>
            <Link href="/reviews" className="text-sm text-[#888] hover:text-white no-underline">
              View All →
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="border border-[#222] p-8 text-center">
              <p className="text-[#888]">No reviews yet.</p>
              <p className="text-sm text-[#666] mt-2">
                Be the first to review an album!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
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
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-[#222] text-center text-xs text-[#666] space-y-2">
        <p>Contact: scrolling@waxfeed.com</p>
        <p>WBRU © 2025 · BROWN BROADCASTING SERVICE, INC. · PROVIDENCE, RI</p>
      </footer>
    </div>
  )
}
