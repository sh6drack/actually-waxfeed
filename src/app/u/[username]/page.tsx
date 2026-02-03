import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { DefaultAvatar } from "@/components/default-avatar"
import { auth } from "@/lib/auth"
import { ProfileActions } from "./profile-actions"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import type { Metadata } from "next"

// Disable caching - always fetch fresh TasteID data
export const dynamic = 'force-dynamic'
export const revalidate = 0
import {
  VerifiedIcon,
  FlameIcon,
  VinylIcon,
  SparkleIcon,
  ChartIcon,
  ArrowRightIcon,
  HeartIcon,
} from "@/components/icons"
import { TasteIDCard } from "@/components/tasteid"
import { getArchetypeInfo } from "@/lib/tasteid"
import { getCurrentTier, getKeepBuildingMessage } from "@/lib/tasteid-tiers"

interface Props {
  params: Promise<{ username: string }>
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      tasteId: {
        select: {
          primaryArchetype: true,
          topGenres: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  })

  if (!user) {
    return { title: `@${username} | WAXFEED` }
  }

  const archetype = user.tasteId
    ? getArchetypeInfo(user.tasteId.primaryArchetype)
    : null

  const title = archetype
    ? `@${user.username} is a ${archetype.name} on WAXFEED`
    : `@${user.username} on WAXFEED`

  const description = user.bio
    ? user.bio.slice(0, 160)
    : user.tasteId?.topGenres?.length
    ? `${user._count.reviews} reviews. Top genres: ${user.tasteId.topGenres.slice(0, 3).join(", ")}`
    : `${user._count.reviews} album reviews on WAXFEED`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.wax-feed.com"
  const ogImageUrl = `${baseUrl}/api/og/user/${username}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "WAXFEED",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `@${user.username}'s profile on WAXFEED`,
        },
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

async function getUser(identifier: string) {
  // Try to find by username first, then by ID
  let user = await prisma.user.findUnique({
    where: { username: identifier },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      socialLinks: true,
      waxScore: true,
      waxBalance: true,
      lifetimeWaxEarned: true,
      premiumWaxScore: true,
      isPremium: true,
      isVerified: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
      // First Spin stats
      tastemakeScore: true,
      goldSpinCount: true,
      silverSpinCount: true,
      bronzeSpinCount: true,
      tasteId: {
        select: {
          primaryArchetype: true,
          secondaryArchetype: true,
          archetypeConfidence: true,
          topGenres: true,
          topArtists: true,
          genreVector: true,
          adventurenessScore: true,
          polarityScore: true,
          ratingSkew: true,
          reviewCount: true,
          averageRating: true,
        }
      },
      _count: {
        select: {
          reviews: true,
          lists: true,
          friendshipsAsUser1: true,
          friendshipsAsUser2: true,
        }
      }
    }
  })

  // If not found by username, try by ID
  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: identifier },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bio: true,
        socialLinks: true,
        waxScore: true,
        waxBalance: true,
        lifetimeWaxEarned: true,
        premiumWaxScore: true,
        isPremium: true,
        isVerified: true,
        createdAt: true,
        currentStreak: true,
        longestStreak: true,
        // First Spin stats
        tastemakeScore: true,
        goldSpinCount: true,
        silverSpinCount: true,
        bronzeSpinCount: true,
        tasteId: {
          select: {
            primaryArchetype: true,
            secondaryArchetype: true,
            archetypeConfidence: true,
            topGenres: true,
            topArtists: true,
            genreVector: true,
            adventurenessScore: true,
            polarityScore: true,
            ratingSkew: true,
            reviewCount: true,
            averageRating: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            lists: true,
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
          }
        }
      }
    })
  }

  return user
}

async function getUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
        }
      },
      _count: {
        select: { replies: true }
      }
    }
  })
}

