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

// Get recent reviews - only show reviews with actual text, not quick rates
async function getRecentReviews() {
  return prisma.review.findMany({
    take: 50,
    where: {
      AND: [
        { text: { not: null } },
        { text: { not: '' } },
      ]
    },
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
  const [user, reviewCount, firstSpinCount, userRecentReviews] = await Promise.all([
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
    }),
    prisma.review.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        album: { select: { id: true, spotifyId: true, title: true, artistName: true, coverArtUrl: true } }
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
    recentReviews: userRecentReviews,
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
      archetype: null, tasteIDProgress: 0, firstSpinCount: 0, memberSince: null, recentReviews: [] 
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
                {/* TasteID Button + Progress */}
                <Link 
                  href={`/u/${userStatus.username}/tasteid`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
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
                  {!userStatus.hasTasteID ? (
                    <div className="w-20 h-2 bg-[var(--border)] overflow-hidden">
                      <div 
                        className="h-full bg-[#ffd700] transition-all duration-500"
                        style={{ width: `${userStatus.tasteIDProgress}%` }}
                      />
                    </div>
                  ) : (
                    <svg className="w-4 h-4 text-[#ffd700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>

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
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {session ? (
              /* Personalized hero for logged in users */
              <>
                {/* Left - Tagline + Progress */}
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-[#ffd700] mb-3 font-medium">
                    {userStatus.archetype ? userStatus.archetype : 'Building Your Profile'}
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                    {userStatus.hasTasteID ? (
                      <>Your taste is <span className="text-[#ffd700]">proven</span>. Keep discovering.</>
                    ) : userStatus.reviewCount < 10 ? (
                      <>Rate {10 - userStatus.reviewCount} more to unlock insights</>
                    ) : (
                      <>{25 - userStatus.reviewCount} ratings until your TasteID</>
                    )}
                  </h1>
                  
                  {/* TasteID Progress Bar - Always visible for engagement */}
                  <div className="mb-6 p-4 border border-[var(--border)] bg-[var(--surface)] rounded-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[#ff6b6b] to-[#ffd700] rounded-sm flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2L3 7l7 5 7-5-7-5zM3 17l7 5 7-5M3 12l7 5 7-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">TasteID Progress</span>
                      </div>
                      <span className="text-xs font-bold text-[#ffd700]">
                        {userStatus.hasTasteID ? '100%' : `${userStatus.tasteIDProgress}%`}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2.5 bg-[var(--border)] overflow-hidden rounded-full mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff6b6b] via-[#ffd700] to-[#00ff88] transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${userStatus.hasTasteID ? 100 : userStatus.tasteIDProgress}%` }}
                      />
                    </div>
                    
                    {/* Progress Milestones */}
                    <div className="flex justify-between text-[10px] text-[var(--muted)] mb-2">
                      <span className={userStatus.reviewCount >= 5 ? 'text-[#ffd700]' : ''}>5 ratings</span>
                      <span className={userStatus.reviewCount >= 10 ? 'text-[#ffd700]' : ''}>10 ratings</span>
                      <span className={userStatus.reviewCount >= 25 ? 'text-[#00ff88]' : ''}>25 ratings</span>
                    </div>
                    
                    {/* Status Message */}
                    <p className="text-xs text-[var(--muted)]">
                      {userStatus.hasTasteID ? (
                        <span className="text-[#00ff88]">TasteID Complete! Your musical identity is established.</span>
                      ) : userStatus.tasteIDProgress < 20 ? (
                        <>Start your journey! Rate <span className="text-[#ffd700] font-medium">{25 - userStatus.reviewCount}</span> more albums to unlock your TasteID.</>
                      ) : userStatus.tasteIDProgress < 40 ? (
                        <>Nice start! Your taste profile is forming. <span className="text-[#ffd700] font-medium">{25 - userStatus.reviewCount}</span> to go.</>
                      ) : userStatus.tasteIDProgress < 80 ? (
                        <>Making progress! Your musical identity is taking shape. <span className="text-[#ffd700] font-medium">{25 - userStatus.reviewCount}</span> more.</>
                      ) : (
                        <>Almost there! Just <span className="text-[#ffd700] font-medium">{25 - userStatus.reviewCount}</span> more ratings to complete your TasteID!</>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/discover"
                      className="px-4 py-2.5 bg-[#00bfff] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#33ccff] transition-all hover:scale-105"
                    >
                      Discover
                    </Link>
                    <Link
                      href="/discover/connections"
                      className="px-4 py-2.5 bg-[#00ff88] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#33ff9f] transition-all hover:scale-105"
                    >
                      Connect
                    </Link>
                    <Link
                      href="/quick-rate"
                      className="px-4 py-2.5 bg-[#ffd700] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-all hover:scale-105"
                    >
                      Rate
                    </Link>
                    <Link
                      href={`/u/${userStatus.username}/tasteid`}
                      className="px-4 py-2.5 bg-[#ff6b6b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#ff8585] transition-all hover:scale-105"
                    >
                      TasteID
                    </Link>
                  </div>
                </div>
                
                {/* Right - Recent Activity */}
                <div className="border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs tracking-[0.2em] uppercase text-[var(--muted)]">Your Recent Ratings</h3>
                    <Link href={`/u/${userStatus.username}`} className="text-xs text-[#ffd700] hover:underline">
                      View All →
                    </Link>
                  </div>
                  
                  {userStatus.recentReviews && userStatus.recentReviews.length > 0 ? (
                    <div className="space-y-2">
                      {userStatus.recentReviews.slice(0, 4).map((review: any) => (
                        <Link
                          key={review.id}
                          href={`/album/${review.album.spotifyId}`}
                          className="flex items-center gap-3 p-2 hover:bg-[var(--surface)] transition-colors -mx-2"
                        >
                          <div className="w-10 h-10 flex-shrink-0 bg-[var(--surface)]">
                            {review.album.coverArtUrl && (
                              <img src={review.album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{review.album.title}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{review.album.artistName}</p>
                          </div>
                          <span className="text-[#ffd700] font-bold text-sm">{review.rating.toFixed(1)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-[var(--muted)] mb-3">No ratings yet</p>
                      <Link
                        href="/quick-rate"
                        className="text-xs text-[#ffd700] font-bold uppercase tracking-wider hover:underline"
                      >
                        Start Rating →
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Default hero for logged out users - FIRST IMPRESSION */
              <>
                {/* Left Column - Main Content */}
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-[#ffd700] mb-3 font-medium">
                    The World's First Music Taste Platform
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                    Prove You Found It First.
                  </h1>
                  <p className="text-base md:text-lg text-[var(--muted)] mb-6 leading-relaxed">
                    Rate albums. Get <span className="text-[#ffd700] font-semibold">timestamped proof</span> of your discovery.
                    Connect with people who <span className="text-[var(--foreground)]">actually get your music</span>.
                  </p>
                  
                  {/* TasteID Progress Preview - Engagement hook for logged out users */}
                  <div className="mb-6 p-4 border border-[var(--border)] bg-[var(--surface)] rounded-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[#ff6b6b] to-[#ffd700] rounded-sm flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2L3 7l7 5 7-5-7-5zM3 17l7 5 7-5M3 12l7 5 7-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Your TasteID Journey</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--muted)]">0%</span>
                    </div>
                    
                    {/* Progress Bar - Empty to show potential */}
                    <div className="h-2.5 bg-[var(--border)] overflow-hidden rounded-full mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff6b6b] via-[#ffd700] to-[#00ff88] transition-all duration-700 ease-out rounded-full"
                        style={{ width: '0%' }}
                      />
                    </div>
                    
                    {/* Progress Milestones */}
                    <div className="flex justify-between text-[10px] text-[var(--muted)] mb-2">
                      <span>5 ratings</span>
                      <span>10 ratings</span>
                      <span>25 ratings</span>
                    </div>
                    
                    {/* Status Message */}
                    <p className="text-xs text-[var(--muted)]">
                      Sign up to start building your unique musical identity. Rate 25 albums to unlock your <span className="text-[#ffd700] font-medium">TasteID</span>.
                    </p>
                  </div>
                  
                  {/* 4 Action Buttons - Same as logged in */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Link
                      href="/discover"
                      className="px-4 py-2.5 bg-[#00bfff] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#33ccff] transition-all hover:scale-105"
                    >
                      Discover
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2.5 bg-[#00ff88] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#33ff9f] transition-all hover:scale-105"
                    >
                      Connect
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2.5 bg-[#ffd700] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-all hover:scale-105"
                    >
                      Rate
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2.5 bg-[#ff6b6b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#ff8585] transition-all hover:scale-105"
                    >
                      TasteID
                    </Link>
                  </div>

                  {/* Social Proof */}
                  <p className="text-xs text-[var(--muted-dim)]">
                    Join <span className="text-[var(--foreground)] font-medium">{stats.userCount.toLocaleString()}+</span> music lovers · <span className="text-[var(--foreground)] font-medium">{stats.reviewCount.toLocaleString()}</span> ratings logged
                  </p>
                </div>
                
                {/* Right Column - Feature Highlights */}
                <div className="border border-[var(--border)] p-4">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-4">What You'll Unlock</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border-b border-[var(--border)]">
                      <div className="w-8 h-8 bg-[#00bfff] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#00bfff]">Discover</p>
                        <p className="text-xs text-[var(--muted)]">Personalized recommendations that actually match your taste</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 border-b border-[var(--border)]">
                      <div className="w-8 h-8 bg-[#00ff88] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#00ff88]">Connect</p>
                        <p className="text-xs text-[var(--muted)]">Find people who truly understand your music taste</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 border-b border-[var(--border)]">
                      <div className="w-8 h-8 bg-[#ffd700] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#ffd700]">Rate</p>
                        <p className="text-xs text-[var(--muted)]">Timestamped proof you discovered artists first</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3">
                      <div className="w-8 h-8 bg-[#ff6b6b] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2L3 7l7 5 7-5-7-5zM3 17l7 5 7-5M3 12l7 5 7-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#ff6b6b]">TasteID</p>
                        <p className="text-xs text-[var(--muted)]">Your unique musical DNA and archetype revealed</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/signup"
                    className="block w-full mt-4 px-4 py-3 bg-[#ffd700] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-all text-center"
                  >
                    Get Started Free →
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

      {/* STATS BAR - Compact Social Proof */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-4">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            <div className="text-center">
              <span className="text-2xl font-bold tabular-nums">{stats.albumCount.toLocaleString()}</span>
              <span className="text-xs tracking-widest uppercase text-[var(--muted-dim)] ml-2">Albums</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold tabular-nums">{stats.reviewCount.toLocaleString()}</span>
              <span className="text-xs tracking-widest uppercase text-[var(--muted-dim)] ml-2">Ratings</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold tabular-nums">{stats.userCount.toLocaleString()}</span>
              <span className="text-xs tracking-widest uppercase text-[var(--muted-dim)] ml-2">Members</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING + RECENT REVIEWS - Side by Side Editorial Layout (FIRST VIEW) */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-r border-[var(--border)]">
            {/* TRENDING - Left Side (50%) */}
            <div className="border-r border-[var(--border)] py-10 lg:py-14 px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Trending</h2>
                <Link href="/trending" className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  See All Trending →
                </Link>
              </div>
              
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {billboardAlbums.slice(0, 50).map((album) => (
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

            {/* RECENT REVIEWS - Right Side (50%) */}
            <div className="py-10 lg:py-14 px-6">
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
                      {review.text && (
                        <p className="text-[11px] text-[var(--muted)] mt-2 line-clamp-2 leading-relaxed">
                          "{review.text}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
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

      {/* THE 3 PILLARS - Collapsible Dropdown */}
      <section className="border-b border-[var(--border)]">
        <details className="group">
          <summary className="w-full px-6 lg:px-12 xl:px-20 py-6 cursor-pointer list-none flex items-center justify-between hover:bg-[var(--surface)] transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-xs tracking-[0.3em] uppercase text-[var(--muted-dim)]">
                What Makes WAXFEED Different?
              </span>
              <span className="text-xs px-2 py-1 bg-[#ffd700] text-black font-bold">3 FEATURES</span>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          
          <div className="w-full px-6 lg:px-12 xl:px-20 pb-12 pt-4 bg-[var(--surface)]">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* PILLAR 1: GAMIFY */}
              <Link href="/quick-rate" className="group/card block p-6 border border-[var(--border)] hover:border-[#ffd700] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#ffd700] flex items-center justify-center text-[#ffd700]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#ffd700]">GAMIFY</h3>
                </div>
                <p className="font-bold mb-2">Prove You Were First</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Review albums early. Earn Gold, Silver, Bronze badges when they trend.
                </p>
                <span className="text-xs text-[#ffd700]">First Spin Badges → WAX Rewards</span>
              </Link>
              
              {/* PILLAR 2: CONNECT */}
              <Link href="/discover/connections" className="group/card block p-6 border border-[var(--border)] hover:border-[#00ff88] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#00ff88] flex items-center justify-center text-[#00ff88]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#00ff88]">CONNECT</h3>
                </div>
                <p className="font-bold mb-2">First Music Social Network</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Find people who truly get your taste. Deep musical compatibility matching.
                </p>
                <span className="text-xs text-[#00ff88]">Taste Matching → Music Circles</span>
              </Link>
              
              {/* PILLAR 3: DISCOVER */}
              <Link href="/discover" className="group/card block p-6 border border-[var(--border)] hover:border-[#00bfff] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#00bfff] flex items-center justify-center text-[#00bfff]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#00bfff]">DISCOVER</h3>
                </div>
                <p className="font-bold mb-2">Best Music Discovery Ever</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  TasteID powered by Polarity. Recommendations that actually fit YOU.
                </p>
                <span className="text-xs text-[#00bfff]">Polarity Engine → TasteID</span>
              </Link>
            </div>
          </div>
        </details>
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
