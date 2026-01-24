"use client"

// TasteID Taste Consolidation - tracks "sticky" vs "fading" tastes
// Inspired by memory consolidation in neuroscience

export type ConsolidationTrend = "strengthening" | "fading" | "stable"

interface ConsolidatedTaste {
  name: string
  type: "genre" | "artist"
  trend: ConsolidationTrend
  recentAvg: number
  olderAvg: number
  totalReviews: number
}

interface TasteConsolidationProps {
  consolidatedTastes: ConsolidatedTaste[]
  className?: string
}

const TREND_COLORS = {
  strengthening: "#22c55e", // green
  fading: "#f87171", // red
  stable: "#60a5fa", // blue
}

const TREND_LABELS = {
  strengthening: "↑ STRENGTHENING",
  fading: "↓ FADING",
  stable: "→ STABLE",
}

export function TasteConsolidation({ consolidatedTastes, className = "" }: TasteConsolidationProps) {
  const genres = consolidatedTastes.filter(t => t.type === "genre")
  const artists = consolidatedTastes.filter(t => t.type === "artist")

  return (
    <div className={className}>
      <div className="mb-4">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
          Taste Consolidation
        </p>
        <p className="text-xs text-muted-foreground/70">
          Tracking which tastes are "sticking" vs "fading" over time
        </p>
      </div>

      {/* How it works */}
      <div className="mb-6 p-3 border border-border bg-muted/10">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">How it works</p>
        <p className="text-xs text-muted-foreground/70">
          Reviews are split into recent (last 6 months) and older. Genres and artists
          that appear consistently with good ratings are "consolidated."
        </p>
        <div className="flex gap-4 mt-3">
          {(["strengthening", "fading", "stable"] as ConsolidationTrend[]).map(trend => (
            <span
              key={trend}
              className="text-[9px] font-bold"
              style={{ color: TREND_COLORS[trend] }}
            >
              {TREND_LABELS[trend]}
            </span>
          ))}
        </div>
      </div>

      {/* Consolidated Genres */}
      {genres.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold mb-3">Genres</p>
          <div className="space-y-2">
            {genres.map((taste, i) => (
              <ConsolidationRow key={i} taste={taste} />
            ))}
          </div>
        </div>
      )}

      {/* Consolidated Artists */}
      {artists.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-3">Artists</p>
          <div className="space-y-2">
            {artists.map((taste, i) => (
              <ConsolidationRow key={i} taste={taste} />
            ))}
          </div>
        </div>
      )}

      {consolidatedTastes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Not enough data yet</p>
          <p className="text-xs mt-1">Review more albums across different time periods</p>
        </div>
      )}

      {/* Thresholds explanation */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          Consolidation Thresholds
        </p>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <span className="text-muted-foreground">≥2</span>
          <span className="text-muted-foreground/70">Reviews per period for genre</span>
          <span className="text-muted-foreground">≥3</span>
          <span className="text-muted-foreground/70">Total reviews for artist</span>
          <span className="text-muted-foreground">≥6</span>
          <span className="text-muted-foreground/70">Avg rating for consolidated</span>
          <span className="text-muted-foreground">±0.5</span>
          <span className="text-muted-foreground/70">Rating diff for trend</span>
        </div>
      </div>
    </div>
  )
}

function ConsolidationRow({ taste }: { taste: ConsolidatedTaste }) {
  const color = TREND_COLORS[taste.trend]
  const diff = taste.recentAvg - taste.olderAvg

  return (
    <div className="flex items-center justify-between p-2 border border-border">
      <div className="flex items-center gap-3">
        <span
          className="text-[9px] font-bold w-24"
          style={{ color }}
        >
          {TREND_LABELS[taste.trend]}
        </span>
        <span className="text-sm font-medium">{taste.name}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Recent: {taste.recentAvg.toFixed(1)}</span>
        <span>Older: {taste.olderAvg.toFixed(1)}</span>
        <span style={{ color: diff > 0 ? "#22c55e" : diff < 0 ? "#f87171" : "#60a5fa" }}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

// Compact summary of consolidation status
export function ConsolidationSummary({
  strengthening,
  fading,
  stable
}: {
  strengthening: number
  fading: number
  stable: number
}) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span style={{ color: TREND_COLORS.strengthening }}>
        ↑ {strengthening}
      </span>
      <span style={{ color: TREND_COLORS.stable }}>
        → {stable}
      </span>
      <span style={{ color: TREND_COLORS.fading }}>
        ↓ {fading}
      </span>
    </div>
  )
}