async function getUserLists(userId: string) {
  return prisma.list.findMany({
    where: { userId, isPublic: true },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        take: 4,
        orderBy: { position: "asc" },
        include: {
          album: {
            select: {
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
}

async function getUserReplies(userId: string) {
  return prisma.reply.findMany({
    where: { userId },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      review: {
        select: {
          id: true,
          rating: true,
          album: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
              coverArtUrl: true,
            }
          },
          user: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      }
    }
  })
}

async function getRelationship(currentUserId: string, targetUserId: string) {
  const [friendship, pendingRequest] = await Promise.all([
    prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: currentUserId },
        ]
      }
    }),
    prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId, status: 'pending' },
          { senderId: targetUserId, receiverId: currentUserId, status: 'pending' },
        ]
      }
    })
  ])

  return {
    isFriend: !!friendship,
    hasPendingRequest: !!pendingRequest,
    pendingRequestSentByMe: pendingRequest?.senderId === currentUserId,
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const session = await auth()
  const user = await getUser(username)

  if (!user) {
    notFound()
  }

  const [reviews, lists, replies] = await Promise.all([
    getUserReviews(user.id),
    getUserLists(user.id),
    getUserReplies(user.id),
  ])

  const isOwnProfile = session?.user?.id === user.id
  const relationship = session?.user?.id && !isOwnProfile
    ? await getRelationship(session.user.id, user.id)
    : null

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  const friendCount = user._count.friendshipsAsUser1 + user._count.friendshipsAsUser2

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-12 xl:px-20 py-6 md:py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 mb-8 md:mb-12 pb-6 md:pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Avatar */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="w-full h-full object-cover border"
              style={{ borderColor: 'var(--border)' }}
            />
          ) : (
            <DefaultAvatar size="lg" className="w-full h-full" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">@{user.username || "user"}</h1>
            {user.isVerified && (
              <VerifiedIcon size={20} className="text-blue-400" title="Verified" />
            )}
            {user.isPremium && (
              <span className="text-xs px-2 py-1" style={{ backgroundColor: 'var(--border)' }}>PRO</span>
            )}
          </div>

          {user.name && <p className="mb-2" style={{ color: 'var(--muted)' }}>{user.name}</p>}
          {user.bio && <p className="text-sm mb-4 max-w-xl mx-auto sm:mx-0">{user.bio}</p>}

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 text-sm mb-4">
            <div>
              <span className="font-bold">{user._count.reviews}</span>
              <span className="ml-1" style={{ color: 'var(--muted)' }}>reviews</span>
            </div>
            <div>
              <span className="font-bold">{user._count.lists}</span>
              <span className="ml-1" style={{ color: 'var(--muted)' }}>lists</span>
            </div>
            <Link href="/friends" className="no-underline hover:opacity-70 transition-opacity">
              <span className="font-bold">{friendCount}</span>
              <span className="ml-1" style={{ color: 'var(--muted)' }}>friends</span>
            </Link>
          </div>

          {/* Streak & Wax Score */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {user.currentStreak > 0 && (
              <span className="flex items-center gap-1.5" title={`Longest: ${user.longestStreak} days`}>
                <FlameIcon size={16} className="text-orange-500" />
                {user.currentStreak} day streak
              </span>
            )}
            {(user.lifetimeWaxEarned || 0) > 0 && (
              <span className="flex items-center gap-1.5" title={`Balance: ${user.waxBalance || 0} Wax`}>
                <VinylIcon size={16} />
                {user.lifetimeWaxEarned?.toLocaleString()} wax earned
              </span>
            )}
            {user.premiumWaxScore > 0 && (
              <span className="flex items-center gap-1.5">
                <SparkleIcon size={16} className="text-yellow-500" />
                {user.premiumWaxScore} premium
              </span>
            )}
          </div>

          {/* First Spin Badges */}
          {((user.goldSpinCount || 0) + (user.silverSpinCount || 0) + (user.bronzeSpinCount || 0)) > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm mb-4">
              {(user.goldSpinCount || 0) > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 border border-[#ffd700]/30 bg-[--accent-primary]/10" title="Gold Spin - First 10 reviewers on trending albums">
                  <span className="text-[--accent-primary]">🥇</span>
                  <span className="text-[--accent-primary] font-bold">{user.goldSpinCount}</span>
                  <span className="text-[--accent-primary]/70">Gold</span>
                </span>
              )}
              {(user.silverSpinCount || 0) > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 border border-gray-400/30 bg-gray-400/10" title="Silver Spin - First 50 reviewers on trending albums">
                  <span className="text-gray-300">🥈</span>
                  <span className="text-gray-300 font-bold">{user.silverSpinCount}</span>
                  <span className="text-gray-400">Silver</span>
                </span>
              )}
              {(user.bronzeSpinCount || 0) > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 border border-amber-700/30 bg-amber-700/10" title="Bronze Spin - First 100 reviewers on trending albums">
                  <span className="text-amber-600">🥉</span>
                  <span className="text-amber-600 font-bold">{user.bronzeSpinCount}</span>
                  <span className="text-amber-700">Bronze</span>
                </span>
              )}
              {(user.tastemakeScore || 0) > 0 && (
                <span className="flex items-center gap-1.5 text-[--muted]" title="Tastemaker Score: Gold×10 + Silver×5 + Bronze×2">
                  <ChartIcon size={14} />
                  <span className="font-bold">{user.tastemakeScore}</span>
                  <span className="text-xs">tastemaker</span>
                </span>
              )}
            </div>
          )}

          {/* Avg Rating & Join Date - Mobile */}
          <div className="sm:hidden text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {avgRating !== null && (
              <span className="mr-3">
                Avg: <span className="font-bold" style={{ color: 'var(--foreground)' }}>{avgRating.toFixed(1)}</span>
              </span>
            )}
            <span style={{ color: 'var(--border)' }}>
              Joined {format(new Date(user.createdAt), "MMM yyyy")}
            </span>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <ProfileActions
              username={user.username!}
              isFriend={relationship?.isFriend || false}
              hasPendingRequest={relationship?.hasPendingRequest || false}
              pendingRequestSentByMe={relationship?.pendingRequestSentByMe || false}
              isLoggedIn={!!session}
            />
          )}

          {isOwnProfile && (
            <div className="flex gap-2 justify-center sm:justify-start">
              <Link
                href="/settings"
                className="inline-block border px-4 py-2.5 text-sm no-underline transition-opacity hover:opacity-70 min-h-[44px] flex items-center"
                style={{ borderColor: 'var(--border)' }}
              >
                Edit Profile
              </Link>
              <Link
                href={`/u/${user.username}/stats`}
                className="inline-flex items-center gap-2 border px-4 py-2.5 text-sm no-underline transition-opacity hover:opacity-70 min-h-[44px]"
                style={{ borderColor: 'var(--border)' }}
              >
                <ChartIcon size={16} />
                Stats
              </Link>
            </div>
          )}
          {!isOwnProfile && (
            <Link
              href={`/u/${user.username}/stats`}
              className="inline-block text-xs no-underline mt-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              View Stats →
            </Link>
          )}
        </div>

        {/* Side Stats - Desktop only */}
        <div className="hidden sm:block text-right text-sm flex-shrink-0">
          {avgRating !== null && (
            <div className="mb-2">
              <span style={{ color: 'var(--muted)' }}>Avg rating: </span>
              <span className="font-bold">{avgRating.toFixed(1)}</span>
            </div>
          )}
          <p style={{ color: 'var(--border)' }}>
            Joined {format(new Date(user.createdAt), "MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Reviews */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold">Recent Reviews</h2>
          </div>

          {reviews.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No reviews yet.</p>
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
                  user={{
                    id: user.id,
                    username: user.username,
                    image: user.image,
                    isVerified: user.isVerified,
                  }}
                  album={review.album}
                  compact
                />
              ))}
            </div>
          )}

          {/* Replies Section */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Recent Replies</h2>

            {replies.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No replies yet.</p>
            ) : (
              <div className="space-y-3">
                {replies.map((reply) => (
                  <Link
                    key={reply.id}
                    href={`/review/${reply.review.id}`}
                    className="block border p-3 sm:p-4 transition-colors no-underline hover:opacity-80"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex gap-3">
                      {/* Album art */}
                      <div className="w-12 h-12 flex-shrink-0" style={{ backgroundColor: 'var(--border)' }}>
                        {reply.review.album.coverArtUrl ? (
                          <img
                            src={reply.review.album.coverArtUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 mb-1.5" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                          {reply.text}
                        </p>
                        <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--muted)' }}>
                          <span>
                            on {reply.review.album.title} by {reply.review.album.artistName}
                          </span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span>
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                          {reply.likeCount > 0 && (
                            <>
                              <span style={{ color: 'var(--border)' }}>·</span>
                              <span className="flex items-center gap-1"><HeartIcon size={12} /> {reply.likeCount}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8 order-1 lg:order-2">
          {/* TasteID Card */}
          {user.tasteId && (
            <section>
              <TasteIDCard
                username={user.username!}
                archetype={getArchetypeInfo(user.tasteId.primaryArchetype)}
                secondaryArchetype={
                  user.tasteId.secondaryArchetype
                    ? getArchetypeInfo(user.tasteId.secondaryArchetype)
                    : null
                }
                topGenres={user.tasteId.topGenres}
                topArtists={user.tasteId.topArtists}
                genreVector={user.tasteId.genreVector as Record<string, number>}
                adventurenessScore={user.tasteId.adventurenessScore}
                polarityScore={user.tasteId.polarityScore}
                ratingSkew={user.tasteId.ratingSkew}
                reviewCount={user.tasteId.reviewCount}
                averageRating={user.tasteId.averageRating}
                showRadar
                compact
              />
              {/* TasteID is never complete - always show progress */}
              {isOwnProfile && (
                <div className="mt-3 p-3 border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">
                        {getCurrentTier(user.tasteId.reviewCount).name} Tier
                      </p>
                      <p className="text-xs text-[var(--muted-dim)]">
                        {getKeepBuildingMessage(user.tasteId.reviewCount)}
                      </p>
                    </div>
                    <Link
                      href="/quick-rate"
                      className="px-3 py-1.5 bg-[--accent-primary] text-black text-[10px] font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors"
                    >
                      Keep Building
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Generate TasteID prompt for own profile */}
          {isOwnProfile && !user.tasteId && user._count.reviews >= 3 && (
            <section>
              <Link
                href={`/u/${user.username}/tasteid`}
                className="block border-2 p-4 text-center transition-opacity hover:opacity-80 no-underline"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="font-bold mb-2">Generate Your TasteID</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Create your unique music taste fingerprint
                </p>
              </Link>
            </section>
          )}

          {/* Lists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-base font-bold">Lists</h3>
            </div>

            {lists.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No lists yet.</p>
            ) : (
              <div className="space-y-4">
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/list/${list.id}`}
                    className="block border p-4 transition-opacity hover:opacity-80 no-underline"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p className="font-bold truncate">{list.title}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{list._count.items} albums</p>
                    <div className="flex gap-1 mt-2">
                      {list.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="w-12 h-12" style={{ backgroundColor: 'var(--border)' }}>
                          {item.album.coverArtUrlMedium || item.album.coverArtUrl ? (
                            <img
                              src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ""}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Social Links */}
          {user.socialLinks && Object.values(user.socialLinks as object).some(v => v) && (
            <section>
              <h3 className="text-xs tracking-[0.15em] uppercase text-[var(--muted)] mb-3">Links</h3>
              <div className="flex flex-wrap gap-2">
                {(user.socialLinks as Record<string, string>).instagram && (
                  <a
                    href={`https://instagram.com/${(user.socialLinks as Record<string, string>).instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:border-[#E4405F] hover:text-[#E4405F] transition-all group"
                  >
                    <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[#E4405F] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-xs font-medium">@{(user.socialLinks as Record<string, string>).instagram}</span>
                  </a>
                )}
                {(user.socialLinks as Record<string, string>).twitter && (
                  <a
                    href={`https://x.com/${(user.socialLinks as Record<string, string>).twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-all group"
                  >
                    <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="text-xs font-medium">@{(user.socialLinks as Record<string, string>).twitter}</span>
                  </a>
                )}
                {(user.socialLinks as Record<string, string>).spotify && (
                  <a
                    href={(user.socialLinks as Record<string, string>).spotify.startsWith("http") ? (user.socialLinks as Record<string, string>).spotify : `https://${(user.socialLinks as Record<string, string>).spotify}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:border-[#1DB954] hover:text-[#1DB954] transition-all group"
                  >
                    <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[#1DB954] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span className="text-xs font-medium">Spotify</span>
                  </a>
                )}
                {(user.socialLinks as Record<string, string>).website && (
                  <a
                    href={(user.socialLinks as Record<string, string>).website.startsWith("http") ? (user.socialLinks as Record<string, string>).website : `https://${(user.socialLinks as Record<string, string>).website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:border-[--accent-primary] hover:text-[--accent-primary] transition-all group"
                  >
                    <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[--accent-primary] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span className="text-xs font-medium truncate max-w-[120px]">
                      {(user.socialLinks as Record<string, string>).website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
