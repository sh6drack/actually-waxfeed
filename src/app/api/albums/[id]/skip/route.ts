import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { z } from 'zod'

const skipSchema = z.object({
  reason: z.enum(['not_interested', 'already_know', 'not_now']).optional(),
})

// POST /api/albums/[id]/skip - Record album skip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const user = await requireAuth()

    // Parse optional reason from body
    let reason: string | undefined
    try {
      const body = await request.json()
      const validation = skipSchema.safeParse(body)
      if (validation.success) {
        reason = validation.data.reason
      }
    } catch {
      // No body or invalid JSON - that's fine, reason is optional
    }

    // Upsert skip (if they skip the same album twice, just update timestamp/reason)
    const skip = await prisma.albumSkip.upsert({
      where: { userId_albumId: { userId: user.id, albumId } },
      create: {
        userId: user.id,
        albumId,
        reason: reason || null,
      },
      update: {
        reason: reason || undefined, // Only update reason if provided
        createdAt: new Date(), // Update timestamp on re-skip
      },
    })

    return successResponse({
      skipped: true,
      skipId: skip.id,
      reason: skip.reason,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error recording skip:', error)
    return errorResponse('Failed to record skip', 500)
  }
}

// PATCH /api/albums/[id]/skip - Update skip reason
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const user = await requireAuth()
    const body = await request.json()

    const validation = skipSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse('Invalid reason', 400)
    }

    const { reason } = validation.data

    const skip = await prisma.albumSkip.update({
      where: { userId_albumId: { userId: user.id, albumId } },
      data: { reason: reason || null },
    })

    return successResponse({
      updated: true,
      reason: skip.reason,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error updating skip reason:', error)
    return errorResponse('Failed to update skip reason', 500)
  }
}

// GET /api/albums/[id]/skip - Check if album was skipped
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const user = await requireAuth()

    const skip = await prisma.albumSkip.findUnique({
      where: { userId_albumId: { userId: user.id, albumId } },
    })

    return successResponse({
      skipped: !!skip,
      reason: skip?.reason || null,
      skippedAt: skip?.createdAt || null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error checking skip status:', error)
    return errorResponse('Failed to check skip status', 500)
  }
}
