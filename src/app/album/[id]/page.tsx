import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { AlbumReviewForm } from "./review-form"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { format } from "date-fns"
import { StreamingLinks } from "@/components/streaming-links"
import { TrackPlayer } from "@/components/track-player"
import { FirstFans } from "@/components/first-fans"

interface Props {
  params: Promise<{ id: string }>
}

async function getAlbum(spotifyId: string) {
  return prisma.album.findFirst({
    where: {
      OR: [{ id: spotifyId }, { spotifyId }]
    },
    include: {
      tracks: {
        orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }]
      },
      reviews: {
        take: 20,
        orderBy: { likeCount: "desc" },
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
}

async function getUserReview(userId: string, albumId: string) {
  return prisma.review.findUnique({
    where: { userId_albumId: { userId, albumId } }
  })
}

// Get early reviewers (First Fans)
async function getFirstFans(albumId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      albumId,
      reviewPosition: { lte: 100 }
    },
    orderBy: { reviewPosition: 'asc' },
    take: 100,
    select: {
      reviewPosition: true,
      rating: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        }
      }
    }
  })

  // Check if users have badges for this album
  const userIds = reviews.map(r => r.user.id)
  const badges = await prisma.firstSpinBadge.findMany({
    where: {
      albumId,
      userId: { in: userIds }
    },
    select: {
      userId: true,
      badgeType: true,
    }
  })

  const badgeMap = new Map(badges.map(b => [b.userId, b.badgeType]))

  return reviews.map(r => ({
    position: r.reviewPosition!,
    rating: r.rating,
    createdAt: r.createdAt,
    user: r.user,
    badgeType: badgeMap.get(r.user.id) || null,
  }))
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const album = await getAlbum(id)

  if (!album) {
    notFound()
  }

  const [userReview, firstFans] = await Promise.all([
    session?.user?.id ? getUserReview(session.user.id, album.id) : null,
    getFirstFans(album.id),
  ])

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const totalDuration = album.tracks.reduce((sum, t) => sum + t.durationMs, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6 md:mb-8">

        {/* Album Header Section */}
        <div className="flex-1">
          {/* Mobile: Cover on top, Info below */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Album Cover */}
            <div className="w-full sm:w-64 md:w-80 lg:w-96 flex-shrink-0">
              <div className="aspect-square w-full max-w-[384px] mx-auto sm:max-w-none sm:mx-0" style={{ backgroundColor: 'var(--border)' }}>
                {album.coverArtUrlLarge || album.coverArtUrl ? (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl || ""}
                    alt={`${album.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--muted)' }}>
                    No Cover
                  </div>
                )}
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-xs sm:text-sm uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                {album.albumType}
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 line-clamp-2">
                {album.title}
              </h1>
              <p className="text-base sm:text-lg mb-3" style={{ color: 'var(--muted)' }}>{album.artistName}</p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm mb-3 flex-wrap" style={{ color: 'var(--muted)' }}>
                <span>{format(new Date(album.releaseDate), "MMM d, yyyy")}</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span>{album.totalTracks} tracks</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>

              {/* Genres */}
              {album.genres.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mb-3">
                  {album.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 border text-xs"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold">
                    {album.averageRating !== null ? album.averageRating.toFixed(1) : "—"}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    / 10
                  </span>
                </div>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  ({album._count.reviews} {album._count.reviews === 1 ? "review" : "reviews"})
                </span>
              </div>

              {/* Rating Distribution - Hidden on smallest screens */}
              {album.ratingDistribution && (
                <div className="hidden sm:flex items-end gap-0.5 h-8 mb-4 justify-center sm:justify-start">
                  {Object.entries(album.ratingDistribution as Record<string, number>).map(([rating, count]) => (
                    <div
                      key={rating}
                      className="w-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--border)',
                        height: `${Math.max(4, (count / Math.max(...Object.values(album.ratingDistribution as Record<string, number>))) * 32)}px`
                      }}
                      title={`${rating}: ${count} reviews`}
                    />
                  ))}
                </div>
              )}

              {/* Streaming Links */}
              {album.spotifyUrl && (
                <div className="flex justify-center sm:justify-start">
                  <StreamingLinks spotifyUrl={album.spotifyUrl} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist with Player & Ratings */}
        {album.tracks.length > 0 && (
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <h2 className="text-lg font-bold mb-3">Tracklist</h2>
            <TrackPlayer
              tracks={album.tracks}
              albumId={album.id}
              albumTitle={album.title}
              artistName={album.artistName}
              coverArtUrl={album.coverArtUrlSmall || album.coverArtUrl}
            />
          </div>
        )}
      </div>

      {/* First Fans Section */}
      {firstFans.length > 0 && (
        <section className="mb-6 md:mb-8">
          <FirstFans
            fans={firstFans}
            albumTrending={album.isTrending}
            totalReviews={album._count.reviews}
          />
        </section>
      )}

      {/* Write a Review */}
      <section className="mb-6 md:mb-8 border p-4 sm:p-6" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg sm:text-xl font-bold mb-4">
          {userReview ? "Your Review" : "Write a Review"}
        </h2>
        {session ? (
          <AlbumReviewForm
            albumId={album.id}
            currentReviewCount={album._count.reviews}
            existingReview={userReview}
          />
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="mb-4 text-sm sm:text-base" style={{ color: 'var(--muted)' }}>Sign in to write a review</p>
            <Link
              href="/login"
              className="inline-block bg-white px-6 py-3 font-bold no-underline hover:bg-gray-100 transition-colors text-sm sm:text-base"
              style={{ color: '#000' }}
            >
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg sm:text-xl font-bold">Reviews</h2>
          <select className="border px-3 py-2 text-sm min-w-[140px]" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {album.reviews.length === 0 ? (
          <div className="border p-6 sm:p-8 text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {album.reviews.map((review) => (
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
                album={{
                  id: album.id,
                  spotifyId: album.spotifyId,
                  title: album.title,
                  artistName: album.artistName,
                  coverArtUrl: album.coverArtUrl,
                }}
                showAlbum={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
