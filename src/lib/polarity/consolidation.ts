/**
 * Polarity OS - Consolidation Engine
 *
 * Episode extraction and taste consolidation tracking.
 * Ported from Polarity OS Python implementation.
 */

import { CognitiveGraph, NODE_TYPES, EDGE_TYPES } from './cognitive-graph'
import type { PatternState } from './pattern-learning'

// Episode structure - a listening session
export interface Episode {
  id: string
  startTime: Date
  endTime: Date
  reviews: EpisodeReview[]
  patternsDetected: string[]
  emotionalTone: number // -1 to 1 (negative to positive)
  genreFocus: string[]
  artistFocus: string[]
  avgRating: number
  ratingVariance: number
}

// Simplified review for episodes
export interface EpisodeReview {
  id: string
  albumId: string
  artistName: string
  rating: number
  vibes: string[]
  genres: string[]
  createdAt: Date
}

// Consolidated taste entry
export interface ConsolidatedTaste {
  name: string
  type: 'genre' | 'artist' | 'vibe'
  trend: 'strengthening' | 'fading' | 'stable'
  recentAvg: number
  olderAvg: number
  totalReviews: number
  confidence: number
}

// Consolidation configuration
const CONSOLIDATION_CONFIG = {
  EPISODE_GAP_HOURS: 6,       // Gap between reviews to split episodes
  MIN_EPISODE_REVIEWS: 2,     // Minimum reviews to form an episode
  RECENT_WINDOW_DAYS: 180,    // 6 months for "recent"
  CONSOLIDATION_THRESHOLD: 6, // Min avg rating for consolidated taste
  TREND_DIFF_THRESHOLD: 0.5,  // Rating diff for trend detection
  MAX_EPISODES: 50,           // Max episodes to keep
}

/**
 * ConsolidationEngine - Manages taste consolidation
 */
export class ConsolidationEngine {
  private episodes: Episode[]
  private graph: CognitiveGraph

  constructor() {
    this.episodes = []
    this.graph = new CognitiveGraph()
  }

  /**
   * Extract episodes from reviews
   */
  extractEpisodes(reviews: EpisodeReview[]): Episode[] {
    if (reviews.length < CONSOLIDATION_CONFIG.MIN_EPISODE_REVIEWS) {
      return []
    }

    // Sort by creation time
    const sorted = [...reviews].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    )

    const episodes: Episode[] = []
    let currentEpisode: EpisodeReview[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()
      const gapHours = gap / (1000 * 60 * 60)

      if (gapHours > CONSOLIDATION_CONFIG.EPISODE_GAP_HOURS) {
        // Finalize current episode
        if (currentEpisode.length >= CONSOLIDATION_CONFIG.MIN_EPISODE_REVIEWS) {
          episodes.push(this.createEpisode(currentEpisode))
        }
        currentEpisode = [sorted[i]]
      } else {
        currentEpisode.push(sorted[i])
      }
    }

    // Don't forget the last episode
    if (currentEpisode.length >= CONSOLIDATION_CONFIG.MIN_EPISODE_REVIEWS) {
      episodes.push(this.createEpisode(currentEpisode))
    }

    // Update stored episodes
    this.episodes = [...this.episodes, ...episodes].slice(-CONSOLIDATION_CONFIG.MAX_EPISODES)

    // Add to graph
    episodes.forEach(ep => {
      this.graph.addNode({
        id: ep.id,
        type: NODE_TYPES.EPISODE,
        data: ep as unknown as Record<string, unknown>,
        weight: ep.reviews.length / 10,
      })
    })

