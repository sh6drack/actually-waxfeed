import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { HotTakeCard, HotTake } from "@/components/hot-take-card"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getHotTakes(userId?: string): Promise<HotTake[]> {
  const hotTakes = await prisma.hotTake.findMany({
    orderBy: [
      { createdAt: "desc" },
    ],
    take: 20,
    include: {
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
        },
      },
      author: {
        select: {
          id: true,
          username: true,
        },
      },
      votes: userId
        ? {
            where: { userId },
            select: { vote: true },
          }
        : false,
      arguments: {
        orderBy: { likes: "desc" },
        take: 2,
        include: {
          author: {
            select: { username: true },
          },
        },
      },
      _count: {
        select: {
          votes: true,
        },
      },
    },
  })

  return hotTakes.map((ht) => {
    const agreeVotes = ht.votes ? ht.votes.filter((v: { vote: string }) => v.vote === "agree").length : 0
    const disagreeVotes = ht.votes ? ht.votes.filter((v: { vote: string }) => v.vote === "disagree").length : 0
    const userVote = userId && ht.votes && ht.votes.length > 0 ? (ht.votes[0].vote as "agree" | "disagree") : null

    const agreeArgs = ht.arguments.filter((a: { side: string }) => a.side === "agree")
    const disagreeArgs = ht.arguments.filter((a: { side: string }) => a.side === "disagree")

    return {
      id: ht.id,
      albumId: ht.album.id,
      albumSpotifyId: ht.album.spotifyId,
      albumTitle: ht.album.title,
      albumArtist: ht.album.artistName,
      albumCoverUrl: ht.album.coverArtUrl,
      stance: ht.stance as HotTake["stance"],
      content: ht.content,
      authorUsername: ht.author.username || "anonymous",
      authorId: ht.author.id,
      createdAt: ht.createdAt.toISOString(),
      agreeCount: agreeVotes,
      disagreeCount: disagreeVotes,
      userVote,
      topAgreeArgument: agreeArgs[0]
        ? {
            id: agreeArgs[0].id,
            content: agreeArgs[0].content,
            authorUsername: agreeArgs[0].author.username || "anonymous",
            createdAt: agreeArgs[0].createdAt.toISOString(),
            likes: agreeArgs[0].likes,
          }
        : undefined,
      topDisagreeArgument: disagreeArgs[0]
        ? {
            id: disagreeArgs[0].id,
            content: disagreeArgs[0].content,
            authorUsername: disagreeArgs[0].author.username || "anonymous",
            createdAt: disagreeArgs[0].createdAt.toISOString(),
            likes: disagreeArgs[0].likes,
          }
        : undefined,
    }
  })
}

export default async function HotTakesPage() {
  const session = await auth()
  let hotTakes: HotTake[] = []
  let error = false

  try {
    hotTakes = await getHotTakes(session?.user?.id)
  } catch {
    // HotTake model doesn't exist yet - show empty state
    error = true
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20 py-6 lg:py-8">
      {/* Header */}
      <header className="mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
              Community Debates
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight">
              Hot Takes
            </h1>
          </div>

          {session && (
            <Link
              href="/hot-takes/new"
              className="bg-white text-black px-5 sm:px-6 py-3 min-h-[48px] flex items-center justify-center font-bold text-xs sm:text-sm tracking-wide hover:bg-gray-200 transition-colors no-underline w-full sm:w-auto"
            >
              POST A TAKE
            </Link>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[--muted] max-w-xl">
          Controversial opinions about albums. Vote, argue, and defend your taste.
        </p>
      </header>

      {/* Filter tabs */}
      <nav className="flex gap-4 sm:gap-6 border-b border-[--border] mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
        <button className="pb-3 min-h-[44px] text-xs sm:text-sm font-bold tracking-wide border-b-2 border-white -mb-[1px] whitespace-nowrap">
          TRENDING
        </button>
        <button className="pb-3 min-h-[44px] text-xs sm:text-sm text-[--muted] tracking-wide hover:text-white transition-colors whitespace-nowrap">
          RECENT
        </button>
        <button className="pb-3 min-h-[44px] text-xs sm:text-sm text-[--muted] tracking-wide hover:text-white transition-colors whitespace-nowrap">
          MOST HEATED
        </button>
      </nav>

      {/* Hot takes list */}
      {error ? (
        <div className="text-center py-16 border border-[--border]">
          <p className="text-[--muted] mb-4">Hot Takes feature coming soon</p>
          <p className="text-xs text-[--muted]/50">Database migration required</p>
        </div>
      ) : hotTakes.length === 0 ? (
        <div className="text-center py-16 border border-[--border]">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
            No hot takes yet
          </p>
          <p className="text-xl font-bold mb-6">Be the first to start a debate</p>
          {session ? (
            <Link
              href="/hot-takes/new"
              className="inline-block bg-white text-black px-6 py-3 font-bold text-sm tracking-wide hover:bg-gray-200 transition-colors no-underline"
            >
              POST YOUR HOT TAKE
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-block bg-white text-black px-6 py-3 font-bold text-sm tracking-wide hover:bg-gray-200 transition-colors no-underline"
            >
              SIGN IN TO POST
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {hotTakes.map((hotTake) => (
            <HotTakeCard
              key={hotTake.id}
              hotTake={hotTake}
            />
          ))}
        </div>
      )}

      {/* Not signed in prompt */}
      {!session && hotTakes.length > 0 && (
        <div className="mt-12 text-center py-8 border-t border-[--border]">
          <p className="text-[--muted] mb-4">Sign in to vote and post your own hot takes</p>
          <Link
            href="/login"
            className="inline-block bg-white text-black px-6 py-3 font-bold text-sm tracking-wide hover:bg-gray-200 transition-colors no-underline"
          >
            SIGN IN
          </Link>
        </div>
      )}
    </div>
  )
}
