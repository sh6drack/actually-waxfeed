'use client'

import { DNAIcon } from './icons'
import type { PredictionData } from './types'

// Streak intensity types and configuration
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

interface AudioFeatureBarProps {
  label: string
  value: number
  color: string
  icon?: string
}

export function AudioFeatureBar({ label, value, color, icon }: AudioFeatureBarProps) {
  const fillHeight = Math.max(8, value)

  return (
    <div className="group relative">
      <div className="relative h-16 w-full rounded-xl bg-[#030303] border border-white/[0.03] overflow-hidden">
        <div className="absolute inset-[3px] rounded-lg overflow-hidden bg-[#0a0a0a]">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
            style={{
              height: `${fillHeight}%`,
              background: `linear-gradient(to top, ${color}15, ${color}35 40%, ${color}50 80%, ${color}70)`,
              boxShadow: `0 0 20px ${color}30, inset 0 0 15px ${color}20`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                boxShadow: `0 0 8px ${color}80`,
              }}
            />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color, left: '20%', bottom: '30%' }} />
              <div className="absolute w-0.5 h-0.5 rounded-full animate-pulse" style={{ backgroundColor: color, left: '60%', bottom: '50%', animationDelay: '0.5s' }} />
              <div className="absolute w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color, left: '40%', bottom: '15%', animationDelay: '1s' }} />
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-1 h-[1px] bg-white/10" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 backdrop-blur-sm">
            <span className="text-lg font-bold tabular-nums tracking-tight" style={{ color, textShadow: `0 0 20px ${color}` }}>
              {value}
            </span>
          </div>
        </div>

        <div className="absolute top-[3px] left-[3px] right-[60%] bottom-[60%] rounded-tl-lg bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-2">
        {icon && (
          <span className="text-[9px] transition-all duration-300 group-hover:scale-110" style={{ color: `${color}60` }}>
            {icon}
          </span>
        )}
        <span className="text-[9px] uppercase tracking-[0.15em] transition-colors duration-300" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </span>
      </div>
    </div>
  )
}

interface PredictionDisplayProps {
  prediction: PredictionData['prediction']
  albumAudio: PredictionData['albumAudio']
  streak: number
}

