import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { z } from 'zod'

const addItemSchema = z.object({
  albumId: z.string(),
  position: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
})

const reorderSchema = z.object({
  items: z.array(z.object({
    albumId: z.string(),
    position: z.number().int().min(0),
  }))
})

// POST /api/lists/[id]/items - Add item to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
    const user = await requireAuth()
    const body = await request.json()

    const validation = addItemSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        user: { select: { isPremium: true } },
        _count: { select: { items: true } }
      }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    if (list.userId !== user.id) {
      return errorResponse('You can only edit your own lists', 403)
    }

    // Check item limit
    const maxItems = list.user.isPremium ? 100 : 50
    if (list._count.items >= maxItems) {
      return errorResponse(`Maximum ${maxItems} items per list`, 400)
    }

    const { albumId, position, notes } = validation.data

    // Verify album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true }
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check if album already in list
    const existing = await prisma.listItem.findUnique({
      where: { listId_albumId: { listId, albumId } }
    })

    if (existing) {
      return errorResponse('Album already in list', 409)
    }

    // Get next position if not specified
    let itemPosition = position
    if (itemPosition === undefined) {
      const lastItem = await prisma.listItem.findFirst({
        where: { listId },
        orderBy: { position: 'desc' },
        select: { position: true }
      })
      itemPosition = (lastItem?.position ?? -1) + 1
    } else {
      // Shift existing items if inserting at specific position
      await prisma.listItem.updateMany({
        where: { listId, position: { gte: itemPosition } },
        data: { position: { increment: 1 } }
      })
    }

    const item = await prisma.listItem.create({
      data: {
        listId,
        albumId,
        position: itemPosition,
        notes,
      },
      include: {
        album: {
          select: {
            id: true,
            title: true,
            artistName: true,
            coverArtUrl: true,
            coverArtUrlMedium: true,
          }
        }
      }
    })

    return successResponse(item, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error adding list item:', error)
    return errorResponse('Failed to add item', 500)
  }
}

// PATCH /api/lists/[id]/items - Reorder items
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
    const user = await requireAuth()
    const body = await request.json()

    const validation = reorderSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { userId: true }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    if (list.userId !== user.id) {
      return errorResponse('You can only edit your own lists', 403)
    }

    // Update all positions in a transaction
    await prisma.$transaction(
      validation.data.items.map(item =>
        prisma.listItem.update({
          where: { listId_albumId: { listId, albumId: item.albumId } },
          data: { position: item.position }
        })
      )
    )

    // Return updated list
    const items = await prisma.listItem.findMany({
      where: { listId },
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
    })

    return successResponse(items)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error reordering list:', error)
    return errorResponse('Failed to reorder list', 500)
  }
}

// DELETE /api/lists/[id]/items - Remove item from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')

    if (!albumId) {
      return errorResponse('albumId is required', 400)
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { userId: true }
    })

    if (!list) {
      return errorResponse('List not found', 404)
    }

    if (list.userId !== user.id) {
      return errorResponse('You can only edit your own lists', 403)
    }

    // Get item to delete
    const item = await prisma.listItem.findUnique({
      where: { listId_albumId: { listId, albumId } },
      select: { position: true }
    })

    if (!item) {
      return errorResponse('Item not in list', 404)
    }

    // Delete item
    await prisma.listItem.delete({
      where: { listId_albumId: { listId, albumId } }
    })

    // Shift positions of remaining items
    await prisma.listItem.updateMany({
      where: { listId, position: { gt: item.position } },
      data: { position: { decrement: 1 } }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error removing list item:', error)
    return errorResponse('Failed to remove item', 500)
  }
}
