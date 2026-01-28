'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { RoomChat } from '@/components/messaging/RoomChat'

export default function AlbumRoomPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const albumId = params.albumId as string

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
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading room</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-[--background]">
      {/* Back navigation */}
      <div className="px-6 py-4 border-b border-[--border] animate-fade-in">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2.5 text-sm text-[--muted] hover:text-[var(--accent-primary)] transition-colors group"
        >
          <div className="w-8 h-8 flex items-center justify-center border border-[--border] group-hover:border-[var(--accent-primary)]/50 group-hover:bg-[var(--accent-primary)]/5 transition-all">
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="tracking-wide uppercase text-[10px] font-medium">All Rooms</span>
        </Link>
      </div>

      {/* Room Chat */}
      <div className="flex-1 flex flex-col w-full px-4 lg:px-12 xl:px-20 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <RoomChat albumId={albumId} />
      </div>
    </div>
  )
}
