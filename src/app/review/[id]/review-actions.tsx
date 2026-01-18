"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  HeartIcon,
  HeartFilledIcon,
  VinylIcon,
  VinylFilledIcon,
  ShareIcon,
  CopyIcon,
  CheckIcon,
  XIcon,
} from "@/components/icons"

interface ReviewActionsProps {
  reviewId: string
  likeCount: number
  waxCount: number
  hasLiked: boolean
  hasGivenWax: boolean
  isOwner: boolean
  isLoggedIn: boolean
}

export function ReviewActions({
  reviewId,
  likeCount: initialLikeCount,
  waxCount: initialWaxCount,
  hasLiked: initialHasLiked,
  hasGivenWax: initialHasGivenWax,
  isOwner,
  isLoggedIn,
}: ReviewActionsProps) {
  const router = useRouter()
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [waxCount, setWaxCount] = useState(initialWaxCount)
  const [hasLiked, setHasLiked] = useState(initialHasLiked)
  const [hasGivenWax, setHasGivenWax] = useState(initialHasGivenWax)
  const [isLoading, setIsLoading] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleLike = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: hasLiked ? "DELETE" : "POST",
      })
      if (res.ok) {
        setHasLiked(!hasLiked)
        setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1))
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWax = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    if (isOwner || hasGivenWax) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/wax`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waxType: "standard" }),
      })
      if (res.ok) {
        setHasGivenWax(true)
        setWaxCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Failed to give wax:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/review/${reviewId}`
    : `/review/${reviewId}`

  const handleShare = async () => {
    // Check if native share is available (mobile/iMessage friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this review on WAXFEED',
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed, show menu instead
        if ((err as Error).name !== 'AbortError') {
          setShowShareMenu(true)
        }
      }
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowShareMenu(false)
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowShareMenu(false)
      }, 2000)
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent('Check out this review on WAXFEED')
    const url = encodeURIComponent(shareUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    setShowShareMenu(false)
  }

  return (
    <div className="flex items-center gap-5 pt-4 border-t border-[#222]">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-2 transition-colors ${
          hasLiked ? "text-red-500" : "text-[#888] hover:text-white"
        } disabled:opacity-50`}
      >
        {hasLiked ? <HeartFilledIcon size={20} /> : <HeartIcon size={20} />}
        <span className="text-sm">{likeCount}</span>
      </button>

      <button
        onClick={handleWax}
        disabled={isLoading || isOwner || hasGivenWax}
        className={`flex items-center gap-2 transition-colors ${
          hasGivenWax
            ? "text-yellow-500"
            : isOwner
            ? "text-[#444] cursor-not-allowed"
            : "text-[#888] hover:text-yellow-500"
        } disabled:opacity-50`}
        title={isOwner ? "Can't wax your own review" : hasGivenWax ? "Already waxed" : "Give wax"}
      >
        {hasGivenWax ? <VinylFilledIcon size={20} /> : <VinylIcon size={20} />}
        <span className="text-sm">{waxCount}</span>
      </button>

      {/* Share button - more prominent */}
      <div className="relative ml-auto">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] text-white transition-colors rounded"
          title="Share this review"
        >
          <ShareIcon size={18} />
          <span className="text-sm">Share</span>
        </button>

        {/* Share dropdown menu */}
        {showShareMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowShareMenu(false)}
            />
            <div className="absolute right-0 bottom-full mb-2 bg-[#111] border border-[#333] rounded-lg shadow-xl z-20 min-w-[180px] overflow-hidden">
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-3 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-3"
              >
                {copied ? (
                  <>
                    <CheckIcon size={16} className="text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={16} />
                    <span>Copy link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShareTwitter}
                className="w-full px-4 py-3 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-3"
              >
                <XIcon size={16} />
                <span>Share on X</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
