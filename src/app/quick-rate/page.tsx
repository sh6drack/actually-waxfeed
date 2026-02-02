"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { RatingSlider } from "@/components/rating-slider"
import { BookmarkButton } from "@/components/bookmark-button"
import { getCurrentTier, getProgressToNextTier, TASTEID_TIERS } from "@/lib/tasteid-tiers"

const BATCH_SIZE = 20

// ═══════════════════════════════════════════════════════════════════════════════
// CCX POLARITY MODEL v3.0 - Comprehensive Music Perception Descriptors
// ═══════════════════════════════════════════════════════════════════════════════
const POLARITY_DESCRIPTORS = [
  // AROUSAL/ENERGY
  { id: 'explosive', label: 'EXPLOSIVE', dimension: 'arousal', weight: 1.0, description: 'Maximum energy peaks, intense climaxes' },
  { id: 'driving', label: 'DRIVING', dimension: 'arousal', weight: 0.7, description: 'Relentless forward momentum, propulsive' },
  { id: 'simmering', label: 'SIMMERING', dimension: 'arousal', weight: 0.4, description: 'Tension building, controlled intensity' },
  { id: 'subdued', label: 'SUBDUED', dimension: 'arousal', weight: -0.8, description: 'Restrained energy, understated power' },

  // VALENCE/MOOD
  { id: 'euphoric', label: 'EUPHORIC', dimension: 'valence', weight: 1.0, description: 'Peak positive emotion, pure joy' },
  { id: 'triumphant', label: 'TRIUMPHANT', dimension: 'valence', weight: 0.8, description: 'Victory, overcoming, powerful uplift' },
  { id: 'melancholic', label: 'MELANCHOLIC', dimension: 'valence', weight: -0.6, description: 'Beautiful sadness, bittersweet' },
  { id: 'dark', label: 'DARK', dimension: 'valence', weight: -0.9, description: 'Heavy, ominous, intense negativity' },
  { id: 'anxious', label: 'ANXIOUS', dimension: 'valence', weight: -0.5, description: 'Unsettled, tense, uneasy' },

  // TEXTURE/DENSITY
  { id: 'lush', label: 'LUSH', dimension: 'texture', weight: 0.9, description: 'Rich harmonics, dense layering, full spectrum' },
  { id: 'sparse', label: 'SPARSE', dimension: 'texture', weight: -0.9, description: 'Minimal elements, negative space, breathing room' },
  { id: 'gritty', label: 'GRITTY', dimension: 'texture', weight: 0.7, description: 'Raw distortion, rough edges, lo-fi aesthetic' },
  { id: 'crystalline', label: 'CRYSTALLINE', dimension: 'texture', weight: 0.5, description: 'Pristine clarity, precise, sharp definition' },

  // TEMPORAL/RHYTHM
  { id: 'hypnotic', label: 'HYPNOTIC', dimension: 'temporal', weight: 0.8, description: 'Repetitive patterns, trance-inducing, meditative' },
  { id: 'chaotic', label: 'CHAOTIC', dimension: 'temporal', weight: 0.9, description: 'Unpredictable, complex polyrhythms, disorienting' },
  { id: 'groovy', label: 'GROOVY', dimension: 'temporal', weight: 0.7, description: 'Irresistible pocket, body-moving, danceable' },
  { id: 'floating', label: 'FLOATING', dimension: 'temporal', weight: -0.7, description: 'Ambient pulse, weightless, time-suspended' },

  // NOVELTY/EXPECTATION
  { id: 'avant_garde', label: 'AVANT-GARDE', dimension: 'novelty', weight: 1.0, description: 'Boundary-pushing, experimental, challenging' },
  { id: 'nostalgic', label: 'NOSTALGIC', dimension: 'novelty', weight: -0.6, description: 'Evokes past eras, familiar warmth, throwback' },
  { id: 'futuristic', label: 'FUTURISTIC', dimension: 'novelty', weight: 0.8, description: 'Forward-thinking sonics, ahead of its time' },
  { id: 'timeless', label: 'TIMELESS', dimension: 'novelty', weight: 0.0, description: 'Era-transcendent, classic quality' },

  // SCALE/INTIMACY
  { id: 'epic', label: 'EPIC', dimension: 'scale', weight: 1.0, description: 'Grand cinematic scope, massive, anthemic' },
  { id: 'intimate', label: 'INTIMATE', dimension: 'scale', weight: -0.9, description: 'Personal, vulnerable, close and confessional' },
  { id: 'visceral', label: 'VISCERAL', dimension: 'scale', weight: 0.8, description: 'Gut-punch physical impact, primal, bodily' },
  { id: 'ethereal', label: 'ETHEREAL', dimension: 'scale', weight: 0.6, description: 'Otherworldly, transcendent, dream-like' },

  // AUTHENTICITY
  { id: 'raw', label: 'RAW', dimension: 'authenticity', weight: 0.9, description: 'Unpolished, genuine, authentic expression' },
  { id: 'polished', label: 'POLISHED', dimension: 'authenticity', weight: -0.7, description: 'Refined, perfected, radio-ready' },
  { id: 'soulful', label: 'SOULFUL', dimension: 'authenticity', weight: 0.8, description: 'Deep feeling, emotional truth, heart' },

  // NARRATIVE
  { id: 'cinematic', label: 'CINEMATIC', dimension: 'narrative', weight: 0.9, description: 'Visual, story-driven, scene-setting' },
  { id: 'abstract', label: 'ABSTRACT', dimension: 'narrative', weight: 0.7, description: 'Non-representational, pure sound, conceptual' },
  { id: 'confessional', label: 'CONFESSIONAL', dimension: 'narrative', weight: 0.6, description: 'Personal storytelling, diary-like, revealing' },
] as const

