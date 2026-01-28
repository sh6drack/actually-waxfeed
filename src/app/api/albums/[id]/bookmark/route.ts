import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/albums/[id]/bookmark - Add bookmark
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const user = await requireAuth()

    // Check if album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check if already bookmarked
    const existing = await prisma.albumBookmark.findUnique({
      where: { userId_albumId: { userId: user.id, albumId } }
    })

    if (existing) {
      return errorResponse('Already bookmarked', 409)
    }

    // Create bookmark
    await prisma.albumBookmark.create({
      data: { userId: user.id, albumId }
    })

    return successResponse({ bookmarked: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error bookmarking album:', error)
    return errorResponse('Failed to bookmark album', 500)
  }
}

// DELETE /api/albums/[id]/bookmark - Remove bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const user = await requireAuth()

    const existing = await prisma.albumBookmark.findUnique({
      where: { userId_albumId: { userId: user.id, albumId } }
    })

    if (!existing) {
      return errorResponse('Not bookmarked', 404)
    }

    await prisma.albumBookmark.delete({
      where: { userId_albumId: { userId: user.id, albumId } }
    })

    return successResponse({ bookmarked: false })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error removing bookmark:', error)
    return errorResponse('Failed to remove bookmark', 500)
  }
}

// GET /api/albums/[id]/bookmark - Check bookmark status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params
    const user = await requireAuth()

    const existing = await prisma.albumBookmark.findUnique({
      where: { userId_albumId: { userId: user.id, albumId } }
    })

    return successResponse({ bookmarked: !!existing })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error checking bookmark:', error)
    return errorResponse('Failed to check bookmark', 500)
  }
}
