"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useState, memo, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { DefaultAvatar } from "@/components/default-avatar"
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
  ShareIcon,
  VinylIcon,
  VinylFilledIcon,
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
  waxCount?: number
  premiumWaxCount?: number
  goldWaxCount?: number
  reviewPosition?: number | null // First Spin position
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
    totalReviews?: number
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

function getFirstSpinBadgeStyle(position: number): string {
  if (position <= 10) {
    return "border border-[--accent-primary] text-[--accent-primary]"
  }
  if (position <= 50) {
    return "border border-gray-400 text-gray-400"
  }
  return "border border-amber-700 text-amber-700"
}

function FirstSpinBadge({ position }: { position: number }) {
  return (
    <div
      className={`px-1.5 py-0.5 text-[10px] font-bold ${getFirstSpinBadgeStyle(position)}`}
      title={`Reviewer #${position}`}
    >
      #{position}
    </div>
  )
}

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
  waxCount: initialWaxCount = 0,
  premiumWaxCount: initialPremiumWaxCount = 0,
  goldWaxCount: initialGoldWaxCount = 0,
  reviewPosition,
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
  const [showWaxMenu, setShowWaxMenu] = useState(false)
  const [waxCounts, setWaxCounts] = useState({
    standard: initialWaxCount,
    premium: initialPremiumWaxCount,
    gold: initialGoldWaxCount,
  })
  const [hasAwardedWax, setHasAwardedWax] = useState(false)
  const [awardingWax, setAwardingWax] = useState<string | null>(null)
  const [waxError, setWaxError] = useState<string | null>(null)
  const [reactionCounts, setReactionCounts] = useState({
    fire: initialFireCount,
    insightful: initialInsightfulCount,
    funny: initialFunnyCount,
    controversial: initialControversialCount,
  })
  const [userReactions, setUserReactions] = useState<string[]>([])

  const totalWax = waxCounts.standard + waxCounts.premium + waxCounts.gold

  const handleAwardWax = useCallback(async (waxType: "standard" | "premium" | "gold") => {
    if (!session || hasAwardedWax) return
    setAwardingWax(waxType)
    setWaxError(null)

    try {
      const res = await fetch(`/api/reviews/${id}/wax`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waxType }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setWaxCounts(prev => ({ ...prev, [waxType]: prev[waxType] + 1 }))
        setHasAwardedWax(true)
        setShowWaxMenu(false)
        setWaxError(null)
      } else {
        setWaxError(data.error || "Failed to award")
      }
    } catch (error) {
      console.error("Failed to award wax:", error)
      setWaxError("Something went wrong")
    } finally {
      setAwardingWax(null)
    }
  }, [session, id, hasAwardedWax])

  const handleShare = useCallback(async () => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/review/${id}`
      : `/review/${id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.username}'s review on WAXFEED`,
          url: shareUrl,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Fallback to copy
          await navigator.clipboard.writeText(shareUrl)
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }, [id, user.username])

  const handleLike = useCallback(async () => {
    if (!session) return

    try {
      const res = await fetch(`/api/reviews/${id}/like`, {
        method: liked ? "DELETE" : "POST",
        credentials: 'include',
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
        credentials: 'include',
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
    <article className="border p-4 sm:p-4 transition-colors rounded-lg sm:rounded-none" style={{ borderColor: 'var(--border)' }}>
      <div className="flex gap-4">
        {/* Album Cover */}
        {showAlbum && (
          <Link href={`/album/${album.spotifyId}`} className="flex-shrink-0 active:scale-95 transition-transform">
            <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 bg-[--surface] rounded-md sm:rounded-none overflow-hidden shadow-md sm:shadow-none">
              {album.coverArtUrl ? (
                <img
                  src={album.coverArtUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[--muted-dim] text-xs">
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
            <div className="flex items-start gap-2 min-w-0">
              {/* User Avatar */}
              <Link href={`/u/${user.username || user.id}`} className="flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <DefaultAvatar size="sm" className="w-8 h-8" />
                )}
              </Link>
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
            </div>

            {/* Rating + First Spin Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {reviewPosition && reviewPosition <= 100 && (
                <FirstSpinBadge position={reviewPosition} />
              )}
              <div className="bg-white text-black px-2 sm:px-3 py-0.5 sm:py-1 font-bold text-base sm:text-lg">
                {rating.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Review Text */}
          {text && (
            <p className={`text-sm mb-2 sm:mb-3 leading-relaxed ${compact ? "line-clamp-2" : "line-clamp-4 sm:line-clamp-none"}`} style={{ color: 'var(--foreground)', opacity: 0.85 }}>
              {text}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-xs mt-3 sm:mt-0" style={{ color: 'var(--muted)' }}>
            {/* Wax Award Button */}
            <div className="relative">
              <button
                onClick={() => session ? setShowWaxMenu(!showWaxMenu) : null}
                disabled={hasAwardedWax}
                className={`flex items-center gap-1.5 transition-all group ${
                  hasAwardedWax
                    ? "text-[--accent-primary]"
                    : totalWax > 0
                      ? "hover:text-[--accent-primary]"
                      : "hover:text-[--accent-primary]"
                }`}
                title={hasAwardedWax ? "You tipped this review" : "Tip Wax"}
              >
                {hasAwardedWax ? (
                  <VinylFilledIcon size={16} className="text-[--accent-primary]" />
                ) : (
                  <VinylIcon size={16} className="group-hover:text-[--accent-primary] transition-colors" />
                )}
                {totalWax > 0 && (
                  <span className="font-bold tabular-nums text-[--accent-primary]">{totalWax}</span>
                )}
              </button>

              {showWaxMenu && !hasAwardedWax && session && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setShowWaxMenu(false); setWaxError(null); }} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 border border-[--border] rounded-lg overflow-hidden min-w-[200px] shadow-xl" style={{ backgroundColor: 'var(--surface)' }}>
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-[--border]" style={{ backgroundColor: 'var(--background)' }}>
                      <p className="text-xs font-semibold">Tip this review</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>Show appreciation with Wax</p>
                    </div>

                    {waxError && (
                      <div className="px-3 py-2 text-[11px] text-red-400 bg-red-500/10 border-b border-red-500/20">
                        {waxError}
                      </div>
                    )}

                    <div className="p-1.5">
                      {/* Standard - Always available */}
                      <button
                        onClick={() => handleAwardWax("standard")}
                        disabled={!!awardingWax}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-white/5 transition text-left disabled:opacity-50 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <VinylIcon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Standard</div>
                          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                            {awardingWax === "standard" ? "Sending..." : "Costs 5 Wax"}
                          </div>
                        </div>
                      </button>

                      {/* Premium - Subscription required */}
                      <button
                        onClick={() => handleAwardWax("premium")}
                        disabled={!!awardingWax}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-white/5 transition text-left disabled:opacity-50 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <VinylIcon size={16} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-purple-400">Premium</div>
                          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                            {awardingWax === "premium" ? "Sending..." : "Costs 20 Wax"}
                          </div>
                        </div>
                      </button>

                      {/* Gold - Subscription required */}
                      <button
                        onClick={() => handleAwardWax("gold")}
                        disabled={!!awardingWax}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-white/5 transition text-left disabled:opacity-50 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[--accent-primary]/20 flex items-center justify-center">
                          <VinylFilledIcon size={16} className="text-[--accent-primary]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[--accent-primary]">Gold</div>
                          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                            {awardingWax === "gold" ? "Sending..." : "Costs 100 Wax"}
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="px-3 py-2 border-t border-[--border]" style={{ backgroundColor: 'var(--background)' }}>
                      <a
                        href="/wallet"
                        className="flex items-center justify-between text-[11px] hover:text-[--foreground] transition-colors"
                        style={{ color: 'var(--muted)' }}
                      >
                        <span>Your balance</span>
                        <span className="font-medium text-[--foreground]">View Wallet →</span>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleLike}
              className={`hover:text-[--foreground] transition-colors flex items-center gap-1.5 ${liked ? "text-red-500" : ""}`}
            >
              {liked ? <HeartFilledIcon size={16} /> : <HeartIcon size={16} />}
              <span>{likeCount}</span>
            </button>

            {/* Reactions */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="hover:text-[--foreground] transition-colors flex items-center gap-1.5"
              >
                <ReactionsIcon size={16} />
                <span>{totalReactions}</span>
              </button>

              {showReactions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowReactions(false)} />
                  <div className="absolute bottom-full left-0 mb-1 bg-[--surface-raised] border border-[--border] p-2 flex gap-0.5 z-50 max-w-[calc(100vw-2rem)]">
                    {REACTIONS.map(({ type, Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[--border] transition-colors ${
                          userReactions.includes(type) ? "bg-[--border] text-[--foreground]" : ""
                        }`}
                        title={`${label} (${reactionCounts[type as keyof typeof reactionCounts]})`}
                      >
                        <Icon size={18} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Show Wax breakdown if any premium/gold - hide on very small screens */}
            {(waxCounts.premium > 0 || waxCounts.gold > 0) && !compact && (
              <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
                {waxCounts.gold > 0 && <span className="text-[--accent-primary]">G:{waxCounts.gold}</span>}
                {waxCounts.premium > 0 && <span className="text-purple-400">P:{waxCounts.premium}</span>}
              </div>
            )}

            <Link
              href={`/review/${id}`}
              className="hover:text-[--foreground] transition-colors no-underline flex items-center gap-1.5"
            >
              <MessageIcon size={16} />
              <span>{replyCount || 0}</span>
            </Link>

            <button
              onClick={handleShare}
              className="hover:text-[--foreground] transition-colors flex items-center gap-1.5"
              title="Share"
            >
              <ShareIcon size={16} />
            </button>

            <Link
              href={`/review/${id}`}
              className="hover:text-[--foreground] transition-colors no-underline ml-auto flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center sm:min-h-0 sm:min-w-0"
            >
              <span className="hidden sm:inline">View</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
})
