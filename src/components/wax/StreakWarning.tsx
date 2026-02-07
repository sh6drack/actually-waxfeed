"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FlameIcon } from "@/components/icons"

export function StreakWarning() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<{
    currentStreak: number
    canClaimDaily: boolean
    lastReviewDate: string | null
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isLateInDay, setIsLateInDay] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if it's late in the day (after 6pm local time)
    setIsLateInDay(new Date().getHours() >= 18)
    
    const fetchStats = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }
    fetchStats()
  }, [session])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) return null
  if (!session || !stats || dismissed) return null

  // Only show warning if user has a streak and hasn't reviewed today
  const hasStreak = stats.currentStreak > 0
  const needsActivity = stats.canClaimDaily // If can claim daily, they haven't been active today

  if (!hasStreak || !needsActivity || !isLateInDay) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-orange-900/90 border border-orange-600/50 rounded-xl shadow-xl z-50 animate-pulse">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-orange-300 hover:text-white"
      >
        ✕
      </button>
      <div className="flex items-start gap-3">
        <FlameIcon size={32} />
        <div>
          <h4 className="font-bold text-orange-100">
            Don&apos;t lose your {stats.currentStreak}-day streak!
          </h4>
          <p className="text-sm text-orange-200/80 mb-3">
            Review an album before midnight to keep it going.
          </p>
          <div className="flex gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 bg-orange-500 text-black text-sm font-bold rounded-lg hover:bg-orange-400 transition"
            >
              Find Albums
            </Link>
            <Link
              href="/wallet"
              className="px-3 py-1.5 bg-orange-800 text-orange-100 text-sm rounded-lg hover:bg-orange-700 transition"
            >
              Claim Daily
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
