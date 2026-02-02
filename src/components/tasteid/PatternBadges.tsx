"use client"

import React from "react"
import { PATTERN_CATEGORY_COLORS } from "./types"

// Pattern categories for organization
export type PatternCategory = "signature" | "rating" | "engagement"

// Pattern definition
interface Pattern {
  id: string
  name: string
  description: string
  category: PatternCategory
  minReviews: number
}

// TasteID Pattern Detection - patterns that unlock as users review more albums
export const TASTEID_PATTERNS: Record<string, Pattern> = {
  // Signature-Based Patterns
  DISCOVERY_COMFORT_OSCILLATION: {
    id: "discovery_comfort_oscillation",
    name: "Discovery\u2194Comfort Oscillation",
    description: "Healthy balance between exploring new music and returning to favorites",
    category: "signature",
    minReviews: 10,
  },
  DEEP_DIVE_SPRINTS: {
    id: "deep_dive_sprints",
    name: "Deep Dive Sprints",
    description: "Goes all-in on artists when something clicks",
    category: "signature",
    minReviews: 10,
  },
  NEW_RELEASE_HUNTER: {
    id: "new_release_hunter",
    name: "New Release Hunter",
    description: "Stays on top of current music as it drops",
    category: "signature",
    minReviews: 10,
  },
  EMOTIONAL_LISTENER: {
    id: "emotional_listener",
    name: "Emotional Listener",
    description: "Strong reactions reflected in rating variance",
    category: "signature",
    minReviews: 10,
  },

  // Rating Patterns
  CRITICAL_EAR: {
    id: "critical_ear",
    name: "Critical Ear",
    description: "Average rating below 5.5 \u2014 high standards",
    category: "rating",
    minReviews: 15,
  },
  MUSIC_OPTIMIST: {
    id: "music_optimist",
    name: "Music Optimist",
    description: "Average rating above 7.5 \u2014 finds joy everywhere",
    category: "rating",
    minReviews: 15,
  },
  POLARIZED_TASTE: {
    id: "polarized_taste",
    name: "Polarized Taste",
    description: "Bimodal ratings \u2014 loves it or hates it",
    category: "rating",
    minReviews: 20,
  },
  PERFECTION_SEEKER: {
    id: "perfection_seeker",
    name: "Perfection Seeker",
    description: "More 10s than near-perfect scores",
    category: "rating",
    minReviews: 15,
  },

  // Engagement Patterns
  CONTRARIAN: {
    id: "contrarian",
    name: "Contrarian",
    description: "Often differs 3+ points from consensus",
    category: "engagement",
    minReviews: 20,
  },
  HIDDEN_GEM_HUNTER: {
    id: "hidden_gem_hunter",
    name: "Hidden Gem Hunter",
    description: "High ratings for low-popularity albums",
    category: "engagement",
    minReviews: 15,
  },
  DISCOGRAPHY_COMPLETIONIST: {
    id: "discography_completionist",
    name: "Discography Completionist",
    description: "5+ albums from single artists",
    category: "engagement",
    minReviews: 20,
  },
  ARCHIVE_DIVER: {
    id: "archive_diver",
    name: "Archive Diver",
    description: "Average album age over 15 years",
    category: "engagement",
    minReviews: 15,
  },
}

export type PatternKey = keyof typeof TASTEID_PATTERNS

function getCategoryColor(category: PatternCategory): string {
  return PATTERN_CATEGORY_COLORS[category]
}

interface PatternBadgeProps {
  pattern: PatternKey
  unlocked?: boolean
  className?: string
}

export function PatternBadge({ pattern, unlocked = true, className = "" }: PatternBadgeProps): React.ReactElement {
  const patternData = TASTEID_PATTERNS[pattern]
  const color = getCategoryColor(patternData.category)

  if (!unlocked) {
    return (
      <div className={`border border-border p-3 opacity-50 ${className}`}>
        <p className="text-xs font-bold text-muted-foreground">???</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Unlocks at {patternData.minReviews} reviews
        </p>
      </div>
    )
  }

  return (
    <div className={`border p-3 ${className}`} style={{ borderColor: color }}>
      <p className="text-xs font-bold" style={{ color }}>
        {patternData.name}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{patternData.description}</p>
    </div>
  )
}

interface PatternGridProps {
  unlockedPatterns: PatternKey[]
  totalReviews: number
  className?: string
}

function PatternCategorySection({
  title,
  patterns,
  unlockedSet,
}: {
  title: string
  patterns: PatternKey[]
  unlockedSet: Set<string>
}): React.ReactElement {
  return (
    <div className="mb-6">
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {patterns.map(pattern => (
          <PatternBadge
            key={pattern}
            pattern={pattern}
            unlocked={unlockedSet.has(pattern)}
          />
        ))}
      </div>
    </div>
  )
}

export function PatternGrid({ unlockedPatterns, totalReviews, className = "" }: PatternGridProps): React.ReactElement {
  const allPatterns = Object.keys(TASTEID_PATTERNS) as PatternKey[]
  const unlockedSet = new Set(unlockedPatterns)

  const signaturePatterns = allPatterns.filter(p => TASTEID_PATTERNS[p].category === "signature")
  const ratingPatterns = allPatterns.filter(p => TASTEID_PATTERNS[p].category === "rating")
  const engagementPatterns = allPatterns.filter(p => TASTEID_PATTERNS[p].category === "engagement")

  const progressPercent = (unlockedPatterns.length / allPatterns.length) * 100

  return (
    <div className={className}>
      <PatternCategorySection
        title="Signature Patterns"
        patterns={signaturePatterns}
        unlockedSet={unlockedSet}
      />
      <PatternCategorySection
        title="Rating Patterns"
        patterns={ratingPatterns}
        unlockedSet={unlockedSet}
      />
      <PatternCategorySection
        title="Engagement Patterns"
        patterns={engagementPatterns}
        unlockedSet={unlockedSet}
      />

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{unlockedPatterns.length} / {allPatterns.length} patterns unlocked</span>
          <span>{totalReviews} reviews</span>
        </div>
        <div className="mt-2 h-1 bg-border overflow-hidden">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function PatternList({ patterns, className = "" }: { patterns: PatternKey[]; className?: string }): React.ReactElement | null {
  if (patterns.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {patterns.map(pattern => {
        const data = TASTEID_PATTERNS[pattern]
        const color = getCategoryColor(data.category)
        return (
          <span
            key={pattern}
            className="text-[10px] px-2 py-1 border"
            style={{ borderColor: color, color }}
          >
            {data.name}
          </span>
        )
      })}
    </div>
  )
}
