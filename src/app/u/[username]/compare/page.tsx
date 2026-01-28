import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { TasteComparison, TasteComparisonSkeleton } from "@/components/tasteid"
import { getArchetypeInfo, computeTasteMatch } from "@/lib/tasteid"

interface Props {
  params: Promise<{ username: string }>
}

async function getComparisonData(currentUserId: string, targetUsername: string) {
  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      tasteId: true,
    },
  })

  if (!targetUser || !targetUser.tasteId) {
    return null
  }

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      tasteId: true,
    },
  })

  if (!currentUser || !currentUser.tasteId) {
    return { needsOwnTasteId: true, targetUser }
  }

  // Compute or get cached match
  let match = await prisma.tasteMatch.findFirst({
    where: {
      OR: [
        { user1Id: currentUserId, user2Id: targetUser.id },
        { user1Id: targetUser.id, user2Id: currentUserId },
      ],
    },
  })

  // If match is stale or doesn't exist, recompute
  const isStale = match && Date.now() - match.updatedAt.getTime() > 24 * 60 * 60 * 1000

  if (!match || isStale) {
    const computed = await computeTasteMatch(currentUserId, targetUser.id)
    if (computed) {
      match = await prisma.tasteMatch.upsert({
        where: {
          user1Id_user2Id: {
            user1Id: currentUserId,
            user2Id: targetUser.id,
          },
        },
        create: {
          user1Id: currentUserId,
          user2Id: targetUser.id,
          ...computed,
        },
        update: computed,
      })
    }
  }

  // Get shared albums with details
  const sharedAlbumDetails = match
    ? await prisma.album.findMany({
        where: { id: { in: match.sharedAlbums } },
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrlMedium: true,
        },
        take: 5,
      })
    : []

  return {
    currentUser,
    targetUser,
    match,
    sharedAlbumDetails,
  }
}

export default async function ComparePage({ params }: Props) {
  const { username } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/u/${username}/compare`)
  }

  // Can't compare with yourself
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })

  if (currentUser?.username === username) {
    redirect(`/u/${username}/tasteid`)
  }

  const data = await getComparisonData(session.user.id, username)

  if (!data) {
    notFound()
  }

  // Target user doesn't have TasteID
  if (!("currentUser" in data)) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-8"
          >
            ← Back to profile
          </Link>

          <div className="border-2 border-white p-8 text-center space-y-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider">
              CANNOT COMPARE
            </h1>
            <p className="text-neutral-400">
              @{username} hasn't generated their TasteID yet.
              Check back later!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Current user doesn't have TasteID
  if ("needsOwnTasteId" in data && data.needsOwnTasteId) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-8"
          >
            ← Back to profile
          </Link>

          <div className="border-2 border-white p-8 text-center space-y-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider">
              GENERATE YOUR TASTEID FIRST
            </h1>
            <p className="text-neutral-400">
              You need to generate your own TasteID before comparing with others.
            </p>
            <Link
              href={`/u/${currentUser?.username}/tasteid`}
              className="inline-block px-6 py-3 border-2 border-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            >
              GO TO MY TASTEID
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { currentUser: me, targetUser: them, match, sharedAlbumDetails } = data

  if (!match || !me || !them) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="w-full px-4 lg:px-12 xl:px-20 text-center">
          <p>Could not compute taste match. Please try again.</p>
        </div>
      </div>
    )
  }

  const matchTypeDescriptions: Record<string, string> = {
    taste_twin: "You two are taste twins! Almost identical preferences.",
    complementary: "Complementary tastes - you could introduce each other to new music.",
    explorer_guide: "One of you explores more - perfect for music recommendations.",
    genre_buddy: "You share key genre interests.",
  }

  const myArchetype = getArchetypeInfo(me.tasteId!.primaryArchetype)
  const theirArchetype = getArchetypeInfo(them.tasteId!.primaryArchetype)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white"
          >
            ← Back to @{username}
          </Link>
        </div>

        <h1 className="text-3xl font-bold uppercase tracking-wider mb-8 text-center">
          TASTE COMPARISON
        </h1>

        <TasteComparison
          you={{
            id: me.id,
            username: me.username,
            name: me.name,
            image: me.image,
            archetype: myArchetype,
            topGenres: me.tasteId!.topGenres,
            adventurenessScore: me.tasteId!.adventurenessScore,
          }}
          them={{
            id: them.id,
            username: them.username,
            name: them.name,
            image: them.image,
            archetype: theirArchetype,
            topGenres: them.tasteId!.topGenres,
            adventurenessScore: them.tasteId!.adventurenessScore,
          }}
          overallScore={match.overallScore}
          matchType={match.matchType}
          matchDescription={
            matchTypeDescriptions[match.matchType] || "You share musical interests."
          }
          breakdown={{
            genreOverlap: match.genreOverlap,
            artistOverlap: match.artistOverlap,
            ratingAlignment: match.ratingAlignment,
          }}
          sharedGenres={match.sharedGenres}
          sharedArtists={match.sharedArtists}
          sharedAlbums={sharedAlbumDetails}
        />

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href={`/u/${them.username}/tasteid`}
            className="px-4 py-2 border-2 border-neutral-700 text-sm font-bold uppercase tracking-wider hover:border-white transition-colors"
          >
            VIEW THEIR FULL TASTEID
          </Link>
          <Link
            href={`/discover/similar-tasters`}
            className="px-4 py-2 border-2 border-neutral-700 text-sm font-bold uppercase tracking-wider hover:border-white transition-colors"
          >
            FIND MORE MATCHES
          </Link>
        </div>
      </div>
    </div>
  )
}
