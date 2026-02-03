"use client"

import { useState, useEffect } from "react"

interface BadgeShareButtonsProps {
  badgeId: string
  albumTitle: string
  label: string
}

export function BadgeShareButtons({ badgeId, albumTitle, label }: BadgeShareButtonsProps) {
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Set URL only on client to prevent hydration mismatch
    setShareUrl(window.location.href)
  }, [])

  const handleCopy = async () => {
    if (navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const tweetText = encodeURIComponent(`I earned a ${label} badge for ${albumTitle}!`)
  const tweetUrl = shareUrl ? encodeURIComponent(shareUrl) : ""

  return (
    <div className="flex justify-center gap-3">
      <button
        onClick={handleCopy}
        className="px-5 py-2.5 border border-[--border] text-sm hover:border-[#ffd700] hover:text-[#ffd700] transition-colors"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={shareUrl ? `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}` : "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 bg-black text-white text-sm hover:bg-neutral-800 transition-colors"
        onClick={(e) => {
          if (!shareUrl) e.preventDefault()
        }}
      >
        Share on X
      </a>
    </div>
  )
}
