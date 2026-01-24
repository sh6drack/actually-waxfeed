import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { DefaultAvatar } from "@/components/default-avatar"
import { auth } from "@/lib/auth"
import { ProfileActions } from "./profile-actions"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
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

interface Props {
  params: Promise<{ username: string }>
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
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
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
                <span className="flex items-center gap-1.5 px-2 py-1 border border-[#ffd700]/30 bg-[#ffd700]/10" title="Gold Spin - First 10 reviewers on trending albums">
                  <span className="text-[#ffd700]">🥇</span>
                  <span className="text-[#ffd700] font-bold">{user.goldSpinCount}</span>
                  <span className="text-[#ffd700]/70">Gold</span>
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
            <div className="flex gap-2">
              <Link
                href="/settings"
                className="inline-block border px-4 py-2 text-sm no-underline transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--border)' }}
              >
                Edit Profile
              </Link>
              <Link
                href={`/u/${user.username}/stats`}
                className="inline-flex items-center gap-2 border px-4 py-2 text-sm no-underline transition-opacity hover:opacity-70"
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
          {user.socialLinks && Object.keys(user.socialLinks as object).length > 0 && (
            <section>
              <h3 className="font-bold mb-4">Links</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(user.socialLinks as Record<string, string>).map(([key, value]) => (
                  value && (
                    <a
                      key={key}
                      href={value.startsWith("http") ? value : `https://${value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-opacity hover:opacity-70"
                      style={{ color: 'var(--muted)' }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)} →
                    </a>
                  )
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
