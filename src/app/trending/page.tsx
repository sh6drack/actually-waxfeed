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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Editorial masthead */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-4" style={{ color: 'var(--muted)' }}>
                Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] leading-[0.85]">
                Trending
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <p className="text-[11px] tracking-[0.15em] uppercase leading-relaxed" style={{ color: 'var(--muted)' }}>
                Billboard 200<br />
                Hot Reviews<br />
                New Releases
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content split */}
      <section className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-r border-[--border]">
            {/* Billboard Chart - 50% width */}
            <div className="border-r border-[--border]">
              <div className="px-6 lg:px-8 py-6 border-b border-[--border]">
                <h2 className="text-xl font-bold tracking-tight">Billboard 200</h2>
                <p className="text-[11px] text-[--muted] mt-1">Full chart rankings</p>
              </div>

              <div className="p-4 lg:p-6">
                {trendingAlbums.length === 0 ? (
                  <p className="text-[--muted] py-8 text-center">No trending albums yet</p>
                ) : (
                  <BillboardList albums={trendingAlbums} />
                )}
              </div>
            </div>

            {/* Hot Reviews - 50% width */}
            <div>
              <div className="px-6 lg:px-8 py-6 border-b border-[--border]">
                <h2 className="text-xl font-bold tracking-tight">Hot Reviews</h2>
                <p className="text-[11px] text-[--muted] mt-1">Most engaged this week</p>
              </div>

              {trendingReviews.length === 0 ? (
                <div className="px-6 lg:px-8 py-12 text-center">
                  <p className="text-[--muted]">No reviews this week yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[--border]">
                  {trendingReviews.map((review) => (
                    <Link
                      key={review.id}
                      href={`/album/${review.album.spotifyId}`}
                      className="block px-6 lg:px-8 py-5 hover:opacity-80 transition-colors group"
                    >
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-[--border] flex-shrink-0 overflow-hidden">
                          {review.album.coverArtUrl && (
                            <img src={review.album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[13px] font-semibold truncate group-hover:text-[--muted] transition-colors">
                              {review.album.title}
                            </span>
                            <span className="text-[12px] font-bold tabular-nums flex-shrink-0">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[--muted] truncate">{review.album.artistName}</p>

                          {review.text && (
                            <p className="text-[11px] text-[--muted] mt-2 line-clamp-2 leading-relaxed">
                              {review.text}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            {review.user.image ? (
                              <img src={review.user.image} alt="" className="w-4 h-4" />
                            ) : (
                              <DefaultAvatar size="xs" />
                            )}
                            <span className="text-[10px] text-[--muted]">@{review.user.username}</span>
                            <span className="text-[10px] text-[--border]">·</span>
                            <span className="text-[10px] text-[--border]">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                            {review.likeCount > 0 && (
                              <>
                                <span className="text-[10px] text-[--border]">·</span>
                                <span className="text-[10px] text-[--muted]">{review.likeCount} likes</span>
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
      <section className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-12 border-l border-r border-[--border]">
            <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                New
              </span>
              <span className="text-4xl lg:text-6xl font-bold text-[--muted]">02</span>
            </div>

            <div className="col-span-12 lg:col-span-11 py-10 lg:py-14 px-6 lg:px-8">
              <h2 className="text-xl font-bold tracking-tight mb-2">Recent Releases</h2>
              <p className="text-[11px] text-[--muted] mb-8">Albums from the past 30 days</p>

              {recentReleases.length === 0 ? (
                <p className="text-[--muted]">No recent releases</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {recentReleases.map((album, index) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.spotifyId}`}
                      className={`group ${index >= 4 ? 'hidden sm:block' : ''}`}
                    >
                      <div className="aspect-square bg-[--border] overflow-hidden mb-3">
                        {album.coverArtUrl && (
                          <img
                            src={album.coverArtUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        )}
                      </div>
                      <p className="text-[12px] font-semibold truncate group-hover:text-[--muted] transition-colors">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-[--muted] truncate">{album.artistName}</p>
                      <p className="text-[10px] text-[--muted] mt-1">
                        {new Date(album.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer colophon */}
      <footer className="border-t border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[--border]">
            WAXFEED · Trending · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>
    </div>
  )
}
