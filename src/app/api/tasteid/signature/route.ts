import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'
import {
  getDominantNetworks,
  formatListeningSignature,
  getMusicNetworkInfo,
  MUSIC_NETWORKS,
  ListeningSignature,
  MemorableMoment,
  MusicalFutureSelf,
} from '@/lib/tasteid'

/**
 * GET /api/tasteid/signature
 * Get the current user's Polarity 1.2 Listening Signature
 *
 * The Listening Signature is analogous to Polarity's BrainID -
 * a cognitive fingerprint for how you engage with music.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 401)
    }

    const userId = session.user.id

    const tasteId = await prisma.tasteID.findUnique({
      where: { userId },
      select: {
        listeningSignature: true,
        signaturePatterns: true,
        memorableMoments: true,
        futureSelvesMusic: true,
        polarityScore: true,
        polarityScore2: true,
        reviewCount: true,
        lastComputedAt: true,
      },
    })

    if (!tasteId) {
      return errorResponse('Generate your TasteID first to see your listening signature', 404)
    }

    if (!tasteId.listeningSignature) {
      return errorResponse('Listening signature not yet computed. Recompute your TasteID to get Polarity 1.2 data.', 404)
    }

    const signature = tasteId.listeningSignature as unknown as ListeningSignature
    const memorableMoments = (tasteId.memorableMoments as unknown as MemorableMoment[] | null) || []
    const futureSelvesMusic = (tasteId.futureSelvesMusic as unknown as MusicalFutureSelf[] | null) || []

    return successResponse({
      signature: {
        // Raw values (0-1)
        raw: signature,

        // Formatted for display
        formatted: formatListeningSignature(signature),

        // Top 3 dominant networks with full info
        dominant: getDominantNetworks(signature, 3),

        // All network descriptions
        networks: Object.values(MUSIC_NETWORKS).map(n => ({
          ...n,
          activation: Math.round((signature[n.id as keyof ListeningSignature] || 0) * 100),
        })),
      },

      // Detected behavioral patterns
      patterns: tasteId.signaturePatterns,

      // Episodic memory - notable moments
      memorableMoments: memorableMoments.slice(0, 5),

      // Prospective memory - musical futures
      futureSelves: futureSelvesMusic,

      // Polarity scores
      scores: {
        polarity1: tasteId.polarityScore,
        polarity2: tasteId.polarityScore2,
      },

      // Metadata
      meta: {
        reviewCount: tasteId.reviewCount,
        lastComputed: tasteId.lastComputedAt,
        isComplete: tasteId.reviewCount >= 20, // Minimum for reliable signature
      },
    })
  } catch (error) {
    console.error('Error fetching listening signature:', error)
    return errorResponse('Failed to fetch listening signature', 500)
  }
}
