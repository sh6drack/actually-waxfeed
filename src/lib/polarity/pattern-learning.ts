/**
 * Polarity OS - Pattern Learning Engine
 *
 * Graph-based pattern detection with importance scoring.
 * Ported from Polarity OS Python implementation.
 */

import { CognitiveGraph, NODE_TYPES, EDGE_TYPES, type ImportanceScores } from './cognitive-graph'

// Pattern lifecycle status
export type PatternStatus = 'emerging' | 'confirmed' | 'fading' | 'dormant'

// Pattern state definition
export interface PatternState {
  id: string
  name: string
  description: string
  category: 'signature' | 'rating' | 'engagement' | 'discovery'
  status: PatternStatus
  confidence: number // 0-1
  firstDetected: Date
  lastConfirmed: Date
  occurrenceCount: number
  importanceScore: number
  metadata?: Record<string, unknown>
}

// Observation for pattern detection
export interface Observation {
  id: string
  type: string
  timestamp: Date
  value: unknown
  metadata?: Record<string, unknown>
}

// Review data for pattern detection
export interface ReviewData {
  id: string
  userId: string
  albumId: string
  rating: number
  vibes: string[]
  createdAt: Date
  albumGenres: string[]
  artistName: string
  releaseYear: number
}

// Pattern detection thresholds
const PATTERN_THRESHOLDS = {
  EMERGENCE: 0.4,     // 40% occurrence to emerge
  CONFIRMATION: 0.6,  // 60% occurrence to confirm
  FADING: 0.2,        // Below 20% to start fading
  MIN_OBSERVATIONS: 5,
  CONFIRMATION_SESSIONS: 3,
  FADING_SESSIONS: 3,
}

/**
 * PatternLearningEngine - Detects and manages cognitive patterns
 */
export class PatternLearningEngine {
  private patterns: Map<string, PatternState>
  private observations: Observation[]
  private graph: CognitiveGraph
  private maxObservations: number

  constructor(maxObservations = 1000) {
    this.patterns = new Map()
    this.observations = []
    this.graph = new CognitiveGraph()
    this.maxObservations = maxObservations
  }

