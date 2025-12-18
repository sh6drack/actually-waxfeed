import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { AlbumReviewForm } from "./review-form"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { format } from "date-fns"

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* TIER 1: Album Cover + Info (left) | Tracklist (right) */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Left side: Cover + Album Info */}
        <div className="flex gap-6 lg:flex-1">
          {/* Album Cover - Large */}
          <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
            <div className="w-full h-full bg-[#222] border border-[#333]">
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

          {/* Album Info - Next to cover */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#888] uppercase tracking-wide mb-1">
              {album.albumType}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-1 truncate">{album.title}</h1>
            <p className="text-lg text-[#888] mb-2">{album.artistName}</p>

            <div className="flex items-center gap-2 text-sm text-[#666] mb-2 flex-wrap">
              <span>{format(new Date(album.releaseDate), "MMMM d, yyyy")}</span>
              <span>•</span>
              <span>{album.totalTracks} tracks</span>
              <span>•</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>

            {/* Genres */}
            {album.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {album.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 border border-[#333] text-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-4 mb-3">
              <div>
                <span className="text-2xl font-bold">
                  {album.averageRating !== null ? album.averageRating.toFixed(1) : "—"}
                </span>
                <span className="text-sm text-[#888] ml-2">
                  {album._count.reviews} {album._count.reviews === 1 ? "review" : "reviews"}
                </span>
              </div>
              {album.ratingDistribution && (
                <div className="flex items-end gap-0.5 h-6">
                  {Object.entries(album.ratingDistribution as Record<string, number>).map(([rating, count]) => (
                    <div
                      key={rating}
                      className="w-1.5 bg-[#333] hover:bg-[#444] transition-colors"
                      style={{
                        height: `${Math.max(3, (count / Math.max(...Object.values(album.ratingDistribution as Record<string, number>))) * 24)}px`
                      }}
                      title={`${rating}: ${count} reviews`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Spotify Link */}
            {album.spotifyUrl && (
              <a
                href={album.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1DB954] text-black px-4 py-2 font-bold text-sm hover:bg-[#1ed760] transition-colors no-underline"
              >
                Listen on Spotify
              </a>
            )}
          </div>
        </div>

        {/* Right side: Tracklist */}
        <div className="lg:w-96 flex-shrink-0">
          <h2 className="text-xl font-bold mb-3">Tracklist</h2>
          <div className="border border-[#222] max-h-64 overflow-y-auto">
            {album.tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-3 px-4 py-2 border-b border-[#222] last:border-b-0 hover:bg-[#111] transition-colors group"
              >
                <span className="text-[#666] text-sm w-5">{index + 1}</span>
                <span className="flex-1 truncate text-sm">{track.name}</span>
                <Link
                  href={`/lyrics/${track.id}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#666] hover:text-white p-1"
                  title="View lyrics"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h12" />
                  </svg>
                </Link>
                <span className="text-[#666] text-sm">{formatDuration(track.durationMs)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIER 2: Write a Review - Full Width */}
      <section className="mb-8 border border-[#222] p-6">
        <h2 className="text-xl font-bold mb-4">
          {userReview ? "Your Review" : "Write a Review"}
        </h2>
        {session ? (
          <AlbumReviewForm
            albumId={album.id}
            existingReview={userReview}
          />
        ) : (
          <div className="text-center py-4">
            <p className="text-[#888] mb-4">Sign in to write a review</p>
            <Link
              href="/login"
              className="inline-block bg-white text-black px-6 py-2 font-bold no-underline hover:bg-gray-100"
            >
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* TIER 3: Reviews - Full Width */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reviews</h2>
          <select className="bg-transparent border border-[#333] px-3 py-1 text-sm">
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {album.reviews.length === 0 ? (
          <div className="border border-[#222] p-8 text-center">
            <p className="text-[#888]">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
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
