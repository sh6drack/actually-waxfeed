"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { RatingSlider } from "@/components/rating-slider"

const BATCH_SIZE = 20

interface Album {
  id: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge: string | null
  genres: string[]
}

export default function QuickRatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [albums, setAlbums] = useState<Album[]>([])
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [rating, setRating] = useState(5)
  const [ratedCount, setRatedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [sessionRatedCount, setSessionRatedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/quick-rate")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAlbums()
      fetchUserStats()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/users/me')
      const data = await res.json()
      if (data.success) {
        setRatedCount(data.data._count?.reviews || 0)
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err)
    }
  }

  const fetchAlbums = async () => {
    setLoadingAlbums(true)
    try {
      const res = await fetch(`/api/albums/swipe?limit=${BATCH_SIZE * 2}`)
      const data = await res.json()
      if (data.success) {
        setAlbums(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err)
      setError('Failed to load albums')
    }
    setLoadingAlbums(false)
  }

  const submitRating = async () => {
    if (currentAlbumIndex >= albums.length) return

    const album = albums[currentAlbumIndex]
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: album.id,
          rating,
          text: '',
          isQuickRate: true,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setRatedCount((prev) => prev + 1)
        setSessionRatedCount((prev) => prev + 1)
        nextAlbum()
      } else {
        if (data.error?.includes('already reviewed')) {
          nextAlbum()
        } else {
          setError(data.error || 'Failed to submit rating')
        }
      }
    } catch (err) {
      console.error('Failed to submit rating:', err)
      setError('Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const skip = () => {
    setSkippedCount((prev) => prev + 1)
    nextAlbum()
  }

  const nextAlbum = () => {
    setRating(5)
    setError("")
    setCurrentAlbumIndex((prev) => prev + 1)

    // Load more albums if running low
    if (currentAlbumIndex >= albums.length - 5) {
      fetchAlbums()
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (submitting) return
      if (e.key === 'Enter') {
        e.preventDefault()
        submitRating()
      }
      if (e.key === 's' || e.key === 'S') {
        skip()
      }
    },
    [submitRating, skip, submitting]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#333] border-t-[#ffd700] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[#888]">Loading</span>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentAlbumIndex]
  const progress = Math.min(100, (ratedCount / 20) * 100)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tighter">Quick Rate</h1>
            <button
              onClick={() => router.push('/')}
              className="text-[#888] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-[#888]">
            Build your TasteID by rating albums. Skip anything you haven't heard.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 p-4 border border-[#333] bg-[#111]">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-4 text-sm">
              <span className="text-[#888]">
                <span className="text-white font-bold">{ratedCount}</span> total ratings
              </span>
              {sessionRatedCount > 0 && (
                <span className="text-[#ffd700]">
                  +{sessionRatedCount} this session
                </span>
              )}
              {skippedCount > 0 && (
                <span className="text-[#666]">
                  {skippedCount} skipped
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-[#888] mb-1">
              <span>TasteID Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ffd700] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loadingAlbums && albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#333] border-t-[#ffd700] animate-spin mb-4" />
            <span className="text-xs tracking-[0.2em] uppercase text-[#888]">Loading albums</span>
          </div>
        ) : currentAlbum ? (
          <div className="space-y-6">
            {/* Album Card */}
            <div className="border border-[#333] overflow-hidden">
              <div className="aspect-square relative">
                {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                  <img
                    src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                    alt={currentAlbum.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#111] flex items-center justify-center">
                    <svg className="w-20 h-20 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-1">{currentAlbum.title}</h2>
                <p className="text-[#888] text-lg mb-4">{currentAlbum.artistName}</p>
                {currentAlbum.genres && currentAlbum.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentAlbum.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="text-[10px] px-2 py-1 border border-[#333] text-[#666] uppercase tracking-wider"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
              <RatingSlider value={rating} onChange={setRating} disabled={submitting} />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={skip}
                  disabled={submitting}
                  className="flex-1 py-4 border border-[#333] text-[#888] font-bold uppercase tracking-wider hover:border-white hover:text-white transition-colors disabled:opacity-50"
                >
                  Haven't Heard
                </button>
                <button
                  onClick={submitRating}
                  disabled={submitting}
                  className="flex-1 py-4 bg-[#ffd700] text-black font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Rate'}
                </button>
              </div>

              <p className="text-center text-xs text-[#666]">
                <kbd className="px-1.5 py-0.5 border border-[#333] text-[10px]">Enter</kbd> to rate · <kbd className="px-1.5 py-0.5 border border-[#333] text-[10px]">S</kbd> to skip
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#888] mb-4">No more albums available right now.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#ffd700] text-black px-8 py-4 font-bold text-lg hover:bg-[#ffed4a] transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Quick navigation */}
        {sessionRatedCount >= 10 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#888] mb-3">
              You've rated {sessionRatedCount} albums this session! 🎉
            </p>
            <button
              onClick={() => router.push('/tasteid/me')}
              className="text-[#ffd700] text-sm hover:underline"
            >
              View Your TasteID →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
