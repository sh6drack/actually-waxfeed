"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BookmarkIcon, BookmarkFilledIcon } from './icons'

interface BookmarkButtonProps {
  albumId: string
  initialBookmarked?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
}

const paddingMap = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

export function BookmarkButton({
  albumId,
  initialBookmarked,
  size = 'md',
  className = '',
  showLabel = false,
}: BookmarkButtonProps) {
  const { data: session } = useSession()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked ?? false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(initialBookmarked !== undefined)

  // Fetch bookmark status if not provided
  useEffect(() => {
    if (session && !hasFetched) {
      fetch(`/api/albums/${albumId}/bookmark`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsBookmarked(data.data.bookmarked)
          }
        })
        .catch(() => {})
        .finally(() => setHasFetched(true))
    }
  }, [session, albumId, hasFetched])

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session || isLoading) return

    // Optimistic update
    const previousState = isBookmarked
    setIsBookmarked(!isBookmarked)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/albums/${albumId}/bookmark`, {
        method: previousState ? 'DELETE' : 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (!data.success) {
        // Revert on error
        setIsBookmarked(previousState)
      }
    } catch {
      // Revert on error
      setIsBookmarked(previousState)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if not logged in
  if (!session) return null

  const iconSize = sizeMap[size]
  const padding = paddingMap[size]

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`
        ${padding}
        flex items-center gap-1.5
        border transition-all duration-150
        min-w-[44px] min-h-[44px]
        ${isBookmarked
          ? 'border-[--accent-primary] text-[--accent-primary] bg-[--accent-primary]/10'
          : 'border-[--muted-faint] text-[--muted] hover:border-[--accent-primary] hover:text-[--accent-primary]'
        }
        disabled:opacity-50
        ${className}
      `}
      title={isBookmarked ? 'Remove from saved' : 'Save for later'}
      aria-label={isBookmarked ? 'Remove from saved' : 'Save for later'}
    >
      {isBookmarked ? (
        <BookmarkFilledIcon size={iconSize} />
      ) : (
        <BookmarkIcon size={iconSize} />
      )}
      {showLabel && (
        <span className="text-xs uppercase tracking-wider font-medium">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}
