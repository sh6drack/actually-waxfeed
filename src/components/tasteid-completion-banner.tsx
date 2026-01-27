"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  getCurrentTier, 
  getProgressToNextTier,
  TASTEID_TIERS 
} from '@/lib/tasteid-tiers'

interface TasteIDCompletionBannerProps {
  reviewCount: number
  hasTasteID: boolean
}

export function TasteIDCompletionBanner({ reviewCount, hasTasteID }: TasteIDCompletionBannerProps) {
  const { data: session, status } = useSession()
  const [isMounted, setIsMounted] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Handle hydration - only render after mount
  useEffect(() => {
    setIsMounted(true)
    
    // Check if user has dismissed this banner today
    const dismissedDate = localStorage.getItem('tasteid-banner-dismissed-date')
    const today = new Date().toDateString()
    
    if (dismissedDate === today) {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    // Only dismiss for today - show again tomorrow to encourage continuous rating
    localStorage.setItem('tasteid-banner-dismissed-date', new Date().toDateString())
    setIsDismissed(true)
  }

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null
  }

  // Don't show if dismissed or no session
  if (isDismissed || status !== 'authenticated' || !session?.user) {
    return null
  }

  const isUnlocked = reviewCount >= 20
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(reviewCount)
  const unlockProgress = Math.min(100, (reviewCount / 20) * 100)

  return (
    <div className="border-b border-[--border] bg-gradient-to-r from-[#ffd700]/10 to-transparent">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Icon with progress ring */}
          <div className="relative flex-shrink-0">
            <svg width="48" height="48" className="-rotate-90">
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="#333"
                strokeWidth="4"
              />
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke={currentTier.color}
                strokeWidth="4"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (progress / 100) * 125.6}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg">
              {currentTier.icon}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-bold">Your TasteID</h3>
              <span 
                className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider"
                style={{ backgroundColor: currentTier.color, color: '#000' }}
              >
                {currentTier.name}
              </span>
              <span className="text-xs text-[--muted]">
                {currentTier.maxConfidence}% accuracy
              </span>
            </div>
            
            <p className="text-xs text-[--muted]">
              {!isUnlocked ? (
                <>Rate {20 - reviewCount} more to unlock your TasteID</>
              ) : nextTier ? (
                <>Rate {ratingsToNext} more albums to reach <strong style={{ color: nextTier.color }}>{nextTier.name}</strong> tier ({nextTier.maxConfidence}% accuracy). Your taste profile evolves with every rating.</>
              ) : (
                <>Maximum accuracy achieved. Your taste profile is elite.</>
              )}
            </p>
          </div>

          {/* Mini tier progress */}
          <div className="hidden md:flex items-center gap-1">
            {TASTEID_TIERS.slice(1).map((tier) => {
              const isActive = tier.id === currentTier.id
              const isPast = tier.minRatings < currentTier.minRatings
              return (
                <div
                  key={tier.id}
                  className="w-8 h-8 flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isActive ? `${tier.color}30` : 'transparent',
                    border: isActive ? `2px solid ${tier.color}` : '1px solid #333',
                    opacity: isPast || isActive ? 1 : 0.3
                  }}
                  title={`${tier.name}: ${tier.minRatings}+ ratings`}
                >
                  <span className="text-xs">{tier.icon}</span>
                </div>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <Link
              href="/tasteid/me"
              className="px-4 py-2 bg-[#ffd700] text-black text-xs uppercase tracking-wider font-bold hover:bg-[#ffed4a] transition-colors"
            >
              View TasteID
            </Link>
            <Link
              href="/quick-rate"
              className="px-4 py-2 border border-[#ffd700] text-[#ffd700] text-xs uppercase tracking-wider font-bold hover:bg-[#ffd700] hover:text-black transition-colors"
            >
              Keep Building
            </Link>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-[--muted] hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
