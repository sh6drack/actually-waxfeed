'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FirstSpinBadge } from './FirstSpinBadge'
import { formatDistanceToNow } from 'date-fns'

interface Room {
  id: string
  album: {
    id: string
    title: string
    artistName: string
    coverArtUrlMedium: string | null
    totalReviews: number
  }
  messageCount: number
  lastActivity: string | null
  lastMessage: {
    content: string
    createdAt: string
    user: { username: string | null }
  } | null
  userBadge: 'gold' | 'silver' | 'bronze' | null
  userReviewPosition: number | null
}

interface RoomListProps {
  onSelectRoom?: (albumId: string) => void
}

export function RoomList({ onSelectRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'activity' | 'recent' | 'alphabetical'>('activity')

  useEffect(() => {
    fetchRooms()
  }, [sortBy])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/rooms?sort=${sortBy}`)
      const data = await res.json()
      if (data.success) {
        setRooms(data.data.rooms)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-16 h-16 bg-[--muted]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[--muted] rounded w-1/2" />
              <div className="h-3 bg-[--muted] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-[--muted]">
        <p>{error}</p>
        <button onClick={fetchRooms} className="mt-2 text-sm underline">
          Try again
        </button>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">🎵</div>
        <h3 className="font-medium mb-2">No album rooms yet</h3>
        <p className="text-sm text-[--muted] mb-4">
          Review albums to unlock their chat rooms and discuss with other reviewers.
        </p>
        <Link 
          href="/discover"
          className="text-sm text-[#ffd700] hover:underline"
        >
          Discover albums to review →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="p-4 border-b border-[--border] flex items-center gap-2">
        <span className="text-xs text-[--muted]">Sort:</span>
        {(['activity', 'recent', 'alphabetical'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-2 py-1 text-xs ${
              sortBy === sort 
                ? 'bg-[#ffd700] text-black font-medium' 
                : 'bg-[--muted]/10 text-[--muted] hover:bg-[--muted]/20'
            }`}
          >
            {sort === 'activity' ? 'Most Active' : sort === 'recent' ? 'Recent' : 'A-Z'}
          </button>
        ))}
      </div>

      {/* Room list */}
      <div className="divide-y divide-[--border]">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.album.id}`}
            onClick={(e) => {
              if (onSelectRoom) {
                e.preventDefault()
                onSelectRoom(room.album.id)
              }
            }}
            className="block p-4 hover:bg-[--muted]/10 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Album art */}
              <div className="relative flex-shrink-0">
                {room.album.coverArtUrlMedium ? (
                  <img
                    src={room.album.coverArtUrlMedium}
                    alt={room.album.title}
                    className="w-16 h-16 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[--muted] flex items-center justify-center">
                    <span className="text-2xl">💿</span>
                  </div>
                )}
                {room.userBadge && (
                  <div className="absolute -bottom-1 -right-1">
                    <FirstSpinBadge 
                      badge={room.userBadge} 
                      position={room.userReviewPosition}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{room.album.title}</h3>
                <p className="text-sm text-[--muted] truncate">{room.album.artistName}</p>
                
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[--muted]">
                  <span>{room.messageCount} messages</span>
                  <span>{room.album.totalReviews} reviewers</span>
                </div>

                {room.lastMessage && (
                  <p className="text-xs text-[--muted] mt-1 truncate">
                    <span className="font-medium">@{room.lastMessage.user.username}</span>: {room.lastMessage.content}
                  </p>
                )}
              </div>

              {/* Activity indicator */}
              {room.lastActivity && (
                <span className="text-[10px] text-[--muted] flex-shrink-0">
                  {formatDistanceToNow(new Date(room.lastActivity), { addSuffix: true })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
