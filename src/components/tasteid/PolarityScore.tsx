"use client"

// TasteID Polarity Score 2.0
// The enhanced Polarity Score combines multiple dimensions into a single identity strength metric

interface PolarityScoreProps {
  score: number // 0-1
  signatureStrength?: number
  patternDiversity?: number
  consolidationScore?: number
  uniquenessScore?: number
  engagementDepth?: number
  className?: string
  showBreakdown?: boolean
}

// Score interpretation thresholds from the doc
const SCORE_LEVELS = [
  { threshold: 0.8, label: "Highly Distinct", description: "Unmistakable listening identity", color: "#22c55e" },
  { threshold: 0.6, label: "Well-Defined", description: "Clear patterns and preferences", color: "#60a5fa" },
  { threshold: 0.4, label: "Emerging", description: "Patterns forming, more data helpful", color: "#fbbf24" },
  { threshold: 0, label: "Nascent", description: "Early stage, keep reviewing", color: "#a78bfa" },
]

function getScoreLevel(score: number) {
  return SCORE_LEVELS.find(level => score >= level.threshold) || SCORE_LEVELS[SCORE_LEVELS.length - 1]
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
}: PolarityScoreProps) {
  const level = getScoreLevel(score)
  const displayScore = Math.round(score * 100)

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

      {/* Score bar */}
      <div className="mb-4">
        <div className="h-2 bg-border overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${displayScore}%`,
              backgroundColor: level.color,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">{level.description}</p>
      </div>

      {/* Score breakdown */}
      {showBreakdown && (
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
            Formula Components
          </p>
          <div className="space-y-2 text-xs">
            {signatureStrength !== undefined && (
              <ScoreRow
                label="Signature Strength"
                value={signatureStrength}
                weight={0.25}
                description="Network activation clarity"
              />
            )}
            {patternDiversity !== undefined && (
              <ScoreRow
                label="Pattern Diversity"
                value={patternDiversity}
                weight={0.20}
                description="Number of detected patterns"
              />
            )}
            {consolidationScore !== undefined && (
              <ScoreRow
                label="Consolidation"
                value={consolidationScore}
                weight={0.20}
                description="Taste stability"
              />
            )}
            {uniquenessScore !== undefined && (
              <ScoreRow
                label="Uniqueness"
                value={uniquenessScore}
                weight={0.20}
                description="Deviation from typical"
              />
            )}
            {engagementDepth !== undefined && (
              <ScoreRow
                label="Engagement Depth"
                value={engagementDepth}
                weight={0.15}
                description="Review depth & length"
              />
            )}
          </div>
        </div>
      )}

      {/* Score interpretation legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          Score Interpretation
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SCORE_LEVELS.map((lvl, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2 h-2"
                style={{ backgroundColor: lvl.color }}
              />
              <span className="text-xs text-muted-foreground">
                {lvl.threshold * 100}+ — {lvl.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/70">{label}</span>
        <span className="text-[9px] text-muted-foreground">×{weight}</span>
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

// Compact inline Polarity Score
export function PolarityScoreBadge({ score, className = "" }: { score: number, className?: string }) {
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

// Calculate Polarity Score 2.0 from components
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
    (signatureStrength * 0.25) +
    (patternDiversity * 0.20) +
    (consolidationScore * 0.20) +
    (uniquenessScore * 0.20) +
    (engagementDepth * 0.15)
  )
}
