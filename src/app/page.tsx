import { prisma } from "@/lib/prisma"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { format, formatDistanceToNow } from "date-fns"
import { TasteIDCompletionBanner } from "@/components/tasteid-completion-banner"
import { getCurrentTier, getKeepBuildingMessage } from "@/lib/tasteid-tiers"

export const dynamic = "force-dynamic"

// Get Billboard 200 trending albums
async function getBillboardAlbums() {
  try {
    return await prisma.album.findMany({
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
  } catch (error) {
    console.error('Database error in getBillboardAlbums:', error)
    return []
  }
}

// Get recent reviews - only show reviews with actual text, not quick rates
async function getRecentReviews() {
  try {
    return await prisma.review.findMany({
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
  } catch (error) {
    console.error('Database error in getRecentReviews:', error)
    return []
  }
}

// Get stats
async function getStats() {
  try {
    const [albumCount, reviewCount, userCount] = await Promise.all([
      prisma.album.count({ where: { albumType: { not: 'single' } } }),
      prisma.review.count(),
      prisma.user.count(),
    ])
    return { albumCount, reviewCount, userCount }
  } catch (error) {
    console.error('Database error in getStats:', error)
    return { albumCount: 0, reviewCount: 0, userCount: 0 }
  }
}

// Get current user's full status for personalized homepage
async function getUserStatus(userId: string) {
  try {
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
  } catch (error) {
    console.error('Database error in getUserStatus:', error)
    return { 
      username: 'user', image: null, waxBalance: 0, reviewCount: 0, hasTasteID: false, 
      archetype: null, tasteIDProgress: 0, firstSpinCount: 0, memberSince: null, recentReviews: [] 
    }
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
          <div className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-3 md:py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4">
              {/* Welcome + User Info */}
              <div className="flex items-center gap-3 md:gap-4">
                <Link href={`/u/${userStatus.username}`} className="flex items-center gap-2 md:gap-3 group touch-target">
                  {userStatus.image ? (
                    <img src={userStatus.image} alt="" className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-[var(--border)] group-hover:border-[--accent-hover] transition-colors" />
                  ) : (
                    <DefaultAvatar size="md" />
                  )}
                  <div>
                    <p className="text-sm md:text-base font-bold group-hover:text-[--accent-primary] transition-colors">@{userStatus.username}</p>
                    <p className="text-[11px] md:text-xs text-[var(--muted)]">
                      {userStatus.archetype ? userStatus.archetype : 'Building TasteID...'}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Progress Stats - Responsive grid layout */}
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                {/* TasteID Button + Progress - NEVER shows "Complete" */}
                {(() => {
                  const tier = getCurrentTier(userStatus.reviewCount)
                  const keepBuildingMsg = getKeepBuildingMessage(userStatus.reviewCount)
                  return (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Link
                        href={`/u/${userStatus.username}/tasteid`}
                        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider">TasteID</p>
                          <p className="text-xs sm:text-sm font-bold" style={{ color: tier.color }}>
                            {tier.id === 'locked' ? `${userStatus.tasteIDProgress}%` : tier.name}
                          </p>
                        </div>
                        {tier.id === 'locked' ? (
                          <div className="w-16 sm:w-20 h-2 bg-[var(--border)] overflow-hidden">
                            <div
                              className="h-full bg-[--accent-primary] transition-all duration-500"
                              style={{ width: `${userStatus.tasteIDProgress}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-[var(--muted)] hidden sm:inline">{keepBuildingMsg}</span>
                        )}
                      </Link>
                      {tier.id !== 'locked' && (
                        <Link
                          href="/quick-rate"
                          className="px-2 sm:px-3 py-1.5 bg-[--accent-primary] text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors"
                        >
                          + Add
                        </Link>
                      )}
                    </div>
                  )
                })()}

                {/* Ratings */}
                <div className="text-center border-l border-[var(--border)] pl-3 sm:pl-6">
                  <p className="text-base sm:text-lg font-bold tabular-nums">{userStatus.reviewCount}</p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider">Ratings</p>
                </div>

                {/* First Spins */}
                <div className="text-center border-l border-[var(--border)] pl-3 sm:pl-6">
                  <p className="text-base sm:text-lg font-bold tabular-nums text-[--accent-primary]">{userStatus.firstSpinCount}</p>
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider">1st Spins</p>
                </div>

                {/* WAX Balance - Hidden on very small screens, shown in header */}
                <Link
                  href="/wallet"
                  className="hidden sm:flex items-center gap-2 border-l border-[var(--border)] pl-3 sm:pl-6 hover:text-[--accent-primary] transition-colors"
                >
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold tabular-nums">{userStatus.waxBalance}</p>
                    <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider">WAX</p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* Quick Action - Only on larger screens */}
                <Link
                  href="/quick-rate"
                  className="hidden md:block px-4 py-2 bg-[--accent-primary] text-black text-xs font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors"
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
        <div className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-6 md:py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {session ? (
              /* Personalized hero for logged in users */
              <>
                {/* Left - Tagline + Progress */}
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-[--accent-primary] mb-3 font-medium">
                    {userStatus.archetype ? userStatus.archetype : 'Building Your Profile'}
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                    {userStatus.hasTasteID ? (
                      <>Your taste is <span className="text-[--accent-primary]">proven</span>. Keep discovering.</>
                    ) : userStatus.reviewCount < 10 ? (
                      <>Rate {10 - userStatus.reviewCount} more to unlock insights</>
                    ) : (
                      <>{25 - userStatus.reviewCount} ratings until your TasteID</>
                    )}
                  </h1>
                  
                  {/* TasteID Progress - Vinyl Record Design */}
                  <div className="mb-6">
                    <div className="flex items-start gap-6">
                      {/* Vinyl Record Progress Visualization */}
                      <div className="relative flex-shrink-0">
                        {/* Outer glow based on progress */}
                        <div
                          className="absolute -inset-2 blur-xl opacity-40 rounded-full transition-all duration-1000"
                          style={{
                            background: userStatus.hasTasteID
                              ? `conic-gradient(from 0deg, #ffd700, #00ff88, #00bfff, #ff6b6b, #ffd700)`
                              : `conic-gradient(from -90deg, #ffd700 ${userStatus.tasteIDProgress * 3.6}deg, transparent ${userStatus.tasteIDProgress * 3.6}deg)`
                          }}
                        />

                        {/* Vinyl record base */}
                        <div className="relative w-28 h-28">
                          {/* Outer ring - progress track */}
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {/* Background track */}
                            <circle
                              cx="50" cy="50" r="46"
                              fill="none"
                              stroke="rgba(255,255,255,0.08)"
                              strokeWidth="6"
                            />
                            {/* Progress arc */}
                            <circle
                              cx="50" cy="50" r="46"
                              fill="none"
                              stroke="url(#progressGradient)"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={`${(userStatus.hasTasteID ? 100 : userStatus.tasteIDProgress) * 2.89} 289`}
                              className="transition-all duration-1000 ease-out"
                            />
                            {/* Gradient definition */}
                            <defs>
                              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffd700" />
                                <stop offset="50%" stopColor="#00ff88" />
                                <stop offset="100%" stopColor="#00bfff" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Inner vinyl grooves */}
                          <div className="absolute inset-3 rounded-full bg-[#0a0a0a] border border-white/5">
                            {/* Groove lines */}
                            <div className="absolute inset-2 rounded-full border border-white/[0.03]" />
                            <div className="absolute inset-4 rounded-full border border-white/[0.03]" />
                            <div className="absolute inset-6 rounded-full border border-white/[0.03]" />

                            {/* Center label */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
                                style={{
                                  background: userStatus.hasTasteID
                                    ? 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)'
                                    : 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)'
                                }}
                              >
                                <span className={`text-xs font-black ${userStatus.hasTasteID ? 'text-black' : 'text-white/60'}`}>
                                  {userStatus.hasTasteID ? '✓' : userStatus.tasteIDProgress + '%'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Spinning highlight when complete */}
                          {userStatus.hasTasteID && (
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div
                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-spin"
                                style={{ animationDuration: '3s' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Details */}
                      <div className="flex-1 pt-1">
                        {/* Tier badges track */}
                        <div className="flex items-center gap-1 mb-3">
                          {[
                            { min: 0, label: 'L', color: '#666', name: 'Locked' },
                            { min: 20, label: '1', color: '#ffd700', name: 'Emerging' },
                            { min: 50, label: '2', color: '#00ff88', name: 'Developing' },
                            { min: 100, label: '3', color: '#00bfff', name: 'Established' },
                            { min: 200, label: '4', color: '#ff6b6b', name: 'Expert' },
                          ].map((tier, i) => {
                            const isActive = userStatus.reviewCount >= tier.min
                            const isCurrent = i < 4
                              ? userStatus.reviewCount >= tier.min && userStatus.reviewCount < [20, 50, 100, 200, Infinity][i + 1]
                              : userStatus.reviewCount >= 200
                            return (
                              <div
                                key={tier.label}
                                className={`relative flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black transition-all duration-300 ${
                                  isCurrent ? 'scale-110 ring-2 ring-offset-1 ring-offset-black' : ''
                                }`}
                                style={{
                                  backgroundColor: isActive ? tier.color : 'rgba(255,255,255,0.05)',
                                  color: isActive ? '#000' : 'rgba(255,255,255,0.3)',
                                  '--tw-ring-color': isCurrent ? tier.color : 'transparent'
                                } as React.CSSProperties}
                                title={tier.name}
                              >
                                {tier.label}
                              </div>
                            )
                          })}
                          <span className="text-[10px] text-[var(--muted)] ml-2">+4 more</span>
                        </div>

                        {/* Current status */}
                        <div className="space-y-1">
                          <p className="text-sm font-bold">
                            {userStatus.hasTasteID ? (
                              <span className="bg-gradient-to-r from-[#ffd700] via-[#00ff88] to-[#00bfff] bg-clip-text text-transparent">
                                TasteID Active
                              </span>
                            ) : (
                              <span>{Math.max(0, 20 - userStatus.reviewCount)} ratings to unlock</span>
                            )}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {userStatus.hasTasteID
                              ? 'Every rating deepens your profile accuracy'
                              : `${userStatus.reviewCount} of 20 minimum rated`
                            }
                          </p>
                        </div>

                        {/* Quick action */}
                        {!userStatus.hasTasteID && (
                          <Link
                            href="/quick-rate"
                            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#ffd700] text-black text-[10px] font-bold uppercase tracking-wider hover:bg-[#ffe44d] transition-all hover:scale-105"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Rate Now
                          </Link>
                        )}
                      </div>
                    </div>
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
                      className="px-4 py-2.5 bg-[#ffd700] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffe033] transition-all hover:scale-105"
                    >
                      Rate
                    </Link>
                    <Link
                      href={`/u/${userStatus.username}/tasteid`}
                      className="px-4 py-2.5 bg-[#ff6b6b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ff8585] transition-all hover:scale-105"
                    >
                      TasteID
                    </Link>
                  </div>
                </div>
                
                {/* Right - Recent Activity */}
                <div className="border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs tracking-[0.2em] uppercase text-[var(--muted)]">Your Recent Ratings</h2>
                    <Link href={`/u/${userStatus.username}`} className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
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
                              <img src={review.album.coverArtUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{review.album.title}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{review.album.artistName}</p>
                          </div>
                          <span className="text-[--accent-primary] font-bold text-sm">{review.rating.toFixed(1)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-[var(--muted)] mb-3">No ratings yet</p>
                      <Link
                        href="/quick-rate"
                        className="text-xs text-[--accent-primary] font-bold uppercase tracking-wider hover:underline"
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
                  <p className="text-xs tracking-[0.3em] uppercase text-[--accent-primary] mb-3 font-medium">
                    Learn Your Music Taste
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                    "I listen to everything."<br />
                    <span className="text-[var(--muted)]">Do you though?</span>
                  </h1>
                  <p className="text-base md:text-lg text-[var(--muted)] mb-6 leading-relaxed">
                    Everyone says it. Nobody means it. WAXFEED <span className="text-[--accent-primary] font-semibold">reflects your taste back to you</span>—what you actually love,
                    why you love it, and <span className="text-[var(--foreground)]">what that says about you</span>.
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
                      Rate 25 albums and we'll show you who you really are musically. Your <span className="text-[--accent-primary] font-medium">TasteID</span> is waiting.
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
                      className="px-4 py-2.5 bg-[#ffd700] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffe033] transition-all hover:scale-105"
                    >
                      Rate
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2.5 bg-[#ff6b6b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ff8585] transition-all hover:scale-105"
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
                  <h2 className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-4">What You'll Learn</h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border-b border-[var(--border)]">
                      <div className="w-8 h-8 bg-[#ff6b6b] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2L3 7l7 5 7-5-7-5zM3 17l7 5 7-5M3 12l7 5 7-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#ff6b6b]">TasteID</p>
                        <p className="text-xs text-[var(--muted)]">Your musical DNA decoded—genres, vibes, patterns you didn't know you had</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border-b border-[var(--border)]">
                      <div className="w-8 h-8 bg-[#00bfff] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#00bfff]">Discover</p>
                        <p className="text-xs text-[var(--muted)]">Recs that actually make sense once you know your own taste</p>
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
                        <p className="text-xs text-[var(--muted)]">Find your people—those who actually share your wavelength</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3">
                      <div className="w-8 h-8 bg-[#FFD700] rounded-sm flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#FFD700]">Prove It</p>
                        <p className="text-xs text-[var(--muted)]">Timestamped receipts when you find artists before they blow</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/signup"
                    className="block w-full mt-4 px-4 py-3 bg-[--accent-primary] text-black text-xs font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-all text-center"
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
        <div className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-3 md:py-4">
          <div className="flex justify-center gap-6 md:gap-8 lg:gap-16">
            <div className="text-center">
              <span className="text-lg md:text-2xl font-bold tabular-nums">{stats.albumCount.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs tracking-widest uppercase text-[var(--muted-dim)] ml-1 md:ml-2">Albums</span>
            </div>
            <div className="text-center">
              <span className="text-lg md:text-2xl font-bold tabular-nums">{stats.reviewCount.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs tracking-widest uppercase text-[var(--muted-dim)] ml-1 md:ml-2">Ratings</span>
            </div>
            <div className="text-center">
              <span className="text-lg md:text-2xl font-bold tabular-nums">{stats.userCount.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs tracking-widest uppercase text-[var(--muted-dim)] ml-1 md:ml-2">Members</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING + RECENT REVIEWS - Side by Side Editorial Layout (FIRST VIEW) */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-r border-[var(--border)]">
            {/* TRENDING - Left Side (50%) */}
            <div className="border-r border-[var(--border)] py-10 lg:py-14 px-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Trending</h2>
                <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)]">
                  Billboard 200
                </span>
              </div>

              {/* Mobile: Horizontal scroll with larger cards */}
              <div className="md:hidden -mx-6 px-6">
                <div className="flex gap-3 overflow-x-auto pb-4 scroll-x-mobile">
                  {billboardAlbums.slice(0, 24).map((album, index) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.spotifyId}`}
                      className="group flex-shrink-0 w-[140px] active:scale-95 transition-transform"
                    >
                      <div className="album-cover aspect-square w-full bg-[var(--surface)] overflow-hidden relative">
                        {album.coverArtUrl && (
                          <img
                            src={album.coverArtUrl}
                            alt={album.title}
                            loading={index < 8 ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className={`absolute top-0 left-0 px-2 py-1 text-[11px] font-bold ${
                          index < 10
                            ? 'bg-[#ffd700] text-black'
                            : index < 25
                              ? 'bg-white/90 text-black'
                              : 'bg-black/70 text-white'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <p className="text-xs font-medium truncate mt-2 group-hover:text-[var(--muted)] transition-colors">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-[var(--muted-dim)] truncate">
                        {album.artistName}
                      </p>
                    </Link>
                  ))}
                  {/* See All card */}
                  <Link
                    href="/discover"
                    className="flex-shrink-0 w-[140px] aspect-square bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <svg className="w-8 h-8 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-xs text-[var(--muted)] uppercase tracking-wider">See All</span>
                  </Link>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="album-grid hidden md:grid grid-cols-3 lg:grid-cols-4 gap-2 flex-1 content-start">
                {billboardAlbums.slice(0, 48).map((album, index) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.spotifyId}`}
                    className="group"
                  >
                    <div className="album-cover aspect-square w-full bg-[var(--surface)] overflow-hidden relative">
                      {album.coverArtUrl && (
                        <img
                          src={album.coverArtUrl}
                          alt={album.title}
                          loading={index < 12 ? "eager" : "lazy"}
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className={`absolute top-0 left-0 px-1.5 py-0.5 text-[9px] font-bold ${
                        index < 10
                          ? 'bg-[#ffd700] text-black'
                          : index < 25
                            ? 'bg-white/90 text-black'
                            : 'bg-black/70 text-white'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-[9px] font-medium truncate mt-1 group-hover:text-[var(--muted)] transition-colors">
                      {album.title}
                    </p>
                    <p className="text-[8px] text-[var(--muted-dim)] truncate">
                      {album.artistName}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* RECENT REVIEWS - Right Side (50%) */}
            <div className="py-8 md:py-10 lg:py-14 px-4 md:px-6 flex flex-col">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-base md:text-lg font-bold">Recent Reviews</h2>
                <Link href="/reviews" className="text-[11px] md:text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors touch-target flex items-center">
                  View All →
                </Link>
              </div>

              <div className="space-y-0 flex-1">
                {recentReviews.slice(0, 30).map((review) => (
                  <Link
                    key={review.id}
                    href={`/album/${review.album.spotifyId}`}
                    className="group flex gap-3 py-3 md:py-3 border-b border-[var(--border)] hover:bg-[var(--surface)] active:bg-[var(--surface)] -mx-3 md:-mx-3 px-3 transition-colors"
                  >
                    <div className="w-14 h-14 md:w-12 md:h-12 flex-shrink-0 bg-[var(--surface)]">
                      {review.album.coverArtUrl && (
                        <img src={review.album.coverArtUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-sm font-medium truncate group-hover:text-[var(--muted)] transition-colors">
                          {review.album.title}
                        </span>
                        <span className="text-[--accent-primary] font-bold text-sm tabular-nums flex-shrink-0">{review.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs md:text-xs text-[var(--muted)] truncate">{review.album.artistName}</p>
                      {review.text && (
                        <p className="text-xs md:text-[11px] text-[var(--muted)] mt-1.5 md:mt-2 line-clamp-2 leading-relaxed">
                          "{review.text}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {review.user.image ? (
                          <img src={review.user.image} alt="" loading="lazy" decoding="async" className="w-5 h-5 md:w-4 md:h-4 rounded-full" />
                        ) : (
                          <DefaultAvatar size="xs" />
                        )}
                        <span className="text-[11px] md:text-[10px] text-[var(--muted-dim)]">@{review.user.username}</span>
                        <span className="text-[11px] md:text-[10px] text-[var(--muted-faint)]" suppressHydrationWarning>
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
          <summary className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-4 md:py-6 cursor-pointer list-none flex items-center justify-between hover:bg-[var(--surface)] active:bg-[var(--surface)] transition-colors touch-target">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <span className="text-[11px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] uppercase text-[var(--muted-dim)]">
                How It Works
              </span>
              <span className="text-[10px] md:text-xs px-2 py-1 bg-[--accent-primary] text-black font-bold">3 STEPS</span>
            </div>
            <svg className="w-5 h-5 text-[var(--muted)] transform transition-transform group-open:rotate-180 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div className="w-full px-4 md:px-6 lg:px-12 xl:px-20 pb-8 md:pb-12 pt-4 bg-[var(--surface)]">
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {/* STEP 1: RATE */}
              <Link href="/quick-rate" className="group/card block p-6 border border-[var(--border)] hover:border-[--accent-hover] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[--accent-primary] flex items-center justify-center text-[--accent-primary]">
                    <span className="text-lg font-black">1</span>
                  </div>
                  <h3 className="font-bold text-[--accent-primary]">RATE</h3>
                </div>
                <p className="font-bold mb-2">Be Honest About What You Love</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  30-second album ratings. No pressure. Just your gut reaction to the music.
                </p>
                <span className="text-xs text-[--accent-primary]">25 ratings → TasteID unlocks</span>
              </Link>

              {/* STEP 2: LEARN */}
              <div className="group/card block p-6 border border-[var(--border)] hover:border-[#ff6b6b] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#ff6b6b] flex items-center justify-center text-[#ff6b6b]">
                    <span className="text-lg font-black">2</span>
                  </div>
                  <h3 className="font-bold text-[#ff6b6b]">LEARN</h3>
                </div>
                <p className="font-bold mb-2">See Your Taste Reflected Back</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  TasteID analyzes your patterns. Genres, vibes, eras—things you didn't realize about yourself.
                </p>
                <span className="text-xs text-[#ff6b6b]">Your archetype revealed</span>
              </div>

              {/* STEP 3: GO DEEPER */}
              <Link href="/discover" className="group/card block p-6 border border-[var(--border)] hover:border-[#00bfff] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#00bfff] flex items-center justify-center text-[#00bfff]">
                    <span className="text-lg font-black">3</span>
                  </div>
                  <h3 className="font-bold text-[#00bfff]">GO DEEPER</h3>
                </div>
                <p className="font-bold mb-2">Explore Your Musical Identity</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Find new music that fits. Connect with people who get it. Never say "I listen to everything" again.
                </p>
                <span className="text-xs text-[#00bfff]">Discovery + Connection</span>
              </Link>
            </div>
          </div>
        </details>
      </section>

      {/* COLLEGE RADIO PARTNERSHIP */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-10 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--accent-primary] mb-3 md:mb-4">
                College Radio Partnership
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 leading-tight">
                Your station breaks artists.<br />
                Now you can prove it.
              </h2>
              <p className="text-sm md:text-base text-[var(--muted)] mb-5 md:mb-6 leading-relaxed">
                First 50 stations get Founding Status—free premium features forever.
                Station leaderboards. Verified DJ badges. Conference rankings.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <Link
                  href="/stations"
                  className="px-6 py-3 bg-[--accent-primary] text-black text-sm font-bold uppercase tracking-wider hover:bg-[--accent-hover] active:scale-95 transition-all touch-target"
                >
                  Apply Now
                </Link>
                <span className="text-sm text-[var(--muted)]">
                  <span className="text-[--accent-primary] font-bold">23</span> spots remaining
                </span>
              </div>
            </div>
            <div className="border border-[var(--border)] p-4 md:p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
                Station Preview
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[--accent-primary] font-bold">#1</span>
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
        <div className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-10 md:py-12 lg:py-16 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
            Ready to learn what you actually like?
          </h2>
          <p className="text-base md:text-lg text-[var(--muted)] mb-8 md:mb-10 max-w-xl mx-auto px-4">
            Stop saying "I listen to everything." Start understanding your taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            {!session ? (
              <Link
                href="/signup"
                className="px-10 py-4 bg-[--accent-primary] text-black text-sm font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors"
              >
                Discover Your TasteID
              </Link>
            ) : (
              <Link
                href="/quick-rate"
                className="px-10 py-4 bg-[--accent-primary] text-black text-sm font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors"
              >
                Keep Building TasteID
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
              <p className="text-xs text-[var(--muted-faint)] mt-1">Learn your music taste.</p>
            </div>
            <nav className="flex flex-wrap gap-6">
              <Link href="/discover" className="text-sm text-[var(--muted-dim)] hover:text-[var(--foreground)] transition-colors">Discover</Link>
              <Link href="/pricing" className="text-sm text-[var(--muted-dim)] hover:text-[var(--foreground)] transition-colors">Pricing</Link>
              <Link href="/stations" className="text-sm text-[--accent-primary] hover:text-[--accent-hover] transition-colors">College Radio</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
