"use client"

import { useState, useEffect } from "react"

export function PolaritySystem() {
  const [isMounted, setIsMounted] = useState(false)
  const [time, setTime] = useState<string>("00:00:00")
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [systemStatus, setSystemStatus] = useState("NOMINAL")

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

    // Random system status flicker
    const statusInterval = setInterval(() => {
      const statuses = ["NOMINAL", "ACTIVE", "SYNCING", "NOMINAL", "NOMINAL"]
      setSystemStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 5000)

    return () => {
      clearInterval(interval)
      clearInterval(statusInterval)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Corner Brackets */}
      <div className="fixed top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[--foreground]/10 pointer-events-none z-40" />
      <div className="fixed top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[--foreground]/10 pointer-events-none z-40" />
      <div className="fixed bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[--foreground]/10 pointer-events-none z-40" />
      <div className="fixed bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[--foreground]/10 pointer-events-none z-40" />

      {/* System Status Bar - Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Coordinates */}
          <div className="hidden md:flex items-center gap-4 font-mono text-[9px] tracking-wider text-[--foreground]/20">
            <span>X:{coords.x.toString().padStart(4, "0")}</span>
            <span className="text-[--foreground]/10">|</span>
            <span>Y:{coords.y.toString().padStart(4, "0")}</span>
          </div>

          {/* Center: Polarity Branding */}
          <div className="flex items-center gap-3 mx-auto">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500/50 animate-ping" />
              </div>
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[--foreground]/30">
                polarity
              </span>
              <span className="font-mono text-[9px] text-[--foreground]/50 tabular-nums">
                1.2
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
        polarity 1.2
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
      {/* Corner brackets */}
      <div className="fixed top-6 left-6 w-12 h-12 border-l border-t border-[--foreground]/20" />
      <div className="fixed top-6 right-6 w-12 h-12 border-r border-t border-[--foreground]/20" />
      <div className="fixed bottom-6 left-6 w-12 h-12 border-l border-b border-[--foreground]/20" />
      <div className="fixed bottom-6 right-6 w-12 h-12 border-r border-b border-[--foreground]/20" />

      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Spinning loader */}
        <div className="relative">
          <div className="w-16 h-16 border border-[--foreground]/20" />
          <div className="absolute inset-2 border border-[--foreground]/10 animate-spin" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-4 border border-[var(--accent-primary)]/30 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[var(--accent-primary)] animate-pulse" />
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
              polarity 1.2
            </span>
          </div>
        </div>
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
