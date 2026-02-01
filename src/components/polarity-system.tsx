"use client"

import { useState, useEffect } from "react"

export function PolaritySystem() {
  const [isMounted, setIsMounted] = useState(false)
  const [time, setTime] = useState<string>("00:00:00")
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [systemStatus, setSystemStatus] = useState("NOMINAL")
  const [dyadicPulse, setDyadicPulse] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Update time
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)

    // Track mouse position for coordinates
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)

    // Random system status flicker - now includes DYAD and LINKED
    const statusInterval = setInterval(() => {
      const statuses = ["NOMINAL", "ACTIVE", "SYNCING", "DYAD", "LINKED", "NOMINAL", "NOMINAL"]
      setSystemStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 5000)

    // Dyadic pulse every 30 seconds
    const pulseInterval = setInterval(() => {
      setDyadicPulse(true)
      setTimeout(() => setDyadicPulse(false), 1500)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(statusInterval)
      clearInterval(pulseInterval)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Corner Brackets with CCX node indicators */}
      <div className="fixed top-4 left-4 pointer-events-none z-40">
        <div className="w-8 h-8 border-l-2 border-t-2 border-[--foreground]/10" />
        <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[var(--accent-primary)]/40 animate-pulse" />
      </div>
      <div className="fixed top-4 right-4 pointer-events-none z-40">
        <div className="w-8 h-8 border-r-2 border-t-2 border-[--foreground]/10" />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-400/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>
      <div className="fixed bottom-4 left-4 pointer-events-none z-40">
        <div className="w-8 h-8 border-l-2 border-b-2 border-[--foreground]/10" />
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-400/40 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="fixed bottom-4 right-4 pointer-events-none z-40">
        <div className="w-8 h-8 border-r-2 border-b-2 border-[--foreground]/10" />
        <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[var(--accent-primary)]/40 animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Dyadic pulse effect */}
      {dyadicPulse && (
        <div className="fixed inset-0 pointer-events-none z-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 border border-[var(--accent-primary)]/20 animate-ping" />
            <div className="absolute inset-3 border border-cyan-400/15 animate-ping" style={{ animationDelay: "0.15s" }} />
          </div>
        </div>
      )}

      {/* System Status Bar - Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Coordinates */}
          <div className="hidden md:flex items-center gap-4 font-mono text-[9px] tracking-wider text-[--foreground]/20">
            <span>X:{coords.x.toString().padStart(4, "0")}</span>
            <span className="text-[--foreground]/10">|</span>
            <span>Y:{coords.y.toString().padStart(4, "0")}</span>
          </div>

          {/* Center: Polarity Branding with Dyadic Indicator */}
          <div className="flex items-center gap-3 mx-auto">
            {/* Dyadic indicator - two connected nodes */}
            <div className="hidden sm:flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] animate-pulse" />
              <div className="w-4 h-px bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400 opacity-50" />
              <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            <span className="text-[--foreground]/10 hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500/50 animate-ping" />
              </div>
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[--foreground]/30">
                polarity
              </span>
              <span className="font-mono text-[9px] text-[--foreground]/50 tabular-nums">
                1.9
              </span>
              <span className="font-mono text-[7px] text-cyan-400/60 tracking-widest uppercase">
                dyad
              </span>
            </div>
            <span className="text-[--foreground]/10 hidden sm:inline">|</span>
            <span className="font-mono text-[9px] tracking-wider text-[--foreground]/20 hidden sm:inline">
              {systemStatus}
            </span>
          </div>

          {/* Right: Time */}
          <div className="hidden md:block font-mono text-[9px] tracking-wider text-[--foreground]/20 tabular-nums">
            {time}
          </div>
        </div>
      </footer>

      {/* Subtle grid overlay (very faint) */}
      <div
        className="fixed inset-0 pointer-events-none z-30 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(var(--foreground) 1px, transparent 1px),
            linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />

      {/* Scanline effect (ultra subtle) */}
      <div
        className="fixed inset-0 pointer-events-none z-30 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            var(--foreground) 2px,
            var(--foreground) 4px
          )`
        }}
      />
    </>
  )
}

// Minimal version for pages that need less visual noise
export function PolarityBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[--foreground]/10 bg-[--background]">
      <div className="w-1 h-1 bg-green-500 animate-pulse" />
      <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-[--foreground]/40">
        polarity 1.9
      </span>
      <span className="font-mono text-[7px] text-cyan-400/50 tracking-widest uppercase">
        dyad
      </span>
    </div>
  )
}

// Loading screen with Polarity branding
export function PolarityLoader({ text = "INITIALIZING" }: { text?: string }) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".")
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[--background]">
      {/* Corner brackets with CCX nodes */}
      <div className="fixed top-6 left-6">
        <div className="w-12 h-12 border-l border-t border-[--foreground]/20" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--accent-primary)]/30" />
      </div>
      <div className="fixed top-6 right-6">
        <div className="w-12 h-12 border-r border-t border-[--foreground]/20" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400/30" />
      </div>
      <div className="fixed bottom-6 left-6">
        <div className="w-12 h-12 border-l border-b border-[--foreground]/20" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400/30" />
      </div>
      <div className="fixed bottom-6 right-6">
        <div className="w-12 h-12 border-r border-b border-[--foreground]/20" />
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--accent-primary)]/30" />
      </div>

      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Spinning loader with dyadic center */}
        <div className="relative">
          <div className="w-16 h-16 border border-[--foreground]/20" />
          <div className="absolute inset-2 border border-[--foreground]/10 animate-spin" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-4 border border-[var(--accent-primary)]/30 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
          {/* Dyadic center - two nodes */}
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] animate-pulse" />
            <div className="w-2 h-px bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400 opacity-60" />
            <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Status text */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[--foreground]/50">
            {text}<span className="inline-block w-6">{dots}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-green-500 animate-pulse" />
            <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-[--foreground]/30">
              polarity 1.9
            </span>
            <span className="font-mono text-[7px] text-cyan-400/50 tracking-widest uppercase">
              dyad
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dyadic indicator - shows connection strength between two nodes
export function DyadicIndicator({
  strength,
  label = "CONNECTION"
}: {
  strength: number
  label?: string
}) {
  const clampedStrength = Math.max(0, Math.min(1, strength))

  return (
    <div className="flex items-center gap-3">
      {/* Two nodes with connection line */}
      <div className="relative flex items-center">
        <div
          className="w-2 h-2 bg-[var(--accent-primary)]"
          style={{ opacity: 0.4 + clampedStrength * 0.6 }}
        />
        <div
          className="w-8 h-px bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400"
          style={{ opacity: 0.3 + clampedStrength * 0.7 }}
        />
        <div
          className="w-2 h-2 bg-cyan-400"
          style={{ opacity: 0.4 + clampedStrength * 0.6 }}
        />
      </div>
      <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-[--foreground]/40">
        {label}
      </span>
      <span className="font-mono text-[9px] text-[var(--accent-primary)] tabular-nums">
        {Math.round(clampedStrength * 100)}%
      </span>
    </div>
  )
}

// CCX Graph Mini - small visualization of connectome
export function CCXGraphMini({
  nodes = 6,
  className = ""
}: {
  nodes?: number
  className?: string
}) {
  const nodeCount = Math.min(Math.max(3, nodes), 8)

  return (
    <div className={`relative w-12 h-12 ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 48 48">
        {/* Central node */}
        <circle
          cx="24"
          cy="24"
          r="3"
          fill="var(--accent-primary)"
          opacity="0.8"
          className="animate-pulse"
        />

        {/* Surrounding nodes with connecting lines */}
        {Array.from({ length: nodeCount }).map((_, i) => {
          const angle = (i * (360 / nodeCount) - 90) * (Math.PI / 180)
          const x = 24 + 14 * Math.cos(angle)
          const y = 24 + 14 * Math.sin(angle)
          const isAlternate = i % 2 === 0
          return (
            <g key={i}>
              <line
                x1="24"
                y1="24"
                x2={x}
                y2={y}
                stroke={isAlternate ? "var(--accent-primary)" : "#22d3ee"}
                strokeWidth="0.5"
                opacity="0.3"
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              <circle
                cx={x}
                cy={y}
                r="2"
                fill={isAlternate ? "var(--accent-primary)" : "#22d3ee"}
                opacity="0.5"
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            </g>
          )
        })}
      </svg>
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[7px] text-[--foreground]/30 tracking-widest">
        CCX
      </span>
    </div>
  )
}

