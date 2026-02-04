// Prediction system types
export interface PredictionData {
  hasPrediction: boolean
  prediction?: {
    rating: number
    ratingRange: { min: number; max: number }
    confidence: number
    suggestedVibes: string[]
    reasoning: string[]
  }
  albumAudio?: {
    energy: number
    valence: number
    danceability: number
    acousticness: number
    tempo: number
  }
  userStats?: {
    currentStreak: number
    decipherProgress: number
    totalPredictions: number
  }
}

export interface PredictionResult {
  result: {
    match: boolean
    surprise: boolean
    perfect: boolean
    vibeMatches: number
    difference: number
    matchQuality: 'perfect' | 'close' | 'match' | 'miss' | 'surprise'
  }
  streakUpdate: {
    newStreak: number
    streakMessage: string | null
    isNewMilestone: boolean
  }
  decipherUpdate: {
    newProgress: number
    decipherMessage: string | null
  }
  celebration: {
    type: 'predicted' | 'surprise' | 'perfect' | 'close' | 'miss'
    message: string
  } | null
  predictedRating?: number
  actualRating?: number
  isFirstPrediction?: boolean
}
