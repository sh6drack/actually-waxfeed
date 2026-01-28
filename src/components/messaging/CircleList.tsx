'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArchetypeBadge } from './ArchetypeBadge'
import { formatDistanceToNow } from 'date-fns'

interface UserCircle {
  id: string
  archetype: string
  displayName: string
  description: string | null
  memberCount: number
  isPrimary: boolean
  lastMessage: {
    content: string
    createdAt: string
    user: { username: string | null }
  } | null
}

interface OtherCircle {
  id: string
  archetype: string
  displayName: string
  description: string | null
  memberCount: number
}

interface CircleListProps {
  onSelectCircle?: (archetype: string) => void
}

export function CircleList({ onSelectCircle }: CircleListProps) {
  const [userCircles, setUserCircles] = useState<UserCircle[]>([])
  const [otherCircles, setOtherCircles] = useState<OtherCircle[]>([])
  const [userArchetypes, setUserArchetypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchCircles()
  }, [])

  const fetchCircles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/circles')
      const data = await res.json()
      if (data.success) {
        setUserCircles(data.data.userCircles || [])
        setOtherCircles(data.data.otherCircles || [])
        setUserArchetypes(data.data.userArchetypes || [])
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to load circles')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="h-24 bg-[--muted]/10 border border-[--border]" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-[--border]">
          <span className="text-xl">⚠</span>
        </div>
        <p className="text-[--muted] mb-4">{error}</p>
        <button
          onClick={fetchCircles}
          className="px-4 py-2 text-sm border border-[--border] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  if (userCircles.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
          <span className="text-3xl">🎭</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No circles yet</h3>
        <p className="text-sm text-[--muted] mb-6 max-w-xs mx-auto leading-relaxed">
          Review more albums to discover your taste archetype and unlock your circles
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-black text-sm font-medium hover:bg-[#ffed4a] transition-colors group"
        >
          <span>Start reviewing</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Your Circles */}
      <div className="p-6 border-b border-[--border]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-1.5 bg-[var(--accent-primary)]" />
          <h3 className="text-[11px] tracking-[0.2em] uppercase text-[--muted]">
            Your Circles
          </h3>
        </div>
        <div className="space-y-3">
          {userCircles.map((circle, index) => (
            <Link
              key={circle.id}
              href={`/circles/${circle.archetype}`}
              onClick={(e) => {
                if (onSelectCircle) {
                  e.preventDefault()
                  onSelectCircle(circle.archetype)
                }
              }}
              className="block group animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`p-5 border transition-all duration-200 ${
                circle.isPrimary
                  ? 'bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)]'
                  : 'bg-[--muted]/5 border-[--border] hover:border-[--muted] hover:bg-[--muted]/10'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <ArchetypeBadge
                        archetype={circle.archetype}
                        isPrimary={circle.isPrimary}
                        size="md"
                      />
                      {circle.isPrimary && (
                        <span className="text-[9px] tracking-[0.15em] uppercase text-[var(--accent-primary)] font-medium px-1.5 py-0.5 bg-[var(--accent-primary)]/10">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[--muted] leading-relaxed line-clamp-2">
                      {circle.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold tabular-nums">{circle.memberCount.toLocaleString()}</p>
                    <p className="text-[10px] tracking-wider uppercase text-[--muted]">members</p>
                  </div>
                </div>

                {circle.lastMessage && (
                  <div className="mt-4 pt-4 border-t border-[--border]/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-1 bg-green-500 animate-pulse" style={{ borderRadius: '50%' }} />
                      <span className="text-[10px] tracking-wider uppercase text-[--muted]">Latest</span>
                    </div>
                    <p className="text-sm text-[--muted] truncate">
                      <span className="text-[--foreground] font-medium">@{circle.lastMessage.user.username}</span>
                      <span className="mx-1.5 opacity-50">·</span>
                      {circle.lastMessage.content}
                    </p>
                    <p className="text-[10px] text-[--muted]/50 mt-1">
                      {formatDistanceToNow(new Date(circle.lastMessage.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                )}

                {/* Hover arrow indicator */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Other Circles */}
      {otherCircles.length > 0 && (
        <div className="p-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-between w-full group mb-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[--muted]/50" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-[--muted] group-hover:text-[--foreground] transition-colors">
                Other Circles
              </span>
              <span className="text-[10px] text-[--muted]/50 ml-1">({otherCircles.length})</span>
            </div>
            <svg
              className={`w-4 h-4 text-[--muted] transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`space-y-2 overflow-hidden transition-all duration-300 ${showAll ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {otherCircles.map((circle, index) => (
              <div
                key={circle.id}
                className="p-4 bg-[--muted]/5 border border-[--border] opacity-50 hover:opacity-70 transition-opacity"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ArchetypeBadge archetype={circle.archetype} size="sm" />
                    <span className="text-[10px] text-[--muted]/70">
                      <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Requires archetype
                    </span>
                  </div>
                  <span className="text-[10px] text-[--muted] tabular-nums">
                    {circle.memberCount.toLocaleString()} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
