/**
 * API: /api/listening
 * Shared Listening Sessions
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function generateInviteCode(): string {
  return crypto.randomBytes(5).toString("hex")
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const sessions = await prisma.sharedListeningSession.findMany({
      where: {
        OR: [
          { hostId: session.user.id },
          { guestId: session.user.id },
        ],
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    // Enrich with user and album data
    const userIds = [...new Set(sessions.flatMap(s => [s.hostId, s.guestId].filter(Boolean) as string[]))]
    const albumIds = sessions.map(s => s.currentAlbumId).filter(Boolean) as string[]

    const [users, albums] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, image: true },
      }),
      albumIds.length > 0 ? prisma.album.findMany({
        where: { id: { in: albumIds } },
        select: { id: true, spotifyId: true, title: true, artistName: true, coverArtUrl: true },
      }) : [],
    ])

    const userMap = Object.fromEntries(users.map(u => [u.id, u]))
    const albumMap = Object.fromEntries(albums.map(a => [a.id, a]))

    const enrichedSessions = sessions.map(s => ({
      ...s,
      host: userMap[s.hostId],
      guest: s.guestId ? userMap[s.guestId] : null,
      currentAlbum: s.currentAlbumId ? albumMap[s.currentAlbumId] : null,
      isHost: s.hostId === session.user.id,
    }))

    return NextResponse.json({ sessions: enrichedSessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { guestId, albumId, title } = body

    // Generate unique invite code
    const inviteCode = generateInviteCode()

    const listeningSession = await prisma.sharedListeningSession.create({
      data: {
        hostId: session.user.id,
        guestId,
        currentAlbumId: albumId,
        title: title || "Listening Session",
        inviteCode,
        status: guestId ? "waiting" : "waiting",
      },
    })

    // If guest specified, send notification
    if (guestId) {
      const host = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true },
      })

      await prisma.notification.create({
        data: {
          userId: guestId,
          type: "listening_invite",
          content: {
            sessionId: listeningSession.id,
            inviteCode,
            actorId: session.user.id,
            actorName: host?.username || "Someone",
          },
        },
      })
    }

    return NextResponse.json({
      session: listeningSession,
      inviteUrl: `/listen/${inviteCode}`,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
