import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, getAuthenticatedUser } from '@/lib/api-utils'

// GET /api/albums/[id] - Get album details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()

    const album = await prisma.album.findFirst({
      where: {
        OR: [
          { id },
          { spotifyId: id }
        ]
      },
      include: {
        tracks: {
          orderBy: [
            { discNumber: 'asc' },
            { trackNumber: 'asc' }
          ]
        },
        userTags: {
          select: {
            tag: true,
          },
          distinct: ['tag'],
          take: 20,
        },
        reviews: {
          take: 10,
          orderBy: { likeCount: 'desc' },
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
              select: { replies: true }
            }
          }
        },
        _count: {
          select: { reviews: true }
        }
      }
    })

    if (!album) {
      return errorResponse('Album not found', 404)
    }

    // Check if user has reviewed this album
    let userReview = null
    if (user?.id) {
      userReview = await prisma.review.findUnique({
        where: {
          userId_albumId: {
            userId: user.id,
            albumId: album.id
          }
        }
      })
    }

    return successResponse({
      ...album,
      userReview,
      tags: album.userTags.map(t => t.tag),
    })
  } catch (error) {
    console.error('Error fetching album:', error)
    return errorResponse('Failed to fetch album', 500)
  }
}
