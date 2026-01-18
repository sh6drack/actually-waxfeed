"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useState, memo, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  HeartIcon,
  HeartFilledIcon,
  FlameIcon,
  LightbulbIcon,
  SmileIcon,
  BoltIcon,
  MessageIcon,
  ArrowRightIcon,
  VerifiedIcon,
  ReactionsIcon,
} from "@/components/icons"

interface ReviewCardProps {
  id: string
  rating: number
  text?: string | null
  createdAt: string | Date
  isEdited?: boolean
  likeCount: number
  replyCount?: number
  fireCount?: number
  insightfulCount?: number
  funnyCount?: number
  controversialCount?: number
  user: {
    id: string
    username?: string | null
    image?: string | null
    isVerified?: boolean
  }
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl?: string | null
  }
  showAlbum?: boolean
  compact?: boolean
}

const REACTIONS = [
  { type: "fire", Icon: FlameIcon, label: "Fire" },
  { type: "insightful", Icon: LightbulbIcon, label: "Insightful" },
  { type: "funny", Icon: SmileIcon, label: "Funny" },
  { type: "controversial", Icon: BoltIcon, label: "Hot Take" },
] as const

export const ReviewCard = memo(function ReviewCard({
  id,
  rating,
  text,
  createdAt,
  isEdited,
  likeCount: initialLikeCount,
  replyCount,
  fireCount: initialFireCount = 0,
  insightfulCount: initialInsightfulCount = 0,
  funnyCount: initialFunnyCount = 0,
  controversialCount: initialControversialCount = 0,
  user,
  album,
  showAlbum = true,
  compact = false
}: ReviewCardProps) {
  const { data: session } = useSession()
  const date = new Date(createdAt)

  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [liked, setLiked] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [reactionCounts, setReactionCounts] = useState({
    fire: initialFireCount,
    insightful: initialInsightfulCount,
    funny: initialFunnyCount,
    controversial: initialControversialCount,
  })
  const [userReactions, setUserReactions] = useState<string[]>([])

  const handleLike = useCallback(async () => {
    if (!session) return

    try {
      const res = await fetch(`/api/reviews/${id}/like`, {
        method: liked ? "DELETE" : "POST",
      })
      if (res.ok) {
        setLiked(!liked)
        setLikeCount(prev => liked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }, [session, id, liked])

  const handleReaction = useCallback(async (type: string) => {
    if (!session) return

    const hasReaction = userReactions.includes(type)

    try {
      const res = await fetch(`/api/reviews/${id}/reactions`, {
        method: hasReaction ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (res.ok) {
        if (hasReaction) {
          setUserReactions(prev => prev.filter(r => r !== type))
          setReactionCounts(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }))
        } else {
          setUserReactions(prev => [...prev, type])
          setReactionCounts(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] + 1 }))
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error)
    }
  }, [session, id, userReactions])

  const totalReactions = useMemo(() =>
    Object.values(reactionCounts).reduce((a, b) => a + b, 0),
    [reactionCounts]
  )

  return (
    <article className="border p-3 sm:p-4 transition-colors" style={{ borderColor: 'var(--border)' }}>
      <div className="flex gap-3 sm:gap-4">
        {/* Album Cover */}
        {showAlbum && (
          <Link href={`/album/${album.spotifyId}`} className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#181818]">
              {album.coverArtUrl ? (
                <img
                  src={album.coverArtUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#666] text-xs">
                  No Cover
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Link
                  href={`/u/${user.username || user.id}`}
                  className="font-bold hover:underline no-underline text-sm sm:text-base"
                >
                  {user.username || "Anonymous"}
                </Link>
                {user.isVerified && (
                  <VerifiedIcon size={14} className="text-blue-400" />
                )}
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {formatDistanceToNow(date, { addSuffix: true })}
                  {isEdited && " (edited)"}
                </span>
              </div>
              {showAlbum && (
                <Link
                  href={`/album/${album.spotifyId}`}
                  className="text-xs sm:text-sm hover:underline no-underline line-clamp-1"
                  style={{ color: 'var(--muted)' }}
                >
                  {album.title} — {album.artistName}
                </Link>
              )}
            </div>

            {/* Rating */}
            <div className="flex-shrink-0 bg-white text-black px-2 sm:px-3 py-0.5 sm:py-1 font-bold text-base sm:text-lg">
              {rating.toFixed(1)}
            </div>
          </div>

          {/* Review Text */}
          {text && (
            <p className={`text-sm mb-2 sm:mb-3 leading-relaxed ${compact ? "line-clamp-2" : "line-clamp-4 sm:line-clamp-none"}`} style={{ color: 'var(--foreground)', opacity: 0.85 }}>
              {text}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap" style={{ color: 'var(--muted)' }}>
            <button
              onClick={handleLike}
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${liked ? "text-red-500" : ""}`}
            >
              {liked ? <HeartFilledIcon size={16} /> : <HeartIcon size={16} />}
              <span>{likeCount}</span>
            </button>

            {/* Reactions */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ReactionsIcon size={16} />
                <span>{totalReactions}</span>
              </button>

              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 bg-[#1a1a1a] border border-[#333] p-1.5 flex gap-1 z-10 rounded">
                  {REACTIONS.map(({ type, Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`p-2 hover:bg-[#333] rounded transition-colors ${
                        userReactions.includes(type) ? "bg-[#333] text-white" : ""
                      }`}
                      title={`${label} (${reactionCounts[type as keyof typeof reactionCounts]})`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Show top reactions if any */}
            {totalReactions > 0 && !compact && (
              <div className="flex items-center gap-1">
                {REACTIONS.filter(r => reactionCounts[r.type as keyof typeof reactionCounts] > 0)
                  .slice(0, 3)
                  .map(({ type, Icon }) => (
                    <Icon key={type} size={14} className="opacity-60" title={`${reactionCounts[type as keyof typeof reactionCounts]}`} />
                  ))}
              </div>
            )}

            <Link
              href={`/review/${id}`}
              className="hover:text-white transition-colors no-underline flex items-center gap-1.5"
            >
              <MessageIcon size={16} />
              <span>{replyCount || 0}</span>
            </Link>
            <Link
              href={`/review/${id}`}
              className="hover:text-white transition-colors no-underline ml-auto flex items-center gap-1"
            >
              <span>View</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
})
