import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { DefaultAvatar } from "@/components/default-avatar"
import { BillboardList } from "./billboard-list"

export const dynamic = "force-dynamic"

async function getTrendingAlbums() {
  return prisma.album.findMany({
    where: { billboardRank: { not: null } },
    orderBy: { billboardRank: "asc" },
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
      genres: true,
    },
  })
}

async function getTrendingReviews() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return prisma.review.findMany({
    take: 50,
    where: {
      createdAt: { gte: sevenDaysAgo },
      AND: [
        { text: { not: null } },
        { text: { not: '' } },
      ]
    },
    orderBy: [{ likeCount: "desc" }, { replyCount: "desc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: { id: true, username: true, image: true, isVerified: true },
      },
      album: {
        select: { id: true, spotifyId: true, title: true, artistName: true, coverArtUrl: true },
      },
      _count: { select: { replies: true } },
    },
  })
}

async function getRecentReleases() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return prisma.album.findMany({
    where: { releaseDate: { gte: thirtyDaysAgo } },
    take: 8,
    orderBy: { releaseDate: "desc" },
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverArtUrl: true,
      averageRating: true,
      totalReviews: true,
      releaseDate: true,
    },
  })
}

export default async function TrendingPage() {
  const [trendingAlbums, trendingReviews, recentReleases] = await Promise.all([
    getTrendingAlbums(),
    getTrendingReviews(),
    getRecentReleases(),
  ])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Neural Network Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient mesh */}
        <div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-15"
          style={{ background: 'radial-gradient(circle, var(--dyad-connection) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10"
          style={{ background: 'radial-gradient(circle, var(--ccx-node) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
          style={{ background: 'radial-gradient(circle, var(--dyad-primary) 0%, transparent 70%)' }}
        />

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
          <defs>
            <pattern id="grid-trending" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-trending)" />
        </svg>
      </div>

      {/* Hero Header */}
      <header className="relative border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[--dyad-connection] animate-pulse" />
                <span className="text-[10px] tracking-[0.4em] uppercase text-[--dyad-connection] font-mono">
                  Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em]">
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Trending
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[--dyad-connection]" />
                  <span className="text-white/40">Billboard 200</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[--ccx-node]" />
                  <span className="text-white/40">Hot Reviews</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[--dyad-primary]" />
                  <span className="text-white/40">New Releases</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Split */}
      <section className="relative border-b border-white/5">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Billboard Chart */}
            <div className="lg:border-r border-white/5">
              <div className="py-6 lg:pr-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[--dyad-connection]/10 border border-[--dyad-connection]/20 flex items-center justify-center">
                    <span className="text-[--dyad-connection]">↗</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Billboard 200</h2>
                    <p className="text-xs text-white/40">Full chart rankings</p>
                  </div>
                </div>
              </div>

              <div className="py-6 lg:pr-8">
                {trendingAlbums.length === 0 ? (
                  <p className="text-white/40 py-8 text-center">No trending albums yet</p>
                ) : (
                  <BillboardList albums={trendingAlbums} />
                )}
              </div>
            </div>

            {/* Hot Reviews */}
            <div>
              <div className="py-6 lg:pl-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[--ccx-node]/10 border border-[--ccx-node]/20 flex items-center justify-center">
                    <span className="text-[--ccx-node]">✧</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Hot Reviews</h2>
                    <p className="text-xs text-white/40">Most engaged this week</p>
                  </div>
                </div>
              </div>

              {trendingReviews.length === 0 ? (
                <div className="py-12 lg:pl-8 text-center">
                  <p className="text-white/40">No reviews this week yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {trendingReviews.slice(0, 15).map((review) => (
                    <Link
                      key={review.id}
                      href={`/album/${review.album.spotifyId}`}
                      className="block py-4 lg:pl-8 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-white/5 flex-shrink-0 overflow-hidden">
                          {review.album.coverArtUrl && (
                            <img src={review.album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-semibold truncate group-hover:text-[--ccx-node] transition-colors">
                              {review.album.title}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-[--dyad-connection] flex-shrink-0">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 truncate">{review.album.artistName}</p>

                          {review.text && (
                            <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">
                              {review.text}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            {review.user.image ? (
                              <img src={review.user.image} alt="" className="w-4 h-4" />
                            ) : (
                              <DefaultAvatar size="xs" />
                            )}
                            <span className="text-[10px] text-white/40">@{review.user.username}</span>
                            <span className="text-[10px] text-white/20">·</span>
                            <span className="text-[10px] text-white/30">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                            {review.likeCount > 0 && (
                              <>
                                <span className="text-[10px] text-white/20">·</span>
                                <span className="text-[10px] text-[--ccx-node]">{review.likeCount} likes</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Releases */}
      <section className="relative border-b border-white/5">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[--dyad-primary]/10 border border-[--dyad-primary]/20 flex items-center justify-center">
                <span className="text-[--dyad-primary]">✦</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">New Releases</h2>
                <p className="text-xs text-white/40">Albums from the past 30 days</p>
              </div>
            </div>
            <Link
              href="/discover?tab=new"
              className="text-xs text-[--dyad-primary] hover:underline"
            >
              View All →
            </Link>
          </div>

          {recentReleases.length === 0 ? (
            <p className="text-white/40 text-center py-8">No recent releases</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
              {recentReleases.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.spotifyId}`}
                  className="group"
                >
                  <div className="aspect-square bg-white/5 overflow-hidden mb-2 relative">
                    {album.coverArtUrl && (
                      <img
                        src={album.coverArtUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {album.averageRating && (
                      <div className="absolute bottom-0 right-0 px-2 py-1 bg-black/80 backdrop-blur-sm text-xs font-mono text-[--dyad-primary]">
                        {album.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate group-hover:text-[--dyad-primary] transition-colors">
                    {album.title}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">{album.artistName}</p>
                  <p className="text-[10px] text-white/30 mt-1">
                    {album.releaseDate && new Date(album.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 font-mono">
              WAXFEED · Trending · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <Link
              href="/discover"
              className="text-xs text-white/40 hover:text-[--dyad-primary] transition-colors"
            >
              ← Back to Discover
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
