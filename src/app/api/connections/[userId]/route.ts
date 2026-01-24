/**
 * API: /api/connections/[userId]
 * Manage individual taste connections
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeTasteMatch } from "@/lib/tasteid"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    const { userId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get detailed taste comparison between current user and target
    const match = await computeTasteMatch(session.user.id, userId)

    if (!match) {
      return NextResponse.json(
        { error: "Could not compute taste match" },
        { status: 404 }
      )
    }

    // Get both users' TasteIDs for signature comparison
    const [userTaste, targetTaste] = await Promise.all([
      prisma.tasteID.findUnique({
        where: { userId: session.user.id },
        select: {
          listeningSignature: true,
          primaryArchetype: true,
          topGenres: true,
          topArtists: true,
          signaturePatterns: true,
        },
      }),
      prisma.tasteID.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
              bio: true,
            },
          },
        },
      }),
    ])

    if (!targetTaste?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check existing connection status
    const [sortedUser1, sortedUser2] = [session.user.id, userId].sort()
    const existingMatch = await prisma.tasteMatch.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: sortedUser1,
          user2Id: sortedUser2,
        },
      },
    })

    // Check if they're already friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: userId },
          { user1Id: userId, user2Id: session.user.id },
        ],
      },
    })

    return NextResponse.json({
      match,
      targetUser: {
        id: targetTaste.user.id,
        username: targetTaste.user.username,
        image: targetTaste.user.image,
        bio: targetTaste.user.bio,
        archetype: targetTaste.primaryArchetype,
        topGenres: targetTaste.topGenres,
        topArtists: targetTaste.topArtists,
        patterns: targetTaste.signaturePatterns,
      },
      userSignature: userTaste?.listeningSignature,
      targetSignature: targetTaste.listeningSignature,
      connectionStatus: existingMatch?.status || "potential",
      isFriend: !!friendship,
    })
  } catch (error) {
    console.error("Error getting connection:", error)
    return NextResponse.json(
      { error: "Failed to get connection details" },
      { status: 500 }
    )
  }
}

// Connect with a user (mark as connected)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    const { userId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body // "connect", "dismiss"

    // Sort IDs for consistency
    const [sortedUser1, sortedUser2] = [session.user.id, userId].sort()

    // Get or compute taste match
    let match = await prisma.tasteMatch.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: sortedUser1,
          user2Id: sortedUser2,
        },
      },
    })

    if (!match) {
      // Compute new match
      const computed = await computeTasteMatch(session.user.id, userId)
      if (!computed) {
        return NextResponse.json(
          { error: "Could not compute taste match" },
          { status: 400 }
        )
      }

      match = await prisma.tasteMatch.create({
        data: {
          user1Id: sortedUser1,
          user2Id: sortedUser2,
          overallScore: computed.overallScore,
          genreOverlap: computed.genreOverlap,
          artistOverlap: computed.artistOverlap,
          ratingAlignment: computed.ratingAlignment,
          sharedGenres: computed.sharedGenres,
          sharedArtists: computed.sharedArtists,
          sharedAlbums: computed.sharedAlbums,
          matchType: computed.matchType,
          status: "potential",
        },
      })
    }

    // Update status based on action
    if (action === "connect") {
      match = await prisma.tasteMatch.update({
        where: { id: match.id },
        data: {
          status: "connected",
          connectedAt: new Date(),
          lastInteraction: new Date(),
        },
      })

      // Optionally send a friend request if not already friends
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: session.user.id, user2Id: userId },
            { user1Id: userId, user2Id: session.user.id },
          ],
        },
      })

      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: userId },
            { senderId: userId, receiverId: session.user.id },
          ],
          status: "pending",
        },
      })

      if (!existingFriendship && !existingRequest) {
        await prisma.friendRequest.create({
          data: {
            senderId: session.user.id,
            receiverId: userId,
          },
        })
      }
    } else if (action === "dismiss") {
      match = await prisma.tasteMatch.update({
        where: { id: match.id },
        data: {
          status: "dismissed",
        },
      })
    }

    return NextResponse.json({
      success: true,
      status: match.status,
    })
  } catch (error) {
    console.error("Error updating connection:", error)
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    )
  }
}
