import { prisma } from "@/lib/prisma"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { format, formatDistanceToNow } from "date-fns"
import { TasteIDCompletionBanner } from "@/components/tasteid-completion-banner"

export const dynamic = "force-dynamic"

// Get Billboard 200 trending albums
async function getBillboardAlbums() {
  return prisma.album.findMany({
    where: {
      billboardRank: { not: null },
      albumType: { not: 'single' },
    },
    orderBy: { billboardRank: 'asc' },
    take: 20,
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
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, image: true } },
      album: { select: { id: true, spotifyId: true, title: true, artistName: true, coverArtUrl: true } },
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

// Get current user's full status for personalized homepage
async function getUserStatus(userId: string) {
  const [user, reviewCount, firstSpinCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { 
        username: true,
        image: true,
        waxBalance: true,
        tasteId: { select: { id: true, primaryArchetype: true } },
        createdAt: true,
      }
    }),
    prisma.review.count({ where: { userId } }),
    prisma.review.count({ 
      where: { 
        userId, 
        reviewPosition: { lte: 100 } 
      } 
    })
  ])
  
  const tasteIDProgress = Math.min(100, Math.round((reviewCount / 25) * 100))
  
  return { 
    username: user?.username || 'user',
    image: user?.image,
    waxBalance: user?.waxBalance || 0,
    reviewCount, 
    hasTasteID: !!user?.tasteId,
    archetype: user?.tasteId?.primaryArchetype,
    tasteIDProgress,
    firstSpinCount,
    memberSince: user?.createdAt,
  }
}

