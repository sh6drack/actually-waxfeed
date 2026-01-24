import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import {
  ArchetypeBadge,
  GenreRadarChart,
  ArtistDNAStrip,
  TasteCardShare,
} from "@/components/tasteid"
import { DefaultAvatar } from "@/components/default-avatar"
import {
  getArchetypeInfo,
  formatListeningSignature,
  getDominantNetworks,
  ListeningSignature,
  MemorableMoment,
  MusicalFutureSelf,
} from "@/lib/tasteid"
import { ArrowRightIcon } from "@/components/icons"
import { GenerateTasteIDButton, RecomputeButton } from "./tasteid-actions"

interface Props {
  params: Promise<{ username: string }>
}

async function getTasteID(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      tasteId: {
        include: {
          snapshots: {
            orderBy: { createdAt: "desc" },
            take: 6,
          },
        },
      },
    },
  })

  return user
}

export default async function TasteIDPage({ params }: Props) {
  const { username } = await params
  const session = await auth()
  const user = await getTasteID(username)

  if (!user) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === user.id
  const tasteId = user.tasteId

  // If no TasteID, show prompt
  if (!tasteId) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-8"
          >
            ← Back to profile
          </Link>

          <div className="border-2 border-white p-8 text-center space-y-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider">
              TASTEID NOT GENERATED
            </h1>
            <p className="text-neutral-400">
              {isOwnProfile
                ? "Your TasteID hasn't been computed yet. Review at least 3 albums to generate your unique taste fingerprint."
                : `@${username} hasn't generated their TasteID yet.`}
            </p>
            {isOwnProfile && (
              <GenerateTasteIDButton />
            )}
          </div>
        </div>
      </div>
    )
  }

  const archetypeInfo = getArchetypeInfo(tasteId.primaryArchetype)
  const secondaryInfo = tasteId.secondaryArchetype
    ? getArchetypeInfo(tasteId.secondaryArchetype)
    : null

  const genreVector = tasteId.genreVector as Record<string, number>
  const decadePrefs = tasteId.decadePreferences as Record<string, number>

  // Polarity 1.2 data
  const listeningSignature = tasteId.listeningSignature as ListeningSignature | null
  const signaturePatterns = tasteId.signaturePatterns || []
  const memorableMoments = (tasteId.memorableMoments as unknown as MemorableMoment[]) || []
  const futureSelvesMusic = (tasteId.futureSelvesMusic as unknown as MusicalFutureSelf[]) || []
  const polarityScore2 = tasteId.polarityScore2

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white"
          >
            ← Back to profile
          </Link>
          {!isOwnProfile && session?.user && (
            <Link
              href={`/u/${username}/compare`}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            >
              COMPARE TASTE <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Hero Section */}
        <div className="border-2 border-white p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border-2 border-white overflow-hidden">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.username || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <DefaultAvatar size="lg" className="w-full h-full" />
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">
                  TASTEID
                </div>
                <Link
                  href={`/u/${username}`}
                  className="text-xl font-bold hover:underline"
                >
                  @{username}
                </Link>
              </div>
            </div>

            {/* Archetype */}
            <div className="flex-1">
              <div className="space-y-3">
                <ArchetypeBadge
                  {...archetypeInfo}
                  confidence={tasteId.archetypeConfidence}
                  size="lg"
                  showDescription
                />
                {secondaryInfo && (
                  <div>
                    <span className="text-xs text-neutral-500 mr-2">ALSO:</span>
                    <ArchetypeBadge {...secondaryInfo} size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Radar chart */}
            <div className="hidden md:block">
              <GenreRadarChart genres={genreVector} size={180} />
            </div>
          </div>
        </div>

        {/* Mobile radar */}
        <div className="md:hidden flex justify-center mb-8">
          <GenreRadarChart genres={genreVector} size={250} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="POLARITY SCORE"
            value={tasteId.polarityScore.toFixed(2)}
            description="Taste distinctiveness"
          />
          <StatCard
            label="ADVENTURENESS"
            value={`${Math.round(tasteId.adventurenessScore * 100)}%`}
            description="Genre diversity"
          />
          <StatCard
            label="RATING STYLE"
            value={tasteId.ratingSkew.toUpperCase()}
            description={
              tasteId.ratingSkew === "harsh"
                ? "High standards"
                : tasteId.ratingSkew === "lenient"
                ? "Finds joy easily"
                : "Balanced critic"
            }
          />
          <StatCard
            label="AVG RATING"
            value={tasteId.averageRating.toFixed(1)}
            description={`±${tasteId.ratingStdDev.toFixed(1)} std dev`}
          />
        </div>

        {/* Defining Artists */}
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-4">
            DEFINING ARTISTS
          </h2>
          <ArtistDNAStrip artists={tasteId.topArtists} />
        </div>

        {/* Top Genres */}
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-4">
            TOP GENRES
          </h2>
          <div className="flex flex-wrap gap-2">
            {tasteId.topGenres.map((genre, i) => (
              <div
                key={genre}
                className="px-4 py-2 border-2 border-white flex items-center gap-2"
              >
                <span className="text-neutral-500 text-sm">{i + 1}</span>
                <span className="font-bold uppercase">{genre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decade Preferences */}
        {Object.keys(decadePrefs).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-4">
              DECADE PREFERENCES
            </h2>
            <div className="space-y-2">
              {Object.entries(decadePrefs)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([decade, value]) => (
                  <div key={decade} className="flex items-center gap-4">
                    <span className="w-16 text-sm font-bold">{decade}</span>
                    <div className="flex-1 h-4 bg-neutral-800">
                      <div
                        className="h-full bg-white"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm text-neutral-500">
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Review Depth */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 border-2 border-neutral-800 p-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">
              REVIEW STYLE
            </div>
            <div className="text-lg font-bold uppercase">
              {tasteId.reviewDepth}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">
              REVIEWS ANALYZED
            </div>
            <div className="text-lg font-bold">{tasteId.reviewCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">
              AVG REVIEW LENGTH
            </div>
            <div className="text-lg font-bold">{tasteId.avgReviewLength} words</div>
          </div>
        </div>

        {/* POLARITY 1.2 - Listening Signature */}
        {listeningSignature && (
          <div className="mb-8 border-2 border-white p-6 relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-white animate-pulse" />
              <h2 className="text-xs uppercase tracking-[0.3em] text-white font-bold">
                LISTENING SIGNATURE
              </h2>
              <span className="text-[10px] px-2 py-0.5 border border-neutral-700 text-neutral-500 uppercase tracking-wider">
                POLARITY 1.2
              </span>
            </div>

            <div className="space-y-3">
              {formatListeningSignature(listeningSignature).map((network, i) => (
                <div key={network.network} className="group">
                  <div className="flex items-center gap-4">
                    <span className="text-xl w-8">{network.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold uppercase tracking-wide">
                          {network.name}
                        </span>
                        <span className="text-sm text-neutral-400 font-mono">
                          {network.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-900 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-700 ease-out"
                          style={{
                            width: `${network.percentage}%`,
                            animationDelay: `${i * 100}ms`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {polarityScore2 && (
              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-neutral-500">
                  POLARITY SCORE 2.0
                </span>
                <span className="text-2xl font-bold font-mono">
                  {polarityScore2.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Signature Patterns */}
        {signaturePatterns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-4">
              YOUR PATTERNS
            </h2>
            <div className="flex flex-wrap gap-2">
              {signaturePatterns.map((pattern) => (
                <div
                  key={pattern}
                  className="px-4 py-2 bg-white text-black font-bold text-sm uppercase tracking-wide"
                >
                  {pattern}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memorable Moments */}
        {memorableMoments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-4">
              MEMORABLE MOMENTS
            </h2>
            <div className="space-y-3">
              {memorableMoments.slice(0, 5).map((moment, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border border-neutral-800 hover:border-neutral-600 transition-colors"
                >
                  <div className="w-10 h-10 border border-white flex items-center justify-center text-lg">
                    {moment.type === 'first_10' ? '10' : moment.type === 'first_0' ? '0' : '💜'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{moment.albumTitle}</div>
                    <div className="text-sm text-neutral-500">{moment.artistName}</div>
                  </div>
                  <div className="text-xs text-neutral-600 uppercase tracking-wider">
                    {moment.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Musical Future Selves */}
        {futureSelvesMusic.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-4">
              YOUR MUSICAL FUTURES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futureSelvesMusic.map((future) => (
                <div
                  key={future.id}
                  className="border-2 border-neutral-800 hover:border-white p-4 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold uppercase tracking-wide">
                      {future.name}
                    </h3>
                    <span className="text-xs font-mono text-neutral-500">
                      {Math.round(future.progress * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 mb-3">
                    {future.description}
                  </p>
                  {/* Progress bar */}
                  <div className="h-1 bg-neutral-900 mb-3">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${future.progress * 100}%` }}
                    />
                  </div>
                  {/* Next steps */}
                  <div className="text-xs text-neutral-600">
                    <span className="uppercase tracking-wider">Next: </span>
                    {future.nextSteps[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        {isOwnProfile && (
          <div className="mb-8 border-2 border-neutral-800 p-6">
            <TasteCardShare
              username={username}
              archetype={archetypeInfo.name}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          {isOwnProfile && (
            <RecomputeButton />
          )}
          <Link
            href={`/discover/similar-tasters`}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-neutral-700 text-sm font-bold uppercase tracking-wider hover:border-white transition-colors"
          >
            FIND SIMILAR TASTERS
          </Link>
        </div>

        {/* Last computed */}
        <div className="mt-8 text-xs text-neutral-600">
          Last computed:{" "}
          {new Date(tasteId.lastComputedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="border-2 border-white p-4">
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{description}</div>
    </div>
  )
}
