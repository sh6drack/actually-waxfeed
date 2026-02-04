'use client'

import { useState, useEffect, useCallback } from 'react'
import { StreakBadge } from './prediction-display'
import type { PredictionResult } from './types'

interface PredictionCelebrationProps {
  result: PredictionResult
  onClose: () => void
}

export function PredictionCelebration({ result, onClose }: PredictionCelebrationProps) {
  const [isExiting, setIsExiting] = useState(false)

  const isPerfect = result.result.perfect
  const isClose = result.celebration?.type === 'close'
  const isMiss = result.celebration?.type === 'miss'
  const isMatch = result.result.match
  const isSurprise = result.result.surprise
  const isFirstPrediction = result.isFirstPrediction

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(onClose, 300)
  }, [onClose])

  if (!isMatch && !isSurprise && !isMiss) return null

  const celebrationLabel = isPerfect
    ? `Perfect prediction! Predicted ${result.predictedRating?.toFixed(1)}, you rated ${result.actualRating?.toFixed(1)}`
    : isClose
    ? `Close prediction! Predicted ${result.predictedRating?.toFixed(1)}, you rated ${result.actualRating?.toFixed(1)}`
    : isSurprise
    ? `Surprise! Predicted ${result.predictedRating?.toFixed(1)}, you rated ${result.actualRating?.toFixed(1)}. Learning from this`
    : isMiss
    ? `Prediction miss. Adjusting parameters`
    : `Prediction result. Predicted ${result.predictedRating?.toFixed(1)}, you rated ${result.actualRating?.toFixed(1)}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={celebrationLabel}
      aria-live="polite"
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-300 ${
        isExiting ? 'opacity-0 scale-105' : 'animate-in fade-in duration-200'
      }`}
      onClick={handleClose}
    >
      <div className={`absolute inset-0 bg-black/95 transition-opacity duration-300 ${isExiting ? 'opacity-0' : ''}`}>
        <div
          className={`absolute inset-0 ${isMatch && !isMiss ? 'animate-pulse' : ''}`}
          style={{
            background: isPerfect
              ? 'radial-gradient(circle at center, rgba(255, 215, 0, 0.15) 0%, transparent 50%)'
              : isClose
              ? 'radial-gradient(circle at center, rgba(34, 211, 238, 0.12) 0%, rgba(255, 215, 0, 0.05) 30%, transparent 50%)'
              : isMiss
              ? 'radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 40%)'
              : isMatch
              ? 'radial-gradient(circle at center, rgba(34, 211, 238, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)' }}
        />
      </div>

      <div className="relative text-center p-6 sm:p-12 max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {isFirstPrediction && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-400/30 animate-in slide-in-from-top duration-500">
            <span
              className="text-[9px] font-medium uppercase tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              First Read
            </span>
          </div>
        )}

        {isPerfect ? (
          <PerfectCelebration result={result} />
        ) : isClose ? (
          <CloseCelebration result={result} />
        ) : isMatch ? (
          <MatchCelebration result={result} />
        ) : isSurprise ? (
          <SurpriseCelebration result={result} />
        ) : isMiss ? (
          <MissCelebration result={result} />
        ) : null}

        {result.decipherUpdate?.decipherMessage && (
          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v20M4 6c4 0 4 4 8 4s4-4 8-4M4 18c4 0 4-4 8-4s4 4 8 4" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xs text-white/40">{result.decipherUpdate.decipherMessage}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${result.decipherUpdate.newProgress}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
                  }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums">{result.decipherUpdate.newProgress}%</span>
            </div>
          </div>
        )}

        <p className="absolute bottom-4 left-0 right-0 text-[10px] text-white/15 uppercase tracking-widest">
          Tap to continue
        </p>
      </div>
    </div>
  )
}

