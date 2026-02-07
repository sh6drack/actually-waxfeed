"use client"

import React, { useMemo } from "react"
import { MUSIC_NETWORKS, type MusicNetworkId } from "@/lib/tasteid"
import { NETWORK_COLORS, type NetworkKey } from "./types"

// Re-export for backward compatibility
export { MUSIC_NETWORKS } from "@/lib/tasteid"
export type { MusicNetworkId as MusicNetworkKey } from "@/lib/tasteid"

// Accept both uppercase (MusicNetworkId) and lowercase (NetworkKey) formats
type NetworkActivationsInput =
  | Partial<Record<NetworkKey, number>>
  | Partial<Record<MusicNetworkId, number>>

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

// Extended network info for visualization (adds colors and visual properties)
const NETWORK_DISPLAY_INFO: Record<NetworkKey, {
  name: string
  abbrev: string
  color: string
  typicalRange: string
  signals: string[]
}> = {
  discovery: {
    name: "Discovery",
    abbrev: "FP",
    color: NETWORK_COLORS.discovery,
    typicalRange: "15-30%",
    signals: ["First-time artist reviews", "Genre diversity", "Low artist repeat rate"],
  },
  comfort: {
    name: "Comfort",
    abbrev: "DMN",
    color: NETWORK_COLORS.comfort,
    typicalRange: "18-32%",
    signals: ["Re-listens to favorites", "Artist loyalty", "Genre consistency"],
  },
  deep_dive: {
    name: "Deep Dive",
    abbrev: "DA",
    color: NETWORK_COLORS.deep_dive,
    typicalRange: "8-20%",
    signals: ["Multiple albums from same artist", "Chronological exploration", "Discography patterns"],
  },
  reactive: {
    name: "Reactive",
    abbrev: "VA",
    color: NETWORK_COLORS.reactive,
    typicalRange: "10-22%",
    signals: ["New release reviews", "Trending album activity", "Current chart engagement"],
  },
  emotional: {
    name: "Emotional",
    abbrev: "LIM",
    color: NETWORK_COLORS.emotional,
    typicalRange: "8-20%",
    signals: ["Rating variance", "Strong written reactions", "Polarized scores"],
  },
  social: {
    name: "Social",
    abbrev: "SMN",
    color: NETWORK_COLORS.social,
    typicalRange: "3-12%",
    signals: ["List collaborations", "Comment activity", "Friend interactions"],
  },
  aesthetic: {
    name: "Aesthetic",
    abbrev: "VIS",
    color: NETWORK_COLORS.aesthetic,
    typicalRange: "2-10%",
    signals: ["Album art attention", "Visual curation", "Presentation focus"],
  },
}

import { NETWORK_ICONS as NETWORK_SVG_ICONS } from "@/components/icons/network-icons"

interface MusicNetworksVisualizationProps {
  networkActivations: NetworkActivationsInput
  size?: number
  className?: string
  showLabels?: boolean
  interactive?: boolean
}

