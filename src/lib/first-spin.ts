/**
 * First Spin Engine
 * 
 * Core logic for the First Spin system:
 * - Track review positions
 * - Detect when albums trend
 * - Award badges retroactively to early reviewers
 */

import { prisma } from './prisma'

// Badge thresholds
const GOLD_THRESHOLD = 10   // First 10 reviewers
const SILVER_THRESHOLD = 50  // First 50 reviewers
const BRONZE_THRESHOLD = 100 // First 100 reviewers

// Wax rewards for each badge
const BADGE_REWARDS = {
  GOLD: 100,
  SILVER: 50,
  BRONZE: 25,
}

// What triggers "trending"
const TRENDING_THRESHOLD = 100 // 100 reviews = album is trending

/**
 * Check if an album should be marked as trending
 * Called after every new review
 * Uses atomic update to prevent race conditions
 */
export async function checkAlbumTrending(albumId: string): Promise<boolean> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: {
      totalReviews: true,
      isTrending: true,
      trendThreshold: true,
    }
  })

  if (!album) return false

  // Already trending - no need to process
  if (album.isTrending) return true

  const threshold = album.trendThreshold || TRENDING_THRESHOLD

  // Check if it crossed the threshold
  if (album.totalReviews >= threshold) {
    // Use atomic update with condition to prevent race conditions
    // Only one concurrent request will successfully update isTrending from false to true
    const updated = await prisma.album.updateMany({
      where: {
        id: albumId,
        isTrending: false // Only update if still not trending
      },
      data: {
        isTrending: true,
        trendedAt: new Date(),
      }
    })

    // If we updated the album (count > 0), we won the race - award badges
    if (updated.count > 0) {
      await awardTrendingBadges(albumId)
    }
    return true
  }

  return false
}

/**
 * Award badges to early reviewers of a trending album
 * Called only after successful atomic update of isTrending
 */
async function awardTrendingBadges(albumId: string): Promise<void> {
  // Find all reviews with position <= 100
  const earlyReviews = await prisma.review.findMany({
    where: {
      albumId,
      reviewPosition: { lte: BRONZE_THRESHOLD }
    },
    select: {
      id: true,
      userId: true,
      reviewPosition: true,
    },
    orderBy: { reviewPosition: 'asc' }
  })

  // Award badges to each early reviewer
  for (const review of earlyReviews) {
    if (!review.reviewPosition) continue

    await awardFirstSpinBadge(
      review.userId,
      albumId,
      review.reviewPosition
    )
  }
}

/**
 * Mark album as trending and award First Spin badges
 * to all early reviewers
 * @deprecated Use checkAlbumTrending instead for race-safe trending detection
 */
export async function markAlbumTrending(albumId: string): Promise<void> {
  // Use atomic update to prevent race conditions
  const updated = await prisma.album.updateMany({
    where: {
      id: albumId,
      isTrending: false
    },
    data: {
      isTrending: true,
      trendedAt: new Date(),
    }
  })

  // Only award badges if we successfully marked as trending
  if (updated.count > 0) {
    await awardTrendingBadges(albumId)
  }
}

/**
 * Award a First Spin badge to a user
 */
export async function awardFirstSpinBadge(
  userId: string,
  albumId: string,
  position: number
): Promise<void> {
  // Determine badge type based on position
  let badgeType: 'GOLD' | 'SILVER' | 'BRONZE'
  let waxReward: number

  if (position <= GOLD_THRESHOLD) {
    badgeType = 'GOLD'
    waxReward = BADGE_REWARDS.GOLD
  } else if (position <= SILVER_THRESHOLD) {
    badgeType = 'SILVER'
    waxReward = BADGE_REWARDS.SILVER
  } else if (position <= BRONZE_THRESHOLD) {
    badgeType = 'BRONZE'
    waxReward = BADGE_REWARDS.BRONZE
  } else {
    // Position > 100, no badge
    return
  }

  // Check if badge already exists
  const existingBadge = await prisma.firstSpinBadge.findUnique({
    where: { userId_albumId: { userId, albumId } }
  })

  if (existingBadge) return // Already awarded

  // Get album info for notification
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { title: true, artistName: true }
  })

  // Create badge and update user stats in transaction
  await prisma.$transaction(async (tx) => {
    // Create the badge
    const badge = await tx.firstSpinBadge.create({
      data: {
        userId,
        albumId,
        badgeType,
        position,
        waxAwarded: waxReward,
      }
    })

    // Update user's stats
    const scoreIncrement = badgeType === 'GOLD' ? 10 
      : badgeType === 'SILVER' ? 5 
      : 2

    await tx.user.update({
      where: { id: userId },
      data: {
        waxBalance: { increment: waxReward },
        lifetimeWaxEarned: { increment: waxReward },
        tastemakeScore: { increment: scoreIncrement },
        goldSpinCount: badgeType === 'GOLD' ? { increment: 1 } : undefined,
        silverSpinCount: badgeType === 'SILVER' ? { increment: 1 } : undefined,
        bronzeSpinCount: badgeType === 'BRONZE' ? { increment: 1 } : undefined,
      }
    })

    // Log transaction
    await tx.waxTransaction.create({
      data: {
        userId,
        amount: waxReward,
        type: 'TRENDING_BONUS',
        description: `${badgeType} Spin: ${album?.title || 'Album'} (#${position})`,
        metadata: { albumId, position, badgeType }
      }
    })

    // Create notification with badge ID for direct link
    await tx.notification.create({
      data: {
        userId,
        type: 'first_spin_badge',
        content: {
          badgeId: badge.id,
          badgeType,
          position,
          waxReward,
          albumId,
          albumTitle: album?.title,
          artistName: album?.artistName,
        }
      }
    })
  })
}

