"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type PromptType = "weekly_cap" | "premium_wax" | "gold_wax" | "earn_more" | "general"

type Props = {
  type?: PromptType
  className?: string
  compact?: boolean
}

const PROMPTS: Record<PromptType, {
  title: string
  description: string
  cta: string
  icon: string
}> = {
  weekly_cap: {
    title: "Hit your weekly cap?",
    description: "Upgrade to earn unlimited Wax every week!",
    cta: "Remove Limits",
    icon: "🚫",
  },
  premium_wax: {
    title: "Award Premium Wax",
    description: "Show extra appreciation with purple Premium Wax!",
    cta: "Get Wax+",
    icon: "💜",
  },
  gold_wax: {
    title: "Award GOLD Wax",
    description: "The highest honor! Make reviews really shine.",
    cta: "Go Pro",
    icon: "✨",
  },
  earn_more: {
    title: "Earn 2x Wax",
    description: "Pro subscribers earn double Wax on everything!",
    cta: "Upgrade Now",
    icon: "⚡",
  },
  general: {
    title: "Unlock More Features",
    description: "Get Premium Wax, unlimited earning, and exclusive perks!",
    cta: "View Plans",
    icon: "⭐",
  },
}

export function UpgradePrompt({ type = "general", className = "", compact = false }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [tier, setTier] = useState("FREE")
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchTier = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setTier(data.data.tier)
        }
      } catch (error) {
        console.error("Failed to fetch tier:", error)
      }
    }
    fetchTier()
  }, [session])

  // Don't show to premium/pro users
  if (tier !== "FREE" || dismissed) return null

  const prompt = PROMPTS[type]

  if (compact) {
    return (
      <div className={`p-2 bg-gradient-to-r from-yellow-900/20 to-purple-900/20 border border-yellow-600/30 rounded-lg flex items-center justify-between gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span>{prompt.icon}</span>
          <span className="text-sm">{prompt.title}</span>
        </div>
        <button
          onClick={() => router.push("/pricing")}
          className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full hover:bg-yellow-400 transition"
        >
          {prompt.cta}
        </button>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-yellow-900/20 to-purple-900/20 border border-yellow-600/30 rounded-xl relative ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-[#666] hover:text-white"
      >
        ✕
      </button>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{prompt.icon}</div>
        <div className="flex-1">
          <h4 className="font-bold mb-1">{prompt.title}</h4>
          <p className="text-sm text-[#888] mb-3">{prompt.description}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition"
          >
            {prompt.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
