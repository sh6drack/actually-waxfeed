"use client"

import { useState } from "react"
import { BrainNetworkIcon, LockIcon } from "@/components/icons/network-icons"

interface TasteIDPaywallProps {
  feature: "updates" | "history" | "comparisons" | "insights"
  currentPlan?: "free" | "pro"
  onUpgrade?: () => void
  className?: string
}

const FEATURE_INFO = {
  updates: {
    title: "TasteID Updates",
    description: "Your taste profile evolves. Track monthly changes to your listening signature.",
    benefits: [
      "Monthly TasteID recalculation",
      "Signature drift analysis",
      "Network evolution tracking",
      "Personalized insights",
    ],
  },
  history: {
    title: "Signature History",
    description: "See how your taste has transformed over time with historical snapshots.",
    benefits: [
      "12-month signature archive",
      "Visual evolution timeline",
      "Milestone markers",
      "Export your journey",
    ],
  },
  comparisons: {
    title: "Deep Comparisons",
    description: "Unlock advanced comparison features with friends and public profiles.",
    benefits: [
      "Unlimited comparisons",
      "Network overlay views",
      "Compatibility reports",
      "Shared listening sessions",
    ],
  },
  insights: {
    title: "AI Insights",
    description: "Get personalized recommendations based on your listening patterns.",
    benefits: [
      "Mood-aware recommendations",
      "Network-based discovery",
      "Listening forecasts",
      "Taste expansion paths",
    ],
  },
}

export function TasteIDPaywall({
  feature,
  currentPlan = "free",
  onUpgrade,
  className = "",
}: TasteIDPaywallProps) {
  const [isHovered, setIsHovered] = useState(false)
  const info = FEATURE_INFO[feature]

  if (currentPlan === "pro") {
    return null
  }

  return (
    <div
      className={`relative overflow-hidden border border-[--border] ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30">
              <BrainNetworkIcon size={24} color="rgb(139, 92, 246)" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{info.title}</h3>
                <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 uppercase tracking-wider font-bold">
                  Pro
                </span>
              </div>
              <p className="text-xs text-[--muted]">Monthly subscription</p>
            </div>
          </div>
          <LockIcon size={20} color="var(--muted)" />
        </div>

        {/* Description */}
        <p className="text-sm text-[--muted] mb-4 leading-relaxed">{info.description}</p>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          {info.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-violet-400" />
              <span className="text-xs">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold">$4.99</span>
          <span className="text-sm text-[--muted] pb-1">/month</span>
        </div>

        {/* CTA */}
        <button
          onClick={onUpgrade}
          className={`w-full py-3 px-4 font-bold text-sm uppercase tracking-wider transition-all ${
            isHovered
              ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          Upgrade to Pro
        </button>

        {/* Fine print */}
        <p className="text-[10px] text-[--muted] text-center mt-3">
          Cancel anytime. Your data is always yours.
        </p>
      </div>

      {/* Animated border glow on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
            animation: "shimmer 2s infinite",
          }}
        />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Inline paywall teaser for locked features
 */
export function TasteIDFeatureLock({
  feature,
  onUpgrade,
  className = "",
}: {
  feature: string
  onUpgrade?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 border border-dashed border-[--border] bg-[--surface] ${className}`}
    >
      <LockIcon size={16} color="var(--muted)" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[--muted]">
          <span className="font-semibold text-violet-400">Pro feature:</span> {feature}
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="text-[10px] px-2 py-1 bg-violet-500/20 text-violet-400 font-bold uppercase tracking-wider hover:bg-violet-500/30 transition-colors"
      >
        Unlock
      </button>
    </div>
  )
}
