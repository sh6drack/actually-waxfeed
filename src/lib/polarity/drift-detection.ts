/**
 * Polarity OS - Drift Detection
 *
 * Detects behavioral changes and taste evolution.
 * Ported from Polarity OS Python implementation.
 */

import type { PatternState } from './pattern-learning'

// Types of drift that can be detected
export type DriftType =
  | 'pattern_disappearance'
  | 'pattern_emergence'
  | 'contradiction'
  | 'emotional_shift'
  | 'preference_change'
  | 'rating_style_shift'
  | 'genre_expansion'
  | 'genre_contraction'

// Drift alert structure
export interface DriftAlert {
  id: string
  type: DriftType
  description: string
  magnitude: number // 0-1, how significant
  oldValue: unknown
  newValue: unknown
  affectedPatterns: string[]
  detectedAt: Date
  acknowledged: boolean
}

// Listening signature for comparison
export interface ListeningSignature {
  discovery: number
  comfort: number
  deepDive: number
  reactive: number
  emotional: number
  social: number
  aesthetic: number
}

// Rating style profile
export interface RatingStyle {
  average: number
  stdDev: number
  skew: 'harsh' | 'lenient' | 'balanced'
}

// Drift detection configuration
const DRIFT_CONFIG = {
  MAX_ALERTS: 100,
  PATTERN_DISAPPEARANCE_SESSIONS: 2,
  SIGNIFICANT_MAGNITUDE: 0.3,
  SIGNATURE_DRIFT_THRESHOLD: 0.15,
  RATING_DRIFT_THRESHOLD: 0.5,
}

/**
 * DriftDetector - Monitors for behavioral changes
 */
export class DriftDetector {
  private alertHistory: DriftAlert[]
  private previousSignature: ListeningSignature | null
  private previousRatingStyle: RatingStyle | null
  private previousPatterns: Set<string>

  constructor() {
    this.alertHistory = []
    this.previousSignature = null
    this.previousRatingStyle = null
    this.previousPatterns = new Set()
  }

  /**
   * Detect pattern disappearance
   */
  detectPatternDisappearance(
    currentPatterns: PatternState[],
    sessionCount: number
  ): DriftAlert[] {
    const alerts: DriftAlert[] = []
    const currentPatternIds = new Set(currentPatterns.map(p => p.id))

    // Check for patterns that were present but now missing
    this.previousPatterns.forEach(patternId => {
      if (!currentPatternIds.has(patternId)) {
        alerts.push(this.createAlert({
          type: 'pattern_disappearance',
          description: `Pattern "${patternId}" has faded after ${sessionCount} sessions`,
          magnitude: 0.6,
          oldValue: patternId,
          newValue: null,
          affectedPatterns: [patternId],
        }))
      }
    })

    // Check for new patterns
    currentPatternIds.forEach(patternId => {
      if (!this.previousPatterns.has(patternId)) {
        alerts.push(this.createAlert({
          type: 'pattern_emergence',
          description: `New pattern detected: "${patternId}"`,
          magnitude: 0.5,
          oldValue: null,
          newValue: patternId,
          affectedPatterns: [patternId],
        }))
      }
    })

    // Update previous state
    this.previousPatterns = currentPatternIds

    return alerts
  }

  /**
   * Detect contradictions between patterns
   */
  detectContradictions(
    patterns: PatternState[]
  ): DriftAlert[] {
    const alerts: DriftAlert[] = []
    const patternIds = patterns.map(p => p.id)

    // Define contradictory pattern pairs
    const contradictions: [string, string][] = [
      ['critical_ear', 'music_optimist'],
      ['new_release_hunter', 'archive_diver'],
      ['genre_purist', 'genre_explorer'],
    ]

    contradictions.forEach(([a, b]) => {
      if (patternIds.includes(a) && patternIds.includes(b)) {
        alerts.push(this.createAlert({
          type: 'contradiction',
          description: `Contradictory patterns detected: "${a}" and "${b}"`,
          magnitude: 0.7,
          oldValue: a,
          newValue: b,
          affectedPatterns: [a, b],
        }))
      }
    })

    return alerts
  }

