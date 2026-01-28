"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { RatingSlider } from "@/components/rating-slider"
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
  const [loadingTracks, setLoadingTracks] = useState(false)
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
          <div className="w-10 h-10 border-2 border-[--border] border-t-[--accent-primary] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading</span>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentAlbumIndex]
  const isUnlocked = actualRatedCount >= TASTEID_UNLOCK
  const unlockProgress = Math.min(100, (actualRatedCount / TASTEID_UNLOCK) * 100)
  const remaining = Math.max(0, TASTEID_UNLOCK - actualRatedCount)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full px-4 lg:px-12 xl:px-20 py-4 flex flex-col flex-1 overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tighter">Quick Rate</h1>
            <p className="text-[10px] sm:text-xs text-[--muted] truncate">
              Build your TasteID. Skip what you haven't heard.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-[--muted] hover:text-[--foreground] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mb-3 p-2 border border-[--border] bg-[--surface] flex-shrink-0">
          {!isStatsLoaded ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[--border] border-t-[--accent-primary] rounded-full animate-spin" />
              <span className="text-sm text-[--muted]">Loading your progress...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-sm">
                  {/* Status message */}
                  {isUnlocked ? (
                    <span className="text-[#00ff88] font-bold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      TasteID Unlocked — Keep Building!
                    </span>
                  ) : (
                    <span className="text-white">
                      <span className="font-bold text-[--accent-primary]">{remaining}</span> more to unlock
                    </span>
                  )}
                  
                  {/* Session count */}
                  {sessionRatedCount > 0 && (
                    <span className="text-[--muted]">
                      <span className="text-[--accent-primary] font-bold">+{sessionRatedCount}</span> this session
                    </span>
                  )}
                </div>
                
                {/* Total ratings */}
                <span className="text-sm">
                  <span className="text-[--foreground] font-bold">{actualRatedCount}</span>
                  <span className="text-[--muted]"> ratings</span>
                  {!isUnlocked && (
                    <span className="text-[--muted] ml-2">{Math.round(unlockProgress)}%</span>
                  )}
                </span>
              </div>
              
              {/* Tier Progress Bar - always show */}
              <TierProgressBar ratingCount={actualRatedCount} />
              
              {skippedCount > 0 && (
                <p className="text-[10px] text-[--muted] mt-1 text-right">
                  {skippedCount} skipped
                </p>
              )}
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
            <div className="w-10 h-10 border-2 border-[--border] border-t-[--accent-primary] animate-spin mb-4" />
            <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading albums</span>
          </div>
        ) : currentAlbum ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* MOBILE LAYOUT (default) */}
            <div className="flex-1 flex flex-col md:hidden overflow-hidden">
              {/* Album Card with Art + Info */}
              <div className="flex gap-3 p-3 flex-shrink-0">
                {/* Album Art with Back Button Overlay */}
                <div className="w-24 h-24 flex-shrink-0 relative">
                  {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                    <img
                      src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                      alt={currentAlbum.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[--surface] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[--muted]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  {/* Back button overlay */}
                  {canGoBack && (
                    <button
                      onClick={goBack}
                      className="absolute -left-1 -top-1 w-7 h-7 bg-black/80 border border-[--border] flex items-center justify-center text-[--muted] hover:text-white transition-colors"
                      title="Go back"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Album Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h2 className="text-base font-bold leading-tight line-clamp-2">{currentAlbum.title}</h2>
                  <p className="text-sm text-[--muted] truncate">{currentAlbum.artistName}</p>
                  {currentAlbum.genres && currentAlbum.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {currentAlbum.genres.slice(0, 2).map((genre) => (
                        <span key={genre} className="text-[9px] px-1.5 py-0.5 bg-[--surface] border border-[--border] text-[--muted] uppercase tracking-wide">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Track preview inline */}
                  {albumTracks.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {albumTracks.slice(0, 3).map((track) => (
                        <button
                          key={track.id}
                          onClick={() => playTrack(track)}
                          disabled={!track.previewUrl}
                          className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                            playingTrackId === track.id
                              ? 'border-[--accent-primary] bg-[--accent-primary]/20 text-[--accent-primary]'
                              : 'border-[--border] text-[--muted] hover:border-[--muted]'
                          } ${!track.previewUrl ? 'opacity-30' : ''}`}
                          title={track.name}
                        >
                          {playingTrackId === track.id ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </button>
                      ))}
                      <span className="text-[9px] text-[--muted] uppercase">Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vibes - Horizontal Scroll */}
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] text-[--muted] uppercase tracking-wider">Vibes</span>
                  {selectedDescriptors.length > 0 && (
                    <span className="text-[9px] text-[--accent-primary] font-bold">{selectedDescriptors.length}/5</span>
                  )}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
                  {shuffledDescriptors.slice(0, 12).map((descriptor) => {
                    const isSelected = selectedDescriptors.includes(descriptor.id)
                    const atMax = selectedDescriptors.length >= MAX_DESCRIPTORS && !isSelected
                    return (
                      <button
                        key={descriptor.id}
                        onClick={() => toggleDescriptor(descriptor.id)}
                        disabled={submitting || atMax}
                        className={`flex-shrink-0 text-[10px] px-2.5 py-1.5 uppercase tracking-wider transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-[--accent-primary] text-black border border-[--accent-primary] font-bold'
                            : atMax
                              ? 'border border-[--muted-faint] text-[--muted]/40'
                              : 'border border-[--muted-faint] text-[--muted] active:border-[--accent-primary]'
                        }`}
                      >
                        {descriptor.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Rating Slider */}
              <div className="px-3 py-3 flex-shrink-0">
                <RatingSlider value={rating} onChange={setRating} disabled={submitting} />
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="mt-auto px-3 pb-4 pt-2 border-t border-[--border] flex-shrink-0 bg-[--background]">
                {error && (
                  <p className="text-red-500 text-xs text-center mb-2">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={skip}
                    disabled={submitting}
                    className="w-20 py-3 border border-[--muted-faint] text-[--muted] font-bold uppercase tracking-wider text-xs hover:border-[--foreground] hover:text-[--foreground] transition-colors disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={submitting}
                    className="flex-1 py-3 font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50 bg-[--accent-primary] text-black hover:bg-[--accent-hover]"
                  >
                    {submitting ? 'Saving...' : 'Rate'}
                  </button>
                </div>
              </div>
            </div>

            {/* DESKTOP LAYOUT */}
            <div className="hidden md:flex border border-[--border] flex-1 overflow-hidden">
              {/* Album Art - Left Side */}
              <div className="w-[280px] lg:w-[320px] flex-shrink-0 relative">
                <div className="aspect-square relative max-h-[320px]">
                  {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                    <img
                      src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                      alt={currentAlbum.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[--surface] flex items-center justify-center">
                      <svg className="w-20 h-20 text-[--muted]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  {/* Back button overlay - Desktop */}
                  {canGoBack && (
                    <button
                      onClick={goBack}
                      className="absolute left-2 top-2 w-10 h-10 bg-black/70 border border-[--border] flex items-center justify-center text-[--muted] hover:text-white hover:bg-black/90 transition-colors"
                      title="Go back (B)"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Info & Rating - Right Side */}
              <div className="flex-1 p-4 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <h2 className="text-xl lg:text-2xl font-bold mb-1">{currentAlbum.title}</h2>
                  <p className="text-[--muted] text-base mb-3">{currentAlbum.artistName}</p>
                  {currentAlbum.genres && currentAlbum.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentAlbum.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="text-[10px] px-2 py-1 border border-[--border] text-[--muted] uppercase tracking-wider"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Track Previews - Desktop */}
                  <div className="mb-3 p-2 bg-[--surface] border border-[--border]">
                    <p className="text-[10px] text-[--muted] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                      Preview tracks (15s)
                    </p>
                    {loadingTracks ? (
                      <div className="flex items-center gap-2 text-[--muted] text-xs py-2">
                        <div className="w-4 h-4 border-2 border-[--border] border-t-[--accent-primary] rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : albumTracks.length > 0 ? (
                      <div className="space-y-1">
                        {albumTracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => playTrack(track)}
                            disabled={!track.previewUrl}
                            className={`w-full flex items-center gap-3 p-2 text-left transition-colors ${
                              playingTrackId === track.id
                                ? 'bg-[--accent-primary]/20 border border-[--accent-primary]'
                                : 'hover:bg-[--surface-raised] border border-transparent'
                            } ${!track.previewUrl ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className={`w-8 h-8 flex items-center justify-center border ${
                              playingTrackId === track.id ? 'border-[--accent-primary] text-[--accent-primary]' : 'border-[--border] text-[--muted]'
                            }`}>
                              {playingTrackId === track.id ? (
                                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                  <rect x="6" y="4" width="4" height="16" />
                                  <rect x="14" y="4" width="4" height="16" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[--foreground] truncate">{track.name}</p>
                              <p className="text-[10px] text-[--muted]">
                                Track {track.trackNumber} · {Math.floor(track.durationMs / 60000)}:{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0')}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[--muted]/70 text-xs py-2">No previews available</p>
                    )}
                  </div>

                  {/* Polarity Descriptors - Desktop */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-[--muted] uppercase tracking-wider">
                        Describe this album{' '}
                        <span className="text-[--muted]">(optional)</span>
                      </p>
                      {selectedDescriptors.length > 0 && (
                        <span className="text-[10px] text-[--accent-primary]">
                          {selectedDescriptors.length} selected
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
                            title={descriptor.description}
                            className={`text-[10px] px-3 py-1.5 min-h-[32px] uppercase tracking-wider transition-all duration-150 ${
                              isSelected
                                ? 'bg-[--accent-primary] text-black border border-[--accent-primary] font-bold'
                                : atMax
                                  ? 'border border-[--muted-faint] text-[--muted]/50 cursor-not-allowed'
                                  : 'border border-[--muted-faint] text-[--muted] hover:border-[--accent-hover] hover:text-[--accent-hover]'
                            } disabled:opacity-50`}
                          >
                            {descriptor.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Rating Controls - Desktop */}
                <div className="space-y-3 flex-shrink-0 pt-3 border-t border-[--border]">
                  <RatingSlider value={rating} onChange={setRating} disabled={submitting} />

                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={skip}
                      disabled={submitting}
                      className="flex-1 py-3 min-h-[48px] border border-[--muted-faint] text-[--muted] font-bold uppercase tracking-wider text-sm hover:border-[--foreground] hover:text-[--foreground] transition-colors disabled:opacity-50"
                    >
                      Skip
                    </button>
                    <button
                      onClick={submitRating}
                      disabled={submitting}
                      className="flex-1 py-3 min-h-[48px] font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50 bg-[--accent-primary] text-black hover:bg-[--accent-hover]"
                    >
                      {submitting ? 'Saving...' : 'Rate'}
                    </button>
                  </div>

                  <p className="text-center text-xs text-[--muted]">
                    <kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">Enter</kbd> rate · <kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">S</kbd> skip · <kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">B</kbd> back
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[--muted] mb-4">No more albums available right now.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[--accent-primary] text-black px-8 py-4 font-bold text-lg hover:bg-[--accent-hover] transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Quick navigation */}
        {sessionRatedCount >= 10 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-[--muted] mb-3">
              You've rated {sessionRatedCount} albums this session!
            </p>
            <button
              onClick={() => router.push('/tasteid/me')}
              className="text-[--accent-primary] text-sm hover:underline"
            >
              View Your TasteID →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Inline Tier Progress Bar for Quick Rate - CLEAR LABELS
function TierProgressBar({ ratingCount }: { ratingCount: number }) {
  const { progress, ratingsToNext, currentTier, nextTier } = getProgressToNextTier(ratingCount)
  const tiers = TASTEID_TIERS.slice(1) // Skip 'locked'
  
  return (
    <div className="space-y-2">
      {/* Header with current tier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
            style={{ backgroundColor: currentTier.color }}
          >
            {currentTier.name}
          </span>
          <span className="text-[10px] text-[--muted]">{currentTier.maxConfidence}% accuracy</span>
        </div>
        {nextTier && (
          <span className="text-[10px] text-[--muted]">
            {ratingsToNext} ratings to <span style={{ color: nextTier.color }}>{nextTier.name}</span>
          </span>
        )}
      </div>
      
      {/* Segmented progress bar with labels */}
      <div className="flex gap-0.5">
        {tiers.map((tier, index) => {
          const isCompleted = ratingCount >= tier.minRatings
          const isCurrent = tier.id === currentTier.id
          
          let fillPercent = 0
          if (isCompleted && !isCurrent) fillPercent = 100
          else if (isCurrent) fillPercent = progress
          
          return (
            <div 
              key={tier.id}
              className="flex-1"
            >
              {/* Progress segment */}
              <div
                className="h-2 bg-[--surface] rounded-sm overflow-hidden mb-1"
                title={`${tier.name}: ${tier.minRatings}+ ratings`}
              >
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${fillPercent}%`,
                    backgroundColor: tier.color
                  }}
                />
              </div>
              {/* Tier name label */}
              <div
                className={`text-[8px] sm:text-[9px] text-center uppercase tracking-wider ${isCurrent ? 'font-bold' : ''}`}
                style={{ color: isCompleted || isCurrent ? tier.color : 'var(--muted)' }}
              >
                {tier.name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
