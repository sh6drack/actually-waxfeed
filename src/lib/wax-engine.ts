import { prisma } from './prisma'
import { SUBSCRIPTION_TIERS, FREE_TIER, WAX_EARN_RATES, WAX_SPEND_COSTS } from './stripe'
import { TxType, SubTier } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export type EarnResult = {
  earned: number
  capped: boolean
  newBalance: number
  message?: string
}

export type SpendResult = {
  spent: number
  newBalance: number
  success: boolean
  error?: string
}

export type TierConfig = {
  weeklyEarnCap: number | null
  earnMultiplier: number
  standardWaxCost: number
  premiumWaxCost: number | null
  goldWaxCost: number | null
  listItemLimit: number | null
}

// ============================================
// TIER CONFIGURATION
// ============================================

export function getTierConfig(tier: SubTier): TierConfig {
  switch (tier) {
    case 'WAX_PLUS':
      return {
        weeklyEarnCap: SUBSCRIPTION_TIERS.WAX_PLUS.weeklyEarnCap,
        earnMultiplier: SUBSCRIPTION_TIERS.WAX_PLUS.earnMultiplier,
        standardWaxCost: SUBSCRIPTION_TIERS.WAX_PLUS.standardWaxCost,
        premiumWaxCost: SUBSCRIPTION_TIERS.WAX_PLUS.premiumWaxCost,
        goldWaxCost: SUBSCRIPTION_TIERS.WAX_PLUS.goldWaxCost,
        listItemLimit: SUBSCRIPTION_TIERS.WAX_PLUS.listItemLimit,
      }
    case 'WAX_PRO':
      return {
        weeklyEarnCap: SUBSCRIPTION_TIERS.WAX_PRO.weeklyEarnCap,
        earnMultiplier: SUBSCRIPTION_TIERS.WAX_PRO.earnMultiplier,
        standardWaxCost: SUBSCRIPTION_TIERS.WAX_PRO.standardWaxCost,
        premiumWaxCost: SUBSCRIPTION_TIERS.WAX_PRO.premiumWaxCost,
        goldWaxCost: SUBSCRIPTION_TIERS.WAX_PRO.goldWaxCost,
        listItemLimit: SUBSCRIPTION_TIERS.WAX_PRO.listItemLimit,
      }
    default:
      return {
        weeklyEarnCap: FREE_TIER.weeklyEarnCap,
        earnMultiplier: FREE_TIER.earnMultiplier,
        standardWaxCost: FREE_TIER.standardWaxCost,
        premiumWaxCost: FREE_TIER.premiumWaxCost,
        goldWaxCost: FREE_TIER.goldWaxCost,
        listItemLimit: FREE_TIER.listItemLimit,
      }
  }
}

// ============================================
// WEEKLY CAP MANAGEMENT
// ============================================

async function checkAndResetWeeklyCap(userId: string): Promise<{ weeklyWaxEarned: number; wasReset: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weeklyWaxEarned: true, weeklyResetAt: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const now = new Date()
  const resetAt = new Date(user.weeklyResetAt)
  const daysSinceReset = Math.floor((now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24))

  // Reset every 7 days
  if (daysSinceReset >= 7) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        weeklyWaxEarned: 0,
        weeklyResetAt: now,
      }
    })
    return { weeklyWaxEarned: 0, wasReset: true }
  }

  return { weeklyWaxEarned: user.weeklyWaxEarned, wasReset: false }
}

// ============================================
// EARN WAX
// ============================================

export async function earnWax(
  userId: string,
  baseAmount: number,
  type: TxType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<EarnResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      waxBalance: true,
      subscriptionTier: true,
      weeklyWaxEarned: true,
      weeklyResetAt: true,
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const tierConfig = getTierConfig(user.subscriptionTier)

  // Apply multiplier
  let earned = Math.floor(baseAmount * tierConfig.earnMultiplier)

  // Check weekly cap for free users
  let capped = false
  if (tierConfig.weeklyEarnCap !== null) {
    const { weeklyWaxEarned } = await checkAndResetWeeklyCap(userId)
    const remaining = tierConfig.weeklyEarnCap - weeklyWaxEarned

    if (remaining <= 0) {
      return {
        earned: 0,
        capped: true,
        newBalance: user.waxBalance,
        message: 'Weekly Wax cap reached. Upgrade to remove limits!'
      }
    }

    if (earned > remaining) {
      earned = remaining
      capped = true
    }
  }

  // Update balance and log transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        waxBalance: { increment: earned },
        lifetimeWaxEarned: { increment: earned },
        weeklyWaxEarned: { increment: earned },
      }
    })

    await tx.waxTransaction.create({
      data: {
        userId,
        amount: earned,
        type,
        description,
        metadata: metadata as object,
      }
    })

    return updated
  })

  return {
    earned,
    capped,
    newBalance: updatedUser.waxBalance,
    message: capped ? `Earned ${earned} Wax (capped). Upgrade for unlimited earning!` : undefined,
  }
}

