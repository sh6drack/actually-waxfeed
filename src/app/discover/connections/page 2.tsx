import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getArchetypeInfo, computeTasteMatch } from "@/lib/tasteid"
import { DefaultAvatar } from "@/components/default-avatar"
import { ConnectionFilters } from "./connection-filters"

export const dynamic = "force-dynamic"

// Match type metadata
const MATCH_TYPES = {
  taste_twin: {
    name: "Taste Twin",
    icon: "👯",
    color: "text-[#ffd700]",
    borderColor: "border-[#ffd700]/30",
    description: "80%+ compatibility - your musical soulmate",
  },
  genre_buddy: {
    name: "Genre Buddy",
    icon: "🎵",
    color: "text-blue-400",
    borderColor: "border-blue-400/30",
    description: "Strong genre overlap",
  },
  complementary: {
    name: "Opposite Attracts",
    icon: "🌀",
    color: "text-purple-400",
    borderColor: "border-purple-400/30",
    description: "Different tastes that could expand your horizons",
  },
  explorer_guide: {
    name: "Explorer Guide",
    icon: "🧭",
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    description: "One explores, one guides - learn from each other",
  },
}

interface TasteConnection {
  userId: string
  username: string
  image: string | null
  compatibility: number
  sharedGenres: string[]
  sharedArtists: string[]
  archetype: string
  matchType: keyof typeof MATCH_TYPES
  genreOverlap: number
  ratingAlignment: number
}

