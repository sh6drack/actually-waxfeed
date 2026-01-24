import { prisma } from "@/lib/prisma"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { format, formatDistanceToNow } from "date-fns"
import { FirstSpinWidget } from "@/components/wax/FirstSpinWidget"

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

// Get recently trended albums (for subtle FOMO)
async function getRecentlyTrended() {
  return prisma.album.findMany({
    where: { 
      isTrending: true,
      trendedAt: { not: null }
    },
    orderBy: { trendedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      totalReviews: true,
      trendedAt: true,
    }
  })
}

// Get albums about to trend (approaching 100 reviews)
async function getApproachingTrend() {
  return prisma.album.findMany({
    where: {
      totalReviews: { gte: 70, lt: 100 },
      isTrending: false,
    },
    orderBy: { totalReviews: 'desc' },
    take: 3,
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      totalReviews: true,
    }
  })
}

// Get active users to connect with (for logged out users or new users)
async function getActiveUsers(excludeUserId?: string) {
  return prisma.user.findMany({
    where: {
      id: excludeUserId ? { not: excludeUserId } : undefined,
      username: { not: null },
      reviews: { some: {} }, // Users who have at least one review
    },
    orderBy: [
      { reviews: { _count: 'desc' } },
    ],
    take: 8,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      tasteId: {
        select: {
          primaryArchetype: true,
        }
      },
      _count: {
        select: { reviews: true }
      }
    }
  })
}

