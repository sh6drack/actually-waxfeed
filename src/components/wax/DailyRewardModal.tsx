"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { FlameIcon, SparkleIcon } from "@/components/icons"
import { CandleWaxIcon, ClockUrgentIcon } from "@/components/icons/ui-icons"

type Props = {
  isOpen: boolean
  onClose: () => void
  onClaimed?: (amount: number) => void
}

export function DailyRewardModal({ isOpen, onClose, onClaimed }: Props) {
  const { data: session } = useSession()
  const [claiming, setClaiming] = useState(false)
  const [result, setResult] = useState<{
    earned: number
    streak: number
    streakBonus: number
  } | null>(null)
  const [error, setError] = useState("")

  const handleClaim = async () => {
    setClaiming(true)
    setError("")

    try {
      const res = await fetch("/api/wax/claim-daily", {
        method: "POST",
      })

      const data = await res.json()

      if (data.success) {
        const streakBonus = data.data.stats?.currentStreak 
          ? Math.min(data.data.stats.currentStreak * 2, 20)
          : 0
        setResult({
          earned: data.data.earned,
          streak: data.data.stats?.currentStreak || 0,
          streakBonus,
        })
        onClaimed?.(data.data.earned)
      } else {
        setError(data.error || "Failed to claim")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setClaiming(false)
    }
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setResult(null)
      setError("")
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {result ? (
          // Success state
          <div className="text-center">
            <div className="mb-4 animate-bounce flex justify-center"><SparkleIcon size={48} /></div>
            <h2 className="text-2xl font-bold mb-2">Daily Wax Claimed!</h2>
            <div className="text-4xl font-bold text-yellow-500 mb-4">
              +{result.earned} <CandleWaxIcon size={16} className="inline-block" />
            </div>
            {result.streakBonus > 0 && (
              <div className="text-green-500 mb-4">
                Including +{result.streakBonus} streak bonus!
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-6">
              <FlameIcon size={24} />
              <span className="font-bold">{result.streak} day streak</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
            >
              Awesome!
            </button>
          </div>
        ) : (
          // Claim state
          <div className="text-center">
            <div className="mb-4 flex justify-center"><CandleWaxIcon size={48} /></div>
            <h2 className="text-2xl font-bold mb-2">Daily Wax Reward</h2>
            <p className="text-[#888] mb-6">
              Claim your daily Wax! Come back tomorrow to keep your streak going.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-[#1a1a1a] rounded-lg">
                <div className="mb-1 flex justify-center"><ClockUrgentIcon size={24} /></div>
                <div className="text-sm text-[#888]">Login</div>
                <div className="font-bold text-yellow-500">+5 Wax</div>
              </div>
              <div className="p-3 bg-[#1a1a1a] rounded-lg">
                <div className="mb-1 flex justify-center"><FlameIcon size={24} /></div>
                <div className="text-sm text-[#888]">Streak</div>
                <div className="font-bold text-orange-500">+2/day</div>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 px-4 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
            >
              {claiming ? "Claiming..." : "Claim Now"}
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-[#888] hover:text-white transition"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
