import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { findSimilarTasters, getArchetypeInfo } from "@/lib/tasteid"

export default async function TasteSetupMatchesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/taste-setup")
  }

  // Get user's TasteID
  const tasteId = await prisma.tasteID.findUnique({
    where: { userId: session.user.id },
  })

  if (!tasteId) {
    redirect("/taste-setup/rate")
  }

  // Find similar tasters
  const similarTasters = await findSimilarTasters(session.user.id, 6)

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="w-full px-4 lg:px-12 xl:px-20 space-y-8">
        {/* Progress */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-white" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            YOUR TASTE MATCHES
          </h1>
          <p className="text-neutral-400">
            People who share your musical DNA
          </p>
        </div>

        {/* Matches list */}
        {similarTasters.length > 0 ? (
          <div className="space-y-4">
            {similarTasters.map((taster) => {
              const archetypeInfo = getArchetypeInfo(taster.archetype)
              return (
                <Link
                  key={taster.userId}
                  href={`/u/${taster.username}`}
                  className="flex items-center gap-4 border-2 border-neutral-800 hover:border-white p-4 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 border border-neutral-700 flex-shrink-0 overflow-hidden">
                    {taster.image ? (
                      <img
                        src={taster.image}
                        alt={taster.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xl">
                        ?
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">@{taster.username}</div>
                    <div className="text-sm text-neutral-400 mb-2">
                      {archetypeInfo.icon} {archetypeInfo.name}
                    </div>
                    {taster.sharedGenres.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {taster.sharedGenres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-400 uppercase"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Compatibility */}
                  <div className="flex-shrink-0 text-center">
                    <div className="text-2xl font-bold">{taster.compatibility}%</div>
                    <div className="text-[10px] text-neutral-500 uppercase">Match</div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <p className="text-neutral-400">
              Not enough users with TasteIDs yet to find matches.
            </p>
            <p className="text-neutral-500 text-sm">
              Check back soon as more people join!
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-4 pt-4">
          <Link
            href="/"
            className="block w-full py-4 bg-white text-black font-bold uppercase tracking-wider text-lg text-center hover:bg-neutral-200 transition-colors"
          >
            START EXPLORING
          </Link>
          <div className="flex justify-center gap-4 text-sm">
            <Link
              href="/discover"
              className="text-neutral-500 hover:text-white transition-colors"
            >
              Discover albums →
            </Link>
            <Link
              href="/discover/similar-tasters"
              className="text-neutral-500 hover:text-white transition-colors"
            >
              Find more matches →
            </Link>
          </div>
        </div>

        {/* Celebration */}
        <div className="text-center pt-8 border-t border-neutral-800">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-neutral-400">
            You&apos;re all set! Your TasteID is live.
          </p>
        </div>
      </div>
    </div>
  )
}
