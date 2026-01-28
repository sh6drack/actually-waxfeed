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
    label: "S",
    color: "",
    borderColor: "border-[--border]",
    cost: "5 Wax",
    requirement: null,
  },
  premium: {
    name: "Premium",
    label: "P",
    color: "text-purple-400",
    borderColor: "border-purple-500/50",
    cost: "20 Wax",
    requirement: "Wax+",
  },
  gold: {
    name: "GOLD",
    label: "G",
    color: "text-[var(--accent-primary)]",
    borderColor: "border-[var(--accent-primary)]/50",
    cost: "100 Wax",
    requirement: "Pro",
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
        className={`flex items-center gap-2 px-2 py-1 transition ${
          hasAwarded
            ? "text-[--muted] cursor-default"
            : "hover:opacity-70"
        }`}
      >
        <span className="text-[10px] tracking-[0.1em] uppercase">Wax</span>
        <span className="font-bold tabular-nums">{totalWax}</span>
        {hasAwarded && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {showDropdown && !hasAwarded && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div 
            className="absolute left-0 bottom-full mb-2 w-48 border border-[--border] shadow-xl z-50"
            style={{ backgroundColor: 'var(--background)' }}
          >
            <div className="p-3 border-b border-[--border]">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">
                Award Wax
              </p>
            </div>

            {error && (
              <div className="px-3 py-2 text-xs text-[#ff3b3b] border-b border-[--border]">
                {error}
              </div>
            )}

            <div className="p-2">
              {(["standard", "premium", "gold"] as WaxType[]).map((type) => {
                const config = WAX_TYPE_CONFIG[type]
                return (
                  <button
                    key={type}
                    onClick={() => handleAward(type)}
                    disabled={awarding === type}
                    className="w-full flex items-center gap-3 p-2 hover:bg-[--border]/20 transition text-left disabled:opacity-50"
                  >
                    <div className={`w-6 h-6 border ${config.borderColor} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-[10px] font-bold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${config.color}`}>
                        {config.name}
                      </p>
                      <p className="text-[10px] text-[--muted]">
                        {config.cost}
                        {config.requirement && ` · ${config.requirement}`}
                      </p>
                    </div>
                    {awarding === type && (
                      <span className="text-[--muted] text-xs">...</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-2 border-t border-[--border]">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  router.push("/wallet")
                }}
                className="w-full text-center text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition py-1"
              >
                View Balance →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
