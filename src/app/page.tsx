import { prisma } from "@/lib/prisma"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { format, formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

// Get Billboard 200 trending albums
async function getBillboardAlbums() {
  return prisma.album.findMany({
    where: {
      billboardRank: { not: null },
      albumType: { not: 'single' },
    },
    orderBy: {
      billboardRank: 'asc'
    },
    take: 50,
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      coverArtUrlLarge: true,
      averageRating: true,
      totalReviews: true,
      billboardRank: true,
    },
  })
}

// Get recent reviews
async function getRecentReviews() {
  return prisma.review.findMany({
    take: 50,
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
  const [billboardAlbums, recentReviews, stats] = await Promise.all([
    getBillboardAlbums(),
    getRecentReviews(),
    getStats(),
  ])
  const weekOf = format(new Date(), "MMM d, yyyy")

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header section */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <p className="text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-2xl">
              A social music review platform. Rate albums, build lists, discover new music through friends.
            </p>
            <div className="flex-shrink-0 lg:text-right">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-1">
                Week Of
              </p>
              <p className="text-2xl lg:text-3xl font-light tracking-tight">
                {weekOf}
              </p>
            </div>
          </div>

          {!session && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 bg-white text-black text-[12px] uppercase tracking-[0.1em] font-medium hover:bg-[#e5e5e5] transition-colors"
            >
              Get Started
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex gap-8 lg:gap-12">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-light tabular-nums">{stats.albumCount.toLocaleString()}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Albums</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-light tabular-nums">{stats.reviewCount.toLocaleString()}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Reviews</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-light tabular-nums">{stats.userCount.toLocaleString()}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Users</span>
          </div>
        </div>
      </section>

      {/* Main Split Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* LEFT: Trending */}
          <section className="lg:w-1/2 px-6 py-12 lg:py-16 lg:border-r border-[--border] flex flex-col">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">
                Trending
              </h2>
            </div>

            {/* Album grid - grows to fill space */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 flex-1">
              {billboardAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.spotifyId}`}
                  className="group"
                >
                  {/* Album art */}
                  <div className="aspect-square w-full bg-[--border] overflow-hidden mb-2 relative">
                    {album.coverArtUrlLarge || album.coverArtUrl ? (
                      <img
                        src={album.coverArtUrlLarge || album.coverArtUrl || ''}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--muted]">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                        </svg>
                      </div>
                    )}
                    {/* Billboard rank badge */}
                    {album.billboardRank && (
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 text-[10px] font-bold tracking-wider">
                        #{album.billboardRank}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <p className="text-[11px] sm:text-[12px] font-medium truncate group-hover:text-[--muted] transition-colors">
                    {album.title}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[--muted] truncate">
                    {album.artistName}
                  </p>
                </Link>
              ))}
            </div>

            {/* See All button at bottom */}
            <div className="mt-8 pt-6 border-t border-[--border]">
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
              >
                See All Trending
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </section>

          {/* RIGHT: Recent Reviews */}
          <section className="lg:w-1/2 px-6 py-12 lg:py-16 border-t lg:border-t-0 border-[--border] flex flex-col">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">
                Recent Reviews
              </h2>
            </div>

            {/* Reviews list - grows to fill space */}
            <div className="space-y-0 flex-1">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/album/${review.album.spotifyId}`}
                  className="group flex gap-4 py-4 border-b border-[--border] last:border-b-0 hover:bg-[--border]/20 -mx-3 px-3 transition-colors"
                >
                  {/* Album art */}
                  <div className="w-14 h-14 flex-shrink-0 bg-[--border] overflow-hidden">
                    {review.album.coverArtUrl ? (
                      <img
                        src={review.album.coverArtUrl}
                        alt={review.album.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--border]">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[13px] font-medium truncate group-hover:text-[--muted] transition-colors">
                        {review.album.title}
                      </span>
                      <span className="text-[13px] font-semibold text-[--muted] tabular-nums flex-shrink-0">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[--muted] truncate">
                      {review.album.artistName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {review.user.image ? (
                        <img src={review.user.image} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <DefaultAvatar size="xs" />
                      )}
                      <span className="text-[10px] text-[--muted]">
                        {review.user.username}
                      </span>
                      <span className="text-[10px] text-[--border]">·</span>
                      <span className="text-[10px] text-[--border]">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {review.text && (
                      <p className="text-[11px] text-[--muted] mt-2 line-clamp-2 leading-relaxed">
                        {review.text}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* See All button at bottom */}
            <div className="mt-8 pt-6 border-t border-[--border]">
              <Link
                href="/reviews"
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
              >
                See All Reviews
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[--border] mt-8">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <p className="text-[11px] tracking-[0.15em] uppercase text-[--border]">
              WAXFEED · Polarity Lab LLC · 2025
            </p>
            <nav className="flex gap-8">
              <Link href="/discover" className="text-[11px] tracking-[0.15em] text-[--muted] hover:text-white transition-colors">
                DISCOVER
              </Link>
              <Link href="/hot-takes" className="text-[11px] tracking-[0.15em] text-[--muted] hover:text-white transition-colors">
                HOT TAKES
              </Link>
              <Link href="/reviews" className="text-[11px] tracking-[0.15em] text-[--muted] hover:text-white transition-colors">
                REVIEWS
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
