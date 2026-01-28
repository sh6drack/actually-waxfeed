'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RatingSlider } from '@/components/rating-slider'

// Polarity descriptors for TasteID
const POLARITY_DESCRIPTORS = [
  { id: 'explosive', label: 'EXPLOSIVE' },
  { id: 'driving', label: 'DRIVING' },
  { id: 'simmering', label: 'SIMMERING' },
  { id: 'subdued', label: 'SUBDUED' },
  { id: 'euphoric', label: 'EUPHORIC' },
  { id: 'triumphant', label: 'TRIUMPHANT' },
  { id: 'melancholic', label: 'MELANCHOLIC' },
  { id: 'dark', label: 'DARK' },
  { id: 'anxious', label: 'ANXIOUS' },
  { id: 'lush', label: 'LUSH' },
  { id: 'sparse', label: 'SPARSE' },
  { id: 'gritty', label: 'GRITTY' },
  { id: 'crystalline', label: 'CRYSTALLINE' },
  { id: 'hypnotic', label: 'HYPNOTIC' },
  { id: 'chaotic', label: 'CHAOTIC' },
  { id: 'groovy', label: 'GROOVY' },
  { id: 'floating', label: 'FLOATING' },
  { id: 'avant_garde', label: 'AVANT-GARDE' },
  { id: 'nostalgic', label: 'NOSTALGIC' },
  { id: 'futuristic', label: 'FUTURISTIC' },
  { id: 'timeless', label: 'TIMELESS' },
  { id: 'epic', label: 'EPIC' },
  { id: 'intimate', label: 'INTIMATE' },
  { id: 'visceral', label: 'VISCERAL' },
  { id: 'ethereal', label: 'ETHEREAL' },
  { id: 'raw', label: 'RAW' },
  { id: 'polished', label: 'POLISHED' },
  { id: 'soulful', label: 'SOULFUL' },
  { id: 'cinematic', label: 'CINEMATIC' },
  { id: 'abstract', label: 'ABSTRACT' },
  { id: 'confessional', label: 'CONFESSIONAL' },
] as const

type DescriptorId = typeof POLARITY_DESCRIPTORS[number]['id']

const MIN_DESCRIPTORS = 3
const MAX_DESCRIPTORS = 5

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface Album {
  id: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge: string | null
  releaseDate: string | null
  genres: string[]
}

