"use client"

import { useMemo } from "react"
import type { ListeningSignature } from "@/lib/tasteid"
import {
  DiscoveryIcon,
  ComfortIcon,
  DeepDiveIcon,
  ReactiveIcon,
  EmotionalIcon,
  SocialIcon,
  AestheticIcon,
} from "@/components/icons/network-icons"

const COGNITIVE_STATES = {
  discovery: {
    name: "Explorer Mode",
    description: "Seeking new sounds and expanding your boundaries",
    Icon: DiscoveryIcon,
    color: "#60a5fa",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  comfort: {
    name: "Comfort Zone",
    description: "Returning to familiar favorites that ground you",
    Icon: ComfortIcon,
    color: "#a78bfa",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  deep_dive: {
    name: "Deep Focus",
    description: "Immersed in artist catalogs and discography exploration",
    Icon: DeepDiveIcon,
    color: "#34d399",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  reactive: {
    name: "Pulse Mode",
    description: "Tuned into current releases and cultural moments",
    Icon: ReactiveIcon,
    color: "#fbbf24",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  emotional: {
    name: "Heart Mode",
    description: "Processing through music, feeling deeply",
    Icon: EmotionalIcon,
    color: "#f87171",
    gradient: "from-red-500/20 to-red-600/5",
  },
  social: {
    name: "Social Mode",
    description: "Discovering through friends and community",
    Icon: SocialIcon,
    color: "#fb923c",
    gradient: "from-orange-500/20 to-orange-600/5",
  },
  aesthetic: {
    name: "Curator Mode",
    description: "Appreciating the visual and artistic presentation",
    Icon: AestheticIcon,
    color: "#818cf8",
    gradient: "from-indigo-500/20 to-indigo-600/5",
  },
} as const

interface CognitiveStateCardProps {
  signature: ListeningSignature
  variant?: "full" | "compact" | "inline"
  showSecondary?: boolean
  animated?: boolean
  className?: string
}

export function CognitiveStateCard({
  signature,
  variant = "full",
  showSecondary = true,
  animated = true,
  className = "",
}: CognitiveStateCardProps) {
  const { dominant, secondary, allStates } = useMemo(() => {
    const entries = Object.entries(signature)
      .map(([key, value]) => ({
        key: key as keyof typeof COGNITIVE_STATES,
        value: value || 0,
        ...COGNITIVE_STATES[key as keyof typeof COGNITIVE_STATES],
      }))
      .sort((a, b) => b.value - a.value)

    return {
      dominant: entries[0],
      secondary: entries[1],
      allStates: entries,
    }
  }, [signature])

  if (variant === "inline") {
    const DominantIcon = dominant.Icon
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{ backgroundColor: `${dominant.color}20` }}
        >
          <DominantIcon size={16} color={dominant.color} />
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: dominant.color }}>
            {dominant.name}
          </p>
          <p className="text-[10px] text-[--muted]">{Math.round(dominant.value * 100)}% active</p>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    const DominantIcon = dominant.Icon
    return (
      <div
        className={`p-4 border border-[--border] bg-gradient-to-br ${dominant.gradient} ${className}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ backgroundColor: `${dominant.color}15`, border: `1px solid ${dominant.color}30` }}
          >
            <DominantIcon size={20} color={dominant.color} />
          </div>
          <div>
            <p className="text-xs text-[--muted] uppercase tracking-wider">Current Mode</p>
            <p className="font-bold" style={{ color: dominant.color }}>{dominant.name}</p>
          </div>
        </div>
        <p className="text-xs text-[--muted] leading-relaxed">{dominant.description}</p>
      </div>
    )
  }

  // Full variant
  const DominantIcon = dominant.Icon
  const SecondaryIcon = secondary?.Icon

  return (
    <div className={`border border-[--border] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[--border] bg-[--surface]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2" style={{ backgroundColor: dominant.color }} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[--muted] font-bold">
            Cognitive State
          </span>
        </div>
      </div>

      {/* Dominant state */}
      <div className={`p-5 bg-gradient-to-br ${dominant.gradient}`}>
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 flex items-center justify-center flex-shrink-0 ${animated ? "animate-pulse" : ""}`}
            style={{
              backgroundColor: `${dominant.color}10`,
              border: `2px solid ${dominant.color}40`,
            }}
          >
            <DominantIcon size={28} color={dominant.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-lg font-bold" style={{ color: dominant.color }}>
                {dominant.name}
              </h3>
              <span className="text-xs font-mono text-[--muted]">
                {Math.round(dominant.value * 100)}%
              </span>
            </div>
            <p className="text-sm text-[--muted] leading-relaxed">{dominant.description}</p>
          </div>
        </div>

        {/* Activity bar */}
        <div className="mt-4">
          <div className="h-1.5 bg-[--border] overflow-hidden">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${dominant.value * 100}%`,
                backgroundColor: dominant.color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary state */}
      {showSecondary && secondary && (
        <div className="px-5 py-3 border-t border-[--border] flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${secondary.color}10` }}
          >
            <SecondaryIcon size={16} color={secondary.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium" style={{ color: secondary.color }}>
                {secondary.name}
              </span>
              <span className="text-[10px] font-mono text-[--muted]">
                {Math.round(secondary.value * 100)}%
              </span>
            </div>
            <div className="h-1 bg-[--border] mt-1 overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${secondary.value * 100}%`,
                  backgroundColor: secondary.color,
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* All states mini view */}
      <div className="px-5 py-3 border-t border-[--border]">
        <p className="text-[9px] uppercase tracking-wider text-[--muted] mb-2">Network Activity</p>
        <div className="flex gap-1">
          {allStates.map((state) => (
            <div
              key={state.key}
              className="flex-1 h-6 relative overflow-hidden"
              style={{ backgroundColor: `${state.color}10` }}
              title={`${state.name}: ${Math.round(state.value * 100)}%`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                style={{
                  height: `${state.value * 100}%`,
                  backgroundColor: state.color,
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {allStates.map((state) => (
            <span
              key={state.key}
              className="text-[7px] font-bold uppercase"
              style={{ color: state.color, opacity: state.value > 0.15 ? 1 : 0.5 }}
            >
              {state.key.charAt(0)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