  /**
   * Detect listening signature drift
   */
  detectSignatureDrift(
    currentSignature: ListeningSignature
  ): DriftAlert[] {
    const alerts: DriftAlert[] = []

    if (!this.previousSignature) {
      this.previousSignature = currentSignature
      return alerts
    }

    const networks = Object.keys(currentSignature) as (keyof ListeningSignature)[]

    networks.forEach(network => {
      const oldValue = this.previousSignature![network]
      const newValue = currentSignature[network]
      const diff = Math.abs(newValue - oldValue)

      if (diff > DRIFT_CONFIG.SIGNATURE_DRIFT_THRESHOLD) {
        const direction = newValue > oldValue ? 'increased' : 'decreased'
        alerts.push(this.createAlert({
          type: 'preference_change',
          description: `${network.toUpperCase()} network ${direction} by ${(diff * 100).toFixed(0)}%`,
          magnitude: diff,
          oldValue,
          newValue,
          affectedPatterns: [],
        }))
      }
    })

    // Update previous state
    this.previousSignature = currentSignature

    return alerts
  }

  /**
   * Detect rating style shifts
   */
  detectRatingStyleShift(
    currentStyle: RatingStyle
  ): DriftAlert[] {
    const alerts: DriftAlert[] = []

    if (!this.previousRatingStyle) {
      this.previousRatingStyle = currentStyle
      return alerts
    }

    // Check average rating shift
    const avgDiff = Math.abs(currentStyle.average - this.previousRatingStyle.average)
    if (avgDiff > DRIFT_CONFIG.RATING_DRIFT_THRESHOLD) {
      const direction = currentStyle.average > this.previousRatingStyle.average
        ? 'more generous'
        : 'more critical'
      alerts.push(this.createAlert({
        type: 'rating_style_shift',
        description: `Rating style became ${direction} (${this.previousRatingStyle.average.toFixed(1)} \u2192 ${currentStyle.average.toFixed(1)})`,
        magnitude: avgDiff / 5,
        oldValue: this.previousRatingStyle.average,
        newValue: currentStyle.average,
        affectedPatterns: [],
      }))
    }

    // Check skew change
    if (currentStyle.skew !== this.previousRatingStyle.skew) {
      alerts.push(this.createAlert({
        type: 'rating_style_shift',
        description: `Rating skew changed from ${this.previousRatingStyle.skew} to ${currentStyle.skew}`,
        magnitude: 0.5,
        oldValue: this.previousRatingStyle.skew,
        newValue: currentStyle.skew,
        affectedPatterns: [],
      }))
    }

    this.previousRatingStyle = currentStyle

    return alerts
  }

  /**
   * Detect emotional shifts based on recent reviews
   */
  detectEmotionalShifts(
    recentReviews: { rating: number; vibes: string[] }[],
    olderReviews: { rating: number; vibes: string[] }[]
  ): DriftAlert[] {
    const alerts: DriftAlert[] = []

    if (recentReviews.length < 5 || olderReviews.length < 5) {
      return alerts
    }

    // Compare vibe frequency
    const recentVibes = recentReviews.flatMap(r => r.vibes)
    const olderVibes = olderReviews.flatMap(r => r.vibes)

    const recentVibeCounts = new Map<string, number>()
    const olderVibeCounts = new Map<string, number>()

    recentVibes.forEach(v => recentVibeCounts.set(v, (recentVibeCounts.get(v) || 0) + 1))
    olderVibes.forEach(v => olderVibeCounts.set(v, (olderVibeCounts.get(v) || 0) + 1))

    // Normalize
    const recentTotal = recentVibes.length || 1
    const olderTotal = olderVibes.length || 1

    // Find significant vibe shifts
    const allVibes = new Set([...recentVibeCounts.keys(), ...olderVibeCounts.keys()])

    allVibes.forEach(vibe => {
      const recentFreq = (recentVibeCounts.get(vibe) || 0) / recentTotal
      const olderFreq = (olderVibeCounts.get(vibe) || 0) / olderTotal
      const diff = recentFreq - olderFreq

      if (Math.abs(diff) > 0.2) {
        const direction = diff > 0 ? 'more' : 'less'
        alerts.push(this.createAlert({
          type: 'emotional_shift',
          description: `Now using "${vibe}" ${direction} frequently in reviews`,
          magnitude: Math.abs(diff),
          oldValue: olderFreq,
          newValue: recentFreq,
          affectedPatterns: [],
        }))
      }
    })

    return alerts
  }

