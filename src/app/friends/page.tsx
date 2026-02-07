import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DefaultAvatar } from "@/components/default-avatar"
import { FriendRequestActions } from "./friend-request-actions"
import { MusicNoteIcon } from "@/components/icons/ui-icons"

async function getFriendsData(userId: string) {
  // Get all friendships
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    },
    include: {
      user1: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          isVerified: true,
          tasteId: {
            select: { primaryArchetype: true }
          },
          _count: { select: { reviews: true } }
        }
      },
      user2: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          isVerified: true,
          tasteId: {
            select: { primaryArchetype: true }
          },
          _count: { select: { reviews: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get pending friend requests (received)
  const incomingRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: userId,
      status: 'pending'
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          isVerified: true,
          tasteId: {
            select: { primaryArchetype: true }
          },
          _count: { select: { reviews: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get pending friend requests (sent)
  const outgoingRequests = await prisma.friendRequest.findMany({
    where: {
      senderId: userId,
      status: 'pending'
    },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          isVerified: true,
          tasteId: {
            select: { primaryArchetype: true }
          },
          _count: { select: { reviews: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Extract friend users from friendships
  const friends = friendships.map(f =>
    f.user1Id === userId ? f.user2 : f.user1
  )

  return {
    friends,
    incomingRequests: incomingRequests.map(r => ({
      id: r.id,
      user: r.sender,
      createdAt: r.createdAt
    })),
    outgoingRequests: outgoingRequests.map(r => ({
      id: r.id,
      user: r.receiver,
      createdAt: r.createdAt
    }))
  }
}

// Get suggested users to follow
async function getSuggestedUsers(userId: string, existingFriendIds: string[]) {
  return prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...existingFriendIds] },
      username: { not: null },
      reviews: { some: {} },
    },
    orderBy: { reviews: { _count: 'desc' } },
    take: 6,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      tasteId: {
        select: { primaryArchetype: true }
      },
      _count: { select: { reviews: true } }
    }
  })
}

export default async function FriendsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { friends, incomingRequests, outgoingRequests } = await getFriendsData(session.user.id)
  const suggestedUsers = await getSuggestedUsers(
    session.user.id,
    friends.map(f => f.id)
  )

  const hasActivity = incomingRequests.length > 0 || outgoingRequests.length > 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 xl:px-20 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-[--border]">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Friends</h1>
            <p className="text-sm text-[--muted]">
              {friends.length} connection{friends.length !== 1 ? 's' : ''}
              {hasActivity && ' · Activity pending'}
            </p>
          </div>
          <Link
            href="/discover"
            className="px-4 py-2 border-2 border-[--border] text-[11px] tracking-[0.15em] uppercase font-medium hover:border-white hover:bg-white hover:text-black transition-colors"
          >
            Find People
          </Link>
        </div>

        {/* Incoming Requests - Priority Section */}
        {incomingRequests.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-2 h-2 bg-white animate-pulse" />
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold">
                Requests ({incomingRequests.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-5 border-2 border-white bg-white/5"
                >
                  <Link
                    href={`/u/${request.user.username}`}
                    className="flex items-center gap-4 no-underline hover:opacity-80 flex-1"
                  >
                    <div className="w-14 h-14 border border-[--border] overflow-hidden flex-shrink-0">
                      {request.user.image ? (
                        <img
                          src={request.user.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAvatar size="md" className="w-full h-full" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg">@{request.user.username}</p>
                      <div className="flex items-center gap-2 text-sm text-[--muted]">
                        {request.user.tasteId?.primaryArchetype && (
                          <span className="uppercase text-[10px] tracking-wider">
                            {request.user.tasteId.primaryArchetype.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className="text-[--border]">·</span>
                        <span>{request.user._count.reviews} reviews</span>
                      </div>
                    </div>
                  </Link>
                  <FriendRequestActions
                    username={request.user.username!}
                    type="incoming"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Outgoing Requests */}
        {outgoingRequests.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">
                Pending ({outgoingRequests.length})
              </h2>
              <div className="h-px flex-1 bg-[--border]" />
            </div>
            <div className="grid gap-3">
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-[--border]"
                >
                  <Link
                    href={`/u/${request.user.username}`}
                    className="flex items-center gap-4 no-underline hover:opacity-80"
                  >
                    <div className="w-12 h-12 border border-[--border] overflow-hidden">
                      {request.user.image ? (
                        <img
                          src={request.user.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAvatar size="sm" className="w-full h-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">@{request.user.username}</p>
                      {request.user.tasteId?.primaryArchetype && (
                        <p className="text-[10px] text-[--muted] uppercase tracking-wider">
                          {request.user.tasteId.primaryArchetype.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  </Link>
                  <FriendRequestActions
                    username={request.user.username!}
                    type="outgoing"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[11px] tracking-[0.2em] uppercase font-bold">
              Your Friends
            </h2>
            <div className="h-px flex-1 bg-[--border]" />
            <span className="text-[11px] tracking-[0.2em] text-[--muted] tabular-nums">
              {friends.length}
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="border-2 border-dashed border-[--border] p-12 text-center">
              <div className="mb-4"><MusicNoteIcon size={40} /></div>
              <h3 className="text-xl font-bold mb-2">Build your taste network</h3>
              <p className="text-[--muted] mb-6 max-w-md mx-auto">
                Connect with people who share your taste. See what they&apos;re reviewing, compare your TasteIDs, and discover albums through trusted sources.
              </p>
              {suggestedUsers.length === 0 ? (
                <p className="text-sm text-[--muted]">
                  As more people join, you&apos;ll see suggestions based on similar taste here.
                </p>
              ) : (
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-[#e5e5e5] transition-colors"
                >
                  View Top Tastemakers
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/u/${friend.username}`}
                  className="flex items-center gap-4 p-4 border border-[--border] no-underline hover:border-white transition-colors group"
                >
                  <div className="w-14 h-14 border border-[--border] overflow-hidden flex-shrink-0 group-hover:border-white transition-colors">
                    {friend.image ? (
                      <img
                        src={friend.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar size="md" className="w-full h-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">@{friend.username}</p>
                    <div className="flex items-center gap-2 text-sm text-[--muted]">
                      {friend.tasteId?.primaryArchetype && (
                        <span className="uppercase text-[10px] tracking-wider truncate">
                          {friend.tasteId.primaryArchetype.replace(/_/g, ' ')}
                        </span>
                      )}
                      {friend.tasteId?.primaryArchetype && (
                        <span className="text-[--border]">·</span>
                      )}
                      <span className="flex-shrink-0">{friend._count.reviews} reviews</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-[--muted] group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">
                Suggested
              </h2>
              <div className="h-px flex-1 bg-[--border]" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {suggestedUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="group text-center"
                >
                  <div className="aspect-square w-full mb-2 border border-[--border] overflow-hidden group-hover:border-white transition-colors">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <DefaultAvatar size="lg" className="w-full h-full" />
                    )}
                  </div>
                  <p className="text-[11px] font-bold truncate group-hover:text-[--muted] transition-colors">
                    @{user.username}
                  </p>
                  <p className="text-[9px] text-[--muted]">
                    {user._count.reviews} reviews
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
