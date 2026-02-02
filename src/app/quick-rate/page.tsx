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
// Based on established music psychology research:
// - Russell's Circumplex Model of Affect (Valence × Arousal)
// - Berlyne's Arousal Theory (Novelty, Complexity, Surprise)
// - MUSIC Model (Rentfrow et al.) - Big Five of Music Preferences
// - Spectral/Timbral Analysis (Texture, Density)
// - Groove Theory (Madison et al.) - Rhythmic Feel
// - Gabrielsson's Emotional Expression in Music
// - Juslin's BRECVEMA Model (Brain mechanisms for musical emotions)
// 
// 8 ORTHOGONAL DIMENSIONS = Maximum information gain for taste profiling
// 28 descriptors covering full spectrum of musical perception
// Each rating builds a more accurate taste fingerprint
// ═══════════════════════════════════════════════════════════════════════════════
const POLARITY_DESCRIPTORS = [
  // ─── DIMENSION 1: AROUSAL/ENERGY (Russell's Circumplex - Y-axis) ───
  // Physiological activation: heart rate, skin conductance, excitement
  { id: 'explosive', label: 'EXPLOSIVE', dimension: 'arousal', weight: 1.0, description: 'Maximum energy peaks, intense climaxes' },
  { id: 'driving', label: 'DRIVING', dimension: 'arousal', weight: 0.7, description: 'Relentless forward momentum, propulsive' },
  { id: 'simmering', label: 'SIMMERING', dimension: 'arousal', weight: 0.4, description: 'Tension building, controlled intensity' },
  { id: 'subdued', label: 'SUBDUED', dimension: 'arousal', weight: -0.8, description: 'Restrained energy, understated power' },
  
  // ─── DIMENSION 2: VALENCE/MOOD (Russell's Circumplex - X-axis) ───
  // Emotional tone from negative to positive
  { id: 'euphoric', label: 'EUPHORIC', dimension: 'valence', weight: 1.0, description: 'Peak positive emotion, pure joy' },
  { id: 'triumphant', label: 'TRIUMPHANT', dimension: 'valence', weight: 0.8, description: 'Victory, overcoming, powerful uplift' },
  { id: 'melancholic', label: 'MELANCHOLIC', dimension: 'valence', weight: -0.6, description: 'Beautiful sadness, bittersweet' },
  { id: 'dark', label: 'DARK', dimension: 'valence', weight: -0.9, description: 'Heavy, ominous, intense negativity' },
  { id: 'anxious', label: 'ANXIOUS', dimension: 'valence', weight: -0.5, description: 'Unsettled, tense, uneasy' },
  
  // ─── DIMENSION 3: TEXTURE/DENSITY (Spectral Analysis) ───
  // Timbral characteristics and sonic space
  { id: 'lush', label: 'LUSH', dimension: 'texture', weight: 0.9, description: 'Rich harmonics, dense layering, full spectrum' },
  { id: 'sparse', label: 'SPARSE', dimension: 'texture', weight: -0.9, description: 'Minimal elements, negative space, breathing room' },
  { id: 'gritty', label: 'GRITTY', dimension: 'texture', weight: 0.7, description: 'Raw distortion, rough edges, lo-fi aesthetic' },
  { id: 'crystalline', label: 'CRYSTALLINE', dimension: 'texture', weight: 0.5, description: 'Pristine clarity, precise, sharp definition' },
  
  // ─── DIMENSION 4: TEMPORAL/RHYTHM (Groove Theory - Madison et al.) ───
  // How time and rhythm are perceived/felt
  { id: 'hypnotic', label: 'HYPNOTIC', dimension: 'temporal', weight: 0.8, description: 'Repetitive patterns, trance-inducing, meditative' },
  { id: 'chaotic', label: 'CHAOTIC', dimension: 'temporal', weight: 0.9, description: 'Unpredictable, complex polyrhythms, disorienting' },
  { id: 'groovy', label: 'GROOVY', dimension: 'temporal', weight: 0.7, description: 'Irresistible pocket, body-moving, danceable' },
  { id: 'floating', label: 'FLOATING', dimension: 'temporal', weight: -0.7, description: 'Ambient pulse, weightless, time-suspended' },
  
  // ─── DIMENSION 5: NOVELTY/EXPECTATION (Berlyne's Arousal Theory) ───
  // How the music relates to expectations and familiarity
  { id: 'avant_garde', label: 'AVANT-GARDE', dimension: 'novelty', weight: 1.0, description: 'Boundary-pushing, experimental, challenging' },
  { id: 'nostalgic', label: 'NOSTALGIC', dimension: 'novelty', weight: -0.6, description: 'Evokes past eras, familiar warmth, throwback' },
  { id: 'futuristic', label: 'FUTURISTIC', dimension: 'novelty', weight: 0.8, description: 'Forward-thinking sonics, ahead of its time' },
  { id: 'timeless', label: 'TIMELESS', dimension: 'novelty', weight: 0.0, description: 'Era-transcendent, classic quality' },
  
  // ─── DIMENSION 6: SCALE/INTIMACY (Production Aesthetics) ───
  // Perceived size and emotional distance
  { id: 'epic', label: 'EPIC', dimension: 'scale', weight: 1.0, description: 'Grand cinematic scope, massive, anthemic' },
  { id: 'intimate', label: 'INTIMATE', dimension: 'scale', weight: -0.9, description: 'Personal, vulnerable, close and confessional' },
  { id: 'visceral', label: 'VISCERAL', dimension: 'scale', weight: 0.8, description: 'Gut-punch physical impact, primal, bodily' },
  { id: 'ethereal', label: 'ETHEREAL', dimension: 'scale', weight: 0.6, description: 'Otherworldly, transcendent, dream-like' },
  
  // ─── DIMENSION 7: AUTHENTICITY (MUSIC Model - Rentfrow) ───
  // Perceived genuineness and artistic intent
  { id: 'raw', label: 'RAW', dimension: 'authenticity', weight: 0.9, description: 'Unpolished, genuine, authentic expression' },
  { id: 'polished', label: 'POLISHED', dimension: 'authenticity', weight: -0.7, description: 'Refined, perfected, radio-ready' },
  { id: 'soulful', label: 'SOULFUL', dimension: 'authenticity', weight: 0.8, description: 'Deep feeling, emotional truth, heart' },
  
  // ─── DIMENSION 8: NARRATIVE (Juslin's BRECVEMA) ───
  // Story-telling and imagery evocation
  { id: 'cinematic', label: 'CINEMATIC', dimension: 'narrative', weight: 0.9, description: 'Visual, story-driven, scene-setting' },
  { id: 'abstract', label: 'ABSTRACT', dimension: 'narrative', weight: 0.7, description: 'Non-representational, pure sound, conceptual' },
  { id: 'confessional', label: 'CONFESSIONAL', dimension: 'narrative', weight: 0.6, description: 'Personal storytelling, diary-like, revealing' },
] as const

