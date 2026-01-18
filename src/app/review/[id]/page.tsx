import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { DefaultAvatar } from "@/components/default-avatar"
import { ReviewActions } from "./review-actions"
import { ReplyForm } from "./reply-form"
import { ReplyItem } from "./reply-item"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getReview(id: string, userId?: string) {
  const review = await prisma.review.findUnique({
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
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          releaseDate: true,
        }
      },
      replies: {
        orderBy: { createdAt: 'asc' },
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
      },
      _count: {
        select: { likes: true, waxAwards: true, replies: true }
      }
    }
  })

  if (!review) return null

  // Check if user has liked/waxed
  let hasLiked = false
  let hasGivenWax = false
  if (userId) {
    const [like, wax] = await Promise.all([
      prisma.reviewLike.findUnique({
        where: { reviewId_userId: { reviewId: id, userId } }
      }),
      prisma.waxAward.findUnique({
        where: { reviewId_giverId: { reviewId: id, giverId: userId } }
      })
    ])
    hasLiked = !!like
    hasGivenWax = !!wax
  }

  return { ...review, hasLiked, hasGivenWax }
}

export default async function ReviewPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  const review = await getReview(id, session?.user?.id)

  if (!review) {
    notFound()
  }

  const isOwner = session?.user?.id === review.userId

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
      {/* Album Header */}
      <Link
        href={`/album/${review.album.spotifyId || review.album.id}`}
        className="flex items-center gap-4 mb-6 p-4 bg-[#111] border border-[#222] hover:border-[#333] transition-colors no-underline"
      >
        {review.album.coverArtUrl ? (
          <img
            src={review.album.coverArtUrl}
            alt={review.album.title}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#222] flex items-center justify-center text-[#666]">
            No Cover
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-base sm:text-lg truncate">{review.album.title}</h2>
          <p className="text-sm text-[#888] truncate">{review.album.artistName}</p>
        </div>
      </Link>

      {/* Review Card */}
      <div className="border border-[#222] p-4 sm:p-6 mb-6">
        {/* User Info */}
        <div className="flex items-start gap-3 mb-4">
          <Link href={`/u/${review.user.username}`} className="flex-shrink-0">
            {review.user.image ? (
              <img
                src={review.user.image}
                alt={review.user.username || ""}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover border border-[#333]"
              />
            ) : (
              <DefaultAvatar size="md" />
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/u/${review.user.username}`}
                className="font-bold hover:underline no-underline"
              >
                {review.user.username}
              </Link>
              {review.user.isVerified && (
                <span className="text-blue-400 text-xs">✓</span>
              )}
              <span className="text-[#666] text-sm">·</span>
              <span className="text-[#666] text-sm">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
              {review.isEdited && (
                <span className="text-[#666] text-xs">(edited)</span>
              )}
            </div>
            {review.user.bio && (
              <p className="text-xs text-[#666] mt-0.5 truncate">{review.user.bio}</p>
            )}
          </div>
          {/* Rating */}
          <div className="flex-shrink-0 bg-white text-black px-3 py-1 sm:px-4 sm:py-2 font-bold text-lg sm:text-xl">
            {review.rating.toFixed(1)}
          </div>
        </div>

        {/* Review Text */}
        {review.text && (
          <div className="mb-4">
            <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{review.text}</p>
          </div>
        )}

        {/* Actions */}
        <ReviewActions
          reviewId={review.id}
          likeCount={review.likeCount}
          waxCount={review._count.waxAwards}
          hasLiked={review.hasLiked}
          hasGivenWax={review.hasGivenWax}
          isOwner={isOwner}
          isLoggedIn={!!session}
        />
      </div>

      {/* Replies Section */}
      <div className="border border-[#222]">
        <div className="p-4 border-b border-[#222]">
          <h3 className="font-bold">
            Replies ({review._count.replies})
          </h3>
        </div>

        {/* Reply Form */}
        {session ? (
          <ReplyForm reviewId={review.id} />
        ) : (
          <div className="p-4 border-b border-[#222] text-center">
            <Link href="/login" className="text-white hover:underline">
              Sign in to reply
            </Link>
          </div>
        )}

        {/* Replies List */}
        {review.replies.length > 0 ? (
          <div className="divide-y divide-[#222]">
            {review.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#666]">
            No replies yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  )
}
