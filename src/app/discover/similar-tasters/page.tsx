import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { findSimilarTasters, getArchetypeInfo } from "@/lib/tasteid"
import { DefaultAvatar } from "@/components/default-avatar"

export default async function SimilarTastersPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/discover/similar-tasters")
  }

  // Get user's TasteID
  const tasteId = await prisma.tasteID.findUnique({
    where: { userId: session.user.id },
  })

  if (!tasteId) {
    redirect("/taste-setup")
  }

  // Find similar tasters (get more for this dedicated page)
  const similarTasters = await findSimilarTasters(session.user.id, 20)

  const userArchetype = getArchetypeInfo(tasteId.primaryArchetype)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-[--border]">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Similar Tasters</h1>
            <p className="text-sm text-[--muted]">
              People who share your musical DNA as a {userArchetype.name}
            </p>
          </div>
          <Link
            href="/discover"
            className="px-4 py-2 border-2 border-[--border] text-[11px] tracking-[0.15em] uppercase font-medium hover:border-white hover:bg-white hover:text-black transition-colors"
          >
            Back to Discover
          </Link>
        </div>

        {/* Your TasteID Summary */}
        <div className="mb-12 p-6 border border-[--border]">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{userArchetype.icon}</div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-1">Your Archetype</div>
              <div className="text-xl font-bold">{userArchetype.name}</div>
            </div>
          </div>
          <p className="text-sm text-[--muted]">{userArchetype.description}</p>
        </div>

        {/* Matches list */}
        {similarTasters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold">
                Your Matches
              </h2>
              <div className="h-px flex-1 bg-[--border]" />
              <span className="text-[11px] tracking-[0.2em] text-[--muted] tabular-nums">
                {similarTasters.length}
              </span>
            </div>

            <div className="grid gap-4">
              {similarTasters.map((taster) => {
                const archetypeInfo = getArchetypeInfo(taster.archetype)
                return (
                  <Link
                    key={taster.userId}
                    href={`/u/${taster.username}`}
                    className="flex items-center gap-4 border border-[--border] hover:border-white p-5 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="w-16 h-16 border border-[--border] flex-shrink-0 overflow-hidden group-hover:border-white transition-colors">
                      {taster.image ? (
                        <img
                          src={taster.image}
                          alt={taster.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAvatar size="md" className="w-full h-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg mb-1">@{taster.username}</div>
                      <div className="text-sm text-[--muted] mb-2 flex items-center gap-2">
                        <span>{archetypeInfo.icon}</span>
                        <span className="uppercase text-[10px] tracking-wider">{archetypeInfo.name}</span>
                      </div>
                      {taster.sharedGenres.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {taster.sharedGenres.slice(0, 4).map((genre) => (
                            <span
                              key={genre}
                              className="text-[10px] px-2 py-0.5 border border-[--border] text-[--muted] uppercase tracking-wider"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Compatibility Score */}
                    <div className="flex-shrink-0 text-center px-4">
                      <div className="text-3xl font-bold">{taster.compatibility}%</div>
                      <div className="text-[10px] text-[--muted] uppercase tracking-wider">Match</div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-[--muted] group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[--border] p-12 text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold mb-2">No matches yet</h3>
            <p className="text-[--muted] mb-6 max-w-md mx-auto">
              Not enough users with TasteIDs to find matches. Check back soon as more people discover their musical identity!
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-[#e5e5e5] transition-colors"
            >
              Discover Albums
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Tips section */}
        <div className="mt-12 pt-8 border-t border-[--border]">
          <h3 className="text-[11px] tracking-[0.2em] uppercase text-[--muted] mb-4">Improve Your Matches</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border border-[--border]">
              <div className="text-lg mb-2">📝</div>
              <p className="text-sm text-[--muted]">
                Rate more albums to refine your TasteID and find better matches.
              </p>
            </div>
            <div className="p-4 border border-[--border]">
              <div className="text-lg mb-2">🔄</div>
              <p className="text-sm text-[--muted]">
                Your TasteID updates automatically as you review more music.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
