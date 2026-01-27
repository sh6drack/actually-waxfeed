import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, getAuthenticatedUser } from '@/lib/api-utils'

// GET /api/hot-takes/[id] - Get single hot take
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthenticatedUser()

    const hotTake = await prisma.hotTake.findUnique({
      where: { id },
      include: {
        album: {
          select: {
            id: true,
            spotifyId: true,
            title: true,
            artistName: true,
            coverArtUrl: true,
            coverArtUrlLarge: true,
          },
        },
        author: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        votes: {
          select: {
            vote: true,
          },
        },
        arguments: {
          orderBy: [{ likes: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!hotTake) {
      return errorResponse('Hot take not found', 404)
    }

    // Calculate vote counts
    const agreeCount = hotTake.votes.filter(v => v.vote === 'agree').length
    const disagreeCount = hotTake.votes.filter(v => v.vote === 'disagree').length

    // Check if user has voted
    let userVote: 'agree' | 'disagree' | null = null
    if (user) {
      const vote = await prisma.hotTakeVote.findUnique({
        where: { hotTakeId_userId: { hotTakeId: id, userId: user.id } },
      })
      userVote = vote?.vote as 'agree' | 'disagree' | null
    }

    // Separate arguments by side
    const agreeArguments = hotTake.arguments.filter(a => a.side === 'agree')
    const disagreeArguments = hotTake.arguments.filter(a => a.side === 'disagree')

    return successResponse({
      id: hotTake.id,
      albumId: hotTake.album.id,
      albumSpotifyId: hotTake.album.spotifyId,
      albumTitle: hotTake.album.title,
      albumArtist: hotTake.album.artistName,
      albumCoverUrl: hotTake.album.coverArtUrl,
      albumCoverUrlLarge: hotTake.album.coverArtUrlLarge,
      stance: hotTake.stance,
      content: hotTake.content,
      authorId: hotTake.author.id,
      authorUsername: hotTake.author.username,
      authorImage: hotTake.author.image,
      createdAt: hotTake.createdAt.toISOString(),
      agreeCount,
      disagreeCount,
      userVote,
      agreeArguments: agreeArguments.map(a => ({
        id: a.id,
        content: a.content,
        authorId: a.author.id,
        authorUsername: a.author.username,
        authorImage: a.author.image,
        likes: a.likes,
        createdAt: a.createdAt.toISOString(),
      })),
      disagreeArguments: disagreeArguments.map(a => ({
        id: a.id,
        content: a.content,
        authorId: a.author.id,
        authorUsername: a.author.username,
        authorImage: a.author.image,
        likes: a.likes,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching hot take:', error)
    return errorResponse('Failed to fetch hot take', 500)
  }
}
