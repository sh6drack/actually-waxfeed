"use client"

import { useMemo } from "react"
import { MUSIC_NETWORKS, MusicNetworkKey } from "./MusicNetworks"

interface ListeningModeIndicatorProps {
  networkActivations: Partial<Record<MusicNetworkKey, number>>
  className?: string
}

// Determine dominant listening mode from network activations
function getDominantMode(activations: Partial<Record<MusicNetworkKey, number>>): {
  mode: MusicNetworkKey
  value: number
  label: string
  suggestion: string
  icon: string
  color: string
} {
  let maxMode: MusicNetworkKey = "COMFORT"
  let maxValue = 0

  Object.entries(activations).forEach(([key, value]) => {
    if (value !== undefined && value > maxValue) {
      maxValue = value
      maxMode = key as MusicNetworkKey
    }
  })

  const network = MUSIC_NETWORKS[maxMode]

  // Mode-specific suggestions based on the architecture doc
  const suggestions: Record<MusicNetworkKey, string> = {
    DISCOVERY: "Try something outside your usual genres",
    COMFORT: "Revisit an album you haven't played in a while",
    DEEP_DIVE: "Explore another album from an artist you love",
    REACTIVE: "Check out this week's new releases",
    EMOTIONAL: "Find something that matches your current mood",
    SOCIAL: "See what your friends are listening to",
    AESTHETIC: "Discover albums with iconic cover art",
  }

  return {
    mode: maxMode,
    value: maxValue,
    label: network.name,
    suggestion: suggestions[maxMode],
    icon: network.icon,
    color: network.color,
  }
}

export function ListeningModeIndicator({
  networkActivations,
  className = "",
}: ListeningModeIndicatorProps) {
  const dominant = useMemo(() => getDominantMode(networkActivations), [networkActivations])

  return (
    <div className={`border border-border p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          Current Listening Mode
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{dominant.icon}</span>
        <div>
          <p className="text-lg font-bold" style={{ color: dominant.color }}>
            {dominant.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(dominant.value * 100)}% activation
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground/70 mb-1">Suggestion</p>
        <p className="text-sm text-foreground">{dominant.suggestion}</p>
      </div>
    </div>
  )
}

// Compact badge version
export function ListeningModeBadge({
  networkActivations,
  className = "",
}: ListeningModeIndicatorProps) {
  const dominant = useMemo(() => getDominantMode(networkActivations), [networkActivations])

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs border ${className}`}
      style={{ borderColor: dominant.color, color: dominant.color }}
    >
      <span>{dominant.icon}</span>
      <span className="font-medium">{dominant.label}</span>
    </span>
  )
}
