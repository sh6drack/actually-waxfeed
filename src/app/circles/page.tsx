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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin"
               style={{ borderRadius: '50%' }} />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading circles</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 lg:px-12 xl:px-20">
        {/* Header */}
        <div className="px-6 pt-10 pb-8 border-b border-[--border] animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-[var(--accent-primary)]" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">Community</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Taste Circles</h1>
          <p className="text-[--muted] mt-3 max-w-lg leading-relaxed">
            Connect with others who share your musical DNA
          </p>
        </div>

        {/* Info banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent border-b border-[--border] animate-fade-in"
             style={{ animationDelay: '100ms' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex-shrink-0">
              <span className="text-lg">🎭</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Algorithm-Assigned Communities</p>
              <p className="text-sm text-[--muted] mt-1 leading-relaxed">
                Unlike other platforms where you choose communities, your circles are determined by
                your TasteID archetype. This ensures you&apos;re with people who actually share your taste.
              </p>
              <Link
                href="/tasteid"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors mt-3 group"
              >
                <span>View your TasteID</span>
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Circle List */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CircleList />
        </div>
      </div>
    </div>
  )
}
