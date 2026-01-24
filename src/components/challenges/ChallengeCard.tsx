"use client"

import { useState } from "react"
import Link from "next/link"
import { DefaultAvatar } from "@/components/default-avatar"

interface Challenge {
  id: string
  challengeType: string
  status: string
  title?: string | null
  targetGenre?: string | null
  targetDecade?: string | null
  creatorProgress: { albumsRated?: string[]; score?: number } | Record<string, unknown> | null
  partnerProgress: { albumsRated?: string[]; score?: number } | Record<string, unknown> | null
  creator: { id: string; username: string; image: string | null }
  partner: { id: string; username: string; image: string | null }
  targetAlbum?: {
    id: string
    title?: string
    name?: string
    artistName?: string
    artist?: string
    coverArtUrl?: string | null
    imageUrl?: string | null
  } | null
  expiresAt: string
  createdAt: string
}

interface ChallengeCardProps {
  challenge: Challenge
  currentUserId: string
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
}

const CHALLENGE_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  discover_together: { label: "Discover Together", icon: "🔍", color: "text-blue-400" },
  rate_same_album: { label: "Rate Same Album", icon: "⚔️", color: "text-amber-400" },
  genre_swap: { label: "Genre Swap", icon: "🔄", color: "text-purple-400" },
  decade_dive: { label: "Decade Dive", icon: "📅", color: "text-emerald-400" },
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400" },
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400" },
  expired: { bg: "bg-red-500/10", text: "text-red-400" },
}

export function ChallengeCard({ challenge, currentUserId, onAccept, onDecline }: ChallengeCardProps) {
  const [loading, setLoading] = useState(false)
  const typeInfo = CHALLENGE_TYPES[challenge.challengeType] || CHALLENGE_TYPES.discover_together
  const statusStyle = STATUS_STYLES[challenge.status] || STATUS_STYLES.pending
  const isCreator = challenge.creator.id === currentUserId
  const opponent = isCreator ? challenge.partner : challenge.creator

  const handleAccept = async () => {
    if (!onAccept || loading) return
    setLoading(true)
    await onAccept(challenge.id)
    setLoading(false)
  }

  const handleDecline = async () => {
    if (!onDecline || loading) return
    setLoading(true)
    await onDecline(challenge.id)
    setLoading(false)
  }

  const creatorScore = (challenge.creatorProgress as { score?: number })?.score || 0
  const partnerScore = (challenge.partnerProgress as { score?: number })?.score || 0

  return (
    <div className="border border-[--border] overflow-hidden hover:border-white/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${typeInfo.color}`}>{typeInfo.icon}</span>
          <span className="text-xs font-medium">{typeInfo.label}</span>
        </div>
        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 ${statusStyle.bg} ${statusStyle.text}`}>
          {challenge.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title if custom */}
        {challenge.title && (
          <p className="font-bold text-lg mb-3">{challenge.title}</p>
        )}

        {/* Opponent */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/u/${opponent.username}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 border border-[--border] overflow-hidden group-hover:border-white/30 transition-colors">
              {opponent.image ? (
                <img src={opponent.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <DefaultAvatar size="sm" className="w-full h-full" />
              )}
            </div>
            <div>
              <p className="font-semibold group-hover:underline">@{opponent.username}</p>
              <p className="text-xs text-[--muted]">
                {isCreator ? "Challenged by you" : "Challenged you"}
              </p>
            </div>
          </Link>
        </div>

        {/* Target info */}
        {challenge.targetAlbum && (
          <div className="flex items-center gap-3 p-3 border border-[--border] mb-4">
            {(challenge.targetAlbum.coverArtUrl || challenge.targetAlbum.imageUrl) && (
              <img src={challenge.targetAlbum.coverArtUrl || challenge.targetAlbum.imageUrl || ""} alt="" className="w-12 h-12" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-[--muted] uppercase tracking-wider">Target Album</p>
              <p className="font-medium truncate">{challenge.targetAlbum.title || challenge.targetAlbum.name}</p>
              <p className="text-xs text-[--muted] truncate">{challenge.targetAlbum.artistName || challenge.targetAlbum.artist}</p>
            </div>
          </div>
        )}

        {challenge.targetGenre && (
          <div className="p-3 border border-[--border] mb-4">
            <p className="text-xs text-[--muted] uppercase tracking-wider mb-1">Target Genre</p>
            <p className="font-bold capitalize">{challenge.targetGenre}</p>
          </div>
        )}

        {challenge.targetDecade && (
          <div className="p-3 border border-[--border] mb-4">
            <p className="text-xs text-[--muted] uppercase tracking-wider mb-1">Target Decade</p>
            <p className="font-bold">{challenge.targetDecade}</p>
          </div>
        )}

        {/* Progress */}
        {challenge.status === "active" && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 border border-[--border]">
              <p className="text-2xl font-bold">{creatorScore}</p>
              <p className="text-xs text-[--muted]">{challenge.creator.username}</p>
            </div>
            <div className="text-center p-3 border border-[--border]">
              <p className="text-2xl font-bold">{partnerScore}</p>
              <p className="text-xs text-[--muted]">{challenge.partner.username}</p>
            </div>
          </div>
        )}

        {/* Completed result */}
        {challenge.status === "completed" && (
          <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 text-center mb-4">
            <p className="text-xs text-[--muted] uppercase tracking-wider mb-1">Winner</p>
            <p className="font-bold text-emerald-400">
              {creatorScore > partnerScore
                ? challenge.creator.username
                : partnerScore > creatorScore
                ? challenge.partner.username
                : "Tie!"}
            </p>
            <p className="text-sm mt-1">
              {creatorScore} - {partnerScore}
            </p>
          </div>
        )}

        {/* Expiration */}
        <p className="text-[10px] text-[--muted]">
          {challenge.status === "pending" || challenge.status === "active"
            ? `Expires ${new Date(challenge.expiresAt).toLocaleDateString()}`
            : `Created ${new Date(challenge.createdAt).toLocaleDateString()}`}
        </p>
      </div>

      {/* Actions for pending challenges */}
      {challenge.status === "pending" && !isCreator && (
        <div className="flex border-t border-[--border]">
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 py-3 text-xs font-medium text-[--muted] hover:bg-[--surface] transition-colors disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 py-3 text-xs font-bold bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Accept"}
          </button>
        </div>
      )}

      {/* View details link */}
      {(challenge.status === "active" || challenge.status === "completed") && (
        <Link
          href={`/discover/challenges/${challenge.id}`}
          className="block text-center py-3 border-t border-[--border] text-xs font-medium hover:bg-[--surface] transition-colors"
        >
          View Details →
        </Link>
      )}
    </div>
  )
}
