"use client"

import { useState } from "react"
import Link from "next/link"

export interface HotTakeArgument {
  id: string
  content: string
  authorUsername: string
  createdAt: string
  likes: number
}

export interface HotTake {
  id: string
  albumId: string
  albumSpotifyId: string
  albumTitle: string
  albumArtist: string
  albumCoverUrl: string | null
  stance: "OVERRATED" | "UNDERRATED" | "MASTERPIECE" | "TRASH" | "AHEAD_OF_TIME" | "DATED"
  content: string
  authorUsername: string
  authorId: string
  createdAt: string
  agreeCount: number
  disagreeCount: number
  userVote?: "agree" | "disagree" | null
  topAgreeArgument?: HotTakeArgument
  topDisagreeArgument?: HotTakeArgument
}

interface HotTakeCardProps {
  hotTake: HotTake
  onVote?: (hotTakeId: string, vote: "agree" | "disagree") => Promise<void>
  compact?: boolean
}

const STANCE_LABELS: Record<HotTake["stance"], { label: string; color: string }> = {
  OVERRATED: { label: "OVERRATED", color: "#ff3b3b" },
  UNDERRATED: { label: "UNDERRATED", color: "#3bff6f" },
  MASTERPIECE: { label: "MASTERPIECE", color: "var(--accent-primary)" },
  TRASH: { label: "TRASH", color: "#ff3b3b" },
  AHEAD_OF_TIME: { label: "AHEAD OF ITS TIME", color: "#3b9fff" },
  DATED: { label: "DATED", color: "#888888" },
}

function TemperatureGauge({ agreeCount, disagreeCount }: { agreeCount: number; disagreeCount: number }) {
  const total = agreeCount + disagreeCount
  if (total === 0) return null

  const heat = Math.min(100, total * 2) // More votes = hotter
  const ratio = agreeCount / total

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-[--border] relative overflow-hidden">
        {/* Agree side (left) */}
        <div
          className="absolute left-0 top-0 h-full bg-white transition-all duration-300"
          style={{ width: `${ratio * 100}%` }}
        />
        {/* Disagree side (right) */}
        <div
          className="absolute right-0 top-0 h-full bg-[#ff3b3b] transition-all duration-300"
          style={{ width: `${(1 - ratio) * 100}%` }}
        />
      </div>
      <span
        className="text-[10px] tracking-[0.15em] uppercase font-bold"
        style={{ color: heat > 50 ? "#ff3b3b" : "var(--muted)" }}
      >
        {heat > 80 ? "HEATED" : heat > 50 ? "WARM" : "COLD"}
      </span>
    </div>
  )
}

