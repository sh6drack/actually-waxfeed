/**
 * TasteID Tier System - Gamification & Progress Tracking
 * 
 * Scientific basis: Psychometric reliability increases with sample size
 * More ratings = more accurate profile = higher tier
 */

export interface TasteIDTier {
  id: string
  name: string
  minRatings: number
  maxConfidence: number
  color: string
  bgColor: string
  icon: string
  description: string
  perks: string[]
}

export const TASTEID_TIERS: TasteIDTier[] = [
  {
    id: 'locked',
    name: 'LOCKED',
    minRatings: 0,
    maxConfidence: 0,
    color: '#666',
    bgColor: '#1a1a1a',
    icon: '🔒',
    description: 'Rate 20 albums to unlock your TasteID',
    perks: [],
  },
  {
    id: 'emerging',
    name: 'EMERGING',
    minRatings: 20,
    maxConfidence: 65,
    color: '#ffd700',
    bgColor: '#ffd700/10',
    icon: '⚡',
    description: 'Your taste profile is taking shape',
    perks: ['Basic archetype', 'Top 5 genres', 'Adventureness score'],
  },
  {
    id: 'developing',
    name: 'DEVELOPING',
    minRatings: 50,
    maxConfidence: 75,
    color: '#00ff88',
    bgColor: '#00ff88/10',
    icon: '🌱',
    description: 'Your musical DNA is becoming clearer',
    perks: ['Secondary archetype', '7 Music Networks', 'Listening Signature'],
  },
  {
    id: 'established',
    name: 'ESTABLISHED',
    minRatings: 100,
    maxConfidence: 85,
    color: '#00bfff',
    bgColor: '#00bfff/10',
    icon: '💎',
    description: 'A well-defined taste profile',
    perks: ['Pattern badges', 'Musical futures', 'Taste evolution tracking'],
  },
  {
    id: 'expert',
    name: 'EXPERT',
    minRatings: 200,
    maxConfidence: 92,
    color: '#ff6b6b',
    bgColor: '#ff6b6b/10',
    icon: '🔥',
    description: 'Deep musical understanding',
    perks: ['Taste consolidation', 'Influence score', 'Curator potential'],
  },
  {
    id: 'master',
    name: 'MASTER',
    minRatings: 500,
    maxConfidence: 98,
    color: '#bf00ff',
    bgColor: '#bf00ff/10',
    icon: '👑',
    description: 'Elite-level taste authority',
    perks: ['Full confidence', 'Taste oracle status', 'Community influence'],
  },
]

/**
 * Get current tier based on rating count
 */
export function getCurrentTier(ratingCount: number): TasteIDTier {
  // Find the highest tier the user qualifies for
  for (let i = TASTEID_TIERS.length - 1; i >= 0; i--) {
    if (ratingCount >= TASTEID_TIERS[i].minRatings) {
      return TASTEID_TIERS[i]
    }
  }
  return TASTEID_TIERS[0]
}

/**
 * Get next tier
 */
export function getNextTier(ratingCount: number): TasteIDTier | null {
  const currentTier = getCurrentTier(ratingCount)
  const currentIndex = TASTEID_TIERS.findIndex(t => t.id === currentTier.id)
  
  if (currentIndex < TASTEID_TIERS.length - 1) {
    return TASTEID_TIERS[currentIndex + 1]
  }
  return null
}

/**
 * Calculate progress to next tier (0-100)
 */
export function getProgressToNextTier(ratingCount: number): {
  progress: number
  ratingsToNext: number
  currentTier: TasteIDTier
  nextTier: TasteIDTier | null
} {
  const currentTier = getCurrentTier(ratingCount)
  const nextTier = getNextTier(ratingCount)
  
  if (!nextTier) {
    return {
      progress: 100,
      ratingsToNext: 0,
      currentTier,
      nextTier: null,
    }
  }
  
  const ratingsInCurrentTier = ratingCount - currentTier.minRatings
  const ratingsNeededForNext = nextTier.minRatings - currentTier.minRatings
  const progress = Math.min(100, (ratingsInCurrentTier / ratingsNeededForNext) * 100)
  const ratingsToNext = nextTier.minRatings - ratingCount
  
  return {
    progress,
    ratingsToNext,
    currentTier,
    nextTier,
  }
}

/**
 * Get milestones between current and next tier
 */
export function getMilestones(ratingCount: number): {
  milestone: number
  reached: boolean
  label: string
}[] {
  const { currentTier, nextTier } = getProgressToNextTier(ratingCount)
  
  if (!nextTier) return []
  
  const milestones: { milestone: number; reached: boolean; label: string }[] = []
  const range = nextTier.minRatings - currentTier.minRatings
  
  // Create 4 milestones (25%, 50%, 75%, 100%)
  for (let i = 1; i <= 4; i++) {
    const milestone = currentTier.minRatings + Math.floor((range * i) / 4)
    milestones.push({
      milestone,
      reached: ratingCount >= milestone,
      label: i === 4 ? nextTier.name : `${i * 25}%`,
    })
  }
  
  return milestones
}

/**
 * Calculate confidence accuracy based on tier
 */
export function getConfidenceAccuracy(ratingCount: number): number {
  const tier = getCurrentTier(ratingCount)
  return tier.maxConfidence
}

/**
 * Get motivational message based on progress
 */
export function getMotivationalMessage(ratingCount: number): string {
  const { ratingsToNext, nextTier, progress } = getProgressToNextTier(ratingCount)
  
  if (!nextTier) {
    return "You've reached Master tier! Your taste profile is elite."
  }
  
  if (progress < 25) {
    return `Rate ${ratingsToNext} more albums to reach ${nextTier.name} tier`
  } else if (progress < 50) {
    return `You're making progress! ${ratingsToNext} more to ${nextTier.name}`
  } else if (progress < 75) {
    return `Halfway to ${nextTier.name}! Keep going!`
  } else {
    return `Almost there! Just ${ratingsToNext} more to unlock ${nextTier.name}!`
  }
}
