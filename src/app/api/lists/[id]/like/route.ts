import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/lists/[id]/like - Like a list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
    const user = await requireAuth()

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { id: true }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    const existing = await prisma.listLike.findUnique({
      where: { listId_userId: { listId, userId: user.id } }
    })

    if (existing) {
      return errorResponse('Already liked', 409)
    }

    await prisma.listLike.create({
      data: { listId, userId: user.id }
    })

    await prisma.list.update({
      where: { id: listId },
      data: { likeCount: { increment: 1 } }
    })

    return successResponse({ liked: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error liking list:', error)
    return errorResponse('Failed to like list', 500)
  }
}

// DELETE /api/lists/[id]/like - Unlike a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
    const user = await requireAuth()

    const existing = await prisma.listLike.findUnique({
      where: { listId_userId: { listId, userId: user.id } }
    })

    if (!existing) {
      return errorResponse('Not liked', 404)
    }

    await prisma.listLike.delete({
      where: { listId_userId: { listId, userId: user.id } }
    })

    await prisma.list.update({
      where: { id: listId },
      data: { likeCount: { decrement: 1 } }
    })

    return successResponse({ liked: false })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error unliking list:', error)
    return errorResponse('Failed to unlike list', 500)
  }
}
