"use client"

import { useState } from "react"
import Link from "next/link"
import { SpinWheel } from "@/components/spin-wheel"

interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge?: string | null
  averageRating: number | null
  totalReviews: number
  genres: string[]
  billboardRank?: number | null
  releaseDate?: Date | null
}

interface Props {
  session: any
  userReviewCount: number
  recommendations: {
    forYou: Album[]
    popularInGenre: { genre: string; albums: Album[] } | null
    newReleases: Album[]
    trending: Album[]
  }
  userTaste: any
  connections: any[]
}

// Position badge helper - defined here since functions can't be passed from server to client
function getPositionBadge(totalReviews: number): { text: string; color: string } | null {
  const nextPosition = totalReviews + 1
  if (nextPosition <= 10) return { text: `#${nextPosition}`, color: "text-[#ffd700]" }
  if (nextPosition <= 50) return { text: `#${nextPosition}`, color: "text-gray-400" }
  if (nextPosition <= 100) return { text: `#${nextPosition}`, color: "text-amber-600" }
  return null
}

type TabId = "explore" | "trending" | "new"

const TABS = [
  { id: "explore" as TabId, label: "Explore", icon: "◎" },
  { id: "trending" as TabId, label: "Trending", icon: "↗" },
  { id: "new" as TabId, label: "New", icon: "✦" },
]

