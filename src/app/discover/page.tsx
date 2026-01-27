import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { SpinWheel } from "@/components/spin-wheel"
import { ConnectionsSection } from "@/components/connections"
import Link from "next/link"

export const dynamic = "force-dynamic"

// Position badge helper - the subtle offer
function getPositionBadge(totalReviews: number): { text: string; color: string } | null {
  const nextPosition = totalReviews + 1
  if (nextPosition <= 10) return { text: `#${nextPosition} Gold`, color: "text-[#ffd700]" }
  if (nextPosition <= 50) return { text: `#${nextPosition} Silver`, color: "text-gray-300" }
  if (nextPosition <= 100) return { text: `#${nextPosition} Bronze`, color: "text-amber-600" }
  return null
}

async function getRecommendations(userId: string | undefined) {
  if (!userId) {
    return {
      forYou: [],
      becauseYouLiked: null,
      popularInGenre: null,
      newReleases: await getNewReleases(),
      trending: await getTrending(),
    }
  }

  const userReviews = await prisma.review.findMany({
    where: { userId, rating: { gte: 7 } },
    include: {
      album: {
        select: { id: true, artistName: true, genres: true, title: true }
      }
    },
    orderBy: { rating: "desc" },
    take: 20,
  })

  if (userReviews.length === 0) {
    return {
      forYou: [],
      becauseYouLiked: null,
      popularInGenre: null,
      newReleases: await getNewReleases(),
      trending: await getTrending(),
    }
  }

  const favoriteArtists = [...new Set(userReviews.map(r => r.album.artistName))]
  const favoriteGenres = [...new Set(userReviews.flatMap(r => r.album.genres))]
  const reviewedAlbumIds = userReviews.map(r => r.album.id)
  const randomLikedAlbum = userReviews[Math.floor(Math.random() * userReviews.length)].album

  const byFavoriteArtists = await prisma.album.findMany({
    where: {
      artistName: { in: favoriteArtists.slice(0, 5) },
      id: { notIn: reviewedAlbumIds },
      albumType: { not: 'single' }
    },
    take: 8,
    orderBy: { averageRating: "desc" },
    select: {
      id: true, spotifyId: true, title: true, artistName: true,
      coverArtUrl: true, averageRating: true, totalReviews: true, genres: true,
    }
  })

  let popularInGenre = null
  if (favoriteGenres.length > 0) {
    const topGenre = favoriteGenres[0]
    const genreAlbums = await prisma.album.findMany({
      where: {
        genres: { has: topGenre },
        id: { notIn: reviewedAlbumIds },
        totalReviews: { gte: 1 },
        albumType: { not: 'single' }
      },
      take: 6,
      orderBy: { averageRating: "desc" },
      select: {
        id: true, spotifyId: true, title: true, artistName: true,
        coverArtUrl: true, averageRating: true, totalReviews: true, genres: true,
      }
    })
    if (genreAlbums.length > 0) {
      popularInGenre = { genre: topGenre, albums: genreAlbums }
    }
  }

  const similarUserIds = await prisma.review.findMany({
    where: {
      albumId: { in: reviewedAlbumIds.slice(0, 5) },
      rating: { gte: 7 },
      userId: { not: userId },
    },
    select: { userId: true },
    distinct: ["userId"],
    take: 10,
  })

  let forYou: typeof byFavoriteArtists = []
  if (similarUserIds.length > 0) {
    forYou = await prisma.album.findMany({
      where: {
        id: { notIn: reviewedAlbumIds },
        albumType: { not: 'single' },
        reviews: {
          some: {
            userId: { in: similarUserIds.map(u => u.userId) },
            rating: { gte: 8 },
          }
        }
      },
      take: 8,
      orderBy: { averageRating: "desc" },
      select: {
        id: true, spotifyId: true, title: true, artistName: true,
        coverArtUrl: true, averageRating: true, totalReviews: true, genres: true,
      }
    })
  }

  if (forYou.length === 0) forYou = byFavoriteArtists

  return {
    forYou,
    becauseYouLiked: {
      album: randomLikedAlbum,
      recommendations: byFavoriteArtists.filter(a => a.artistName === randomLikedAlbum.artistName).slice(0, 4),
    },
    popularInGenre,
    newReleases: await getNewReleases(),
    trending: await getTrending(),
  }
}

async function getNewReleases() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return prisma.album.findMany({
    where: { releaseDate: { gte: thirtyDaysAgo }, albumType: { not: 'single' } },
    take: 6,
    orderBy: { releaseDate: "desc" },
    select: {
      id: true, spotifyId: true, title: true, artistName: true,
      coverArtUrl: true, averageRating: true, totalReviews: true, releaseDate: true, genres: true,
    }
  })
}

async function getTrending() {
  return prisma.album.findMany({
    where: { billboardRank: { not: null }, albumType: { not: 'single' } },
    take: 10,
    orderBy: { billboardRank: "asc" },
    select: {
      id: true, spotifyId: true, title: true, artistName: true,
      coverArtUrl: true, averageRating: true, totalReviews: true, billboardRank: true, genres: true,
    }
  })
}