export default async function Home() {
  const session = await auth()
  const [billboardAlbums, recentReviews, stats, activeUsers, recentlyTrended, approachingTrend] = await Promise.all([
    getBillboardAlbums(),
    getRecentReviews(),
    getStats(),
    getActiveUsers(session?.user?.id),
    getRecentlyTrended(),
    getApproachingTrend(),
  ])
  const weekOf = format(new Date(), "MMM d, yyyy")

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Hero - The Contrarian Truth */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-4 font-bold">
              The only music platform that proves your taste
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.02em] leading-tight mb-6">
              Everyone says "I liked them before they blew up."
              <br />
              <span className="text-[--muted]">WaxFeed lets you prove it.</span>
            </h1>
            <p className="text-base lg:text-lg text-[--muted] mb-8 max-w-xl">
              Review albums. Get timestamped. When they trend, you get credit.
              Your position is recorded forever: "#7 to review this album."
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {!session ? (
                <>
                  <Link
                    href="/signup"
                    className="px-6 py-4 bg-white text-black text-[12px] uppercase tracking-[0.15em] font-bold hover:bg-[#e5e5e5] transition-colors text-center"
                  >
                    Start Proving Your Taste
                  </Link>
                  <Link
                    href="/discover"
                    className="px-6 py-4 border border-[--border] text-[12px] uppercase tracking-[0.15em] hover:border-white transition-colors text-center"
                  >
                    Browse Albums
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/discover"
                    className="px-6 py-4 bg-white text-black text-[12px] uppercase tracking-[0.15em] font-bold hover:bg-[#e5e5e5] transition-colors text-center"
                  >
                    Review an Album
                  </Link>
                  <Link
                    href="/wallet"
                    className="px-6 py-4 border border-[--border] text-[12px] uppercase tracking-[0.15em] hover:border-white transition-colors text-center"
                  >
                    View Your Badges
                  </Link>
                </>
              )}
            </div>

            {/* The subtle offer - shown to everyone */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ffd700] rounded-full" />
                <span className="text-[--muted]">
                  <span className="text-white font-medium">{stats.reviewCount.toLocaleString()}</span> reviews recorded
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[--muted]">
                  <span className="text-white font-medium">{approachingTrend.length}</span> albums about to trend
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="border-b border-[--border] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            How It Works
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-10 h-10 border border-white flex items-center justify-center mb-4">
                <span className="text-lg font-bold">1</span>
              </div>
              <p className="font-bold mb-2">Review an album</p>
              <p className="text-sm text-[--muted]">
                Your review position is recorded. "You were #23 to review this album."
              </p>
            </div>
            <div>
              <div className="w-10 h-10 border border-white flex items-center justify-center mb-4">
                <span className="text-lg font-bold">2</span>
              </div>
              <p className="font-bold mb-2">Album trends</p>
              <p className="text-sm text-[--muted]">
                When it hits 100+ reviews, charts, or blows up—the system checks who called it early.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 border border-[#ffd700] flex items-center justify-center mb-4 text-[#ffd700]">
                <span className="text-lg font-bold">3</span>
              </div>
              <p className="font-bold mb-2">You get credit</p>
              <p className="text-sm text-[--muted]">
                Gold Spin (first 10), Silver Spin (first 50), or Bronze Spin (first 100). Proof forever.
              </p>
            </div>
          </div>
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

      {/* Connect & TasteID Section */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row">
            {/* LEFT: Active Users - Horizontal Grid (70%) */}
            {activeUsers.length > 0 && (
              <div className="lg:w-[70%] px-6 py-10 lg:border-r border-[--border]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">
                      Connect
                    </h2>
                    <div className="h-px w-8 bg-[--border]" />
                  </div>
                  <Link
                    href="/friends"
                    className="text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors flex items-center gap-2"
                  >
                    View All
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {activeUsers.slice(0, 6).map((user, index) => (
                    <Link
                      key={user.id}
                      href={`/u/${user.username}`}
                      className="group"
                    >
                      <div className="aspect-square w-full mb-2 border-2 border-[--border] overflow-hidden group-hover:border-white transition-colors relative">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <DefaultAvatar size="lg" className="w-full h-full" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-2">
                          <span className="text-[9px] font-bold tracking-wider">{user._count.reviews}</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold truncate group-hover:text-[--muted] transition-colors">
                        @{user.username}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT: First Spin Widget + Subtle FOMO (30%) */}
            <div className="lg:w-[30%] px-6 py-10 border-t lg:border-t-0 border-[--border]">
              <FirstSpinWidget />
              
              {/* Subtle FOMO: Recently Trended */}
              {recentlyTrended.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[--border]">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted] mb-3">
                    Just Trended
                  </p>
                  <div className="space-y-2">
                    {recentlyTrended.slice(0, 3).map((album) => (
                      <Link
                        key={album.id}
                        href={`/album/${album.spotifyId}`}
                        className="flex items-center gap-2 group"
                      >
                        <div className="w-8 h-8 flex-shrink-0 bg-[#181818]">
                          {album.coverArtUrl && (
                            <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate group-hover:text-[--muted] transition">
                            {album.title}
                          </p>
                          <p className="text-[10px] text-[--muted]">
                            {album.totalReviews} reviews
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtle urgency: About to Trend */}
              {approachingTrend.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[--border]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-full animate-pulse" />
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">
                      Approaching
                    </p>
                  </div>
                  <div className="space-y-2">
                    {approachingTrend.map((album) => (
                      <Link
                        key={album.id}
                        href={`/album/${album.spotifyId}`}
                        className="flex items-center gap-2 group"
                      >
                        <div className="w-8 h-8 flex-shrink-0 bg-[#181818]">
                          {album.coverArtUrl && (
                            <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate group-hover:text-[--muted] transition">
                            {album.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-[--border]">
                              <div 
                                className="h-full bg-[#ffd700]" 
                                style={{ width: `${album.totalReviews}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[--muted] tabular-nums">
                              {album.totalReviews}/100
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {/* College Radio CTA - The Godfather Offer */}
      <section className="border-t border-[--border] bg-gradient-to-b from-transparent to-[#ffd700]/5">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-3 font-bold">
                College Radio Partnership
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Your station breaks artists.<br />
                Now you can prove it.
              </h2>
              <p className="text-[--muted] mb-6">
                First 50 stations get Founding Status—free premium features forever. 
                Station leaderboards. Verified DJ badges. Conference rankings.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/stations"
                  className="px-6 py-3 bg-[#ffd700] text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#ffed4a] transition"
                >
                  Apply Now
                </Link>
                <span className="text-sm text-[--muted]">
                  <span className="text-[#ffd700] font-bold">23</span> spots remaining
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="border border-[#ffd700]/30 p-6 min-w-[280px]">
                <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted] mb-4">
                  Station Preview
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#ffd700]">#1</span>
                    <span>WRVU Nashville</span>
                    <span className="font-bold">847</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-70">
                    <span>#2</span>
                    <span>WJPZ Syracuse</span>
                    <span className="font-bold">712</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-50">
                    <span>#3</span>
                    <span>Your Station?</span>
                    <span className="font-bold">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <p className="text-[11px] tracking-[0.15em] uppercase text-[--muted] mb-2">
                WAXFEED · Polarity Lab LLC · 2025
              </p>
              <p className="text-xs text-[--border]">
                The only platform that proves your music taste.
              </p>
            </div>
            <nav className="flex flex-wrap gap-6 lg:gap-8">
              <Link href="/discover" className="text-[11px] tracking-[0.15em] text-[--muted] hover:text-white transition-colors">
                DISCOVER
              </Link>
              <Link href="/pricing" className="text-[11px] tracking-[0.15em] text-[--muted] hover:text-white transition-colors">
                PRICING
              </Link>
              <Link href="/shop" className="text-[11px] tracking-[0.15em] text-[--muted] hover:text-white transition-colors">
                SHOP
              </Link>
              <Link href="/stations" className="text-[11px] tracking-[0.15em] text-[#ffd700] hover:text-[#ffed4a] transition-colors">
                COLLEGE RADIO
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