export default function QuickRatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [ratedCount, setRatedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedDescriptors, setSelectedDescriptors] = useState<DescriptorId[]>([])
  const [shuffledDescriptors, setShuffledDescriptors] = useState(() => shuffleArray([...POLARITY_DESCRIPTORS]))

  const toggleDescriptor = (id: DescriptorId) => {
    setSelectedDescriptors(prev => {
      if (prev.includes(id)) {
        return prev.filter(d => d !== id)
      }
      if (prev.length >= MAX_DESCRIPTORS) {
        return prev
      }
      return [...prev, id]
    })
  }

  const canSubmit = selectedDescriptors.length >= MIN_DESCRIPTORS

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/discover/swipe')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchAlbums()
    }
  }, [session])

  const fetchAlbums = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/albums/swipe?limit=20')
      const data = await res.json()
      if (data.success) {
        setAlbums(data.data || [])
        setCurrentIndex(0)
      } else {
        setError(data.error || 'Failed to load albums')
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err)
      setError('Failed to load albums')
    } finally {
      setLoading(false)
    }
  }

  const submitRating = async () => {
    if (currentIndex >= albums.length) return

    const album = albums[currentIndex]
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: album.id,
          rating,
          text: '',
          isQuickRate: true,
          vibes: selectedDescriptors,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setRatedCount((prev) => prev + 1)
        nextAlbum()
      } else {
        setError(data.error || 'Failed to submit rating')
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
    setRating(5) // Reset rating for next album
    setSelectedDescriptors([])
    setShuffledDescriptors(shuffleArray([...POLARITY_DESCRIPTORS]))
    setError(null)
    setCurrentIndex((prev) => prev + 1)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (submitting) return
      if (e.key === 'Enter' && canSubmit) {
        e.preventDefault()
        submitRating()
      }
      if (e.key === 's' || e.key === 'S') {
        skip()
      }
    },
    [submitRating, skip, submitting, canSubmit]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[--muted] border-t-[var(--accent-primary)] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading albums</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const currentAlbum = albums[currentIndex]
  const isFinished = currentIndex >= albums.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-4 flex items-center justify-between">
          <Link
            href="/discover"
            className="text-[--muted] hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs tracking-[0.15em] uppercase">Back</span>
          </Link>
          <div className="text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)]">Quick Rate</p>
            <p className="text-xs text-[--muted]">Train your taste profile</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{ratedCount}</p>
            <p className="text-[10px] text-[--muted] uppercase">rated</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 lg:px-12 xl:px-20 py-8">
        {isFinished ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-[var(--accent-primary)]">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Session Complete</h2>
            <p className="text-[--muted] mb-2">You rated</p>
            <p className="text-5xl font-bold text-[var(--accent-primary)] mb-2 tabular-nums">{ratedCount}</p>
            <p className="text-[--muted] mb-1">albums</p>
            {skippedCount > 0 && (
              <p className="text-sm text-[--muted] mb-8">({skippedCount} skipped)</p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={() => {
                  setRatedCount(0)
                  setSkippedCount(0)
                  fetchAlbums()
                }}
                className="px-6 py-3 bg-[var(--accent-primary)] text-black font-bold text-sm tracking-wide uppercase hover:bg-[var(--accent-hover)] transition-colors"
              >
                Keep Going
              </button>
              <Link
                href="/discover/connections"
                className="px-6 py-3 border border-[--border] font-medium text-sm tracking-wide uppercase hover:border-white transition-colors"
              >
                Check Connections
              </Link>
            </div>
          </div>
        ) : currentAlbum ? (
          <div className="space-y-8">
            {/* Album Card */}
            <div className="border border-[--border]">
              <div className="aspect-square relative overflow-hidden">
                {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                  <img
                    src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                    alt={currentAlbum.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[--muted]/10 flex items-center justify-center">
                    <svg className="w-20 h-20 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-1">{currentAlbum.title}</h2>
                <p className="text-[--muted] mb-4">{currentAlbum.artistName}</p>
                {currentAlbum.genres && currentAlbum.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentAlbum.genres.slice(0, 4).map((genre) => (
                      <span
                        key={genre}
                        className="text-[10px] px-2 py-1 border border-[--border] text-[--muted] uppercase tracking-wider"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Descriptors Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[--muted] uppercase tracking-wider">
                  Describe this album{' '}
                  <span className={selectedDescriptors.length >= MIN_DESCRIPTORS ? 'text-[var(--accent-primary)]' : 'text-[#ff6b6b]'}>
                    ({selectedDescriptors.length}/{MIN_DESCRIPTORS} required)
                  </span>
                </p>
                {selectedDescriptors.length < MIN_DESCRIPTORS && (
                  <span className="text-[10px] text-[#ff6b6b] animate-pulse">
                    Pick {MIN_DESCRIPTORS - selectedDescriptors.length} more
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shuffledDescriptors.map((descriptor) => {
                  const isSelected = selectedDescriptors.includes(descriptor.id)
                  const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                  return (
                    <button
                      key={descriptor.id}
                      onClick={() => toggleDescriptor(descriptor.id)}
                      disabled={submitting || atMax}
                      className={`text-[9px] px-2 py-1.5 min-h-[32px] uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)] font-bold'
                          : atMax
                            ? 'border border-[--border] text-[--muted]/40 cursor-not-allowed'
                            : 'border border-[--border] text-[--muted] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                      }`}
                    >
                      {descriptor.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rating Section */}
            <div className="space-y-6">
              <RatingSlider value={rating} onChange={setRating} disabled={submitting} />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={skip}
                  disabled={submitting}
                  className="flex-1 py-4 min-h-[48px] border border-[--border] text-[--muted] font-medium text-sm tracking-wide uppercase hover:border-white hover:text-white transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={submitRating}
                  disabled={submitting || !canSubmit}
                  className={`flex-1 py-4 min-h-[48px] font-bold text-sm tracking-wide uppercase transition-colors disabled:opacity-50 ${
                    canSubmit
                      ? 'bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-hover)]'
                      : 'bg-[--border] text-[--muted] cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Saving...' : !canSubmit ? `+${MIN_DESCRIPTORS - selectedDescriptors.length} vibes` : 'Rate'}
                </button>
              </div>

              <p className="text-center text-xs text-[--muted]">
                {canSubmit && <><kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">Enter</kbd> to rate · </>}
                <kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">S</kbd> to skip
              </p>
            </div>

            {/* Progress */}
            <div className="pt-4 border-t border-[--border]">
              <div className="flex items-center justify-between text-xs text-[--muted] mb-2">
                <span>{currentIndex + 1} of {albums.length}</span>
                <span>{ratedCount} rated · {skippedCount} skipped</span>
              </div>
              <div className="w-full h-1 bg-[--border] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / albums.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📀</div>
            <p className="text-[--muted] mb-4">No more albums to rate right now.</p>
            <button
              onClick={fetchAlbums}
              className="px-6 py-3 border border-[--border] text-sm hover:border-white transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