function PerfectCelebration({ result }: { result: PredictionResult }) {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 w-28 h-28 mx-auto -mt-2 rounded-full border border-[#ffd700]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-[#ffd700]/30 animate-ping" style={{ animationDuration: '1s' }} />
        <div
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
            boxShadow: '0 0 80px rgba(255, 215, 0, 0.4), inset 0 0 40px rgba(255, 215, 0, 0.15)',
          }}
        >
          <svg className="w-12 h-12 text-[#ffd700]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" className="opacity-30" />
            <circle cx="12" cy="12" r="6" className="opacity-50" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <line x1="12" y1="1" x2="12" y2="5" strokeWidth={1.5} className="opacity-60" />
            <line x1="12" y1="19" x2="12" y2="23" strokeWidth={1.5} className="opacity-60" />
            <line x1="1" y1="12" x2="5" y2="12" strokeWidth={1.5} className="opacity-60" />
            <line x1="19" y1="12" x2="23" y2="12" strokeWidth={1.5} className="opacity-60" />
          </svg>
        </div>
      </div>

      <p className="text-[10px] tracking-[0.4em] uppercase text-[#ffd700]/60 mb-2">Bullseye</p>
      <h3 className="text-3xl font-bold mb-3" style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        PERFECT
      </h3>

      {result.predictedRating !== undefined && result.actualRating !== undefined && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Predicted</span>
            <span className="text-lg font-bold text-[#ffd700] tabular-nums">{result.predictedRating.toFixed(1)}</span>
          </div>
          <div className="text-[#ffd700]/50">=</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
            <span className="text-lg font-bold text-[#ffd700] tabular-nums">{result.actualRating.toFixed(1)}</span>
          </div>
        </div>
      )}

      <p className="text-white/50 text-sm mb-6">{result.celebration?.message || 'Exact prediction!'}</p>

      {result.streakUpdate.newStreak > 0 && (
        <StreakBadge streak={result.streakUpdate.newStreak} isNewMilestone={result.streakUpdate.isNewMilestone} streakMessage={result.streakUpdate.streakMessage} size="large" />
      )}
    </>
  )
}

function CloseCelebration({ result }: { result: PredictionResult }) {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 w-26 h-26 mx-auto -mt-1 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: '1.2s' }} />
        <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-[#ffd700]/25 animate-ping" style={{ animationDuration: '1s' }} />
        <div
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, rgba(255, 215, 0, 0.1) 60%, transparent 70%)',
            boxShadow: '0 0 70px rgba(34, 211, 238, 0.3), 0 0 40px rgba(255, 215, 0, 0.15), inset 0 0 35px rgba(34, 211, 238, 0.1)',
          }}
        >
          <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke="url(#closeGradient)" strokeWidth={2}>
            <defs>
              <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" className="opacity-30" />
            <circle cx="12" cy="12" r="6" className="opacity-60" />
            <circle cx="12" cy="12" r="2" fill="url(#closeGradient)" />
          </svg>
        </div>
      </div>

      <p className="text-[10px] tracking-[0.4em] uppercase text-cyan-400/50 mb-2">Almost There</p>
      <h3 className="text-3xl font-bold mb-3" style={{ background: 'linear-gradient(135deg, #22d3ee, #ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        SO CLOSE
      </h3>

      {result.predictedRating !== undefined && result.actualRating !== undefined && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Predicted</span>
            <span className="text-lg font-bold text-cyan-400 tabular-nums">{result.predictedRating.toFixed(1)}</span>
          </div>
          <div className="text-[#ffd700]/60">≈</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
            <span className="text-lg font-bold text-[#ffd700] tabular-nums">{result.actualRating.toFixed(1)}</span>
          </div>
        </div>
      )}

      <p className="text-white/45 text-sm mb-6">{result.celebration?.message || 'Nearly nailed it!'}</p>

      {result.streakUpdate.newStreak > 0 && (
        <StreakBadge streak={result.streakUpdate.newStreak} isNewMilestone={result.streakUpdate.isNewMilestone} streakMessage={result.streakUpdate.streakMessage} size="medium" />
      )}
    </>
  )
}

