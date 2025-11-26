import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth, createNotification, isBlocked } from '@/lib/api-utils'

// POST /api/users/[username]/friend - Send or respond to friend request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await requireAuth()
    const body = await request.json().catch(() => ({}))
    const { action } = body // 'send', 'accept', 'reject'

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    })

    if (!targetUser) {
      return errorResponse('User not found', 404)
    }

    if (targetUser.id === currentUser.id) {
      return errorResponse('Cannot friend yourself', 400)
    }

    // Check if blocked
    if (await isBlocked(targetUser.id, currentUser.id)) {
      return errorResponse('Cannot send friend request', 403)
    }

    // Check if already friends
    const [id1, id2] = [currentUser.id, targetUser.id].sort()
    const existingFriendship = await prisma.friendship.findUnique({
      where: { user1Id_user2Id: { user1Id: id1, user2Id: id2 } }
    })

    if (existingFriendship) {
      return errorResponse('Already friends', 409)
    }

    if (action === 'accept' || action === 'reject') {
      // Handle incoming request from targetUser
      const request = await prisma.friendRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: targetUser.id,
            receiverId: currentUser.id
          }
        }
      })

      if (!request || request.status !== 'pending') {
        return errorResponse('No pending friend request', 404)
      }

      if (action === 'accept') {
        // Create friendship
        await prisma.friendship.create({
          data: { user1Id: id1, user2Id: id2 }
        })

        // Update request status
        await prisma.friendRequest.update({
          where: { id: request.id },
          data: { status: 'accepted', respondedAt: new Date() }
        })

        // Notify the sender
        await createNotification(targetUser.id, 'friend_accept', {
          actorId: currentUser.id,
          actorName: currentUser.username || currentUser.name,
        })

        return successResponse({ status: 'accepted' })
      } else {
        // Reject request
        await prisma.friendRequest.update({
          where: { id: request.id },
          data: { status: 'rejected', respondedAt: new Date() }
        })

        return successResponse({ status: 'rejected' })
      }
    }

    // Default: send friend request
    // Check for existing request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: currentUser.id }
        ]
      }
    })

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        // If they sent us a request, accept it
        if (existingRequest.senderId === targetUser.id) {
          await prisma.friendship.create({
            data: { user1Id: id1, user2Id: id2 }
          })

          await prisma.friendRequest.update({
            where: { id: existingRequest.id },
            data: { status: 'accepted', respondedAt: new Date() }
          })

          await createNotification(targetUser.id, 'friend_accept', {
            actorId: currentUser.id,
            actorName: currentUser.username || currentUser.name,
          })

          return successResponse({ status: 'accepted' })
        }

        return errorResponse('Friend request already pending', 409)
      }

      // Allow re-sending if previously rejected
      if (existingRequest.status === 'rejected' && existingRequest.senderId === currentUser.id) {
        await prisma.friendRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'pending', respondedAt: null }
        })

        await createNotification(targetUser.id, 'friend_request', {
          actorId: currentUser.id,
          actorName: currentUser.username || currentUser.name,
        })

        return successResponse({ status: 'pending' })
      }
    }

    // Create new friend request
    await prisma.friendRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: targetUser.id,
      }
    })

    await createNotification(targetUser.id, 'friend_request', {
      actorId: currentUser.id,
      actorName: currentUser.username || currentUser.name,
    })

    return successResponse({ status: 'pending' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error with friend request:', error)
    return errorResponse('Failed to process friend request', 500)
  }
}

// DELETE /api/users/[username]/friend - Unfriend or cancel request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await requireAuth()

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!targetUser) {
      return errorResponse('User not found', 404)
    }

    // Try to remove friendship
    const [id1, id2] = [currentUser.id, targetUser.id].sort()
    const friendship = await prisma.friendship.findUnique({
      where: { user1Id_user2Id: { user1Id: id1, user2Id: id2 } }
    })

    if (friendship) {
      await prisma.friendship.delete({
        where: { id: friendship.id }
      })
      return successResponse({ unfriended: true })
    }

    // Try to cancel pending request
    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId: currentUser.id,
        receiverId: targetUser.id,
        status: 'pending'
      }
    })

    if (request) {
      await prisma.friendRequest.delete({
        where: { id: request.id }
      })
      return successResponse({ cancelled: true })
    }

    return errorResponse('No friendship or pending request found', 404)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error removing friend:', error)
    return errorResponse('Failed to unfriend', 500)
  }
}
