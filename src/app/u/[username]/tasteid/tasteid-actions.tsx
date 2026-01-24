"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function GenerateTasteIDButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tasteid/compute", { method: "POST" })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to generate TasteID:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      className="w-full sm:w-auto px-6 py-3 border-2 border-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleGenerate}
    >
      {loading ? "COMPUTING..." : "GENERATE MY TASTEID"}
    </button>
  )
}

export function RecomputeButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRecompute = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tasteid/compute", { method: "POST" })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to recompute TasteID:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      className="w-full sm:w-auto px-4 py-3 sm:py-2 border-2 border-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleRecompute}
    >
      {loading ? "COMPUTING..." : "RECOMPUTE"}
    </button>
  )
}
