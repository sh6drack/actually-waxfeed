import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { AlbumReviewForm } from "./review-form"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { format } from "date-fns"
import { StreamingLinks } from "@/components/streaming-links"

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

export default async function AlbumPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const album = await getAlbum(id)

  if (!album) {
    notFound()
  }

  const userReview = session?.user?.id
    ? await getUserReview(session.user.id, album.id)
    : null

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
            <div className="w-full sm:w-48 md:w-56 lg:w-64 flex-shrink-0">
              <div className="aspect-square w-full max-w-[280px] mx-auto sm:max-w-none sm:mx-0 bg-[#181818]">
                {album.coverArtUrlLarge || album.coverArtUrl ? (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl || ""}
                    alt={`${album.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#666]">
                    No Cover
                  </div>
                )}
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-[#888] uppercase tracking-wider mb-1">
                {album.albumType}
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 line-clamp-2">
                {album.title}
              </h1>
              <p className="text-base sm:text-lg text-[#888] mb-3">{album.artistName}</p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-[#666] mb-3 flex-wrap">
                <span>{format(new Date(album.releaseDate), "MMM d, yyyy")}</span>
                <span className="text-[#444]">•</span>
                <span>{album.totalTracks} tracks</span>
                <span className="text-[#444]">•</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>

              {/* Genres */}
              {album.genres.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mb-3">
                  {album.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 border border-[#333] text-xs text-[#888]"
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
                  <span className="text-sm text-[#666]">
                    / 10
                  </span>
                </div>
                <span className="text-sm text-[#666]">
                  ({album._count.reviews} {album._count.reviews === 1 ? "review" : "reviews"})
                </span>
              </div>

              {/* Rating Distribution - Hidden on smallest screens */}
              {album.ratingDistribution && (
                <div className="hidden sm:flex items-end gap-0.5 h-8 mb-4 justify-center sm:justify-start">
                  {Object.entries(album.ratingDistribution as Record<string, number>).map(([rating, count]) => (
                    <div
                      key={rating}
                      className="w-2 bg-[#333] hover:bg-white transition-colors"
                      style={{
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

        {/* Tracklist */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <h2 className="text-lg font-bold mb-3">Tracklist</h2>
          <div className="border border-[#222] max-h-[300px] lg:max-h-[400px] overflow-y-auto">
            {album.tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#111] transition-colors group"
              >
                <span className="text-[#555] text-sm w-5 flex-shrink-0">{index + 1}</span>
                <span className="flex-1 truncate text-sm">{track.name}</span>
                <Link
                  href={`/lyrics/${track.id}`}
                  className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[#666] hover:text-white p-1 flex-shrink-0"
                  title="View lyrics"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h12" />
                  </svg>
                </Link>
                <span className="text-[#555] text-sm flex-shrink-0">{formatDuration(track.durationMs)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write a Review */}
      <section className="mb-6 md:mb-8 border border-[#222] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">
          {userReview ? "Your Review" : "Write a Review"}
        </h2>
        {session ? (
          <AlbumReviewForm
            albumId={album.id}
            existingReview={userReview}
          />
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-[#888] mb-4 text-sm sm:text-base">Sign in to write a review</p>
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
          <select className="bg-[#111] border border-[#333] px-3 py-2 text-sm min-w-[140px]">
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {album.reviews.length === 0 ? (
          <div className="border border-[#222] p-6 sm:p-8 text-center">
            <p className="text-[#888] text-sm sm:text-base">No reviews yet. Be the first!</p>
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
