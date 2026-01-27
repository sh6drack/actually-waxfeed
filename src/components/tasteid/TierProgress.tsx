"use client"

import { 
  getCurrentTier, 
  getProgressToNextTier, 
  getMilestones,
  getMotivationalMessage,
  TASTEID_TIERS 
} from "@/lib/tasteid-tiers"

interface TierProgressProps {
  ratingCount: number
  variant?: 'compact' | 'full' | 'inline'
  showMilestones?: boolean
  className?: string
}

export function TierProgress({ 
  ratingCount, 
  variant = 'compact',
  showMilestones = false,
  className = ''
}: TierProgressProps) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const milestones = getMilestones(ratingCount)
  const message = getMotivationalMessage(ratingCount)
  
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs" style={{ color: currentTier.color }}>
          {currentTier.icon} {currentTier.name}
        </span>
        <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden max-w-[100px]">
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              backgroundColor: nextTier?.color || currentTier.color 
            }}
          />
        </div>
        {nextTier && (
          <span className="text-[10px] text-[#666]">
            {ratingsToNext} to {nextTier.name}
          </span>
        )}
      </div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <div className={`p-3 border border-[#333] bg-[#111] ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span style={{ color: currentTier.color }}>{currentTier.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTier.color }}>
              {currentTier.name}
            </span>
            <span className="text-[10px] text-[#666]">{currentTier.maxConfidence}% accuracy</span>
          </div>
          {nextTier && (
            <span className="text-[10px] text-[#888]">
              {ratingsToNext} to {nextTier.icon}
            </span>
          )}
        </div>
        
        <div className="relative h-2 bg-[#222] rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})`
            }}
          />
          {/* Milestone markers */}
          {showMilestones && milestones.map((m, i) => (
            <div 
              key={i}
              className="absolute top-0 bottom-0 w-0.5"
              style={{ 
                left: `${(i + 1) * 25}%`,
                backgroundColor: m.reached ? '#fff' : '#444'
              }}
            />
          ))}
        </div>
        
        <p className="text-[10px] text-[#666] mt-2">{message}</p>
      </div>
    )
  }
  
  // Full variant
  return (
    <div className={`p-4 border border-[#333] bg-[#111] ${className}`}>
      {/* Current tier info */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${currentTier.color}20`, border: `2px solid ${currentTier.color}` }}
        >
          {currentTier.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider" style={{ color: currentTier.color }}>
              {currentTier.name}
            </span>
            <span className="text-xs px-2 py-0.5 border border-[#444] text-[#888]">
              {currentTier.maxConfidence}% max accuracy
            </span>
          </div>
          <p className="text-xs text-[#888] mt-0.5">{currentTier.description}</p>
        </div>
      </div>
      
      {/* Progress bar with milestones */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-[#666] mb-1">
          <span>{ratingCount} ratings</span>
          {nextTier && <span>{nextTier.minRatings} for {nextTier.name}</span>}
        </div>
        <div className="relative h-3 bg-[#222] rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 transition-all duration-700 rounded-full"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})`
            }}
          />
          {/* Milestone dots */}
          {milestones.map((m, i) => (
            <div 
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors"
              style={{ 
                left: `calc(${(i + 1) * 25}% - 4px)`,
                backgroundColor: m.reached ? '#fff' : '#444',
                boxShadow: m.reached ? '0 0 4px #fff' : 'none'
              }}
              title={`${m.milestone} ratings`}
            />
          ))}
        </div>
      </div>
      
      {/* Next tier preview */}
      {nextTier && (
        <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#222]">
          <span className="text-xl opacity-50">{nextTier.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666]">
                NEXT: {nextTier.name}
              </span>
              <span className="text-[10px] text-[#555]">{ratingsToNext} ratings away</span>
            </div>
            <p className="text-[10px] text-[#555] mt-0.5">
              Unlocks: {nextTier.perks.slice(0, 2).join(', ')}
            </p>
          </div>
          <div 
            className="text-lg font-bold"
            style={{ color: nextTier.color }}
          >
            {Math.round(progress)}%
          </div>
        </div>
      )}
      
      {/* All tiers preview */}
      <div className="mt-4 pt-4 border-t border-[#222]">
        <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">All Tiers</p>
        <div className="flex gap-1">
          {TASTEID_TIERS.slice(1).map((tier, i) => {
            const isActive = tier.id === currentTier.id
            const isPast = tier.minRatings < currentTier.minRatings
            return (
              <div 
                key={tier.id}
                className="flex-1 text-center py-1.5 transition-colors"
                style={{ 
                  backgroundColor: isActive ? `${tier.color}20` : isPast ? `${tier.color}10` : '#1a1a1a',
                  borderBottom: isActive ? `2px solid ${tier.color}` : '2px solid transparent',
                  opacity: isPast || isActive ? 1 : 0.4
                }}
                title={`${tier.name}: ${tier.minRatings}+ ratings`}
              >
                <span className="text-xs">{tier.icon}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Mini progress ring for headers/compact spaces
export function TierProgressRing({ 
  ratingCount, 
  size = 32,
  className = '' 
}: { 
  ratingCount: number
  size?: number
  className?: string
}) {
  const { progress, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const strokeWidth = size / 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={nextTier?.color || currentTier.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-xs" style={{ fontSize: size / 3 }}>
        {currentTier.icon}
      </span>
    </div>
  )
}
