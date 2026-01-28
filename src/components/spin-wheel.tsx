"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { StreamingLinks } from "./streaming-links"

interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  averageRating: number | null
  totalReviews: number
  genres: string[]
  spotifyUrl: string | null
}

interface Recommendation {
  reason: string
  score: number
  breakdown: {
    genre: number
    artist: number
    quality: number
    collaborative: number
    freshness: number
  }
  mode: string
}

interface UserStats {
  reviewCount: number
  topGenres: string[]
  averageRating: number
  spinLimit: number // -1 = unlimited
}

interface SpinWheelProps {
  userId?: string
  userReviewCount?: number
}

type Mode = "tailored" | "smart" | "discovery" | "quality"

// Unlock from first review
const MIN_REVIEWS_REQUIRED = 1

const MODE_INFO: Record<Mode, { label: string; description: string }> = {
  tailored: {
    label: "For You",
    description: "Maximally personalized to your taste",
  },
  smart: {
    label: "Smart",
    description: "Balanced mix of taste and discovery",
  },
  discovery: {
    label: "Explore",
    description: "Albums outside your comfort zone",
  },
  quality: {
    label: "Best",
    description: "Focus on highest-rated albums",
  },
}

export function SpinWheel({ userId, userReviewCount = 0 }: SpinWheelProps) {
  const [mode, setMode] = useState<Mode>("tailored") // Default to tailored mode
  const [isSpinning, setIsSpinning] = useState(false)
  const [album, setAlbum] = useState<Album | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spinCount, setSpinCount] = useState(0)
  const [dailySpinCount, setDailySpinCount] = useState(0)
  const [isLocked, setIsLocked] = useState(!userId || userReviewCount < MIN_REVIEWS_REQUIRED)

  // Load daily spin count from localStorage
  useEffect(() => {
    if (userId) {
      const today = new Date().toISOString().split('T')[0]
      const key = `waxfeed_spins_${userId}_${today}`
      const stored = localStorage.getItem(key)
      if (stored) {
        setDailySpinCount(parseInt(stored, 10))
      }
    }
  }, [userId])

  useEffect(() => {
    setIsLocked(!userId || userReviewCount < MIN_REVIEWS_REQUIRED)
  }, [userId, userReviewCount])

  const spin = useCallback(async () => {
    if (!userId) {
      setError("Sign in to use Spin the Wheel")
      return
    }

    // Check daily spin limit (client-side)
    const spinLimit = userStats?.spinLimit ?? getClientSpinLimit(userReviewCount)
    if (spinLimit !== -1 && dailySpinCount >= spinLimit) {
      setError(`Daily limit reached (${spinLimit} spins). Review more albums to unlock more spins!`)
      return
    }

    setIsSpinning(true)
    setError(null)
    setSpinCount(c => c + 1)

    try {
      const res = await fetch(`/api/albums/random?userId=${userId}&mode=${mode}`)
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          setIsLocked(true)
        }
        throw new Error(data.error || "Failed to get random album")
      }

      // Track spin in localStorage
      const today = new Date().toISOString().split('T')[0]
      const key = `waxfeed_spins_${userId}_${today}`
      const newCount = dailySpinCount + 1
      localStorage.setItem(key, String(newCount))
      setDailySpinCount(newCount)

      // Wait for spin animation
      await new Promise(resolve => setTimeout(resolve, 1800))

      setAlbum(data.data.album)
      setRecommendation(data.data.recommendation)
      setUserStats(data.data.userStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSpinning(false)
    }
  }, [userId, mode, dailySpinCount, userStats, userReviewCount])

  // Client-side spin limit calculation (matches server)
  function getClientSpinLimit(reviewCount: number): number {
    if (reviewCount >= 15) return -1 // unlimited
    if (reviewCount >= 10) return 50
    if (reviewCount >= 5) return 20
    if (reviewCount >= 3) return 12
    if (reviewCount >= 2) return 8
    return 5
  }

  const reset = useCallback(() => {
    setAlbum(null)
    setRecommendation(null)
    setError(null)
  }, [])

  // Not signed in
  if (!userId) {
    return (
      <div className="text-center py-16">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
          Locked Feature
        </p>
        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-6">
          Spin the Wheel
        </h2>
        <p className="text-sm text-[--muted] max-w-md mx-auto mb-8">
          Discover albums tailored to your taste. Sign in and review {MIN_REVIEWS_REQUIRED} albums to unlock.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[--foreground] text-[--background] px-8 py-4 font-semibold text-sm tracking-wide hover:bg-[--foreground]/90 transition-colors"
        >
          SIGN IN
        </Link>
      </div>
    )
  }

  // Locked - no reviews yet
  if (isLocked) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left: Unlock prompt */}
        <div className="order-2 lg:order-1">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
            Unlock Now
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[0.95] mb-6">
            Spin the Wheel
          </h2>
          <p className="text-sm text-[--muted] max-w-sm leading-relaxed mb-6">
            Review your first album to unlock personalized discovery. The more you review, the better your recommendations.
          </p>

          {/* Benefits */}
          <div className="space-y-2 mb-8 text-[11px] text-[--muted]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-white rounded-full" />
              <span>1 review = 5 spins/day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[--foreground]/50 rounded-full" />
              <span>5 reviews = 20 spins/day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[--foreground]/30 rounded-full" />
              <span>15+ reviews = unlimited</span>
            </div>
          </div>

          <Link
            href="/search"
            className="inline-block bg-[--foreground] text-[--background] px-6 py-3 font-semibold text-sm tracking-wide hover:bg-[--foreground]/90 transition-colors"
          >
            WRITE YOUR FIRST REVIEW
          </Link>
        </div>

        {/* Right: Locked vinyl */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="relative w-56 h-56 lg:w-72 lg:h-72 opacity-30">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="98" fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="1"/>
              <circle cx="100" cy="100" r="92" fill="#151515"/>
              <g fill="none" stroke="#0a0a0a" strokeOpacity="0.3">
                <circle cx="100" cy="100" r="86" strokeWidth="10"/>
                <circle cx="100" cy="100" r="72" strokeWidth="8"/>
                <circle cx="100" cy="100" r="60" strokeWidth="6"/>
              </g>
              <circle cx="100" cy="100" r="28" fill="#0a0a0a"/>
              <circle cx="100" cy="100" r="4" fill="#1a1a1a"/>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {!album ? (
        /* Pre-spin state */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Controls */}
          <div className="order-2 lg:order-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
              Discovery
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[0.95] mb-6">
              Spin the Wheel
            </h2>

            {/* Mode selector */}
            <div className="mb-6">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[--muted] mb-3">
                Mode
              </p>
              <div className="flex gap-2">
                {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`
                      px-4 py-2 text-[11px] tracking-[0.1em] uppercase font-medium transition-colors
                      ${mode === m
                        ? "bg-white text-black"
                        : "border border-[--border] text-[--muted] hover:border-[--foreground]/30 hover:text-[--muted]"
                      }
                    `}
                  >
                    {MODE_INFO[m].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[--muted]/70 mt-2">
                {MODE_INFO[mode].description}
              </p>
            </div>

            {/* User's top genres */}
            {userStats?.topGenres && userStats.topGenres.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[--muted] mb-2">
                  Your Top Genres
                </p>
                <div className="flex flex-wrap gap-2">
                  {userStats.topGenres.map((genre, i) => (
                    <span
                      key={i}
                      className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 border border-[--border] text-[--muted]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={spin}
                disabled={isSpinning}
                className="inline-flex items-center gap-3 bg-[--foreground] text-[--background] px-6 py-3 font-semibold text-sm tracking-wide hover:bg-[--foreground]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                <span>{isSpinning ? "SPINNING..." : "SPIN"}</span>
                {spinCount > 0 && (
                  <span className="text-[11px] text-[--muted] tabular-nums">#{spinCount + 1}</span>
                )}
              </button>

              {/* Spin limit indicator */}
              {(() => {
                const limit = userStats?.spinLimit ?? getClientSpinLimit(userReviewCount)
                if (limit === -1) return null
                const remaining = Math.max(0, limit - dailySpinCount)
                return (
                  <div className="text-[10px] tracking-[0.1em] uppercase text-[--muted]/70">
                    <span className="tabular-nums">{remaining}</span> / {limit} today
                  </div>
                )
              })()}
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-4 animate-in fade-in duration-200">{error}</p>
            )}

            {/* Upgrade prompt for limited users */}
            {(() => {
              const limit = userStats?.spinLimit ?? getClientSpinLimit(userReviewCount)
              if (limit === -1 || userReviewCount >= 15) return null
              const reviewsToUnlimited = 15 - userReviewCount
              return (
                <p className="text-[10px] text-[--muted]/70 mt-3">
                  Review {reviewsToUnlimited} more album{reviewsToUnlimited !== 1 ? 's' : ''} for unlimited spins
                </p>
              )
            })()}
          </div>

          {/* Right: Vinyl */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div
              className="relative w-56 h-56 lg:w-72 lg:h-72 cursor-pointer"
              onClick={!isSpinning ? spin : undefined}
            >
              <svg
                viewBox="0 0 200 200"
                className={`w-full h-full ${isSpinning ? "animate-spin-fast" : ""}`}
              >
                <defs>
                  <linearGradient id="vinylGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2a2a2a"/>
                    <stop offset="50%" stopColor="#1a1a1a"/>
                    <stop offset="100%" stopColor="#2a2a2a"/>
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="98" fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="1"/>
                <circle cx="100" cy="100" r="92" fill="url(#vinylGrad)"/>
                {/* Grooves */}
                <g fill="none" stroke="#000" strokeOpacity="0.15">
                  <circle cx="100" cy="100" r="86" strokeWidth="10"/>
                  <circle cx="100" cy="100" r="72" strokeWidth="8"/>
                  <circle cx="100" cy="100" r="60" strokeWidth="6"/>
                  <circle cx="100" cy="100" r="50" strokeWidth="5"/>
                </g>
                {/* Label */}
                <circle cx="100" cy="100" r="28" fill="#0a0a0a"/>
                <circle cx="100" cy="100" r="24" fill="#111"/>
                <circle cx="100" cy="100" r="4" fill="#1a1a1a"/>
                <text
                  x="100"
                  y="103"
                  textAnchor="middle"
                  fill="#333"
                  fontSize="7"
                  fontWeight="600"
                  letterSpacing="0.15em"
                >
                  WAXFEED
                </text>
              </svg>

              {!isSpinning && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-white/50">
                    Click to spin
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Result state */
        <div>
          {/* Top bar */}
          <div className="flex items-center justify-between text-[10px] tracking-[0.15em] uppercase text-[--muted] mb-6 pb-4 border-b border-[--border]">
            <span>Spin #{spinCount}</span>
            {recommendation && (
              <span className="text-[--muted]">{recommendation.reason}</span>
            )}
            <span className="tabular-nums">{recommendation?.score}% match</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Album art */}
            <div>
              <Link href={`/album/${album.spotifyId}`} className="block group">
                <div className="aspect-square bg-[--surface] overflow-hidden">
                  {album.coverArtUrl ? (
                    <img
                      src={album.coverArtUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[--muted]/50">
                      No Cover
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                  Your Discovery
                </p>

                <Link href={`/album/${album.spotifyId}`} className="group">
                  <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[0.95] mb-3 group-hover:text-[--muted] transition-colors">
                    {album.title}
                  </h2>
                </Link>

                <p className="text-lg text-[--muted] mb-6">
                  {album.artistName}
                </p>

                {album.averageRating && (
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold tabular-nums">
                      {album.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-[--muted]">/ 10</span>
                    <span className="text-[11px] text-[--muted]/70 ml-2">
                      from {album.totalReviews} reviews
                    </span>
                  </div>
                )}

                {/* Score breakdown */}
                {recommendation && (
                  <div className="mb-6 p-4 bg-[--surface] border border-[--border]">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-[--muted] mb-3">
                      Why this album
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[--muted]">Genre Match</span>
                        <span className="tabular-nums">{Math.round(recommendation.breakdown.genre * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[--muted]">Artist Match</span>
                        <span className="tabular-nums">{Math.round(recommendation.breakdown.artist * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[--muted]">Quality</span>
                        <span className="tabular-nums">{Math.round(recommendation.breakdown.quality * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[--muted]">Similar Listeners</span>
                        <span className="tabular-nums">{Math.round(recommendation.breakdown.collaborative * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Genres */}
                {album.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {album.genres.slice(0, 4).map((genre, i) => (
                      <span
                        key={i}
                        className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 border border-[--border] text-[--muted]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Listen Links */}
                {album.spotifyUrl && (
                  <div className="mb-6">
                    <StreamingLinks spotifyUrl={album.spotifyUrl} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/album/${album.spotifyId}`}
                  className="bg-[--foreground] text-[--background] px-6 py-3 font-semibold text-sm tracking-wide text-center hover:bg-[--foreground]/90 transition-colors"
                >
                  REVIEW ALBUM
                </Link>
                <button
                  onClick={reset}
                  className="border border-[--border] px-6 py-3 font-semibold text-sm tracking-wide hover:border-[--foreground] hover:text-[--foreground] transition-colors"
                >
                  SPIN AGAIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
