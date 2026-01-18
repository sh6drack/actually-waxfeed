import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, requireAuth, getPagination } from '@/lib/api-utils'
import { z } from 'zod'

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  bio: z.string().max(150).optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    spotify: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  image: z.string().optional(),
})

// GET /api/users - Search users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, skip } = getPagination(searchParams)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400)
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' }
      },
      take: limit,
      skip,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bio: true,
        isVerified: true,
        _count: {
          select: { reviews: true, lists: true, friendshipsAsUser1: true, friendshipsAsUser2: true }
        }
      }
    })

    return successResponse(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return errorResponse('Failed to search users', 500)
  }
}

// PATCH /api/users - Update current user
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const { username, bio, socialLinks, image } = validation.data

    // Handle username change
    if (username) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true, usernameChangesUsed: true, isPremium: true, role: true }
      })

      if (dbUser?.username && dbUser.username !== username) {
        // Check if username is taken
        const existing = await prisma.user.findUnique({
          where: { username }
        })

        if (existing) {
          return errorResponse('Username already taken', 409)
        }

        // ADMIN and PREMIUM roles can always change username, or first change is free
        const hasPrivilegedRole = dbUser.role === 'ADMIN' || dbUser.role === 'PREMIUM'
        const canChange = dbUser.usernameChangesUsed === 0 || dbUser.isPremium || hasPrivilegedRole
        if (!canChange) {
          return errorResponse('Username change requires payment ($5) or premium subscription', 403)
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        bio,
        socialLinks: socialLinks as object,
        image,
        usernameChangesUsed: username ? { increment: 1 } : undefined,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        socialLinks: true,
        waxScore: true,
        premiumWaxScore: true,
        isPremium: true,
        isVerified: true,
        usernameChangesUsed: true,
        createdAt: true,
      }
    })

    return successResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error updating user:', error)
    return errorResponse('Failed to update user', 500)
  }
}