    return episodes
  }

  /**
   * Create an episode from reviews
   */
  private createEpisode(reviews: EpisodeReview[]): Episode {
    const ratings = reviews.map(r => r.rating)
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length

    // Calculate emotional tone from ratings (-1 to 1)
    const emotionalTone = (avgRating - 5) / 5

    // Get unique genres and artists
    const genres = [...new Set(reviews.flatMap(r => r.genres))]
    const artists = [...new Set(reviews.map(r => r.artistName))]

    return {
      id: `episode_${reviews[0].createdAt.getTime()}_${Math.random().toString(36).slice(2, 9)}`,
      startTime: reviews[0].createdAt,
      endTime: reviews[reviews.length - 1].createdAt,
      reviews,
      patternsDetected: [],
      emotionalTone,
      genreFocus: genres.slice(0, 5),
      artistFocus: artists.slice(0, 3),
      avgRating,
      ratingVariance: variance,
    }
  }

  /**
   * Compute consolidated tastes
   */
  computeConsolidatedTastes(reviews: EpisodeReview[]): ConsolidatedTaste[] {
    const now = Date.now()
    const recentCutoff = now - (CONSOLIDATION_CONFIG.RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const recentReviews = reviews.filter(r => r.createdAt.getTime() > recentCutoff)
    const olderReviews = reviews.filter(r => r.createdAt.getTime() <= recentCutoff)

    const consolidated: ConsolidatedTaste[] = []

    // Consolidate genres
    consolidated.push(...this.consolidateByType(recentReviews, olderReviews, 'genre'))

    // Consolidate artists
    consolidated.push(...this.consolidateByType(recentReviews, olderReviews, 'artist'))

    // Consolidate vibes
    consolidated.push(...this.consolidateByType(recentReviews, olderReviews, 'vibe'))

    // Sort by confidence
    return consolidated.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Consolidate by type (genre, artist, or vibe)
   */
  private consolidateByType(
    recentReviews: EpisodeReview[],
    olderReviews: EpisodeReview[],
    type: 'genre' | 'artist' | 'vibe'
  ): ConsolidatedTaste[] {
    const getItems = (review: EpisodeReview): string[] => {
      switch (type) {
        case 'genre':
          return review.genres
        case 'artist':
          return [review.artistName]
        case 'vibe':
          return review.vibes
      }
    }

    // Aggregate ratings by item
    const recentAgg = this.aggregateRatings(recentReviews, getItems)
    const olderAgg = this.aggregateRatings(olderReviews, getItems)

    const consolidated: ConsolidatedTaste[] = []
    const allItems = new Set([...recentAgg.keys(), ...olderAgg.keys()])

    allItems.forEach(item => {
      const recent = recentAgg.get(item)
      const older = olderAgg.get(item)

      // Need data from both periods or significant recent data
      if (!recent && !older) return

      const recentAvg = recent?.avgRating || 0
      const olderAvg = older?.avgRating || recentAvg
      const totalReviews = (recent?.count || 0) + (older?.count || 0)

      // Skip if not enough reviews
      if (totalReviews < 2) return

      // Determine trend
      const diff = recentAvg - olderAvg
      let trend: 'strengthening' | 'fading' | 'stable'
      if (diff > CONSOLIDATION_CONFIG.TREND_DIFF_THRESHOLD) {
        trend = 'strengthening'
      } else if (diff < -CONSOLIDATION_CONFIG.TREND_DIFF_THRESHOLD) {
        trend = 'fading'
      } else {
        trend = 'stable'
      }

      // Only include if consolidated (avg >= threshold)
      const overallAvg = (recentAvg + olderAvg) / 2
      if (overallAvg >= CONSOLIDATION_CONFIG.CONSOLIDATION_THRESHOLD) {
        consolidated.push({
          name: item,
          type,
          trend,
          recentAvg,
          olderAvg,
          totalReviews,
          confidence: Math.min(1, totalReviews / 10) * (overallAvg / 10),
        })
      }
    })

    return consolidated
  }

  /**
   * Aggregate ratings by items
   */
  private aggregateRatings(
    reviews: EpisodeReview[],
    getItems: (r: EpisodeReview) => string[]
  ): Map<string, { avgRating: number; count: number }> {
    const agg = new Map<string, { total: number; count: number }>()

    reviews.forEach(review => {
      const items = getItems(review)
      items.forEach(item => {
        const current = agg.get(item) || { total: 0, count: 0 }
        agg.set(item, {
          total: current.total + review.rating,
          count: current.count + 1,
        })
      })
    })

    const result = new Map<string, { avgRating: number; count: number }>()
    agg.forEach((value, key) => {
      result.set(key, {
        avgRating: value.total / value.count,
        count: value.count,
      })
    })

    return result
  }

  /**
   * Learn edge weights from episodes
   */
  learnEdgeWeights(patterns: PatternState[]): void {
    // Create pattern nodes if not exist
    patterns.forEach(pattern => {
      if (!this.graph.getNode(`pattern_${pattern.id}`)) {
        this.graph.addNode({
          id: `pattern_${pattern.id}`,
          type: NODE_TYPES.PATTERN,
          data: pattern as unknown as Record<string, unknown>,
          weight: pattern.confidence,
        })
      }
    })

    // Connect episodes to patterns
    this.episodes.forEach(episode => {
      episode.patternsDetected.forEach(patternId => {
        this.graph.addEdge({
          source: episode.id,
          target: `pattern_${patternId}`,
          type: EDGE_TYPES.EXHIBITED_IN,
          weight: 1,
        })
      })
    })

    // Connect patterns that co-occur
    patterns.forEach((p1, i) => {
      patterns.slice(i + 1).forEach(p2 => {
        // Count co-occurrences
        const coOccurrences = this.episodes.filter(
          ep => ep.patternsDetected.includes(p1.id) && ep.patternsDetected.includes(p2.id)
        ).length

        if (coOccurrences > 0) {
          this.graph.addEdge({
            source: `pattern_${p1.id}`,
            target: `pattern_${p2.id}`,
            type: EDGE_TYPES.REINFORCES,
            weight: coOccurrences / this.episodes.length,
          })
        }
      })
    })
  }

  /**
   * Get episode summary stats
   */
  getEpisodeStats(): {
    totalEpisodes: number
    avgEpisodeLength: number
    avgRating: number
    topGenres: string[]
    topArtists: string[]
  } {
    if (this.episodes.length === 0) {
      return {
        totalEpisodes: 0,
        avgEpisodeLength: 0,
        avgRating: 0,
        topGenres: [],
        topArtists: [],
      }
    }

    const avgLength = this.episodes.reduce((sum, ep) => sum + ep.reviews.length, 0) / this.episodes.length
    const avgRating = this.episodes.reduce((sum, ep) => sum + ep.avgRating, 0) / this.episodes.length

    // Count genre occurrences
    const genreCounts = new Map<string, number>()
    const artistCounts = new Map<string, number>()

    this.episodes.forEach(ep => {
      ep.genreFocus.forEach(g => genreCounts.set(g, (genreCounts.get(g) || 0) + 1))
      ep.artistFocus.forEach(a => artistCounts.set(a, (artistCounts.get(a) || 0) + 1))
    })

    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g)

    const topArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([a]) => a)

    return {
      totalEpisodes: this.episodes.length,
      avgEpisodeLength: avgLength,
      avgRating,
      topGenres,
      topArtists,
    }
  }

  /**
   * Get recent episodes
   */
  getRecentEpisodes(count = 10): Episode[] {
    return this.episodes.slice(-count).reverse()
  }

  /**
   * Export to JSON
   */
  toJSON(): {
    episodes: Episode[]
    graph: ReturnType<CognitiveGraph['toJSON']>
  } {
    return {
      episodes: this.episodes,
      graph: this.graph.toJSON(),
    }
  }

  /**
   * Load from JSON
   */
  loadFromJSON(data: {
    episodes: Episode[]
    graph: ReturnType<CognitiveGraph['toJSON']>
  }): void {
    this.episodes = data.episodes.map(ep => ({
      ...ep,
      startTime: new Date(ep.startTime),
      endTime: new Date(ep.endTime),
      reviews: ep.reviews.map(r => ({
        ...r,
        createdAt: new Date(r.createdAt),
      })),
    }))
    this.graph = CognitiveGraph.fromJSON(data.graph)
  }
}

export { CONSOLIDATION_CONFIG }
