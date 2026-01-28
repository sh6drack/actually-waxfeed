'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DefaultAvatar } from '@/components/default-avatar'
import { ArchetypeBadge } from './ArchetypeBadge'
import { MessageInput } from './MessageInput'
import { formatDistanceToNow } from 'date-fns'

interface CircleMessage {
  id: string
  content: string
  createdAt: string
  userArchetype: string
  userTasteScore: number
  user: {
    id: string
    username: string | null
    name: string | null
    image: string | null
    tastemakeScore: number
  }
}

interface CircleData {
  id: string
  archetype: string
  displayName: string
  description: string | null
  memberCount: number
}

interface CircleChatProps {
  archetype: string
}

export function CircleChat({ archetype }: CircleChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<CircleMessage[]>([])
  const [circle, setCircle] = useState<CircleData | null>(null)
  const [isPrimaryArchetype, setIsPrimaryArchetype] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (archetype) {
      fetchCircle()
    }
  }, [archetype])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchCircle = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/circles/${archetype}?limit=100`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.data.messages)
        setCircle(data.data.circle)
        setIsPrimaryArchetype(data.data.isPrimaryArchetype)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to load circle')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/circles/${archetype}`, {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin"
               style={{ borderRadius: '50%' }} />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading circle</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-[--border]">
            <svg className="w-5 h-5 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-[--foreground] font-medium mb-2">{error}</p>
          {error.includes('must have') ? (
            <p className="text-sm text-[--muted] leading-relaxed">
              Your TasteID archetype determines which circles you can join. Keep reviewing music to evolve your taste profile.
            </p>
          ) : (
            <button
              onClick={fetchCircle}
              className="mt-4 px-4 py-2 text-sm border border-[--border] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-[--border]">
            <span className="text-lg">🔍</span>
          </div>
          <p className="text-[--muted]">Circle not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-5 border-b transition-colors ${
        isPrimaryArchetype
          ? 'bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent border-[var(--accent-primary)]/30'
          : 'border-[--border]'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <ArchetypeBadge
                archetype={circle.archetype}
                isPrimary={isPrimaryArchetype}
                size="lg"
              />
              {isPrimaryArchetype && (
                <span className="text-[9px] tracking-[0.15em] uppercase text-[var(--accent-primary)] font-medium px-2 py-1 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                  Your Primary
                </span>
              )}
            </div>
            <p className="text-sm text-[--muted] leading-relaxed max-w-md">
              {circle.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-2 justify-end mb-1">
              <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" style={{ borderRadius: '50%' }} />
              <span className="text-[10px] tracking-wider uppercase text-[--muted]">Live</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{circle.memberCount.toLocaleString()}</p>
            <p className="text-[10px] tracking-wider uppercase text-[--muted]">members</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-[--muted]/10 border border-[--border]">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-semibold mb-2">Start the conversation</h3>
            <p className="text-sm text-[--muted] max-w-xs mx-auto leading-relaxed">
              Be the first to share your thoughts with fellow {circle.displayName}.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.user.id === session?.user?.id
            return (
              <div
                key={msg.id}
                className="flex items-start gap-3 animate-fade-in group"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                {/* Avatar */}
                <Link href={`/u/${msg.user.username}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                  {msg.user.image ? (
                    <img
                      src={msg.user.image}
                      alt={msg.user.username || 'User'}
                      className="w-9 h-9 object-cover"
                    />
                  ) : (
                    <DefaultAvatar size="sm" />
                  )}
                </Link>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/u/${msg.user.username}`}
                      className={`text-sm font-semibold hover:underline transition-colors ${
                        isOwn ? 'text-[var(--accent-primary)]' : 'hover:text-[var(--accent-primary)]'
                      }`}
                    >
                      @{msg.user.username || 'user'}
                    </Link>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]/80 font-medium tabular-nums">
                      {msg.userTasteScore}
                    </span>
                    <span className="text-[10px] text-[--muted]/50">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-[--foreground]/90">
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
        placeholder={`Chat with fellow ${circle.displayName}...`}
        maxLength={500}
      />
    </div>
  )
}