export function PredictionDisplay({ prediction, albumAudio, streak }: PredictionDisplayProps) {
  if (!prediction) return null

  const confidenceAngle = (prediction.confidence / 100) * 360
  const breatheIntensity = prediction.confidence > 60 ? 'animate-pulse' : ''

  return (
    <div className="relative mb-6 group">
      <div
        className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.12), transparent 60%)' }}
      />
      <div
        className="absolute -inset-2 rounded-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 blur-xl pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(34, 211, 238, 0.1), transparent 50%)' }}
      />

      <div className="relative p-6 rounded-2xl bg-gradient-to-b from-[#0c0c0c] to-[#080808] border border-white/[0.04] overflow-hidden">
        {/* DNA Helix decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-8 opacity-[0.04] pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 32 200" preserveAspectRatio="xMidYMid slice">
            <path d="M16 0 Q32 25 16 50 Q0 75 16 100 Q32 125 16 150 Q0 175 16 200" fill="none" stroke="url(#helixGradient)" strokeWidth="1" />
            <path d="M16 0 Q0 25 16 50 Q32 75 16 100 Q0 125 16 150 Q32 175 16 200" fill="none" stroke="url(#helixGradient)" strokeWidth="1" />
            {[25, 75, 125, 175].map(y => (
              <line key={y} x1="8" y1={y} x2="24" y2={y} stroke="rgba(34, 211, 238, 0.3)" strokeWidth="0.5" />
            ))}
            <defs>
              <linearGradient id="helixGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 4px)' }} />

        <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-[1px] bg-gradient-to-r from-cyan-500/40 to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-6 bg-gradient-to-b from-cyan-500/40 to-transparent" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Confidence Ring */}
            <div className={`relative w-14 h-14 ${breatheIntensity}`} style={{ animationDuration: '3s' }}>
              <div className="absolute -inset-1 rounded-full opacity-30 blur-sm" style={{ background: `conic-gradient(from 0deg, #8b5cf6, #22d3ee ${prediction.confidence}%, transparent ${prediction.confidence}%)` }} />
              <svg className="w-14 h-14 -rotate-90 relative" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke="url(#confidenceGradientEnhanced)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(confidenceAngle / 360) * 138} 138`}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.4))' }}
                />
                <defs>
                  <linearGradient id="confidenceGradientEnhanced" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-sm font-semibold text-white/80 tabular-nums tracking-tight">{prediction.confidence}</span>
                  <span className="text-[8px] text-white/40 block -mt-0.5">%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] tracking-[0.3em] uppercase text-white/25 font-medium">Predicted</span>
                {prediction.confidence >= 75 && (
                  <span className="text-[7px] px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400/70 uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Locked In
                  </span>
                )}
                {prediction.confidence < 35 && (
                  <span className="text-[7px] px-1.5 py-0.5 rounded-sm bg-violet-500/10 text-violet-400/70 uppercase tracking-wider border border-violet-500/20">
                    Calibrating
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-bold tabular-nums tracking-tighter"
                  style={{
                    background: 'linear-gradient(135deg, #22d3ee 0%, #8b5cf6 50%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.2))',
                  }}
                >
                  {prediction.rating.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/15 tabular-nums leading-none">
                    ±{((prediction.ratingRange.max - prediction.ratingRange.min) / 2).toFixed(1)}
                  </span>
                  <span className="text-[7px] text-white/10 uppercase tracking-wider">range</span>
                </div>
              </div>
            </div>
          </div>

          {streak > 0 && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ffd700]/[0.06] border border-[#ffd700]/10">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffd700]" style={{ boxShadow: '0 0 8px #ffd700' }} />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#ffd700] animate-ping opacity-50" />
                </div>
                <span className="text-base font-semibold text-[#ffd700]/90 tabular-nums tracking-tight">{streak}</span>
              </div>
              <span className="text-[7px] text-[#ffd700]/30 uppercase tracking-widest">streak</span>
            </div>
          )}
        </div>

        {/* Reasoning */}
        {prediction.reasoning.length > 0 && (
          <div className="relative mb-5 pl-4 py-2">
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
              style={{
                background: 'linear-gradient(180deg, #8b5cf6 0%, #22d3ee 50%, transparent 100%)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)',
              }}
            />
            <p className="text-[11px] text-white/40 leading-relaxed italic">
              &quot;{prediction.reasoning[0]}&quot;
            </p>
          </div>
        )}

        {/* Audio Spectrum */}
        {albumAudio && (
          <div className="grid grid-cols-4 gap-4 mb-5">
            <AudioFeatureBar label="Energy" value={albumAudio.energy} color="#22d3ee" icon="◇" />
            <AudioFeatureBar label="Mood" value={albumAudio.valence} color="#a855f7" icon="◈" />
            <AudioFeatureBar label="Dance" value={albumAudio.danceability} color="#ffd700" icon="◉" />
            <AudioFeatureBar label="Organic" value={albumAudio.acousticness} color="#10b981" icon="◎" />
          </div>
        )}

        {/* Suggested Vibes */}
        {prediction.suggestedVibes.length > 0 && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.03]">
            <span className="text-[8px] text-white/15 uppercase tracking-[0.2em]">Vibes</span>
            <div className="flex flex-wrap gap-2">
              {prediction.suggestedVibes.slice(0, 3).map((vibe, i) => (
                <span
                  key={vibe}
                  className="text-[9px] px-2.5 py-1 rounded-md text-white/45 uppercase tracking-wider border border-white/[0.05] hover:border-cyan-500/30 hover:text-cyan-400/80 transition-all duration-300 cursor-default"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)',
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {vibe.replace('_', '-')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
