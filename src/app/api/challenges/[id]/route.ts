/**
 * API: /api/challenges/[id]
 * Individual challenge operations
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challenge = await prisma.tasteChallenge.findUnique({
      where: { id },
    })

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Check if user is participant
    if (challenge.creatorId !== session.user.id && challenge.partnerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Get users
    const [creator, partner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: challenge.creatorId },
        select: { id: true, username: true, image: true },
      }),
      prisma.user.findUnique({
        where: { id: challenge.partnerId },
        select: { id: true, username: true, image: true },
      }),
    ])

    // Get target album if applicable
    let targetAlbum = null
    if (challenge.targetAlbumId) {
      targetAlbum = await prisma.album.findUnique({
        where: { id: challenge.targetAlbumId },
        select: { id: true, spotifyId: true, title: true, artistName: true, coverArtUrl: true },
      })
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        creator,
        partner,
        targetAlbum,
        isCreator: challenge.creatorId === session.user.id,
      },
    })
  } catch (error) {
    console.error("Error fetching challenge:", error)
    return NextResponse.json({ error: "Failed to fetch challenge" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, albumId, rating } = body

    const challenge = await prisma.tasteChallenge.findUnique({
      where: { id },
    })

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const isCreator = challenge.creatorId === session.user.id
    const isPartner = challenge.partnerId === session.user.id

    if (!isCreator && !isPartner) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    if (action === "accept") {
      // Partner accepts the challenge
      if (!isPartner || challenge.status !== "pending") {
        return NextResponse.json({ error: "Cannot accept challenge" }, { status: 400 })
      }

      await prisma.tasteChallenge.update({
        where: { id },
        data: { status: "active" },
      })

      return NextResponse.json({ success: true, status: "active" })
    }

    if (action === "decline") {
      if (challenge.status !== "pending") {
        return NextResponse.json({ error: "Cannot decline challenge" }, { status: 400 })
      }

      await prisma.tasteChallenge.update({
        where: { id },
        data: { status: "expired" },
      })

      return NextResponse.json({ success: true, status: "expired" })
    }

    if (action === "submit_rating" && albumId && rating !== undefined) {
      // Submit a rating for the challenge
      if (challenge.status !== "active") {
        return NextResponse.json({ error: "Challenge not active" }, { status: 400 })
      }

      const progressField = isCreator ? "creatorProgress" : "partnerProgress"
      const currentProgress = (challenge[progressField] as { albumsRated: string[]; score: number }) || { albumsRated: [], score: 0 }

      // Add album to progress
      if (!currentProgress.albumsRated.includes(albumId)) {
        currentProgress.albumsRated.push(albumId)
        currentProgress.score += rating
      }

      await prisma.tasteChallenge.update({
        where: { id },
        data: { [progressField]: currentProgress },
      })

      // Check if challenge is complete
      const updatedChallenge = await prisma.tasteChallenge.findUnique({ where: { id } })
      const creatorProgress = updatedChallenge?.creatorProgress as { albumsRated: string[]; score: number }
      const partnerProgress = updatedChallenge?.partnerProgress as { albumsRated: string[]; score: number }

      // For "rate_same_album" type, complete when both have rated
      if (challenge.challengeType === "rate_same_album") {
        if (creatorProgress?.albumsRated?.length > 0 && partnerProgress?.albumsRated?.length > 0) {
          const winnerId = creatorProgress.score > partnerProgress.score
            ? challenge.creatorId
            : partnerProgress.score > creatorProgress.score
            ? challenge.partnerId
            : null // tie

          await prisma.tasteChallenge.update({
            where: { id },
            data: {
              status: "completed",
              completedAt: new Date(),
              winnerId,
            },
          })
        }
      }

      return NextResponse.json({ success: true, progress: currentProgress })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating challenge:", error)
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 })
  }
}
