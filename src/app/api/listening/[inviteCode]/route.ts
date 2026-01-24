/**
 * API: /api/listening/[inviteCode]
 * Individual listening session operations
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const session = await auth()
    const { inviteCode } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const listeningSession = await prisma.sharedListeningSession.findUnique({
      where: { inviteCode },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    })

    if (!listeningSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get participants and album
    const [host, guest, album] = await Promise.all([
      prisma.user.findUnique({
        where: { id: listeningSession.hostId },
        select: { id: true, username: true, image: true },
      }),
      listeningSession.guestId ? prisma.user.findUnique({
        where: { id: listeningSession.guestId },
        select: { id: true, username: true, image: true },
      }) : null,
      listeningSession.currentAlbumId ? prisma.album.findUnique({
        where: { id: listeningSession.currentAlbumId },
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          tracks: {
            orderBy: { trackNumber: "asc" },
            select: { id: true, name: true, trackNumber: true, durationMs: true, previewUrl: true },
          },
        },
      }) : null,
    ])

    // Enrich messages with user data
    const messageUserIds = [...new Set(listeningSession.messages.map(m => m.userId))]
    const messageUsers = await prisma.user.findMany({
      where: { id: { in: messageUserIds } },
      select: { id: true, username: true, image: true },
    })
    const userMap = Object.fromEntries(messageUsers.map(u => [u.id, u]))

    const enrichedMessages = listeningSession.messages.map(m => ({
      ...m,
      user: userMap[m.userId],
    }))

    return NextResponse.json({
      session: {
        ...listeningSession,
        host,
        guest,
        currentAlbum: album,
        messages: enrichedMessages,
        isHost: listeningSession.hostId === session.user.id,
        canJoin: !listeningSession.guestId || listeningSession.guestId === session.user.id,
      },
    })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const session = await auth()
    const { inviteCode } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, albumId, trackIndex, playbackPosition, message } = body

    const listeningSession = await prisma.sharedListeningSession.findUnique({
      where: { inviteCode },
    })

    if (!listeningSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const isHost = listeningSession.hostId === session.user.id
    const isGuest = listeningSession.guestId === session.user.id

    if (action === "join") {
      // Guest joins session
      if (listeningSession.guestId && listeningSession.guestId !== session.user.id) {
        return NextResponse.json({ error: "Session is full" }, { status: 400 })
      }

      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: {
          guestId: session.user.id,
          status: "active",
          startedAt: listeningSession.startedAt || new Date(),
        },
      })

      return NextResponse.json({ success: true, status: "active" })
    }

    if (action === "play" && isHost) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { isPlaying: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "pause" && isHost) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { isPlaying: false },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "seek" && isHost && playbackPosition !== undefined) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { playbackPosition },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "change_track" && isHost && trackIndex !== undefined) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { currentTrackIndex: trackIndex, playbackPosition: 0 },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "change_album" && isHost && albumId) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { currentAlbumId: albumId, currentTrackIndex: 0, playbackPosition: 0 },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "send_message" && message && (isHost || isGuest)) {
      const newMessage = await prisma.sharedListeningMessage.create({
        data: {
          sessionId: listeningSession.id,
          userId: session.user.id,
          content: message,
          type: "text",
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, username: true, image: true },
      })

      return NextResponse.json({
        success: true,
        message: { ...newMessage, user },
      })
    }

    if (action === "end" && isHost) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { status: "ended", endedAt: new Date() },
      })
      return NextResponse.json({ success: true, status: "ended" })
    }

    if (action === "leave" && isGuest) {
      await prisma.sharedListeningSession.update({
        where: { inviteCode },
        data: { guestId: null, status: "waiting" },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
