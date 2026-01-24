"use client"

import { useEffect, useRef, useState } from "react"
import type { ListeningSignature } from "@/lib/tasteid"

const NETWORK_LABELS: Record<keyof ListeningSignature, { name: string; color: string }> = {
  discovery: { name: "Discovery", color: "#60a5fa" },
  comfort: { name: "Comfort", color: "#a78bfa" },
  deep_dive: { name: "Deep Dive", color: "#34d399" },
  reactive: { name: "Reactive", color: "#fbbf24" },
  emotional: { name: "Emotional", color: "#f87171" },
  social: { name: "Social", color: "#fb923c" },
  aesthetic: { name: "Aesthetic", color: "#818cf8" },
}

const NETWORKS = Object.keys(NETWORK_LABELS) as Array<keyof ListeningSignature>

interface SignatureComparisonProps {
  userSignature: ListeningSignature
  otherSignature: ListeningSignature
  userName?: string
  otherName?: string
  size?: number
  animated?: boolean
}

/**
 * Full radar chart comparison of two listening signatures
 */
export function SignatureComparison({
  userSignature,
  otherSignature,
  userName = "You",
  otherName = "Them",
  size = 240,
  animated = true,
}: SignatureComparisonProps) {
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1)
  const animationRef = useRef<number>(null)

  useEffect(() => {
    if (!animated) return

    const startTime = performance.now()
    const duration = 1000 // 1 second animation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimationProgress(eased)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [animated])

  const center = size / 2
  const maxRadius = (size / 2) - 30

  // Generate polygon points for a signature
  const getPolygonPoints = (signature: ListeningSignature, progress: number) => {
    return NETWORKS.map((network, i) => {
      const angle = (Math.PI * 2 * i) / NETWORKS.length - Math.PI / 2
      const value = signature[network] * progress
      const radius = value * maxRadius
      const x = center + radius * Math.cos(angle)
      const y = center + radius * Math.sin(angle)
      return `${x},${y}`
    }).join(" ")
  }

  // Generate grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(level => (
    <circle
      key={level}
      cx={center}
      cy={center}
      r={maxRadius * level}
      fill="none"
      stroke="var(--border)"
      strokeWidth={1}
      strokeOpacity={0.3}
    />
  ))

  // Generate axis lines and labels
  const axisLines = NETWORKS.map((network, i) => {
    const angle = (Math.PI * 2 * i) / NETWORKS.length - Math.PI / 2
    const x2 = center + maxRadius * Math.cos(angle)
    const y2 = center + maxRadius * Math.sin(angle)
    const labelX = center + (maxRadius + 15) * Math.cos(angle)
    const labelY = center + (maxRadius + 15) * Math.sin(angle)

    return (
      <g key={network}>
        <line
          x1={center}
          y1={center}
          x2={x2}
          y2={y2}
          stroke="var(--border)"
          strokeWidth={1}
          strokeOpacity={0.3}
        />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--muted)"
          fontSize={9}
          fontWeight={500}
        >
          {NETWORK_LABELS[network].name.charAt(0)}
        </text>
      </g>
    )
  })

  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid */}
        {gridCircles}
        {axisLines}

        {/* Other user's signature (background) */}
        <polygon
          points={getPolygonPoints(otherSignature, animationProgress)}
          fill="rgba(168, 85, 247, 0.1)"
          stroke="rgb(168, 85, 247)"
          strokeWidth={2}
          strokeOpacity={0.6}
        />

        {/* User's signature (foreground) */}
        <polygon
          points={getPolygonPoints(userSignature, animationProgress)}
          fill="rgba(96, 165, 250, 0.15)"
          stroke="rgb(96, 165, 250)"
          strokeWidth={2}
        />

        {/* Center dot */}
        <circle cx={center} cy={center} r={3} fill="var(--foreground)" />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded-sm" />
          <span className="text-xs text-[--muted]">{userName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-sm" />
          <span className="text-xs text-[--muted]">{otherName}</span>
        </div>
      </div>
    </div>
  )
}

interface SignatureComparisonMiniProps {
  userSignature: ListeningSignature
  otherResonance: Record<string, number>
  contrast: Record<string, number>
}

/**
 * Mini bar chart showing network resonance and contrast
 */
export function SignatureComparisonMini({
  userSignature,
  otherResonance,
  contrast,
}: SignatureComparisonMiniProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Find top resonating and contrasting networks
  const resonanceEntries = Object.entries(otherResonance).sort((a, b) => b[1] - a[1])
  const topResonance = resonanceEntries.slice(0, 3)

  return (
    <div className="space-y-2">
      <p className="text-[9px] uppercase tracking-wider text-[--muted]">Network Alignment</p>
      <div className="grid grid-cols-7 gap-1">
        {NETWORKS.map(network => {
          const resonance = otherResonance[network] || 0
          const diff = contrast[network] || 0
          const { color, name } = NETWORK_LABELS[network]

          return (
            <div key={network} className="text-center">
              <div
                className="h-8 w-full relative overflow-hidden"
                style={{ backgroundColor: `${color}15` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                  style={{
                    height: animated ? `${resonance * 300}%` : "0%",
                    backgroundColor: color,
                    opacity: 0.6,
                  }}
                />
              </div>
              <p className="text-[8px] text-[--muted] mt-1" title={name}>
                {name.charAt(0)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SignatureOverlapVisualizationProps {
  userSignature: ListeningSignature
  otherSignature: ListeningSignature
  size?: number
}

/**
 * Venn-diagram style overlap visualization
 */
export function SignatureOverlapVisualization({
  userSignature,
  otherSignature,
  size = 200,
}: SignatureOverlapVisualizationProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(1), 100)
    return () => clearTimeout(timer)
  }, [])

  // Calculate overlap
  let overlapScore = 0
  NETWORKS.forEach(network => {
    overlapScore += Math.min(userSignature[network], otherSignature[network])
  })
  overlapScore = overlapScore / NETWORKS.length

  const circleRadius = size * 0.35
  const overlapAmount = overlapScore * circleRadius

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} className="overflow-visible">
        {/* User circle */}
        <circle
          cx={size * 0.35}
          cy={size * 0.35}
          r={circleRadius}
          fill="rgba(96, 165, 250, 0.2)"
          stroke="rgb(96, 165, 250)"
          strokeWidth={2}
          style={{
            transform: `translateX(${progress * overlapAmount * 0.3}px)`,
            transition: "transform 0.7s ease-out",
          }}
        />

        {/* Other circle */}
        <circle
          cx={size * 0.65}
          cy={size * 0.35}
          r={circleRadius}
          fill="rgba(168, 85, 247, 0.2)"
          stroke="rgb(168, 85, 247)"
          strokeWidth={2}
          style={{
            transform: `translateX(${-progress * overlapAmount * 0.3}px)`,
            transition: "transform 0.7s ease-out",
          }}
        />

        {/* Overlap percentage */}
        <text
          x={size / 2}
          y={size * 0.35}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--foreground)"
          fontSize={24}
          fontWeight="bold"
        >
          {Math.round(overlapScore * 100)}%
        </text>
      </svg>
      <p className="text-xs text-[--muted] mt-2">Signature Overlap</p>
    </div>
  )
}
