'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DefaultAvatar } from '@/components/default-avatar'
import { TasteMatchBadge } from './TasteMatchBadge'
import { MessageInput } from './MessageInput'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  isRead: boolean
  sender: {
    id: string
    username: string | null
    name: string | null
    image: string | null
  }
  albumContext?: {
    id: string
    title: string
    artistName: string
    coverArtUrlSmall: string | null
  } | null
}

interface ConversationData {
  id: string
  tasteMatchScore: number
  otherUser: {
    id: string
    username: string | null
    name: string | null
    image: string | null
    tastemakeScore: number
  }
  createdAt: string
}

interface MessageThreadProps {
  conversationId: string
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      fetchMessages()
      markAsRead()
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/messages/${conversationId}?limit=100`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.data.messages)
        setConversation(data.data.conversation)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, { method: 'PATCH' })
    } catch {
      // Silent fail
    }
  }

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
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
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading messages</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[--muted] mb-4 text-sm">{error}</p>
          <button
            onClick={fetchMessages}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--muted] animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-[--border]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm">Conversation not found</p>
        </div>
      </div>
    )
  }

  const otherUser = conversation.otherUser

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-[--border] animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href={`/u/${otherUser.username}`} className="flex-shrink-0 group">
            <div className="relative">
              {otherUser.image ? (
                <img
                  src={otherUser.image}
                  alt={otherUser.username || 'User'}
                  className="w-12 h-12 object-cover group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <DefaultAvatar size="sm" />
              )}
              <div className="absolute inset-0 border border-[var(--accent-primary)]/0 group-hover:border-[var(--accent-primary)]/50 transition-colors" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/u/${otherUser.username}`}
              className="font-semibold text-lg hover:text-[var(--accent-primary)] transition-colors"
            >
              @{otherUser.username || 'user'}
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <TasteMatchBadge score={conversation.tasteMatchScore} size="sm" />
              <span className="text-[10px] text-[--muted] tracking-wide uppercase">
                Tastemaker: {otherUser.tastemakeScore}
              </span>
            </div>
          </div>
          <Link
            href={`/u/${otherUser.username}/compare`}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-medium text-[--muted] border border-[--border] hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] transition-all group"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="tracking-wide uppercase">Compare</span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border border-[--border] bg-[--muted]/5">
              <svg className="w-8 h-8 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Start the conversation</h3>
            <p className="text-sm text-[--muted] max-w-xs mx-auto leading-relaxed">
              You matched at <span className="text-[var(--accent-primary)] font-medium">{conversation.tasteMatchScore}%</span> compatibility.
              Say hello and discover what music you both love.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === session?.user?.id
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div
                  className={`max-w-[80%] ${
                    isOwn
                      ? 'bg-[var(--accent-primary)] text-black'
                      : 'bg-[--muted]/10 border border-[--border]'
                  } p-4`}
                >
                  {/* Album context if present */}
                  {msg.albumContext && (
                    <Link
                      href={`/album/${msg.albumContext.id}`}
                      className={`flex items-center gap-3 mb-3 p-2.5 ${
                        isOwn ? 'bg-black/10 hover:bg-black/20' : 'bg-[--muted]/10 hover:bg-[--muted]/20'
                      } transition-colors group`}
                    >
                      {msg.albumContext.coverArtUrlSmall && (
                        <img
                          src={msg.albumContext.coverArtUrlSmall}
                          alt=""
                          className="w-10 h-10"
                        />
                      )}
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isOwn ? 'text-black' : ''}`}>
                          {msg.albumContext.title}
                        </div>
                        <div className={`text-[10px] truncate ${isOwn ? 'text-black/70' : 'text-[--muted]'}`}>
                          {msg.albumContext.artistName}
                        </div>
                      </div>
                      <svg className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'text-black/50' : 'text-[--muted]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>

                  <p className={`text-[10px] mt-2 tracking-wide ${isOwn ? 'text-black/50' : 'text-[--muted]/70'}`}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  )
}
