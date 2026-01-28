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
  const tiers = TASTEID_TIERS.slice(1) // Skip 'locked'

  return (
    <div className="border-b border-[--border] bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-2">
        <div className="flex items-center gap-4">
          {/* Level badge */}
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-black"
            style={{ backgroundColor: currentTier.color }}
          >
            {currentTier.shortName}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
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
            
            {/* Segmented progress bar */}
            <div className="flex gap-0.5 h-2 max-w-md">
              {tiers.map((tier) => {
                const isCompleted = reviewCount >= tier.minRatings
                const isCurrent = tier.id === currentTier.id
                
                let fillPercent = 0
                if (isCompleted && !isCurrent) fillPercent = 100
                else if (isCurrent) fillPercent = progress
                
                return (
                  <div 
                    key={tier.id}
                    className="flex-1 bg-[#222] rounded-sm overflow-hidden"
                    title={`${tier.name}: ${tier.minRatings}+ ratings`}
                  >
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${fillPercent}%`,
                        backgroundColor: tier.color
                      }}
                    />
                  </div>
                )
              })}
            </div>
            
            <p className="text-[10px] text-[--muted] mt-1">
              {!isUnlocked ? (
                <>Rate {20 - reviewCount} more to unlock your TasteID</>
              ) : nextTier ? (
                <>{ratingsToNext} more ratings to reach {nextTier.name} ({nextTier.maxConfidence}% accuracy)</>
              ) : (
                <>Maximum accuracy achieved</>
              )}
            </p>
          </div>

          {/* Tier step indicators with CLEAR LABELS */}
          <div className="hidden lg:flex items-center gap-0.5">
            {tiers.map((tier, index) => {
              const isActive = tier.id === currentTier.id
              const isCompleted = reviewCount >= tier.minRatings
              const isLast = index === tiers.length - 1
              return (
                <div key={tier.id} className="flex items-center">
                  <div
                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
                      isCompleted ? 'text-black' : isActive ? 'text-white' : 'text-[#555]'
                    }`}
                    style={{
                      backgroundColor: isCompleted ? tier.color : isActive ? '#333' : 'transparent',
                      border: `1px solid ${isCompleted || isActive ? tier.color : '#333'}`
                    }}
                    title={`${tier.minRatings}+ ratings`}
                  >
                    {tier.name}
                  </div>
                  {!isLast && (
                    <div className={`w-2 h-0.5 ${isCompleted ? 'bg-white' : 'bg-[#333]'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <Link
              href="/tasteid/me"
              className="px-4 py-2 bg-[var(--accent-primary)] text-black text-xs uppercase tracking-wider font-bold hover:bg-[#ffed4a] transition-colors"
            >
              View TasteID
            </Link>
            <Link
              href="/quick-rate"
              className="px-4 py-2 bg-[var(--accent-primary)] text-black text-xs uppercase tracking-wider font-bold hover:bg-[#ffed4a] transition-colors"
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
