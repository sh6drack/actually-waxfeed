import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import type { Metadata } from "next"

// Disable caching for this page - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0
import {
  ArchetypeBadge,
  GenreRadarChart,
  ArtistDNAStrip,
  TasteCardShare,
  TierProgress,
} from "@/components/tasteid"
import {
  MusicNetworksVisualization,
  MusicNetworksLegend,
  ListeningModeIndicator,
  MusicNetworkKey,
  MUSIC_NETWORKS,
} from "@/components/tasteid"
import { DefaultAvatar } from "@/components/default-avatar"
import { CCXGraphMini, DyadicIndicator } from "@/components/polarity-system"
import {
  getArchetypeInfo,
  formatListeningSignature,
  computeSignatureUniqueness,
  compareSignatures,
  computeTasteConsolidation,
  getConsolidationSummary,
  ListeningSignature,
  MemorableMoment,
  MusicalFutureSelf,
  ArtistDNA,
} from "@/lib/tasteid"
import { ArrowRightIcon } from "@/components/icons"
import { GenerateTasteIDButton, RecomputeButton, SmallRecomputeButton, ResetTasteIDButton } from "./tasteid-actions"

interface Props {
  params: Promise<{ username: string }>
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      tasteId: {
        select: {
          primaryArchetype: true,
          topGenres: true,
          polarityScore: true,
        },
      },
    },
  })

  if (!user || !user.tasteId) {
    return { title: `@${username}'s TasteID | WAXFEED` }
  }

  const archetype = getArchetypeInfo(user.tasteId.primaryArchetype)
  const title = `I'm a ${archetype?.name || user.tasteId.primaryArchetype} on WaxFeed`
  const description = `Check out my music taste fingerprint! Top genres: ${user.tasteId.topGenres.slice(0, 3).join(", ")}. Polarity score: ${user.tasteId.polarityScore.toFixed(2)}`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wax-feed.com"
  const ogImageUrl = `${baseUrl}/api/og/tasteid/${username}`

  return {
    title: `${title} | WAXFEED`,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "WAXFEED",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `@${username}'s TasteID - ${archetype?.name || user.tasteId.primaryArchetype}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

async function getTasteID(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      tasteId: {
        include: {
          snapshots: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
        },
      },
      reviews: {
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          rating: true,
          createdAt: true,
          album: {
            select: {
              genres: true,
              artistName: true,
              releaseDate: true,
            },
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
  const reviewCount = user.reviews?.length || 0
  const minReviews = 3
  const progress = Math.min(100, Math.round((reviewCount / minReviews) * 100))
  const canGenerate = reviewCount >= minReviews

  // If no TasteID, show prompt with progress
  if (!tasteId) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
        <div className="max-w-lg mx-auto">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8"
          >
            ← Back to profile
          </Link>

          {/* Premium Card Design */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] border border-white/10 shadow-2xl">
            {/* Animated background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#00ff88]/10 rounded-full blur-3xl" />
            
            <div className="relative p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                {/* Animated icon */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[#ff6b6b] p-[2px]">
                  <div className="w-full h-full rounded-2xl bg-[#1a1a2e] flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {isOwnProfile ? "Build Your TasteID" : "TasteID Not Generated"}
                </h1>
                <p className="text-white/60 text-sm">
                  {isOwnProfile
                    ? "Your unique musical fingerprint awaits"
                    : `@${username} hasn't generated their TasteID yet.`}
                </p>
              </div>

              {isOwnProfile && (
                <>
                  {/* Progress Section */}
                  <div className="mb-8 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Progress</span>
                      <span className="text-lg font-bold">
                        <span className="text-[var(--accent-primary)]">{reviewCount}</span>
                        <span className="text-white/40"> / {minReviews}</span>
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff6b6b] via-[var(--accent-primary)] to-[#00ff88] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    {/* Milestones */}
                    <div className="flex justify-between">
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                            reviewCount >= num 
                              ? 'bg-[var(--accent-primary)] text-black' 
                              : 'bg-white/10 text-white/40'
                          }`}>
                            {reviewCount >= num ? '✓' : num}
                          </div>
                          <span className={`text-[10px] ${reviewCount >= num ? 'text-[var(--accent-primary)]' : 'text-white/40'}`}>
                            {num === 3 ? 'Unlock!' : `Album ${num}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="text-center mb-8">
                    {canGenerate ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ff88]/20 text-[#00ff88]">
                        <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                        <span className="font-medium text-sm">Ready to generate!</span>
                      </div>
                    ) : (
                      <p className="text-white/60">
                        Rate <span className="text-[var(--accent-primary)] font-bold">{minReviews - reviewCount}</span> more album{minReviews - reviewCount !== 1 ? 's' : ''} to unlock
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {canGenerate ? (
                      <GenerateTasteIDButton />
                    ) : (
                      <Link
                        href="/quick-rate"
                        className="block w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hover)] text-black text-sm font-bold uppercase tracking-wider rounded-xl text-center hover:shadow-lg hover:shadow-[var(--accent-primary)]/25 transition-all"
                      >
                        Start Rating Albums
                      </Link>
                    )}
                    
                    <Link
                      href="/discover"
                      className="block w-full py-4 border border-white/20 text-white/80 text-sm font-bold uppercase tracking-wider rounded-xl text-center hover:bg-white/5 hover:border-white/40 transition-all"
                    >
                      Discover Music
                    </Link>
                  </div>

                  {/* What is TasteID */}
                  <div className="mt-10 pt-8 border-t border-white/10">
                    <h3 className="text-xs uppercase tracking-wider text-white/40 font-medium mb-5 text-center">What You'll Unlock</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-white/5 text-center hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ff8585] flex items-center justify-center">
                          <span className="text-lg">🎭</span>
                        </div>
                        <div className="text-xs font-bold text-white/90 mb-1">Archetype</div>
                        <div className="text-[10px] text-white/50">Your personality</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 text-center hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#00bfff] to-[#00d4ff] flex items-center justify-center">
                          <span className="text-lg">📊</span>
                        </div>
                        <div className="text-xs font-bold text-white/90 mb-1">Analysis</div>
                        <div className="text-[10px] text-white/50">Deep insights</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 text-center hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00ffaa] flex items-center justify-center">
                          <span className="text-lg">🤝</span>
                        </div>
                        <div className="text-xs font-bold text-white/90 mb-1">Connect</div>
                        <div className="text-[10px] text-white/50">Find your people</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!isOwnProfile && (
                <div className="text-center">
                  <Link
                    href={`/u/${username}`}
                    className="inline-block px-8 py-4 border border-white/20 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-white/5 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const archetypeInfo = getArchetypeInfo(tasteId.primaryArchetype)
  const secondaryInfo = tasteId.secondaryArchetype
    ? getArchetypeInfo(tasteId.secondaryArchetype)
    : null

  const genreVector = (tasteId.genreVector as Record<string, number>) || {}
  const decadePrefs = (tasteId.decadePreferences as Record<string, number>) || {}

  // Polarity 1.9 Dyad data
  const listeningSignature = tasteId.listeningSignature as ListeningSignature | null
  const signaturePatterns = tasteId.signaturePatterns || []
  const memorableMoments = (tasteId.memorableMoments as unknown as MemorableMoment[]) || []
  const futureSelvesMusic = (tasteId.futureSelvesMusic as unknown as MusicalFutureSelf[]) || []
  const polarityScore2 = tasteId.polarityScore2

  // Generate personalized insight based on signature
  const getSignatureInsight = (sig: ListeningSignature): string => {
    const sorted = Object.entries(sig).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return `Your listening style is uniquely yours.`
    const dominant = sorted[0][0]

    const insights: Record<string, string> = {
      discovery: `You're an explorer at heart - always seeking new sounds and pushing your taste boundaries. You thrive on finding music before it hits the mainstream.`,
      comfort: `You know what you love and you love what you know. There's wisdom in returning to albums that shaped you - they're part of your identity.`,
      deep_dive: `When you find an artist you connect with, you go ALL in. Discographies don't stand a chance against your completionist energy.`,
      reactive: `You stay plugged into what's happening NOW. New releases, trending albums, the cultural moment - you're always in the conversation.`,
      emotional: `Music hits you differently. Your ratings aren't just numbers - they're reflections of genuine emotional experiences with albums.`,
      social: `Music is better shared. You're tuned into what your community is listening to and your taste is shaped by the people around you.`,
      aesthetic: `You appreciate the full package - the art, the presentation, the vibe. Albums aren't just audio to you, they're experiences.`,
    }

    return insights[dominant] || `Your listening style is uniquely yours.`
  }

  // Get network description for tooltips
  const getNetworkMeaning = (networkId: string): string => {
    const meanings: Record<string, string> = {
      discovery: "How much you explore new artists and genres",
      comfort: "How often you return to familiar favorites",
      deep_dive: "Your tendency to go deep into artist catalogs",
      reactive: "How much you engage with new releases and trends",
      emotional: "The intensity of your reactions (high/low ratings)",
      social: "How much friend activity influences your listening",
      aesthetic: "Your attraction to visual presentation and curation",
    }
    return meanings[networkId] || ""
  }

  // Derive Music Network activations from listening signature
  // Based on TasteID architecture - 7 Music Networks mapped from Yeo model
  const deriveMusicNetworks = (sig: ListeningSignature): Partial<Record<MusicNetworkKey, number>> => {
    // Direct mapping from listening signature to Music Networks
    return {
      DISCOVERY: sig.discovery || 0,
      COMFORT: sig.comfort || 0,
      DEEP_DIVE: sig.deep_dive || 0,
      REACTIVE: sig.reactive || 0,
      EMOTIONAL: sig.emotional || 0,
      SOCIAL: sig.social || 0,
      AESTHETIC: sig.aesthetic || 0,
    }
  }

  // Get pattern explanation
  const getPatternMeaning = (pattern: string): string => {
    const meanings: Record<string, string> = {
      // Signature patterns
      'Discovery↔Comfort Oscillation': "You balance exploring new music with returning to favorites - a healthy listening rhythm",
      'Deep Dive Sprints': "When you find an artist you like, you explore their whole catalog",
      'New Release Hunter': "You stay on top of new drops and engage with music as it comes out",
      'Emotional Listener': "Your ratings reflect genuine emotional responses, not just technical judgment",

      // Rating patterns
      'Critical Ear': "You have high standards - a 10 from you really means something",
      'Music Optimist': "You find something to love in most music - your enthusiasm is contagious",
      'Polarized Taste': "You love it or you don't - there's rarely a middle ground for you",
      'Perfection Seeker': "When something clicks, it REALLY clicks - you know a masterpiece when you hear one",

      // Artist patterns
      'Discography Completionist': "You don't stop at hits - you explore artists' full bodies of work",
      'Artist Loyalist': "When you find your people, you stick with them - your favorite artists can do no wrong",

      // Genre patterns
      'Genre Explorer': "Your taste spans many genres - you refuse to be boxed in",
      'Genre Specialist': "You know what you like and you like what you know - depth over breadth",

      // Temporal patterns
      'Archive Diver': "You dig into music history - the classics aren't lost on you",
      'Era Specialist': "A specific decade speaks to you - you've mastered its sound",

      // Engagement patterns
      'Essay Writer': "Your reviews are thoughtful deep-dives, not just ratings",
      'Contrarian': "You form your own opinions - popular consensus doesn't sway you",
      'Consensus Builder': "Your taste aligns with the wisdom of the crowd",
      'Hidden Gem Hunter': "You find the overlooked masterpieces others miss",
    }
    return meanings[pattern] || "A unique pattern in your listening behavior"
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            ← Back to profile
          </Link>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {isOwnProfile && (
              <Link
                href="/quick-rate"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-black text-sm font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Keep Building
              </Link>
            )}
            {!isOwnProfile && session?.user && (
              <Link
                href={`/u/${username}/compare`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-foreground text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors w-full sm:w-auto"
              >
                COMPARE TASTE <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="border-2 border-foreground p-4 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* User info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-foreground overflow-hidden flex-shrink-0">
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
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
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
                <div className="flex items-start gap-3">
                  <ArchetypeBadge
                    {...archetypeInfo}
                    confidence={tasteId.archetypeConfidence}
                    size="lg"
                    showDescription
                  />
                  {isOwnProfile && <SmallRecomputeButton />}
                </div>
                {secondaryInfo && (
                  <div>
                    <span className="text-xs text-muted-foreground mr-2">ALSO:</span>
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
        <div className="md:hidden flex justify-center mb-6 sm:mb-8 -mx-2 overflow-hidden">
          <GenreRadarChart genres={genreVector} size={250} />
        </div>

        {/* Tier Progress */}
        <div className="mb-6 sm:mb-8">
          <TierProgress ratingCount={tasteId.reviewCount} variant="steps" />
        </div>

        {/* Stats Grid - with progress bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            label="POLARITY SCORE"
            value={tasteId.polarityScore.toFixed(2)}
            description="Taste distinctiveness"
            progress={Math.min(100, tasteId.polarityScore * 100)}
            color="#00bfff"
          />
          <StatCard
            label="ADVENTURENESS"
            value={`${Math.round(tasteId.adventurenessScore * 100)}%`}
            description="Genre diversity"
            progress={Math.round(tasteId.adventurenessScore * 100)}
            color="#00ff88"
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
            progress={(tasteId.averageRating / 10) * 100}
            color="var(--accent-primary)"
          />
        </div>

        {/* Defining Artists */}
        {tasteId.topArtists && tasteId.topArtists.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
              DEFINING ARTISTS
            </h2>
            <ArtistDNAStrip artists={tasteId.topArtists} />
          </div>
        )}

        {/* Top Genres */}
        {tasteId.topGenres && tasteId.topGenres.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
              TOP GENRES
            </h2>
            <div className="flex flex-wrap gap-2">
              {tasteId.topGenres.map((genre, i) => (
              <div
                key={genre}
                className="px-3 sm:px-4 py-2.5 sm:py-2 border-2 border-foreground flex items-center gap-2 min-h-[44px]"
              >
                <span className="text-muted-foreground text-sm">{i + 1}</span>
                <span className="font-bold uppercase text-sm sm:text-base">{genre}</span>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Decade Preferences */}
        {Object.keys(decadePrefs).length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
              DECADE PREFERENCES
            </h2>
            <div className="space-y-3 sm:space-y-2">
              {Object.entries(decadePrefs)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([decade, value]) => (
                  <div key={decade} className="flex items-center gap-3 sm:gap-4 min-h-[44px] sm:min-h-0">
                    <span className="w-14 sm:w-16 text-sm font-bold">{decade}</span>
                    <div className="flex-1 h-5 sm:h-4 bg-muted">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm text-muted-foreground">
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Review Depth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 border-2 border-border p-3 sm:p-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              REVIEW STYLE
            </div>
            <div className="text-lg font-bold uppercase">
              {tasteId.reviewDepth}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              REVIEWS ANALYZED
            </div>
            <div className="text-lg font-bold">{tasteId.reviewCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              AVG REVIEW LENGTH
            </div>
            <div className="text-lg font-bold">{tasteId.avgReviewLength} words</div>
          </div>
        </div>

        {/* POLARITY 1.9 DYAD - Listening Signature */}
        {listeningSignature && (() => {
          const signatureData = formatListeningSignature(listeningSignature)
          const uniqueness = computeSignatureUniqueness(listeningSignature)

          return (
            <div className="mb-6 sm:mb-8 border-2 border-foreground p-4 sm:p-6 relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-foreground animate-pulse" />
                <h2 className="text-xs uppercase tracking-[0.3em] text-foreground font-bold">
                  LISTENING SIGNATURE
                </h2>
                <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground uppercase tracking-wider">
                  POLARITY 1.9
                </span>
                <span className="text-[8px] px-1.5 py-0.5 bg-cyan-400/20 text-cyan-400 uppercase tracking-widest">
                  DYAD
                </span>
              </div>

              {/* Personalized insight */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {getSignatureInsight(listeningSignature)}
              </p>

              {/* Uniqueness indicator */}
              {uniqueness.standoutNetworks.length > 0 && (
                <div className="mb-4 sm:mb-6 p-3 border border-border bg-muted/50">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    WHAT MAKES YOU UNIQUE
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueness.standoutNetworks.map((s) => (
                      <span
                        key={s.network}
                        className={`text-xs px-2 py-1 border ${
                          s.direction === 'high'
                            ? 'border-green-500/50 text-green-400'
                            : 'border-orange-500/50 text-orange-400'
                        }`}
                      >
                        {s.direction === 'high' ? '+' : '-'}{s.deviation}% {s.network.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {signatureData.map((network, i) => (
                  <div key={network.network} className="group">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className="text-lg sm:text-xl w-6 sm:w-8 flex-shrink-0">{network.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold uppercase tracking-wide">
                              {network.name}
                            </span>
                            {network.deviation !== 'typical' && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 ${
                                  network.deviation === 'above'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}
                              >
                                {network.deviation === 'above' ? '↑' : '↓'} {network.deviationAmount}%
                              </span>
                            )}
                            <span className="text-[10px] sm:text-xs text-muted-foreground hidden md:inline">
                              {getNetworkMeaning(network.network)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground hidden md:inline">
                              typical: {network.typicalRange.min}-{network.typicalRange.max}%
                            </span>
                            <span className="text-sm text-muted-foreground font-mono">
                              {network.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted overflow-hidden relative">
                          {/* Typical range indicator */}
                          <div
                            className="absolute h-full bg-muted-foreground/20"
                            style={{
                              left: `${network.typicalRange.min}%`,
                              width: `${network.typicalRange.max - network.typicalRange.min}%`,
                            }}
                          />
                          {/* User's value */}
                          <div
                            className={`h-full transition-all duration-700 ease-out ${
                              network.deviation === 'above'
                                ? 'bg-green-400'
                                : network.deviation === 'below'
                                ? 'bg-orange-400'
                                : 'bg-foreground'
                            }`}
                            style={{
                              width: `${Math.min(network.percentage, 100)}%`,
                              animationDelay: `${i * 100}ms`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 sm:mt-6 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                {polarityScore2 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        POLARITY 2.0
                      </span>
                      <span className="text-2xl font-bold font-mono">
                        {polarityScore2.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Taste identity strength
                    </p>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      UNIQUENESS
                    </span>
                    <span className="text-2xl font-bold font-mono">
                      {Math.round(uniqueness.score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How distinct from typical
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* CCX TASTE CONNECTOME - Polarity 1.9 Dyad */}
        {listeningSignature && (
          <div className="mb-6 sm:mb-8 ccx-frame p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <CCXGraphMini nodes={7} className="shrink-0" />
              <div>
                <h2 className="text-xs uppercase tracking-[0.3em] text-foreground font-bold">
                  TASTE CONNECTOME
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your music identity as a cognitive graph
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-3 border border-border">
                <DyadicIndicator
                  strength={polarityScore2 ? polarityScore2 / 100 : 0.5}
                  label="IDENTITY STRENGTH"
                />
              </div>
              <div className="p-3 border border-border">
                <div className="font-mono text-[9px] tracking-wider text-muted-foreground mb-2">
                  CCX METRICS
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span><span className="text-[var(--accent-primary)]">7</span> Networks</span>
                  <span><span className="text-cyan-400">14</span> Node Types</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7 Music Networks Visualization */}
        {listeningSignature && (() => {
          const musicNetworks = deriveMusicNetworks(listeningSignature)

          return (
            <div className="mb-6 sm:mb-8 border-2 border-foreground p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-blue-400" />
                <h2 className="text-xs uppercase tracking-[0.3em] text-foreground font-bold">
                  7 MUSIC NETWORKS
                </h2>
                <span className="text-[10px] px-2 py-0.5 border border-blue-400/30 text-blue-400 uppercase tracking-wider">
                  YEO MODEL
                </span>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Your listening signature mapped to 7 distinct modes of musical engagement, adapted from the Yeo 7-Network cognitive model.
              </p>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Music Networks Visualization */}
                <div className="flex justify-center lg:justify-start">
                  <MusicNetworksVisualization
                    networkActivations={musicNetworks}
                    size={240}
                  />
                </div>

                {/* Listening Mode + Legend */}
                <div className="flex-1 space-y-4">
                  <ListeningModeIndicator
                    networkActivations={musicNetworks}
                    className="mb-4"
                  />

                  <div className="pt-4 border-t border-border">
                    <MusicNetworksLegend showYeoMapping={true} />
                  </div>
                </div>
              </div>

              {/* Network Detection Signals */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                  Network Detection Signals
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 border border-border">
                    <span className="text-blue-400 font-bold block mb-2">DISCOVERY MODE</span>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• First-time artist reviews</li>
                      <li>• Genre diversity in recent reviews</li>
                      <li>• Low artist repeat rate</li>
                    </ul>
                  </div>
                  <div className="p-3 border border-border">
                    <span className="text-emerald-400 font-bold block mb-2">DEEP DIVE MODE</span>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Multiple albums from same artist</li>
                      <li>• Chronological exploration</li>
                      <li>• Complete discography patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Signature Patterns */}
        {signaturePatterns.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
              YOUR PATTERNS
            </h2>
            <div className="space-y-3">
              {signaturePatterns.map((pattern: string) => (
                <div
                  key={pattern}
                  className="border border-border p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 bg-foreground mt-1.5 flex-shrink-0" />
                    <span className="font-bold uppercase tracking-wide text-sm sm:text-base">
                      {pattern}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-5">
                    {getPatternMeaning(pattern)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memorable Moments */}
        {memorableMoments.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
              MEMORABLE MOMENTS
            </h2>
            <div className="space-y-3">
              {memorableMoments.slice(0, 5).map((moment, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border border-border hover:border-muted-foreground transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 sm:w-10 sm:h-10 border border-foreground flex items-center justify-center text-lg flex-shrink-0">
                      {moment.type === 'first_10' ? '10' : moment.type === 'first_0' ? '0' : '💜'}
                    </div>
                    <div className="flex-1 min-w-0 sm:w-auto">
                      <div className="font-bold truncate">{moment.albumTitle}</div>
                      <div className="text-sm text-muted-foreground">{moment.artistName}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider pl-[60px] sm:pl-0 sm:ml-auto">
                    {moment.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Musical Future Selves */}
        {futureSelvesMusic.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
              YOUR MUSICAL FUTURES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futureSelvesMusic.map((future) => (
                <div
                  key={future.id}
                  className="border-2 border-border hover:border-foreground p-4 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold uppercase tracking-wide text-sm sm:text-base">
                      {future.name}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round(future.progress * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {future.description}
                  </p>
                  {/* Progress bar */}
                  <div className="h-1.5 sm:h-1 bg-muted mb-3">
                    <div
                      className="h-full bg-foreground transition-all duration-500"
                      style={{ width: `${future.progress * 100}%` }}
                    />
                  </div>
                  {/* Next steps */}
                  <div className="text-xs text-muted-foreground">
                    <span className="uppercase tracking-wider">Next: </span>
                    {future.nextSteps?.[0] || 'Continue exploring'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taste Drift / Evolution */}
        {tasteId.snapshots.length > 1 && listeningSignature && (() => {
          // Find oldest snapshot with listening signature
          const snapshotsWithSignature = tasteId.snapshots.filter(
            (s) => s.listeningSignature
          )
          if (snapshotsWithSignature.length === 0) return null

          const oldestSnapshot = snapshotsWithSignature[snapshotsWithSignature.length - 1]
          const oldSignature = oldestSnapshot.listeningSignature as ListeningSignature | null
          if (!oldSignature) return null

          const comparison = compareSignatures(listeningSignature, oldSignature)
          const significantChanges = comparison.networkChanges.filter(
            (c) => Math.abs(c.change) > 3
          )

          return (
            <div className="mb-6 sm:mb-8 border border-border p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  TASTE EVOLUTION
                </h2>
                <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground">
                  since {oldestSnapshot.month}/{oldestSnapshot.year}
                </span>
              </div>

              <p className="text-muted-foreground mb-4">{comparison.interpretation}</p>

              {significantChanges.length > 0 && (
                <div className="space-y-2">
                  {significantChanges.slice(0, 4).map((change) => (
                    <div
                      key={change.network}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={`w-6 text-center ${
                          change.direction === 'increased'
                            ? 'text-green-400'
                            : change.direction === 'decreased'
                            ? 'text-orange-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {change.direction === 'increased'
                          ? '↑'
                          : change.direction === 'decreased'
                          ? '↓'
                          : '→'}
                      </span>
                      <span className="uppercase font-bold">
                        {change.network.replace('_', ' ')}
                      </span>
                      <span className="text-muted-foreground">
                        {change.change > 0 ? '+' : ''}
                        {change.change}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overall drift</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted">
                    <div
                      className={`h-full ${
                        comparison.overallDrift > 0.3
                          ? 'bg-yellow-400'
                          : comparison.overallDrift > 0.15
                          ? 'bg-blue-400'
                          : 'bg-green-400'
                      }`}
                      style={{ width: `${comparison.overallDrift * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {Math.round(comparison.overallDrift * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Taste Consolidation - What's Sticking */}
        {user.reviews.length >= 15 && (() => {
          const genreVec = tasteId.genreVector as Record<string, number>
          const artistDna = (tasteId.artistDNA as unknown as ArtistDNA[]) || []

          const consolidation = computeTasteConsolidation(
            user.reviews,
            genreVec,
            artistDna
          )
          const summary = getConsolidationSummary(consolidation)

          if (consolidation.length === 0) return null

          return (
            <div className="mb-6 sm:mb-8 border border-border p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <div className="w-2 h-2 bg-green-400" />
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  TASTE CONSOLIDATION
                </h2>
                <span className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground uppercase tracking-wider">
                  WHAT&apos;S STICKING
                </span>
              </div>

              <div className="mb-4">
                <div className="text-lg font-bold mb-1">{summary.headline}</div>
                <p className="text-muted-foreground text-sm">{summary.details}</p>
              </div>

              {/* Core tastes grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summary.coreGenres.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      CORE GENRES
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {summary.coreGenres.map((genre) => (
                        <span
                          key={genre}
                          className="text-xs px-2 py-1 border border-green-500/30 text-green-400"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {summary.coreArtists.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      CORE ARTISTS
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {summary.coreArtists.map((artist) => (
                        <span
                          key={artist}
                          className="text-xs px-2 py-1 border border-blue-500/30 text-blue-400"
                        >
                          {artist}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Consolidation bars */}
              <div className="mt-4 pt-4 border-t border-border space-y-3 sm:space-y-2">
                {consolidation.slice(0, 5).map((item) => (
                  <div key={`${item.type}-${item.name}`} className="flex items-center gap-2 sm:gap-3 min-h-[36px] sm:min-h-0">
                    <span className="text-[10px] w-12 text-muted-foreground uppercase flex-shrink-0">
                      {item.type}
                    </span>
                    <span className="w-24 sm:w-32 text-sm truncate">{item.name}</span>
                    <div className="flex-1 h-2 sm:h-1.5 bg-muted">
                      <div
                        className={`h-full ${
                          item.trend === 'strengthening'
                            ? 'bg-green-400'
                            : item.trend === 'fading'
                            ? 'bg-orange-400'
                            : 'bg-foreground'
                        }`}
                        style={{ width: `${item.strength * 100}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm sm:text-[10px] w-6 ${
                        item.trend === 'strengthening'
                          ? 'text-green-400'
                          : item.trend === 'fading'
                          ? 'text-orange-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.trend === 'strengthening'
                        ? '↑'
                        : item.trend === 'fading'
                        ? '↓'
                        : '→'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Share */}
        {isOwnProfile && (
          <div className="mb-6 sm:mb-8 border-2 border-border p-4 sm:p-6">
            <TasteCardShare
              username={username}
              archetype={archetypeInfo.name}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          {isOwnProfile && (
            <RecomputeButton />
          )}
          <Link
            href={`/discover/similar-tasters`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border-2 border-border text-sm font-bold uppercase tracking-wider hover:border-foreground transition-colors"
          >
            FIND SIMILAR TASTERS
          </Link>
        </div>

        {/* Last computed */}
        <div className="mt-8 text-xs text-muted-foreground">
          Last computed:{" "}
          {new Date(tasteId.lastComputedAt).toLocaleDateString()}
        </div>

        {/* Danger Zone - Reset */}
        {isOwnProfile && (
          <div className="mt-12 pt-8 border-t border-red-500/20">
            <div className="text-xs uppercase tracking-widest text-red-500/70 mb-4">
              DANGER ZONE
            </div>
            <ResetTasteIDButton />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  progress,
  color = 'var(--accent-primary)',
}: {
  label: string
  value: string
  description: string
  progress?: number // 0-100 for showing a progress bar
  color?: string
}) {
  return (
    <div className="border-2 border-foreground p-3 sm:p-4">
      <div className="text-[10px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-bold" style={progress !== undefined ? { color } : undefined}>
        {value}
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2 mb-1">
          <div 
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
      )}
      <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{description}</div>
    </div>
  )
}
