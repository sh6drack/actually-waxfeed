'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DefaultAvatar } from '@/components/default-avatar'
import { FirstSpinBadge } from './FirstSpinBadge'
import { MessageInput } from './MessageInput'
import { formatDistanceToNow } from 'date-fns'

interface RoomMessage {
  id: string
  content: string
  createdAt: string
  userFirstSpinBadge: 'gold' | 'silver' | 'bronze' | null
  userReviewPosition: number | null
  user: {
    id: string
    username: string | null
    name: string | null
    image: string | null
    tastemakeScore: number
  }
}

interface RoomData {
  id: string
  album: {
    id: string
    title: string
    artistName: string
    coverArtUrlMedium: string | null
    coverArtUrlLarge: string | null
    totalReviews: number
  }
  messageCount: number
  memberCount: number
  lastActivity: string | null
}

interface RoomChatProps {
  albumId: string
}

export function RoomChat({ albumId }: RoomChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [room, setRoom] = useState<RoomData | null>(null)
  const [userBadge, setUserBadge] = useState<'gold' | 'silver' | 'bronze' | null>(null)
  const [userPosition, setUserPosition] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (albumId) {
      fetchRoom()
    }
  }, [albumId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchRoom = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/rooms/${albumId}?limit=100`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.data.messages)
        setRoom(data.data.room)
        setUserBadge(data.data.userBadge)
        setUserPosition(data.data.userReviewPosition)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to load room')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/rooms/${albumId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages((prev) => [...prev, data.data.message])
      } else {
        alert(data.error || 'Failed to send message')
      }
    } catch {
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading room</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-6 animate-fade-in">
        <div>
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-red-500/30 bg-red-500/10">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-[--muted] mb-4 text-sm">{error}</p>
          {error.includes('must review') ? (
            <Link
              href={`/album/${albumId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-black font-semibold text-sm hover:bg-[#ffed4a] transition-colors group"
            >
              <span>Review to unlock</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <button
              onClick={fetchRoom}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--muted] animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-[--border]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm">Room not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with album info */}
      <div className="p-5 border-b border-[--border] animate-fade-in">
        <div className="flex items-start gap-4">
          <Link href={`/album/${room.album.id}`} className="flex-shrink-0 group">
            <div className="relative">
              {room.album.coverArtUrlMedium ? (
                <img
                  src={room.album.coverArtUrlMedium}
                  alt={room.album.title}
                  className="w-16 h-16 object-cover group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-16 h-16 bg-[--muted]/10 border border-[--border] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 border border-[var(--accent-primary)]/0 group-hover:border-[var(--accent-primary)]/50 transition-colors" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/album/${room.album.id}`}
              className="font-semibold text-lg hover:text-[var(--accent-primary)] transition-colors line-clamp-1"
            >
              {room.album.title}
            </Link>
            <p className="text-sm text-[--muted]">{room.album.artistName}</p>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-[--muted]/70 tracking-wide uppercase">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {room.memberCount} reviewers
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {room.messageCount} messages
              </span>
            </div>
          </div>
          {userBadge && (
            <div className="flex-shrink-0">
              <FirstSpinBadge badge={userBadge} position={userPosition} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border border-[--border] bg-[--muted]/5">
              <svg className="w-8 h-8 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Start the discussion</h3>
            <p className="text-sm text-[--muted] max-w-xs mx-auto leading-relaxed">
              Be the first to share your thoughts about this album.
              Only reviewers can chat here.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.user.id === session?.user?.id
            return (
              <div
                key={msg.id}
                className="flex items-start gap-3 animate-fade-in group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Avatar */}
                <Link href={`/u/${msg.user.username}`} className="flex-shrink-0">
                  <div className="relative">
                    {msg.user.image ? (
                      <img
                        src={msg.user.image}
                        alt={msg.user.username || 'User'}
                        className="w-9 h-9 object-cover"
                      />
                    ) : (
                      <DefaultAvatar size="sm" />
                    )}
                  </div>
                </Link>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/u/${msg.user.username}`}
                      className={`text-sm font-semibold hover:underline ${isOwn ? 'text-[var(--accent-primary)]' : ''}`}
                    >
                      @{msg.user.username || 'user'}
                    </Link>
                    {msg.userFirstSpinBadge && (
                      <FirstSpinBadge
                        badge={msg.userFirstSpinBadge}
                        position={msg.userReviewPosition}
                        size="sm"
                      />
                    )}
                    <span className="text-[10px] text-[--muted]/60 tracking-wide">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1.5 whitespace-pre-wrap break-words leading-relaxed text-[--foreground]/90">
                    {msg.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={sending}
        placeholder="Share your thoughts on this album..."
        maxLength={500}
      />
    </div>
  )
}