// ============================================
// SPEND WAX
// ============================================

export async function spendWax(
  userId: string,
  amount: number,
  type: TxType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<SpendResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { waxBalance: true }
  })

  if (!user) {
    return { spent: 0, newBalance: 0, success: false, error: 'User not found' }
  }

  if (user.waxBalance < amount) {
    return {
      spent: 0,
      newBalance: user.waxBalance,
      success: false,
      error: `Insufficient Wax. Need ${amount}, have ${user.waxBalance}`
    }
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        waxBalance: { decrement: amount },
        lifetimeWaxSpent: { increment: amount },
      }
    })

    await tx.waxTransaction.create({
      data: {
        userId,
        amount: -amount,
        type,
        description,
        metadata: metadata as object,
      }
    })

    return updated
  })

  return {
    spent: amount,
    newBalance: updatedUser.waxBalance,
    success: true,
  }
}

// ============================================
// SPECIFIC WAX ACTIONS
// ============================================

export async function claimDailyLogin(userId: string): Promise<EarnResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyClaimedAt: true, currentStreak: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if already claimed today
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (user.dailyClaimedAt) {
    const lastClaim = new Date(user.dailyClaimedAt)
    const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate())

    if (lastClaimDay.getTime() === today.getTime()) {
      return {
        earned: 0,
        capped: false,
        newBalance: 0, // Will be set by caller if needed
        message: 'Already claimed today!'
      }
    }
  }

  // Calculate streak bonus (capped at 20)
  const streakBonus = Math.min(
    user.currentStreak * WAX_EARN_RATES.STREAK_BONUS_PER_DAY,
    WAX_EARN_RATES.STREAK_BONUS_MAX
  )

  const totalAmount = WAX_EARN_RATES.DAILY_LOGIN + streakBonus

  // Update claim time
  await prisma.user.update({
    where: { id: userId },
    data: { dailyClaimedAt: now }
  })

  const result = await earnWax(
    userId,
    totalAmount,
    'DAILY_CLAIM',
    `Daily login bonus${streakBonus > 0 ? ` (+${streakBonus} streak bonus)` : ''}`,
    { streakBonus, streak: user.currentStreak }
  )

  return result
}

export async function claimFirstReviewOfDay(userId: string): Promise<EarnResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyReviewClaimedAt: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (user.dailyReviewClaimedAt) {
    const lastClaim = new Date(user.dailyReviewClaimedAt)
    const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate())

    if (lastClaimDay.getTime() === today.getTime()) {
      return null // Already claimed
    }
  }

  // Update claim time
  await prisma.user.update({
    where: { id: userId },
    data: { dailyReviewClaimedAt: now }
  })

  return earnWax(
    userId,
    WAX_EARN_RATES.FIRST_REVIEW_OF_DAY,
    'REVIEW_REWARD',
    'First review of the day bonus'
  )
}

export async function claimFirstAlbumReview(userId: string, albumId: string): Promise<EarnResult | null> {
  // Check if already claimed for this album
  const existing = await prisma.firstAlbumReview.findUnique({
    where: { userId_albumId: { userId, albumId } }
  })

  if (existing) {
    return null // Already claimed
  }

  // Record the first review
  await prisma.firstAlbumReview.create({
    data: { userId, albumId }
  })

  return earnWax(
    userId,
    WAX_EARN_RATES.FIRST_ALBUM_REVIEW,
    'FIRST_ALBUM_BONUS',
    'First review on this album bonus',
    { albumId }
  )
}

