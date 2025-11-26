import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { auth } from "@/lib/auth"
import { ProfileActions } from "./profile-actions"
import Link from "next/link"
import { format } from "date-fns"

interface Props {
  params: Promise<{ username: string }>
}

async function getUser(username: string) {
  return prisma.user.findUnique({
    where: { username },
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
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: currentUserId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: currentUserId },
      ]
    }
  })

  return {
    isFriend: !!friendship,
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-start gap-8 mb-12 pb-8 border-b border-[#222]">
        {/* Avatar */}
        <div className="w-32 h-32 flex-shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="w-full h-full object-cover border border-[#333]"
            />
          ) : (
            <div className="w-full h-full bg-[#222] flex items-center justify-center text-4xl font-bold">
              {user.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">@{user.username}</h1>
            {user.isVerified && (
              <span className="text-[#888]" title="Verified">✓</span>
            )}
            {user.isPremium && (
              <span className="text-xs bg-[#222] px-2 py-1">PRO</span>
            )}
          </div>

          {user.name && <p className="text-[#888] mb-2">{user.name}</p>}
          {user.bio && <p className="text-sm mb-4 max-w-xl">{user.bio}</p>}

          {/* Stats */}
          <div className="flex gap-6 text-sm mb-4">
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

          {/* Wax Score */}
          {user.waxScore > 0 && (
            <p className="text-sm text-[#888] mb-4">
              🕯️ {user.waxScore} wax
              {user.premiumWaxScore > 0 && ` • ✨ ${user.premiumWaxScore} premium wax`}
            </p>
          )}

          {/* Actions */}
          {!isOwnProfile && (
            <ProfileActions
              username={user.username!}
              isFriend={relationship?.isFriend || false}
              isLoggedIn={!!session}
            />
          )}

          {isOwnProfile && (
            <Link
              href="/settings"
              className="inline-block border border-[#333] px-4 py-2 text-sm no-underline hover:bg-[#111]"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Side Stats */}
        <div className="text-right text-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Reviews */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Reviews</h2>
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
        <div className="space-y-8">
          {/* Lists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Lists</h3>
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
