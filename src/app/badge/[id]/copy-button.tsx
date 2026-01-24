"use client"

import { useState } from "react"

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-3 bg-black text-white border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}
