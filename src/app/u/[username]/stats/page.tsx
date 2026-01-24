import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"

interface Props {
  params: Promise<{ username: string }>
}

async function getUserStats(username: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { id: username }]
    },
    select: {
      id: true,
      username: true,
      image: true,
      createdAt: true,
    }
  })

  if (!user) return null

  const currentYear = new Date().getFullYear()

  // Get all reviews for this user
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: {
      album: {
        select: {
          artistName: true,
          genres: true,
          title: true,
          coverArtUrl: true,
          spotifyId: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Calculate stats
  const totalReviews = reviews.length
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  // Rating distribution
  const ratingDistribution: Record<number, number> = {}
  for (let i = 0; i <= 10; i++) ratingDistribution[i] = 0
  reviews.forEach(r => {
    const roundedRating = Math.round(r.rating)
    ratingDistribution[roundedRating] = (ratingDistribution[roundedRating] || 0) + 1
  })

  // Top artists (by review count)
  const artistCounts: Record<string, number> = {}
  reviews.forEach(r => {
    artistCounts[r.album.artistName] = (artistCounts[r.album.artistName] || 0) + 1
  })
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Top genres
  const genreCounts: Record<string, number> = {}
  reviews.forEach(r => {
    r.album.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Monthly activity for current year
  const monthlyActivity: Record<number, number> = {}
  for (let i = 1; i <= 12; i++) monthlyActivity[i] = 0
  reviews.forEach(r => {
    const date = new Date(r.createdAt)
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth() + 1
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1
    }
  })

  // Highest and lowest rated
  const sortedByRating = [...reviews].sort((a, b) => b.rating - a.rating)
  const highestRated = sortedByRating.slice(0, 3)
  const lowestRated = sortedByRating.slice(-3).reverse()

  // This year's reviews
  const thisYearReviews = reviews.filter(
    r => new Date(r.createdAt).getFullYear() === currentYear
  ).length

  // Lists count
  const listsCount = await prisma.list.count({
    where: { userId: user.id }
  })

  return {
    user,
    stats: {
      totalReviews,
      thisYearReviews,
      avgRating,
      ratingDistribution,
      topArtists,
      topGenres,
      monthlyActivity,
      highestRated,
      lowestRated,
      listsCount,
      currentYear,
    }
  }
}

export default async function UserStatsPage({ params }: Props) {
  const { username } = await params
  const session = await auth()
  const data = await getUserStats(username)

  if (!data) {
    notFound()
  }

  const { user, stats } = data
  const isOwnProfile = session?.user?.id === user.id
  const maxMonthlyActivity = Math.max(...Object.values(stats.monthlyActivity), 1)
  const maxRatingCount = Math.max(...Object.values(stats.ratingDistribution), 1)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/u/${user.username}`} className="text-[--muted] hover:text-[--foreground] no-underline text-sm">
            ← Back to profile
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold mt-2">
            {isOwnProfile ? "Your" : `${user.username}'s`} Stats
          </h1>
        </div>
        <div className="text-right">
          <p className="text-3xl lg:text-4xl font-bold">{stats.currentYear}</p>
          <p className="text-xs text-[--muted]">Year in Review</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-[--border] p-4 text-center">
          <p className="text-3xl font-bold">{stats.totalReviews}</p>
          <p className="text-xs text-[--muted]">Total Reviews</p>
        </div>
        <div className="border border-[--border] p-4 text-center">
          <p className="text-3xl font-bold">{stats.thisYearReviews}</p>
          <p className="text-xs text-[--muted]">This Year</p>
        </div>
        <div className="border border-[--border] p-4 text-center">
          <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
          <p className="text-xs text-[--muted]">Avg Rating</p>
        </div>
        <div className="border border-[--border] p-4 text-center">
          <p className="text-3xl font-bold">{stats.listsCount}</p>
          <p className="text-xs text-[--muted]">Lists</p>
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{stats.currentYear} Activity</h2>
        <div className="border border-[--border] p-4">
          <div className="flex items-end gap-1 h-32">
            {months.map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[--accent] transition-all"
                  style={{
                    height: `${(stats.monthlyActivity[i + 1] / maxMonthlyActivity) * 100}%`,
                    minHeight: stats.monthlyActivity[i + 1] > 0 ? "4px" : "0",
                  }}
                />
                <span className="text-[10px] text-[--muted-dim]">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rating Distribution */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">Rating Distribution</h2>
        <div className="border border-[--border] p-4">
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[--accent] transition-all"
                  style={{
                    height: `${(stats.ratingDistribution[i] / maxRatingCount) * 100}%`,
                    minHeight: stats.ratingDistribution[i] > 0 ? "4px" : "0",
                  }}
                />
                <span className="text-[10px] text-[--muted-dim]">{i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Column: Top Artists + Top Genres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <section>
          <h2 className="text-lg font-bold mb-4">Top Artists</h2>
          <div className="border border-[--border]">
            {stats.topArtists.length === 0 ? (
              <p className="p-4 text-[--muted] text-sm">No reviews yet</p>
            ) : (
              stats.topArtists.map((artist, i) => (
                <div key={artist.name} className="flex items-center gap-3 p-3 border-b border-[--surface] last:border-0">
                  <span className="text-[--muted-dim] text-sm w-5">{i + 1}</span>
                  <span className="flex-1 truncate text-sm">{artist.name}</span>
                  <span className="text-[--muted] text-xs">{artist.count} reviews</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">Top Genres</h2>
          <div className="border border-[--border]">
            {stats.topGenres.length === 0 ? (
              <p className="p-4 text-[--muted] text-sm">No genre data</p>
            ) : (
              stats.topGenres.map((genre, i) => (
                <div key={genre.name} className="flex items-center gap-3 p-3 border-b border-[--surface] last:border-0">
                  <span className="text-[--muted-dim] text-sm w-5">{i + 1}</span>
                  <span className="flex-1 truncate text-sm capitalize">{genre.name}</span>
                  <span className="text-[--muted] text-xs">{genre.count}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Highest Rated */}
      {stats.highestRated.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">Highest Rated</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.highestRated.map((review) => (
              <Link
                key={review.id}
                href={`/album/${review.album.spotifyId}`}
                className="no-underline group"
              >
                <div className="aspect-square bg-[--surface] mb-2 overflow-hidden">
                  {review.album.coverArtUrl ? (
                    <img
                      src={review.album.coverArtUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[--muted-dim] text-xs">
                      No Cover
                    </div>
                  )}
                </div>
                <p className="text-xs truncate">{review.album.title}</p>
                <p className="text-xs text-[--muted] truncate">{review.album.artistName}</p>
                <p className="text-sm font-bold">{review.rating.toFixed(1)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lowest Rated */}
      {stats.lowestRated.length > 0 && stats.totalReviews > 3 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Lowest Rated</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.lowestRated.map((review) => (
              <Link
                key={review.id}
                href={`/album/${review.album.spotifyId}`}
                className="no-underline group"
              >
                <div className="aspect-square bg-[--surface] mb-2 overflow-hidden">
                  {review.album.coverArtUrl ? (
                    <img
                      src={review.album.coverArtUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[--muted-dim] text-xs">
                      No Cover
                    </div>
                  )}
                </div>
                <p className="text-xs truncate">{review.album.title}</p>
                <p className="text-xs text-[--muted] truncate">{review.album.artistName}</p>
                <p className="text-sm font-bold">{review.rating.toFixed(1)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
