"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Tooltip } from "./ui/tooltip"

interface Track {
  id: string
  name: string
  trackNumber: number
  durationMs: number
  previewUrl: string | null
  spotifyUrl: string | null
  averageRating?: number | null
  totalReviews?: number
}

interface TrackRating {
  trackId: string
  rating: number
  isFavorite: boolean
}

interface TrackPlayerProps {
  tracks: Track[]
  albumId: string
  albumTitle: string
  artistName: string
  coverArtUrl: string | null
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function TrackPlayer({ tracks, albumId, albumTitle, artistName, coverArtUrl }: TrackPlayerProps) {
  const { data: session } = useSession()
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Track ratings state
  const [userRatings, setUserRatings] = useState<Record<string, TrackRating>>({})
  const [loadingRatings, setLoadingRatings] = useState(false)
  const [ratingTrackId, setRatingTrackId] = useState<string | null>(null)
  const [showRatings, setShowRatings] = useState(false)

  // Fetch user's track ratings for this album
  useEffect(() => {
    if (session?.user && albumId) {
      fetchUserRatings()
    }
  }, [session, albumId])

  const fetchUserRatings = async () => {
    setLoadingRatings(true)
    try {
      const res = await fetch(`/api/albums/${albumId}/tracks`)
      const data = await res.json()
      if (data.success) {
        const ratings: Record<string, TrackRating> = {}
        data.data.tracks.forEach((t: { id: string; userRating: number | null; userIsFavorite: boolean }) => {
          if (t.userRating !== null) {
            ratings[t.id] = { trackId: t.id, rating: t.userRating, isFavorite: t.userIsFavorite }
          }
        })
        setUserRatings(ratings)
      }
    } catch (error) {
      console.error("Failed to fetch track ratings:", error)
    } finally {
      setLoadingRatings(false)
    }
  }

  const handleRateTrack = async (trackId: string, rating: number) => {
    if (!session) return
    setRatingTrackId(trackId)
    try {
      const res = await fetch(`/api/tracks/${trackId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      })
      if (res.ok) {
        setUserRatings(prev => ({
          ...prev,
          [trackId]: { trackId, rating, isFavorite: prev[trackId]?.isFavorite || false }
        }))
      }
    } catch (error) {
      console.error("Failed to rate track:", error)
    } finally {
      setRatingTrackId(null)
    }
  }

  // Calculate progress
  const ratedCount = Object.keys(userRatings).length
  const totalCount = tracks.length
  const progressPercent = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0
  const avgUserRating = ratedCount > 0
    ? Object.values(userRatings).reduce((sum, r) => sum + r.rating, 0) / ratedCount
    : null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      // Auto-play next track with preview
      if (currentTrack) {
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
        const nextTrack = tracks.slice(currentIndex + 1).find(t => t.previewUrl)
        if (nextTrack) {
          playTrack(nextTrack)
        } else {
          setCurrentTrack(null)
        }
      }
    }

    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateProgress)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentTrack, tracks])

  const playTrack = (track: Track) => {
    if (!track.previewUrl) return

    if (currentTrack?.id === track.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    setCurrentTrack(track)
    setProgress(0)

    if (audioRef.current) {
      audioRef.current.src = track.previewUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const tracksWithPreviews = tracks.filter(t => t.previewUrl)

  return (
    <div className="border border-[--border] bg-[--background] animate-fade-in">
      <audio ref={audioRef} className="hidden" />

      {/* Header with Progress */}
      <div className="flex items-center justify-between gap-3 p-3 border-b border-[--border]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-[--muted]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="tabular-nums">{tracksWithPreviews.length}/{tracks.length} previews</span>
          </div>
          {session && (
            <button
              onClick={() => setShowRatings(!showRatings)}
              className={`text-[10px] tracking-[0.1em] uppercase px-2.5 py-1.5 border transition-all ${
                showRatings
                  ? "border-[#ffd700] text-[#ffd700] bg-[#ffd700]/5"
                  : "border-[--border] text-[--muted] hover:border-[#ffd700]/50 hover:text-[#ffd700]"
              }`}
            >
              {showRatings ? "Hide Ratings" : "Rate Tracks"}
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {session && ratedCount > 0 && (
          <Tooltip content={`You've rated ${ratedCount}/${totalCount} tracks${avgUserRating ? ` (avg: ${avgUserRating.toFixed(1)})` : ""}`}>
            <div className="flex items-center gap-2 cursor-help">
              <div className="w-16 h-1 bg-[--border] overflow-hidden">
                <div
                  className={`h-full transition-all ${progressPercent === 100 ? "bg-green-500" : "bg-[#ffd700]"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-[--muted] tabular-nums">
                {ratedCount}/{totalCount}
              </span>
              {progressPercent === 100 && (
                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </Tooltip>
        )}
      </div>

      {/* Track List */}
      <div className="max-h-[400px] overflow-y-auto">
        {tracks.map((track, index) => {
          const isActive = currentTrack?.id === track.id
          const hasPreview = !!track.previewUrl
          const userRating = userRatings[track.id]?.rating ?? null
          const isRating = ratingTrackId === track.id

          return (
            <div
              key={track.id}
              className={`flex items-center gap-2 px-3 py-2.5 border-b border-[--border]/30 last:border-0 group transition-all animate-fade-in ${
                hasPreview ? "cursor-pointer hover:bg-[--muted]/5" : "opacity-50"
              } ${isActive ? "bg-[#ffd700]/5 border-l-2 border-l-[#ffd700]" : ""}`}
              style={{ animationDelay: `${index * 20}ms` }}
            >
              {/* Track Number / Play Button */}
              <div
                className="w-6 text-center flex-shrink-0"
                onClick={() => hasPreview && playTrack(track)}
              >
                {hasPreview ? (
                  isActive && isPlaying ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <div className="w-0.5 h-3 bg-[#ffd700] animate-pulse" />
                      <div className="w-0.5 h-4 bg-[#ffd700] animate-pulse" style={{ animationDelay: '100ms' }} />
                      <div className="w-0.5 h-2 bg-[#ffd700] animate-pulse" style={{ animationDelay: '200ms' }} />
                    </div>
                  ) : (
                    <svg className={`w-4 h-4 mx-auto transition-colors ${isActive ? 'text-[#ffd700]' : 'text-[--muted] group-hover:text-[--foreground]'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )
                ) : (
                  <span className="text-xs text-[--muted] tabular-nums">{track.trackNumber}</span>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0" onClick={() => hasPreview && playTrack(track)}>
                <p className={`text-sm truncate transition-colors ${isActive ? "text-[#ffd700] font-medium" : "text-[--foreground]/80 group-hover:text-[--foreground]"}`}>
                  {track.name}
                </p>
                {isActive && (
                  <div className="mt-1.5 h-0.5 bg-[--border] overflow-hidden">
                    <div
                      className="h-full bg-[#ffd700] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* User Rating (when showRatings is on) */}
              {showRatings && session && (
                <TrackRatingWidget
                  trackId={track.id}
                  currentRating={userRating}
                  isLoading={isRating}
                  onRate={(rating) => handleRateTrack(track.id, rating)}
                />
              )}

              {/* User Rating Badge (when ratings hidden but user has rated) */}
              {!showRatings && userRating !== null && (
                <span className="text-xs font-bold text-[#ffd700] tabular-nums w-5 text-center">
                  {userRating}
                </span>
              )}

              {/* Duration */}
              <div className="text-[10px] text-[--muted] tabular-nums w-10 text-right">
                {formatDuration(track.durationMs)}
              </div>

              {/* Lyrics Link */}
              <Link
                href={`/lyrics/${track.id}`}
                className="text-[--muted] hover:text-[#ffd700] p-1 opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => e.stopPropagation()}
                title="View lyrics"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h12" />
                </svg>
              </Link>

              {/* Spotify Link */}
              {track.spotifyUrl && (
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1DB954] hover:text-[#1ed760] p-1 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => e.stopPropagation()}
                  title="Open in Spotify"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="flex items-center gap-3 p-3 border-t border-[--border] bg-gradient-to-r from-[#ffd700]/10 to-transparent animate-fade-in">
          {coverArtUrl && (
            <img src={coverArtUrl} alt="" className="w-10 h-10 object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentTrack.name}</p>
            <p className="text-[10px] text-[--muted] truncate">{artistName}</p>
          </div>
          <button
            onClick={() => playTrack(currentTrack)}
            className="w-10 h-10 flex items-center justify-center bg-[#ffd700] hover:bg-[#ffed4a] transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// Inline track rating widget
function TrackRatingWidget({
  trackId,
  currentRating,
  isLoading,
  onRate
}: {
  trackId: string
  currentRating: number | null
  isLoading: boolean
  onRate: (rating: number) => void
}) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const displayRating = hoverRating ?? currentRating

  // Quick rating: 5 buttons for 2, 4, 6, 8, 10
  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHoverRating(null)}
    >
      {[2, 4, 6, 8, 10].map((rating) => (
        <button
          key={rating}
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation()
            onRate(rating)
          }}
          onMouseEnter={() => setHoverRating(rating)}
          className={`w-7 h-7 sm:w-5 sm:h-5 text-[10px] sm:text-[8px] font-bold transition-all disabled:opacity-50 ${
            displayRating !== null && rating <= displayRating
              ? "bg-[#ffd700] text-black"
              : "bg-[--border] text-[--muted] hover:bg-[#ffd700]/30"
          }`}
          title={`Rate ${rating}/10`}
        >
          {rating === 10 && (
            <svg className="w-2 h-2 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
      {displayRating !== null && (
        <span className="ml-1 text-[10px] font-bold tabular-nums text-[#ffd700]">
          {displayRating}
        </span>
      )}
    </div>
  )
}
