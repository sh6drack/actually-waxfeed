import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

async function getPopularLists() {
  return prisma.list.findMany({
    take: 12,
    where: { isPublic: true, publishedAt: { not: null } },
    orderBy: { likeCount: "desc" },
    include: {
      user: {
        select: { id: true, username: true, image: true, isVerified: true },
      },
      items: {
        take: 5,
        orderBy: { position: "asc" },
        include: {
          album: {
            select: { coverArtUrl: true, coverArtUrlMedium: true, title: true, artistName: true },
          },
        },
      },
      _count: { select: { items: true, comments: true, likes: true } },
    },
  })
}

async function getRecentLists() {
  return prisma.list.findMany({
    take: 6,
    where: { isPublic: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, image: true, isVerified: true },
      },
      items: {
        take: 5,
        orderBy: { position: "asc" },
        include: {
          album: {
            select: { coverArtUrl: true, coverArtUrlMedium: true, title: true, artistName: true },
          },
        },
      },
      _count: { select: { items: true, comments: true, likes: true } },
    },
  })
}

async function getListStats() {
  const [totalLists, totalItems] = await Promise.all([
    prisma.list.count({ where: { isPublic: true, publishedAt: { not: null } } }),
    prisma.listItem.count(),
  ])
  return { totalLists, totalItems }
}

