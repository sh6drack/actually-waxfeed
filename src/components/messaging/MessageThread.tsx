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
    // Scroll to bottom when messages change
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
        <div className="animate-pulse text-[--muted]">Loading messages...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div>
          <p className="text-[--muted] mb-2">{error}</p>
          <button 
            onClick={fetchMessages}
            className="text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--muted]">
        Conversation not found
      </div>
    )
  }

  const otherUser = conversation.otherUser

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[--border] flex items-center gap-3">
        <Link href={`/u/${otherUser.username}`} className="flex-shrink-0">
          {otherUser.image ? (
            <img
              src={otherUser.image}
              alt={otherUser.username || 'User'}
              className="w-10 h-10 object-cover"
            />
          ) : (
            <DefaultAvatar size="sm" />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            href={`/u/${otherUser.username}`}
            className="font-medium hover:underline"
          >
            @{otherUser.username || 'user'}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <TasteMatchBadge score={conversation.tasteMatchScore} size="sm" />
            <span className="text-[10px] text-[--muted]">
              Score: {otherUser.tastemakeScore}
            </span>
          </div>
        </div>
        <Link
          href={`/u/${otherUser.username}/compare`}
          className="text-xs text-[--muted] hover:text-[--foreground]"
        >
          Compare Taste
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-[--muted]">
            <p>No messages yet. Say hello!</p>
            <p className="text-xs mt-1">
              You matched at {conversation.tasteMatchScore}%
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === session?.user?.id
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    isOwn 
                      ? 'bg-[#ffd700] text-black' 
                      : 'bg-[--muted]/20'
                  } p-3`}
                >
                  {/* Album context if present */}
                  {msg.albumContext && (
                    <Link 
                      href={`/album/${msg.albumContext.id}`}
                      className="flex items-center gap-2 mb-2 p-2 bg-black/10 hover:bg-black/20"
                    >
                      {msg.albumContext.coverArtUrlSmall && (
                        <img 
                          src={msg.albumContext.coverArtUrlSmall} 
                          alt="" 
                          className="w-8 h-8"
                        />
                      )}
                      <div className="text-xs">
                        <div className="font-medium truncate">{msg.albumContext.title}</div>
                        <div className="opacity-75 truncate">{msg.albumContext.artistName}</div>
                      </div>
                    </Link>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-black/60' : 'text-[--muted]'}`}>
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
