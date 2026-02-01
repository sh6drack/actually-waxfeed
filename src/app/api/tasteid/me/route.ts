import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'
import {
  getArchetypeInfo,
  getDominantNetworks,
  formatListeningSignature,
  ListeningSignature,
  MemorableMoment,
  MusicalFutureSelf,
} from '@/lib/tasteid'

/**
 * GET /api/tasteid/me
 * Get the current user's full TasteID
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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
    })

    if (!tasteId) {
      // Check if user has enough reviews to generate one
      const reviewCount = await prisma.review.count({ where: { userId } })
      return errorResponse(
        reviewCount < 3
          ? 'Review at least 3 albums to generate your TasteID'
          : 'TasteID not computed yet. POST to /api/tasteid/compute to generate.',
        404
      )
    }

    const archetypeInfo = getArchetypeInfo(tasteId.primaryArchetype)
    const secondaryArchetypeInfo = tasteId.secondaryArchetype
      ? getArchetypeInfo(tasteId.secondaryArchetype)
      : null

    return successResponse({
      tasteId: {
        id: tasteId.id,
        user: tasteId.user,

        // Archetype
        primaryArchetype: {
          ...archetypeInfo,
        },
        secondaryArchetype: secondaryArchetypeInfo
          ? { ...secondaryArchetypeInfo }
          : null,
        archetypeConfidence: tasteId.archetypeConfidence,

        // Vectors (full data)
        genreVector: tasteId.genreVector,
        artistDNA: tasteId.artistDNA,
        decadePreferences: tasteId.decadePreferences,

        // Display data
        topGenres: tasteId.topGenres,
        topArtists: tasteId.topArtists,
        signatureAlbums: tasteId.signatureAlbums,

        // Metrics
        adventurenessScore: tasteId.adventurenessScore,
        polarityScore: tasteId.polarityScore,
        ratingSkew: tasteId.ratingSkew,
        reviewDepth: tasteId.reviewDepth,
        averageRating: tasteId.averageRating,
        ratingStdDev: tasteId.ratingStdDev,
        reviewCount: tasteId.reviewCount,
        avgReviewLength: tasteId.avgReviewLength,

        // Polarity 1.9 Dyad - Cognitive modeling
        polarity12: tasteId.listeningSignature ? {
          listeningSignature: tasteId.listeningSignature as unknown as ListeningSignature,
          signatureFormatted: formatListeningSignature(tasteId.listeningSignature as unknown as ListeningSignature),
          dominantNetworks: getDominantNetworks(tasteId.listeningSignature as unknown as ListeningSignature, 3),
          signaturePatterns: tasteId.signaturePatterns,
          memorableMoments: (tasteId.memorableMoments as unknown as MemorableMoment[] | null) || [],
          futureSelvesMusic: (tasteId.futureSelvesMusic as unknown as MusicalFutureSelf[] | null) || [],
          polarityScore2: tasteId.polarityScore2,
        } : null,

        // Timestamps
        createdAt: tasteId.createdAt,
        lastComputedAt: tasteId.lastComputedAt,

        // Evolution history
        snapshots: tasteId.snapshots.map(s => ({
          month: s.month,
          year: s.year,
          primaryArchetype: s.primaryArchetype,
          adventurenessScore: s.adventurenessScore,
          reviewCount: s.reviewCount,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching TasteID:', error)
    return errorResponse('Failed to fetch TasteID', 500)
  }
}
