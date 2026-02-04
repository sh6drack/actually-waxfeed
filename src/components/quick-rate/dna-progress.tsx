'use client'

import { DNAIcon } from './icons'

interface DecipherProgressBarProps {
  decipherProgress: number
  currentStreak: number
  totalPredictions: number
}

export function DecipherProgressBar({
  decipherProgress,
  currentStreak,
  totalPredictions,
}: DecipherProgressBarProps) {
  const signalBars = Array.from({ length: 24 }, (_, i) => {
    const baseHeight = Math.sin(i * 0.5) * 0.3 + 0.5
    const progress = decipherProgress / 100
    const activation = i < Math.floor(progress * 24) ? 1 : (i === Math.floor(progress * 24) ? progress * 24 % 1 : 0.15)
    return baseHeight * activation
  })

  return (
    <div className="relative group">
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1))' }}
      />

      <div className="relative p-4 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-white/[0.06]">
                <DNAIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium">Audio DNA</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-semibold tabular-nums" style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {decipherProgress}%
                  </span>
                  <span className="text-[10px] text-white/25">mapped</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-pulse" />
                  <span className="text-[10px] font-medium text-[#ffd700] tabular-nums">{currentStreak}</span>
                </div>
              )}
              {totalPredictions > 0 && (
                <span className="text-[10px] text-white/20 tabular-nums">{totalPredictions} reads</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-[2px] h-8 mb-2">
            {signalBars.map((height, i) => {
              const isActive = i < Math.floor(decipherProgress / 100 * 24)
              const isEdge = i === Math.floor(decipherProgress / 100 * 24)
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: `${Math.max(height * 100, 10)}%`,
                    background: isActive
                      ? 'linear-gradient(to top, rgba(139, 92, 246, 0.8), rgba(34, 211, 238, 0.8))'
                      : isEdge
                        ? 'linear-gradient(to top, rgba(139, 92, 246, 0.4), rgba(34, 211, 238, 0.4))'
                        : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: isActive ? '0 0 8px rgba(34, 211, 238, 0.3)' : 'none',
                  }}
                />
              )
            })}
          </div>

          <div className="relative h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${decipherProgress}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
              }}
            />
            <div
              className="absolute inset-y-0 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AudioDNAOnboarding() {
  return (
    <div className="relative group">
      <div
        className="absolute inset-0 rounded-2xl blur-xl animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(34, 211, 238, 0.08))',
        }}
      />

      <div className="relative p-4 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/15 flex items-center justify-center border border-white/[0.06]">
              <svg
                className="w-4 h-4 text-violet-400/70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ animation: 'spin 20s linear infinite' }}
              >
                <path d="M12 2v20M4 6c4 0 4 4 8 4s4-4 8-4M4 18c4 0 4-4 8-4s4 4 8 4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium">Audio DNA</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-medium text-white/50">Awaiting First Read</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[2px] h-8 mb-2">
            {Array.from({ length: 24 }, (_, i) => {
              const baseHeight = Math.sin(i * 0.5) * 0.2 + 0.15
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-1000"
                  style={{
                    height: `${Math.max(baseHeight * 100, 10)}%`,
                    background: 'rgba(139, 92, 246, 0.15)',
                    animation: `pulse 2s ease-in-out ${i * 0.08}s infinite`,
                  }}
                />
              )
            })}
          </div>

          <div className="relative h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="absolute inset-y-0 w-8 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
                animation: 'scanLine 3s ease-in-out infinite',
              }}
            />
          </div>

          <p className="text-[10px] text-white/20 mt-3 text-center">
            Rate your first album to begin building your taste profile
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(calc(100vw / 2)); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function MobileAudioDNAOnboarding() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-white/[0.05]">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/15 flex items-center justify-center flex-shrink-0 animate-pulse">
        <DNAIcon className="w-3.5 h-3.5 text-violet-400/50" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] tracking-wider uppercase text-white/25">Audio DNA</span>
          <span className="text-[10px] text-violet-400/50 flex items-center gap-1">
            Initializing
            <span className="flex gap-0.5">
              <span className="w-0.5 h-0.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 h-0.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="w-0.5 h-0.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '200ms' }} />
            </span>
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden relative">
          <div
            className="absolute inset-y-0 w-4 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
              animation: 'scanLineMobile 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLineMobile {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(calc(100% + 4rem)); }
        }
      `}</style>
    </div>
  )
}

interface MobileDecipherProgressProps {
  decipherProgress: number
  currentStreak: number
}

export function MobileDecipherProgress({ decipherProgress, currentStreak }: MobileDecipherProgressProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-white/[0.05]">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/15 flex items-center justify-center flex-shrink-0">
        <DNAIcon className="w-3.5 h-3.5 text-cyan-400/70" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] tracking-wider uppercase text-white/25">Audio DNA</span>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold tabular-nums"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {decipherProgress}%
            </span>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ffd700]/10">
                <div className="w-1 h-1 rounded-full bg-[#ffd700] animate-pulse" />
                <span className="text-[9px] text-[#ffd700]/80 tabular-nums">{currentStreak}</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${decipherProgress}%`,
              background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
