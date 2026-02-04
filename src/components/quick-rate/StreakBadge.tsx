"use client"

type StreakIntensity = 'normal' | 'major' | 'epic' | 'legendary'

interface IntensityConfig {
  bgOpacity: number
  borderOpacity: number
  shadow: string
  textGlow: boolean
  messageOpacity: number
  rings: number
}

const INTENSITY_CONFIGS: Record<StreakIntensity, IntensityConfig> = {
  normal: { bgOpacity: 0.08, borderOpacity: 0.2, shadow: 'none', textGlow: false, messageOpacity: 0.6, rings: 0 },
  major: { bgOpacity: 0.12, borderOpacity: 0.35, shadow: '0 0 15px rgba(255, 215, 0, 0.15)', textGlow: false, messageOpacity: 0.6, rings: 0 },
  epic: { bgOpacity: 0.15, borderOpacity: 0.4, shadow: '0 0 20px rgba(255, 215, 0, 0.2)', textGlow: false, messageOpacity: 0.7, rings: 1 },
  legendary: { bgOpacity: 0.2, borderOpacity: 0.5, shadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)', textGlow: true, messageOpacity: 0.8, rings: 2 },
}

const SIZE_CLASSES = {
  small: { container: 'px-2 py-1', number: 'text-xl', dot: 'w-2 h-2', label: 'text-[9px]' },
  medium: { container: 'px-4 py-2.5', number: 'text-2xl', dot: 'w-3 h-3', label: 'text-xs' },
  large: { container: 'px-6 py-4', number: 'text-3xl', dot: 'w-4 h-4', label: 'text-xs' },
} as const

function getStreakIntensity(streak: number): StreakIntensity {
  if (streak >= 50) return 'legendary'
  if (streak >= 25) return 'epic'
  if (streak >= 10) return 'major'
  return 'normal'
}

interface StreakBadgeProps {
  streak: number
  isNewMilestone: boolean
  streakMessage: string | null
  size?: 'small' | 'medium' | 'large'
}

export function StreakBadge({ streak, isNewMilestone, streakMessage, size = 'medium' }: StreakBadgeProps) {
  const intensity = getStreakIntensity(streak)
  const config = INTENSITY_CONFIGS[intensity]
  const sizeClasses = SIZE_CLASSES[size]

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative">
        {config.rings >= 2 && (
          <div className="absolute -inset-3 rounded-3xl border border-[#ffd700]/10 animate-ping" style={{ animationDuration: '2s' }} />
        )}
        {config.rings >= 1 && (
          <div className="absolute -inset-2 rounded-2xl border border-[#ffd700]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        )}

        <div
          className={`flex items-center gap-3 ${sizeClasses.container} rounded-2xl transition-all border`}
          style={{
            backgroundColor: `rgba(255, 215, 0, ${config.bgOpacity})`,
            borderColor: `rgba(255, 215, 0, ${config.borderOpacity})`,
            boxShadow: config.shadow,
          }}
        >
          <div className="relative">
            <div className={`${sizeClasses.dot} rounded-full bg-[#ffd700]`} />
            <div className={`absolute inset-0 ${sizeClasses.dot} rounded-full bg-[#ffd700] animate-ping`} />
          </div>
          <span
            className={`${sizeClasses.number} font-bold tabular-nums text-[#ffd700]`}
            style={{ textShadow: config.textGlow ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none' }}
          >
            {streak}
          </span>
          <span className={`${sizeClasses.label} uppercase tracking-wider text-[#ffd700]/70`}>
            streak
          </span>
        </div>
      </div>

      {isNewMilestone && streakMessage && (
        <span
          className="text-[11px]"
          style={{
            color: `rgba(255, 215, 0, ${config.messageOpacity})`,
            textShadow: config.textGlow ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
          }}
        >
          {streakMessage}
        </span>
      )}
    </div>
  )
}
