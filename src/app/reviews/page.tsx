import { prisma } from "@/lib/prisma"
import { ReviewCard } from "@/components/review-card"

export const dynamic = "force-dynamic"

async function getReviews() {
  return prisma.review.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
          isVerified: true,
        },
      },
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })
}

export default async function ReviewsPage() {
  const reviews = await getReviews()

  return (
    <div className="w-full px-4 lg:px-12 xl:px-20 py-6 lg:py-8">
      <h1 className="text-2xl lg:text-4xl font-bold tracking-tighter mb-6 lg:mb-8">Recent Reviews</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-[--muted]">
          <p>No reviews yet.</p>
          <p className="text-sm mt-2">Be the first to review an album!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              id={review.id}
              rating={review.rating}
              text={review.text}
              createdAt={review.createdAt}
              isEdited={review.isEdited}
              likeCount={review.likeCount}
              replyCount={review._count.replies}
              user={review.user}
              album={review.album}
            />
          ))}
        </div>
      )}
    </div>
  )
}
