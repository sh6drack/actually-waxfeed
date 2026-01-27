"use client"

import Link from "next/link"
import { ArchetypeBadge } from "./ArchetypeBadge"
import { GenreRadarChart } from "./GenreRadarChart"
import { getCurrentTier, getProgressToNextTier, TASTEID_TIERS } from "@/lib/tasteid-tiers"

interface TasteIDCardProps {
  username: string
  archetype: {
    id: string
    name: string
    icon: string
    description: string
  }
  secondaryArchetype?: {
    id: string
    name: string
    icon: string
  } | null
  topGenres: string[]
  topArtists: string[]
  genreVector?: Record<string, number>
  adventurenessScore: number
  polarityScore: number
  ratingSkew: string
  reviewCount: number
  averageRating: number
  compact?: boolean
  showRadar?: boolean
  linkToFull?: boolean
}

export function TasteIDCard({
  username,
  archetype,
  secondaryArchetype,
  topGenres,
  topArtists,
  genreVector,
  adventurenessScore,
  polarityScore,
  ratingSkew,
  reviewCount,
  averageRating,
  compact = false,
  showRadar = false,
  linkToFull = true,
}: TasteIDCardProps) {
  const content = (
    <div className="border-2 border-foreground bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            TASTEID
          </div>
          <ArchetypeBadge {...archetype} size="md" />
          {secondaryArchetype && (
            <div className="mt-1">
              <ArchetypeBadge {...secondaryArchetype} size="sm" />
            </div>
          )}
        </div>
        {showRadar && genreVector && Object.keys(genreVector).length >= 3 && (
          <GenreRadarChart genres={genreVector} size={100} showLabels={false} />
        )}
      </div>

      {/* Top Genres */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          TOP GENRES
        </div>
        <div className="flex flex-wrap gap-1">
          {topGenres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 text-xs border border-border text-foreground/80 uppercase"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Top Artists */}
      {!compact && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            DEFINING ARTISTS
          </div>
          <div className="text-sm text-muted-foreground">
            {topArtists.slice(0, 5).join(" · ")}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        <MetricBlock label="ADVENTURENESS" value={`${Math.round(adventurenessScore * 100)}%`} />
        <MetricBlock label="POLARITY" value={polarityScore.toFixed(2)} />
        <MetricBlock label="RATING STYLE" value={ratingSkew.toUpperCase()} />
        <MetricBlock label="AVG RATING" value={averageRating.toFixed(1)} />
      </div>

      {/* Tier Progress */}
      <TierProgressBar reviewCount={reviewCount} />

      {/* Footer */}
      <div className="pt-2 border-t border-border flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {reviewCount} reviews analyzed
        </span>
        {linkToFull && (
          <span className="text-xs text-foreground font-bold uppercase tracking-wider hover:underline">
            VIEW FULL →
          </span>
        )}
      </div>
    </div>
  )

  if (linkToFull) {
    return (
      <Link href={`/u/${username}/tasteid`} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
        {label}
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  )
}

function TierProgressBar({ reviewCount }: { reviewCount: number }) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(reviewCount)
  
  return (
    <div className="pt-3 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: currentTier.color }}>{currentTier.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: currentTier.color }}>
            {currentTier.name}
          </span>
        </div>
        {nextTier && (
          <span className="text-[10px] text-muted-foreground">
            {ratingsToNext} to {nextTier.icon} {nextTier.name}
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
          style={{ 
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})`
          }}
        />
        {/* Tier markers */}
        {TASTEID_TIERS.slice(1, -1).map((tier, i) => {
          const position = ((tier.minRatings - currentTier.minRatings) / (nextTier ? nextTier.minRatings - currentTier.minRatings : 100)) * 100
          if (position <= 0 || position >= 100) return null
          return (
            <div 
              key={tier.id}
              className="absolute top-0 bottom-0 w-0.5 bg-border"
              style={{ left: `${position}%` }}
            />
          )
        })}
      </div>
      
      {/* Mini tier icons */}
      <div className="flex justify-between">
        {TASTEID_TIERS.slice(1).map((tier) => {
          const isActive = tier.id === currentTier.id
          const isPast = tier.minRatings < currentTier.minRatings
          return (
            <div
              key={tier.id}
              className="text-center"
              style={{ opacity: isPast || isActive ? 1 : 0.3 }}
              title={`${tier.name}: ${tier.minRatings}+ ratings`}
            >
              <span className="text-[10px]">{tier.icon}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TasteIDCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-2 border-border bg-background p-4 space-y-4 animate-pulse">
      <div className="h-8 w-32 bg-muted" />
      <div className="flex gap-1">
        <div className="h-6 w-16 bg-muted" />
        <div className="h-6 w-16 bg-muted" />
        <div className="h-6 w-16 bg-muted" />
      </div>
      {!compact && <div className="h-4 w-full bg-muted" />}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        <div className="h-8 bg-muted" />
        <div className="h-8 bg-muted" />
        <div className="h-8 bg-muted" />
        <div className="h-8 bg-muted" />
      </div>
    </div>
  )
}
