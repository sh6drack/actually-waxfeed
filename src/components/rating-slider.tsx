"use client"

import { useState, useRef, useEffect } from "react"

interface RatingSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  predictedRating?: number // Optional: show prediction marker
}

// Rating tier descriptors
const getTierLabel = (value: number): { label: string; color: string } => {
  if (value <= 2) return { label: "Skip", color: "#ef4444" }
  if (value <= 4) return { label: "Meh", color: "#f97316" }
  if (value <= 5.5) return { label: "Decent", color: "#eab308" }
  if (value <= 7) return { label: "Solid", color: "#84cc16" }
  if (value <= 8.5) return { label: "Great", color: "#22c55e" }
  if (value <= 9.5) return { label: "Fire", color: "#10b981" }
  return { label: "Classic", color: "#ffd700" }
}

// Get track gradient based on value
const getTrackGradient = (value: number): string => {
  const percent = value * 10
  // Gradient from red through yellow to emerald
  return `linear-gradient(90deg,
    #ef4444 0%,
    #f97316 20%,
    #eab308 40%,
    #84cc16 55%,
    #22c55e 70%,
    #10b981 85%,
    #ffd700 100%
  )`
}

export function RatingSlider({ value, onChange, disabled, predictedRating }: RatingSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const tier = getTierLabel(value)

  // Handle mouse/touch interactions for custom slider
  const handleInteraction = (clientX: number) => {
    if (!trackRef.current || disabled) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newValue = Math.round(percent * 100) / 10 // Round to 0.1
    onChange(newValue)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setShowTooltip(true)
    handleInteraction(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setShowTooltip(true)
    handleInteraction(e.touches[0].clientX)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      handleInteraction(clientX)
    }

    const handleEnd = () => {
      setIsDragging(false)
      setTimeout(() => setShowTooltip(false), 500)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, disabled])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 block mb-1">Your Rating</span>
          <div className="flex items-baseline gap-2">
            <span
              className="font-bold text-3xl tabular-nums transition-all duration-200"
              style={{
                color: tier.color,
                textShadow: isDragging ? `0 0 20px ${tier.color}50` : 'none',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {value.toFixed(1)}
            </span>
            <span
              className="text-xs font-medium uppercase tracking-wider transition-all duration-300"
              style={{ color: `${tier.color}90` }}
            >
              {tier.label}
            </span>
          </div>
        </div>

        {/* Prediction comparison (if available) */}
        {predictedRating !== undefined && (
          <div className="text-right">
            <span className="text-[9px] tracking-wider uppercase text-white/20 block">Predicted</span>
            <span className="text-sm font-semibold tabular-nums text-cyan-400/70">{predictedRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Custom Slider Track */}
      <div className="relative py-4">
        {/* Track background */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`relative h-2 rounded-full cursor-pointer transition-all duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Filled portion with gradient */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
            style={{
              width: `${value * 10}%`,
              background: getTrackGradient(value),
              boxShadow: isDragging ? `0 0 15px ${tier.color}40` : 'none',
            }}
          />

          {/* Tick marks */}
          <div className="absolute inset-0 flex justify-between items-center px-0.5 pointer-events-none">
            {[0, 2, 4, 5, 6, 8, 10].map((tick) => (
              <div
                key={tick}
                className="w-px h-3 transition-colors duration-200"
                style={{
                  background: tick <= value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  marginLeft: tick === 0 ? 0 : undefined,
                  marginRight: tick === 10 ? 0 : undefined,
                }}
              />
            ))}
          </div>

          {/* Prediction marker (if available) */}
          {predictedRating !== undefined && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-cyan-400/50 transition-all duration-300 pointer-events-none"
              style={{ left: `${predictedRating * 10}%` }}
            >
              <div
                className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400/60 whitespace-nowrap"
              >
                ↓
              </div>
            </div>
          )}

          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 pointer-events-none"
            style={{ left: `${value * 10}%` }}
          >
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-200"
              style={{
                width: isDragging ? 32 : 24,
                height: isDragging ? 32 : 24,
                marginLeft: isDragging ? -16 : -12,
                marginTop: isDragging ? -16 : -12,
                background: `radial-gradient(circle, ${tier.color}30 0%, transparent 70%)`,
                opacity: isDragging ? 1 : 0,
              }}
            />
            {/* Main thumb */}
            <div
              className="relative rounded-full transition-all duration-200 border-2"
              style={{
                width: isDragging ? 20 : 16,
                height: isDragging ? 20 : 16,
                marginLeft: isDragging ? -10 : -8,
                marginTop: isDragging ? -10 : -8,
                backgroundColor: tier.color,
                borderColor: 'rgba(0, 0, 0, 0.3)',
                boxShadow: `0 2px 8px ${tier.color}60, inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
              }}
            >
              {/* Inner highlight */}
              <div
                className="absolute inset-1 rounded-full bg-white/20"
                style={{ filter: 'blur(1px)' }}
              />
            </div>
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-white/20">0</span>
          <span className="text-[10px] text-white/25">5</span>
          <span className="text-[10px] text-white/20">10</span>
        </div>
      </div>

      {/* Keyboard accessible hidden input */}
      <input
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        disabled={disabled}
        className="sr-only"
        aria-label={`Rating: ${value.toFixed(1)} out of 10 (${tier.label})`}
      />
    </div>
  )
}
