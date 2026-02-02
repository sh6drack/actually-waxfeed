import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { SpinWheel } from "@/components/spin-wheel"
import { ConnectionsSection } from "@/components/connections"
import Link from "next/link"
import { DiscoverTabs } from "@/components/discover/discover-tabs"

export const dynamic = "force-dynamic"

// Position badge helper
function getPositionBadge(totalReviews: number): { text: string; color: string } | null {
  const nextPosition = totalReviews + 1
  if (nextPosition <= 10) return { text: `#${nextPosition}`, color: "text-[#ffd700]" }
  if (nextPosition <= 50) return { text: `#${nextPosition}`, color: "text-gray-400" }
  if (nextPosition <= 100) return { text: `#${nextPosition}`, color: "text-amber-600" }
  return null
}

async function getUserTasteData(userId: string | undefined) {
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tasteId: {
        select: {
          primaryArchetype: true,
          secondaryArchetype: true,
          archetypeConfidence: true,
          topGenres: true,
          listeningSignature: true,
          adventurenessScore: true,
          patternStability: true,
          explorationRate: true,
        }
      }
    }
  })

  return user?.tasteId
}

async function getRecommendations(userId: string | undefined) {
  if (!userId) {
    return {
      forYou: [],
      popularInGenre: null,
      newReleases: await getNewReleases(),
      trending: await getTrending(),
    }
  }

  const userReviews = await prisma.review.findMany({
    where: { userId, rating: { gte: 7 } },
    include: {
      album: { select: { id: true, artistName: true, genres: true, title: true } }
    },
    orderBy: { rating: "desc" },
    take: 20,
  })

  if (userReviews.length === 0) {
    return {
      forYou: [],
      popularInGenre: null,
      newReleases: await getNewReleases(),
      trending: await getTrending(),
    }
  }

  const favoriteArtists = [...new Set(userReviews.map(r => r.album.artistName))]
  const favoriteGenres = [...new Set(userReviews.flatMap(r => r.album.genres))]
  const reviewedAlbumIds = userReviews.map(r => r.album.id)

  const byFavoriteArtists = await prisma.album.findMany({
    where: {
      artistName: { in: favoriteArtists.slice(0, 5) },
      id: { notIn: reviewedAlbumIds },
      albumType: { not: 'single' }
    },
    take: 12,
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
      take: 8,
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
      take: 12,
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
    popularInGenre,
    newReleases: await getNewReleases(),
    trending: await getTrending(),
  }
}

async function getNewReleases() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return prisma.album.findMany({
    where: { releaseDate: { gte: thirtyDaysAgo }, albumType: { not: 'single' } },
    take: 8,
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
    take: 50,
    orderBy: { billboardRank: "asc" },
    select: {
      id: true, spotifyId: true, title: true, artistName: true,
      coverArtUrl: true, coverArtUrlLarge: true, averageRating: true, totalReviews: true, billboardRank: true, genres: true,
    }
  })
}

async function getUserConnections(userId: string | undefined) {
  if (!userId) return []

  const connections = await prisma.user.findMany({
    where: {
      id: { not: userId },
      tasteId: { isNot: null }
    },
    take: 6,
    select: {
      id: true,
      username: true,
      image: true,
      tasteId: {
        select: {
          primaryArchetype: true,
          topGenres: true,
        }
      }
    }
  })

  return connections
}