export async function grantWaxReceived(
  recipientId: string,
  waxType: 'standard' | 'premium' | 'gold'
): Promise<EarnResult> {
  const amounts = {
    standard: WAX_EARN_RATES.RECEIVED_STANDARD_WAX,
    premium: WAX_EARN_RATES.RECEIVED_PREMIUM_WAX,
    gold: WAX_EARN_RATES.RECEIVED_GOLD_WAX,
  }

  return earnWax(
    recipientId,
    amounts[waxType],
    'WAX_RECEIVED',
    `Received ${waxType} Wax on your review`,
    { waxType }
  )
}

export async function grantTrendingBonus(userId: string, reviewId: string): Promise<EarnResult> {
  return earnWax(
    userId,
    WAX_EARN_RATES.TRENDING_REVIEW,
    'TRENDING_BONUS',
    'Your review is trending!',
    { reviewId }
  )
}

export async function grantReferralBonus(userId: string, referredUserId: string): Promise<EarnResult> {
  return earnWax(
    userId,
    WAX_EARN_RATES.REFERRAL_SIGNUP,
    'REFERRAL_BONUS',
    'Referral bonus - new user signed up!',
    { referredUserId }
  )
}

// ============================================
// WAX AWARD COSTS
// ============================================

export function getWaxAwardCost(
  tier: SubTier,
  waxType: 'standard' | 'premium' | 'gold'
): number | null {
  const config = getTierConfig(tier)

  switch (waxType) {
    case 'standard':
      return config.standardWaxCost
    case 'premium':
      return config.premiumWaxCost
    case 'gold':
      return config.goldWaxCost
    default:
      return null
  }
}

export function canAwardWaxType(
  tier: SubTier,
  waxType: 'standard' | 'premium' | 'gold'
): boolean {
  const cost = getWaxAwardCost(tier, waxType)
  return cost !== null
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function getWalletStats(userId: string) {
  const [user, reviewCount, tasteIdExists] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        waxBalance: true,
        lifetimeWaxEarned: true,
        lifetimeWaxSpent: true,
        weeklyWaxEarned: true,
        weeklyResetAt: true,
        subscriptionTier: true,
        currentStreak: true,
        dailyClaimedAt: true,
        // First Spin stats
        tastemakeScore: true,
        goldSpinCount: true,
        silverSpinCount: true,
        bronzeSpinCount: true,
      }
    }),
    prisma.review.count({ where: { userId } }),
    prisma.tasteID.findUnique({ where: { userId }, select: { id: true } }),
  ])

  if (!user) {
    throw new Error('User not found')
  }

  const tierConfig = getTierConfig(user.subscriptionTier)

  // Check if daily is claimable
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let canClaimDaily = true

  if (user.dailyClaimedAt) {
    const lastClaim = new Date(user.dailyClaimedAt)
    const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate())
    canClaimDaily = lastClaimDay.getTime() < today.getTime()
  }

  // Calculate days until weekly reset
  const daysSinceReset = Math.floor(
    (now.getTime() - new Date(user.weeklyResetAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysUntilReset = Math.max(0, 7 - daysSinceReset)

  return {
    balance: user.waxBalance,
    lifetimeEarned: user.lifetimeWaxEarned,
    lifetimeSpent: user.lifetimeWaxSpent,
    weeklyEarned: user.weeklyWaxEarned,
    weeklyCap: tierConfig.weeklyEarnCap,
    weeklyRemaining: tierConfig.weeklyEarnCap
      ? Math.max(0, tierConfig.weeklyEarnCap - user.weeklyWaxEarned)
      : null,
    daysUntilReset,
    currentStreak: user.currentStreak,
    canClaimDaily,
    tier: user.subscriptionTier,
    earnMultiplier: tierConfig.earnMultiplier,
    // First Spin stats
    tastemakeScore: user.tastemakeScore ?? 0,
    goldSpinCount: user.goldSpinCount ?? 0,
    silverSpinCount: user.silverSpinCount ?? 0,
    bronzeSpinCount: user.bronzeSpinCount ?? 0,
    // TasteID status
    hasTasteID: !!tasteIdExists,
    reviewCount,
  }
}

export async function getRecentTransactions(userId: string, limit = 20) {
  return prisma.waxTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