  /**
   * Detect genre expansion or contraction
   */
  detectGenreChanges(
    recentGenres: string[],
    historicalGenres: string[]
  ): DriftAlert[] {
    const alerts: DriftAlert[] = []

    const recentSet = new Set(recentGenres)
    const historicalSet = new Set(historicalGenres)

    // New genres discovered
    const newGenres = Array.from(recentSet).filter(g => !historicalSet.has(g))
    if (newGenres.length >= 3) {
      alerts.push(this.createAlert({
        type: 'genre_expansion',
        description: `Exploring ${newGenres.length} new genres: ${newGenres.slice(0, 3).join(', ')}`,
        magnitude: Math.min(1, newGenres.length / 5),
        oldValue: historicalSet.size,
        newValue: recentSet.size,
        affectedPatterns: [],
      }))
    }

    // Genres abandoned
    const abandonedGenres = Array.from(historicalSet).filter(g => !recentSet.has(g))
    if (abandonedGenres.length >= 3) {
      alerts.push(this.createAlert({
        type: 'genre_contraction',
        description: `Moved away from ${abandonedGenres.length} genres: ${abandonedGenres.slice(0, 3).join(', ')}`,
        magnitude: Math.min(1, abandonedGenres.length / 5),
        oldValue: historicalSet.size,
        newValue: recentSet.size,
        affectedPatterns: [],
      }))
    }

    return alerts
  }

  /**
   * Create a drift alert
   */
  private createAlert(data: Omit<DriftAlert, 'id' | 'detectedAt' | 'acknowledged'>): DriftAlert {
    const alert: DriftAlert = {
      ...data,
      id: `drift_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      detectedAt: new Date(),
      acknowledged: false,
    }

    this.alertHistory.push(alert)

    // Circular buffer
    if (this.alertHistory.length > DRIFT_CONFIG.MAX_ALERTS) {
      this.alertHistory.shift()
    }

    return alert
  }

  /**
   * Get significant drifts (magnitude > threshold)
   */
  getSignificantDrifts(): DriftAlert[] {
    return this.alertHistory.filter(
      a => a.magnitude >= DRIFT_CONFIG.SIGNIFICANT_MAGNITUDE && !a.acknowledged
    )
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 10): DriftAlert[] {
    return this.alertHistory.slice(-count).reverse()
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alertHistory.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): DriftAlert[] {
    return [...this.alertHistory]
  }

  /**
   * Export to JSON
   */
  toJSON(): {
    alerts: DriftAlert[]
    previousSignature: ListeningSignature | null
    previousRatingStyle: RatingStyle | null
    previousPatterns: string[]
  } {
    return {
      alerts: this.alertHistory,
      previousSignature: this.previousSignature,
      previousRatingStyle: this.previousRatingStyle,
      previousPatterns: Array.from(this.previousPatterns),
    }
  }

  /**
   * Load from JSON
   */
  loadFromJSON(data: {
    alerts: DriftAlert[]
    previousSignature: ListeningSignature | null
    previousRatingStyle: RatingStyle | null
    previousPatterns: string[]
  }): void {
    this.alertHistory = data.alerts.map(a => ({
      ...a,
      detectedAt: new Date(a.detectedAt),
    }))
    this.previousSignature = data.previousSignature
    this.previousRatingStyle = data.previousRatingStyle
    this.previousPatterns = new Set(data.previousPatterns)
  }
}

export { DRIFT_CONFIG }
