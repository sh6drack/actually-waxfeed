"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FlameIcon } from "@/components/icons"

type WaxStats = {
  balance: number
  canClaimDaily: boolean
  currentStreak: number
  weeklyEarned: number
  weeklyCap: number | null
  tier: string
}

type Objective = {
  id: string
  label: string
  reward: number
  completed: boolean
  action?: string
  href?: string
}

export function DailyObjectives() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<WaxStats | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch wax stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [session])

  const handleClaimDaily = async () => {
    setClaiming(true)
    try {
      const res = await fetch("/api/wax/claim-daily", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error("Failed to claim:", error)
    } finally {
      setClaiming(false)
    }
  }

  if (!session) {
    return (
      <div className="border border-[--border] p-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
          Daily Objectives
        </p>
        <p className="text-sm text-[--muted] mb-4">
          Sign in to start earning Wax and track your progress.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-white text-black text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#e5e5e5] transition no-underline"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border border-[--border] p-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
          Loading...
        </p>
      </div>
    )
  }

  if (!stats) return null

  const streakBonus = Math.min(stats.currentStreak * 2, 20)

  const objectives: Objective[] = [
    {
      id: "daily",
      label: "Claim Daily Reward",
      reward: 5 + streakBonus,
      completed: !stats.canClaimDaily,
      action: stats.canClaimDaily ? "Claim" : "Done",
    },
    {
      id: "review",
      label: "Write a Review",
      reward: 10,
      completed: false, // Would need API to track this
      href: "/search",
    },
    {
      id: "first-album",
      label: "First Album Review",
      reward: 15,
      completed: false,
      href: "/discover",
    },
  ]

  const completedCount = objectives.filter(o => o.completed).length
  const totalPotential = objectives.reduce((sum, o) => sum + o.reward, 0)

  return (
    <div className="border border-[--border]">
      {/* Header */}
      <div className="p-4 border-b border-[--border] flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-1">
            Daily Objectives
          </p>
          <p className="text-sm text-[--muted]">
            {completedCount}/{objectives.length} complete
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Balance</p>
          <p className="text-xl font-bold tabular-nums">{stats.balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Streak */}
      {stats.currentStreak > 0 && (
        <div className="px-4 py-3 border-b border-[--border] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlameIcon size={18} />
            <span className="font-medium">{stats.currentStreak} Day Streak</span>
          </div>
          <span className="text-green-500 text-sm">+{streakBonus} bonus</span>
        </div>
      )}

      {/* Objectives */}
      <div>
        {objectives.map((obj, index) => (
          <div
            key={obj.id}
            className={`px-4 py-3 flex items-center justify-between ${
              index < objectives.length - 1 ? "border-b border-[--border]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 border flex items-center justify-center ${
                obj.completed ? "border-green-500 bg-green-500/20" : "border-[--border]"
              }`}>
                {obj.completed && (
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={obj.completed ? "text-[--muted] line-through" : ""}>
                {obj.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm tabular-nums ${obj.completed ? "text-[--muted]" : "text-green-500"}`}>
                +{obj.reward}
              </span>
              {obj.id === "daily" && stats.canClaimDaily ? (
                <button
                  onClick={handleClaimDaily}
                  disabled={claiming}
                  className="px-3 py-1 bg-white text-black text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-[#e5e5e5] transition disabled:opacity-50"
                >
                  {claiming ? "..." : "Claim"}
                </button>
              ) : obj.href && !obj.completed ? (
                <Link
                  href={obj.href}
                  className="px-3 py-1 border border-[--border] text-[10px] tracking-[0.1em] uppercase hover:border-white transition no-underline"
                >
                  Go
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[--border] flex items-center justify-between">
        <span className="text-sm text-[--muted]">
          Potential: +{totalPotential} Wax
        </span>
        <Link
          href="/wallet"
          className="text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition no-underline"
        >
          View All →
        </Link>
      </div>

      {/* Weekly Cap for Free Users */}
      {stats.weeklyCap !== null && (
        <div className="px-4 py-3 border-t border-[--border]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[--muted]">Weekly Cap</span>
            <span className="text-sm tabular-nums">{stats.weeklyEarned}/{stats.weeklyCap}</span>
          </div>
          <div className="h-1 bg-[--border]">
            <div 
              className={`h-full ${stats.weeklyEarned >= stats.weeklyCap ? "bg-[#ff3b3b]" : "bg-white"}`}
              style={{ width: `${Math.min((stats.weeklyEarned / stats.weeklyCap) * 100, 100)}%` }}
            />
          </div>
          {stats.weeklyEarned >= stats.weeklyCap * 0.8 && (
            <Link
              href="/pricing"
              className="text-xs text-[--muted] hover:text-white transition mt-2 inline-block no-underline"
            >
              Upgrade for unlimited →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
