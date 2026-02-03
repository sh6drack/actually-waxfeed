"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const STANCE_LABELS: Record<string, { label: string; color: string }> = {
  OVERRATED: { label: "OVERRATED", color: "#ff3b3b" },
  UNDERRATED: { label: "UNDERRATED", color: "#3bff6f" },
  MASTERPIECE: { label: "MASTERPIECE", color: "var(--accent-primary)" },
  TRASH: { label: "TRASH", color: "#ff3b3b" },
  AHEAD_OF_TIME: { label: "AHEAD OF ITS TIME", color: "#3b9fff" },
  DATED: { label: "DATED", color: "#888888" },
}

interface Argument {
  id: string
  content: string
  authorId: string
  authorUsername: string
  authorImage: string | null
  likes: number
  createdAt: string
}

interface HotTakeData {
  id: string
  albumId: string
  albumSpotifyId: string
  albumTitle: string
  albumArtist: string
  albumCoverUrl: string | null
  albumCoverUrlLarge: string | null
  stance: string
  content: string
  authorId: string
  authorUsername: string
  authorImage: string | null
  createdAt: string
  agreeCount: number
  disagreeCount: number
  userVote: "agree" | "disagree" | null
  agreeArguments: Argument[]
  disagreeArguments: Argument[]
}

