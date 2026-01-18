import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// DELETE /api/replies/[id] - Delete a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    // Find the reply
    const reply = await prisma.reply.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        reviewId: true,
      }
    })

    if (!reply) {
      return errorResponse('Reply not found', 404)
    }

    // Only the reply author can delete their reply
    if (reply.userId !== user.id) {
      return errorResponse('You can only delete your own replies', 403)
    }

    // Delete the reply
    await prisma.reply.delete({
      where: { id }
    })

    // Decrement reply count on the review
    await prisma.review.update({
      where: { id: reply.reviewId },
      data: { replyCount: { decrement: 1 } }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error deleting reply:', error)
    return errorResponse('Failed to delete reply', 500)
  }
}
