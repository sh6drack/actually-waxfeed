/**
 * API: /api/challenges
 * Taste Challenges - Gamified taste exploration
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"

    const where = {
      OR: [
        { creatorId: session.user.id },
        { partnerId: session.user.id },
      ],
      ...(status !== "all" && { status }),
    }

    const challenges = await prisma.tasteChallenge.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    // Enrich with user data
    const userIds = [...new Set(challenges.flatMap(c => [c.creatorId, c.partnerId]))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, image: true },
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    const enrichedChallenges = challenges.map(c => ({
      ...c,
      creator: userMap[c.creatorId],
      partner: userMap[c.partnerId],
      isCreator: c.creatorId === session.user.id,
    }))

    return NextResponse.json({
      challenges: enrichedChallenges,
      counts: {
        pending: challenges.filter(c => c.status === "pending").length,
        active: challenges.filter(c => c.status === "active").length,
        completed: challenges.filter(c => c.status === "completed").length,
      },
    })
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { partnerId, challengeType, targetAlbumId, targetGenre, targetDecade, title } = body

    if (!partnerId || !challengeType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate challenge type
    const validTypes = ["discover_together", "rate_same_album", "genre_swap", "decade_dive"]
    if (!validTypes.includes(challengeType)) {
      return NextResponse.json({ error: "Invalid challenge type" }, { status: 400 })
    }

    // Create challenge with 7-day expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const challenge = await prisma.tasteChallenge.create({
      data: {
        creatorId: session.user.id,
        partnerId,
        challengeType,
        targetAlbumId,
        targetGenre,
        targetDecade,
        title,
        expiresAt,
        creatorProgress: { albumsRated: [], score: 0 },
        partnerProgress: { albumsRated: [], score: 0 },
      },
    })

    // Create notification for partner
    const creator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    })

    await prisma.notification.create({
      data: {
        userId: partnerId,
        type: "challenge_invite",
        content: {
          challengeId: challenge.id,
          challengeType,
          actorId: session.user.id,
          actorName: creator?.username || "Someone",
        },
      },
    })

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error("Error creating challenge:", error)
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}