export default async function ListsPage() {
  const session = await auth()
  const [popularLists, recentLists, stats] = await Promise.all([
    getPopularLists(),
    getRecentLists(),
    getListStats(),
  ])

  // Get featured list (most liked)
  const featuredList = popularLists[0]
  const otherPopularLists = popularLists.slice(1)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Editorial masthead */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-4" style={{ color: 'var(--muted)' }}>
                Curated Collections
              </p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] leading-[0.85]">
                Lists
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <div className="flex lg:flex-col lg:items-end gap-4 lg:gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-light tabular-nums">{stats.totalLists}</span>
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--muted)' }}>Lists</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-light tabular-nums">{stats.totalItems.toLocaleString()}</span>
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--muted)' }}>Albums Curated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Featured List - Large editorial spread */}
      {featuredList && (
        <section className="border-b border-[--border]">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="grid grid-cols-12 border-l border-r border-[--border]">
              <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 lg:py-12 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                  Featured
                </span>
                <span className="text-4xl lg:text-6xl font-bold text-[--border]">01</span>
              </div>

              <div className="col-span-12 lg:col-span-11">
                <Link href={`/list/${featuredList.id}`} className="block group">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Album collage */}
                    <div className="aspect-square lg:aspect-auto lg:h-full bg-[--border] overflow-hidden relative border-b lg:border-b-0 lg:border-r border-[--border]">
                      <div className="grid grid-cols-2 h-full">
                        {featuredList.items.slice(0, 4).map((item, i) => (
                          <div key={i} className={`relative overflow-hidden ${i === 0 ? 'col-span-2 row-span-1' : ''}`}>
                            {(item.album.coverArtUrlMedium || item.album.coverArtUrl) && (
                              <img
                                src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ''}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      {featuredList._count.items > 4 && (
                        <div className="absolute bottom-4 right-4 bg-black/80 text-white text-[11px] px-2 py-1">
                          +{featuredList._count.items - 4} more
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-8 lg:p-12 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
                          Most Popular
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-4 group-hover:text-[--muted] transition-colors">
                          {featuredList.title}
                        </h2>

                        <div className="flex items-center gap-3 mb-6">
                          {featuredList.user.image ? (
                            <img src={featuredList.user.image} alt="" className="w-6 h-6" />
                          ) : (
                            <div className="w-6 h-6 bg-[--border]" />
                          )}
                          <span className="text-[12px] text-[--muted]">@{featuredList.user.username}</span>
                          {featuredList.user.isVerified && (
                            <span className="text-[10px] text-[--muted]">Verified</span>
                          )}
                        </div>

                        {/* Preview of albums */}
                        <div className="space-y-2 mb-8">
                          {featuredList.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[11px] text-[--border] font-semibold tabular-nums w-4">
                                {i + 1}
                              </span>
                              <span className="text-[12px] truncate">{item.album.title}</span>
                              <span className="text-[11px] text-[--muted] truncate">
                                {item.album.artistName}
                              </span>
                            </div>
                          ))}
                          {featuredList._count.items > 3 && (
                            <p className="text-[11px] text-[--muted] pl-7">
                              and {featuredList._count.items - 3} more albums
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-[11px] text-[--muted]">
                        <span>{featuredList._count.items} albums</span>
                        <span>{featuredList._count.likes} likes</span>
                        <span>{featuredList._count.comments} comments</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular Lists Grid */}
      {otherPopularLists.length > 0 && (
        <section className="border-b border-[--border]">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="grid grid-cols-12 border-l border-r border-[--border]">
              <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                  Popular
                </span>
                <span className="text-4xl lg:text-6xl font-bold text-[--border]">02</span>
              </div>

              <div className="col-span-12 lg:col-span-11 py-10 lg:py-14 px-6 lg:px-8">
                <h2 className="text-xl font-bold tracking-tight mb-2">Popular Lists</h2>
                <p className="text-[11px] text-[--muted] mb-8">Most liked collections</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherPopularLists.map((list) => (
                    <Link
                      key={list.id}
                      href={`/list/${list.id}`}
                      className="group border border-[--border] hover:border-[--muted] transition-colors"
                    >
                      {/* Album covers strip */}
                      <div className="flex h-20 border-b border-[--border]">
                        {list.items.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex-1 bg-[--border] overflow-hidden">
                            {(item.album.coverArtUrlMedium || item.album.coverArtUrl) && (
                              <img
                                src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ''}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              />
                            )}
                          </div>
                        ))}
                        {list._count.items > 5 && (
                          <div className="w-12 bg-[--border] flex items-center justify-center text-[10px] text-[--muted]">
                            +{list._count.items - 5}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-[13px] truncate mb-2 group-hover:text-[--muted] transition-colors">
                          {list.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          {list.user.image ? (
                            <img src={list.user.image} alt="" className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4 bg-[--border]" />
                          )}
                          <span className="text-[10px] text-[--muted]">@{list.user.username}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-[--muted]">
                          <span>{list._count.items} albums</span>
                          <span>{list._count.likes} likes</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Lists */}
      {recentLists.length > 0 && (
        <section className="border-b border-[--border]">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="grid grid-cols-12 border-l border-r border-[--border]">
              <div className="col-span-12 lg:col-span-1 border-r border-[--border] py-8 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] lg:writing-mode-vertical lg:rotate-180" style={{ writingMode: 'vertical-rl' as const }}>
                  Recent
                </span>
                <span className="text-4xl lg:text-6xl font-bold text-[--border]">03</span>
              </div>

              <div className="col-span-12 lg:col-span-11 py-10 lg:py-14 px-6 lg:px-8">
                <h2 className="text-xl font-bold tracking-tight mb-2">Recently Published</h2>
                <p className="text-[11px] text-[--muted] mb-8">Fresh collections from the community</p>

                <div className="divide-y divide-[--border]">
                  {recentLists.map((list) => (
                    <Link
                      key={list.id}
                      href={`/list/${list.id}`}
                      className="flex items-center gap-4 py-4 first:pt-0 hover:bg-[--border] -mx-3 px-3 transition-colors group"
                    >
                      {/* Album thumbs */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        {list.items.slice(0, 4).map((item, i) => (
                          <div key={i} className="w-10 h-10 bg-[--border] overflow-hidden">
                            {(item.album.coverArtUrlMedium || item.album.coverArtUrl) && (
                              <img
                                src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ''}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[13px] truncate group-hover:text-[--muted] transition-colors">
                          {list.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-[--muted]">
                          <span>@{list.user.username}</span>
                          <span className="text-[--border]">·</span>
                          <span>{list._count.items} albums</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right text-[11px] text-[--muted]">
                        <p>{list._count.likes} likes</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Create CTA */}
      <section className="py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12 xl:px-20 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[--muted] mb-6">
            Your Turn
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Create a list
          </h2>
          <p className="text-[--muted] mb-8 max-w-md mx-auto text-sm">
            Curate your favorite albums, rank your top picks, or share themed collections with the community.
          </p>
          {session ? (
            <Link
              href="/lists/new"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-semibold text-sm tracking-wide hover:bg-gray-200 transition-colors"
            >
              Start a List
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-semibold text-sm tracking-wide hover:bg-gray-200 transition-colors"
            >
              Sign In to Create
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Footer colophon */}
      <footer className="border-t border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[--border]">
            WAXFEED · Lists · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>
    </div>
  )
}