export function MusicNetworksVisualization({
  networkActivations,
  size = 280,
  className = "",
  showLabels = true,
  interactive = true,
}: MusicNetworksVisualizationProps): React.ReactElement {
  const normalizedActivations = useMemo(
    () => normalizeActivations(networkActivations),
    [networkActivations]
  )

  const networks = useMemo(() => {
    const keys = Object.keys(NETWORK_DISPLAY_INFO) as NetworkKey[]
    return keys.map(key => ({
      key,
      ...NETWORK_DISPLAY_INFO[key],
      IconComponent: NETWORK_SVG_ICONS[key],
      value: normalizedActivations[key] ?? 0,
    }))
  }, [normalizedActivations])

  const numPoints = networks.length
  const center = size / 2
  const maxRadius = (size / 2) * 0.65

  const angleStep = (2 * Math.PI) / numPoints
  const networkPoints = networks.map((network, i) => {
    const angle = angleStep * i - Math.PI / 2
    const radius = network.value * maxRadius

    return {
      ...network,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      labelX: center + (maxRadius + 28) * Math.cos(angle),
      labelY: center + (maxRadius + 28) * Math.sin(angle),
      axisX: center + maxRadius * Math.cos(angle),
      axisY: center + maxRadius * Math.sin(angle),
      angle,
    }
  })

  const polygonPath = networkPoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
  ).join(" ") + " Z"

  const rings = [0.25, 0.5, 0.75, 1].map((scale) => {
    const ringPoints = Array.from({ length: numPoints }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2
      const radius = scale * maxRadius
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`
    })
    return ringPoints.join(" ")
  })

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="font-mono">
        <defs>
          <linearGradient id="signatureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={NETWORK_COLORS.discovery} stopOpacity="0.3" />
            <stop offset="50%" stopColor={NETWORK_COLORS.comfort} stopOpacity="0.2" />
            <stop offset="100%" stopColor={NETWORK_COLORS.deep_dive} stopOpacity="0.3" />
          </linearGradient>
          <filter id="signatureGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {rings.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            strokeOpacity={i === 3 ? 0.6 : 0.3}
            strokeDasharray={i < 3 ? "3,3" : "none"}
          />
        ))}

        {networkPoints.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.axisX}
            y2={p.axisY}
            stroke="var(--border)"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        ))}

        <path
          d={polygonPath}
          fill="url(#signatureGradient)"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeOpacity="0.5"
          filter="url(#signatureGlow)"
        />

        {networkPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="8" fill={p.color} fillOpacity="0.3" />
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill={p.color}
              stroke="var(--background)"
              strokeWidth="2"
              className={interactive ? "transition-all duration-300 cursor-pointer hover:r-6" : ""}
            />
          </g>
        ))}

        {showLabels && networkPoints.map((p, i) => {
          let textAnchor: "start" | "middle" | "end" = "middle"
          if (p.labelX < center - 15) textAnchor = "end"
          if (p.labelX > center + 15) textAnchor = "start"

          return (
            <g key={i}>
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[9px] uppercase tracking-wider"
                fill={p.color}
                fontWeight="bold"
              >
                {p.name}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 12}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[8px]"
                fill="var(--muted-foreground)"
              >
                {Math.round(p.value * 100)}%
              </text>
            </g>
          )
        })}

        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[8px] uppercase tracking-widest"
          fill="var(--muted-foreground)"
        >
          LISTENING
        </text>
        <text
          x={center}
          y={center + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] uppercase tracking-wider font-bold"
          fill="var(--foreground)"
        >
          SIGNATURE
        </text>
      </svg>
    </div>
  )
}

export function MusicNetworksMini({
  networkActivations,
  size = 80,
  className = "",
}: {
  networkActivations: NetworkActivationsInput
  size?: number
  className?: string
}): React.ReactElement {
  return (
    <MusicNetworksVisualization
      networkActivations={networkActivations}
      size={size}
      showLabels={false}
      interactive={false}
      className={className}
    />
  )
}

export function MusicNetworksLegend({
  showYeoMapping = false,
}: {
  showYeoMapping?: boolean
}): React.ReactElement {
  const networks = Object.entries(NETWORK_DISPLAY_INFO) as [NetworkKey, typeof NETWORK_DISPLAY_INFO[NetworkKey]][]

  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
        7 Music Networks
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {networks.map(([key, network]) => {
          const libNetwork = MUSIC_NETWORKS[key.toUpperCase() as keyof typeof MUSIC_NETWORKS]
          return (
            <div key={key} className="flex items-start gap-2">
              <div
                className="w-3 h-3 flex-shrink-0 mt-0.5"
                style={{ backgroundColor: network.color }}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate flex items-center gap-1">
                  {(() => {
                    const NetIcon = NETWORK_SVG_ICONS[key]
                    return NetIcon ? <NetIcon size={12} color={network.color} /> : null
                  })()}
                  {network.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{network.typicalRange}</p>
                {showYeoMapping && libNetwork && (
                  <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                    {network.abbrev} {"\u2192"} {libNetwork.yeoAnalog}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MusicNetworksSkeleton({ size = 280 }: { size?: number }): React.ReactElement {
  return (
    <div
      className="bg-muted/20 animate-pulse"
      style={{ width: size, height: size, borderRadius: "50%" }}
    />
  )
}