export function HotTakeCard({ hotTake, onVote, compact = false }: HotTakeCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [localVote, setLocalVote] = useState(hotTake.userVote)
  const [localAgree, setLocalAgree] = useState(hotTake.agreeCount)
  const [localDisagree, setLocalDisagree] = useState(hotTake.disagreeCount)

  const stanceConfig = STANCE_LABELS[hotTake.stance]

  const handleVote = async (vote: "agree" | "disagree") => {
    if (isVoting) return

    setIsVoting(true)
    const previousVote = localVote
    const previousAgree = localAgree
    const previousDisagree = localDisagree

    // Optimistic update
    if (localVote === vote) {
      // Removing vote
      setLocalVote(null)
      if (vote === "agree") setLocalAgree(v => v - 1)
      else setLocalDisagree(v => v - 1)
    } else {
      // Adding or changing vote
      if (localVote) {
        // Changing vote
        if (localVote === "agree") setLocalAgree(v => v - 1)
        else setLocalDisagree(v => v - 1)
      }
      setLocalVote(vote)
      if (vote === "agree") setLocalAgree(v => v + 1)
      else setLocalDisagree(v => v + 1)
    }

    try {
      // Call onVote callback if provided, otherwise call API directly
      if (onVote) {
        await onVote(hotTake.id, vote)
      } else {
        const res = await fetch(`/api/hot-takes/${hotTake.id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        })
        if (!res.ok) {
          throw new Error("Failed to vote")
        }
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

  if (compact) {
    return (
      <Link
        href={`/hot-takes/${hotTake.id}`}
        className="block group border-b border-[--border] py-6 hover:bg-[--surface-raised] transition-colors -mx-4 px-4"
      >
        <div className="flex gap-4">
          {/* Mini album art */}
          <div className="w-16 h-16 flex-shrink-0 bg-[--surface] overflow-hidden">
            {hotTake.albumCoverUrl && (
              <img
                src={hotTake.albumCoverUrl}
                alt={hotTake.albumTitle}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Stance badge */}
            <span
              className="text-[9px] tracking-[0.2em] font-bold"
              style={{ color: stanceConfig.color }}
            >
              {stanceConfig.label}
            </span>

            {/* Album info */}
            <p className="text-sm font-bold truncate mt-1 group-hover:text-[--muted] transition-colors">
              {hotTake.albumTitle}
            </p>
            <p className="text-xs text-[--muted] truncate">{hotTake.albumArtist}</p>

            {/* Vote counts */}
            <div className="flex gap-4 mt-2 text-[10px] tracking-[0.1em] uppercase text-[--muted]">
              <span>{localAgree} agree</span>
              <span>{localDisagree} disagree</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <article className="border border-[--border] bg-[--background]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[--border]">
        <div className="flex items-center gap-4">
          <span
            className="text-[10px] tracking-[0.2em] font-bold px-2 py-1"
            style={{ color: stanceConfig.color, border: `1px solid ${stanceConfig.color}` }}
          >
            {stanceConfig.label}
          </span>
          <span className="text-[10px] tracking-[0.15em] uppercase text-[--muted]">
            Hot Take #{hotTake.id.slice(0, 4).toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] tracking-[0.1em] uppercase text-[--muted]/50">
          {new Date(hotTake.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Album art - large editorial style */}
        <div className="lg:col-span-4 aspect-square lg:aspect-auto">
          <Link href={`/album/${hotTake.albumSpotifyId}`} className="block h-full">
            <div className="relative h-full min-h-[280px] lg:min-h-full bg-[--surface] overflow-hidden group">
              {hotTake.albumCoverUrl && (
                <img
                  src={hotTake.albumCoverUrl}
                  alt={hotTake.albumTitle}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              )}
              {/* Album info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-1">Album</p>
                <h3 className="font-bold text-lg leading-tight">{hotTake.albumTitle}</h3>
                <p className="text-sm text-[--muted]">{hotTake.albumArtist}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Debate content */}
        <div className="lg:col-span-8 p-6 flex flex-col">
          {/* The hot take itself */}
          <div className="mb-6">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-2">
              The Take
            </p>
            <blockquote className="text-xl lg:text-2xl font-bold leading-tight">
              {hotTake.content}
            </blockquote>
            <p className="text-sm text-[--muted] mt-3">
              by{" "}
              <Link href={`/u/${hotTake.authorUsername}`} className="text-[--foreground] hover:underline">
                @{hotTake.authorUsername}
              </Link>
            </p>
          </div>

          {/* Temperature gauge */}
          <div className="mb-6">
            <TemperatureGauge agreeCount={localAgree} disagreeCount={localDisagree} />
          </div>

          {/* Voting buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleVote("agree")}
              disabled={isVoting}
              className={`py-4 font-bold text-sm tracking-wide transition-all border ${
                localVote === "agree"
                  ? "bg-[--foreground] text-[--background] border-[--foreground]"
                  : "bg-transparent text-[--foreground] border-[--border] hover:border-[--foreground]"
              }`}
            >
              <span className="block text-2xl mb-1">{localAgree}</span>
              <span className="text-[10px] tracking-[0.15em] uppercase">
                {localVote === "agree" ? "AGREED" : "AGREE"}
              </span>
            </button>
            <button
              onClick={() => handleVote("disagree")}
              disabled={isVoting}
              className={`py-4 font-bold text-sm tracking-wide transition-all border ${
                localVote === "disagree"
                  ? "bg-[#d32f2f] text-white border-[#d32f2f]"
                  : "bg-transparent text-[--foreground] border-[--border] hover:border-[#d32f2f]"
              }`}
            >
              <span className="block text-2xl mb-1">{localDisagree}</span>
              <span className="text-[10px] tracking-[0.15em] uppercase">
                {localVote === "disagree" ? "DISAGREED" : "DISAGREE"}
              </span>
            </button>
          </div>

          {/* Top arguments */}
          {(hotTake.topAgreeArgument || hotTake.topDisagreeArgument) && (
            <div className="mt-auto pt-6 border-t border-[--border]">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-4">
                Top Arguments
              </p>
              <div className="space-y-4">
                {hotTake.topAgreeArgument && (
                  <div className="pl-4 border-l-2 border-[--foreground]">
                    <p className="text-sm text-[--foreground]/80">{hotTake.topAgreeArgument.content}</p>
                    <p className="text-[10px] tracking-[0.1em] uppercase text-[--muted] mt-2">
                      @{hotTake.topAgreeArgument.authorUsername} · {hotTake.topAgreeArgument.likes} likes
                    </p>
                  </div>
                )}
                {hotTake.topDisagreeArgument && (
                  <div className="pl-4 border-l-2 border-[#ff3b3b]">
                    <p className="text-sm text-[--foreground]/80">{hotTake.topDisagreeArgument.content}</p>
                    <p className="text-[10px] tracking-[0.1em] uppercase text-[--muted] mt-2">
                      @{hotTake.topDisagreeArgument.authorUsername} · {hotTake.topDisagreeArgument.likes} likes
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View full debate link */}
          <Link
            href={`/hot-takes/${hotTake.id}`}
            className="mt-6 text-[10px] tracking-[0.2em] uppercase text-[--muted] hover:text-[--foreground] transition-colors"
          >
            View Full Debate →
          </Link>
        </div>
      </div>
    </article>
  )
}
