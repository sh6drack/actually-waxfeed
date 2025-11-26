import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  requireAuth,
  getAuthenticatedUser,
  isBlocked
} from '@/lib/api-utils'
import { z } from 'zod'

const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  isRanked: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowRemix: z.boolean().optional(),
})

// GET /api/lists/[id] - Get list with all items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            isVerified: true,
            bio: true,
          }
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            album: {
              select: {
                id: true,
                spotifyId: true,
                title: true,
                artistName: true,
                releaseDate: true,
                coverArtUrl: true,
                coverArtUrlMedium: true,
                genres: true,
                averageRating: true,
              }
            }
          }
        },
        remixedFrom: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        },
        _count: {
          select: { items: true, comments: true, remixes: true, likes: true }
        }
      }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    // Check privacy and blocking
    if (!list.isPublic && list.userId !== user?.id) {
      return errorResponse('List not found', 404)
    }

    if (user && await isBlocked(list.userId, user.id)) {
      return errorResponse('List not found', 404)
    }

    // Check if user has liked this list
    let hasLiked = false
    if (user) {
      const like = await prisma.listLike.findUnique({
        where: { listId_userId: { listId: id, userId: user.id } }
      })
      hasLiked = !!like
    }

    return successResponse({
      ...list,
      hasLiked,
      isOwner: list.userId === user?.id,
    })
  } catch (error) {
    console.error('Error fetching list:', error)
    return errorResponse('Failed to fetch list', 500)
  }
}

// PATCH /api/lists/[id] - Update list metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()

    const validation = updateListSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const list = await prisma.list.findUnique({
      where: { id },
      select: { userId: true, publishedAt: true }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    if (list.userId !== user.id) {
      return errorResponse('You can only edit your own lists', 403)
    }

    const { title, description, isRanked, isPublic, allowRemix } = validation.data

    // Handle publishing
    let publishedAt = list.publishedAt
    if (isPublic === true && !publishedAt) {
      publishedAt = new Date()
    }

    const updated = await prisma.list.update({
      where: { id },
      data: {
        title,
        description,
        isRanked,
        isPublic,
        allowRemix,
        publishedAt,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            isVerified: true,
          }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    return successResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error updating list:', error)
    return errorResponse('Failed to update list', 500)
  }
}

// DELETE /api/lists/[id] - Delete list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const list = await prisma.list.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    if (list.userId !== user.id) {
      return errorResponse('You can only delete your own lists', 403)
    }

    await prisma.list.delete({ where: { id } })

    return successResponse({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error deleting list:', error)
    return errorResponse('Failed to delete list', 500)
  }
}

// POST /api/lists/[id] - Remix (duplicate) a list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const originalList = await prisma.list.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!originalList) {
      return errorResponse('List not found', 404)
    }

    if (!originalList.allowRemix && originalList.userId !== user.id) {
      return errorResponse('This list does not allow remixing', 403)
    }

    // Create remix
    const remix = await prisma.list.create({
      data: {
        userId: user.id,
        title: `${originalList.title} (Remix)`,
        description: originalList.description,
        isRanked: originalList.isRanked,
        isPublic: false, // Start as draft
        allowRemix: true,
        remixedFromId: originalList.id,
        items: {
          create: originalList.items.map(item => ({
            albumId: item.albumId,
            position: item.position,
            notes: item.notes,
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          }
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            album: {
              select: {
                id: true,
                title: true,
                artistName: true,
                coverArtUrl: true,
              }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    return successResponse(remix, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error remixing list:', error)
    return errorResponse('Failed to remix list', 500)
  }
}
