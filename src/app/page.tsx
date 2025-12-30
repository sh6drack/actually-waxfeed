import { prisma } from "@/lib/prisma"
import { ReviewCard } from "@/components/review-card"
import { AlbumCard } from "@/components/album-card"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"

// Force dynamic rendering for fresh data
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

async function getFriendsActivity(userId: string | undefined) {
  if (!userId) return []

  // Get users the current user is friends with
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    },
    select: { user1Id: true, user2Id: true },
  })

  // Extract friend IDs (the other person in each friendship)
  const friendIds = friendships.map(f =>
    f.user1Id === userId ? f.user2Id : f.user1Id
  )

  if (friendIds.length === 0) return []

  // Get recent reviews from friends
  return prisma.review.findMany({
    where: { userId: { in: friendIds } },
    take: 5,
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
    },
  })
}

async function getTopAlbums() {
  // Get Billboard chart albums sorted by rank
  // CRITICAL: NEVER show singles
  return prisma.album.findMany({
    take: 40,
    where: {
      billboardRank: { not: null },
      albumType: { not: 'single' }
    },
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
    // CRITICAL: Only count albums (not singles)
    prisma.album.count({ where: { albumType: { not: 'single' } } }),
    prisma.review.count(),
    prisma.user.count(),
  ])
  return { albumCount, reviewCount, userCount }
}

export default async function Home() {
  const session = await auth()
  const [reviews, albums, stats, friendsActivity] = await Promise.all([
    getRecentReviews(),
    getTopAlbums(),
    getStats(),
    getFriendsActivity(session?.user?.id),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
      {/* Friends Activity - Top Section */}
      {session && friendsActivity.length > 0 && (
        <section className="mb-6 lg:mb-8 pb-6 lg:pb-8 border-b border-[#222]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-bold">Friends Activity</h2>
          </div>
          <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {friendsActivity.map((review) => (
                <Link
                  key={review.id}
                  href={`/album/${review.album.spotifyId || review.album.id}`}
                  className="flex-shrink-0 w-32 lg:w-48 group no-underline"
                >
                  <div className="aspect-square bg-[#181818] mb-2 overflow-hidden">
                    {review.album.coverArtUrl ? (
                      <img
                        src={review.album.coverArtUrl}
                        alt={review.album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#666]">
                        No Cover
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {review.user.image ? (
                      <img
                        src={review.user.image}
                        alt={review.user.username || ""}
                        className="w-4 h-4 lg:w-5 lg:h-5 rounded-full"
                      />
                    ) : (
                      <DefaultAvatar size="xs" />
                    )}
                    <span className="text-xs lg:text-sm text-[#888] truncate">
                      {review.user.username}
                    </span>
                    <span className="text-xs lg:text-sm font-bold">{review.rating}/10</span>
                  </div>
                  <p className="text-xs lg:text-sm truncate">{review.album.title}</p>
                  <p className="text-xs text-[#666]">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Hero Stats */}
      <section className="mb-8 lg:mb-16">
        <div className="flex justify-center gap-8 sm:gap-12 lg:gap-16 mb-6 lg:mb-8 pb-6 lg:pb-8 border-b border-[#222]">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl lg:text-5xl font-bold">{stats.albumCount.toLocaleString()}</p>
            <p className="text-[#888] text-xs sm:text-sm">Albums</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl lg:text-5xl font-bold">{stats.reviewCount.toLocaleString()}</p>
            <p className="text-[#888] text-xs sm:text-sm">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl lg:text-5xl font-bold">{stats.userCount.toLocaleString()}</p>
            <p className="text-[#888] text-xs sm:text-sm">Users</p>
          </div>
        </div>
        <p className="text-center text-[#888] text-sm lg:text-base max-w-xl mx-auto px-4">
          A social music review platform. Rate albums, build lists, discover new music through friends.
        </p>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Popular Albums */}
        <section>
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-2xl font-bold">Top Albums</h2>
            <Link href="/trending" className="text-sm text-[#888] hover:text-white no-underline">
              View All →
            </Link>
          </div>
          {albums.length === 0 ? (
            <p className="text-[#888] text-sm">No albums yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
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
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-2xl font-bold">Recent Reviews</h2>
            <Link href="/reviews" className="text-sm text-[#888] hover:text-white no-underline">
              View All →
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="border border-[#222] p-6 lg:p-8 text-center">
              <p className="text-[#888] text-sm">No reviews yet.</p>
              <p className="text-xs text-[#666] mt-2">
                Be the first to review an album!
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
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
      <footer className="mt-10 lg:mt-16 pt-6 lg:pt-8 border-t border-[#222] text-center text-xs text-[#666] space-y-2">
        <p>Contact: scrolling@waxfeed.com</p>
        <p>WBRU © 2025 · BROWN BROADCASTING SERVICE, INC.</p>
      </footer>
    </div>
  )
}