export default function HotTakePage() {
  const params = useParams()
  const router = useRouter()
  const [hotTake, setHotTake] = useState<HotTakeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [localVote, setLocalVote] = useState<"agree" | "disagree" | null>(null)
  const [localAgree, setLocalAgree] = useState(0)
  const [localDisagree, setLocalDisagree] = useState(0)

  useEffect(() => {
    async function fetchHotTake() {
      try {
        const res = await fetch(`/api/hot-takes/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("Hot take not found")
          } else {
            setError("Failed to load hot take")
          }
          return
        }
        const data = await res.json()
        setHotTake(data.data)
        setLocalVote(data.data.userVote)
        setLocalAgree(data.data.agreeCount)
        setLocalDisagree(data.data.disagreeCount)
      } catch {
        setError("Failed to load hot take")
      } finally {
        setLoading(false)
      }
    }

    fetchHotTake()
  }, [params.id])

  const handleVote = async (vote: "agree" | "disagree") => {
    if (isVoting) return

    setIsVoting(true)
    const previousVote = localVote
    const previousAgree = localAgree
    const previousDisagree = localDisagree

    // Optimistic update
    if (localVote === vote) {
      setLocalVote(null)
      if (vote === "agree") setLocalAgree((v) => v - 1)
      else setLocalDisagree((v) => v - 1)
    } else {
      if (localVote) {
        if (localVote === "agree") setLocalAgree((v) => v - 1)
        else setLocalDisagree((v) => v - 1)
      }
      setLocalVote(vote)
      if (vote === "agree") setLocalAgree((v) => v + 1)
      else setLocalDisagree((v) => v + 1)
    }

    try {
      const res = await fetch(`/api/hot-takes/${params.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      })

      if (!res.ok) {
        throw new Error("Failed to vote")
      }
    } catch {
      // Revert on error
      setLocalVote(previousVote)
      setLocalAgree(previousAgree)
      setLocalDisagree(previousDisagree)
    } finally {
      setIsVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-[--surface] w-32 mb-4" />
          <div className="h-12 bg-[--surface] w-3/4 mb-8" />
          <div className="aspect-video bg-[--surface]" />
        </div>
      </div>
    )
  }

  if (error || !hotTake) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-[--muted] mb-8">{error || "Hot take not found"}</p>
        <Link
          href="/hot-takes"
          className="inline-block bg-[--foreground] text-[--background] px-6 py-3 font-bold text-sm tracking-wide hover:bg-[--foreground]/90 transition-colors"
        >
          BACK TO HOT TAKES
        </Link>
      </div>
    )
  }

  const stanceConfig = STANCE_LABELS[hotTake.stance] || {
    label: hotTake.stance,
    color: "#888",
  }
  const total = localAgree + localDisagree
  const agreeRatio = total > 0 ? localAgree / total : 0.5

  return (
    <div className="w-full max-w-5xl mx-auto px-4 lg:px-12 xl:px-20 py-6 lg:py-12">
      {/* Back link */}
      <Link
        href="/hot-takes"
        className="inline-block text-[10px] tracking-[0.2em] uppercase text-[--muted] hover:text-[--foreground] mb-8"
      >
        ← Back to Hot Takes
      </Link>

      {/* Main content */}
      <article className="border border-[--border] bg-[--background]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[--border]">
          <div className="flex items-center gap-4">
            <span
              className="text-[10px] tracking-[0.2em] font-bold px-3 py-1"
              style={{ color: stanceConfig.color, border: `1px solid ${stanceConfig.color}` }}
            >
              {stanceConfig.label}
            </span>
          </div>
          <span className="text-[10px] tracking-[0.1em] uppercase text-[--muted]/70">
            {new Date(hotTake.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Album and content */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Album art */}
          <div className="lg:col-span-5">
            <Link href={`/album/${hotTake.albumSpotifyId}`} className="block">
              <div className="relative aspect-square bg-[--surface] overflow-hidden group">
                {(hotTake.albumCoverUrlLarge || hotTake.albumCoverUrl) && (
                  <img
                    src={hotTake.albumCoverUrlLarge || hotTake.albumCoverUrl || ""}
                    alt={hotTake.albumTitle}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#888] mb-1">Album</p>
                  <h2 className="font-bold text-xl leading-tight">{hotTake.albumTitle}</h2>
                  <p className="text-sm text-[#888]">{hotTake.albumArtist}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Content */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col">
            {/* The hot take */}
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-3">
                The Take
              </p>
              <blockquote className="text-2xl lg:text-3xl font-bold leading-tight mb-4">
                {hotTake.content}
              </blockquote>
              <p className="text-sm text-[--muted]">
                by{" "}
                <Link href={`/u/${hotTake.authorUsername}`} className="text-[--foreground] hover:underline">
                  @{hotTake.authorUsername}
                </Link>
              </p>
            </div>

            {/* Temperature gauge */}
            {total > 0 && (
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-3">
                  Community Verdict
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-[--surface] relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-white transition-all duration-300"
                      style={{ width: `${agreeRatio * 100}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-[#ff3b3b] transition-all duration-300"
                      style={{ width: `${(1 - agreeRatio) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] tracking-[0.1em] uppercase text-[--muted]">
                  <span>{Math.round(agreeRatio * 100)}% agree</span>
                  <span>{Math.round((1 - agreeRatio) * 100)}% disagree</span>
                </div>
              </div>
            )}

            {/* Voting buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVote("agree")}
                disabled={isVoting}
                className={`py-5 font-bold text-sm tracking-wide transition-all border ${
                  localVote === "agree"
                    ? "bg-[--foreground] text-[--background] border-[--foreground]"
                    : "bg-transparent text-[--foreground] border-[--border] hover:border-[--foreground]"
                }`}
              >
                <span className="block text-3xl mb-1">{localAgree}</span>
                <span className="text-[10px] tracking-[0.15em] uppercase">
                  {localVote === "agree" ? "AGREED" : "AGREE"}
                </span>
              </button>
              <button
                onClick={() => handleVote("disagree")}
                disabled={isVoting}
                className={`py-5 font-bold text-sm tracking-wide transition-all border ${
                  localVote === "disagree"
                    ? "bg-[#d32f2f] text-white border-[#d32f2f]"
                    : "bg-transparent text-[--foreground] border-[--border] hover:border-[#d32f2f]"
                }`}
              >
                <span className="block text-3xl mb-1">{localDisagree}</span>
                <span className="text-[10px] tracking-[0.15em] uppercase">
                  {localVote === "disagree" ? "DISAGREED" : "DISAGREE"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Arguments section */}
        {(hotTake.agreeArguments.length > 0 || hotTake.disagreeArguments.length > 0) && (
          <div className="border-t border-[--border] p-6 lg:p-8">
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
              The Debate
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Agree side */}
              <div>
                <h4 className="text-sm font-bold tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-[--foreground]" />
                  AGREE ({hotTake.agreeArguments.length})
                </h4>
                <div className="space-y-4">
                  {hotTake.agreeArguments.map((arg) => (
                    <div key={arg.id} className="pl-4 border-l-2 border-[--foreground]">
                      <p className="text-sm text-[--foreground]/80">{arg.content}</p>
                      <p className="text-[10px] tracking-[0.1em] uppercase text-[--muted] mt-2">
                        @{arg.authorUsername} · {arg.likes} likes
                      </p>
                    </div>
                  ))}
                  {hotTake.agreeArguments.length === 0 && (
                    <p className="text-sm text-[--muted]/70">No arguments yet</p>
                  )}
                </div>
              </div>

              {/* Disagree side */}
              <div>
                <h4 className="text-sm font-bold tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#ff3b3b]" />
                  DISAGREE ({hotTake.disagreeArguments.length})
                </h4>
                <div className="space-y-4">
                  {hotTake.disagreeArguments.map((arg) => (
                    <div key={arg.id} className="pl-4 border-l-2 border-[#ff3b3b]">
                      <p className="text-sm text-[--foreground]/80">{arg.content}</p>
                      <p className="text-[10px] tracking-[0.1em] uppercase text-[--muted] mt-2">
                        @{arg.authorUsername} · {arg.likes} likes
                      </p>
                    </div>
                  ))}
                  {hotTake.disagreeArguments.length === 0 && (
                    <p className="text-sm text-[--muted]/70">No arguments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* More hot takes prompt */}
      <div className="mt-12 text-center">
        <Link
          href="/hot-takes"
          className="text-[10px] tracking-[0.2em] uppercase text-[--muted] hover:text-[--foreground] transition-colors"
        >
          View More Hot Takes →
        </Link>
      </div>
    </div>
  )
}
