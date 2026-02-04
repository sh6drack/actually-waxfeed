import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { computeUserAudioDNA, saveUserAudioDNA } from '@/lib/audio-dna'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/backfill-audio-dna
 * Compute Audio DNA for all users with 5+ ratings who don't have it yet
 *
 * This is a one-time backfill for existing users after the v2.5 update
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only allow authenticated users (could add admin check here)
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    // Get all users with 5+ reviews who don't have Audio DNA yet
    const usersToProcess = await prisma.user.findMany({
      where: {
        reviews: {
          some: {},
        },
        audioDNA: null,
      },
      select: {
        id: true,
        username: true,
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
    })

    // Filter to users with 5+ ratings (minimum for meaningful DNA)
    const eligibleUsers = usersToProcess.filter(u => u._count.reviews >= 5)

    const results = {
      total: eligibleUsers.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process users in batches to avoid timeout
    const batchSize = 10
    for (let i = 0; i < eligibleUsers.length; i += batchSize) {
      const batch = eligibleUsers.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (user) => {
          try {
            const audioDNA = await computeUserAudioDNA(user.id)
            if (audioDNA) {
              await saveUserAudioDNA(user.id, audioDNA)
              results.succeeded++
            } else {
              results.errors.push(`${user.username}: No audio data available`)
            }
          } catch (error) {
            results.failed++
            results.errors.push(`${user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
          results.processed++
        })
      )

      // Small delay between batches
      if (i + batchSize < eligibleUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return successResponse({
      message: `Backfill complete: ${results.succeeded}/${results.total} users processed`,
      results,
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return errorResponse('Backfill failed', 500)
  }
}

/**
 * GET /api/admin/backfill-audio-dna
 * Check status of Audio DNA coverage
 */
export async function GET() {
  try {
    // Count users with ratings
    const usersWithRatings = await prisma.user.count({
      where: {
        reviews: {
          some: {},
        },
      },
    })

    // Count users with Audio DNA
    const usersWithAudioDNA = await prisma.userAudioDNA.count()

    // Count users with 5+ ratings but no Audio DNA
    const usersNeedingBackfill = await prisma.user.count({
      where: {
        reviews: {
          some: {},
        },
        audioDNA: null,
      },
    })

    // Get top users needing backfill
    const topUsersNeedingBackfill = await prisma.user.findMany({
      where: {
        reviews: {
          some: {},
        },
        audioDNA: null,
      },
      select: {
        username: true,
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      take: 10,
    })

    return successResponse({
      usersWithRatings,
      usersWithAudioDNA,
      usersNeedingBackfill,
      coverage: usersWithRatings > 0
        ? Math.round((usersWithAudioDNA / usersWithRatings) * 100)
        : 0,
      topUsersNeedingBackfill: topUsersNeedingBackfill.map(u => ({
        username: u.username,
        ratings: u._count.reviews,
      })),
    })
  } catch (error) {
    console.error('Status check error:', error)
    return errorResponse('Failed to check status', 500)
  }
}
