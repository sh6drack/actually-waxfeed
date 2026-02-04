/**
 * Audio DNA - User audio feature preference learning system
 *
 * This module learns user taste preferences from their ratings and audio features,
 * enabling prediction of how they'll rate albums before they rate them.
 */

import { prisma } from './prisma'
import { AlbumAudioProfileData } from './spotify'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface FeatureRange {
  min: number
  max: number
  sweetSpot: number // The value they rate highest
  weight: number // How much this feature matters to their ratings (0-1)
}

export interface FeatureCorrelations {
  energy: number
  valence: number
  danceability: number
  acousticness: number
  tempo: number
  loudness: number
}

export interface UserAudioDNAData {
  preferredEnergy: FeatureRange
  preferredValence: FeatureRange
  preferredDanceability: FeatureRange
  preferredAcousticness: FeatureRange
  preferredTempo: FeatureRange
  featureCorrelations: FeatureCorrelations
  vibeAudioMapping: Record<string, Partial<FeatureCorrelations>> | null
  predictionAccuracy: number
  totalPredictions: number
  correctPredictions: number
  currentPredictionStreak: number
  longestPredictionStreak: number
  decipherProgress: number
  surpriseCount: number
}

export interface RatingWithAudioProfile {
  rating: number
  vibes: string[]
  audioProfile: {
    avgEnergy: number
    avgValence: number
    avgDanceability: number
    avgAcousticness: number
    avgTempo: number
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default values for new users
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_FEATURE_RANGE: FeatureRange = {
  min: 0,
  max: 1,
  sweetSpot: 0.5,
  weight: 0.5,
}

const DEFAULT_TEMPO_RANGE: FeatureRange = {
  min: 60,
  max: 180,
  sweetSpot: 120,
  weight: 0.3,
}

const DEFAULT_CORRELATIONS: FeatureCorrelations = {
  energy: 0,
  valence: 0,
  danceability: 0,
  acousticness: 0,
  tempo: 0,
  loudness: 0,
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core computation functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute feature correlations with ratings using Pearson correlation
 */
function computeCorrelation(ratings: number[], features: number[]): number {
  if (ratings.length < 5) return 0

  const n = ratings.length
  const sumR = ratings.reduce((a, b) => a + b, 0)
  const sumF = features.reduce((a, b) => a + b, 0)
  const sumRF = ratings.reduce((s, r, i) => s + r * features[i], 0)
  const sumR2 = ratings.reduce((s, r) => s + r * r, 0)
  const sumF2 = features.reduce((s, f) => s + f * f, 0)

  const numerator = n * sumRF - sumR * sumF
  const denominator = Math.sqrt(
    (n * sumR2 - sumR * sumR) * (n * sumF2 - sumF * sumF)
  )

  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Find the optimal range for a feature based on high-rated albums
 */
function computePreferredRange(
  ratings: number[],
  featureValues: number[],
  isNormalized = true
): FeatureRange {
  if (ratings.length < 5) {
    return isNormalized ? DEFAULT_FEATURE_RANGE : DEFAULT_TEMPO_RANGE
  }

  // Weight feature values by rating (higher ratings = more weight)
  const weightedValues: Array<{ value: number; weight: number }> = []
  for (let i = 0; i < ratings.length; i++) {
    // Only consider ratings >= 6 for preference learning
    if (ratings[i] >= 6) {
      // Weight by how high the rating is (6 = 1x, 10 = 5x)
      const weight = ratings[i] - 5
      weightedValues.push({ value: featureValues[i], weight })
    }
  }

  if (weightedValues.length < 3) {
    return isNormalized ? DEFAULT_FEATURE_RANGE : DEFAULT_TEMPO_RANGE
  }

  // Compute weighted average as sweet spot
  const totalWeight = weightedValues.reduce((s, v) => s + v.weight, 0)
  const sweetSpot = weightedValues.reduce((s, v) => s + v.value * v.weight, 0) / totalWeight

  // Find range that contains 80% of high-rated albums
  const sortedValues = weightedValues.map(v => v.value).sort((a, b) => a - b)
  const p10 = Math.floor(sortedValues.length * 0.1)
  const p90 = Math.floor(sortedValues.length * 0.9)

  const min = sortedValues[p10]
  const max = sortedValues[p90]

  // Compute correlation to determine weight
  const correlation = Math.abs(computeCorrelation(ratings, featureValues))

  return {
    min,
    max,
    sweetSpot,
    weight: Math.min(1, correlation * 2), // Scale correlation to 0-1
  }
}

/**
 * Learn vibe-to-audio mappings from user's rating history
 */
function learnVibeAudioMapping(
  ratingsWithVibes: Array<{ vibes: string[]; audioProfile: RatingWithAudioProfile['audioProfile'] }>
): Record<string, Partial<FeatureCorrelations>> {
  const mapping: Record<string, { energySum: number; valenceSum: number; danceSum: number; count: number }> = {}

  for (const { vibes, audioProfile } of ratingsWithVibes) {
    for (const vibe of vibes) {
      if (!mapping[vibe]) {
        mapping[vibe] = { energySum: 0, valenceSum: 0, danceSum: 0, count: 0 }
      }
      mapping[vibe].energySum += audioProfile.avgEnergy
      mapping[vibe].valenceSum += audioProfile.avgValence
      mapping[vibe].danceSum += audioProfile.avgDanceability
      mapping[vibe].count++
    }
  }

  const result: Record<string, Partial<FeatureCorrelations>> = {}
  for (const [vibe, data] of Object.entries(mapping)) {
    if (data.count >= 3) { // Need at least 3 uses to learn
      result[vibe] = {
        energy: data.energySum / data.count,
        valence: data.valenceSum / data.count,
        danceability: data.danceSum / data.count,
      }
    }
  }

  return result
}

/**
 * Compute decipher progress (how well we understand the user's taste)
 * Formula: accuracy * 40 + (ratings/100) * 20 + vibeConsistency * 20 + correlationStrength * 20
 */
function computeDecipherProgress(
  accuracy: number,
  totalRatings: number,
  vibeConsistency: number,
  correlationStrength: number
): number {
  const accuracyComponent = accuracy * 40
  const dataComponent = Math.min(20, (totalRatings / 100) * 20)
  const vibeComponent = vibeConsistency * 20
  const correlationComponent = correlationStrength * 20

  return Math.min(100, accuracyComponent + dataComponent + vibeComponent + correlationComponent)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute or recompute a user's Audio DNA from their rating history
 */
export async function computeUserAudioDNA(userId: string): Promise<UserAudioDNAData | null> {
  // Get all user reviews with album audio profiles
  const reviews = await prisma.review.findMany({
    where: { userId },
    select: {
      rating: true,
      vibes: true,
      album: {
        select: {
          id: true,
          audioProfile: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // Last 500 reviews for computation
  })

  // Filter to reviews that have audio profiles
  const reviewsWithAudio = reviews.filter(r => r.album.audioProfile !== null)

  if (reviewsWithAudio.length < 5) {
    // Not enough data to compute Audio DNA
    return null
  }

  // Extract data for correlation computation
  const ratings = reviewsWithAudio.map(r => r.rating)
  const audioProfiles = reviewsWithAudio.map(r => r.album.audioProfile as any)

  const energies = audioProfiles.map(p => p.avgEnergy)
  const valences = audioProfiles.map(p => p.avgValence)
  const danceabilities = audioProfiles.map(p => p.avgDanceability)
  const acousticnesses = audioProfiles.map(p => p.avgAcousticness)
  const tempos = audioProfiles.map(p => p.avgTempo)
  const loudnesses = audioProfiles.map(p => p.avgLoudness || -10)

  // Compute correlations
  const featureCorrelations: FeatureCorrelations = {
    energy: computeCorrelation(ratings, energies),
    valence: computeCorrelation(ratings, valences),
    danceability: computeCorrelation(ratings, danceabilities),
    acousticness: computeCorrelation(ratings, acousticnesses),
    tempo: computeCorrelation(ratings, tempos),
    loudness: computeCorrelation(ratings, loudnesses),
  }

  // Compute preferred ranges
  const preferredEnergy = computePreferredRange(ratings, energies)
  const preferredValence = computePreferredRange(ratings, valences)
  const preferredDanceability = computePreferredRange(ratings, danceabilities)
  const preferredAcousticness = computePreferredRange(ratings, acousticnesses)
  const preferredTempo = computePreferredRange(ratings, tempos, false)

  // Learn vibe-audio mapping
  const vibeAudioMapping = learnVibeAudioMapping(
    reviewsWithAudio.map(r => ({
      vibes: r.vibes,
      audioProfile: r.album.audioProfile as any,
    }))
  )

  // Get existing stats to preserve
  const existingDNA = await prisma.userAudioDNA.findUnique({
    where: { userId },
    select: {
      predictionAccuracy: true,
      totalPredictions: true,
      correctPredictions: true,
      currentPredictionStreak: true,
      longestPredictionStreak: true,
      surpriseCount: true,
    }
  })

  // Compute correlation strength (average of absolute correlations)
  const correlationStrength = Object.values(featureCorrelations)
    .map(Math.abs)
    .reduce((a, b) => a + b, 0) / 6

  // Compute vibe consistency (how consistently they use vibes)
  const vibeUsageCounts = reviewsWithAudio.flatMap(r => r.vibes)
  const uniqueVibes = new Set(vibeUsageCounts)
  const vibeConsistency = uniqueVibes.size > 0
    ? Math.min(1, vibeUsageCounts.length / (uniqueVibes.size * 3))
    : 0

  // Compute decipher progress
  const decipherProgress = computeDecipherProgress(
    existingDNA?.predictionAccuracy || 0,
    reviews.length,
    vibeConsistency,
    correlationStrength
  )

  return {
    preferredEnergy,
    preferredValence,
    preferredDanceability,
    preferredAcousticness,
    preferredTempo,
    featureCorrelations,
    vibeAudioMapping,
    predictionAccuracy: existingDNA?.predictionAccuracy || 0,
    totalPredictions: existingDNA?.totalPredictions || 0,
    correctPredictions: existingDNA?.correctPredictions || 0,
    currentPredictionStreak: existingDNA?.currentPredictionStreak || 0,
    longestPredictionStreak: existingDNA?.longestPredictionStreak || 0,
    decipherProgress,
    surpriseCount: existingDNA?.surpriseCount || 0,
  }
}

/**
 * Save user's Audio DNA to the database
 */
export async function saveUserAudioDNA(userId: string, data: UserAudioDNAData): Promise<void> {
  await prisma.userAudioDNA.upsert({
    where: { userId },
    update: {
      preferredEnergy: data.preferredEnergy as any,
      preferredValence: data.preferredValence as any,
      preferredDanceability: data.preferredDanceability as any,
      preferredAcousticness: data.preferredAcousticness as any,
      preferredTempo: data.preferredTempo as any,
      featureCorrelations: data.featureCorrelations as any,
      vibeAudioMapping: data.vibeAudioMapping as any,
      predictionAccuracy: data.predictionAccuracy,
      totalPredictions: data.totalPredictions,
      correctPredictions: data.correctPredictions,
      currentPredictionStreak: data.currentPredictionStreak,
      longestPredictionStreak: data.longestPredictionStreak,
      decipherProgress: data.decipherProgress,
      surpriseCount: data.surpriseCount,
    },
    create: {
      userId,
      preferredEnergy: data.preferredEnergy as any,
      preferredValence: data.preferredValence as any,
      preferredDanceability: data.preferredDanceability as any,
      preferredAcousticness: data.preferredAcousticness as any,
      preferredTempo: data.preferredTempo as any,
      featureCorrelations: data.featureCorrelations as any,
      vibeAudioMapping: data.vibeAudioMapping as any,
      predictionAccuracy: data.predictionAccuracy,
      totalPredictions: data.totalPredictions,
      correctPredictions: data.correctPredictions,
      currentPredictionStreak: data.currentPredictionStreak,
      longestPredictionStreak: data.longestPredictionStreak,
      decipherProgress: data.decipherProgress,
      surpriseCount: data.surpriseCount,
    },
  })
}

/**
 * Update Audio DNA after a rating is submitted (learning from the result)
 */
export async function updateAudioDNAFromRating(
  userId: string,
  predictedRating: number,
  actualRating: number,
  _predictedVibes: string[],
  actualVibes: string[],
  albumAudioProfile: {
    avgEnergy: number
    avgValence: number
    avgDanceability: number
    avgAcousticness: number
    avgTempo: number
  }
): Promise<{
  ratingMatch: boolean
  vibeMatchCount: number
  wasSurprise: boolean
  newStreak: number
  newDecipherProgress: number
}> {
  const existingDNA = await prisma.userAudioDNA.findUnique({
    where: { userId },
  })

  if (!existingDNA) {
    // User doesn't have Audio DNA yet, compute it
    const computed = await computeUserAudioDNA(userId)
    if (computed) {
      await saveUserAudioDNA(userId, computed)
    }
    return {
      ratingMatch: false,
      vibeMatchCount: 0,
      wasSurprise: false,
      newStreak: 0,
      newDecipherProgress: computed?.decipherProgress || 0,
    }
  }

  // Check if prediction was correct (within 1.5 points)
  const ratingMatch = Math.abs(predictedRating - actualRating) <= 1.5

  // Check vibe matches
  const vibeMatchCount = actualVibes.filter(v => _predictedVibes.includes(v)).length

  // Check if this was a surprise (> 2 points difference)
  const wasSurprise = Math.abs(predictedRating - actualRating) > 2

  // Update stats
  const newTotalPredictions = existingDNA.totalPredictions + 1
  const newCorrectPredictions = existingDNA.correctPredictions + (ratingMatch ? 1 : 0)
  const newAccuracy = newCorrectPredictions / newTotalPredictions

  // Update streak
  let newStreak = ratingMatch ? existingDNA.currentPredictionStreak + 1 : 0
  const newLongestStreak = Math.max(existingDNA.longestPredictionStreak, newStreak)

  // Update surprise count
  const newSurpriseCount = existingDNA.surpriseCount + (wasSurprise ? 1 : 0)

  // Recompute decipher progress
  // Get total review count for data component
  const reviewCount = await prisma.review.count({ where: { userId } })

  // Estimate vibe consistency from vibeAudioMapping
  const vibeMapping = existingDNA.vibeAudioMapping as Record<string, any> | null
  const vibeConsistency = vibeMapping ? Object.keys(vibeMapping).length / 32 : 0 // 32 total vibes

  // Estimate correlation strength
  const correlations = existingDNA.featureCorrelations as FeatureCorrelations | null
  const correlationStrength = correlations
    ? Object.values(correlations).map(Math.abs).reduce((a, b) => a + b, 0) / 6
    : 0

  const newDecipherProgress = computeDecipherProgress(
    newAccuracy,
    reviewCount,
    vibeConsistency,
    correlationStrength
  )

  // Update in database
  await prisma.userAudioDNA.update({
    where: { userId },
    data: {
      predictionAccuracy: newAccuracy,
      totalPredictions: newTotalPredictions,
      correctPredictions: newCorrectPredictions,
      currentPredictionStreak: newStreak,
      longestPredictionStreak: newLongestStreak,
      decipherProgress: newDecipherProgress,
      surpriseCount: newSurpriseCount,
    },
  })

  // Store prediction history
  await prisma.predictionHistory.create({
    data: {
      userId,
      albumId: '', // Will be set by caller
      predictedRating,
      predictedVibes: _predictedVibes,
      confidenceLevel: 0, // Will be set by caller
      actualRating,
      actualVibes,
      ratingMatch,
      vibeMatchCount,
      wasSurprise,
      albumAudioSignature: albumAudioProfile as any,
      predictionReasoning: [],
      ratedAt: new Date(),
    },
  })

  return {
    ratingMatch,
    vibeMatchCount,
    wasSurprise,
    newStreak,
    newDecipherProgress,
  }
}

/**
 * Get streak milestone message
 * More variety and personality at each milestone
 */
export function getStreakMessage(streak: number): string | null {
  // Add some variety with random selection
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  switch (streak) {
    case 3:
      return pick(['Getting warm...', 'The algorithm stirs...', 'A pattern emerges'])
    case 5:
      return pick(['We see you!', 'Connection established', 'Locked in'])
    case 7:
      return pick(['Lucky 7 – taste confirmed', 'On a roll'])
    case 10:
      return pick(['Taste twin!', 'Double digits!', 'You\'re an open book'])
    case 15:
      return pick(['Mind reader!', 'The system knows', 'Deeply understood'])
    case 20:
      return pick(['Predictable in the best way', 'Two-oh!', 'Crystal clear taste'])
    case 25:
      return pick(['Quarter century streak!', 'Elite predictor', 'Taste legend'])
    case 30:
      return pick(['30 in a row!?', 'Uncanny accuracy', 'Algorithm whisperer'])
    case 40:
      return pick(['Beyond prediction', '40 streak maestro'])
    case 50:
      return pick(['FIFTY! Legendary.', 'Half-century hero', 'The taste oracle'])
    case 75:
      return pick(['75 – you\'re a mystery solved', 'Three-quarters of 100!'])
    case 100:
      return pick(['💯 PERFECTION', 'Century club!', 'The ultimate streak'])
    default:
      // Additional messages at random intervals
      if (streak > 100 && streak % 25 === 0) {
        return `${streak} streak! Unbelievable.`
      }
      if (streak > 10 && streak % 10 === 0) {
        return `${streak} in a row!`
      }
      return null
  }
}

/**
 * Get decipher progress milestone message
 * More granular milestones with personality
 */
export function getDecipherMessage(progress: number): string | null {
  if (progress >= 99) return '🧬 Fully decoded – we know you'
  if (progress >= 95) return 'Taste Oracle status achieved'
  if (progress >= 90) return 'Almost completely mapped'
  if (progress >= 85) return 'Deep understanding unlocked'
  if (progress >= 80) return 'Your taste is 80% decoded'
  if (progress >= 75) return 'Three quarters deciphered'
  if (progress >= 70) return 'Strong patterns identified'
  if (progress >= 60) return 'Significant insights gathered'
  if (progress >= 50) return 'Halfway decoded!'
  if (progress >= 40) return 'Building your taste profile'
  if (progress >= 30) return 'Patterns emerging...'
  if (progress >= 20) return 'Learning your preferences'
  if (progress >= 10) return 'Gathering initial data'
  return null
}
