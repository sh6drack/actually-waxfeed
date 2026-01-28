'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConversationList } from '@/components/messaging/ConversationList'

type TabType = 'dms' | 'circles' | 'rooms'

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [totalUnread, setTotalUnread] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('dms')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages')
    }
  }, [status, router])

  useEffect(() => {
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
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading messages</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full px-4 lg:px-12 xl:px-20 flex flex-col flex-1 overflow-hidden">
        {/* Compact Header */}
        <div className="py-3 sm:py-4 border-b border-[--border] flex-shrink-0">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Messages</h1>
                <p className="text-[10px] sm:text-xs text-[--muted] hidden sm:block">Connect through music taste</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {totalUnread > 0 && (
                <div className="px-2 sm:px-3 py-1 bg-[var(--accent-primary)] text-black text-xs sm:text-sm font-bold">
                  {totalUnread}
                </div>
              )}
              <Link
                href="/discover/similar-tasters"
                className="hidden sm:block px-4 py-2 border border-[--border] text-xs uppercase tracking-wider hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                Find Matches
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[--border] flex-shrink-0 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-[10px] sm:text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap min-h-[44px] ${
              activeTab === 'dms'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[--muted] hover:text-[--foreground]'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Direct Messages</span>
              <span className="sm:hidden">DMs</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('circles')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-[10px] sm:text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap min-h-[44px] ${
              activeTab === 'circles'
                ? 'border-[#00ff88] text-[#00ff88]'
                : 'border-transparent text-[--muted] hover:text-[--foreground]'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Taste Circles</span>
              <span className="sm:hidden">Circles</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-[10px] sm:text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap min-h-[44px] ${
              activeTab === 'rooms'
                ? 'border-[#00bfff] text-[#00bfff]'
                : 'border-transparent text-[--muted] hover:text-[--foreground]'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="hidden sm:inline">Album Rooms</span>
              <span className="sm:hidden">Rooms</span>
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dms' && (
            <div>
              {/* Taste-gated info */}
              <div className="p-4 bg-[var(--accent-primary)]/5 border-b border-[--border]">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm text-[--muted]">
                    <span className="text-[var(--accent-primary)] font-medium">60%+ taste match</span> required to message
                  </p>
                </div>
              </div>
              <ConversationList />
            </div>
          )}

          {activeTab === 'circles' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 border border-[#00ff88]/30 bg-[#00ff88]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Taste Circles</h3>
              <p className="text-sm text-[--muted] mb-6 max-w-sm mx-auto">
                Join group chats with your taste archetype. Connect with Eclectics, Curators, Nostalgics, and more.
              </p>
              <Link
                href="/circles"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#00ff99] transition-colors"
              >
                Explore Circles
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 border border-[#00bfff]/30 bg-[#00bfff]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#00bfff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Album Rooms</h3>
              <p className="text-sm text-[--muted] mb-6 max-w-sm mx-auto">
                Real-time chat rooms for specific albums. Discuss tracks, share opinions, find fans.
              </p>
              <Link
                href="/rooms"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00bfff] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#00cfff] transition-colors"
              >
                Browse Rooms
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="border-t border-[--border] py-3 sm:py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <p className="text-[10px] sm:text-xs text-[--muted] text-center sm:text-left">
              Powered by <span className="text-[var(--accent-primary)]">Polarity</span> matching
            </p>
            <div className="flex gap-3 sm:gap-3">
              <Link
                href="/discover/connections"
                className="text-[10px] sm:text-xs text-[--muted] hover:text-[--foreground] transition-colors"
              >
                Find Connections
              </Link>
              <Link
                href="/settings"
                className="text-[10px] sm:text-xs text-[--muted] hover:text-[--foreground] transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
