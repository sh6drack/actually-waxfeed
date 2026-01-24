/**
 * Shared types and constants for TasteID components
 * These are re-exported from the main tasteid lib for component use
 */

import type { ListeningSignature } from "@/lib/tasteid"

// Re-export core types from tasteid lib
export type { ListeningSignature, MusicNetworkId, ConsolidatedTaste } from "@/lib/tasteid"

// Network key type for component props (maps to ListeningSignature keys)
export type NetworkKey = keyof ListeningSignature

// Shared color palette for TasteID components
// Uses semantic names that map to the 7 Music Networks
export const NETWORK_COLORS = {
  discovery: "#60a5fa", // blue
  comfort: "#a78bfa", // violet
  deep_dive: "#34d399", // emerald
  reactive: "#fbbf24", // amber
  emotional: "#f87171", // red
  social: "#fb923c", // orange
  aesthetic: "#818cf8", // indigo
} as const

// Pattern category colors
export const PATTERN_CATEGORY_COLORS = {
  signature: "#60a5fa", // blue
  rating: "#a78bfa", // violet
  engagement: "#34d399", // emerald
} as const

// Trend colors for consolidation
export const TREND_COLORS = {
  strengthening: "#22c55e", // green
  fading: "#f87171", // red
  stable: "#60a5fa", // blue
} as const

// Score level colors for polarity score
export const SCORE_LEVEL_COLORS = {
  high: "#22c55e", // green (80+)
  good: "#60a5fa", // blue (60+)
  emerging: "#fbbf24", // amber (40+)
  nascent: "#a78bfa", // violet (0+)
} as const

// Common component size presets
export const VISUALIZATION_SIZES = {
  mini: 80,
  small: 160,
  medium: 280,
  large: 400,
} as const

// Trend label display strings
export const TREND_LABELS = {
  strengthening: "STRENGTHENING",
  fading: "FADING",
  stable: "STABLE",
} as const

// Score level thresholds and labels
export const SCORE_LEVELS = [
  { threshold: 0.8, label: "Highly Distinct", description: "Unmistakable listening identity", color: SCORE_LEVEL_COLORS.high },
  { threshold: 0.6, label: "Well-Defined", description: "Clear patterns and preferences", color: SCORE_LEVEL_COLORS.good },
  { threshold: 0.4, label: "Emerging", description: "Patterns forming, more data helpful", color: SCORE_LEVEL_COLORS.emerging },
  { threshold: 0, label: "Nascent", description: "Early stage, keep reviewing", color: SCORE_LEVEL_COLORS.nascent },
] as const

/**
 * Get score level based on polarity score value
 */
export function getScoreLevel(score: number): typeof SCORE_LEVELS[number] {
  return SCORE_LEVELS.find(level => score >= level.threshold) || SCORE_LEVELS[SCORE_LEVELS.length - 1]
}

/**
 * Get network color by network id
 */
export function getNetworkColor(networkId: NetworkKey): string {
  return NETWORK_COLORS[networkId] || NETWORK_COLORS.discovery
}

/**
 * Get trend display with arrow prefix
 */
export function getTrendDisplay(trend: keyof typeof TREND_LABELS): string {
  const arrows = { strengthening: "\u2191", fading: "\u2193", stable: "\u2192" }
  return `${arrows[trend]} ${TREND_LABELS[trend]}`
}
