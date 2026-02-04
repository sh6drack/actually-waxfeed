import { TASTEID_TIERS, getProgressToNextTier } from '@/lib/tasteid-tiers'

interface TierProgressBarProps {
  ratingCount: number
}

export function TierProgressBar({ ratingCount }: TierProgressBarProps) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const tiers = TASTEID_TIERS.slice(1)

  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Current tier badge */}
          <div
            className="relative px-2.5 py-1 rounded-md font-semibold text-[9px] uppercase tracking-wider"
            style={{
              backgroundColor: `${currentTier.color}20`,
              color: currentTier.color,
              border: `1px solid ${currentTier.color}30`,
            }}
          >
            <span className="relative z-10">{currentTier.shortName || currentTier.name}</span>
            <div
              className="absolute inset-0 rounded-md opacity-50 blur-sm"
              style={{ backgroundColor: currentTier.color }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-white/20 uppercase tracking-wider">Accuracy</span>
            <span className="text-[10px] text-white/50 tabular-nums">{currentTier.maxConfidence}%</span>
          </div>
        </div>
        {nextTier && (
          <div className="text-right">
            <span className="text-[8px] text-white/20 uppercase tracking-wider block">Next tier</span>
            <span className="text-[10px] text-white/40">
              <span className="tabular-nums">{ratingsToNext}</span> to{' '}
              <span className="font-medium" style={{ color: `${nextTier.color}90` }}>
                {nextTier.shortName || nextTier.name}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Progress track */}
      <div className="flex gap-[2px] rounded-lg overflow-hidden bg-white/[0.02] p-[2px]">
        {tiers.map((tier, idx) => {
          const isCompleted = ratingCount >= tier.minRatings
          const isCurrent = tier.id === currentTier.id
          const fillPercent = isCompleted && !isCurrent ? 100 : isCurrent ? progress : 0

          return (
            <div
              key={tier.id}
              className="flex-1 h-1.5 rounded-sm bg-white/[0.03] overflow-hidden relative group/tier"
              title={`${tier.name} (${tier.minRatings}+ ratings)`}
            >
              <div
                className="h-full rounded-sm transition-all duration-700 ease-out"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: tier.color,
                  boxShadow: fillPercent > 0 ? `0 0 6px ${tier.color}50` : 'none',
                }}
              />
              {idx > 0 && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-colors"
                  style={{ backgroundColor: isCompleted ? tier.color : 'rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
