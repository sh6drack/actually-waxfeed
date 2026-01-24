"use client"

import { useMemo } from "react"

// TasteID 7 Music Networks - adapted from Yeo 7-Network cognitive model
// Maps listening behavior to 7 distinct modes of musical engagement
export const MUSIC_NETWORKS = {
  DISCOVERY: {
    name: "Discovery",
    abbrev: "FP",
    yeoNetwork: "Frontoparietal",
    color: "#60a5fa", // blue
    icon: "🔍",
    description: "New artist exploration, genre breadth",
    typicalRange: "15-30%",
    signals: ["First-time artist reviews", "Genre diversity", "Low artist repeat rate"]
  },
  COMFORT: {
    name: "Comfort",
    abbrev: "DMN",
    yeoNetwork: "Default Mode",
    color: "#a78bfa", // violet
    icon: "🏠",
    description: "Returning to known favorites",
    typicalRange: "18-32%",
    signals: ["Re-listens to favorites", "Artist loyalty", "Genre consistency"]
  },
  DEEP_DIVE: {
    name: "Deep Dive",
    abbrev: "DA",
    yeoNetwork: "Dorsal Attention",
    color: "#34d399", // emerald
    icon: "💿",
    description: "Artist catalog exploration depth",
    typicalRange: "8-20%",
    signals: ["Multiple albums from same artist", "Chronological exploration", "Discography patterns"]
  },
  REACTIVE: {
    name: "Reactive",
    abbrev: "VA",
    yeoNetwork: "Ventral Attention",
    color: "#fbbf24", // amber
    icon: "⚡",
    description: "Response to new releases, trends",
    typicalRange: "10-22%",
    signals: ["New release reviews", "Trending album activity", "Current chart engagement"]
  },
  EMOTIONAL: {
    name: "Emotional",
    abbrev: "LIM",
    yeoNetwork: "Limbic",
    color: "#f87171", // red
    icon: "💜",
    description: "Rating variance, strong reactions",
    typicalRange: "8-20%",
    signals: ["Rating variance", "Strong written reactions", "Polarized scores"]
  },
  SOCIAL: {
    name: "Social",
    abbrev: "SMN",
    yeoNetwork: "Somatomotor",
    color: "#fb923c", // orange
    icon: "🤝",
    description: "Community engagement, sharing",
    typicalRange: "3-12%",
    signals: ["List collaborations", "Comment activity", "Friend interactions"]
  },
  AESTHETIC: {
    name: "Aesthetic",
    abbrev: "VIS",
    yeoNetwork: "Visual",
    color: "#818cf8", // indigo
    icon: "🎨",
    description: "Visual/presentation attention",
    typicalRange: "2-10%",
    signals: ["Album art attention", "Visual curation", "Presentation focus"]
  },
} as const

export type MusicNetworkKey = keyof typeof MUSIC_NETWORKS

interface MusicNetworksVisualizationProps {
  networkActivations: Partial<Record<MusicNetworkKey, number>> // 0-1 values
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
}: MusicNetworksVisualizationProps) {
  // Map to array with all network data
  const networks = useMemo(() => {
    const keys = Object.keys(MUSIC_NETWORKS) as MusicNetworkKey[]
    return keys.map(key => ({
      key,
      ...MUSIC_NETWORKS[key],
      value: networkActivations[key] ?? 0,
    }))
  }, [networkActivations])

  const numPoints = networks.length
  const center = size / 2
  const maxRadius = (size / 2) * 0.65 // Leave room for labels

  // Calculate points for each network
  const angleStep = (2 * Math.PI) / numPoints
  const networkPoints = networks.map((network, i) => {
    const angle = angleStep * i - Math.PI / 2 // Start from top
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

  // Create filled polygon path for the activation shape
  const polygonPath = networkPoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
  ).join(" ") + " Z"

  // Concentric rings for scale
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
          {/* Gradient for the listening signature shape */}
          <linearGradient id="signatureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
          </linearGradient>

          {/* Glow effect */}
          <filter id="signatureGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background rings */}
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

        {/* Axis lines */}
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

        {/* Main activation polygon with gradient */}
        <path
          d={polygonPath}
          fill="url(#signatureGradient)"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeOpacity="0.5"
          filter="url(#signatureGlow)"
        />

        {/* Individual network dots with their specific colors */}
        {networkPoints.map((p, i) => (
          <g key={i}>
            {/* Outer glow */}
            <circle
              cx={p.x}
              cy={p.y}
              r="8"
              fill={p.color}
              fillOpacity="0.3"
            />
            {/* Main dot */}
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

        {/* Labels */}
        {showLabels && networkPoints.map((p, i) => {
          // Determine text anchor based on position
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
              {/* Show percentage */}
              <text
                x={p.labelX}
                y={p.labelY + 12}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[8px]"
                fill="var(--muted)"
              >
                {Math.round(p.value * 100)}%
              </text>
            </g>
          )
        })}

        {/* Center label */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[8px] uppercase tracking-widest"
          fill="var(--muted)"
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

// Compact version for inline display
export function MusicNetworksMini({
  networkActivations,
  size = 80,
  className = "",
}: {
  networkActivations: Partial<Record<MusicNetworkKey, number>>
  size?: number
  className?: string
}) {
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

// Network legend component
export function MusicNetworksLegend({
  showYeoMapping = false
}: {
  showYeoMapping?: boolean
}) {
  const networks = Object.entries(MUSIC_NETWORKS) as [MusicNetworkKey, typeof MUSIC_NETWORKS[MusicNetworkKey]][]

  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
        7 Music Networks
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {networks.map(([key, network]) => (
          <div key={key} className="flex items-start gap-2">
            <div
              className="w-3 h-3 flex-shrink-0 mt-0.5"
              style={{ backgroundColor: network.color }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {network.icon} {network.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{network.typicalRange}</p>
              {showYeoMapping && (
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                  {network.abbrev} → {network.yeoNetwork}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading skeleton
export function MusicNetworksSkeleton({ size = 280 }: { size?: number }) {
  return (
    <div
      className="bg-muted/20 animate-pulse"
      style={{ width: size, height: size, borderRadius: '50%' }}
    />
  )
}
