import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { DefaultAvatar } from "@/components/default-avatar"
import { auth } from "@/lib/auth"
import { ProfileActions } from "./profile-actions"
import Link from "next/link"
import { format } from "date-fns"

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
      premiumWaxScore: true,
      isPremium: true,
      isVerified: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
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
        premiumWaxScore: true,
        isPremium: true,
        isVerified: true,
        createdAt: true,
        currentStreak: true,
        longestStreak: true,
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

  const [reviews, lists] = await Promise.all([
    getUserReviews(user.id),
    getUserLists(user.id),
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
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 mb-8 md:mb-12 pb-6 md:pb-8 border-b border-[#222]">
        {/* Avatar */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="w-full h-full object-cover border border-[#333]"
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
              <span className="text-[#888]" title="Verified">✓</span>
            )}
            {user.isPremium && (
              <span className="text-xs bg-[#222] px-2 py-1">PRO</span>
            )}
          </div>

          {user.name && <p className="text-[#888] mb-2">{user.name}</p>}
          {user.bio && <p className="text-sm mb-4 max-w-xl mx-auto sm:mx-0">{user.bio}</p>}

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 text-sm mb-4">
            <div>
              <span className="font-bold">{user._count.reviews}</span>
              <span className="text-[#888] ml-1">reviews</span>
            </div>
            <div>
              <span className="font-bold">{user._count.lists}</span>
              <span className="text-[#888] ml-1">lists</span>
            </div>
            <div>
              <span className="font-bold">{friendCount}</span>
              <span className="text-[#888] ml-1">friends</span>
            </div>
          </div>

          {/* Streak & Wax Score */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-[#888] mb-4">
            {user.currentStreak > 0 && (
              <span title={`Longest: ${user.longestStreak} days`}>
                🔥 {user.currentStreak} day streak
              </span>
            )}
            {user.waxScore > 0 && (
              <span>
                🕯️ {user.waxScore} wax
              </span>
            )}
            {user.premiumWaxScore > 0 && (
              <span>
                ✨ {user.premiumWaxScore} premium
              </span>
            )}
          </div>

          {/* Avg Rating & Join Date - Mobile */}
          <div className="sm:hidden text-sm text-[#888] mb-4">
            {avgRating !== null && (
              <span className="mr-3">
                Avg: <span className="font-bold text-white">{avgRating.toFixed(1)}</span>
              </span>
            )}
            <span className="text-[#666]">
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
                className="inline-block border border-[#333] px-4 py-2 text-sm no-underline hover:bg-[#111]"
              >
                Edit Profile
              </Link>
              <Link
                href={`/u/${user.username}/stats`}
                className="inline-block border border-[#333] px-4 py-2 text-sm no-underline hover:bg-[#111]"
              >
                📊 Stats
              </Link>
            </div>
          )}
          {!isOwnProfile && (
            <Link
              href={`/u/${user.username}/stats`}
              className="inline-block text-xs text-[#888] hover:text-white no-underline mt-2"
            >
              View Stats →
            </Link>
          )}
        </div>

        {/* Side Stats - Desktop only */}
        <div className="hidden sm:block text-right text-sm flex-shrink-0">
          {avgRating !== null && (
            <div className="mb-2">
              <span className="text-[#888]">Avg rating: </span>
              <span className="font-bold">{avgRating.toFixed(1)}</span>
            </div>
          )}
          <p className="text-[#666]">
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
            <p className="text-[#888]">No reviews yet.</p>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-8 order-1 lg:order-2">
          {/* Lists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-base font-bold">Lists</h3>
            </div>

            {lists.length === 0 ? (
              <p className="text-[#888] text-sm">No lists yet.</p>
            ) : (
              <div className="space-y-4">
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/list/${list.id}`}
                    className="block border border-[#222] p-4 hover:border-[#444] transition-colors no-underline"
                  >
                    <p className="font-bold truncate">{list.title}</p>
                    <p className="text-xs text-[#888]">{list._count.items} albums</p>
                    <div className="flex gap-1 mt-2">
                      {list.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="w-12 h-12 bg-[#222]">
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
                      className="block text-[#888] hover:text-white"
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
