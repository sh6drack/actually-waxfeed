"use client"

import { 
  getCurrentTier, 
  getProgressToNextTier,
  TASTEID_TIERS,
  TasteIDTier
} from "@/lib/tasteid-tiers"

interface TierProgressBarProps {
  ratingCount: number
  variant?: 'default' | 'compact' | 'detailed'
  showLabels?: boolean
  className?: string
}

/**
 * Clean, professional tier progress bar with step indicators
 * Inspired by modern progress UI patterns
 */
export function TierProgressBar({ 
  ratingCount, 
  variant = 'default',
  showLabels = true,
  className = ''
}: TierProgressBarProps) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const tiers = TASTEID_TIERS.slice(1) // Skip 'locked'
  
  // Calculate overall progress across all tiers
  const overallProgress = calculateOverallProgress(ratingCount)
  
  if (variant === 'compact') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold uppercase tracking-wider" style={{ color: currentTier.color }}>
            {currentTier.name}
          </span>
          {nextTier && (
            <span className="text-[#888]">
              {ratingsToNext} to {nextTier.name}
            </span>
          )}
        </div>
        <div className="h-2 bg-[#222] rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 rounded-full"
            style={{ 
              width: `${progress}%`,
              backgroundColor: currentTier.color
            }}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with current status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
            style={{ backgroundColor: currentTier.color }}
          >
            {currentTier.shortName}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: currentTier.color }}>
              {currentTier.name}
            </div>
            <div className="text-[10px] text-[#666]">
              {currentTier.maxConfidence}% accuracy
            </div>
          </div>
        </div>
        
        {nextTier && (
          <div className="text-right">
            <div className="text-sm font-bold">{ratingsToNext}</div>
            <div className="text-[10px] text-[#666]">to {nextTier.name}</div>
          </div>
        )}
      </div>
      
      {/* Segmented progress bar */}
      <div className="relative">
        {/* Background track */}
        <div className="flex gap-1 h-3">
          {tiers.map((tier, index) => {
            const isCompleted = ratingCount >= tier.minRatings
            const isCurrent = tier.id === currentTier.id
            const isNext = nextTier && tier.id === nextTier.id
            
            // Calculate segment fill for current tier
            let fillPercent = 0
            if (isCompleted && !isCurrent) {
              fillPercent = 100
            } else if (isCurrent && nextTier) {
              fillPercent = progress
            } else if (isCurrent && !nextTier) {
              fillPercent = 100
            }
            
            return (
              <div 
                key={tier.id}
                className="flex-1 bg-[#222] rounded-sm overflow-hidden relative"
                title={`${tier.name}: ${tier.minRatings}+ ratings (${tier.maxConfidence}% accuracy)`}
              >
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${fillPercent}%`,
                    backgroundColor: tier.color,
                    opacity: isCompleted || isCurrent ? 1 : 0.3
                  }}
                />
              </div>
            )
          })}
        </div>
        
        {/* Step indicators */}
        {showLabels && (
          <div className="flex justify-between mt-2">
            {tiers.map((tier, index) => {
              const isCompleted = ratingCount >= tier.minRatings
              const isCurrent = tier.id === currentTier.id
              
              return (
                <div 
                  key={tier.id}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / tiers.length}%` }}
                >
                  {/* Indicator dot/checkmark */}
                  <div 
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                      isCompleted ? 'text-black' : 'text-[#666]'
                    }`}
                    style={{ 
                      backgroundColor: isCompleted ? tier.color : 'transparent',
                      borderColor: isCompleted || isCurrent ? tier.color : '#333'
                    }}
                  >
                    {isCompleted ? '✓' : tier.shortName}
                  </div>
                  
                  {/* Label */}
                  <div 
                    className={`text-[9px] mt-1 uppercase tracking-wider text-center ${
                      isCurrent ? 'font-bold' : ''
                    }`}
                    style={{ 
                      color: isCompleted || isCurrent ? tier.color : '#555'
                    }}
                  >
                    {tier.name}
                  </div>
                  
                  {/* Rating threshold */}
                  <div className="text-[8px] text-[#444]">
                    {tier.minRatings}+
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Progress summary */}
      {variant === 'detailed' && (
        <div className="flex items-center justify-between pt-2 border-t border-[#222]">
          <span className="text-xs text-[#666]">
            {ratingCount} ratings total
          </span>
          <span className="text-xs" style={{ color: currentTier.color }}>
            {Math.round(progress)}% to next tier
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Simple metric progress bar for individual stats
 */
interface MetricBarProps {
  label: string
  value: number
  maxValue?: number
  color?: string
  showPercentage?: boolean
  suffix?: string
  className?: string
}

export function MetricBar({ 
  label, 
  value, 
  maxValue = 100, 
  color = 'var(--accent-primary)',
  showPercentage = true,
  suffix = '',
  className = ''
}: MetricBarProps) {
  const percentage = Math.min(100, (value / maxValue) * 100)
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#888] uppercase tracking-wider">{label}</span>
        <span className="font-bold" style={{ color }}>
          {showPercentage ? `${Math.round(value)}%` : `${value}${suffix}`}
        </span>
      </div>
      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-500 rounded-full"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}

/**
 * Multi-segment progress bar for comparing values
 */
interface SegmentedBarProps {
  segments: {
    label: string
    value: number
    color: string
  }[]
  showLegend?: boolean
  className?: string
}

export function SegmentedBar({ segments, showLegend = true, className = '' }: SegmentedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex h-3 rounded-full overflow-hidden">
        {segments.map((segment, i) => (
          <div 
            key={segment.label}
            className="transition-all duration-500"
            style={{ 
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color
            }}
            title={`${segment.label}: ${Math.round((segment.value / total) * 100)}%`}
          />
        ))}
      </div>
      
      {showLegend && (
        <div className="flex flex-wrap gap-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-[10px] text-[#888]">
                {segment.label} ({Math.round((segment.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper function
function calculateOverallProgress(ratingCount: number): number {
  const maxTier = TASTEID_TIERS[TASTEID_TIERS.length - 1]
  return Math.min(100, (ratingCount / maxTier.minRatings) * 100)
}
