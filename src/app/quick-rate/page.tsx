"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { RatingSlider } from "@/components/rating-slider"
import { BookmarkButton } from "@/components/bookmark-button"
import { getCurrentTier, getProgressToNextTier, TASTEID_TIERS } from "@/lib/tasteid-tiers"

const BATCH_SIZE = 20

// Prediction system types
interface PredictionData {
  hasPrediction: boolean
  prediction?: {
    rating: number
    ratingRange: { min: number; max: number }
    confidence: number
    suggestedVibes: string[]
    reasoning: string[]
  }
  albumAudio?: {
    energy: number
    valence: number
    danceability: number
    acousticness: number
    tempo: number
  }
  userStats?: {
    currentStreak: number
    decipherProgress: number
    totalPredictions: number
  }
}

interface PredictionResult {
  result: {
    match: boolean
    surprise: boolean
    perfect: boolean
    vibeMatches: number
    difference: number
    matchQuality: 'perfect' | 'close' | 'match' | 'miss' | 'surprise'
  }
  streakUpdate: {
    newStreak: number
    streakMessage: string | null
    isNewMilestone: boolean
  }
  decipherUpdate: {
    newProgress: number
    decipherMessage: string | null
  }
  celebration: {
    type: 'predicted' | 'surprise' | 'perfect' | 'close' | 'miss'
    message: string
  } | null
  // For showing comparison in celebration
  predictedRating?: number
  actualRating?: number
  // First prediction indicator
  isFirstPrediction?: boolean
}

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
  const [reviewText, setReviewText] = useState("")
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

  // Prediction system state
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [showPredictionCelebration, setShowPredictionCelebration] = useState(false)
  const [audioDNA, setAudioDNA] = useState<{
    decipherProgress: number
    currentStreak: number
    totalPredictions: number
  } | null>(null)

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
      setPredictionData(null)
      setPredictionResult(null)
      setShowPredictionCelebration(false)

      // Fetch tracks with audio features
      fetch(`/api/albums/${currentAlbumId}/tracks?includeAudioFeatures=true`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.tracks) {
            setAlbumTracks(data.data.tracks)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTracks(false))

      // Fetch prediction for this album
      fetch('/api/audio/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ albumId: currentAlbumId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setPredictionData(data.data)
            if (data.data.userStats) {
              setAudioDNA({
                decipherProgress: data.data.userStats.decipherProgress,
                currentStreak: data.data.userStats.currentStreak,
                totalPredictions: data.data.userStats.totalPredictions,
              })
            }
          }
        })
        .catch(() => {})
    }
  }, [currentAlbumId])

  // Fetch Audio DNA on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/audio-dna/compute', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.audioDNA) {
            setAudioDNA({
              decipherProgress: data.data.audioDNA.decipherProgress,
              currentStreak: data.data.audioDNA.currentStreak,
              totalPredictions: data.data.audioDNA.totalPredictions,
            })
          }
        })
        .catch(() => {})
    }
  }, [status])

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
          text: reviewText.trim() || '',
          isQuickRate: !reviewText.trim(),
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

        // Record prediction result if we had one
        if (predictionData?.hasPrediction && predictionData.prediction) {
          fetch('/api/audio/predict', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              albumId: album.id,
              predictedRating: predictionData.prediction.rating,
              actualRating: rating,
              predictedVibes: predictionData.prediction.suggestedVibes,
              actualVibes: selectedDescriptors,
              confidenceLevel: predictionData.prediction.confidence / 100,
            }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data) {
                // Check if this is the user's first prediction
                const isFirstPrediction = audioDNA?.totalPredictions === 0
                // Add predicted and actual ratings for display in celebration
                setPredictionResult({
                  ...data.data,
                  predictedRating: predictionData.prediction?.rating,
                  actualRating: rating,
                  isFirstPrediction,
                })
                // Update Audio DNA state
                if (data.data.decipherUpdate) {
                  setAudioDNA(prev => prev ? {
                    ...prev,
                    decipherProgress: data.data.decipherUpdate.newProgress,
                    currentStreak: data.data.streakUpdate.newStreak,
                    totalPredictions: prev.totalPredictions + 1,
                  } : null)
                }
                // Show celebration for matches, surprises, or perfect predictions
                if (data.data.celebration) {
                  setShowPredictionCelebration(true)
                  // Longer display for perfect matches
                  const displayTime = data.data.result.perfect ? 3500 : 3000
                  setTimeout(() => setShowPredictionCelebration(false), displayTime)
                }
              }
            })
            .catch(() => {})
        }

        // Move to next album after celebration finishes (or immediately if no prediction)
        const celebrationDelay = predictionData?.hasPrediction ? 3200 : 0
        setTimeout(() => nextAlbum(), celebrationDelay)
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
    setReviewText("")
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
      {/* Ambient Background Glow - Hidden on mobile for performance */}
      {coverUrl && (
        <div
          className="hidden md:block fixed inset-0 opacity-20 blur-[120px] scale-150 pointer-events-none"
          style={{
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Mobile: Simple gradient background instead of expensive blur */}
      {coverUrl && (
        <div
          className="md:hidden fixed inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(255,215,0,0.15) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Grain Overlay - Reduced on mobile */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] md:opacity-[0.03] z-50"
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

      {/* Prediction Celebration Overlay */}
      {showPredictionCelebration && predictionResult && (
        <PredictionCelebration
          result={predictionResult}
          onClose={() => setShowPredictionCelebration(false)}
        />
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
          {/* MOBILE LAYOUT - Cinematic */}
          <div className="md:hidden min-h-[100dvh] flex flex-col relative">
            {/* Ambient Background - Mobile optimized */}
            {coverUrl && (
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square opacity-40 blur-3xl"
                  style={{
                    backgroundImage: `url(${coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/80 to-black" />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 pt-20 pb-20">
              {/* Album Hero - Large and Cinematic */}
              <div className="px-8 mb-6">
                <div className="relative aspect-square max-w-[320px] mx-auto">
                  {coverUrl ? (
                    <>
                      {/* Glow underneath */}
                      <div
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-12 blur-2xl opacity-60 rounded-full"
                        style={{ backgroundColor: '#ffd700' }}
                      />
                      <img
                        src={coverUrl}
                        alt={currentAlbum.title}
                        className="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-neutral-900 rounded-2xl flex items-center justify-center">
                      <svg className="w-20 h-20 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Album Info */}
              <div className="px-6 text-center mb-5">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold tracking-tight line-clamp-1">{currentAlbum.title}</h2>
                  <BookmarkButton albumId={currentAlbum.id} size="sm" />
                </div>
                <p className="text-white/60 text-base font-light">{currentAlbum.artistName}</p>
                {currentAlbum.genres?.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {currentAlbum.genres.slice(0, 2).map((genre) => (
                      <span key={genre} className="text-[10px] px-3 py-1 rounded-full bg-white/10 text-white/50 uppercase tracking-wider border border-white/5">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Prediction Display - Premium Compact Card */}
              {predictionData?.hasPrediction && predictionData.prediction && (
                <div className="px-5 mb-4">
                  <div className="relative p-4 rounded-2xl bg-[#0a0a0a] border border-white/[0.06] overflow-hidden">
                    {/* Subtle gradient overlay */}
                    <div
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                      }}
                    />

                    <div className="relative">
                      {/* Top row - Label + Confidence */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="10" className="opacity-30" />
                              <circle cx="12" cy="12" r="6" className="opacity-50" />
                              <circle cx="12" cy="12" r="2" fill="currentColor" />
                            </svg>
                          </div>
                          <span className="text-[9px] tracking-[0.2em] uppercase text-white/30">Prediction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {predictionData.prediction.confidence < 35 && (
                            <span className="text-[7px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400/60 uppercase tracking-wide border border-purple-500/20">
                              Learning
                            </span>
                          )}
                          <span className="text-[10px] text-white/25 tabular-nums">{predictionData.prediction.confidence}%</span>
                          {audioDNA && audioDNA.currentStreak > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/20">
                              <div className="w-1 h-1 rounded-full bg-[#ffd700] animate-pulse" />
                              <span className="text-[9px] text-[#ffd700] tabular-nums">{audioDNA.currentStreak}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main prediction display */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-2xl font-bold tabular-nums"
                            style={{
                              background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {predictionData.prediction.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-white/20 tabular-nums">
                            ±{((predictionData.prediction.ratingRange.max - predictionData.prediction.ratingRange.min) / 2).toFixed(1)}
                          </span>
                        </div>

                        {/* Compact audio spectrum */}
                        {predictionData.albumAudio && (
                          <div className="flex-1 flex items-end gap-1 h-6">
                            {[
                              { v: predictionData.albumAudio.energy, c: '#22d3ee' },
                              { v: predictionData.albumAudio.valence, c: '#a855f7' },
                              { v: predictionData.albumAudio.danceability, c: '#ffd700' },
                              { v: predictionData.albumAudio.acousticness, c: '#10b981' },
                            ].map((f, i) => (
                              <div key={i} className="flex-1 flex flex-col gap-[1px] h-full justify-end">
                                {Array.from({ length: 6 }, (_, j) => {
                                  const segmentThreshold = ((j + 1) / 6) * 100
                                  const isActive = f.v >= segmentThreshold
                                  return (
                                    <div
                                      key={j}
                                      className="flex-1 rounded-[1px] transition-colors"
                                      style={{
                                        backgroundColor: isActive ? f.c : 'rgba(255,255,255,0.03)',
                                        opacity: isActive ? 0.4 + (j / 6) * 0.6 : 1,
                                      }}
                                    />
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Suggested vibes - compact */}
                      {predictionData.prediction.suggestedVibes.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {predictionData.prediction.suggestedVibes.slice(0, 3).map(vibe => (
                            <span
                              key={vibe}
                              className="text-[8px] px-2 py-0.5 rounded-md bg-white/[0.03] text-white/35 uppercase tracking-wider border border-white/[0.04]"
                            >
                              {vibe.replace('_', '-')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Audio DNA / Decipher Progress - Inline compact */}
              {audioDNA && audioDNA.totalPredictions > 0 && !predictionData?.hasPrediction && (
                <div className="px-5 mb-4">
                  <MobileDecipherProgress
                    decipherProgress={audioDNA.decipherProgress}
                    currentStreak={audioDNA.currentStreak}
                  />
                </div>
              )}

              {/* Tracklist - Sleek Horizontal */}
              {albumTracks.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between px-6 mb-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Preview Tracks</span>
                    {albumTracks.some(t => t.waveform) && (
                      <span className="text-[9px] text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Spotify Data
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto px-6 pb-2 scrollbar-hide snap-x snap-mandatory">
                    {albumTracks.map((track) => {
                      const isPlaying = playingTrackId === track.id
                      const hasRealWaveform = track.waveform && track.waveform.length === 40
                      return (
                        <button
                          key={track.id}
                          onClick={() => playTrack(track)}
                          disabled={!track.previewUrl}
                          className={`flex-shrink-0 snap-start w-[100px] p-3 rounded-xl transition-all active:scale-95 ${
                            isPlaying
                              ? 'bg-[#ffd700]/20 border-2 border-[#ffd700]/60'
                              : 'bg-white/5 border border-white/10 active:bg-white/10'
                          } ${!track.previewUrl ? 'opacity-30' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isPlaying ? 'bg-[#ffd700]' : 'bg-white/10'
                            }`}>
                              {isPlaying ? (
                                <PauseIcon className="w-3 h-3 text-black" />
                              ) : (
                                <PlayIcon className="w-3 h-3 text-white/60" />
                              )}
                            </div>
                            <span className={`text-xs font-mono ${isPlaying ? 'text-[#ffd700]' : 'text-white/40'}`}>
                              {track.trackNumber.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className={`block text-[11px] truncate font-medium ${isPlaying ? 'text-[#ffd700]' : 'text-white/80'}`}>
                            {track.name}
                          </span>
                          {/* Mini waveform indicator */}
                          <div className="flex items-center gap-[1px] h-2 mt-2">
                            {(track.waveform?.slice(0, 20) || Array(20).fill(0.4)).map((h: number, i: number) => (
                              <div
                                key={i}
                                className={`w-[2px] rounded-full ${
                                  isPlaying ? 'bg-[#ffd700]' : hasRealWaveform ? 'bg-cyan-400/50' : 'bg-white/20'
                                }`}
                                style={{ height: `${h * 100}%` }}
                              />
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Vibes - Premium Pills */}
              <div className="px-5 mb-5 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Select Vibes</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    selectedDescriptors.length > 0 ? 'bg-[#ffd700]/20 text-[#ffd700]' : 'bg-white/5 text-white/30'
                  }`}>
                    {selectedDescriptors.length}/5
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {shuffledDescriptors.slice(0, 15).map((descriptor) => {
                    const isSelected = selectedDescriptors.includes(descriptor.id)
                    const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                    return (
                      <button
                        key={descriptor.id}
                        onClick={() => toggleDescriptor(descriptor.id)}
                        disabled={submitting || atMax}
                        className={`text-[10px] px-3.5 py-2 rounded-full uppercase tracking-wider font-medium transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#ffd700] text-black shadow-lg shadow-[#ffd700]/20'
                            : atMax
                              ? 'bg-white/5 text-white/15 border border-white/5'
                              : 'bg-white/5 text-white/60 border border-white/10 active:bg-white/10'
                        }`}
                      >
                        {descriptor.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Review Text - Collapsible/Optional */}
              <div className="px-5 mb-4">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Add a review (optional)..."
                  disabled={submitting}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#ffd700]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>

              {/* Rating Slider - Prominent */}
              <div className="px-5 py-4 bg-white/[0.02] border-t border-b border-white/5">
                <RatingSlider value={rating} onChange={setRating} disabled={submitting} />
              </div>

              {/* Actions - Fixed Bottom Feel */}
              <div className="px-5 pt-4 pb-2">
                {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={skip}
                    disabled={submitting}
                    className="w-24 py-4 rounded-2xl border border-white/15 text-white/50 font-semibold text-xs uppercase tracking-wider active:scale-95 active:bg-white/5 transition-all disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={submitting}
                    className="flex-1 py-4 rounded-2xl bg-[#ffd700] text-black font-bold text-sm uppercase tracking-wider active:scale-[0.98] active:bg-[#ffe44d] transition-all disabled:opacity-50 shadow-lg shadow-[#ffd700]/20"
                  >
                    {submitting ? '...' : 'Rate Album'}
                  </button>
                </div>
              </div>

              {/* Tier Progress */}
              {isStatsLoaded && (
                <div className="px-5 pt-3">
                  <TierProgressBar ratingCount={actualRatedCount} />
                </div>
              )}
            </div>
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
                {/* Audio DNA / Decipher Progress */}
                {audioDNA && audioDNA.totalPredictions > 0 && (
                  <div className="mb-6">
                    <DecipherProgressBar
                      decipherProgress={audioDNA.decipherProgress}
                      currentStreak={audioDNA.currentStreak}
                      totalPredictions={audioDNA.totalPredictions}
                    />
                  </div>
                )}

                {/* Prediction Display */}
                {predictionData?.hasPrediction && predictionData.prediction && (
                  <PredictionDisplay
                    prediction={predictionData.prediction}
                    albumAudio={predictionData.albumAudio}
                    streak={audioDNA?.currentStreak || 0}
                  />
                )}

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
                <div className="mb-6">
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

                {/* Review Text */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Review</span>
                    <span className="text-[10px] text-white/20">optional</span>
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts on this album..."
                    disabled={submitting}
                    className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#ffd700]/50 transition-colors"
                  />
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
          const fillPercent = isCompleted && !isCurrent ? 100 : isCurrent ? progress : 0

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

// Audio DNA Progress Bar (Decipher Progress) - Premium "Analog Intelligence" Design
function DecipherProgressBar({
  decipherProgress,
  currentStreak,
  totalPredictions,
}: {
  decipherProgress: number
  currentStreak: number
  totalPredictions: number
}) {
  // Generate pseudo-random "signal" bars for the DNA visualization
  const signalBars = Array.from({ length: 24 }, (_, i) => {
    const baseHeight = Math.sin(i * 0.5) * 0.3 + 0.5
    const progress = decipherProgress / 100
    const activation = i < Math.floor(progress * 24) ? 1 : (i === Math.floor(progress * 24) ? progress * 24 % 1 : 0.15)
    return baseHeight * activation
  })

  return (
    <div className="relative group">
      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1))` }}
      />

      <div className="relative p-4 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* DNA Helix Icon */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-white/[0.06]">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 2v20M4 6c4 0 4 4 8 4s4-4 8-4M4 18c4 0 4-4 8-4s4 4 8 4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium">Audio DNA</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg font-semibold tabular-nums" style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {decipherProgress}%
                  </span>
                  <span className="text-[10px] text-white/25">mapped</span>
                </div>
              </div>
            </div>

            {/* Stats badges */}
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-pulse" />
                  <span className="text-[10px] font-medium text-[#ffd700] tabular-nums">{currentStreak}</span>
                </div>
              )}
              {totalPredictions > 0 && (
                <span className="text-[10px] text-white/20 tabular-nums">{totalPredictions} reads</span>
              )}
            </div>
          </div>

          {/* DNA Signal Visualization */}
          <div className="flex items-center gap-[2px] h-8 mb-2">
            {signalBars.map((height, i) => {
              const isActive = i < Math.floor(decipherProgress / 100 * 24)
              const isEdge = i === Math.floor(decipherProgress / 100 * 24)
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: `${Math.max(height * 100, 10)}%`,
                    background: isActive
                      ? `linear-gradient(to top, rgba(139, 92, 246, 0.8), rgba(34, 211, 238, 0.8))`
                      : isEdge
                        ? `linear-gradient(to top, rgba(139, 92, 246, 0.4), rgba(34, 211, 238, 0.4))`
                        : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: isActive ? '0 0 8px rgba(34, 211, 238, 0.3)' : 'none',
                  }}
                />
              )
            })}
          </div>

          {/* Progress track */}
          <div className="relative h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${decipherProgress}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
              }}
            />
            {/* Animated shimmer */}
            <div
              className="absolute inset-y-0 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Decipher Progress - Ultra Compact Inline Version
function MobileDecipherProgress({
  decipherProgress,
  currentStreak,
}: {
  decipherProgress: number
  currentStreak: number
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-white/[0.05]">
      {/* Mini DNA icon */}
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/15 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-cyan-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 2v20M4 6c4 0 4 4 8 4s4-4 8-4M4 18c4 0 4-4 8-4s4 4 8 4" strokeLinecap="round" />
        </svg>
      </div>

      {/* Progress section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] tracking-wider uppercase text-white/25">Audio DNA</span>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold tabular-nums"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {decipherProgress}%
            </span>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ffd700]/10">
                <div className="w-1 h-1 rounded-full bg-[#ffd700] animate-pulse" />
                <span className="text-[9px] text-[#ffd700]/80 tabular-nums">{currentStreak}</span>
              </div>
            )}
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${decipherProgress}%`,
              background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Prediction Display Component - "Oracle Reading" Design
function PredictionDisplay({
  prediction,
  albumAudio,
  streak,
}: {
  prediction: PredictionData['prediction']
  albumAudio: PredictionData['albumAudio']
  streak: number
}) {
  if (!prediction) return null

  // Confidence ring calculation
  const confidenceAngle = (prediction.confidence / 100) * 360

  return (
    <div className="relative mb-6 group">
      {/* Ambient glow on hover */}
      <div
        className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.15), transparent 70%)' }}
      />

      <div className="relative p-5 rounded-2xl bg-[#0a0a0a] border border-white/[0.06] overflow-hidden">
        {/* Subtle scan lines effect */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Confidence Ring */}
            <div className="relative w-11 h-11">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                {/* Background track */}
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                {/* Progress arc */}
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="url(#confidenceGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(confidenceAngle / 360) * 113} 113`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white/70 tabular-nums">{prediction.confidence}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-[0.25em] uppercase text-white/30 font-medium">Predicted Rating</span>
                {prediction.confidence < 35 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400/60 uppercase tracking-wide border border-purple-500/20">
                    Learning
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{
                    background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {prediction.rating.toFixed(1)}
                </span>
                <span className="text-xs text-white/20 tabular-nums">
                  ±{((prediction.ratingRange.max - prediction.ratingRange.min) / 2).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffd700]/5 border border-[#ffd700]/15">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-[#ffd700]" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#ffd700] animate-ping opacity-75" />
              </div>
              <span className="text-[11px] font-medium text-[#ffd700]/80 tabular-nums">{streak}</span>
            </div>
          )}
        </div>

        {/* Reasoning quote */}
        {prediction.reasoning.length > 0 && (
          <div className="relative mb-4 pl-3 py-2">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-violet-500/50 to-cyan-500/50" />
            <p className="text-[11px] text-white/35 leading-relaxed">
              {prediction.reasoning[0]}
            </p>
          </div>
        )}

        {/* Audio Spectrum Visualization */}
        {albumAudio && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <AudioFeatureBar label="Energy" value={albumAudio.energy} color="#22d3ee" icon="⚡" />
            <AudioFeatureBar label="Mood" value={albumAudio.valence} color="#a855f7" icon="◐" />
            <AudioFeatureBar label="Dance" value={albumAudio.danceability} color="#ffd700" icon="◎" />
            <AudioFeatureBar label="Acoustic" value={albumAudio.acousticness} color="#10b981" icon="◈" />
          </div>
        )}

        {/* Suggested Vibes - Compact Tags */}
        {prediction.suggestedVibes.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
            <span className="text-[9px] text-white/20 uppercase tracking-wider">Vibes:</span>
            <div className="flex flex-wrap gap-1.5">
              {prediction.suggestedVibes.slice(0, 3).map(vibe => (
                <span
                  key={vibe}
                  className="text-[9px] px-2 py-1 rounded-md bg-white/[0.03] text-white/40 uppercase tracking-wide border border-white/[0.04] hover:border-cyan-500/30 hover:text-cyan-400/70 transition-colors cursor-default"
                >
                  {vibe.replace('_', '-')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Streak Badge with escalating intensity
function StreakBadge({
  streak,
  isNewMilestone,
  streakMessage,
  size = 'medium',
}: {
  streak: number
  isNewMilestone: boolean
  streakMessage: string | null
  size?: 'small' | 'medium' | 'large'
}) {
  // Determine intensity tier
  const isLegendary = streak >= 50
  const isEpic = streak >= 25
  const isMajor = streak >= 10

  const sizeClasses = {
    small: { container: 'px-2 py-1', number: 'text-xl', dot: 'w-2 h-2', label: 'text-[9px]' },
    medium: { container: 'px-4 py-2.5', number: 'text-2xl', dot: 'w-3 h-3', label: 'text-xs' },
    large: { container: 'px-6 py-4', number: 'text-3xl', dot: 'w-4 h-4', label: 'text-xs' },
  }[size]

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative">
        {/* Extra rings for major milestones */}
        {isLegendary && (
          <>
            <div className="absolute -inset-3 rounded-3xl border border-[#ffd700]/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute -inset-2 rounded-2xl border border-[#ffd700]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          </>
        )}
        {isEpic && !isLegendary && (
          <div className="absolute -inset-2 rounded-2xl border border-[#ffd700]/15 animate-ping" style={{ animationDuration: '1.5s' }} />
        )}

        <div
          className={`flex items-center gap-3 ${sizeClasses.container} rounded-2xl transition-all`}
          style={{
            backgroundColor: isLegendary
              ? 'rgba(255, 215, 0, 0.2)'
              : isEpic
              ? 'rgba(255, 215, 0, 0.15)'
              : isMajor
              ? 'rgba(255, 215, 0, 0.12)'
              : 'rgba(255, 215, 0, 0.08)',
            borderWidth: 1,
            borderColor: isLegendary
              ? 'rgba(255, 215, 0, 0.5)'
              : isEpic
              ? 'rgba(255, 215, 0, 0.4)'
              : isMajor
              ? 'rgba(255, 215, 0, 0.35)'
              : 'rgba(255, 215, 0, 0.2)',
            boxShadow: isLegendary
              ? '0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)'
              : isEpic
              ? '0 0 20px rgba(255, 215, 0, 0.2)'
              : isMajor
              ? '0 0 15px rgba(255, 215, 0, 0.15)'
              : 'none',
          }}
        >
          <div className="relative">
            <div className={`${sizeClasses.dot} rounded-full bg-[#ffd700]`} />
            <div className={`absolute inset-0 ${sizeClasses.dot} rounded-full bg-[#ffd700] animate-ping`} />
          </div>
          <span
            className={`${sizeClasses.number} font-bold tabular-nums`}
            style={{
              color: isLegendary ? '#ffd700' : isEpic ? '#ffd700' : '#ffd700',
              textShadow: isLegendary ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none',
            }}
          >
            {streak}
          </span>
          <span className={`${sizeClasses.label} uppercase tracking-wider`} style={{ color: 'rgba(255, 215, 0, 0.7)' }}>
            streak
          </span>
        </div>
      </div>

      {isNewMilestone && streakMessage && (
        <span
          className="text-[11px]"
          style={{
            color: isLegendary
              ? 'rgba(255, 215, 0, 0.8)'
              : isEpic
              ? 'rgba(255, 215, 0, 0.7)'
              : 'rgba(255, 215, 0, 0.6)',
            textShadow: isLegendary ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
          }}
        >
          {streakMessage}
        </span>
      )}
    </div>
  )
}

// Audio Feature Bar - VU Meter Inspired Design
function AudioFeatureBar({ label, value, color, icon }: { label: string; value: number; color: string; icon?: string }) {
  // Generate segments for VU meter effect
  const segments = 8
  const activeSegments = Math.ceil((value / 100) * segments)

  return (
    <div className="group">
      <div className="relative h-14 w-full rounded-lg bg-[#050505] border border-white/[0.04] overflow-hidden p-1.5">
        {/* Segments */}
        <div className="flex flex-col-reverse gap-[2px] h-full">
          {Array.from({ length: segments }, (_, i) => {
            const isActive = i < activeSegments
            const intensity = i / segments // Higher segments = more intense
            return (
              <div
                key={i}
                className="flex-1 rounded-[2px] transition-all duration-300"
                style={{
                  backgroundColor: isActive
                    ? color
                    : 'rgba(255, 255, 255, 0.02)',
                  opacity: isActive ? 0.4 + (intensity * 0.6) : 1,
                  boxShadow: isActive && i === activeSegments - 1
                    ? `0 0 10px ${color}40, inset 0 0 4px ${color}20`
                    : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Value overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-center gap-1 mt-1.5">
        {icon && <span className="text-[8px] opacity-40">{icon}</span>}
        <span className="text-[8px] text-white/30 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}

// Prediction Celebration Overlay - Cinematic Reveal
function PredictionCelebration({
  result,
  onClose,
}: {
  result: PredictionResult
  onClose: () => void
}) {
  const isPerfect = result.result.perfect
  const isClose = result.celebration?.type === 'close'
  const isMiss = result.celebration?.type === 'miss'
  const isMatch = result.result.match
  const isSurprise = result.result.surprise
  const isFirstPrediction = result.isFirstPrediction

  // Show for matches, surprises, OR misses (streak loss feedback)
  if (!isMatch && !isSurprise && !isMiss) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-black/95">
        {/* Radial gradient pulse */}
        <div
          className={`absolute inset-0 ${isMatch && !isMiss ? 'animate-pulse' : ''}`}
          style={{
            background: isPerfect
              ? 'radial-gradient(circle at center, rgba(255, 215, 0, 0.15) 0%, transparent 50%)'
              : isClose
              ? 'radial-gradient(circle at center, rgba(34, 211, 238, 0.12) 0%, rgba(255, 215, 0, 0.05) 30%, transparent 50%)'
              : isMiss
              ? 'radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 40%)'
              : isMatch
              ? 'radial-gradient(circle at center, rgba(34, 211, 238, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
          }}
        />
        {/* Scan line effect */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
          }}
        />
      </div>

      <div className="relative text-center p-12 max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* First prediction badge */}
        {isFirstPrediction && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-400/30 animate-in slide-in-from-top duration-500">
            <span
              className="text-[9px] font-medium uppercase tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              First Read
            </span>
          </div>
        )}

        {isPerfect ? (
          <>
            {/* Perfect celebration - gold theme */}
            <div className="relative mb-6">
              {/* Multiple expanding rings */}
              <div className="absolute inset-0 w-28 h-28 mx-auto -mt-2 rounded-full border border-[#ffd700]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-[#ffd700]/30 animate-ping" style={{ animationDuration: '1s' }} />
              {/* Inner glow */}
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
                  boxShadow: '0 0 80px rgba(255, 215, 0, 0.4), inset 0 0 40px rgba(255, 215, 0, 0.15)',
                }}
              >
                <svg className="w-12 h-12 text-[#ffd700]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" className="opacity-30" />
                  <circle cx="12" cy="12" r="6" className="opacity-50" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  {/* Crosshairs */}
                  <line x1="12" y1="1" x2="12" y2="5" strokeWidth={1.5} className="opacity-60" />
                  <line x1="12" y1="19" x2="12" y2="23" strokeWidth={1.5} className="opacity-60" />
                  <line x1="1" y1="12" x2="5" y2="12" strokeWidth={1.5} className="opacity-60" />
                  <line x1="19" y1="12" x2="23" y2="12" strokeWidth={1.5} className="opacity-60" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] tracking-[0.4em] uppercase text-[#ffd700]/60 mb-2">Bullseye</p>
            <h3
              className="text-3xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PERFECT
            </h3>

            {/* Rating comparison */}
            {result.predictedRating !== undefined && result.actualRating !== undefined && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Predicted</span>
                  <span className="text-lg font-bold text-[#ffd700] tabular-nums">{result.predictedRating.toFixed(1)}</span>
                </div>
                <div className="text-[#ffd700]/50">=</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
                  <span className="text-lg font-bold text-[#ffd700] tabular-nums">{result.actualRating.toFixed(1)}</span>
                </div>
              </div>
            )}

            <p className="text-white/50 text-sm mb-6">{result.celebration?.message || 'Exact prediction!'}</p>

            {/* Streak badge - scales with milestone intensity */}
            {result.streakUpdate.newStreak > 0 && (
              <StreakBadge
                streak={result.streakUpdate.newStreak}
                isNewMilestone={result.streakUpdate.isNewMilestone}
                streakMessage={result.streakUpdate.streakMessage}
                size="large"
              />
            )}
          </>
        ) : isClose ? (
          <>
            {/* Close call celebration - cyan to gold gradient theme */}
            <div className="relative mb-6">
              {/* Multiple rings with gradient effect */}
              <div className="absolute inset-0 w-26 h-26 mx-auto -mt-1 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: '1.2s' }} />
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-[#ffd700]/25 animate-ping" style={{ animationDuration: '1s' }} />
              {/* Inner glow with gradient */}
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, rgba(255, 215, 0, 0.1) 60%, transparent 70%)',
                  boxShadow: '0 0 70px rgba(34, 211, 238, 0.3), 0 0 40px rgba(255, 215, 0, 0.15), inset 0 0 35px rgba(34, 211, 238, 0.1)',
                }}
              >
                <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke="url(#closeGradient)" strokeWidth={2}>
                  <defs>
                    <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#ffd700" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10" className="opacity-30" />
                  <circle cx="12" cy="12" r="6" className="opacity-60" />
                  <circle cx="12" cy="12" r="2" fill="url(#closeGradient)" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] tracking-[0.4em] uppercase text-cyan-400/50 mb-2">Almost There</p>
            <h3
              className="text-3xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #22d3ee, #ffd700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SO CLOSE
            </h3>

            {/* Rating comparison - shows how close */}
            {result.predictedRating !== undefined && result.actualRating !== undefined && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Predicted</span>
                  <span className="text-lg font-bold text-cyan-400 tabular-nums">{result.predictedRating.toFixed(1)}</span>
                </div>
                <div className="text-[#ffd700]/60">≈</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
                  <span className="text-lg font-bold text-[#ffd700] tabular-nums">{result.actualRating.toFixed(1)}</span>
                </div>
              </div>
            )}

            <p className="text-white/45 text-sm mb-6">{result.celebration?.message || 'Nearly nailed it!'}</p>

            {/* Streak badge */}
            {result.streakUpdate.newStreak > 0 && (
              <StreakBadge
                streak={result.streakUpdate.newStreak}
                isNewMilestone={result.streakUpdate.isNewMilestone}
                streakMessage={result.streakUpdate.streakMessage}
                size="medium"
              />
            )}
          </>
        ) : isMatch ? (
          <>
            {/* Match celebration */}
            <div className="relative mb-6">
              {/* Outer ring */}
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-cyan-400/30 animate-ping" />
              {/* Inner glow */}
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
                  boxShadow: '0 0 60px rgba(34, 211, 238, 0.3), inset 0 0 30px rgba(34, 211, 238, 0.1)',
                }}
              >
                <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" className="opacity-30" />
                  <circle cx="12" cy="12" r="6" className="opacity-50" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] tracking-[0.4em] uppercase text-cyan-400/50 mb-2">Taste Match</p>
            <h3
              className="text-3xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PREDICTED
            </h3>

            {/* Rating comparison */}
            {result.predictedRating !== undefined && result.actualRating !== undefined && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Predicted</span>
                  <span className="text-lg font-bold text-cyan-400 tabular-nums">{result.predictedRating.toFixed(1)}</span>
                </div>
                <div className="text-cyan-400/40">≈</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
                  <span className="text-lg font-bold text-cyan-400 tabular-nums">{result.actualRating.toFixed(1)}</span>
                </div>
              </div>
            )}

            <p className="text-white/40 text-sm mb-6">{result.celebration?.message || 'We knew it!'}</p>

            {/* Streak badge */}
            {result.streakUpdate.newStreak > 0 && (
              <StreakBadge
                streak={result.streakUpdate.newStreak}
                isNewMilestone={result.streakUpdate.isNewMilestone}
                streakMessage={result.streakUpdate.streakMessage}
                size="medium"
              />
            )}
          </>
        ) : isSurprise ? (
          <>
            {/* Surprise celebration - more dynamic with learning indicator */}
            <div className="relative mb-6">
              {/* Outer pulsing rings */}
              <div className="absolute inset-0 w-28 h-28 mx-auto -mt-2 rounded-full border border-purple-400/15 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 w-26 h-26 mx-auto -mt-1 rounded-full border border-pink-400/10 animate-ping" style={{ animationDuration: '1.5s' }} />
              {/* Inner sparkle glow */}
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 70%)',
                  boxShadow: '0 0 70px rgba(168, 85, 247, 0.35), 0 0 40px rgba(236, 72, 153, 0.15), inset 0 0 30px rgba(168, 85, 247, 0.1)',
                }}
              >
                <svg className="w-11 h-11 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8L12 2Z" strokeLinejoin="round" className="animate-pulse" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] tracking-[0.4em] uppercase text-purple-400/50 mb-2">Plot Twist</p>
            <h3
              className="text-3xl font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SURPRISE
            </h3>

            {/* Rating comparison - shows the unexpected difference */}
            {result.predictedRating !== undefined && result.actualRating !== undefined && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Expected</span>
                  <span className="text-lg font-bold text-purple-400/50 tabular-nums line-through">{result.predictedRating.toFixed(1)}</span>
                </div>
                <div className="text-pink-400/50">→</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">You gave</span>
                  <span className="text-lg font-bold text-purple-400 tabular-nums">{result.actualRating.toFixed(1)}</span>
                </div>
              </div>
            )}

            <p className="text-white/45 text-sm mb-5">{result.celebration?.message || 'You defied our prediction!'}</p>

            {/* Animated recalibrating indicator */}
            <div className="inline-flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-400/20">
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 w-4 h-4 border-2 border-purple-400/30 rounded-full" />
                  <div
                    className="absolute inset-0 w-4 h-4 border-2 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                </div>
                <span className="text-[10px] text-purple-400/70 uppercase tracking-wider">Recalibrating</span>
              </div>
              <p className="text-[10px] text-white/25">Learning from this edge case</p>
            </div>
          </>
        ) : isMiss ? (
          <>
            {/* Miss celebration - subdued, acknowledges the miss */}
            <div className="relative mb-5">
              {/* Subtle fade ring */}
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/10"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
                }}
              >
                <svg className="w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" className="opacity-40" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 mb-2">Recalibrating</p>
            <h3 className="text-2xl font-semibold mb-3 text-white/50">
              Off Target
            </h3>

            {/* Rating comparison */}
            {result.predictedRating !== undefined && result.actualRating !== undefined && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">Predicted</span>
                  <span className="text-base font-medium text-white/30 tabular-nums">{result.predictedRating.toFixed(1)}</span>
                </div>
                <div className="text-white/15">≠</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">Actual</span>
                  <span className="text-base font-medium text-white/50 tabular-nums">{result.actualRating.toFixed(1)}</span>
                </div>
              </div>
            )}

            <p className="text-white/30 text-sm mb-4">{result.celebration?.message || 'Adjusting parameters'}</p>

            {/* Progress indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[9px] text-white/25 uppercase tracking-wider">Learning</span>
            </div>
          </>
        ) : null}

        {/* Decipher milestone notification */}
        {result.decipherUpdate?.decipherMessage && (
          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v20M4 6c4 0 4 4 8 4s4-4 8-4M4 18c4 0 4-4 8-4s4 4 8 4" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xs text-white/40">{result.decipherUpdate.decipherMessage}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${result.decipherUpdate.newProgress}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
                  }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums">{result.decipherUpdate.newProgress}%</span>
            </div>
          </div>
        )}

        {/* Tap to dismiss hint */}
        <p className="absolute bottom-4 left-0 right-0 text-[10px] text-white/15 uppercase tracking-widest">
          Tap to continue
        </p>
      </div>
    </div>
  )
}
