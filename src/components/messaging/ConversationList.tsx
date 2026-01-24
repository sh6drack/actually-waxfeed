'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DefaultAvatar } from '@/components/default-avatar'
import { TasteMatchBadge } from './TasteMatchBadge'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  id: string
  otherUser: {
    id: string
    username: string | null
    name: string | null
    image: string | null
    tastemakeScore: number
  }
  tasteMatchScore: number
  lastMessage: {
    id: string
    content: string
    senderId: string
    createdAt: string
    isRead: boolean
  } | null
  unreadCount: number
  lastMessageAt: string | null
}

interface ConversationListProps {
  activeConversationId?: string
  onSelectConversation?: (id: string) => void
}

export function ConversationList({ 
  activeConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      if (data.success) {
        setConversations(data.data.conversations)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-12 h-12 bg-[--muted] rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[--muted] rounded w-1/3" />
              <div className="h-3 bg-[--muted] rounded w-2/3" />
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
        <button 
          onClick={fetchConversations}
          className="mt-2 text-sm underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="font-medium mb-2">No conversations yet</h3>
        <p className="text-sm text-[--muted] mb-4">
          Find someone with 60%+ taste match and start a conversation!
        </p>
        <Link 
          href="/discover/similar-tasters"
          className="text-sm text-[#ffd700] hover:underline"
        >
          Find taste matches →
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[--border]">
      {conversations.map((conv) => {
        const isActive = conv.id === activeConversationId
        const user = conv.otherUser

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            onClick={(e) => {
              if (onSelectConversation) {
                e.preventDefault()
                onSelectConversation(conv.id)
              }
            }}
            className={`block p-4 hover:bg-[--muted]/10 transition-colors ${
              isActive ? 'bg-[--muted]/20' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.username || 'User'}
                    className="w-12 h-12 object-cover"
                  />
                ) : (
                  <DefaultAvatar size="md" />
                )}
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ffd700] text-black text-[10px] font-bold flex items-center justify-center rounded-full">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    @{user.username || 'user'}
                  </span>
                  <TasteMatchBadge score={conv.tasteMatchScore} size="sm" showLabel={false} />
                </div>

                {conv.lastMessage && (
                  <p className={`text-sm truncate ${
                    conv.unreadCount > 0 ? 'text-[--foreground] font-medium' : 'text-[--muted]'
                  }`}>
                    {conv.lastMessage.content}
                  </p>
                )}

                {conv.lastMessageAt && (
                  <p className="text-[10px] text-[--muted] mt-1">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
