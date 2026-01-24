"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { DefaultAvatar } from "@/components/default-avatar"
import { ChatView } from "@/components/messages/ChatView"

interface User {
  id: string
  username: string
  image: string | null
}

interface Conversation {
  id: string
  createdAt: string
  updatedAt: string
  participants: User[]
  lastMessage: {
    id: string
    content: string
    type: string
    createdAt: string
    sender: User
  } | null
  unreadCount: number
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedOtherUser, setSelectedOtherUser] = useState<User | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    fetchConversations()
    // Poll for new messages
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [session?.user?.id, status])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = (conv: Conversation) => {
    const otherUser = conv.participants.find((p) => p.id !== session?.user?.id)
    if (otherUser) {
      setSelectedId(conv.id)
      setSelectedOtherUser(otherUser)
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

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[--muted]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">💬</div>
          <h1 className="text-3xl font-bold mb-4">Messages</h1>
          <p className="text-[--muted] mb-6">
            Sign in to message your taste connections.
          </p>
          <Link
            href="/login?callbackUrl=/messages"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Sign In to Message
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="border-b border-[--border] flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/discover"
              className="text-[--muted] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Messages</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 text-xs bg-white text-black font-bold">
                {totalUnread}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list */}
        <div className={`w-full lg:w-80 border-r border-[--border] flex flex-col ${selectedId ? "hidden lg:flex" : "flex"}`}>
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-[--border]" />
                  <div className="flex-1">
                    <div className="h-4 bg-[--border] w-1/2 mb-2" />
                    <div className="h-3 bg-[--border] w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-4xl mb-4">💬</div>
                <h3 className="font-bold mb-2">No conversations yet</h3>
                <p className="text-sm text-[--muted] max-w-xs">
                  Connect with taste matches to start messaging.
                </p>
                <Link
                  href="/discover/connections"
                  className="inline-block mt-4 text-sm text-white underline hover:no-underline"
                >
                  Find connections
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => {
                const otherUser = conv.participants.find((p) => p.id !== session.user.id)
                if (!otherUser) return null

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 flex items-start gap-3 text-left hover:bg-[--surface] transition-colors border-b border-[--border] ${
                      selectedId === conv.id ? "bg-[--surface]" : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 border border-[--border] overflow-hidden">
                        {otherUser.image ? (
                          <img src={otherUser.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <DefaultAvatar size="sm" className="w-full h-full" />
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold truncate ${conv.unreadCount > 0 ? "text-white" : ""}`}>
                          @{otherUser.username}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-[--muted] flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-white" : "text-[--muted]"}`}>
                          {conv.lastMessage.sender.id === session.user.id && "You: "}
                          {conv.lastMessage.type === "album_share" ? "Shared an album" : conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-[--muted]">No messages yet</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Chat view */}
        <div className={`flex-1 flex flex-col ${selectedId ? "flex" : "hidden lg:flex"}`}>
          {selectedId && selectedOtherUser ? (
            <>
              {/* Mobile back button */}
              <div className="lg:hidden border-b border-[--border] p-2">
                <button
                  onClick={() => {
                    setSelectedId(null)
                    setSelectedOtherUser(null)
                  }}
                  className="p-2 text-[--muted] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <ChatView conversationId={selectedId} otherUser={selectedOtherUser} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-4xl mb-4">💬</div>
                <p className="text-[--muted]">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
