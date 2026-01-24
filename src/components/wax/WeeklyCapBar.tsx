"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type Props = {
  className?: string
}

export function WeeklyCapBar({ className = "" }: Props) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<{
    weeklyEarned: number
    weeklyCap: number | null
    weeklyRemaining: number | null
    daysUntilReset: number
    tier: string
  } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch cap stats:", error)
      }
    }
    fetchStats()
  }, [session])

  // Don't show for non-free users or if no cap
  if (!session || !stats || stats.weeklyCap === null) return null

  const progress = (stats.weeklyEarned / stats.weeklyCap) * 100
  const isNearCap = progress >= 80
  const isAtCap = progress >= 100

  return (
    <div className={`p-3 bg-[#111] border border-[#333] rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className={isAtCap ? "text-red-500" : isNearCap ? "text-yellow-500" : "text-[#888]"}>
            {isAtCap ? "⚠️" : isNearCap ? "⏰" : "📊"}
          </span>
          <span className="text-sm font-medium">
            {isAtCap ? "Weekly Cap Reached!" : isNearCap ? "Almost at Cap!" : "Weekly Progress"}
          </span>
        </div>
        <span className="text-xs text-[#888]">
          Resets in {stats.daysUntilReset}d
        </span>
      </div>

      <div className="h-2 bg-[#333] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${
            isAtCap ? "bg-red-500" : isNearCap ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-[#888]">
          {stats.weeklyEarned}/{stats.weeklyCap} Wax
        </span>
        {isAtCap ? (
          <Link href="/pricing" className="text-yellow-500 hover:underline">
            Upgrade to remove cap →
          </Link>
        ) : (
          <span className={isNearCap ? "text-yellow-500" : "text-green-500"}>
            {stats.weeklyRemaining} remaining
          </span>
        )}
      </div>
    </div>
  )
}