type DescriptorId = typeof POLARITY_DESCRIPTORS[number]['id']
type Descriptor = typeof POLARITY_DESCRIPTORS[number]

const MIN_DESCRIPTORS = 0
const MAX_DESCRIPTORS = 5
const TASTEID_UNLOCK = 20

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface Track {
  id: string
  name: string
  trackNumber: number
  previewUrl: string | null
  durationMs: number
  waveform?: number[] | null
}

interface Album {
  id: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge: string | null
  genres: string[]
  tracks?: Track[]
}

export default function QuickRatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [albums, setAlbums] = useState<Album[]>([])
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [rating, setRating] = useState(5)
  const [selectedDescriptors, setSelectedDescriptors] = useState<DescriptorId[]>([])
  const [shuffledDescriptors, setShuffledDescriptors] = useState<readonly Descriptor[]>(() => shuffleArray([...POLARITY_DESCRIPTORS]))
  const [ratedCount, setRatedCount] = useState<number | null>(null)
  const [skippedCount, setSkippedCount] = useState(0)
  const [sessionRatedCount, setSessionRatedCount] = useState(0)
  const [history, setHistory] = useState<Array<{ albumIndex: number; rating: number; descriptors: DescriptorId[] }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [error, setError] = useState("")
  const [showCompletion, setShowCompletion] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [albumTracks, setAlbumTracks] = useState<Track[]>([])
  const [, setLoadingTracks] = useState(false)
  const [milestoneReached, setMilestoneReached] = useState<typeof TASTEID_TIERS[0] | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const actualRatedCount = ratedCount ?? 0
  const isStatsLoaded = ratedCount !== null

  const playTrack = (track: Track) => {
    if (!track.previewUrl) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingTrackId === track.id) {
      setPlayingTrackId(null)
      return
    }

    const audio = new Audio(track.previewUrl)
    audioRef.current = audio
    setPlayingTrackId(track.id)

    audio.play().catch(() => setPlayingTrackId(null))

    setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause()
        setPlayingTrackId(null)
      }
    }, 15000)

    audio.onended = () => {
      if (audioRef.current === audio) {
        setPlayingTrackId(null)
      }
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingTrackId(null)
  }

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
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/quick-rate")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchAlbums()
      fetchUserStats()
    }
  }, [status, session])

  const currentAlbumId = albums[currentAlbumIndex]?.id
  useEffect(() => {
    if (currentAlbumId) {
      setAlbumTracks([])
      setLoadingTracks(true)
      fetch(`/api/albums/${currentAlbumId}/tracks`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setAlbumTracks(data.data)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTracks(false))
    }
  }, [currentAlbumId])

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.data) {
        setRatedCount(data.data._count?.reviews ?? 0)
      } else {
        setRatedCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err)
      setRatedCount(0)
    }
  }

  const fetchAlbums = async () => {
    setLoadingAlbums(true)
    try {
      const res = await fetch(`/api/albums/swipe?limit=${BATCH_SIZE * 2}`, { credentials: 'include' })
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
        credentials: 'include',
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
        const oldCount = ratedCount ?? 0
        const newCount = oldCount + 1
        setRatedCount(newCount)
        setSessionRatedCount((prev) => prev + 1)

        const oldTier = getCurrentTier(oldCount)
        const newTier = getCurrentTier(newCount)

        if (newTier.id !== oldTier.id && newTier.minRatings > 0) {
          setMilestoneReached(newTier)
          setTimeout(() => setMilestoneReached(null), 4000)
        } else if (newCount === TASTEID_UNLOCK) {
          setShowCompletion(true)
          setTimeout(() => setShowCompletion(false), 3000)
        }

        if (newCount >= TASTEID_UNLOCK && newCount % 5 === 0) {
          fetch('/api/tasteid/compute', { method: 'POST', credentials: 'include' })
            .then(res => res.json())
            .then(data => console.log('[TasteID] Background recompute:', data?.data?.tasteId?.primaryArchetype))
            .catch(() => {})
        }

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

  const nextAlbum = (saveToHistory = true) => {
    stopAudio()

    if (saveToHistory && albums[currentAlbumIndex]) {
      setHistory(prev => [...prev, {
        albumIndex: currentAlbumIndex,
        rating,
        descriptors: selectedDescriptors
      }])
    }

    setRating(5)
    setSelectedDescriptors([])
    setShuffledDescriptors(shuffleArray([...POLARITY_DESCRIPTORS]))
    setError("")
    setCurrentAlbumIndex((prev) => prev + 1)

    if (currentAlbumIndex >= albums.length - 5) {
      fetchAlbums()
    }
  }

  const goBack = () => {
    if (history.length === 0) return

    stopAudio()
    const lastState = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setCurrentAlbumIndex(lastState.albumIndex)
    setRating(lastState.rating)
    setSelectedDescriptors(lastState.descriptors)
    setError("")
  }

  const canGoBack = history.length > 0

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
      if ((e.key === 'b' || e.key === 'B' || e.key === 'Backspace') && canGoBack) {
        e.preventDefault()
        goBack()
      }
    },
    [submitRating, skip, goBack, submitting, canSubmit, canGoBack]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border border-[#333] rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-t border-[#ffd700] rounded-full animate-spin" />
          </div>
          <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-600 font-light">Loading</span>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentAlbumIndex]
  const isUnlocked = actualRatedCount >= TASTEID_UNLOCK
  const remaining = Math.max(0, TASTEID_UNLOCK - actualRatedCount)
  const coverUrl = currentAlbum?.coverArtUrlLarge || currentAlbum?.coverArtUrl

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Ambient Background Glow */}
      {coverUrl && (
        <div
          className="fixed inset-0 opacity-20 blur-[120px] scale-150 pointer-events-none"
          style={{
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - Floating */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {canGoBack && (
              <button
                onClick={goBack}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xs tracking-[0.3em] uppercase text-white/50 font-light">Quick Rate</h1>
              {isStatsLoaded && (
                <p className="text-[10px] text-white/30 mt-0.5">
                  {isUnlocked ? (
                    <span className="text-emerald-400">TasteID Active</span>
                  ) : (
                    <span>{remaining} to unlock</span>
                  )}
                  {sessionRatedCount > 0 && <span className="text-[#ffd700] ml-2">+{sessionRatedCount} this session</span>}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* TasteID Unlocked Toast */}
      {showCompletion && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500">
          <div className="bg-emerald-500/10 border border-emerald-500/50 backdrop-blur-xl rounded-2xl px-8 py-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-400">TasteID Unlocked</h3>
              <p className="text-xs text-white/50">Keep rating to refine your profile</p>
            </div>
          </div>
        </div>
      )}

      {/* Tier Milestone Celebration */}
      {milestoneReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-300">
          <div className="text-center p-12 max-w-lg animate-in zoom-in-95 duration-500">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-black text-black"
              style={{ backgroundColor: milestoneReached.color }}
            >
              {milestoneReached.shortName}
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">Tier Unlocked</p>
            <h2 className="text-4xl font-black mb-3" style={{ color: milestoneReached.color }}>
              {milestoneReached.name}
            </h2>
            <p className="text-white/50 mb-8">{milestoneReached.description}</p>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 mb-8">
              <span className="text-white/40 text-xs uppercase tracking-wider">Max Accuracy</span>
              <span className="font-bold text-lg" style={{ color: milestoneReached.color }}>
                {milestoneReached.maxConfidence}%
              </span>
            </div>
            <div className="space-y-2 mb-10">
              {milestoneReached.perks.map((perk, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-sm text-white/60">
                  <svg className="w-4 h-4" style={{ color: milestoneReached.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setMilestoneReached(null)}
              className="px-10 py-4 rounded-full font-semibold uppercase tracking-wider text-sm transition-transform hover:scale-105"
              style={{ backgroundColor: milestoneReached.color, color: '#000' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loadingAlbums && albums.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border border-white/10 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-20 h-20 border-t border-[#ffd700] rounded-full animate-spin" />
          </div>
          <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-600">Loading albums</span>
        </div>
      ) : currentAlbum ? (
        <>
          {/* MOBILE LAYOUT */}
          <div className="md:hidden min-h-screen flex flex-col pt-20 pb-4">
            {/* Album Hero */}
            <div className="px-6 mb-4">
              <div className="relative aspect-square max-w-[280px] mx-auto">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={currentAlbum.title}
                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Album Info */}
            <div className="px-6 text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-1">
                <h2 className="text-xl font-semibold tracking-tight line-clamp-1">{currentAlbum.title}</h2>
                <BookmarkButton albumId={currentAlbum.id} size="sm" />
              </div>
              <p className="text-white/50 text-sm">{currentAlbum.artistName}</p>
              {currentAlbum.genres?.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  {currentAlbum.genres.slice(0, 2).map((genre) => (
                    <span key={genre} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase tracking-wider">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tracklist - Horizontal */}
            {albumTracks.length > 0 && (
              <div className="px-4 mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {albumTracks.map((track) => {
                    const isPlaying = playingTrackId === track.id
                    return (
                      <button
                        key={track.id}
                        onClick={() => playTrack(track)}
                        disabled={!track.previewUrl}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all ${
                          isPlaying
                            ? 'bg-[#ffd700]/20 border border-[#ffd700]/50'
                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                        } ${!track.previewUrl ? 'opacity-30' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isPlaying ? (
                            <PauseIcon className="w-3 h-3 text-[#ffd700]" />
                          ) : (
                            <PlayIcon className="w-3 h-3 text-white/40" />
                          )}
                          <span className={`text-[10px] font-mono ${isPlaying ? 'text-[#ffd700]' : 'text-white/40'}`}>
                            {track.trackNumber.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className={`block text-[10px] max-w-[70px] truncate mt-0.5 ${isPlaying ? 'text-[#ffd700]' : 'text-white/70'}`}>
                          {track.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Vibes */}
            <div className="px-4 mb-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Vibes</span>
                <span className={`text-[10px] font-mono ${selectedDescriptors.length > 0 ? 'text-[#ffd700]' : 'text-white/20'}`}>
                  {selectedDescriptors.length}/5
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shuffledDescriptors.slice(0, 12).map((descriptor) => {
                  const isSelected = selectedDescriptors.includes(descriptor.id)
                  const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                  return (
                    <button
                      key={descriptor.id}
                      onClick={() => toggleDescriptor(descriptor.id)}
                      disabled={submitting || atMax}
                      className={`text-[9px] px-2.5 py-1.5 rounded-full uppercase tracking-wide transition-all ${
                        isSelected
                          ? 'bg-[#ffd700] text-black font-semibold'
                          : atMax
                            ? 'bg-white/5 text-white/20'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                      }`}
                    >
                      {descriptor.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rating */}
            <div className="px-6 py-4 border-t border-white/5">
              <RatingSlider value={rating} onChange={setRating} disabled={submitting} />
            </div>

            {/* Actions */}
            <div className="px-6 pb-2">
              {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={skip}
                  disabled={submitting}
                  className="w-20 py-3.5 rounded-full border border-white/10 text-white/40 font-medium text-xs uppercase tracking-wider hover:border-white/30 hover:text-white/70 transition-all disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={submitRating}
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-full bg-[#ffd700] text-black font-semibold text-sm uppercase tracking-wider hover:bg-[#ffe44d] transition-all disabled:opacity-50 hover:scale-[1.02]"
                >
                  {submitting ? '...' : 'Rate'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {isStatsLoaded && (
              <div className="px-6 pt-4">
                <TierProgressBar ratingCount={actualRatedCount} />
              </div>
            )}
          </div>

          {/* DESKTOP LAYOUT - Cinematic Split */}
          <div className="hidden md:flex min-h-screen">
            {/* LEFT - Album Art Hero */}
            <div className="w-1/2 lg:w-[55%] relative flex items-center justify-center p-12">
              <div className="relative max-w-[500px] w-full">
                {coverUrl ? (
                  <>
                    {/* Shadow underneath */}
                    <div
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-16 blur-2xl opacity-50 rounded-full"
                      style={{
                        background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))`,
                      }}
                    />
                    <img
                      src={coverUrl}
                      alt={currentAlbum.title}
                      className="w-full aspect-square object-cover rounded-lg shadow-2xl relative z-10"
                    />
                  </>
                ) : (
                  <div className="w-full aspect-square bg-neutral-900 rounded-lg flex items-center justify-center">
                    <svg className="w-24 h-24 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}

                {/* Album Info Overlay */}
                <div className="absolute -bottom-4 left-0 right-0 z-20 text-center">
                  <div className="inline-flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
                    <span className="text-sm font-medium truncate max-w-[200px]">{currentAlbum.title}</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-sm text-white/50 truncate max-w-[150px]">{currentAlbum.artistName}</span>
                    <BookmarkButton albumId={currentAlbum.id} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Controls Panel */}
            <div className="w-1/2 lg:w-[45%] flex flex-col justify-center p-8 lg:p-12 relative">
              {/* Vertical Line Accent */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-[60%] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

              <div className="max-w-md mx-auto w-full">
                {/* Genres */}
                {currentAlbum.genres?.length > 0 && (
                  <div className="flex items-center gap-2 mb-8">
                    {currentAlbum.genres.slice(0, 3).map((genre) => (
                      <span key={genre} className="text-[10px] px-3 py-1 rounded-full bg-white/5 text-white/40 uppercase tracking-wider">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tracklist with Waveforms */}
                {albumTracks.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Tracks</span>
                      <div className="flex items-center gap-3">
                        {albumTracks.some(t => t.waveform) && (
                          <span className="text-[9px] text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Spotify
                          </span>
                        )}
                        <span className="text-[10px] text-white/30">{albumTracks.length} tracks</span>
                      </div>
                    </div>
                    <div className="space-y-0.5 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                      {albumTracks.map((track) => {
                        const isPlaying = playingTrackId === track.id
                        return (
                          <button
                            key={track.id}
                            onClick={() => playTrack(track)}
                            disabled={!track.previewUrl}
                            className={`w-full px-3 py-2 flex items-center gap-3 rounded-lg transition-all group ${
                              isPlaying ? 'bg-[#ffd700]/10' : 'hover:bg-white/5'
                            } ${!track.previewUrl ? 'opacity-30' : ''}`}
                          >
                            <div className="w-5 flex items-center justify-center">
                              {isPlaying ? (
                                <PauseIcon className="w-3.5 h-3.5 text-[#ffd700]" />
                              ) : (
                                <span className="text-[10px] font-mono text-white/30 group-hover:hidden">
                                  {track.trackNumber.toString().padStart(2, '0')}
                                </span>
                              )}
                              {!isPlaying && track.previewUrl && (
                                <PlayIcon className="w-3.5 h-3.5 text-white/50 hidden group-hover:block" />
                              )}
                            </div>
                            <span className={`w-24 lg:w-32 text-xs truncate text-left ${isPlaying ? 'text-[#ffd700]' : 'text-white/70'}`}>
                              {track.name}
                            </span>
                            <TrackWaveform trackId={track.id} isPlaying={isPlaying} waveform={track.waveform} />
                            <span className="text-[10px] text-white/30 tabular-nums ml-auto">
                              {Math.floor(track.durationMs / 60000)}:{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0')}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Vibes Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Vibes</span>
                    <span className={`text-[10px] font-mono ${selectedDescriptors.length > 0 ? 'text-[#ffd700]' : 'text-white/20'}`}>
                      {selectedDescriptors.length}/5
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {shuffledDescriptors.slice(0, 18).map((descriptor) => {
                      const isSelected = selectedDescriptors.includes(descriptor.id)
                      const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                      return (
                        <button
                          key={descriptor.id}
                          onClick={() => toggleDescriptor(descriptor.id)}
                          disabled={submitting || atMax}
                          title={descriptor.description}
                          className={`text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wide transition-all ${
                            isSelected
                              ? 'bg-[#ffd700] text-black font-semibold scale-105'
                              : atMax
                                ? 'bg-white/5 text-white/15 cursor-not-allowed'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 hover:scale-105'
                          }`}
                        >
                          {descriptor.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Rating Slider */}
                <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <RatingSlider value={rating} onChange={setRating} disabled={submitting} />
                </div>

                {/* Actions */}
                {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={skip}
                    disabled={submitting}
                    className="w-24 py-4 rounded-full border border-white/10 text-white/40 font-medium text-xs uppercase tracking-wider hover:border-white/30 hover:text-white/70 transition-all disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={submitting}
                    className="flex-1 py-4 rounded-full bg-[#ffd700] text-black font-semibold text-sm uppercase tracking-wider hover:bg-[#ffe44d] transition-all disabled:opacity-50 hover:scale-[1.01]"
                  >
                    {submitting ? '...' : 'Rate Album'}
                  </button>
                </div>

                {/* Tier Progress */}
                {isStatsLoaded && <TierProgressBar ratingCount={actualRatedCount} />}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-white/50 mb-6">No more albums available</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 rounded-full bg-[#ffd700] text-black font-semibold hover:bg-[#ffe44d] transition-all"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Floating Pause Control */}
      {playingTrackId && (
        <div className="fixed bottom-6 left-6 z-40 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={stopAudio}
            className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#ffd700]/20 backdrop-blur-xl border border-[#ffd700]/30 hover:bg-[#ffd700]/30 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-[#ffd700] flex items-center justify-center group-hover:scale-110 transition-transform">
              <PauseIcon className="w-4 h-4 text-black" />
            </div>
            <div className="pr-2">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">Now Playing</span>
              <span className="text-xs text-[#ffd700] font-medium truncate max-w-[120px] block">
                {albumTracks.find(t => t.id === playingTrackId)?.name || 'Track'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Quick link after session */}
      {sessionRatedCount >= 10 && !playingTrackId && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => router.push('/tasteid/me')}
            className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[#ffd700] text-xs hover:bg-white/20 transition-all"
          >
            View TasteID →
          </button>
        </div>
      )}
    </div>
  )
}

// Play Icon
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

// Pause Icon
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

// Track Waveform
function TrackWaveform({ trackId, isPlaying, waveform }: { trackId: string; isPlaying: boolean; waveform?: number[] | null }) {
  const bars = waveform && waveform.length === 40
    ? waveform
    : Array.from({ length: 40 }, (_, i) => {
        const hash = trackId.split('').reduce((a, c, idx) => a + c.charCodeAt(0) * (idx + 1 + i), 0)
        return 0.2 + (hash % 80) / 100
      })

  const hasRealWaveform = waveform && waveform.length === 40

  return (
    <div className="flex items-center gap-[1px] h-5 flex-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[1.5px] rounded-full transition-colors ${
            isPlaying
              ? 'bg-[#ffd700]'
              : hasRealWaveform
                ? 'bg-cyan-400/50'
                : 'bg-white/20'
          }`}
          style={{
            height: `${height * 100}%`,
            opacity: isPlaying ? 1 : hasRealWaveform ? 0.7 : 0.4,
            animation: isPlaying ? `waveform 0.5s ease-in-out infinite ${i * 0.02}s` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// Tier Progress Bar
function TierProgressBar({ ratingCount }: { ratingCount: number }) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const tiers = TASTEID_TIERS.slice(1)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full font-semibold text-black uppercase tracking-wide"
            style={{ backgroundColor: currentTier.color }}
          >
            {currentTier.shortName || currentTier.name}
          </span>
          <span className="text-white/30">{currentTier.maxConfidence}% accuracy</span>
        </div>
        {nextTier && (
          <span className="text-white/40">
            {ratingsToNext} to <span style={{ color: nextTier.color }}>{nextTier.shortName || nextTier.name}</span>
          </span>
        )}
      </div>
      <div className="flex gap-0.5 rounded-full overflow-hidden bg-white/5 p-0.5">
        {tiers.map((tier) => {
          const isCompleted = ratingCount >= tier.minRatings
          const isCurrent = tier.id === currentTier.id
          let fillPercent = isCompleted && !isCurrent ? 100 : isCurrent ? progress : 0

          return (
            <div key={tier.id} className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden" title={tier.name}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${fillPercent}%`, backgroundColor: tier.color }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
