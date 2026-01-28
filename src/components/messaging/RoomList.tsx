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
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-16 h-16 bg-[--muted]/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[--muted]/20 w-1/2" />
              <div className="h-3 bg-[--muted]/10 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center animate-fade-in">
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-red-500/30 bg-red-500/10">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-[--muted] mb-4 text-sm">{error}</p>
        <button
          onClick={fetchRooms}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try again
        </button>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="p-10 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border border-[--border] bg-[--muted]/5">
          <svg className="w-8 h-8 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-2">No album rooms yet</h3>
        <p className="text-sm text-[--muted] mb-6 max-w-xs mx-auto leading-relaxed">
          Review albums to unlock their exclusive chat rooms and discuss with other reviewers.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-black font-semibold text-sm hover:bg-[#ffed4a] transition-colors group"
        >
          <span>Discover albums</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="px-6 py-4 border-b border-[--border] flex items-center gap-3">
        <span className="text-[10px] tracking-wide uppercase text-[--muted]">Sort by</span>
        <div className="flex gap-1">
          {(['activity', 'recent', 'alphabetical'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                sortBy === sort
                  ? 'bg-[var(--accent-primary)] text-black'
                  : 'bg-[--muted]/5 text-[--muted] hover:bg-[--muted]/10 border border-[--border]'
              }`}
            >
              {sort === 'activity' ? 'Most Active' : sort === 'recent' ? 'Recent' : 'A-Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="divide-y divide-[--border]">
        {rooms.map((room, index) => (
          <Link
            key={room.id}
            href={`/rooms/${room.album.id}`}
            onClick={(e) => {
              if (onSelectRoom) {
                e.preventDefault()
                onSelectRoom(room.album.id)
              }
            }}
            className="block p-5 transition-all duration-200 animate-fade-in group hover:bg-[--muted]/5 border-l-2 border-l-transparent hover:border-l-[var(--accent-primary)]/50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Album art */}
              <div className="relative flex-shrink-0">
                {room.album.coverArtUrlMedium ? (
                  <img
                    src={room.album.coverArtUrlMedium}
                    alt={room.album.title}
                    className="w-16 h-16 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[--muted]/10 border border-[--border] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
                {room.userBadge && (
                  <div className="absolute -bottom-1.5 -right-1.5">
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
                <h3 className="font-semibold truncate group-hover:text-[var(--accent-primary)] transition-colors">
                  {room.album.title}
                </h3>
                <p className="text-sm text-[--muted] truncate">{room.album.artistName}</p>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-[--muted]/70 tracking-wide uppercase">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {room.messageCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {room.album.totalReviews}
                  </span>
                </div>

                {room.lastMessage && (
                  <p className="text-xs text-[--muted] mt-2 truncate">
                    <span className="font-medium text-[--foreground]/80">@{room.lastMessage.user.username}</span>
                    <span className="mx-1.5 opacity-50">·</span>
                    {room.lastMessage.content}
                  </p>
                )}
              </div>

              {/* Activity & Arrow */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {room.lastActivity && (
                  <span className="text-[10px] text-[--muted]/60 tracking-wide">
                    {formatDistanceToNow(new Date(room.lastActivity), { addSuffix: true })}
                  </span>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
