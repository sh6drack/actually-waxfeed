import { prisma } from "@/lib/prisma"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

// Get trending albums from last 30 days
async function getTrendingAlbums() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return prisma.album.findMany({
    where: {
      albumType: { not: 'single' },
      reviews: {
        some: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    },
    orderBy: [
      { totalReviews: 'desc' },
      { averageRating: 'desc' }
    ],
    take: 12,
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

// Get recent reviews
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

// Get stats
async function getStats() {
  const [albumCount, reviewCount, userCount] = await Promise.all([
    prisma.album.count({ where: { albumType: { not: 'single' } } }),
    prisma.review.count(),
    prisma.user.count(),
  ])
  return { albumCount, reviewCount, userCount }
}

export default async function Home() {
  const session = await auth()
  const [trendingAlbums, recentReviews, stats] = await Promise.all([
    getTrendingAlbums(),
    getRecentReviews(),
    getStats(),
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header section */}
      <section className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#555] mb-4">
            Track what you listen to
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] tracking-[-0.02em]">
            Your music diary.
          </h1>
          <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] tracking-[-0.02em] text-[#444]">
            Rate, review, discover.
          </p>

          {!session && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-10 px-6 py-3.5 bg-white text-black text-[13px] uppercase tracking-[0.1em] font-medium hover:bg-[#e5e5e5] transition-colors"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex gap-10 lg:gap-16">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-light tabular-nums">{stats.albumCount.toLocaleString()}</span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#555]">Albums</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-light tabular-nums">{stats.reviewCount.toLocaleString()}</span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#555]">Reviews</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-light tabular-nums">{stats.userCount.toLocaleString()}</span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#555]">Critics</span>
          </div>
        </div>
      </section>

      {/* Main grid: Trending + Reviews */}
      <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Left: Trending Albums */}
          <div>
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-[#555] mb-8">
              Trending This Month
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {trendingAlbums.map((album, i) => (
                <Link
                  key={album.id}
                  href={`/album/${album.spotifyId}`}
                  className="group"
                >
                  <div className="relative aspect-square bg-[#111] overflow-hidden">
                    {album.coverArtUrl ? (
                      <img
                        src={album.coverArtUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#333]">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                        </svg>
                      </div>
                    )}
                    {/* Rank for top 3 */}
                    {i < 3 && (
                      <div className="absolute top-0 left-0 bg-white text-black text-[10px] font-semibold px-1.5 py-0.5">
                        {i + 1}
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <p className="text-[12px] font-medium truncate group-hover:text-[#777] transition-colors">
                      {album.title}
                    </p>
                    <p className="text-[11px] text-[#555] truncate">
                      {album.artistName}
                    </p>
                    {album.averageRating && (
                      <p className="text-[11px] text-[#444] mt-0.5 tabular-nums">
                        {album.averageRating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/trending"
              className="inline-block mt-8 text-[11px] tracking-[0.2em] uppercase text-[#555] hover:text-white transition-colors"
            >
              View All Trending →
            </Link>
          </div>

          {/* Right: Recent Reviews */}
          <div>
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-[#555] mb-8">
              Recent Reviews
            </h2>

            <div className="divide-y divide-[#1a1a1a]">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/album/${review.album.spotifyId}`}
                  className="group flex gap-4 py-4 first:pt-0 hover:bg-[#0f0f0f] -mx-3 px-3 transition-colors"
                >
                  {/* Album art */}
                  <div className="w-14 h-14 flex-shrink-0 bg-[#111] overflow-hidden">
                    {review.album.coverArtUrl ? (
                      <img
                        src={review.album.coverArtUrl}
                        alt={review.album.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#333]">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[13px] font-medium truncate group-hover:text-[#777] transition-colors">
                        {review.album.title}
                      </span>
                      <span className="text-[12px] font-semibold text-[#555] tabular-nums flex-shrink-0">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#555] truncate">
                      {review.album.artistName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {review.user.image ? (
                        <img src={review.user.image} alt="" className="w-4 h-4" />
                      ) : (
                        <DefaultAvatar size="xs" />
                      )}
                      <span className="text-[10px] text-[#444]">
                        {review.user.username}
                      </span>
                      <span className="text-[10px] text-[#333]">·</span>
                      <span className="text-[10px] text-[#333]">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {review.text && (
                      <p className="text-[11px] text-[#444] mt-2 line-clamp-2 leading-relaxed">
                        {review.text}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/reviews"
              className="inline-block mt-8 text-[11px] tracking-[0.2em] uppercase text-[#555] hover:text-white transition-colors"
            >
              View All Reviews →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] mt-8">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <p className="text-[11px] tracking-[0.15em] uppercase text-[#333]">
              WAXFEED · Polarity Lab LLC · 2025
            </p>
            <nav className="flex gap-8">
              <Link href="/discover" className="text-[11px] tracking-[0.15em] uppercase text-[#444] hover:text-white transition-colors">
                Discover
              </Link>
              <Link href="/hot-takes" className="text-[11px] tracking-[0.15em] uppercase text-[#444] hover:text-white transition-colors">
                Hot Takes
              </Link>
              <Link href="/reviews" className="text-[11px] tracking-[0.15em] uppercase text-[#444] hover:text-white transition-colors">
                Reviews
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