type DescriptorId = typeof POLARITY_DESCRIPTORS[number]['id']
type Descriptor = typeof POLARITY_DESCRIPTORS[number]

// Taste profiling requires 3-5 descriptors for optimal signal
// 3 = minimum viable signal (C(31,3) = 4,495 combinations)
// 5 = rich signal without cognitive overload (C(31,5) = 169,911 combinations)
const MIN_DESCRIPTORS = 0 // Vibes optional - don't block users from rating
const MAX_DESCRIPTORS = 5
const TASTEID_UNLOCK = 20 // Ratings needed to UNLOCK TasteID (but it never stops learning)

// Fisher-Yates shuffle
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
  waveform?: number[] | null // Real Spotify waveform (40 bars, 0-1 values)
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
  const [ratedCount, setRatedCount] = useState<number | null>(null) // null = loading
  const [skippedCount, setSkippedCount] = useState(0)
  const [sessionRatedCount, setSessionRatedCount] = useState(0)
  const [history, setHistory] = useState<Array<{ albumIndex: number; rating: number; descriptors: DescriptorId[] }>>([]) // For going back
  const [submitting, setSubmitting] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [error, setError] = useState("")
  const [showCompletion, setShowCompletion] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [albumTracks, setAlbumTracks] = useState<Track[]>([])
  const [, setLoadingTracks] = useState(false)
  const [milestoneReached, setMilestoneReached] = useState<typeof TASTEID_TIERS[0] | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Derived state - only calculate when we have real data
  const actualRatedCount = ratedCount ?? 0
  const isStatsLoaded = ratedCount !== null

  // Audio preview functions
  const playTrack = (track: Track) => {
    if (!track.previewUrl) return
    
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // If clicking same track, just stop
    if (playingTrackId === track.id) {
      setPlayingTrackId(null)
      return
    }
    
    // Play new track (only first 15 seconds)
    const audio = new Audio(track.previewUrl)
    audioRef.current = audio
    setPlayingTrackId(track.id)
    
    audio.play().catch(() => setPlayingTrackId(null))
    
    // Stop after 15 seconds
    setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause()
        setPlayingTrackId(null)
      }
    }, 15000)
    
    // Handle natural end
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
      // Allow max 5 descriptors for rich taste data
      if (prev.length >= MAX_DESCRIPTORS) {
        return prev // Don't add more if at max
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

  // Fetch tracks when album changes
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
      const res = await fetch('/api/users/me', {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && data.data) {
        setRatedCount(data.data._count?.reviews ?? 0)
      } else {
        // API returned but no success - set to 0 so UI isn't stuck loading
        console.error('API returned error:', data.error)
        setRatedCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err)
      // On error, set to 0 so UI isn't stuck loading
      setRatedCount(0)
    }
  }

  const fetchAlbums = async () => {
    setLoadingAlbums(true)
    try {
      const res = await fetch(`/api/albums/swipe?limit=${BATCH_SIZE * 2}`, {
        credentials: 'include',
      })
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
        
        // Check for tier changes
        const oldTier = getCurrentTier(oldCount)
        const newTier = getCurrentTier(newCount)
        
        // Show celebration for tier upgrade!
        if (newTier.id !== oldTier.id && newTier.minRatings > 0) {
          setMilestoneReached(newTier)
          setTimeout(() => setMilestoneReached(null), 4000)
        }
        // Show unlock celebration when hitting 20
        else if (newCount === TASTEID_UNLOCK) {
          setShowCompletion(true)
          setTimeout(() => setShowCompletion(false), 3000)
        }
        
        // Recompute TasteID in background every 5 ratings (keeps it fresh!)
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
    stopAudio() // Stop any playing preview

    // Save current state to history before moving
    if (saveToHistory && albums[currentAlbumIndex]) {
      setHistory(prev => [...prev, {
        albumIndex: currentAlbumIndex,
        rating,
        descriptors: selectedDescriptors
      }])
    }

    setRating(5)
    setSelectedDescriptors([])
    setShuffledDescriptors(shuffleArray([...POLARITY_DESCRIPTORS])) // Reshuffle for next album
    setError("")
    setCurrentAlbumIndex((prev) => prev + 1)

    // Load more albums if running low
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--accent-primary)] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[var(--muted)]">Loading</span>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentAlbumIndex]
  const isUnlocked = actualRatedCount >= TASTEID_UNLOCK
  const remaining = Math.max(0, TASTEID_UNLOCK - actualRatedCount)

  return (
    <div className="min-h-screen flex flex-col pt-14" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full px-3 lg:px-8 xl:px-16 py-2 flex flex-col flex-1">
        {/* Header Row - Compact */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Quick Rate</h1>
              <span className="text-[9px] text-[--muted] hidden sm:inline">Build your TasteID</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-[--muted] hover:text-[--foreground] transition-colors w-8 h-8 flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats Bar - Compact */}
        <div className="mb-2 px-2 py-1.5 border border-[--border] bg-[--surface] flex-shrink-0">
          {!isStatsLoaded ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[--border] border-t-[var(--accent-primary)] rounded-full animate-spin" />
              <span className="text-xs text-[--muted]">Loading...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3 text-xs">
                  {isUnlocked ? (
                    <span className="text-[#00ff88] font-bold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[--foreground]">
                      <span className="font-bold text-[var(--accent-primary)]">{remaining}</span> to unlock
                    </span>
                  )}
                  {sessionRatedCount > 0 && (
                    <span className="text-[--muted]">
                      <span className="text-[var(--accent-primary)]">+{sessionRatedCount}</span>
                    </span>
                  )}
                </div>
                <span className="text-xs">
                  <span className="text-[--foreground] font-bold">{actualRatedCount}</span>
                  <span className="text-[--muted]"> rated</span>
                  {skippedCount > 0 && <span className="text-[--muted] ml-1">· {skippedCount} skip</span>}
                </span>
              </div>
              <TierProgressBar ratingCount={actualRatedCount} />
            </>
          )}
        </div>

        {/* TasteID Unlocked Toast - non-blocking overlay */}
        {showCompletion && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-[#00ff88]/10 border-2 border-[#00ff88] px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-[#00ff88] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#00ff88]">TasteID Unlocked!</h3>
                <p className="text-xs text-[--muted]">Keep rating to make it smarter</p>
              </div>
              <button 
                onClick={() => setShowCompletion(false)}
                className="ml-4 text-[--muted] hover:text-[--foreground]"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tier Milestone Celebration - Clean design */}
        {milestoneReached && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in duration-300">
            <div 
              className="text-center p-8 border-2 max-w-md animate-in zoom-in duration-500 bg-[--surface]"
              style={{ borderColor: milestoneReached.color }}
            >
              {/* Level badge */}
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-black text-black"
                style={{ backgroundColor: milestoneReached.color }}
              >
                {milestoneReached.shortName}
              </div>
              
              <p className="text-xs uppercase tracking-widest text-[--muted] mb-2">Tier Unlocked</p>
              <h2 className="text-3xl font-black mb-2" style={{ color: milestoneReached.color }}>
                {milestoneReached.name}
              </h2>
              <p className="text-[--muted] mb-6">{milestoneReached.description}</p>
              
              {/* Accuracy badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-[--border] mb-6">
                <span className="text-[--muted] text-xs uppercase">Max Accuracy:</span>
                <span className="font-bold" style={{ color: milestoneReached.color }}>
                  {milestoneReached.maxConfidence}%
                </span>
              </div>
              
              {/* Perks list */}
              <div className="space-y-2 text-sm mb-6">
                <p className="text-[--muted]/70 uppercase tracking-wider text-[10px]">New Features Unlocked</p>
                {milestoneReached.perks.map((perk, i) => (
                  <div key={i} className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" style={{ color: milestoneReached.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[--muted]">{perk}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setMilestoneReached(null)}
                className="px-8 py-3 font-bold uppercase tracking-wider transition-colors"
                style={{ 
                  backgroundColor: milestoneReached.color, 
                  color: '#000',
                }}
              >
                Continue Rating
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loadingAlbums && albums.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-[--border] border-t-[var(--accent-primary)] animate-spin mb-4" />
            <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading albums</span>
          </div>
        ) : currentAlbum ? (
          <div className="flex flex-col">
            {/* MOBILE LAYOUT (default) */}
            <div className="flex flex-col md:hidden">
              {/* Album Card - Compact */}
              <div className="flex gap-2.5 p-2 flex-shrink-0">
                {/* Album Art */}
                <div className="w-20 h-20 flex-shrink-0 relative">
                  {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                    <img
                      src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                      alt={currentAlbum.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[--surface] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[--muted]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  {canGoBack && (
                    <button
                      onClick={goBack}
                      className="absolute -left-1 -top-1 w-6 h-6 bg-black/80 border border-[--border] flex items-center justify-center text-[--muted] hover:text-white"
                      title="Go back"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Album Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-bold leading-tight line-clamp-2">{currentAlbum.title}</h2>
                    <BookmarkButton albumId={currentAlbum.id} size="sm" />
                  </div>
                  <p className="text-xs text-[--muted] truncate">{currentAlbum.artistName}</p>
                  {currentAlbum.genres?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {currentAlbum.genres.slice(0, 2).map((genre) => (
                        <span key={genre} className="text-[7px] px-1 py-0.5 border border-[--border] text-[--muted] uppercase tracking-wide">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Tracklist - Horizontal scroll */}
              {albumTracks.length > 0 && (
                <div className="px-2 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] text-[--muted] uppercase tracking-wider">Preview</span>
                    <span className="text-[8px] text-[--muted]">{albumTracks.length} tracks</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
                    {albumTracks.map((track) => {
                      const isPlaying = playingTrackId === track.id
                      return (
                        <button
                          key={track.id}
                          onClick={() => playTrack(track)}
                          disabled={!track.previewUrl}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 border ${
                            isPlaying
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                              : 'border-[--border] bg-[--surface]'
                          } ${!track.previewUrl ? 'opacity-40' : ''}`}
                        >
                          <span className={`text-[9px] font-mono ${isPlaying ? 'text-[var(--accent-primary)]' : 'text-[--muted]'}`}>
                            {isPlaying ? <AudioWaveform /> : track.trackNumber}
                          </span>
                          <span className={`text-[9px] max-w-[80px] truncate ${isPlaying ? 'text-[var(--accent-primary)]' : 'text-[--foreground]'}`}>
                            {track.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Vibes - Compact horizontal scroll */}
              <div className="px-2 pb-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[8px] text-[--muted] uppercase tracking-wider">Vibes</span>
                  {selectedDescriptors.length > 0 && (
                    <span className="text-[8px] text-[var(--accent-primary)] font-bold">{selectedDescriptors.length}/5</span>
                  )}
                </div>
                <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-2 px-2 scrollbar-hide">
                  {shuffledDescriptors.slice(0, 10).map((descriptor) => {
                    const isSelected = selectedDescriptors.includes(descriptor.id)
                    const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                    return (
                      <button
                        key={descriptor.id}
                        onClick={() => toggleDescriptor(descriptor.id)}
                        disabled={submitting || atMax}
                        className={`flex-shrink-0 text-[9px] px-2 py-1 uppercase tracking-wide whitespace-nowrap ${
                          isSelected
                            ? 'bg-[var(--accent-primary)] text-black border border-[var(--accent-primary)] font-bold'
                            : atMax
                              ? 'border border-[--muted-faint] text-[--muted]/40'
                              : 'border border-[--muted-faint] text-[--muted]'
                        }`}
                      >
                        {descriptor.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Rating Slider - Compact */}
              <div className="px-2 py-2 flex-shrink-0">
                <RatingSlider value={rating} onChange={setRating} disabled={submitting} />
              </div>

              {/* Action Buttons */}
              <div className="mt-auto px-2 pb-3 pt-1.5 border-t border-[--border] flex-shrink-0 bg-[--background]">
                {error && <p className="text-red-500 text-[10px] text-center mb-1">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={skip}
                    disabled={submitting}
                    className="w-16 py-2.5 border border-[--muted-faint] text-[--muted] font-bold uppercase tracking-wider text-[10px] hover:border-[--foreground] hover:text-[--foreground] disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={submitting}
                    className="flex-1 py-2.5 font-bold uppercase tracking-wider text-xs disabled:opacity-50 bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-hover)]"
                  >
                    {submitting ? '...' : 'Rate'}
                  </button>
                </div>
              </div>
            </div>

            {/* DESKTOP LAYOUT - 3 Column */}
            <div className="hidden md:grid md:grid-cols-[240px_1fr_280px] lg:grid-cols-[280px_1fr_320px] border border-[--border]">
              {/* LEFT: Album Art */}
              <div className="relative">
                <div className="aspect-square sticky top-0">
                  {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                    <img
                      src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                      alt={currentAlbum.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[--surface] flex items-center justify-center">
                      <svg className="w-16 h-16 text-[--muted]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  {canGoBack && (
                    <button
                      onClick={goBack}
                      className="absolute left-1.5 top-1.5 w-8 h-8 bg-black/70 border border-[--border] flex items-center justify-center text-[--muted] hover:text-white"
                      title="Go back (B)"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* CENTER: Tracklist with Waveforms */}
              <div className="border-x border-[--border] flex flex-col max-h-[360px]">
                <div className="px-2 py-1 border-b border-[--border] flex items-center justify-between bg-[--surface]">
                  <span className="text-[8px] text-[--muted] uppercase tracking-wider">{albumTracks.length} tracks</span>
                  <div className="flex items-center gap-2">
                    {albumTracks.some(t => t.waveform) && (
                      <span className="text-[7px] text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        Spotify
                      </span>
                    )}
                    <span className="text-[8px] text-[--muted]">30s</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {albumTracks.length > 0 ? (
                    <div>
                      {albumTracks.map((track) => {
                        const isPlaying = playingTrackId === track.id
                        return (
                          <button
                            key={track.id}
                            onClick={() => playTrack(track)}
                            disabled={!track.previewUrl}
                            className={`w-full px-2 py-1.5 flex items-center gap-2 text-left transition-colors border-b border-[--border]/30 ${
                              isPlaying ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[--surface]'
                            } ${!track.previewUrl ? 'opacity-30' : ''}`}
                          >
                            {/* Track number */}
                            <span className={`w-4 text-[9px] font-mono flex-shrink-0 ${isPlaying ? 'text-[var(--accent-primary)]' : 'text-[--muted]'}`}>
                              {track.trackNumber}
                            </span>
                            {/* Track name */}
                            <span className={`w-28 lg:w-36 text-[10px] truncate flex-shrink-0 ${isPlaying ? 'text-[var(--accent-primary)] font-medium' : 'text-[--foreground]'}`}>
                              {track.name}
                            </span>
                            {/* Waveform */}
                            <TrackWaveform trackId={track.id} isPlaying={isPlaying} waveform={track.waveform} />
                            {/* Duration */}
                            <span className="text-[9px] text-[--muted] tabular-nums flex-shrink-0">
                              {Math.floor(track.durationMs / 60000)}:{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0')}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[--muted] text-xs">No previews</div>
                  )}
                </div>
              </div>

              {/* RIGHT: Info & Rating */}
              <div className="p-4 flex flex-col">
                {/* Album Header - Title + Bookmark inline */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg lg:text-xl font-bold leading-tight tracking-tight">{currentAlbum.title}</h2>
                    <p className="text-[--muted] text-sm mt-0.5">{currentAlbum.artistName}</p>
                  </div>
                  <BookmarkButton albumId={currentAlbum.id} size="sm" />
                </div>

                {/* Genres */}
                {currentAlbum.genres?.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4">
                    {currentAlbum.genres.slice(0, 3).map((genre) => (
                      <span key={genre} className="text-[8px] px-1.5 py-0.5 border border-[--border] text-[--muted] uppercase tracking-wide">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Vibes Section */}
                <div className="mb-4 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[--muted] uppercase tracking-[0.15em] font-medium">Vibes</span>
                    <span className={`text-[10px] font-mono ${selectedDescriptors.length > 0 ? 'text-[var(--accent-primary)]' : 'text-[--muted]/50'}`}>
                      {selectedDescriptors.length}/5
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shuffledDescriptors.slice(0, 16).map((descriptor) => {
                      const isSelected = selectedDescriptors.includes(descriptor.id)
                      const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                      return (
                        <button
                          key={descriptor.id}
                          onClick={() => toggleDescriptor(descriptor.id)}
                          disabled={submitting || atMax}
                          title={descriptor.description}
                          className={`text-[8px] px-2 py-1 uppercase tracking-wide transition-all ${
                            isSelected
                              ? 'bg-[var(--accent-primary)] text-black border border-[var(--accent-primary)] font-bold'
                              : atMax
                                ? 'border border-[--border]/30 text-[--muted]/30 cursor-not-allowed'
                                : 'border border-[--border] text-[--muted] hover:border-[var(--accent-primary)]/50 hover:text-[--foreground]'
                          }`}
                        >
                          {descriptor.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Rating + Actions */}
                <div className="mt-auto pt-3 border-t border-[--border] space-y-3">
                  <RatingSlider value={rating} onChange={setRating} disabled={submitting} />
                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={skip}
                      disabled={submitting}
                      className="w-16 py-2.5 border border-[--border] text-[--muted] font-bold uppercase text-[10px] tracking-wide hover:border-[--foreground] hover:text-[--foreground] transition-colors disabled:opacity-50"
                    >
                      Skip
                    </button>
                    <button
                      onClick={submitRating}
                      disabled={submitting}
                      className="flex-1 py-2.5 font-bold uppercase text-xs tracking-wide disabled:opacity-50 bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-hover)] transition-colors"
                    >
                      {submitting ? '...' : 'Rate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[--muted] mb-4">No more albums available right now.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[var(--accent-primary)] text-black px-8 py-4 font-bold text-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Quick navigation - compact */}
        {sessionRatedCount >= 10 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => router.push('/tasteid/me')}
              className="text-[var(--accent-primary)] text-xs hover:underline"
            >
              {sessionRatedCount} rated → View TasteID
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Animated Audio Waveform (playing state)
function AudioWaveform() {
  return (
    <div className="flex items-end justify-center gap-[2px] h-4">
      <div className="w-[3px] bg-[var(--accent-primary)] rounded-full" style={{ animation: 'waveform 0.4s ease-in-out infinite', height: '10px' }} />
      <div className="w-[3px] bg-[var(--accent-primary)] rounded-full" style={{ animation: 'waveform 0.4s ease-in-out infinite 0.1s', height: '14px' }} />
      <div className="w-[3px] bg-[var(--accent-primary)] rounded-full" style={{ animation: 'waveform 0.4s ease-in-out infinite 0.2s', height: '8px' }} />
    </div>
  )
}

// Track Waveform - uses real Spotify data when available, falls back to pseudo-waveform
function TrackWaveform({ trackId, isPlaying, waveform }: { trackId: string; isPlaying: boolean; waveform?: number[] | null }) {
  // Use real Spotify waveform if available, otherwise generate from track ID hash
  const bars = waveform && waveform.length === 40
    ? waveform
    : Array.from({ length: 40 }, (_, i) => {
        const hash = trackId.split('').reduce((a, c, idx) => a + c.charCodeAt(0) * (idx + 1 + i), 0)
        return 0.2 + (hash % 80) / 100
      })

  const hasRealWaveform = waveform && waveform.length === 40

  return (
    <div className="flex items-center gap-[1px] h-6 flex-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-sm transition-colors ${
            isPlaying
              ? 'bg-[var(--accent-primary)]'
              : hasRealWaveform
                ? 'bg-cyan-400/60' // Cyan for real Spotify data
                : 'bg-[--muted]/40'
          }`}
          style={{
            height: `${height * 100}%`,
            opacity: isPlaying ? 1 : hasRealWaveform ? 0.8 : 0.6,
            animation: isPlaying ? `waveform 0.5s ease-in-out infinite ${i * 0.02}s` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// Compact Tier Progress Bar
function TierProgressBar({ ratingCount }: { ratingCount: number }) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const tiers = TASTEID_TIERS.slice(1)

  return (
    <div className="space-y-1">
      {/* Compact header */}
      <div className="flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 font-bold uppercase text-black" style={{ backgroundColor: currentTier.color }}>
            {currentTier.shortName || currentTier.name}
          </span>
          <span className="text-[--muted]">{currentTier.maxConfidence}%</span>
        </div>
        {nextTier && (
          <span className="text-[--muted]">
            {ratingsToNext}→<span style={{ color: nextTier.color }}>{nextTier.shortName || nextTier.name}</span>
          </span>
        )}
      </div>

      {/* Compact segmented bar */}
      <div className="flex gap-px">
        {tiers.map((tier) => {
          const isCompleted = ratingCount >= tier.minRatings
          const isCurrent = tier.id === currentTier.id
          let fillPercent = isCompleted && !isCurrent ? 100 : isCurrent ? progress : 0

          return (
            <div key={tier.id} className="flex-1 h-1.5 bg-[--surface] overflow-hidden" title={tier.name}>
              <div className="h-full transition-all duration-500" style={{ width: `${fillPercent}%`, backgroundColor: tier.color }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