async function findTasteConnections(userId: string): Promise<TasteConnection[]> {
  const userTaste = await prisma.tasteID.findUnique({
    where: { userId },
  })

  if (!userTaste) return []

  // Get all other TasteIDs with their users
  const otherTastes = await prisma.tasteID.findMany({
    where: { userId: { not: userId } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    take: 50, // Get top 50 for performance
  })

  // Compute detailed matches for each
  const connections: TasteConnection[] = []

  for (const taste of otherTastes) {
    if (!taste.user.username) continue

    const match = await computeTasteMatch(userId, taste.userId)
    if (!match) continue

    connections.push({
      userId: taste.userId,
      username: taste.user.username,
      image: taste.user.image,
      compatibility: match.overallScore,
      sharedGenres: match.sharedGenres,
      sharedArtists: match.sharedArtists,
      archetype: taste.primaryArchetype,
      matchType: match.matchType as keyof typeof MATCH_TYPES,
      genreOverlap: match.genreOverlap,
      ratingAlignment: match.ratingAlignment,
    })
  }

  // Sort by compatibility
  return connections.sort((a, b) => b.compatibility - a.compatibility)
}

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/discover/connections")
  }

  // Get user's TasteID
  const tasteId = await prisma.tasteID.findUnique({
    where: { userId: session.user.id },
  })

  if (!tasteId) {
    redirect("/taste-setup")
  }

  // Get user's review count
  const reviewCount = await prisma.review.count({
    where: { userId: session.user.id },
  })

  // Need 20 reviews for taste matching
  const reviewsNeeded = Math.max(0, 20 - reviewCount)
  if (reviewCount < 20) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="border-2 border-dashed border-[--border] p-12 text-center">
            <div className="text-6xl mb-6">🎵</div>
            <h1 className="text-3xl font-bold mb-4">
              {reviewsNeeded} More Review{reviewsNeeded !== 1 ? 's' : ''} Needed
            </h1>
            <p className="text-[--muted] mb-6 max-w-md mx-auto">
              Rate at least <span className="font-bold text-[#ffd700]">20 albums</span> to unlock Taste Connections.
              The more you review, the better your matches.
            </p>
            <div className="mb-8">
              <div className="w-full max-w-xs mx-auto h-2 bg-[--border] overflow-hidden">
                <div
                  className="h-full bg-[#ffd700] transition-all duration-500"
                  style={{ width: `${Math.min((reviewCount / 20) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-[--muted] mt-2 tabular-nums">
                {reviewCount} / 20 reviews
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/discover/swipe"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd700] text-black text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-[#ffed4a] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Quick Rate Mode
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[--border] text-[11px] tracking-[0.15em] uppercase font-medium hover:border-white hover:text-white transition-colors"
              >
                Search Albums
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const allConnections = await findTasteConnections(session.user.id)
  const userArchetype = getArchetypeInfo(tasteId.primaryArchetype)

  // Filter connections based on URL param
  const filter = params.filter || "all"
  const connections =
    filter === "all"
      ? allConnections
      : allConnections.filter((c) => c.matchType === filter)

  // Count by type for filter badges
  const typeCounts = {
    all: allConnections.length,
    taste_twin: allConnections.filter((c) => c.matchType === "taste_twin").length,
    complementary: allConnections.filter((c) => c.matchType === "complementary").length,
    explorer_guide: allConnections.filter((c) => c.matchType === "explorer_guide").length,
    genre_buddy: allConnections.filter((c) => c.matchType === "genre_buddy").length,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 pb-6 border-b border-[--border]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#ffd700] mb-2">
                Polarity Match Engine
              </p>
              <h1 className="text-4xl font-bold tracking-tight">Taste Connections</h1>
            </div>
            <Link
              href="/discover"
              className="px-4 py-2 border-2 border-[--border] text-[11px] tracking-[0.15em] uppercase font-medium hover:border-white hover:bg-white hover:text-black transition-colors"
            >
              Back
            </Link>
          </div>
          <p className="text-[--muted] max-w-2xl">
            Find people who share your musical DNA. Connections are computed using genre overlap,
            artist preferences, and rating patterns.
          </p>
        </div>

        {/* Your TasteID */}
        <div className="mb-8 p-5 border border-[--border] flex items-center gap-4">
          <div className="text-4xl">{userArchetype.icon}</div>
          <div className="flex-1">
            <div className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-1">
              Your Archetype
            </div>
            <div className="text-xl font-bold">{userArchetype.name}</div>
          </div>
          <Link
            href={`/u/${session.user.username || session.user.id}/tasteid`}
            className="text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
          >
            View Full TasteID →
          </Link>
        </div>

        {/* Filter Tabs */}
        <ConnectionFilters currentFilter={filter} counts={typeCounts} />

        {/* Connections Grid */}
        {connections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((connection) => {
              const matchMeta = MATCH_TYPES[connection.matchType] || MATCH_TYPES.genre_buddy
              const archetypeInfo = getArchetypeInfo(connection.archetype)

              return (
                <Link
                  key={connection.userId}
                  href={`/u/${connection.username}`}
                  className={`group border ${matchMeta.borderColor} hover:border-white p-5 transition-colors`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 border border-[--border] flex-shrink-0 overflow-hidden group-hover:border-white transition-colors">
                      {connection.image ? (
                        <img
                          src={connection.image}
                          alt={connection.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAvatar size="md" className="w-full h-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg truncate">@{connection.username}</span>
                        <span className={`text-sm ${matchMeta.color}`}>{matchMeta.icon}</span>
                      </div>

                      {/* Archetype */}
                      <div className="text-sm text-[--muted] mb-3 flex items-center gap-2">
                        <span>{archetypeInfo.icon}</span>
                        <span className="uppercase text-[10px] tracking-wider">{archetypeInfo.name}</span>
                      </div>

                      {/* Match Type Badge */}
                      <div className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 border ${matchMeta.borderColor} ${matchMeta.color} uppercase tracking-wider mb-3`}>
                        {matchMeta.name}
                      </div>

                      {/* Shared Genres */}
                      {connection.sharedGenres.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {connection.sharedGenres.slice(0, 3).map((genre) => (
                            <span
                              key={genre}
                              className="text-[9px] px-2 py-0.5 border border-[--border] text-[--muted] uppercase tracking-wider"
                            >
                              {genre}
                            </span>
                          ))}
                          {connection.sharedGenres.length > 3 && (
                            <span className="text-[9px] px-2 py-0.5 text-[--muted]">
                              +{connection.sharedGenres.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Compatibility Score */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-3xl font-bold tabular-nums">{connection.compatibility}%</div>
                      <div className="text-[9px] text-[--muted] uppercase tracking-wider">Match</div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="mt-4 pt-4 border-t border-[--border] flex items-center gap-6 text-[10px] text-[--muted]">
                    <div>
                      <span className="font-semibold text-white">{connection.genreOverlap}%</span> genre overlap
                    </div>
                    <div>
                      <span className="font-semibold text-white">{connection.ratingAlignment}%</span> rating alignment
                    </div>
                    {connection.sharedArtists.length > 0 && (
                      <div>
                        <span className="font-semibold text-white">{connection.sharedArtists.length}</span> shared artists
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[--border] p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">
              {filter === "all" ? "No connections found" : `No ${MATCH_TYPES[filter as keyof typeof MATCH_TYPES]?.name || filter} matches`}
            </h3>
            <p className="text-[--muted] mb-6 max-w-md mx-auto">
              {filter === "all"
                ? "Not enough users with TasteIDs to find matches. Check back soon!"
                : "Try a different filter or check back as more users join."}
            </p>
            {filter !== "all" && (
              <Link
                href="/discover/connections"
                className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
              >
                View All Connections →
              </Link>
            )}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 pt-8 border-t border-[--border]">
          <h3 className="text-[11px] tracking-[0.2em] uppercase text-[--muted] mb-4">
            Understanding Match Types
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(MATCH_TYPES).map(([key, meta]) => (
              <div key={key} className={`p-4 border ${meta.borderColor}`}>
                <div className="text-2xl mb-2">{meta.icon}</div>
                <div className={`font-bold mb-1 ${meta.color}`}>{meta.name}</div>
                <p className="text-[11px] text-[--muted]">{meta.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
