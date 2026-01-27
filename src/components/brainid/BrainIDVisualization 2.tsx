"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import type { ListeningSignature } from "@/lib/tasteid"

/**
 * BrainID Visualization - Yeo 7-Network Model
 *
 * Maps listening signature to cognitive networks:
 * - DMN (Default Mode Network) → Comfort listening
 * - FP (Frontoparietal) → Discovery mode
 * - DA (Dorsal Attention) → Deep Dive focus
 * - VA (Ventral Attention) → Reactive/trending
 * - LIM (Limbic) → Emotional engagement
 * - SMN (Somatomotor) → Social listening
 * - VIS (Visual) → Aesthetic appreciation
 */

const YEO_NETWORKS = [
  { id: "dmn", name: "Default Mode", abbrev: "DMN", musicMap: "comfort", color: "#a78bfa", angle: 0 },
  { id: "fp", name: "Frontoparietal", abbrev: "FP", musicMap: "discovery", color: "#60a5fa", angle: 51.4 },
  { id: "da", name: "Dorsal Attention", abbrev: "DA", musicMap: "deep_dive", color: "#34d399", angle: 102.8 },
  { id: "va", name: "Ventral Attention", abbrev: "VA", musicMap: "reactive", color: "#fbbf24", angle: 154.3 },
  { id: "lim", name: "Limbic", abbrev: "LIM", musicMap: "emotional", color: "#f87171", angle: 205.7 },
  { id: "smn", name: "Somatomotor", abbrev: "SMN", musicMap: "social", color: "#fb923c", angle: 257.1 },
  { id: "vis", name: "Visual", abbrev: "VIS", musicMap: "aesthetic", color: "#818cf8", angle: 308.5 },
] as const

interface BrainIDVisualizationProps {
  signature: ListeningSignature
  size?: number
  animated?: boolean
  showLabels?: boolean
  showConnections?: boolean
  variant?: "full" | "compact" | "minimal"
  className?: string
}

