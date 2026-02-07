"use client"

import { useState, useEffect } from "react"

interface TasteCardShareProps {
  username: string
  archetype: string
}

export function TasteCardShare({ username, archetype }: TasteCardShareProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const tasteCardUrl = `/api/taste-card?username=${username}`
  // Only use window.location after mount to prevent hydration mismatch
  const profileUrl = isMounted 
    ? `${window.location.origin}/u/${username}/tasteid`
    : `https://waxfeed.com/u/${username}/tasteid` // Fallback for SSR

  const tweetText = encodeURIComponent(
    `I'm a ${archetype} on WaxFeed. Check out my music taste fingerprint!\n\n${profileUrl}`
  )

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(tasteCardUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tasteid-${username}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download:", error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
        SHARE YOUR TASTE
      </h3>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Twitter/X Share */}
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          SHARE ON X
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-neutral-700 text-sm font-bold uppercase tracking-wider hover:border-white transition-colors min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? "COPIED!" : "COPY LINK"}
        </button>

        {/* Download Image */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-neutral-700 text-sm font-bold uppercase tracking-wider hover:border-white transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {downloading ? "DOWNLOADING..." : "DOWNLOAD IMAGE"}
        </button>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">
          Preview:
        </p>
        <div className="border border-neutral-800 aspect-[1200/630] max-w-md overflow-hidden">
          <img
            src={tasteCardUrl}
            alt="Taste Card Preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}
