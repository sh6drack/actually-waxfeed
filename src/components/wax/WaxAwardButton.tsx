"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type WaxType = "standard" | "premium" | "gold"

type Props = {
  reviewId: string
  currentWaxCount: number
  currentPremiumWaxCount: number
  currentGoldWaxCount: number
  hasAwarded: boolean
  onAwarded?: (waxType: WaxType) => void
}

const WAX_TYPE_CONFIG = {
  standard: {
    name: "Standard",
    icon: "🕯️",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500",
    description: "Show appreciation",
  },
  premium: {
    name: "Premium",
    icon: "💜",
    color: "text-purple-400",
    bgColor: "bg-purple-500",
    description: "Extra special",
  },
  gold: {
    name: "GOLD",
    icon: "✨",
    color: "text-amber-400",
    bgColor: "bg-amber-500",
    description: "Highest honor",
  },
}

export function WaxAwardButton({
  reviewId,
  currentWaxCount,
  currentPremiumWaxCount,
  currentGoldWaxCount,
  hasAwarded,
  onAwarded,
}: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [awarding, setAwarding] = useState<WaxType | null>(null)
  const [error, setError] = useState("")

  const handleAward = async (waxType: WaxType) => {
    if (!session) {
      router.push("/login")
      return
    }

    setAwarding(waxType)
    setError("")

    try {
      const res = await fetch(`/api/reviews/${reviewId}/wax`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waxType }),
      })

      const data = await res.json()

      if (data.success) {
        onAwarded?.(waxType)
        setShowDropdown(false)
      } else {
        setError(data.error || "Failed to award")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setAwarding(null)
    }
  }

  const totalWax = currentWaxCount + currentPremiumWaxCount + currentGoldWaxCount

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={hasAwarded}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
          hasAwarded
            ? "bg-yellow-500/20 text-yellow-500 cursor-default"
            : "hover:bg-[#222] text-[#888] hover:text-yellow-500"
        }`}
      >
        <span>🕯️</span>
        <span className="font-medium">{totalWax}</span>
        {hasAwarded && <span className="text-xs">✓</span>}
      </button>

      {showDropdown && !hasAwarded && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-56 bg-[#111] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#333]">
              <div className="text-sm font-medium">Award Wax</div>
              <div className="text-xs text-[#888]">Costs Wax from your wallet</div>
            </div>

            {error && (
              <div className="p-2 bg-red-900/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="p-2 space-y-1">
              {/* Standard */}
              <button
                onClick={() => handleAward("standard")}
                disabled={awarding === "standard"}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#222] transition text-left"
              >
                <span className="text-xl">{WAX_TYPE_CONFIG.standard.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{WAX_TYPE_CONFIG.standard.name}</div>
                  <div className="text-xs text-[#888]">5 Wax</div>
                </div>
                {awarding === "standard" && <span className="text-[#888]">...</span>}
              </button>

              {/* Premium */}
              <button
                onClick={() => handleAward("premium")}
                disabled={awarding === "premium"}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#222] transition text-left"
              >
                <span className="text-xl">{WAX_TYPE_CONFIG.premium.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium ${WAX_TYPE_CONFIG.premium.color}`}>
                    {WAX_TYPE_CONFIG.premium.name}
                  </div>
                  <div className="text-xs text-[#888]">20 Wax · Wax+ required</div>
                </div>
                {awarding === "premium" && <span className="text-[#888]">...</span>}
              </button>

              {/* Gold */}
              <button
                onClick={() => handleAward("gold")}
                disabled={awarding === "gold"}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#222] transition text-left"
              >
                <span className="text-xl">{WAX_TYPE_CONFIG.gold.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium ${WAX_TYPE_CONFIG.gold.color}`}>
                    {WAX_TYPE_CONFIG.gold.name}
                  </div>
                  <div className="text-xs text-[#888]">100 Wax · Pro required</div>
                </div>
                {awarding === "gold" && <span className="text-[#888]">...</span>}
              </button>
            </div>

            <div className="p-2 border-t border-[#333]">
              <button
                onClick={() => router.push("/wallet")}
                className="w-full text-center text-xs text-[#888] hover:text-white transition py-1"
              >
                View your Wax balance →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
