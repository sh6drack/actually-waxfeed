import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { DefaultAvatar } from "@/components/default-avatar"
import { ReviewActions } from "./review-actions"
import { ReplyForm } from "./reply-form"
import { ReplyItem } from "./reply-item"
import { VerifiedIcon } from "@/components/icons"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for rich iMessage/social embeds
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } },
      album: { select: { title: true, artistName: true, coverArtUrl: true } }
    }
  })

  if (!review) {
    return { title: "Review not found | WAXFEED" }
  }

  const title = `@${review.user.username} rated ${review.album.title} a ${review.rating.toFixed(1)}`
  const description = review.text
    ? review.text.slice(0, 200) + (review.text.length > 200 ? "..." : "")
    : `Check out this review of ${review.album.title} by ${review.album.artistName} on WAXFEED`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://waxfeed.com'
  const ogImageUrl = `${baseUrl}/api/og/review/${id}`

  return {
    title: `${title} | WAXFEED`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "WAXFEED",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${review.album.title} review by @${review.user.username}`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
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
    <div className="w-full px-4 lg:px-12 xl:px-20 py-6 lg:py-8">
      {/* Album Header */}
      <Link
        href={`/album/${review.album.spotifyId || review.album.id}`}
        className="flex items-center gap-4 mb-6 p-4 bg-[--surface] border border-[--border] hover:border-[--foreground]/30 transition-colors no-underline"
      >
        {review.album.coverArtUrl ? (
          <img
            src={review.album.coverArtUrl}
            alt={review.album.title}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[--surface] flex items-center justify-center text-[--muted]">
            No Cover
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-base sm:text-lg truncate">{review.album.title}</h2>
          <p className="text-sm text-[--muted] truncate">{review.album.artistName}</p>
        </div>
      </Link>

      {/* Review Card */}
      <div className="border border-[--border] p-4 sm:p-6 mb-6">
        {/* User Info */}
        <div className="flex items-start gap-3 mb-4">
          <Link href={`/u/${review.user.username}`} className="flex-shrink-0">
            {review.user.image ? (
              <img
                src={review.user.image}
                alt={review.user.username || ""}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover border border-[--border]"
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
                <VerifiedIcon size={14} className="text-blue-400" />
              )}
              <span className="text-[--muted] text-sm">·</span>
              <span className="text-[--muted] text-sm">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
              {review.isEdited && (
                <span className="text-[--muted] text-xs">(edited)</span>
              )}
            </div>
            {review.user.bio && (
              <p className="text-xs text-[--muted] mt-0.5 truncate">{review.user.bio}</p>
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
      <div className="border border-[--border]">
        <div className="p-4 border-b border-[--border]">
          <h3 className="font-bold">
            Replies ({review._count.replies})
          </h3>
        </div>

        {/* Reply Form */}
        {session ? (
          <ReplyForm reviewId={review.id} />
        ) : (
          <div className="p-4 border-b border-[--border] text-center">
            <Link href="/login" className="text-[--foreground] hover:underline">
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
          <div className="p-8 text-center text-[--muted]">
            No replies yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  )
}
