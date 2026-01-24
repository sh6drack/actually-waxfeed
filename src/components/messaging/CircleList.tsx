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
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-[--muted] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-[--muted]">
        <p>{error}</p>
        <button onClick={fetchCircles} className="mt-2 text-sm underline">
          Try again
        </button>
      </div>
    )
  }

  if (userCircles.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">🎭</div>
        <h3 className="font-medium mb-2">No circles yet</h3>
        <p className="text-sm text-[--muted] mb-4">
          Review more albums to discover your taste archetype and unlock your circles!
        </p>
        <Link 
          href="/discover"
          className="text-sm text-[#ffd700] hover:underline"
        >
          Start reviewing →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Your Circles */}
      <div className="p-4 border-b border-[--border]">
        <h3 className="text-xs uppercase tracking-wider text-[--muted] mb-3">
          Your Circles
        </h3>
        <div className="space-y-3">
          {userCircles.map((circle) => (
            <Link
              key={circle.id}
              href={`/circles/${circle.archetype}`}
              onClick={(e) => {
                if (onSelectCircle) {
                  e.preventDefault()
                  onSelectCircle(circle.archetype)
                }
              }}
              className="block p-4 bg-[--muted]/10 hover:bg-[--muted]/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArchetypeBadge 
                      archetype={circle.archetype} 
                      isPrimary={circle.isPrimary}
                      size="md"
                    />
                    {circle.isPrimary && (
                      <span className="text-[10px] text-[#ffd700]">PRIMARY</span>
                    )}
                  </div>
                  <p className="text-xs text-[--muted]">{circle.description}</p>
                </div>
                <span className="text-xs text-[--muted] flex-shrink-0">
                  {circle.memberCount.toLocaleString()} members
                </span>
              </div>

              {circle.lastMessage && (
                <div className="mt-3 pt-3 border-t border-[--border]">
                  <p className="text-xs text-[--muted] truncate">
                    <span className="font-medium">@{circle.lastMessage.user.username}</span>:{' '}
                    {circle.lastMessage.content}
                  </p>
                  <p className="text-[10px] text-[--muted]/60 mt-1">
                    {formatDistanceToNow(new Date(circle.lastMessage.createdAt), { addSuffix: true })}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Other Circles */}
      {otherCircles.length > 0 && (
        <div className="p-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-between w-full text-xs uppercase tracking-wider text-[--muted] mb-3"
          >
            <span>Other Circles ({otherCircles.length})</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAll && (
            <div className="space-y-2">
              {otherCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="p-3 bg-[--muted]/5 border border-[--border] opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <ArchetypeBadge archetype={circle.archetype} size="sm" />
                    <span className="text-[10px] text-[--muted]">
                      {circle.memberCount.toLocaleString()} members
                    </span>
                  </div>
                  <p className="text-[10px] text-[--muted] mt-1">
                    Requires this archetype to join
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