export default async function DiscoverPage() {
  const session = await auth()
  const recommendations = await getRecommendations(session?.user?.id)

  let userReviewCount = 0
  if (session?.user?.id) {
    userReviewCount = await prisma.review.count({ where: { userId: session.user.id } })
  }

  const sectionIndex = { current: 0 }
  const getSectionNum = () => {
    sectionIndex.current++
    return String(sectionIndex.current).padStart(2, '0')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Editorial masthead - Action-oriented */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-4 text-[#ffd700]">
                Review Now · Prove Later
              </p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] leading-[0.85]">
                Discover
              </h1>
              <p className="mt-4 text-lg text-[--muted] max-w-xl">
                Every album you review is timestamped. When it trends, you get credit.
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              {session ? (
                <div className="inline-flex flex-col gap-3 items-end">
                  <div className="inline-block border border-[--border] p-4">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-2">Your Stats</p>
                    <p className="text-2xl font-bold tabular-nums">{userReviewCount}</p>
                    <p className="text-xs text-[--muted]">reviews logged</p>
                  </div>
                  <Link
                    href="/discover/swipe"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffd700] text-black text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-[#ffed4a] transition group"
                  >
                    <span>Quick Rate</span>
                    <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <Link 
                  href="/signup"
                  className="inline-block px-6 py-3 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition"
                >
                  Start Reviewing
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spin the Wheel - Editorial feature */}
      <section className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-12 border-l border-r border-[--border]">
            <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 lg:py-16 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                Feature
              </span>
              <span className="text-4xl lg:text-6xl font-bold text-[--border]">01</span>
            </div>
            <div className="col-span-12 lg:col-span-11 py-12 lg:py-20 px-6 lg:px-12">
              <SpinWheel userId={session?.user?.id} userReviewCount={userReviewCount} />
            </div>
          </div>
        </div>
      </section>

      {/* Taste Connections - Polarity 1.2 Powered */}
      <section className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-12 border-l border-r border-[--border]">
            <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                Connect
              </span>
              <span className="text-4xl lg:text-6xl font-bold text-[--border]">{getSectionNum()}</span>
            </div>
            <div className="col-span-12 lg:col-span-11 py-10 lg:py-14 px-6 lg:px-12">
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">Taste Connections</h2>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-[--muted]">
                    Polarity-powered music community
                  </p>
                </div>
                <Link
                  href="/discover/connections"
                  className="text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors hidden sm:block"
                >
                  View All →
                </Link>
              </div>

              <ConnectionsSection userId={session?.user?.id} />
            </div>
          </div>
        </div>
      </section>

      {/* For You - Personalized */}
      {recommendations.forYou.length > 0 && (
        <section className="border-b border-[--border]">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="grid grid-cols-12 border-l border-r border-[--border]">
              <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                  Curated
                </span>
                <span className="text-4xl lg:text-6xl font-bold text-[--border]">{getSectionNum()}</span>
              </div>
              <div className="col-span-12 lg:col-span-11 py-10 lg:py-14 px-6 lg:px-12">
                <div className="flex items-baseline justify-between mb-8">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">For You</h2>
                    <p className="text-[11px] tracking-[0.15em] uppercase text-[--muted]">
                      Based on similar listeners
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {recommendations.forYou.map((album, i) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.spotifyId}`}
                      className="group"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="aspect-square bg-[--border] overflow-hidden mb-3">
                        {album.coverArtUrl ? (
                          <img
                            src={album.coverArtUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[--border]">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] font-semibold truncate group-hover:text-[--muted] transition-colors">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-[--muted] truncate">{album.artistName}</p>
                      {album.averageRating && (
                        <p className="text-[11px] text-[--muted] mt-1 tabular-nums">{album.averageRating.toFixed(1)}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular in Genre - Full bleed asymmetric */}
      {recommendations.popularInGenre && (
        <section className="border-b border-[--border]">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="grid grid-cols-12 border-l border-r border-[--border]">
              <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                  Genre
                </span>
                <span className="text-4xl lg:text-6xl font-bold text-[--border]">{getSectionNum()}</span>
              </div>

              {/* Featured album - large */}
              <div className="col-span-12 lg:col-span-5 border-r border-[--border]">
                {recommendations.popularInGenre.albums[0] && (
                  <Link
                    href={`/album/${recommendations.popularInGenre.albums[0].spotifyId}`}
                    className="block group h-full"
                  >
                    <div className="aspect-square lg:aspect-auto lg:h-full bg-[--border] overflow-hidden relative">
                      {recommendations.popularInGenre.albums[0].coverArtUrl ? (
                        <img
                          src={recommendations.popularInGenre.albums[0].coverArtUrl}
                          alt={recommendations.popularInGenre.albums[0].title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                        <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 mb-2">
                          Featured in {recommendations.popularInGenre.genre}
                        </p>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:text-white/80 transition-colors">
                          {recommendations.popularInGenre.albums[0].title}
                        </h3>
                        <p className="text-white/60">{recommendations.popularInGenre.albums[0].artistName}</p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Other genre albums - list */}
              <div className="col-span-12 lg:col-span-6 py-10 lg:py-0">
                <div className="px-6 lg:px-8 py-6 border-b border-[--border]">
                  <h2 className="text-xl font-bold tracking-tight">
                    Popular in <span className="capitalize">{recommendations.popularInGenre.genre}</span>
                  </h2>
                </div>
                <div className="divide-y divide-[--border]">
                  {recommendations.popularInGenre.albums.slice(1).map((album, i) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.spotifyId}`}
                      className="flex items-center gap-4 px-6 lg:px-8 py-4 hover:opacity-80 transition-colors group"
                    >
                      <span className="text-[11px] text-[--border] font-semibold tabular-nums w-5">
                        {String(i + 2).padStart(2, '0')}
                      </span>
                      <div className="w-12 h-12 bg-[--border] flex-shrink-0 overflow-hidden">
                        {album.coverArtUrl && (
                          <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate group-hover:text-[--muted] transition-colors">
                          {album.title}
                        </p>
                        <p className="text-[11px] text-[--muted] truncate">{album.artistName}</p>
                      </div>
                      {album.averageRating && (
                        <span className="text-[12px] font-semibold tabular-nums">{album.averageRating.toFixed(1)}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Releases + Trending - Split section */}
      <section className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-12 border-l border-r border-[--border]">
            <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                Index
              </span>
              <span className="text-4xl lg:text-6xl font-bold text-[--border]">{getSectionNum()}</span>
            </div>

            {/* New Releases - Prime opportunity for early reviews */}
            <div className="col-span-12 lg:col-span-5 border-r border-[--border] py-10 lg:py-14 px-6 lg:px-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">New Releases</h2>
                <span className="text-[9px] tracking-[0.2em] uppercase text-[#ffd700]">Early review opportunity</span>
              </div>
              {recommendations.newReleases.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {recommendations.newReleases.map((album) => {
                    const badge = getPositionBadge(album.totalReviews)
                    return (
                      <Link
                        key={album.id}
                        href={`/album/${album.spotifyId}`}
                        className="group"
                      >
                        <div className="aspect-square bg-[--border] overflow-hidden mb-2 relative">
                          {album.coverArtUrl && (
                            <img
                              src={album.coverArtUrl}
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          )}
                          {/* Position badge - the subtle offer */}
                          {badge && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                              <span className={`text-[9px] font-bold ${badge.color}`}>{badge.text}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[12px] font-semibold truncate group-hover:text-[--muted] transition-colors">
                          {album.title}
                        </p>
                        <p className="text-[10px] text-[--muted] truncate">{album.artistName}</p>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[--muted] text-sm">No new releases this month</p>
              )}
            </div>

            {/* Trending / Billboard */}
            <div className="col-span-12 lg:col-span-6 py-10 lg:py-14 px-6 lg:px-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">Billboard 200</h2>
                <Link href="/trending" className="text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors">
                  View All →
                </Link>
              </div>
              {recommendations.trending.length > 0 ? (
                <div className="space-y-1">
                  {recommendations.trending.slice(0, 8).map((album) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.spotifyId}`}
                      className="flex items-center gap-4 py-2.5 hover:opacity-80 -mx-3 px-3 transition-colors group"
                    >
                      <span className="text-lg font-bold w-6 text-[--border] tabular-nums group-hover:text-white transition-colors">
                        {album.billboardRank}
                      </span>
                      <div className="w-10 h-10 bg-[--border] flex-shrink-0 overflow-hidden">
                        {album.coverArtUrl && (
                          <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate group-hover:text-[--muted] transition-colors">
                          {album.title}
                        </p>
                        <p className="text-[10px] text-[--muted] truncate">{album.artistName}</p>
                      </div>
                      {album.averageRating && (
                        <span className="text-[11px] font-semibold tabular-nums">{album.averageRating.toFixed(1)}</span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[--muted] text-sm">No trending albums yet</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA for non-logged in or no reviews - Zero to One: clear value prop */}
      {(!session || recommendations.forYou.length === 0) && (
        <section className="py-20 lg:py-28 bg-white/[0.02]">
          <div className="w-full px-6 lg:px-12 xl:px-20 text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#ffd700] mb-6">
              {session ? 'Start Proving Your Taste' : 'The Music Credibility Platform'}
            </p>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
              {session 
                ? 'Every review you log is timestamped forever' 
                : 'Prove you had taste before the trend'}
            </h2>
            <p className="text-[--muted] mb-8 max-w-lg mx-auto">
              {session
                ? 'Review an album today. When it blows up next month, you\'ll have proof you called it. Gold Spin for top 10, Silver for top 50, Bronze for top 100.'
                : 'Review albums, get timestamped positions, earn badges when your picks trend. Your taste has real, provable value.'
              }
            </p>
            <Link
              href={session ? "/search" : "/signup"}
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-semibold text-sm tracking-wide hover:bg-[#e5e5e5] transition-colors"
            >
              {session ? 'Find Albums' : 'Sign In'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Footer colophon */}
      <footer className="border-t border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[--border]">
            WAXFEED · Discover · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>
    </div>
  )
}
