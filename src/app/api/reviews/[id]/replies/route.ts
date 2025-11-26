import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  requireAuth,
  createNotification,
  isBlocked
} from '@/lib/api-utils'
import { z } from 'zod'

const createReplySchema = z.object({
  text: z.string().min(1).max(2000),
})

// GET /api/reviews/[id]/replies - Get all replies for a review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const replies = await prisma.reply.findMany({
      where: { reviewId: id },
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            isVerified: true,
          }
        }
      }
    })

    return successResponse(replies)
  } catch (error) {
    console.error('Error fetching replies:', error)
    return errorResponse('Failed to fetch replies', 500)
  }
}

// POST /api/reviews/[id]/replies - Create a reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    const user = await requireAuth()
    const body = await request.json()

    const validation = createReplySchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    // Check review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        album: { select: { title: true } },
        user: { select: { id: true } }
      }
    })

    if (!review) {
      return errorResponse('Review not found', 404)
    }

    // Check if blocked by review author
    if (await isBlocked(review.user.id, user.id)) {
      return errorResponse('You cannot reply to this review', 403)
    }

    const reply = await prisma.reply.create({
      data: {
        reviewId,
        userId: user.id,
        text: validation.data.text,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            isVerified: true,
          }
        }
      }
    })

    // Update reply count
    await prisma.review.update({
      where: { id: reviewId },
      data: { replyCount: { increment: 1 } }
    })

    // Notify review author (if not replying to own review)
    if (review.user.id !== user.id) {
      await createNotification(review.user.id, 'reply', {
        actorId: user.id,
        actorName: user.username || user.name,
        reviewId,
        albumTitle: review.album.title,
        replyText: validation.data.text.slice(0, 100),
      })
    }

    return successResponse(reply, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating reply:', error)
    return errorResponse('Failed to create reply', 500)
  }
}
