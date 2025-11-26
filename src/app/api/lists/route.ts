import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth, getPagination } from '@/lib/api-utils'
import { z } from 'zod'

const createListSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isRanked: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  allowRemix: z.boolean().default(true),
  items: z.array(z.object({
    albumId: z.string(),
    position: z.number().int().min(0),
    notes: z.string().max(1000).optional(),
  })).max(100).optional(),
})

// GET /api/lists - List public lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)

    const sort = searchParams.get('sort') || 'recent'
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {
      isPublic: true,
      publishedAt: { not: null },
    }

    if (userId) {
      where.userId = userId
      delete where.isPublic // Show user's own lists regardless of public status
    }

    let orderBy: Record<string, string>
    switch (sort) {
      case 'popular':
        orderBy = { likeCount: 'desc' }
        break
      case 'comments':
        orderBy = { commentCount: 'desc' }
        break
      default:
        orderBy = { publishedAt: 'desc' }
    }

    const [lists, total] = await Promise.all([
      prisma.list.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
              isVerified: true,
            }
          },
          items: {
            take: 5,
            orderBy: { position: 'asc' },
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
          },
          _count: {
            select: { items: true, comments: true }
          }
        }
      }),
      prisma.list.count({ where }),
    ])

    return successResponse({
      lists,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: Math.floor(skip / limit) + 1,
      },
    })
  } catch (error) {
    console.error('Error fetching lists:', error)
    return errorResponse('Failed to fetch lists', 500)
  }
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const validation = createListSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const { title, description, isRanked, isPublic, allowRemix, items } = validation.data

    // Check list limit for free users (50 items)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isPremium: true }
    })

    const maxItems = dbUser?.isPremium ? 100 : 50
    if (items && items.length > maxItems) {
      return errorResponse(`Free users can only have ${maxItems} items per list`, 400)
    }

    // Verify all albums exist
    if (items && items.length > 0) {
      const albumIds = items.map(i => i.albumId)
      const existingAlbums = await prisma.album.findMany({
        where: { id: { in: albumIds } },
        select: { id: true }
      })

      const existingIds = new Set(existingAlbums.map(a => a.id))
      const missingIds = albumIds.filter(id => !existingIds.has(id))

      if (missingIds.length > 0) {
        return errorResponse(`Albums not found: ${missingIds.join(', ')}`, 400)
      }
    }

    // Create list with items
    const list = await prisma.list.create({
      data: {
        userId: user.id,
        title,
        description,
        isRanked,
        isPublic,
        allowRemix,
        publishedAt: isPublic ? new Date() : null,
        items: items ? {
          create: items.map(item => ({
            albumId: item.albumId,
            position: item.position,
            notes: item.notes,
          }))
        } : undefined,
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
        items: {
          orderBy: { position: 'asc' },
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
        },
        _count: {
          select: { items: true }
        }
      }
    })

    return successResponse(list, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating list:', error)
    return errorResponse('Failed to create list', 500)
  }
}