function MatchCelebration({ result }: { result: PredictionResult }) {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-cyan-400/30 animate-ping" />
        <div
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
            boxShadow: '0 0 60px rgba(34, 211, 238, 0.3), inset 0 0 30px rgba(34, 211, 238, 0.1)',
          }}
        >
          <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" className="opacity-30" />
            <circle cx="12" cy="12" r="6" className="opacity-50" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>

      <p className="text-[10px] tracking-[0.4em] uppercase text-cyan-400/50 mb-2">Taste Match</p>
      <h3 className="text-3xl font-bold mb-3" style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        PREDICTED
      </h3>

      {result.predictedRating !== undefined && result.actualRating !== undefined && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Predicted</span>
            <span className="text-lg font-bold text-cyan-400 tabular-nums">{result.predictedRating.toFixed(1)}</span>
          </div>
          <div className="text-cyan-400/40">≈</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
            <span className="text-lg font-bold text-cyan-400 tabular-nums">{result.actualRating.toFixed(1)}</span>
          </div>
        </div>
      )}

      <p className="text-white/40 text-sm mb-6">{result.celebration?.message || 'We knew it!'}</p>

      {result.streakUpdate.newStreak > 0 && (
        <StreakBadge streak={result.streakUpdate.newStreak} isNewMilestone={result.streakUpdate.isNewMilestone} streakMessage={result.streakUpdate.streakMessage} size="medium" />
      )}
    </>
  )
}

function SurpriseCelebration({ result }: { result: PredictionResult }) {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 w-28 h-28 mx-auto -mt-2 rounded-full border border-purple-400/15 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 w-26 h-26 mx-auto -mt-1 rounded-full border border-pink-400/10 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 70%)',
            boxShadow: '0 0 70px rgba(168, 85, 247, 0.35), 0 0 40px rgba(236, 72, 153, 0.15), inset 0 0 30px rgba(168, 85, 247, 0.1)',
          }}
        >
          <svg className="w-11 h-11 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8L12 2Z" strokeLinejoin="round" className="animate-pulse" />
          </svg>
        </div>
      </div>

      <p className="text-[10px] tracking-[0.4em] uppercase text-purple-400/50 mb-2">Plot Twist</p>
      <h3 className="text-3xl font-bold mb-3" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        SURPRISE
      </h3>

      {result.predictedRating !== undefined && result.actualRating !== undefined && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Expected</span>
            <span className="text-lg font-bold text-purple-400/50 tabular-nums line-through">{result.predictedRating.toFixed(1)}</span>
          </div>
          <div className="text-pink-400/50">→</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
            <span className="text-lg font-bold text-purple-400 tabular-nums">{result.actualRating.toFixed(1)}</span>
          </div>
        </div>
      )}

      <p className="text-white/45 text-sm mb-5">{result.celebration?.message || 'You defied our prediction!'}</p>

      <div className="inline-flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-400/20">
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 w-4 h-4 border-2 border-purple-400/30 rounded-full" />
            <div className="absolute inset-0 w-4 h-4 border-2 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <span className="text-[10px] text-purple-400/70 uppercase tracking-wider">Recalibrating</span>
        </div>
        <p className="text-[10px] text-white/25">Learning from this edge case</p>
      </div>
    </>
  )
}

function MissCelebration({ result }: { result: PredictionResult }) {
  return (
    <>
      <div className="relative mb-5">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/10"
          style={{ background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)' }}
        >
          <svg className="w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" className="opacity-40" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 mb-2">Recalibrating</p>
      <h3 className="text-2xl font-semibold mb-3 text-white/50">Off Target</h3>

      {result.predictedRating !== undefined && result.actualRating !== undefined && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/20 uppercase tracking-wider">Predicted</span>
            <span className="text-base font-medium text-white/30 tabular-nums">{result.predictedRating.toFixed(1)}</span>
          </div>
          <div className="text-white/15">≠</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/20 uppercase tracking-wider">Actual</span>
            <span className="text-base font-medium text-white/50 tabular-nums">{result.actualRating.toFixed(1)}</span>
          </div>
        </div>
      )}

      <p className="text-white/30 text-sm mb-4">{result.celebration?.message || 'Adjusting parameters'}</p>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <span className="text-[9px] text-white/25 uppercase tracking-wider">Learning</span>
      </div>
    </>
  )
}
