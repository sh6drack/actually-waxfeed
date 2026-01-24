"use client"

import React from "react"
import { SCORE_LEVELS, getScoreLevel } from "./types"

interface PolarityScoreProps {
  score: number
  signatureStrength?: number
  patternDiversity?: number
  consolidationScore?: number
  uniquenessScore?: number
  engagementDepth?: number
  className?: string
  showBreakdown?: boolean
}

// Component weights for the formula
const COMPONENT_WEIGHTS = {
  signatureStrength: 0.25,
  patternDiversity: 0.20,
  consolidationScore: 0.20,
  uniquenessScore: 0.20,
  engagementDepth: 0.15,
} as const

const COMPONENT_LABELS: Record<keyof typeof COMPONENT_WEIGHTS, { label: string; description: string }> = {
  signatureStrength: { label: "Signature Strength", description: "Network activation clarity" },
  patternDiversity: { label: "Pattern Diversity", description: "Number of detected patterns" },
  consolidationScore: { label: "Consolidation", description: "Taste stability" },
  uniquenessScore: { label: "Uniqueness", description: "Deviation from typical" },
  engagementDepth: { label: "Engagement Depth", description: "Review depth & length" },
}

function ScoreRow({
  label,
  value,
  weight,
  description,
}: {
  label: string
  value: number
  weight: number
  description: string
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/70">{label}</span>
        <span className="text-[9px] text-muted-foreground">{"\u00d7"}{weight}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1 bg-border overflow-hidden">
          <div
            className="h-full bg-foreground"
            style={{ width: `${value * 100}%` }}
          />
        </div>
        <span className="w-8 text-right text-muted-foreground">{Math.round(value * 100)}</span>
      </div>
    </div>
  )
}

export function PolarityScore({
  score,
  signatureStrength,
  patternDiversity,
  consolidationScore,
  uniquenessScore,
  engagementDepth,
  className = "",
  showBreakdown = true,
}: PolarityScoreProps): React.ReactElement {
  const level = getScoreLevel(score)
  const displayScore = Math.round(score * 100)

  const components = {
    signatureStrength,
    patternDiversity,
    consolidationScore,
    uniquenessScore,
    engagementDepth,
  }

  return (
    <div className={`border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Polarity Score 2.0
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Identity strength metric
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold" style={{ color: level.color }}>
            {displayScore}
          </p>
          <p className="text-xs" style={{ color: level.color }}>
            {level.label}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-border overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${displayScore}%`, backgroundColor: level.color }}
          />
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">{level.description}</p>
      </div>

      {showBreakdown && (
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
            Formula Components
          </p>
          <div className="space-y-2 text-xs">
            {(Object.keys(COMPONENT_WEIGHTS) as Array<keyof typeof COMPONENT_WEIGHTS>).map(key => {
              const value = components[key]
              if (value === undefined) return null

              const { label, description } = COMPONENT_LABELS[key]
              return (
                <ScoreRow
                  key={key}
                  label={label}
                  value={value}
                  weight={COMPONENT_WEIGHTS[key]}
                  description={description}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          Score Interpretation
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SCORE_LEVELS.map((lvl, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ backgroundColor: lvl.color }} />
              <span className="text-xs text-muted-foreground">
                {lvl.threshold * 100}+ {"\u2014"} {lvl.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PolarityScoreBadge({ score, className = "" }: { score: number; className?: string }): React.ReactElement {
  const level = getScoreLevel(score)
  const displayScore = Math.round(score * 100)

  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 border ${className}`}
      style={{ borderColor: level.color }}
    >
      <span className="text-xs font-bold" style={{ color: level.color }}>
        {displayScore}
      </span>
      <span className="text-[10px] text-muted-foreground">{level.label}</span>
    </span>
  )
}

export function calculatePolarityScore({
  signatureStrength,
  patternDiversity,
  consolidationScore,
  uniquenessScore,
  engagementDepth,
}: {
  signatureStrength: number
  patternDiversity: number
  consolidationScore: number
  uniquenessScore: number
  engagementDepth: number
}): number {
  return (
    signatureStrength * COMPONENT_WEIGHTS.signatureStrength +
    patternDiversity * COMPONENT_WEIGHTS.patternDiversity +
    consolidationScore * COMPONENT_WEIGHTS.consolidationScore +
    uniquenessScore * COMPONENT_WEIGHTS.uniquenessScore +
    engagementDepth * COMPONENT_WEIGHTS.engagementDepth
  )
}
