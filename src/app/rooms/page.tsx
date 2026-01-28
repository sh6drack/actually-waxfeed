'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RoomList } from '@/components/messaging/RoomList'

export default function RoomsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/rooms')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--background]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading rooms</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <div className="w-full px-4 lg:px-12 xl:px-20">
        {/* Header */}
        <div className="px-6 pt-10 pb-8 border-b border-[--border] animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-[var(--accent-primary)]" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">Album Chat Rooms</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Rooms</h1>
          <p className="text-sm text-[--muted] leading-relaxed max-w-md">
            Exclusive discussion spaces for album reviewers. Your First Spin badge shows in every message.
          </p>
        </div>

        {/* Info banner */}
        <div className="p-5 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent border-b border-[--border] animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 flex items-center justify-center border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Earned Access</p>
              <p className="text-sm text-[--muted] leading-relaxed">
                Album rooms are exclusive to users who have reviewed the album.
                Your First Spin badge (Gold/Silver/Bronze) displays your reviewer rank.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 text-sm text-[var(--accent-primary)] hover:underline mt-3 group"
              >
                <span>Discover albums to review</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Room List */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <RoomList />
        </div>
      </div>
    </div>
  )
}
