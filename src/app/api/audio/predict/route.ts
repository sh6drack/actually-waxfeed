import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { predictRating, checkPredictionMatch } from '@/lib/prediction-engine'
import { updateAudioDNAFromRating, getStreakMessage, getDecipherMessage } from '@/lib/audio-dna'
import { prisma } from '@/lib/prisma'

type CelebrationType = 'predicted' | 'surprise' | 'perfect' | 'close' | 'miss'

interface Celebration {
  type: CelebrationType
  message: string
}

function pickRandom<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)]
}

function generateCelebration(
  matchResult: ReturnType<typeof checkPredictionMatch>,
  actualRating: number,
  predictedRating: number,
  streakLost: boolean
): Celebration | null {
  if (matchResult.isPerfect) {
    return {
      type: 'perfect',
      message: pickRandom(['Nailed it!', 'Spot on!', 'Perfect read!', 'Exactly as predicted', 'We know your taste']),
    }
  }

  if (matchResult.matchQuality === 'close') {
    return {
      type: 'close',
      message: pickRandom(['So close!', 'Nearly perfect!', 'Right on target', 'Almost nailed it', 'Just a hair off']),
    }
  }

  if (matchResult.isMatch) {
    return {
      type: 'predicted',
      message: pickRandom(['Close enough!', 'In the ballpark', 'Prediction confirmed', 'We got it']),
    }
  }

  if (matchResult.isSurprise) {
    const messages = actualRating > predictedRating
      ? ['You loved it more than expected!', 'A pleasant surprise!', 'Exceeded predictions', 'You found something special']
      : ['Not quite your thing, noted!', 'Unexpected twist', 'Learning from this one', 'Taste is unpredictable']
    return { type: 'surprise', message: pickRandom(messages) }
  }

  if (matchResult.matchQuality === 'miss') {
    const messages = streakLost
      ? ['Streak broken – recalibrating', 'Reset. Still learning.', 'Back to zero. Taste evolves.']
      : ['Just outside the range', 'Close, but not quite', 'Noted for next time', 'Adjusting parameters']
    return { type: 'miss', message: pickRandom(messages) }
  }

  return null
}

/**
 * POST /api/audio/predict
 * Get a prediction for how the user will rate an album
 *
 * Body: { albumId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id
    const body = await request.json()
    const { albumId } = body

    if (!albumId) {
      return errorResponse('albumId is required', 400)
    }

    // Get album with audio profile
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        title: true,
        artistName: true,
        audioProfile: true,
      },
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check if we have an audio profile
    if (!album.audioProfile) {
      return successResponse({
        hasPrediction: false,
        message: 'No audio data available for this album yet',
      })
    }

    const audioProfile = album.audioProfile as any

    // Get prediction
    const prediction = await predictRating(userId, {
      avgEnergy: audioProfile.avgEnergy,
      avgValence: audioProfile.avgValence,
      avgDanceability: audioProfile.avgDanceability,
      avgAcousticness: audioProfile.avgAcousticness,
      avgTempo: audioProfile.avgTempo,
      avgLoudness: audioProfile.avgLoudness,
    })

    // Get user's Audio DNA for display
    const audioDNA = await prisma.userAudioDNA.findUnique({
      where: { userId },
      select: {
        currentPredictionStreak: true,
        decipherProgress: true,
        totalPredictions: true,
      },
    })

    return successResponse({
      hasPrediction: true,
      prediction: {
        rating: prediction.predictedRating,
        ratingRange: prediction.ratingRange,
        confidence: Math.round(prediction.confidenceLevel * 100),
        suggestedVibes: prediction.suggestedVibes,
        reasoning: prediction.reasoning,
      },
      // Album audio profile for visualization
      albumAudio: {
        energy: Math.round(audioProfile.avgEnergy * 100),
        valence: Math.round(audioProfile.avgValence * 100),
        danceability: Math.round(audioProfile.avgDanceability * 100),
        acousticness: Math.round(audioProfile.avgAcousticness * 100),
        tempo: Math.round(audioProfile.avgTempo),
      },
      // User stats for gamification display
      userStats: audioDNA ? {
        currentStreak: audioDNA.currentPredictionStreak,
        decipherProgress: Math.round(audioDNA.decipherProgress),
        totalPredictions: audioDNA.totalPredictions,
      } : null,
    })
  } catch (error) {
    console.error('Error getting prediction:', error)
    return errorResponse('Failed to get prediction', 500)
  }
}

/**
 * PUT /api/audio/predict
 * Record the result of a prediction after the user rates
 *
 * Body: {
 *   albumId: string
 *   predictedRating: number
 *   actualRating: number
 *   predictedVibes: string[]
 *   actualVibes: string[]
 *   confidenceLevel: number
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id
    const body = await request.json()
    const {
      albumId,
      predictedRating,
      actualRating,
      predictedVibes = [],
      actualVibes = [],
      confidenceLevel = 0.5,
    } = body

    if (!albumId || predictedRating === undefined || actualRating === undefined) {
      return errorResponse('albumId, predictedRating, and actualRating are required', 400)
    }

    // Get album audio profile
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        audioProfile: true,
      },
    })

    const audioProfile = album?.audioProfile as any

    // Check prediction result
    const matchResult = checkPredictionMatch(predictedRating, actualRating, confidenceLevel)

    // Update Audio DNA with result
    const updateResult = await updateAudioDNAFromRating(
      userId,
      predictedRating,
      actualRating,
      predictedVibes,
      actualVibes,
      audioProfile ? {
        avgEnergy: audioProfile.avgEnergy,
        avgValence: audioProfile.avgValence,
        avgDanceability: audioProfile.avgDanceability,
        avgAcousticness: audioProfile.avgAcousticness,
        avgTempo: audioProfile.avgTempo,
      } : {
        avgEnergy: 0.5,
        avgValence: 0.5,
        avgDanceability: 0.5,
        avgAcousticness: 0.5,
        avgTempo: 120,
      }
    )

    // Update prediction history with albumId
    await prisma.predictionHistory.updateMany({
      where: {
        userId,
        albumId: '',
        ratedAt: { gte: new Date(Date.now() - 60000) }, // Last minute
      },
      data: {
        albumId,
      },
    })

    // Get milestone messages
    const streakMessage = getStreakMessage(updateResult.newStreak)
    const decipherMessage = getDecipherMessage(updateResult.newDecipherProgress)

    // Track if streak was lost
    const streakLost = updateResult.newStreak === 0 && !matchResult.isMatch && !matchResult.isSurprise

    // Generate celebration message
    const celebration = generateCelebration(matchResult, actualRating, predictedRating, streakLost)

    return successResponse({
      result: {
        match: updateResult.ratingMatch,
        surprise: updateResult.wasSurprise,
        perfect: matchResult.isPerfect,
        vibeMatches: updateResult.vibeMatchCount,
        difference: matchResult.difference,
        matchQuality: matchResult.matchQuality,
      },
      streakUpdate: {
        newStreak: updateResult.newStreak,
        streakMessage,
        isNewMilestone: streakMessage !== null,
      },
      decipherUpdate: {
        newProgress: Math.round(updateResult.newDecipherProgress),
        decipherMessage,
      },
      celebration,
    })
  } catch (error) {
    console.error('Error recording prediction result:', error)
    return errorResponse('Failed to record prediction result', 500)
  }
}
