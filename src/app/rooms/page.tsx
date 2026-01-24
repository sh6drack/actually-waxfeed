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
          <h1 className="text-2xl font-bold">Album Rooms</h1>
          <p className="text-sm text-[--muted] mt-1">
            Discuss albums with other reviewers
          </p>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-[--muted]/10 border-b border-[--border]">
          <div className="flex items-start gap-3">
            <span className="text-xl">💿</span>
            <div className="text-sm">
              <p className="font-medium">Earned Access</p>
              <p className="text-[--muted] mt-0.5">
                Album rooms are exclusive to users who have reviewed the album. 
                Your First Spin badge (Gold/Silver/Bronze) is displayed in every message.
              </p>
              <Link 
                href="/discover"
                className="text-[#ffd700] hover:underline inline-block mt-2"
              >
                Discover albums to review →
              </Link>
            </div>
          </div>
        </div>

        {/* Room List */}
        <RoomList />
      </div>
    </div>
  )
}
