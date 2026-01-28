'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CircleChat } from '@/components/messaging/CircleChat'

export default function CirclePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const archetype = params.archetype as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/circles')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin"
               style={{ borderRadius: '50%' }} />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Entering circle</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back link */}
      <div className="px-4 py-3 border-b border-[--border] bg-[--background]/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <Link
          href="/circles"
          className="inline-flex items-center gap-2 text-sm text-[--muted] hover:text-[var(--accent-primary)] transition-colors group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>All Circles</span>
        </Link>
      </div>

      {/* Circle Chat */}
      <div className="flex-1 flex flex-col w-full px-4 lg:px-12 xl:px-20 w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CircleChat archetype={archetype} />
      </div>
    </div>
  )
}
