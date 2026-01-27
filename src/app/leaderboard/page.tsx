import { prisma } from "@/lib/prisma"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getTastemakerLeaderboard() {
  return prisma.user.findMany({
    where: {
      tastemakeScore: { gt: 0 }
    },
    orderBy: { tastemakeScore: 'desc' },
    take: 100,
    select: {
      id: true,
      username: true,
      image: true,
      tastemakeScore: true,
      goldSpinCount: true,
      silverSpinCount: true,
      bronzeSpinCount: true,
    }
  })
}

async function getRecentTrending() {
  return prisma.album.findMany({
    where: { isTrending: true },
    orderBy: { trendedAt: 'desc' },
    take: 10,
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

async function getFoundingSpotsLeft() {
  const FOUNDING_STATION_LIMIT = 50
  const foundingCount = await prisma.station.count({
    where: { isFoundingStation: true }
  })
  return FOUNDING_STATION_LIMIT - foundingCount
}

export default async function LeaderboardPage() {
  const [tastemakers, trendingAlbums, foundingSpotsLeft] = await Promise.all([
    getTastemakerLeaderboard(),
    getRecentTrending(),
    getFoundingSpotsLeft(),
  ])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12 lg:py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
            Community
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-4">
            Tastemaker Leaderboard
          </h1>
          <p className="text-base text-[--muted] max-w-xl">
            The users who have proven their taste by calling albums before they trended.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Main Leaderboard */}
          <section className="flex-1 lg:border-r border-[--border]">
            <div className="px-6 py-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
                Top Tastemakers
              </p>

              {tastemakers.length === 0 ? (
                <div className="py-16 text-center border border-[--border]">
                  <p className="text-[--muted] mb-2">No tastemakers yet.</p>
                  <p className="text-sm text-[--muted]">
                    Be the first to earn a First Spin badge.
                  </p>
                </div>
              ) : (
                <div className="border border-[--border]">
                  {tastemakers.map((user, index) => (
                    <Link
                      key={user.id}
                      href={`/u/${user.username || user.id}`}
                      className={`flex items-center gap-4 px-4 py-4 hover:bg-[--border]/10 transition ${
                        index < tastemakers.length - 1 ? 'border-b border-[--border]' : ''
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-10 h-10 flex items-center justify-center font-bold ${
                        index === 0 ? 'text-[#ffd700]' : 
                        index === 1 ? 'text-gray-300' : 
                        index === 2 ? 'text-amber-600' : 
                        'text-[--muted]'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 flex-shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <DefaultAvatar size="sm" className="w-full h-full" />
                        )}
                      </div>

                      {/* Name and Badges */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          @{user.username || 'anonymous'}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          {user.goldSpinCount > 0 && (
                            <span className="text-[#ffd700]">G:{user.goldSpinCount}</span>
                          )}
                          {user.silverSpinCount > 0 && (
                            <span className="text-gray-400">S:{user.silverSpinCount}</span>
                          )}
                          {user.bronzeSpinCount > 0 && (
                            <span className="text-amber-700">B:{user.bronzeSpinCount}</span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-2xl font-bold tabular-nums">{user.tastemakeScore}</p>
                        <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">Score</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:w-80 border-t lg:border-t-0 border-[--border]">
            {/* Recently Trended */}
            <div className="px-6 py-8 border-b border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
                Recently Trended
              </p>

              {trendingAlbums.length === 0 ? (
                <p className="text-sm text-[--muted]">
                  No albums have trended yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {trendingAlbums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.spotifyId}`}
                      className="flex gap-3 group"
                    >
                      <div className="w-12 h-12 flex-shrink-0 bg-[#181818]">
                        {album.coverArtUrl ? (
                          <img
                            src={album.coverArtUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#666] text-xs">
                            ?
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[--muted] transition">
                          {album.title}
                        </p>
                        <p className="text-xs text-[--muted] truncate">
                          {album.artistName}
                        </p>
                        <p className="text-[10px] text-[--muted]">
                          {album.totalReviews} reviews
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* How Scoring Works */}
            <div className="px-6 py-8 border-b border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
                How Scoring Works
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#ffd700]">Gold Spin</span>
                  <span>+10 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Silver Spin</span>
                  <span>+5 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Bronze Spin</span>
                  <span>+2 points</span>
                </div>
              </div>
              <p className="text-xs text-[--muted] mt-4">
                Earn badges by reviewing albums before they trend.
              </p>
            </div>

            {/* Station Rankings */}
            <div className="px-6 py-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-4">
                College Radio
              </p>
              <p className="text-sm mb-4">
                Station rankings coming soon. Which college radio station has the best taste?
              </p>
              <Link
                href="/stations"
                className="block px-4 py-3 border border-[#ffd700]/30 text-sm text-center hover:border-[#ffd700] transition"
              >
                Apply for Founding Status
              </Link>
            <p className="text-[10px] text-[--muted] mt-3 text-center">
              {foundingSpotsLeft > 0 ? `${foundingSpotsLeft} of 50 founding spots left` : 'All founding spots claimed'}
            </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="border-t border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-lg font-medium">Want to climb the leaderboard?</p>
            <p className="text-sm text-[--muted]">
              Review albums early. If they trend you get credit.
            </p>
          </div>
          <Link
            href="/discover"
            className="px-6 py-3 min-h-[44px] bg-white text-black text-[11px] sm:text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#e5e5e5] transition text-center flex items-center justify-center"
          >
            Discover Albums
          </Link>
        </div>
      </section>
    </div>
  )
}