export default async function DiscoverPage() {
  const session = await auth()
  const [recommendations, userTaste, connections] = await Promise.all([
    getRecommendations(session?.user?.id),
    getUserTasteData(session?.user?.id),
    getUserConnections(session?.user?.id),
  ])

  let userReviewCount = 0
  if (session?.user?.id) {
    userReviewCount = await prisma.review.count({ where: { userId: session.user.id } })
  }

  const listeningSignature = userTaste?.listeningSignature as Record<string, number> | null

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Neural Network Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient mesh */}
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--dyad-primary) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
          style={{ background: 'radial-gradient(circle, var(--ccx-node) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
          style={{ background: 'radial-gradient(circle, var(--ccx-edge) 0%, transparent 70%)' }}
        />

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Hero - Taste Network Visualization */}
      <header className="relative border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left - Title + Quick Stats */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[--dyad-primary] animate-pulse" />
                <span className="text-[10px] tracking-[0.4em] uppercase text-[--dyad-primary] font-mono">
                  Neural Discovery
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] mb-4">
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Discover
                </span>
              </h1>

              {session && userTaste ? (
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">Archetype:</span>
                    <span className="text-[--dyad-primary] font-semibold">{userTaste.primaryArchetype}</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">Accuracy:</span>
                    <span className="text-[--ccx-node] font-mono">{Math.round((userTaste.archetypeConfidence || 0) * 100)}%</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">Ratings:</span>
                    <span className="font-mono">{userReviewCount}</span>
                  </div>
                </div>
              ) : (
                <p className="text-white/50 text-lg max-w-md">
                  Map your musical neural pathways. Every rating shapes your taste network.
                </p>
              )}
            </div>

            {/* Right - Network Visualization + CTA */}
            <div className="flex items-center gap-6">
              {/* Mini Network Viz */}
              {session && (
                <div className="hidden lg:block relative w-32 h-32">
                  {/* Central node (you) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[--dyad-primary] flex items-center justify-center z-10">
                    <span className="text-black text-xs font-black">YOU</span>
                  </div>

                  {/* Orbiting connection nodes */}
                  {connections.slice(0, 4).map((conn, i) => {
                    const angle = (i * 90 - 45) * (Math.PI / 180)
                    const x = 50 + 40 * Math.cos(angle)
                    const y = 50 + 40 * Math.sin(angle)
                    return (
                      <div
                        key={conn.id}
                        className="absolute w-6 h-6 rounded-full bg-[--ccx-node]/30 border border-[--ccx-node]/50 overflow-hidden"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          animationDelay: `${i * 0.2}s`
                        }}
                      >
                        {conn.image && (
                          <img src={conn.image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )
                  })}

                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    {connections.slice(0, 4).map((conn, i) => {
                      const angle = (i * 90 - 45) * (Math.PI / 180)
                      const x = 50 + 40 * Math.cos(angle)
                      const y = 50 + 40 * Math.sin(angle)
                      return (
                        <line
                          key={conn.id}
                          x1="50%"
                          y1="50%"
                          x2={`${x}%`}
                          y2={`${y}%`}
                          stroke="var(--ccx-edge)"
                          strokeWidth="1"
                          strokeOpacity="0.3"
                          className="animate-pulse"
                          style={{ animationDelay: `${i * 0.3}s` }}
                        />
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* CTA */}
              <Link
                href="/discover/swipe"
                className="group relative px-6 py-4 bg-[--dyad-primary] text-black font-bold text-sm uppercase tracking-wider overflow-hidden hover:scale-105 transition-transform"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Quick Rate
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[--dyad-primary] to-[--ccx-node] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Listening Signature Bar */}
          {listeningSignature && Object.keys(listeningSignature).length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3">Listening Signature</p>
              <div className="flex items-end gap-1 h-8">
                {Object.entries(listeningSignature).slice(0, 7).map(([key, value], i) => (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (value as number) * 32)}px`,
                        background: i % 2 === 0 ? 'var(--dyad-primary)' : 'var(--ccx-node)',
                        opacity: 0.6 + (value as number) * 0.4
                      }}
                    />
                    <span className="text-[8px] text-white/30 uppercase truncate w-full text-center">
                      {key.slice(0, 4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <DiscoverTabs
        session={session}
        userReviewCount={userReviewCount}
        recommendations={recommendations}
        userTaste={userTaste}
        connections={connections}
      />
    </div>
  )
}