// Trending Tab Content - Full Billboard 200 grid with expand/collapse
function TrendingTabContent({ albums }: { albums: Album[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mobileCount = 18
  const desktopCount = 24
  const displayedAlbums = isExpanded ? albums : albums.slice(0, desktopCount)

  return (
    <div className="animate-in fade-in duration-300">
      <section className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[--dyad-connection]/10 border border-[--dyad-connection]/20 flex items-center justify-center">
              <span className="text-[--dyad-connection]">↗</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Billboard 200</h2>
              <p className="text-xs text-white/40">Review trending albums early</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[--dyad-connection] animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-mono">
              Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Mobile Grid - 3 columns */}
        <div className="md:hidden">
          <div className="grid grid-cols-3 gap-3">
            {displayedAlbums.slice(0, isExpanded ? albums.length : mobileCount).map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.spotifyId}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  {album.coverArtUrl && (
                    <img
                      src={album.coverArtUrlLarge || album.coverArtUrl}
                      alt=""
                      className="w-full h-full object-cover group-active:scale-[0.98] transition-transform duration-150"
                    />
                  )}
                  <div
                    className={`absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-bold ${
                      (album.billboardRank || 0) <= 10
                        ? 'bg-[--dyad-connection] text-black'
                        : 'bg-black/80 text-white/80'
                    }`}
                  >
                    #{album.billboardRank}
                  </div>
                  {album.averageRating !== null && (
                    <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm">
                      <span className="text-[10px] font-mono text-[--dyad-primary]">
                        {album.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-[11px] font-semibold leading-tight truncate group-hover:text-[--dyad-connection] transition-colors">
                    {album.title}
                  </p>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">
                    {album.artistName}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {albums.length > mobileCount && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] uppercase active:opacity-70 transition-all min-h-[52px] bg-[--dyad-connection] text-black"
            >
              <span>{isExpanded ? "Show Less" : `View All ${albums.length}`}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Desktop Grid - 6 columns */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
            {displayedAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.spotifyId}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  {album.coverArtUrl && (
                    <img
                      src={album.coverArtUrlLarge || album.coverArtUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div
                    className={`absolute top-0 left-0 px-2 py-1 text-xs font-bold ${
                      (album.billboardRank || 0) <= 10
                        ? 'bg-[--dyad-connection] text-black'
                        : (album.billboardRank || 0) <= 25
                          ? 'bg-white/90 text-black'
                          : 'bg-black/80 text-white/80'
                    }`}
                  >
                    #{album.billboardRank}
                  </div>
                  {album.averageRating !== null && (
                    <div className="absolute bottom-0 right-0 px-2 py-1 bg-black/80 backdrop-blur-sm">
                      <span className="text-xs font-mono text-[--dyad-primary]">
                        {album.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold leading-tight truncate group-hover:text-[--dyad-connection] transition-colors">
                    {album.title}
                  </p>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {album.artistName}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {albums.length > desktopCount && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] uppercase transition-all border border-white/10 hover:border-[--dyad-connection] hover:text-[--dyad-connection] text-white/50"
            >
              <span>{isExpanded ? "Show Less" : `Show All ${albums.length}`}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {albums.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40">No trending albums available</p>
          </div>
        )}
      </section>
    </div>
  )
}

export function DiscoverTabs({
  session,
  userReviewCount,
  recommendations,
  userTaste,
  connections,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("explore")

  return (
    <div className="relative">
      {/* Tab Navigation - Sticky */}
      <nav className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[--dyad-primary] border-b-2 border-[--dyad-primary]"
                    : "text-white/50 hover:text-white/80 border-b-2 border-transparent"
                }`}
              >
                <span className="text-xs opacity-60">{tab.icon}</span>
                {tab.label}
              </button>
            ))}

            {/* Quick links on right */}
            <div className="ml-auto flex items-center gap-3 pl-4 border-l border-white/10">
              <Link
                href="/discover/challenges"
                className="text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:block"
              >
                Challenges
              </Link>
              <Link
                href="/discover/connections"
                className="text-xs text-[--ccx-node] hover:text-[--ccx-node]/80 transition-colors"
              >
                All Connections →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <div className="relative min-h-[60vh]">
        {/* EXPLORE TAB */}
        {activeTab === "explore" && (
          <div className="animate-in fade-in duration-300">
            {/* Spin Wheel Section */}
            <section className="border-b border-white/5">
              <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[--dyad-primary]/10 border border-[--dyad-primary]/20 flex items-center justify-center">
                    <span className="text-[--dyad-primary]">◎</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Spin the Wheel</h2>
                    <p className="text-xs text-white/40">Discover personalized recommendations</p>
                  </div>
                </div>
                <SpinWheel userId={session?.user?.id} userReviewCount={userReviewCount} />
              </div>
            </section>

            {/* For You Grid - Asymmetric */}
            {recommendations.forYou.length > 0 && (
              <section className="border-b border-white/5">
                <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[--ccx-node]/10 border border-[--ccx-node]/20 flex items-center justify-center">
                        <span className="text-[--ccx-node]">✧</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">For You</h2>
                        <p className="text-xs text-white/40">Based on your taste network</p>
                      </div>
                    </div>
                  </div>

                  {/* Asymmetric Bento Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* Featured large card */}
                    {recommendations.forYou[0] && (
                      <Link
                        href={`/album/${recommendations.forYou[0].spotifyId}`}
                        className="col-span-2 row-span-2 group relative overflow-hidden"
                      >
                        <div className="aspect-square bg-white/5">
                          {recommendations.forYou[0].coverArtUrl && (
                            <img
                              src={recommendations.forYou[0].coverArtUrl}
                              alt={recommendations.forYou[0].title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-[10px] text-[--dyad-primary] uppercase tracking-wider mb-1">Featured</p>
                          <h3 className="text-lg font-bold line-clamp-1">{recommendations.forYou[0].title}</h3>
                          <p className="text-sm text-white/60">{recommendations.forYou[0].artistName}</p>
                        </div>
                      </Link>
                    )}

                    {/* Rest of albums */}
                    {recommendations.forYou.slice(1, 9).map((album, i) => (
                      <Link
                        key={album.id}
                        href={`/album/${album.spotifyId}`}
                        className="group"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="aspect-square bg-white/5 overflow-hidden mb-2">
                          {album.coverArtUrl && (
                            <img
                              src={album.coverArtUrl}
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                        </div>
                        <p className="text-xs font-medium truncate group-hover:text-[--dyad-primary] transition-colors">
                          {album.title}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">{album.artistName}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Genre Section - Horizontal scroll */}
            {recommendations.popularInGenre && (
              <section className="border-b border-white/5">
                <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, var(--ccx-edge), var(--ccx-node))' }}
                    >
                      <span className="text-white text-sm">♫</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold capitalize">Popular in {recommendations.popularInGenre.genre}</h2>
                      <p className="text-xs text-white/40">Top rated in your favorite genre</p>
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12">
                    {recommendations.popularInGenre.albums.map((album, i) => (
                      <Link
                        key={album.id}
                        href={`/album/${album.spotifyId}`}
                        className="flex-shrink-0 w-36 group"
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
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm text-xs font-mono">
                              {album.averageRating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">{album.title}</p>
                        <p className="text-[10px] text-white/40 truncate">{album.artistName}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* TRENDING TAB */}
        {activeTab === "trending" && (
          <TrendingTabContent albums={recommendations.trending} />
        )}

        {/* NEW TAB */}
        {activeTab === "new" && (
          <div className="animate-in fade-in duration-300">
            <section className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 lg:py-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400">✦</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">New Releases</h2>
                    <p className="text-xs text-white/40">Be an early reviewer</p>
                  </div>
                </div>
              </div>

              {/* New Releases with position badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendations.newReleases.map((album) => {
                  const badge = getPositionBadge(album.totalReviews)
                  return (
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
                        {badge && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                            <span className={`text-xs font-bold ${badge.color}`}>
                              Be {badge.text}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-emerald-400 transition-colors">
                        {album.title}
                      </p>
                      <p className="text-xs text-white/40 truncate">{album.artistName}</p>
                      <p className="text-[10px] text-white/30 mt-1">
                        {album.totalReviews === 0 ? "No reviews yet" : `${album.totalReviews} reviews`}
                      </p>
                    </Link>
                  )
                })}
              </div>

              {recommendations.newReleases.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/40">No new releases this month</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Bottom CTA for non-authenticated */}
      {!session && (
        <section className="border-t border-white/10 bg-gradient-to-b from-transparent to-[--dyad-primary]/5">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-12 lg:py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[--dyad-primary]/10 border border-[--dyad-primary]/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-[--dyad-primary] text-xl">◎</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">
              Map Your Taste Network
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-6">
              Rate albums, discover connections, prove your taste. Every review is timestamped forever.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[--dyad-primary] text-black font-bold text-sm uppercase tracking-wider hover:bg-[--dyad-primary]/90 transition-colors"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
