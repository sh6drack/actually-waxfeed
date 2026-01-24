'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CircleList } from '@/components/messaging/CircleList'

export default function CirclesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/circles')
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
          <h1 className="text-2xl font-bold">Taste Circles</h1>
          <p className="text-sm text-[--muted] mt-1">
            Connect with others who share your taste archetype
          </p>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-[--muted]/10 border-b border-[--border]">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎭</span>
            <div className="text-sm">
              <p className="font-medium">Algorithm-Assigned Communities</p>
              <p className="text-[--muted] mt-0.5">
                Unlike other platforms where you choose communities, your circles are determined by 
                your TasteID archetype. This ensures you&apos;re with people who actually share your taste.
              </p>
              <Link 
                href="/tasteid"
                className="text-[#ffd700] hover:underline inline-block mt-2"
              >
                View your TasteID →
              </Link>
            </div>
          </div>
        </div>

        {/* Circle List */}
        <CircleList />
      </div>
    </div>
  )
}
