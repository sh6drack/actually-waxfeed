import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { computeUserAudioDNA, saveUserAudioDNA, getStreakMessage, getDecipherMessage } from '@/lib/audio-dna'

/**
 * POST /api/audio-dna/compute
 * Compute or recompute the user's Audio DNA from their rating history
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id

    // Compute Audio DNA from rating history
    const audioDNA = await computeUserAudioDNA(userId)

    if (!audioDNA) {
      return successResponse({
        computed: false,
        message: 'Not enough data to compute Audio DNA. Rate at least 5 albums to unlock predictions.',
        minRequired: 5,
      })
    }

    // Save to database
    await saveUserAudioDNA(userId, audioDNA)

    // Get milestone messages
    const streakMessage = getStreakMessage(audioDNA.currentPredictionStreak)
    const decipherMessage = getDecipherMessage(audioDNA.decipherProgress)

    return successResponse({
      computed: true,
      audioDNA: {
        decipherProgress: Math.round(audioDNA.decipherProgress),
        predictionAccuracy: Math.round(audioDNA.predictionAccuracy * 100),
        totalPredictions: audioDNA.totalPredictions,
        correctPredictions: audioDNA.correctPredictions,
        currentStreak: audioDNA.currentPredictionStreak,
        longestStreak: audioDNA.longestPredictionStreak,
        surpriseCount: audioDNA.surpriseCount,
        // Feature preferences summary
        preferences: {
          energy: {
            sweetSpot: Math.round(audioDNA.preferredEnergy.sweetSpot * 100),
            weight: Math.round(audioDNA.preferredEnergy.weight * 100),
          },
          valence: {
            sweetSpot: Math.round(audioDNA.preferredValence.sweetSpot * 100),
            weight: Math.round(audioDNA.preferredValence.weight * 100),
          },
          danceability: {
            sweetSpot: Math.round(audioDNA.preferredDanceability.sweetSpot * 100),
            weight: Math.round(audioDNA.preferredDanceability.weight * 100),
          },
          acousticness: {
            sweetSpot: Math.round(audioDNA.preferredAcousticness.sweetSpot * 100),
            weight: Math.round(audioDNA.preferredAcousticness.weight * 100),
          },
          tempo: {
            sweetSpot: Math.round(audioDNA.preferredTempo.sweetSpot),
            weight: Math.round(audioDNA.preferredTempo.weight * 100),
          },
        },
        // Feature correlations with ratings
        correlations: {
          energy: Math.round(audioDNA.featureCorrelations.energy * 100),
          valence: Math.round(audioDNA.featureCorrelations.valence * 100),
          danceability: Math.round(audioDNA.featureCorrelations.danceability * 100),
          acousticness: Math.round(audioDNA.featureCorrelations.acousticness * 100),
          tempo: Math.round(audioDNA.featureCorrelations.tempo * 100),
        },
      },
      milestones: {
        streakMessage,
        decipherMessage,
      },
    })
  } catch (error) {
    console.error('Error computing Audio DNA:', error)
    return errorResponse('Failed to compute Audio DNA', 500)
  }
}

/**
 * GET /api/audio-dna/compute
 * Get the user's current Audio DNA without recomputing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id

    // Import prisma here to avoid circular dependency
    const { prisma } = await import('@/lib/prisma')

    const audioDNA = await prisma.userAudioDNA.findUnique({
      where: { userId },
    })

    if (!audioDNA) {
      return successResponse({
        exists: false,
        message: 'No Audio DNA computed yet. Rate albums to start building your taste profile.',
      })
    }

    const streakMessage = getStreakMessage(audioDNA.currentPredictionStreak)
    const decipherMessage = getDecipherMessage(audioDNA.decipherProgress)

    return successResponse({
      exists: true,
      audioDNA: {
        decipherProgress: Math.round(audioDNA.decipherProgress),
        predictionAccuracy: Math.round(audioDNA.predictionAccuracy * 100),
        totalPredictions: audioDNA.totalPredictions,
        correctPredictions: audioDNA.correctPredictions,
        currentStreak: audioDNA.currentPredictionStreak,
        longestStreak: audioDNA.longestPredictionStreak,
        surpriseCount: audioDNA.surpriseCount,
        preferences: {
          energy: audioDNA.preferredEnergy,
          valence: audioDNA.preferredValence,
          danceability: audioDNA.preferredDanceability,
          acousticness: audioDNA.preferredAcousticness,
          tempo: audioDNA.preferredTempo,
        },
        correlations: audioDNA.featureCorrelations,
      },
      milestones: {
        streakMessage,
        decipherMessage,
      },
    })
  } catch (error) {
    console.error('Error getting Audio DNA:', error)
    return errorResponse('Failed to get Audio DNA', 500)
  }
}