export default async function Home() {
  const session = await auth()
  const [billboardAlbums, recentReviews, stats, userStatus] = await Promise.all([
    getBillboardAlbums(),
    getRecentReviews(),
    getStats(),
    session?.user?.id ? getUserStatus(session.user.id) : Promise.resolve({ 
      username: '', image: null, waxBalance: 0, reviewCount: 0, hasTasteID: false, 
      archetype: null, tasteIDProgress: 0, firstSpinCount: 0, memberSince: null 
    }),
  ])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* PERSONALIZED DASHBOARD BAR - Always visible when logged in */}
      {session?.user && (
        <section className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="w-full px-6 lg:px-12 xl:px-20 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Welcome + User Info */}
              <div className="flex items-center gap-4">
                <Link href={`/u/${userStatus.username}`} className="flex items-center gap-3 group">
                  {userStatus.image ? (
                    <img src={userStatus.image} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--border)] group-hover:border-[#ffd700] transition-colors" />
                  ) : (
                    <DefaultAvatar size="md" />
                  )}
                  <div>
                    <p className="font-bold group-hover:text-[#ffd700] transition-colors">@{userStatus.username}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {userStatus.archetype ? userStatus.archetype : 'Building TasteID...'}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Progress Stats */}
              <div className="flex items-center gap-6 flex-wrap">
                {/* TasteID Progress */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider">TasteID</p>
                    <p className="text-sm font-bold tabular-nums">
                      {userStatus.hasTasteID ? (
                        <span className="text-[#ffd700]">Complete</span>
                      ) : (
                        <span>{userStatus.tasteIDProgress}%</span>
                      )}
                    </p>
                  </div>
                  {!userStatus.hasTasteID && (
                    <div className="w-20 h-2 bg-[var(--border)] overflow-hidden">
                      <div 
                        className="h-full bg-[#ffd700] transition-all duration-500"
                        style={{ width: `${userStatus.tasteIDProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Ratings */}
                <div className="text-center border-l border-[var(--border)] pl-6">
                  <p className="text-lg font-bold tabular-nums">{userStatus.reviewCount}</p>
                  <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Ratings</p>
                </div>

                {/* First Spins */}
                <div className="text-center border-l border-[var(--border)] pl-6">
                  <p className="text-lg font-bold tabular-nums text-[#ffd700]">{userStatus.firstSpinCount}</p>
                  <p className="text-xs text-[var(--muted)] uppercase tracking-wider">First Spins</p>
                </div>

                {/* WAX Balance */}
                <Link 
                  href="/wallet" 
                  className="flex items-center gap-2 border-l border-[var(--border)] pl-6 hover:text-[#ffd700] transition-colors"
                >
                  <div className="text-center">
                    <p className="text-lg font-bold tabular-nums">{userStatus.waxBalance}</p>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider">WAX</p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* Quick Action */}
                <Link
                  href="/quick-rate"
                  className="px-4 py-2 bg-[#ffd700] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
                >
                  + Rate Album
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HERO - Clear Value Proposition */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12 lg:py-16">
          <div className="max-w-3xl">
            {session ? (
              /* Personalized hero for logged in users */
              <>
                <p className="text-sm tracking-widest uppercase text-[#ffd700] mb-4 font-medium">
                  Welcome Back
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  {userStatus.reviewCount < 5 ? (
                    <>Keep rating to unlock your TasteID</>
                  ) : userStatus.reviewCount < 25 ? (
                    <>{25 - userStatus.reviewCount} more ratings to complete TasteID</>
                  ) : !userStatus.hasTasteID ? (
                    <>Your TasteID is ready!</>
                  ) : (
                    <>Find your next obsession</>
                  )}
                </h1>
                <p className="text-lg text-[var(--muted)] mb-8 max-w-xl leading-relaxed">
                  {userStatus.reviewCount < 25 ? (
                    <>Every rating brings you closer to your unique TasteID and earns you WAX.</>
                  ) : (
                    <>Discover new music, connect with similar taste, and be the first to find what's next.</>
                  )}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/quick-rate"
                    className="px-6 py-3 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
                  >
                    {userStatus.hasTasteID ? 'Keep Rating' : 'Build TasteID'}
                  </Link>
                  <Link
                    href="/discover"
                    className="px-6 py-3 border border-[var(--border)] text-sm font-bold uppercase tracking-wider hover:border-[var(--foreground)] transition-colors"
                  >
                    Discover
                  </Link>
                  <Link
                    href="/discover/connections"
                    className="px-6 py-3 border border-[var(--border)] text-sm font-bold uppercase tracking-wider hover:border-[var(--foreground)] transition-colors"
                  >
                    Find Connections
                  </Link>
                </div>
              </>
            ) : (
              /* Default hero for logged out users */
              <>
                <p className="text-sm tracking-widest uppercase text-[#ffd700] mb-6 font-medium">
                  The Music Platform That Proves Your Taste
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
                  Discover Music.
                  <br />
                  <span className="text-[var(--muted)]">Connect Through Sound.</span>
                  <br />
                  <span className="text-[#ffd700]">Earn Rewards.</span>
                </h1>
                <p className="text-lg text-[var(--muted)] mb-10 max-w-xl leading-relaxed">
                  Rate albums. Build your TasteID. Find people who get your music. 
                  Be the first to discover what's next.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/signup"
                    className="px-8 py-4 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors text-center"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/discover"
                    className="px-8 py-4 border-2 border-[var(--border-dim)] text-sm font-bold uppercase tracking-wider hover:border-[var(--foreground)] transition-colors text-center"
                  >
                    Explore Albums
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* TasteID Banner for logged in users - only show if not complete */}
      {session?.user && !userStatus.hasTasteID && (
        <TasteIDCompletionBanner
          reviewCount={userStatus.reviewCount}
          hasTasteID={userStatus.hasTasteID}
        />
      )}

      {/* THE 3 PILLARS - Revolutionary Features */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16 lg:py-20">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted-dim)] mb-12 text-center">
            Three Revolutionary Features
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* PILLAR 1: GAMIFY */}
            <Link href="/quick-rate" className="group block p-8 border-2 border-[var(--border)] hover:border-[#ffd700] transition-colors bg-[var(--surface-raised)]">
              <div className="w-14 h-14 border-2 border-[#ffd700] flex items-center justify-center mb-6 text-[#ffd700] group-hover:bg-[#ffd700] group-hover:text-black transition-colors">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#ffd700]">GAMIFY</h3>
              <p className="text-2xl font-bold mb-4 leading-tight">
                Prove You Were First
              </p>
              <p className="text-[var(--muted)] leading-relaxed mb-6">
                Review albums early. When they blow up, earn Gold, Silver, or Bronze badges. 
                Climb leaderboards. Collect WAX rewards.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#ffd700]">First Spin Badges</span>
                <span className="text-[var(--muted-dim)]">|</span>
                <span className="text-[var(--muted)]">WAX Rewards</span>
              </div>
            </Link>
            
            {/* PILLAR 2: CONNECT */}
            <Link href="/discover/connections" className="group block p-8 border-2 border-[var(--border)] hover:border-[#00ff88] transition-colors bg-[var(--surface-raised)]">
              <div className="w-14 h-14 border-2 border-[#00ff88] flex items-center justify-center mb-6 text-[#00ff88] group-hover:bg-[#00ff88] group-hover:text-black transition-colors">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#00ff88]">CONNECT</h3>
              <p className="text-2xl font-bold mb-4 leading-tight">
                First Music Social Network
              </p>
              <p className="text-[var(--muted)] leading-relaxed mb-6">
                Find people who truly get your taste. Our algorithm matches you with 
                listeners based on deep musical compatibility.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#00ff88]">Taste Matching</span>
                <span className="text-[var(--muted-dim)]">|</span>
                <span className="text-[var(--muted)]">Music Circles</span>
              </div>
            </Link>
            
            {/* PILLAR 3: DISCOVER */}
            <Link href="/discover" className="group block p-8 border-2 border-[var(--border)] hover:border-[#00bfff] transition-colors bg-[var(--surface-raised)]">
              <div className="w-14 h-14 border-2 border-[#00bfff] flex items-center justify-center mb-6 text-[#00bfff] group-hover:bg-[#00bfff] group-hover:text-black transition-colors">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#00bfff]">DISCOVER</h3>
              <p className="text-2xl font-bold mb-4 leading-tight">
                Best Music Discovery Ever
              </p>
              <p className="text-[var(--muted)] leading-relaxed mb-6">
                TasteID powered by Polarity. The most accurate taste profiling 
                ever created. Get recommendations that actually fit YOU.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#00bfff]">Polarity Engine</span>
                <span className="text-[var(--muted-dim)]">|</span>
                <span className="text-[var(--muted)]">TasteID</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* STATS - Social Proof */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8">
          <div className="flex flex-wrap justify-center gap-12 lg:gap-20">
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-bold tabular-nums">{stats.albumCount.toLocaleString()}</p>
              <p className="text-xs tracking-widest uppercase text-[var(--muted-dim)] mt-1">Albums</p>
            </div>
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-bold tabular-nums">{stats.reviewCount.toLocaleString()}</p>
              <p className="text-xs tracking-widest uppercase text-[var(--muted-dim)] mt-1">Ratings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-bold tabular-nums">{stats.userCount.toLocaleString()}</p>
              <p className="text-xs tracking-widest uppercase text-[var(--muted-dim)] mt-1">Members</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING + RECENT REVIEWS - Side by Side Editorial Layout */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-12 border-l border-r border-[var(--border)]">
            {/* TRENDING - Left Side */}
            <div className="col-span-12 lg:col-span-7 border-r border-[var(--border)] py-10 lg:py-14 px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Trending</h2>
                <Link href="/trending" className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  See All Trending →
                </Link>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {billboardAlbums.slice(0, 20).map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.spotifyId}`}
                    className="group"
                  >
                    <div className="aspect-square w-full bg-[var(--surface)] overflow-hidden relative">
                      {album.coverArtUrl && (
                        <img
                          src={album.coverArtUrlLarge || album.coverArtUrl}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {album.billboardRank && album.billboardRank <= 20 && (
                        <div className="absolute top-1 left-1 bg-[#ffd700] text-black px-1 py-0.5 text-[9px] font-bold">
                          #{album.billboardRank}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-medium truncate mt-1.5 group-hover:text-[var(--muted)] transition-colors">
                      {album.title}
                    </p>
                    <p className="text-[9px] text-[var(--muted-dim)] truncate">
                      {album.artistName}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* RECENT REVIEWS - Right Side */}
            <div className="col-span-12 lg:col-span-5 py-10 lg:py-14 px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Recent Reviews</h2>
                <Link href="/reviews" className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  View All →
                </Link>
              </div>
              
              <div className="space-y-1">
                {recentReviews.map((review) => (
                  <Link
                    key={review.id}
                    href={`/album/${review.album.spotifyId}`}
                    className="group flex gap-3 py-3 border-b border-[var(--border)] hover:bg-[var(--surface)] -mx-3 px-3 transition-colors"
                  >
                    <div className="w-12 h-12 flex-shrink-0 bg-[var(--surface)]">
                      {review.album.coverArtUrl && (
                        <img src={review.album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate group-hover:text-[var(--muted)] transition-colors">
                          {review.album.title}
                        </span>
                        <span className="text-[#ffd700] font-bold text-sm tabular-nums">{review.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] truncate">{review.album.artistName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {review.user.image ? (
                          <img src={review.user.image} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <DefaultAvatar size="xs" />
                        )}
                        <span className="text-[10px] text-[var(--muted-dim)]">@{review.user.username}</span>
                        <span className="text-[10px] text-[var(--muted-faint)]" suppressHydrationWarning>
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLEGE RADIO PARTNERSHIP */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-4">
                College Radio Partnership
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                Your station breaks artists.<br />
                Now you can prove it.
              </h2>
              <p className="text-[var(--muted)] mb-6 leading-relaxed">
                First 50 stations get Founding Status—free premium features forever. 
                Station leaderboards. Verified DJ badges. Conference rankings.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/stations"
                  className="px-6 py-3 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
                >
                  Apply Now
                </Link>
                <span className="text-sm text-[var(--muted)]">
                  <span className="text-[#ffd700] font-bold">23</span> spots remaining
                </span>
              </div>
            </div>
            <div className="border border-[var(--border)] p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
                Station Preview
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#ffd700] font-bold">#1</span>
                    <span className="font-medium">WRVU Nashville</span>
                  </div>
                  <span className="text-sm tabular-nums">847</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--muted)] font-bold">#2</span>
                    <span className="font-medium">WJPZ Syracuse</span>
                  </div>
                  <span className="text-sm tabular-nums">712</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--muted)] font-bold">#3</span>
                    <span className="text-[var(--muted)]">Your Station?</span>
                  </div>
                  <span className="text-sm text-[var(--muted)]">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--surface)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12 lg:py-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to prove your taste?
          </h2>
          <p className="text-lg text-[var(--muted)] mb-10 max-w-xl mx-auto">
            Join thousands of music lovers who are discovering, connecting, and earning through their taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!session ? (
              <Link
                href="/signup"
                className="px-10 py-4 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Create Free Account
              </Link>
            ) : (
              <Link
                href="/quick-rate"
                className="px-10 py-4 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Start Building TasteID
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-sm text-[var(--muted-dim)]">WAXFEED · Polarity Lab LLC · 2025</p>
              <p className="text-xs text-[var(--muted-faint)] mt-1">The platform that proves your music taste.</p>
            </div>
            <nav className="flex flex-wrap gap-6">
              <Link href="/discover" className="text-sm text-[var(--muted-dim)] hover:text-[var(--foreground)] transition-colors">Discover</Link>
              <Link href="/trending" className="text-sm text-[var(--muted-dim)] hover:text-[var(--foreground)] transition-colors">Trending</Link>
              <Link href="/pricing" className="text-sm text-[var(--muted-dim)] hover:text-[var(--foreground)] transition-colors">Pricing</Link>
              <Link href="/stations" className="text-sm text-[#ffd700] hover:text-[#ffed4a] transition-colors">College Radio</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
