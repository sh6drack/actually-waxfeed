/**
 * Prediction Engine - Predicts user ratings based on Audio DNA
 *
 * Uses feature similarity, correlation-based prediction, and similar album
 * averaging to predict how a user will rate an album.
 */

import { prisma } from './prisma'
import { FeatureRange, FeatureCorrelations } from './audio-dna'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface AlbumAudioProfile {
  avgEnergy: number
  avgValence: number
  avgDanceability: number
  avgAcousticness: number
  avgTempo: number
  avgLoudness?: number
}

export interface PredictionResult {
  predictedRating: number
  ratingRange: { min: number; max: number }
  suggestedVibes: string[]
  confidenceLevel: number // 0-1
  reasoning: string[]
}

export interface UserAudioDNA {
  preferredEnergy: FeatureRange
  preferredValence: FeatureRange
  preferredDanceability: FeatureRange
  preferredAcousticness: FeatureRange
  preferredTempo: FeatureRange
  featureCorrelations: FeatureCorrelations
  vibeAudioMapping: Record<string, Partial<FeatureCorrelations>> | null
  totalPredictions: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Vibe-to-Audio Mapping (static baseline)
// Maps POLARITY_DESCRIPTORS to expected audio feature ranges
// ═══════════════════════════════════════════════════════════════════════════════

const VIBE_AUDIO_BASELINE: Record<string, {
  energy?: { min: number; max: number }
  valence?: { min: number; max: number }
  danceability?: { min: number; max: number }
  acousticness?: { min: number; max: number }
}> = {
  // Arousal dimension
  explosive: { energy: { min: 0.85, max: 1 }, danceability: { min: 0.5, max: 1 } },
  driving: { energy: { min: 0.7, max: 1 }, danceability: { min: 0.6, max: 1 } },
  simmering: { energy: { min: 0.4, max: 0.7 } },
  subdued: { energy: { min: 0, max: 0.4 } },

  // Valence dimension
  euphoric: { energy: { min: 0.7, max: 1 }, valence: { min: 0.75, max: 1 }, danceability: { min: 0.65, max: 1 } },
  triumphant: { energy: { min: 0.6, max: 1 }, valence: { min: 0.7, max: 1 } },
  melancholic: { energy: { min: 0.2, max: 0.5 }, valence: { min: 0.1, max: 0.4 } },
  dark: { valence: { min: 0, max: 0.3 }, energy: { min: 0.3, max: 0.8 } },
  anxious: { valence: { min: 0.2, max: 0.5 }, energy: { min: 0.5, max: 0.8 } },

  // Texture dimension
  lush: { acousticness: { min: 0.3, max: 0.7 } },
  sparse: { acousticness: { min: 0.4, max: 1 }, energy: { min: 0, max: 0.5 } },
  gritty: { acousticness: { min: 0, max: 0.4 }, energy: { min: 0.5, max: 1 } },
  crystalline: { acousticness: { min: 0.2, max: 0.6 } },

  // Temporal dimension
  hypnotic: { danceability: { min: 0.65, max: 1 }, energy: { min: 0.4, max: 0.75 } },
  chaotic: { energy: { min: 0.7, max: 1 } },
  groovy: { danceability: { min: 0.7, max: 1 } },
  floating: { energy: { min: 0, max: 0.4 }, acousticness: { min: 0.3, max: 1 } },

  // Scale dimension
  epic: { energy: { min: 0.6, max: 1 } },
  intimate: { energy: { min: 0, max: 0.45 }, acousticness: { min: 0.4, max: 1 } },
  visceral: { energy: { min: 0.65, max: 1 } },
  ethereal: { acousticness: { min: 0.3, max: 0.8 }, energy: { min: 0.2, max: 0.6 } },

  // Authenticity dimension
  raw: { acousticness: { min: 0, max: 0.4 }, energy: { min: 0.5, max: 1 } },
  polished: { valence: { min: 0.4, max: 0.8 }, danceability: { min: 0.45, max: 0.85 } },
  soulful: { valence: { min: 0.3, max: 0.7 }, acousticness: { min: 0.2, max: 0.7 } },

  // Narrative dimension
  cinematic: { energy: { min: 0.4, max: 0.8 } },
  abstract: { energy: { min: 0.3, max: 0.7 } },
  confessional: { acousticness: { min: 0.3, max: 0.8 }, energy: { min: 0.2, max: 0.6 } },

  // Novelty dimension
  avant_garde: { energy: { min: 0.3, max: 0.9 } },
  nostalgic: { valence: { min: 0.3, max: 0.7 } },
  futuristic: { energy: { min: 0.5, max: 0.9 }, acousticness: { min: 0, max: 0.4 } },
  timeless: {},
}

// ═══════════════════════════════════════════════════════════════════════════════
// Prediction computation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute how well an album's features match a user's preferred range
 */
function computeFeatureSimilarity(
  albumProfile: AlbumAudioProfile,
  userDNA: UserAudioDNA
): number {
  const features: Array<{ albumValue: number; range: FeatureRange }> = [
    { albumValue: albumProfile.avgEnergy, range: userDNA.preferredEnergy },
    { albumValue: albumProfile.avgValence, range: userDNA.preferredValence },
    { albumValue: albumProfile.avgDanceability, range: userDNA.preferredDanceability },
    { albumValue: albumProfile.avgAcousticness, range: userDNA.preferredAcousticness },
    { albumValue: albumProfile.avgTempo / 200, range: { ...userDNA.preferredTempo, min: userDNA.preferredTempo.min / 200, max: userDNA.preferredTempo.max / 200, sweetSpot: userDNA.preferredTempo.sweetSpot / 200 } },
  ]

  let totalScore = 0
  let totalWeight = 0

  for (const { albumValue, range } of features) {
    // Score based on distance from sweet spot, normalized by range width
    const rangeWidth = range.max - range.min || 1
    const distanceFromSweet = Math.abs(albumValue - range.sweetSpot)
    const normalizedDistance = distanceFromSweet / rangeWidth

    // Convert to a 0-1 score (closer to sweet spot = higher score)
    const featureScore = Math.max(0, 1 - normalizedDistance)

    totalScore += featureScore * range.weight
    totalWeight += range.weight
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0.5
}

/**
 * Predict rating based on feature correlations
 */
function computeCorrelationPrediction(
  albumProfile: AlbumAudioProfile,
  correlations: FeatureCorrelations
): number {
  // Base rating of 5.5 (neutral)
  let predictedRating = 5.5

  // Apply correlations (each can shift rating by up to 1 point)
  const features: Array<{ value: number; correlation: number }> = [
    { value: albumProfile.avgEnergy, correlation: correlations.energy },
    { value: albumProfile.avgValence, correlation: correlations.valence },
    { value: albumProfile.avgDanceability, correlation: correlations.danceability },
    { value: albumProfile.avgAcousticness, correlation: correlations.acousticness },
    { value: albumProfile.avgTempo / 200, correlation: correlations.tempo },
  ]

  for (const { value, correlation } of features) {
    // Feature value is 0-1, correlation is -1 to 1
    // High correlation + high feature value = positive contribution
    // High correlation + low feature value = negative contribution
    const contribution = (value - 0.5) * correlation * 2 // Scale to +-1 per feature
    predictedRating += contribution
  }

  return Math.max(0, Math.min(10, predictedRating))
}

/**
 * Get average rating from similar albums the user has rated
 */
async function computeSimilarAlbumAverage(
  userId: string,
  albumProfile: AlbumAudioProfile
): Promise<number | null> {
  // Get recent reviews with audio profiles
  const reviews = await prisma.review.findMany({
    where: { userId },
    select: {
      rating: true,
      album: {
        select: {
          audioProfile: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Filter to reviews with audio profiles
  const reviewsWithAudio = reviews.filter(r => r.album.audioProfile !== null)

  if (reviewsWithAudio.length < 3) return null

  // Compute similarity scores
  const withSimilarity = reviewsWithAudio.map(r => {
    const profile = r.album.audioProfile as any

    // Euclidean distance in feature space
    const distance = Math.sqrt(
      (profile.avgEnergy - albumProfile.avgEnergy) ** 2 +
      (profile.avgValence - albumProfile.avgValence) ** 2 +
      (profile.avgDanceability - albumProfile.avgDanceability) ** 2 +
      (profile.avgAcousticness - albumProfile.avgAcousticness) ** 2 +
      ((profile.avgTempo - albumProfile.avgTempo) / 200) ** 2
    )

    // Convert distance to similarity (0 distance = 1 similarity)
    const similarity = 1 / (1 + distance * 5)

    return { rating: r.rating, similarity }
  })

  // Sort by similarity and take top 10
  withSimilarity.sort((a, b) => b.similarity - a.similarity)
  const topSimilar = withSimilarity.slice(0, 10)

  if (topSimilar.length === 0) return null

  // Weighted average by similarity
  const totalWeight = topSimilar.reduce((s, r) => s + r.similarity, 0)
  const weightedSum = topSimilar.reduce((s, r) => s + r.rating * r.similarity, 0)

  return weightedSum / totalWeight
}

/**
 * Suggest vibes based on album audio features
 */
function suggestVibes(albumProfile: AlbumAudioProfile): string[] {
  const suggestions: Array<{ vibe: string; score: number }> = []

  for (const [vibe, ranges] of Object.entries(VIBE_AUDIO_BASELINE)) {
    let matchScore = 0
    let totalChecks = 0

    if (ranges.energy) {
      totalChecks++
      if (albumProfile.avgEnergy >= ranges.energy.min && albumProfile.avgEnergy <= ranges.energy.max) {
        matchScore++
      }
    }
    if (ranges.valence) {
      totalChecks++
      if (albumProfile.avgValence >= ranges.valence.min && albumProfile.avgValence <= ranges.valence.max) {
        matchScore++
      }
    }
    if (ranges.danceability) {
      totalChecks++
      if (albumProfile.avgDanceability >= ranges.danceability.min && albumProfile.avgDanceability <= ranges.danceability.max) {
        matchScore++
      }
    }
    if (ranges.acousticness) {
      totalChecks++
      if (albumProfile.avgAcousticness >= ranges.acousticness.min && albumProfile.avgAcousticness <= ranges.acousticness.max) {
        matchScore++
      }
    }

    if (totalChecks > 0) {
      suggestions.push({ vibe, score: matchScore / totalChecks })
    }
  }

  // Sort by score and return top 5 with score >= 0.5
  suggestions.sort((a, b) => b.score - a.score)
  return suggestions
    .filter(s => s.score >= 0.5)
    .slice(0, 5)
    .map(s => s.vibe)
}

/**
 * Compute confidence level based on available data and historical accuracy
 */
function computeConfidence(
  userDNA: UserAudioDNA,
  hasAlbumProfile: boolean,
  predictionAccuracy?: number
): number {
  // Base confidence from prediction volume (more predictions = more reliable)
  // Caps at 0.25 after 100 predictions
  const volumeConfidence = Math.min(0.25, (userDNA.totalPredictions / 100) * 0.25)

  // Confidence from actual historical accuracy (if available)
  // This is the most important factor - actual track record
  // predictionAccuracy is 0-1, so scale to 0.35 max
  const accuracyConfidence = (predictionAccuracy ?? 0.5) * 0.35

  // Confidence from data quality (do we have audio features?)
  const dataConfidence = hasAlbumProfile ? 0.2 : 0.05

  // Confidence from correlation strength (strong correlations = more predictable taste)
  const correlations = userDNA.featureCorrelations
  const avgAbsCorrelation = Object.values(correlations)
    .map(Math.abs)
    .reduce((a, b) => a + b, 0) / 5
  const correlationConfidence = avgAbsCorrelation * 0.2

  const total = volumeConfidence + accuracyConfidence + dataConfidence + correlationConfidence

  // Clamp between 0.1 (minimum confidence) and 0.95 (never 100% sure)
  return Math.max(0.1, Math.min(0.95, total))
}

/**
 * Generate reasoning strings for why this prediction was made
 * Now with more personality and variety
 */
function generateReasoning(
  albumProfile: AlbumAudioProfile,
  userDNA: UserAudioDNA,
  featureSimilarity: number
): string[] {
  const reasons: string[] = []
  const energy = albumProfile.avgEnergy
  const valence = albumProfile.avgValence
  const dance = albumProfile.avgDanceability
  const acoustic = albumProfile.avgAcousticness
  const tempo = albumProfile.avgTempo
  const ec = userDNA.featureCorrelations.energy
  const vc = userDNA.featureCorrelations.valence
  const dc = userDNA.featureCorrelations.danceability
  const ac = userDNA.featureCorrelations.acousticness

  // Energy reasoning with personality
  if (energy > 0.8 && ec > 0.3) {
    const options = [
      'This hits hard – exactly what you crave',
      'High octane energy, right in your wheelhouse',
      'The intensity here matches your taste perfectly',
      'Maximum energy – you live for this',
      'Power levels aligned with your preferences',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (energy < 0.3 && ec < -0.2) {
    const options = [
      'Subdued energy you tend to vibe with',
      'The restrained sound suits your sensibilities',
      'Understated power – your kind of thing',
      'Calm intensity that resonates with you',
      'The quiet energy matches your wavelength',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (energy > 0.7 && ec < -0.2) {
    const options = [
      'More intense than your usual picks',
      'Higher energy than you typically prefer',
      'Pushing your energy comfort zone',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (energy < 0.3 && ec > 0.3) {
    reasons.push('Lower energy than your usual – could be a wildcard')
  }

  // Valence/mood reasoning
  if (valence > 0.75 && vc > 0.25) {
    const options = [
      'The uplifting mood aligns with what you love',
      'Positive vibes that match your taste',
      'This brightness tends to click with you',
      'Joyful energy that hits your sweet spot',
      'The optimistic tone suits your profile',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (valence < 0.3 && vc < -0.2) {
    const options = [
      'The melancholy here resonates with you',
      'Darker mood that suits your palette',
      'The emotional weight matches your preferences',
      'This heaviness is your comfort zone',
      'The brooding atmosphere speaks to you',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (valence > 0.7 && vc < -0.3) {
    reasons.push('Brighter than your usual fare')
  } else if (valence < 0.3 && vc > 0.3) {
    reasons.push('Darker mood than you typically gravitate toward')
  } else if (valence > 0.4 && valence < 0.6) {
    // Neutral valence observations
    const neutralOptions = [
      'Emotionally balanced – could go either way',
      'Neither dark nor bright, interesting middle ground',
    ]
    if (Math.random() > 0.7) reasons.push(neutralOptions[Math.floor(Math.random() * neutralOptions.length)])
  }

  // Danceability reasoning
  if (dance > 0.75 && dc > 0.3) {
    const options = [
      'The groove factor is high – you love that',
      'Highly danceable, which you rate well',
      'Strong rhythmic pull that works for you',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (dance < 0.4 && dc < -0.2) {
    reasons.push('Less focused on groove – which you appreciate')
  }

  // Acousticness reasoning
  if (acoustic > 0.65 && ac > 0.25) {
    const options = [
      'Organic/acoustic elements you enjoy',
      'The natural instrumentation fits your taste',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (acoustic < 0.25 && ac < -0.2) {
    const options = [
      'Produced/electronic sound you prefer',
      'The polished production style suits you',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  }

  // Tempo reasoning
  if (tempo > 140 && userDNA.preferredTempo.sweetSpot > 130) {
    reasons.push('Fast tempo in your sweet spot')
  } else if (tempo < 90 && userDNA.preferredTempo.sweetSpot < 100) {
    reasons.push('Slower pace that you tend to appreciate')
  }

  // Similarity reasoning
  if (featureSimilarity > 0.75) {
    const options = [
      'Sonically similar to albums you\'ve loved',
      'This has the DNA of your favorites',
      'Sound profile matches your top-rated albums',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  } else if (featureSimilarity < 0.25) {
    const options = [
      'Outside your typical sonic comfort zone',
      'Different from your usual picks',
      'A departure from your established preferences',
    ]
    reasons.push(options[Math.floor(Math.random() * options.length)])
  }

  // If no specific reasons, add contextual fallback
  if (reasons.length === 0) {
    const fallbacks = [
      'Based on patterns in your rating history',
      'Drawing from your overall listening profile',
      'Analyzing your established preferences',
      'Cross-referencing similar albums you\'ve rated',
      'Consulting your taste fingerprint',
      'Running the numbers on your profile',
    ]
    reasons.push(fallbacks[Math.floor(Math.random() * fallbacks.length)])
  }

  // Occasionally add a second contextual reason
  if (reasons.length === 1 && Math.random() > 0.6) {
    const secondaryReasons = [
      'Your history suggests a pattern here',
      'This fits a trend in your ratings',
      'Similar sonic territory to past favorites',
    ]
    reasons.push(secondaryReasons[Math.floor(Math.random() * secondaryReasons.length)])
  }

  return reasons.slice(0, 3)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main prediction function
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Predict how a user will rate an album based on their Audio DNA
 */
export async function predictRating(
  userId: string,
  albumProfile: AlbumAudioProfile
): Promise<PredictionResult> {
  // Get user's Audio DNA
  const audioDNA = await prisma.userAudioDNA.findUnique({
    where: { userId },
  })

  // Default prediction for users without Audio DNA
  if (!audioDNA) {
    return {
      predictedRating: 6.5,
      ratingRange: { min: 4, max: 9 },
      suggestedVibes: suggestVibes(albumProfile),
      confidenceLevel: 0.1,
      reasoning: ['First time predicting for you - still learning!'],
    }
  }

  const userDNA: UserAudioDNA = {
    preferredEnergy: audioDNA.preferredEnergy as any,
    preferredValence: audioDNA.preferredValence as any,
    preferredDanceability: audioDNA.preferredDanceability as any,
    preferredAcousticness: audioDNA.preferredAcousticness as any,
    preferredTempo: audioDNA.preferredTempo as any,
    featureCorrelations: audioDNA.featureCorrelations as any,
    vibeAudioMapping: audioDNA.vibeAudioMapping as any,
    totalPredictions: audioDNA.totalPredictions,
  }

  // 1. Compute feature similarity score (how well album fits preferred ranges)
  const featureSimilarity = computeFeatureSimilarity(albumProfile, userDNA)

  // 2. Compute correlation-based prediction
  const correlationPrediction = computeCorrelationPrediction(albumProfile, userDNA.featureCorrelations)

  // 3. Get similar album average
  const similarAlbumAvg = await computeSimilarAlbumAverage(userId, albumProfile)

  // 4. Combine predictions with weights
  let predictedRating: number
  if (similarAlbumAvg !== null) {
    predictedRating =
      featureSimilarity * 10 * 0.25 + // Feature similarity -> 0-10 scale, 25% weight
      correlationPrediction * 0.35 + // Correlation prediction, 35% weight
      similarAlbumAvg * 0.4 // Similar album average, 40% weight
  } else {
    predictedRating =
      featureSimilarity * 10 * 0.4 + // Feature similarity -> 0-10 scale, 40% weight
      correlationPrediction * 0.6 // Correlation prediction, 60% weight
  }

  // Clamp to valid range
  predictedRating = Math.max(0, Math.min(10, predictedRating))

  // Get historical accuracy from audioDNA
  const predictionAccuracy = audioDNA.predictionAccuracy

  // Compute confidence using actual historical accuracy
  const confidenceLevel = computeConfidence(userDNA, true, predictionAccuracy)

  // Compute rating range based on confidence
  // Higher confidence = tighter range (1.0-2.0), lower = wider (3.0-4.0)
  const rangeWidth = 1.0 + (1 - confidenceLevel) * 3.0
  const ratingRange = {
    min: Math.max(0, Math.round((predictedRating - rangeWidth) * 10) / 10),
    max: Math.min(10, Math.round((predictedRating + rangeWidth) * 10) / 10),
  }

  // Suggest vibes
  const suggestedVibes = suggestVibes(albumProfile)

  // Generate reasoning
  let reasoning = generateReasoning(albumProfile, userDNA, featureSimilarity)

  // Add low-confidence disclaimer if needed
  if (confidenceLevel < 0.3 && userDNA.totalPredictions < 10) {
    const learningPhrases = [
      'Still learning your taste...',
      'Early in the deciphering process',
      'Building your profile...',
    ]
    reasoning = [learningPhrases[Math.floor(Math.random() * learningPhrases.length)], ...reasoning.slice(0, 2)]
  } else if (confidenceLevel < 0.4) {
    const guessPhases = [
      'Taking an educated guess',
      'Working with limited data here',
      'Not fully confident, but...',
      'Prediction in beta mode',
    ]
    reasoning = [guessPhases[Math.floor(Math.random() * guessPhases.length)], ...reasoning.slice(0, 2)]
  }

  return {
    predictedRating: Math.round(predictedRating * 10) / 10, // Round to 1 decimal
    ratingRange,
    suggestedVibes,
    confidenceLevel,
    reasoning,
  }
}

/**
 * Check if the prediction matches the actual rating
 * Uses dynamic thresholds based on confidence level
 */
export function checkPredictionMatch(
  predictedRating: number,
  actualRating: number,
  confidenceLevel: number
): {
  isMatch: boolean
  isSurprise: boolean
  isPerfect: boolean
  difference: number
  matchQuality: 'perfect' | 'close' | 'match' | 'miss' | 'surprise'
} {
  const difference = Math.abs(predictedRating - actualRating)

  // Match threshold depends on confidence (higher confidence = stricter threshold)
  // High confidence (0.8+): threshold of 1.0-1.3
  // Medium confidence (0.5): threshold of 1.5
  // Low confidence (0.2): threshold of 2.0
  const matchThreshold = 1.0 + (1 - confidenceLevel) * 1.0

  // Surprise threshold also scales with confidence
  // High confidence surprise = difference > 2.0
  // Low confidence surprise = difference > 2.5 (harder to surprise when uncertain)
  const surpriseThreshold = 2.0 + (1 - confidenceLevel) * 0.5

  const isPerfect = difference <= 0.5
  const isMatch = difference <= matchThreshold
  const isSurprise = difference > surpriseThreshold

  // Determine match quality for different celebration types
  let matchQuality: 'perfect' | 'close' | 'match' | 'miss' | 'surprise'
  if (isPerfect) {
    matchQuality = 'perfect'
  } else if (difference <= 1.0) {
    matchQuality = 'close'
  } else if (isMatch) {
    matchQuality = 'match'
  } else if (isSurprise) {
    matchQuality = 'surprise'
  } else {
    matchQuality = 'miss'
  }

  return {
    isMatch,
    isSurprise,
    isPerfect,
    difference,
    matchQuality,
  }
}
