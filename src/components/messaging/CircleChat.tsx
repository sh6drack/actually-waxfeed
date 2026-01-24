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
        <div className="animate-pulse text-[--muted]">Loading circle...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div>
          <p className="text-[--muted] mb-2">{error}</p>
          {error.includes('must have') ? (
            <p className="text-sm text-[--muted]">
              Your TasteID archetype determines which circles you can join.
            </p>
          ) : (
            <button onClick={fetchCircle} className="text-sm underline">
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--muted]">
        Circle not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[--border]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArchetypeBadge 
                archetype={circle.archetype} 
                isPrimary={isPrimaryArchetype}
                size="lg"
              />
              {isPrimaryArchetype && (
                <span className="text-xs text-[#ffd700]">YOUR PRIMARY</span>
              )}
            </div>
            <p className="text-sm text-[--muted]">{circle.description}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{circle.memberCount.toLocaleString()}</p>
            <p className="text-[10px] text-[--muted] uppercase">members</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-[--muted]">
            <p>No messages yet. Be the first to start the conversation!</p>
            <p className="text-xs mt-2">
              Only {circle.displayName} can chat here.
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
                    <span className="text-[10px] px-1.5 py-0.5 bg-[--muted]/20 text-[--muted]">
                      Score: {msg.userTasteScore}
                    </span>
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
        placeholder={`Chat with fellow ${circle.displayName}...`}
        maxLength={500}
      />
    </div>
  )
}