export function BrainIDVisualization({
  signature,
  size = 320,
  animated = true,
  showLabels = true,
  showConnections = true,
  variant = "full",
  className = "",
}: BrainIDVisualizationProps) {
  const [progress, setProgress] = useState(animated ? 0 : 1)
  const [hoveredNetwork, setHoveredNetwork] = useState<string | null>(null)
  const [pulsePhase, setPulsePhase] = useState(0)
  const animationRef = useRef<number>(undefined)

  // Animate on mount
  useEffect(() => {
    if (!animated) return

    const startTime = performance.now()
    const duration = 1200

    const animate = (time: number) => {
      const elapsed = time - startTime
      const t = Math.min(elapsed / duration, 1)
      // Elastic ease-out
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3))
      setProgress(eased)

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [animated])

  // Subtle pulse animation for active networks
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 0.05) % (Math.PI * 2))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const center = size / 2
  const maxRadius = (size / 2) * 0.7
  const innerRadius = maxRadius * 0.2

  // Calculate network positions and values
  const networkData = useMemo(() => {
    return YEO_NETWORKS.map((network) => {
      const value = signature[network.musicMap as keyof ListeningSignature] || 0
      const angleRad = (network.angle - 90) * (Math.PI / 180)
      const radius = innerRadius + (maxRadius - innerRadius) * value * progress

      return {
        ...network,
        value,
        radius,
        x: center + radius * Math.cos(angleRad),
        y: center + radius * Math.sin(angleRad),
        labelX: center + (maxRadius + 35) * Math.cos(angleRad),
        labelY: center + (maxRadius + 35) * Math.sin(angleRad),
        outerX: center + maxRadius * Math.cos(angleRad),
        outerY: center + maxRadius * Math.sin(angleRad),
      }
    })
  }, [signature, progress, center, maxRadius, innerRadius])

  // Find dominant network
  const dominantNetwork = useMemo(() => {
    return networkData.reduce((max, n) => (n.value > max.value ? n : max), networkData[0])
  }, [networkData])

  // Generate brain shape path (organic blob)
  const brainPath = useMemo(() => {
    const points = networkData.map((n, i) => {
      const nextN = networkData[(i + 1) % networkData.length]
      const midAngle = ((n.angle + nextN.angle) / 2 - 90) * (Math.PI / 180)
      const avgRadius = (n.radius + nextN.radius) / 2
      const controlRadius = avgRadius * (0.85 + Math.sin(pulsePhase + i) * 0.02)

      return {
        x: n.x,
        y: n.y,
        cx: center + controlRadius * Math.cos(midAngle),
        cy: center + controlRadius * Math.sin(midAngle),
      }
    })

    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length]
      path += ` Q ${points[i].cx} ${points[i].cy} ${next.x} ${next.y}`
    }
    return path
  }, [networkData, center, pulsePhase])

  // Connection lines between related networks
  const connections = useMemo(() => {
    if (!showConnections) return []

    const pairs = [
      ["dmn", "lim"], // Comfort ↔ Emotional
      ["fp", "da"],   // Discovery ↔ Deep Dive
      ["va", "smn"],  // Reactive ↔ Social
      ["vis", "fp"],  // Aesthetic ↔ Discovery
    ]

    return pairs.map(([a, b]) => {
      const na = networkData.find((n) => n.id === a)!
      const nb = networkData.find((n) => n.id === b)!
      const strength = Math.min(na.value, nb.value)
      return { na, nb, strength }
    }).filter(c => c.strength > 0.15)
  }, [networkData, showConnections])

  if (variant === "minimal") {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <radialGradient id="brainGradientMini" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={dominantNetwork.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={dominantNetwork.color} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={center} cy={center} r={maxRadius * 0.8} fill="url(#brainGradientMini)" />

          {networkData.map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={4 + n.value * 4}
              fill={n.color}
              opacity={0.6 + n.value * 0.4}
            />
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          {/* Brain gradient */}
          <radialGradient id="brainGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.05" />
            <stop offset="70%" stopColor={dominantNetwork.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={dominantNetwork.color} stopOpacity="0.05" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="brainGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Network gradients */}
          {YEO_NETWORKS.map((n) => (
            <radialGradient key={n.id} id={`grad-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0.2" />
            </radialGradient>
          ))}
        </defs>

        {/* Background rings */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={innerRadius + (maxRadius - innerRadius) * scale}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            strokeOpacity={0.2}
            strokeDasharray={i < 3 ? "2,4" : "none"}
          />
        ))}

        {/* Axis lines */}
        {networkData.map((n) => (
          <line
            key={`axis-${n.id}`}
            x1={center}
            y1={center}
            x2={n.outerX}
            y2={n.outerY}
            stroke="var(--border)"
            strokeWidth={1}
            strokeOpacity={0.15}
          />
        ))}

        {/* Connection lines */}
        {connections.map(({ na, nb, strength }, i) => (
          <line
            key={i}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke={`url(#grad-${na.id})`}
            strokeWidth={strength * 3}
            strokeOpacity={strength * 0.5}
            strokeLinecap="round"
          />
        ))}

        {/* Brain shape */}
        <path
          d={brainPath}
          fill="url(#brainGradient)"
          stroke={dominantNetwork.color}
          strokeWidth={2}
          strokeOpacity={0.4}
          filter="url(#brainGlow)"
        />

        {/* Network nodes */}
        {networkData.map((n) => {
          const isHovered = hoveredNetwork === n.id
          const isDominant = n.id === dominantNetwork.id
          const pulseScale = isDominant ? 1 + Math.sin(pulsePhase * 2) * 0.05 : 1
          const nodeSize = (8 + n.value * 12) * pulseScale

          return (
            <g
              key={n.id}
              onMouseEnter={() => setHoveredNetwork(n.id)}
              onMouseLeave={() => setHoveredNetwork(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Outer glow */}
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeSize + 6}
                fill={n.color}
                opacity={isHovered ? 0.3 : isDominant ? 0.15 : 0.1}
                style={{ transition: "opacity 0.2s" }}
              />

              {/* Main node */}
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeSize}
                fill={`url(#grad-${n.id})`}
                stroke={n.color}
                strokeWidth={isHovered ? 3 : isDominant ? 2 : 1}
                style={{ transition: "stroke-width 0.2s" }}
              />

              {/* Inner dot */}
              <circle
                cx={n.x}
                cy={n.y}
                r={3}
                fill="var(--background)"
              />
            </g>
          )
        })}

        {/* Labels */}
        {showLabels && variant === "full" && networkData.map((n) => {
          const isLeft = n.labelX < center
          const isHovered = hoveredNetwork === n.id

          return (
            <g key={`label-${n.id}`} opacity={isHovered ? 1 : 0.8}>
              <text
                x={n.labelX}
                y={n.labelY - 6}
                textAnchor={isLeft ? "end" : "start"}
                dominantBaseline="middle"
                fill={n.color}
                fontSize={10}
                fontWeight="bold"
                className="uppercase tracking-wider"
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              >
                {n.abbrev}
              </text>
              <text
                x={n.labelX}
                y={n.labelY + 8}
                textAnchor={isLeft ? "end" : "start"}
                dominantBaseline="middle"
                fill="var(--muted-foreground)"
                fontSize={9}
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              >
                {Math.round(n.value * 100)}%
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
          fill="var(--muted-foreground)"
          fontSize={8}
          className="uppercase tracking-[0.3em]"
        >
          BRAIN
        </text>
        <text
          x={center}
          y={center + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--foreground)"
          fontSize={11}
          fontWeight="bold"
          className="uppercase tracking-wider"
        >
          ID
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredNetwork && variant === "full" && (
        <div
          className="absolute z-10 px-3 py-2 border border-[--border] bg-[--background] shadow-lg"
          style={{
            left: "50%",
            bottom: -60,
            transform: "translateX(-50%)",
            minWidth: 180,
          }}
        >
          {(() => {
            const n = networkData.find((net) => net.id === hoveredNetwork)!
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2" style={{ backgroundColor: n.color }} />
                  <span className="text-xs font-bold uppercase tracking-wider">{n.name}</span>
                </div>
                <div className="text-[10px] text-[--muted]">
                  {n.abbrev} → {n.musicMap.replace("_", " ")} listening
                </div>
                <div className="text-xs font-mono mt-1" style={{ color: n.color }}>
                  {Math.round(n.value * 100)}% activation
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

/**
 * Compact inline BrainID indicator
 */
export function BrainIDIndicator({
  signature,
  className = "",
}: {
  signature: ListeningSignature
  className?: string
}) {
  const dominant = useMemo(() => {
    let max: { network: (typeof YEO_NETWORKS)[number]; value: number } = { network: YEO_NETWORKS[0], value: 0 }
    YEO_NETWORKS.forEach((n) => {
      const val = signature[n.musicMap as keyof ListeningSignature] || 0
      if (val > max.value) {
        max = { network: n, value: val }
      }
    })
    return max
  }, [signature])

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
        style={{ backgroundColor: dominant.network.color }}
      >
        {dominant.network.abbrev}
      </div>
      <div className="text-xs">
        <span className="text-[--muted]">BrainID:</span>{" "}
        <span className="font-semibold" style={{ color: dominant.network.color }}>
          {dominant.network.name}
        </span>
      </div>
    </div>
  )
}

/**
 * Network mapping legend
 */
export function BrainIDLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {YEO_NETWORKS.map((n) => (
        <div key={n.id} className="flex items-start gap-2">
          <div
            className="w-3 h-3 mt-0.5 flex-shrink-0"
            style={{ backgroundColor: n.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold" style={{ color: n.color }}>
                {n.abbrev}
              </span>
              <span className="text-[10px] text-[--muted]">→</span>
              <span className="text-[10px] capitalize">{n.musicMap.replace("_", " ")}</span>
            </div>
            <p className="text-[9px] text-[--muted] truncate">{n.name}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
