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
        <div className="animate-pulse text-[--muted]">Loading room...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div>
          <p className="text-[--muted] mb-2">{error}</p>
          {error.includes('must review') ? (
            <Link 
              href={`/album/${albumId}`}
              className="text-sm text-[#ffd700] hover:underline"
            >
              Review this album to join →
            </Link>
          ) : (
            <button onClick={fetchRoom} className="text-sm underline">
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--muted]">
        Room not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with album info */}
      <div className="p-4 border-b border-[--border]">
        <div className="flex items-start gap-4">
          <Link href={`/album/${room.album.id}`} className="flex-shrink-0">
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
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              href={`/album/${room.album.id}`}
              className="font-bold hover:underline line-clamp-1"
            >
              {room.album.title}
            </Link>
            <p className="text-sm text-[--muted]">{room.album.artistName}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[--muted]">
              <span>{room.memberCount} reviewers</span>
              <span>{room.messageCount} messages</span>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-[--muted]">
            <p>No messages yet. Be the first to start the conversation!</p>
            <p className="text-xs mt-2">
              Only people who reviewed this album can chat here.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user.id === session?.user?.id
            return (
              <div key={msg.id} className="flex items-start gap-3">
                {/* Avatar */}
                <Link href={`/u/${msg.user.username}`} className="flex-shrink-0">
                  {msg.user.image ? (
                    <img
                      src={msg.user.image}
                      alt={msg.user.username || 'User'}
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <DefaultAvatar size="sm" />
                  )}
                </Link>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      href={`/u/${msg.user.username}`}
                      className={`text-sm font-medium hover:underline ${isOwn ? 'text-[#ffd700]' : ''}`}
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
                    <span className="text-[10px] text-[--muted]">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">
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
