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
    // Mark as trending and award badges
    await markAlbumTrending(albumId)
    return true
  }

  return false
}

/**
 * Mark album as trending and award First Spin badges
 * to all early reviewers
 */
export async function markAlbumTrending(albumId: string): Promise<void> {
  // Update album
  await prisma.album.update({
    where: { id: albumId },
    data: {
      isTrending: true,
      trendedAt: new Date(),
    }
  })

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

/**
 * Backfill: Calculate and set reviewPosition for existing reviews
 * Run this once to populate positions for old reviews
 */
export async function backfillReviewPositions(): Promise<{ processed: number }> {
  // Get all albums with reviews
  const albums = await prisma.album.findMany({
    where: { totalReviews: { gt: 0 } },
    select: { id: true }
  })

  let processed = 0

  for (const album of albums) {
    // Get all reviews for this album, ordered by creation date
    const reviews = await prisma.review.findMany({
      where: { albumId: album.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, reviewPosition: true }
    })

    // Update each review with its position
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i]
      const position = i + 1

      // Only update if position not set or wrong
      if (review.reviewPosition !== position) {
        await prisma.review.update({
          where: { id: review.id },
          data: { reviewPosition: position }
        })
        processed++
      }
    }
  }

  return { processed }
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