/**
 * Get user's First Spin stats
 */
export async function getFirstSpinStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tastemakeScore: true,
      goldSpinCount: true,
      silverSpinCount: true,
      bronzeSpinCount: true,
    }
  })

  if (!user) {
    return {
      tastemakeScore: 0,
      goldSpinCount: 0,
      silverSpinCount: 0,
      bronzeSpinCount: 0,
      totalBadges: 0,
    }
  }

  return {
    ...user,
    totalBadges: (user.goldSpinCount || 0) + (user.silverSpinCount || 0) + (user.bronzeSpinCount || 0)
  }
}

/**
 * Get user's First Spin badges
 */
export async function getUserBadges(userId: string, limit = 20) {
  return prisma.firstSpinBadge.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get leaderboard
 */
export async function getTastemakerLeaderboard(limit = 50) {
  return prisma.user.findMany({
    where: {
      tastemakeScore: { gt: 0 }
    },
    orderBy: { tastemakeScore: 'desc' },
    take: limit,
    select: {
      id: true,
      username: true,
      image: true,
      tastemakeScore: true,
      goldSpinCount: true,
      silverSpinCount: true,
      bronzeSpinCount: true,
    }
  })
}

const MIN_TEXT_LENGTH_FOR_BADGE = 20

/**
 * Backfill: Calculate and set reviewPosition for existing reviews
 * ONLY reviews with text (20+ chars) get positions - others get null
 * Run this once to fix positions for badge eligibility
 */
export async function backfillReviewPositions(): Promise<{ processed: number; cleared: number }> {
  // Get all albums with reviews
  const albums = await prisma.album.findMany({
    where: { totalReviews: { gt: 0 } },
    select: { id: true }
  })

  let processed = 0
  let cleared = 0

  for (const album of albums) {
    // Get all reviews for this album, ordered by creation date
    const reviews = await prisma.review.findMany({
      where: { albumId: album.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, text: true, reviewPosition: true }
    })

    // Only reviews with sufficient text get positions
    let textPosition = 0
    for (const review of reviews) {
      const hasValidText = review.text && review.text.trim().length >= MIN_TEXT_LENGTH_FOR_BADGE

      if (hasValidText) {
        textPosition++
        // Assign position only to text reviews
        if (review.reviewPosition !== textPosition) {
          await prisma.review.update({
            where: { id: review.id },
            data: { reviewPosition: textPosition }
          })
          processed++
        }
      } else {
        // Clear position for non-text reviews
        if (review.reviewPosition !== null) {
          await prisma.review.update({
            where: { id: review.id },
            data: { reviewPosition: null }
          })
          cleared++
        }
      }
    }
  }

  return { processed, cleared }
}

/**
 * Backfill: Check all albums for trending and award badges
 * Run this once to process existing trending albums
 */
export async function backfillTrendingBadges(): Promise<{ processed: number }> {
  // Find albums that should be trending but aren't marked
  const albums = await prisma.album.findMany({
    where: {
      totalReviews: { gte: TRENDING_THRESHOLD },
      isTrending: false,
    },
    select: { id: true }
  })

  for (const album of albums) {
    await markAlbumTrending(album.id)
  }

  return { processed: albums.length }
}
