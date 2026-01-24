"use client"

import React, { useMemo } from "react"
import { MUSIC_NETWORKS, type MusicNetworkId } from "@/lib/tasteid"
import { NETWORK_COLORS, type NetworkKey } from "./types"

// Accept both uppercase (MusicNetworkId) and lowercase (NetworkKey) formats
type NetworkActivationsInput =
  | Partial<Record<NetworkKey, number>>
  | Partial<Record<MusicNetworkId, number>>

interface ListeningModeIndicatorProps {
  networkActivations: NetworkActivationsInput
  className?: string
}

// Mode-specific suggestions
const MODE_SUGGESTIONS: Record<NetworkKey, string> = {
  discovery: "Try something outside your usual genres",
  comfort: "Revisit an album you haven't played in a while",
  deep_dive: "Explore another album from an artist you love",
  reactive: "Check out this week's new releases",
  emotional: "Find something that matches your current mood",
  social: "See what your friends are listening to",
  aesthetic: "Discover albums with iconic cover art",
}

interface DominantMode {
  mode: NetworkKey
  value: number
  label: string
  suggestion: string
  icon: string
  color: string
}

/**
 * Normalize network activations to lowercase keys
 */
function normalizeActivations(input: NetworkActivationsInput): Partial<Record<NetworkKey, number>> {
  const result: Partial<Record<NetworkKey, number>> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      const normalizedKey = key.toLowerCase() as NetworkKey
      result[normalizedKey] = value
    }
  }

  return result
}

function getDominantMode(activations: Partial<Record<NetworkKey, number>>): DominantMode {
  let maxMode: NetworkKey = "comfort"
  let maxValue = 0

  for (const [key, value] of Object.entries(activations)) {
    if (value !== undefined && value > maxValue) {
      maxValue = value
      maxMode = key as NetworkKey
    }
  }

  const networkKey = maxMode.toUpperCase() as keyof typeof MUSIC_NETWORKS
  const network = MUSIC_NETWORKS[networkKey]

  return {
    mode: maxMode,
    value: maxValue,
    label: network?.name.replace(" Mode", "") || maxMode,
    suggestion: MODE_SUGGESTIONS[maxMode],
    icon: network?.icon || "\uD83C\uDFB5",
    color: NETWORK_COLORS[maxMode],
  }
}

export function ListeningModeIndicator({
  networkActivations,
  className = "",
}: ListeningModeIndicatorProps): React.ReactElement {
  const normalizedActivations = useMemo(
    () => normalizeActivations(networkActivations),
    [networkActivations]
  )
  const dominant = useMemo(() => getDominantMode(normalizedActivations), [normalizedActivations])

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

export function ListeningModeBadge({
  networkActivations,
  className = "",
}: ListeningModeIndicatorProps): React.ReactElement {
  const normalizedActivations = useMemo(
    () => normalizeActivations(networkActivations),
    [networkActivations]
  )
  const dominant = useMemo(() => getDominantMode(normalizedActivations), [normalizedActivations])

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
