'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConversationList } from '@/components/messaging/ConversationList'

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages')
    }
  }, [status, router])

  useEffect(() => {
    // Fetch unread count
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread')
        const data = await res.json()
        if (data.success) {
          setTotalUnread(data.data.unreadCount)
        }
      } catch {
        // Silent fail
      }
    }
    if (session) {
      fetchUnread()
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[--muted]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-[--border]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-sm text-[--muted] mt-1">
                Chat with taste-matched users (60%+ compatibility)
              </p>
            </div>
            {totalUnread > 0 && (
              <span className="px-3 py-1 bg-[#ffd700] text-black text-sm font-bold">
                {totalUnread} unread
              </span>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-[--muted]/10 border-b border-[--border]">
          <div className="flex items-start gap-3">
            <span className="text-xl">💬</span>
            <div className="text-sm">
              <p className="font-medium">Taste-Gated Messaging</p>
              <p className="text-[--muted] mt-0.5">
                You can only message users with 60% or higher taste compatibility. 
                This ensures every conversation starts with genuine common ground.
              </p>
              <Link 
                href="/discover/similar-tasters"
                className="text-[#ffd700] hover:underline inline-block mt-2"
              >
                Find people who share your taste →
              </Link>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <ConversationList />
      </div>
    </div>
  )
}
