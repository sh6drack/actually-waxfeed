"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { DefaultAvatar } from "@/components/default-avatar"

interface User {
  id: string
  username: string
  image: string | null
}

interface Message {
  id: string
  content: string
  type: string
  metadata: Record<string, unknown> | null
  createdAt: string
  sender: User
  isMine: boolean
}

interface ChatViewProps {
  conversationId: string
  otherUser: User
}

export function ChatView({ conversationId, otherUser }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
      }
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-[--muted]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[--border]">
        <Link href={`/u/${otherUser.username}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 border border-[--border] overflow-hidden group-hover:border-white/30 transition-colors">
            {otherUser.image ? (
              <img src={otherUser.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatar size="sm" className="w-full h-full" />
            )}
          </div>
          <span className="font-bold group-hover:underline">@{otherUser.username}</span>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-[--muted]">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const showAvatar =
              i === 0 || messages[i - 1].sender.id !== msg.sender.id
            const showTime =
              i === messages.length - 1 ||
              messages[i + 1].sender.id !== msg.sender.id

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isMine ? "flex-row-reverse" : ""}`}
              >
                {!msg.isMine && showAvatar ? (
                  <div className="w-8 h-8 flex-shrink-0 overflow-hidden">
                    {msg.sender.image ? (
                      <img src={msg.sender.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultAvatar size="sm" className="w-full h-full" />
                    )}
                  </div>
                ) : !msg.isMine ? (
                  <div className="w-8 flex-shrink-0" />
                ) : null}

                <div
                  className={`max-w-[70%] ${msg.isMine ? "text-right" : ""}`}
                >
                  <div
                    className={`inline-block px-4 py-2 ${
                      msg.isMine
                        ? "bg-white text-black"
                        : "bg-[--surface] border border-[--border]"
                    }`}
                  >
                    {/* Special message types */}
                    {msg.type === "album_share" && msg.metadata && (
                      <Link
                        href={`/album/${(msg.metadata as { spotifyId: string }).spotifyId}`}
                        className="block mb-2 p-2 border border-current/20 hover:bg-current/5 transition-colors"
                      >
                        <p className="text-xs opacity-60 uppercase tracking-wider">Shared Album</p>
                        <p className="font-medium">{(msg.metadata as { title: string }).title}</p>
                      </Link>
                    )}

                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {showTime && (
                    <p className={`text-[10px] text-[--muted] mt-1 ${msg.isMine ? "text-right" : ""}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[--border]">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-transparent border border-[--border] text-sm focus:border-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-white text-black font-bold text-sm disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  )
}
