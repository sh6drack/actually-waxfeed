"use client"

import React from "react"
import { TREND_COLORS, getTrendDisplay } from "./types"

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

function ConsolidationRow({ taste }: { taste: ConsolidatedTaste }): React.ReactElement {
  const color = TREND_COLORS[taste.trend]
  const diff = taste.recentAvg - taste.olderAvg
  const diffColor = diff > 0 ? TREND_COLORS.strengthening : diff < 0 ? TREND_COLORS.fading : TREND_COLORS.stable

  return (
    <div className="flex items-center justify-between p-2 border border-border">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-bold w-24" style={{ color }}>
          {getTrendDisplay(taste.trend)}
        </span>
        <span className="text-sm font-medium">{taste.name}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Recent: {taste.recentAvg.toFixed(1)}</span>
        <span>Older: {taste.olderAvg.toFixed(1)}</span>
        <span style={{ color: diffColor }}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

function TasteSection({
  title,
  tastes,
}: {
  title: string
  tastes: ConsolidatedTaste[]
}): React.ReactElement | null {
  if (tastes.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-xs font-bold mb-3">{title}</p>
      <div className="space-y-2">
        {tastes.map((taste, i) => (
          <ConsolidationRow key={i} taste={taste} />
        ))}
      </div>
    </div>
  )
}

export function TasteConsolidation({ consolidatedTastes, className = "" }: TasteConsolidationProps): React.ReactElement {
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

      <div className="mb-6 p-3 border border-border bg-muted/10">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">How it works</p>
        <p className="text-xs text-muted-foreground/70">
          Reviews are split into recent (last 6 months) and older. Genres and artists
          that appear consistently with good ratings are "consolidated."
        </p>
        <div className="flex gap-4 mt-3">
          {(["strengthening", "fading", "stable"] as const).map(trend => (
            <span
              key={trend}
              className="text-[9px] font-bold"
              style={{ color: TREND_COLORS[trend] }}
            >
              {getTrendDisplay(trend)}
            </span>
          ))}
        </div>
      </div>

      <TasteSection title="Genres" tastes={genres} />
      <TasteSection title="Artists" tastes={artists} />

      {consolidatedTastes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Not enough data yet</p>
          <p className="text-xs mt-1">Review more albums across different time periods</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          Consolidation Thresholds
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
          <span className="text-muted-foreground">{"\u2265"}2</span>
          <span className="text-muted-foreground/70">Reviews per period for genre</span>
          <span className="text-muted-foreground">{"\u2265"}3</span>
          <span className="text-muted-foreground/70">Total reviews for artist</span>
          <span className="text-muted-foreground">{"\u2265"}6</span>
          <span className="text-muted-foreground/70">Avg rating for consolidated</span>
          <span className="text-muted-foreground">{"\u00b1"}0.5</span>
          <span className="text-muted-foreground/70">Rating diff for trend</span>
        </div>
      </div>
    </div>
  )
}

export function ConsolidationSummary({
  strengthening,
  fading,
  stable,
}: {
  strengthening: number
  fading: number
  stable: number
}): React.ReactElement {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span style={{ color: TREND_COLORS.strengthening }}>
        {"\u2191"} {strengthening}
      </span>
      <span style={{ color: TREND_COLORS.stable }}>
        {"\u2192"} {stable}
      </span>
      <span style={{ color: TREND_COLORS.fading }}>
        {"\u2193"} {fading}
      </span>
    </div>
  )
}
