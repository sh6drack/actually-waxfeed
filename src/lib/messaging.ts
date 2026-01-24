/**
 * SOCIAL MESSAGING - Zero to One Configuration
 * 
 * Taste-gated messaging that only makes sense on WaxFeed.
 */

import { prisma } from './prisma'
import { computeTasteMatch } from './tasteid'

// ============================================
// CONFIGURATION
// ============================================

/**
 * Minimum taste match percentage required to start a DM conversation.
 * This is the core Zero to One mechanism - you can only message
 * people who genuinely share your musical taste.
 */
export const TASTE_MATCH_THRESHOLD = 60

/**
 * Message length limits
 */
export const MESSAGE_MAX_LENGTH = 2000
export const ROOM_MESSAGE_MAX_LENGTH = 500
export const CIRCLE_MESSAGE_MAX_LENGTH = 500

// ============================================
// TASTE CIRCLE ARCHETYPES
// ============================================

export const TASTE_CIRCLES = [
  // Genre-based
  { archetype: 'hip-hop-head', displayName: 'Hip-Hop Heads', description: 'Lives and breathes hip-hop culture' },
  { archetype: 'jazz-explorer', displayName: 'Jazz Explorers', description: 'Drawn to improvisation and complexity' },
  { archetype: 'rock-purist', displayName: 'Rock Purists', description: 'Guitar-driven music runs through their veins' },
  { archetype: 'electronic-pioneer', displayName: 'Electronic Pioneers', description: 'Synths, beats, and futuristic sounds' },
  { archetype: 'soul-searcher', displayName: 'Soul Searchers', description: 'Connects with music on an emotional level' },
  { archetype: 'metal-maven', displayName: 'Metal Mavens', description: 'Heavy riffs and intense energy' },
  { archetype: 'indie-devotee', displayName: 'Indie Devotees', description: 'Champions the underground and obscure' },
  { archetype: 'pop-connoisseur', displayName: 'Pop Connoisseurs', description: 'Appreciates craft in mainstream music' },
  { archetype: 'country-soul', displayName: 'Country Souls', description: 'Stories, twang, and heartland vibes' },
  { archetype: 'classical-mind', displayName: 'Classical Minds', description: 'Appreciates composition and orchestration' },
  // Behavior-based
  { archetype: 'genre-fluid', displayName: 'Genre Fluid', description: 'Refuses to be boxed in - listens to everything' },
  { archetype: 'decade-diver', displayName: 'Decade Divers', description: 'Obsessed with a specific era of music' },
  { archetype: 'deep-cutter', displayName: 'Deep Cutters', description: 'Goes beyond the hits, finds the gems' },
  { archetype: 'chart-chaser', displayName: 'Chart Chasers', description: 'Always on top of what\'s hot' },
  { archetype: 'the-critic', displayName: 'The Critics', description: 'High standards, few 10s given' },
  { archetype: 'the-enthusiast', displayName: 'The Enthusiasts', description: 'Finds joy in almost everything' },
  { archetype: 'essay-writer', displayName: 'Essay Writers', description: 'Reviews are mini dissertations' },
  { archetype: 'album-archaeologist', displayName: 'Album Archaeologists', description: 'Digs into music history' },
  { archetype: 'new-release-hunter', displayName: 'New Release Hunters', description: 'First to review the latest drops' },
  { archetype: 'taste-twin-seeker', displayName: 'Taste Twin Seekers', description: 'Always comparing and connecting with others' },
] as const

// ============================================
// HELPERS
// ============================================

/**
 * Check if two users can message each other based on taste match.
 * Returns the match score if allowed, null if not.
 */
export async function canMessage(userId1: string, userId2: string): Promise<{
  allowed: boolean
  score: number | null
  reason?: string
}> {
  // Check if blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
  })

  if (blocked) {
    return { allowed: false, score: null, reason: 'User is blocked' }
  }

  // Compute taste match
  const match = await computeTasteMatch(userId1, userId2)

  if (!match) {
    return { 
      allowed: false, 
      score: null, 
      reason: 'Both users need a TasteID to message. Review some albums first!' 
    }
  }

  if (match.overallScore < TASTE_MATCH_THRESHOLD) {
    return {
      allowed: false,
      score: match.overallScore,
      reason: `Taste match must be ${TASTE_MATCH_THRESHOLD}% or higher. Current: ${match.overallScore}%`,
    }
  }

  return { allowed: true, score: match.overallScore }
}

/**
 * Get or create a conversation between two users.
 * User IDs are sorted to ensure consistent conversation lookup.
 */
export async function getOrCreateConversation(userId1: string, userId2: string) {
  const [user1Id, user2Id] = [userId1, userId2].sort()

  // Check if conversation exists
  const existing = await prisma.conversation.findUnique({
    where: {
      user1Id_user2Id: { user1Id, user2Id },
    },
  })

  if (existing) {
    return existing
  }

  // Check if they can message
  const canMsg = await canMessage(userId1, userId2)
  if (!canMsg.allowed) {
    throw new Error(canMsg.reason || 'Cannot start conversation')
  }

  // Create new conversation
  return prisma.conversation.create({
    data: {
      user1Id,
      user2Id,
      tasteMatchScore: canMsg.score!,
    },
  })
}

/**
 * Check if a user has reviewed an album (required for album rooms).
 */
export async function hasReviewedAlbum(userId: string, albumId: string): Promise<{
  reviewed: boolean
  reviewPosition?: number | null
  badge?: 'gold' | 'silver' | 'bronze' | null
}> {
  const review = await prisma.review.findUnique({
    where: {
      userId_albumId: { userId, albumId },
    },
    select: {
      reviewPosition: true,
    },
  })

  if (!review) {
    return { reviewed: false }
  }

  // Determine badge
  let badge: 'gold' | 'silver' | 'bronze' | null = null
  if (review.reviewPosition) {
    if (review.reviewPosition <= 10) badge = 'gold'
    else if (review.reviewPosition <= 50) badge = 'silver'
    else if (review.reviewPosition <= 100) badge = 'bronze'
  }

  return {
    reviewed: true,
    reviewPosition: review.reviewPosition,
    badge,
  }
}

/**
 * Check if a user belongs to a taste circle (has the archetype).
 */
export async function belongsToCircle(userId: string, archetype: string): Promise<boolean> {
  const tasteId = await prisma.tasteID.findUnique({
    where: { userId },
    select: {
      primaryArchetype: true,
      secondaryArchetype: true,
    },
  })

  if (!tasteId) return false

  return (
    tasteId.primaryArchetype === archetype ||
    tasteId.secondaryArchetype === archetype
  )
}

/**
 * Get unread message count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    select: { id: true },
  })

  const conversationIds = conversations.map(c => c.id)

  const unreadCount = await prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      isRead: false,
    },
  })

  return unreadCount
}

/**
 * Seed taste circles if they don't exist.
 */
export async function seedTasteCircles() {
  for (const circle of TASTE_CIRCLES) {
    await prisma.tasteCircle.upsert({
      where: { archetype: circle.archetype },
      update: {},
      create: {
        archetype: circle.archetype,
        displayName: circle.displayName,
        description: circle.description,
      },
    })
  }
}
