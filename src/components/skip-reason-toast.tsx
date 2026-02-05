"use client"

import { useEffect, useState, useCallback } from "react"

type SkipReason = 'not_interested' | 'already_know' | 'not_now'

interface SkipReasonToastProps {
  isVisible: boolean
  onSelect: (reason: SkipReason) => void
  onDismiss: () => void
}

const REASONS: { id: SkipReason; label: string }[] = [
  { id: 'not_interested', label: 'Not my vibe' },
  { id: 'already_know', label: 'Know it already' },
  { id: 'not_now', label: 'Not in the mood' },
]

const AUTO_DISMISS_MS = 4000

export function SkipReasonToast({ isVisible, onSelect, onDismiss }: SkipReasonToastProps) {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)

  // Handle auto-dismiss countdown
  useEffect(() => {
    if (!isVisible) {
      setProgress(100)
      setIsExiting(false)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100)
      setProgress(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        handleDismiss()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isVisible])

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss()
      setIsExiting(false)
    }, 200)
  }, [onDismiss])

  const handleSelect = useCallback((reason: SkipReason) => {
    setIsExiting(true)
    setTimeout(() => {
      onSelect(reason)
      setIsExiting(false)
    }, 150)
  }, [onSelect])

  if (!isVisible && !isExiting) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out ${
        isExiting
          ? 'translate-y-4 opacity-0'
          : 'translate-y-0 opacity-100 animate-in slide-in-from-bottom-4'
      }`}
      style={{ transform: `translateX(-50%) ${isExiting ? 'translateY(16px)' : ''}` }}
      role="dialog"
      aria-label="Skip reason"
    >
      {/* Main container */}
      <div
        className="relative overflow-hidden border border-white/10 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 215, 0, 0.05)',
        }}
      >
        {/* Subtle gold glow at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #ffd700 50%, transparent)',
            opacity: 0.4,
          }}
        />

        {/* Content */}
        <div className="px-5 py-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              What made you skip?
            </span>
            <button
              onClick={handleDismiss}
              className="p-1 -mr-1 transition-colors hover:bg-white/5 rounded"
              aria-label="Dismiss"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Reason buttons */}
          <div className="flex flex-wrap gap-2">
            {REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleSelect(reason.id)}
                className="group relative px-4 py-2 text-xs font-medium tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '9999px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)'
                  e.currentTarget.style.color = '#ffd700'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                }}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ffd700, #22d3ee)',
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    </div>
  )
}
