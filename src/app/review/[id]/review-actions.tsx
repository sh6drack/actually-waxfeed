"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
    <div className="flex items-center gap-4 pt-4 border-t border-[#222]">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-2 transition-colors ${
          hasLiked ? "text-red-500" : "text-[#888] hover:text-white"
        } disabled:opacity-50`}
      >
        <span className="text-lg">{hasLiked ? "♥" : "♡"}</span>
        <span className="text-sm">{likeCount} likes</span>
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
        <span className="text-lg">💿</span>
        <span className="text-sm">{waxCount} wax</span>
      </button>

      {/* Share button */}
      <div className="relative ml-auto">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-[#888] hover:text-white transition-colors"
          title="Share this review"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="text-sm hidden sm:inline">Share</span>
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
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShareTwitter}
                className="w-full px-4 py-3 text-left text-sm hover:bg-[#222] transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share on X</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