  /**
   * Record an observation for pattern detection
   */
  recordObservation(observation: Omit<Observation, 'id'>): void {
    const obs: Observation = {
      ...observation,
      id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    this.observations.push(obs)

    // Circular buffer - remove oldest if over limit
    if (this.observations.length > this.maxObservations) {
      this.observations.shift()
    }

    // Add to graph
    this.graph.addNode({
      id: obs.id,
      type: NODE_TYPES.MESSAGE,
      data: obs as unknown as Record<string, unknown>,
      weight: 1,
    })
  }

  /**
   * Detect patterns from reviews
   */
  detectPatternsFromReviews(reviews: ReviewData[]): PatternState[] {
    if (reviews.length < PATTERN_THRESHOLDS.MIN_OBSERVATIONS) {
      return []
    }

    const detected: PatternState[] = []

    // 1. Rating patterns
    detected.push(...this.detectRatingPatterns(reviews))

    // 2. Discovery patterns
    detected.push(...this.detectDiscoveryPatterns(reviews))

    // 3. Engagement patterns
    detected.push(...this.detectEngagementPatterns(reviews))

    // 4. Signature patterns
    detected.push(...this.detectSignaturePatterns(reviews))

    // Update pattern lifecycle
    detected.forEach(pattern => {
      this.updatePatternLifecycle(pattern)
    })

    return Array.from(this.patterns.values())
  }

  /**
   * Detect rating-based patterns
   */
  private detectRatingPatterns(reviews: ReviewData[]): PatternState[] {
    const patterns: PatternState[] = []
    const ratings = reviews.map(r => r.rating)
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

    // Critical Ear (avg < 5.5)
    if (avgRating < 5.5 && reviews.length >= 15) {
      patterns.push(this.createPattern({
        id: 'critical_ear',
        name: 'Critical Ear',
        description: `Average rating ${avgRating.toFixed(1)} - high standards`,
        category: 'rating',
        confidence: Math.min(1, reviews.length / 30),
      }))
    }

    // Music Optimist (avg > 7.5)
    if (avgRating > 7.5 && reviews.length >= 15) {
      patterns.push(this.createPattern({
        id: 'music_optimist',
        name: 'Music Optimist',
        description: `Average rating ${avgRating.toFixed(1)} - finds joy everywhere`,
        category: 'rating',
        confidence: Math.min(1, reviews.length / 30),
      }))
    }

    // Polarized Taste (bimodal distribution)
    const lowRatings = ratings.filter(r => r <= 4).length
    const highRatings = ratings.filter(r => r >= 8).length
    const midRatings = ratings.filter(r => r > 4 && r < 8).length
    if ((lowRatings + highRatings) / ratings.length > 0.7 && midRatings / ratings.length < 0.3) {
      patterns.push(this.createPattern({
        id: 'polarized_taste',
        name: 'Polarized Taste',
        description: 'Bimodal ratings - loves it or hates it',
        category: 'rating',
        confidence: (lowRatings + highRatings) / ratings.length,
      }))
    }

    // Perfection Seeker (more 10s than 9s)
    const tens = ratings.filter(r => r === 10).length
    const nines = ratings.filter(r => r >= 9 && r < 10).length
    if (tens > nines && tens >= 3) {
      patterns.push(this.createPattern({
        id: 'perfection_seeker',
        name: 'Perfection Seeker',
        description: 'More 10s than near-perfect scores',
        category: 'rating',
        confidence: Math.min(1, tens / 5),
      }))
    }

    return patterns
  }

  /**
   * Detect discovery-based patterns
   */
  private detectDiscoveryPatterns(reviews: ReviewData[]): PatternState[] {
    const patterns: PatternState[] = []

    // Genre diversity
    const genres = new Set(reviews.flatMap(r => r.albumGenres))
    const genreDiversity = genres.size / Math.max(1, reviews.length)

    if (genreDiversity > 0.5 && reviews.length >= 10) {
      patterns.push(this.createPattern({
        id: 'genre_explorer',
        name: 'Genre Explorer',
        description: `${genres.size} genres across ${reviews.length} reviews`,
        category: 'discovery',
        confidence: Math.min(1, genreDiversity * 1.5),
      }))
    }

    // New release hunter (avg album age < 2 years)
    const currentYear = new Date().getFullYear()
    const avgAge = reviews.reduce((sum, r) => sum + (currentYear - r.releaseYear), 0) / reviews.length
    if (avgAge < 2 && reviews.length >= 10) {
      patterns.push(this.createPattern({
        id: 'new_release_hunter',
        name: 'New Release Hunter',
        description: 'Stays on top of current music as it drops',
        category: 'discovery',
        confidence: Math.min(1, (2 - avgAge) / 2),
      }))
    }

    // Archive diver (avg album age > 15 years)
    if (avgAge > 15 && reviews.length >= 15) {
      patterns.push(this.createPattern({
        id: 'archive_diver',
        name: 'Archive Diver',
        description: 'Average album age over 15 years',
        category: 'discovery',
        confidence: Math.min(1, (avgAge - 15) / 10),
      }))
    }

    return patterns
  }

  /**
   * Detect engagement-based patterns
   */
  private detectEngagementPatterns(reviews: ReviewData[]): PatternState[] {
    const patterns: PatternState[] = []

    // Discography completionist (5+ albums from single artist)
    const artistCounts = new Map<string, number>()
    reviews.forEach(r => {
      artistCounts.set(r.artistName, (artistCounts.get(r.artistName) || 0) + 1)
    })

    const deepDiveArtists = Array.from(artistCounts.entries()).filter(([, count]) => count >= 5)
    if (deepDiveArtists.length > 0) {
      patterns.push(this.createPattern({
        id: 'discography_completionist',
        name: 'Discography Completionist',
        description: `${deepDiveArtists.length} artist(s) with 5+ albums reviewed`,
        category: 'engagement',
        confidence: Math.min(1, deepDiveArtists.length / 3),
      }))
    }

    // Deep dive sprints (artist bursts in short time)
    const sortedReviews = [...reviews].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    )
    let hasDeepDiveSprint = false
    for (let i = 0; i < sortedReviews.length - 2; i++) {
      const window = sortedReviews.slice(i, i + 5)
      if (window.length >= 3) {
        const artists = window.map(r => r.artistName)
        const sameArtist = artists.filter(a => a === artists[0]).length >= 3
        const timeSpan = (window[window.length - 1].createdAt.getTime() - window[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
        if (sameArtist && timeSpan <= 7) {
          hasDeepDiveSprint = true
          break
        }
      }
    }

    if (hasDeepDiveSprint) {
      patterns.push(this.createPattern({
        id: 'deep_dive_sprints',
        name: 'Deep Dive Sprints',
        description: 'Goes all-in on artists when something clicks',
        category: 'engagement',
        confidence: 0.8,
      }))
    }

    return patterns
  }

  /**
   * Detect signature-based patterns
   */
  private detectSignaturePatterns(reviews: ReviewData[]): PatternState[] {
    const patterns: PatternState[] = []

    // Emotional listener (high rating variance)
    const ratings = reviews.map(r => r.rating)
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
    const stdDev = Math.sqrt(variance)

    if (stdDev > 2.5 && reviews.length >= 10) {
      patterns.push(this.createPattern({
        id: 'emotional_listener',
        name: 'Emotional Listener',
        description: 'Strong reactions reflected in rating variance',
        category: 'signature',
        confidence: Math.min(1, stdDev / 3),
      }))
    }

    // Discovery-Comfort oscillation
    const sortedReviews = [...reviews].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    )

    let oscillations = 0
    let lastWasNew = null

    for (let i = 0; i < sortedReviews.length; i++) {
      const isNewGenre = i === 0 || !sortedReviews.slice(0, i).some(
        r => r.albumGenres.some(g => sortedReviews[i].albumGenres.includes(g))
      )

      if (lastWasNew !== null && isNewGenre !== lastWasNew) {
        oscillations++
      }
      lastWasNew = isNewGenre
    }

    if (oscillations >= 5 && reviews.length >= 10) {
      patterns.push(this.createPattern({
        id: 'discovery_comfort_oscillation',
        name: 'Discovery\u2194Comfort Oscillation',
        description: 'Healthy balance between exploring new music and returning to favorites',
        category: 'signature',
        confidence: Math.min(1, oscillations / 10),
      }))
    }

    return patterns
  }

  /**
   * Create or update a pattern
   */
  private createPattern(data: {
    id: string
    name: string
    description: string
    category: 'signature' | 'rating' | 'engagement' | 'discovery'
    confidence: number
  }): PatternState {
    const existing = this.patterns.get(data.id)
    const now = new Date()

    if (existing) {
      existing.lastConfirmed = now
      existing.occurrenceCount++
      existing.confidence = Math.max(existing.confidence, data.confidence)
      return existing
    }

    const pattern: PatternState = {
      ...data,
      status: data.confidence >= PATTERN_THRESHOLDS.CONFIRMATION ? 'confirmed' : 'emerging',
      firstDetected: now,
      lastConfirmed: now,
      occurrenceCount: 1,
      importanceScore: 0,
    }

    this.patterns.set(data.id, pattern)

    // Add to graph
    this.graph.addNode({
      id: `pattern_${data.id}`,
      type: NODE_TYPES.PATTERN,
      data: pattern as unknown as Record<string, unknown>,
      weight: data.confidence,
    })

    return pattern
  }

  /**
   * Update pattern lifecycle based on recent activity
   */
  private updatePatternLifecycle(pattern: PatternState): void {
    const daysSinceConfirmed = (Date.now() - pattern.lastConfirmed.getTime()) / (1000 * 60 * 60 * 24)

    if (pattern.status === 'emerging' && pattern.occurrenceCount >= PATTERN_THRESHOLDS.CONFIRMATION_SESSIONS) {
      pattern.status = 'confirmed'
    } else if (pattern.status === 'confirmed' && daysSinceConfirmed > 30) {
      pattern.status = 'fading'
    } else if (pattern.status === 'fading' && daysSinceConfirmed > 60) {
      pattern.status = 'dormant'
    }
  }

  /**
   * Compute importance scores for all patterns using graph analysis
   */
  computeImportance(): Map<string, number> {
    const graphScores = this.graph.computeImportanceScores()
    const importanceMap = new Map<string, number>()

    this.patterns.forEach((pattern, id) => {
      const nodeId = `pattern_${id}`
      const scores = graphScores.get(nodeId)
      const importance = scores?.combined || pattern.confidence

      pattern.importanceScore = importance
      importanceMap.set(id, importance)
    })

    return importanceMap
  }

  /**
   * Get all patterns sorted by importance
   */
  getPatternsSortedByImportance(): PatternState[] {
    this.computeImportance()
    return Array.from(this.patterns.values()).sort((a, b) => b.importanceScore - a.importanceScore)
  }

  /**
   * Get patterns by status
   */
  getPatternsByStatus(status: PatternStatus): PatternState[] {
    return Array.from(this.patterns.values()).filter(p => p.status === status)
  }

  /**
   * Export patterns to JSON
   */
  toJSON(): PatternState[] {
    return Array.from(this.patterns.values())
  }

  /**
   * Load patterns from JSON
   */
  loadFromJSON(patterns: PatternState[]): void {
    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, {
        ...pattern,
        firstDetected: new Date(pattern.firstDetected),
        lastConfirmed: new Date(pattern.lastConfirmed),
      })
    })
  }
}

export { PATTERN_THRESHOLDS }
