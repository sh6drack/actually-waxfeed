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
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-14 h-14 bg-[--muted]/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[--muted]/20 w-1/3" />
              <div className="h-3 bg-[--muted]/10 w-2/3" />
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
          onClick={fetchConversations}
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

  if (conversations.length === 0) {
    return (
      <div className="p-10 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border border-[--border] bg-[--muted]/5">
          <svg className="w-8 h-8 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
        <p className="text-sm text-[--muted] mb-6 max-w-xs mx-auto leading-relaxed">
          Find someone with 60%+ taste compatibility and start connecting over shared music.
        </p>
        <Link
          href="/discover/similar-tasters"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-black font-semibold text-sm hover:bg-[#ffed4a] transition-colors group"
        >
          <span>Find taste matches</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[--border]">
      {conversations.map((conv, index) => {
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
            className={`block p-5 transition-all duration-200 animate-fade-in group ${
              isActive
                ? 'bg-[var(--accent-primary)]/10 border-l-2 border-l-[var(--accent-primary)]'
                : 'hover:bg-[--muted]/5 border-l-2 border-l-transparent hover:border-l-[--muted]/30'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.username || 'User'}
                    className="w-14 h-14 object-cover"
                  />
                ) : (
                  <DefaultAvatar size="md" />
                )}
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[var(--accent-primary)] text-black text-[10px] font-bold flex items-center justify-center">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="font-semibold truncate group-hover:text-[var(--accent-primary)] transition-colors">
                    @{user.username || 'user'}
                  </span>
                  <TasteMatchBadge score={conv.tasteMatchScore} size="sm" showLabel={false} />
                </div>

                {conv.lastMessage && (
                  <p className={`text-sm truncate leading-relaxed ${
                    conv.unreadCount > 0
                      ? 'text-[--foreground] font-medium'
                      : 'text-[--muted]'
                  }`}>
                    {conv.lastMessage.content}
                  </p>
                )}

                {conv.lastMessageAt && (
                  <p className="text-[10px] text-[--muted]/70 mt-2 tracking-wide uppercase">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                  </p>
                )}
              </div>

              {/* Arrow indicator */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