// Polarity Progress - Ralphy pattern: persistent rules + progress tracking
export function PolarityProgress({
  currentVersion = "1.9",
  featuresUnlocked,
  totalFeatures,
  label = "POLARITY"
}: {
  currentVersion?: string
  featuresUnlocked: number
  totalFeatures: number
  label?: string
}) {
  const progress = totalFeatures > 0 ? (featuresUnlocked / totalFeatures) * 100 : 0

  return (
    <div className="font-mono text-[9px]">
      <div className="flex items-center justify-between mb-2">
        <span className="tracking-[0.2em] uppercase text-[--foreground]/40">
          {label} {currentVersion}
        </span>
        <span className="text-[var(--accent-primary)] tabular-nums">
          {featuresUnlocked}/{totalFeatures} ACTIVE
        </span>
      </div>
      <div className="h-1 bg-[--border] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// Data readout component for stats/numbers
export function DataReadout({
  label,
  value,
  unit,
  highlight = false
}: {
  label: string
  value: string | number
  unit?: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-[--foreground]/40">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl tabular-nums font-bold ${highlight ? "text-[var(--accent-primary)]" : "text-[--foreground]"}`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[10px] uppercase text-[--foreground]/50">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

// Section header with technical styling
export function SectionHeader({
  tag,
  title,
  subtitle
}: {
  tag?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {tag && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[var(--accent-primary)]" />
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[--foreground]/50">
            {tag}
          </span>
          <div className="flex-1 h-px bg-[--border]" />
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[--muted] leading-relaxed max-w-lg">
          {subtitle}
        </p>
      )}
    </div>
  )
}
