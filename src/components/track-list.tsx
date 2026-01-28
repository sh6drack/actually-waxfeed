"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Tooltip } from "./ui/tooltip"

interface Track {
  id: string
  spotifyId: string
  name: string
  trackNumber: number
  discNumber: number
  durationMs: number
  previewUrl: string | null
  averageRating: number | null
  totalReviews: number
  userRating: number | null
  userIsFavorite: boolean
  userNote: string | null
}

interface Progress {
  total: number
  rated: number
  percent: number
  userAverageRating: number | null
  isComplete: boolean
}

interface Props {
  albumId: string
  albumTitle: string
  initialTracks?: Track[]
  initialProgress?: Progress
}

export function TrackList({ albumId, albumTitle, initialTracks, initialProgress }: Props) {
  const { data: session } = useSession()
  const [tracks, setTracks] = useState<Track[]>(initialTracks || [])
  const [progress, setProgress] = useState<Progress | null>(initialProgress || null)
  const [loading, setLoading] = useState(!initialTracks)
  const [ratingTrack, setRatingTrack] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!initialTracks) {
      fetchTracks()
    }
  }, [albumId, session])

  const fetchTracks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/albums/${albumId}/tracks`)
      const data = await res.json()
      if (data.success) {
        setTracks(data.data.tracks)
        setProgress(data.data.progress)
      }
    } catch (error) {
      console.error("Failed to fetch tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRateTrack = async (trackId: string, rating: number) => {
    if (!session) return

    setRatingTrack(trackId)
    try {
      const res = await fetch(`/api/tracks/${trackId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      })

      if (res.ok) {
        // Update local state
        setTracks(prev => prev.map(t =>
          t.id === trackId ? { ...t, userRating: rating } : t
        ))
        // Recalculate progress
        setProgress(prev => {
          if (!prev) return prev
          const newRated = prev.rated + (tracks.find(t => t.id === trackId)?.userRating === null ? 1 : 0)
          const newRatings = tracks.map(t =>
            t.id === trackId ? rating : t.userRating
          ).filter((r): r is number => r !== null)
          const newAvg = newRatings.length > 0
            ? newRatings.reduce((a, b) => a + b, 0) / newRatings.length
            : null
          return {
            ...prev,
            rated: newRated,
            percent: Math.round((newRated / prev.total) * 100),
            userAverageRating: newAvg,
            isComplete: newRated === prev.total,
          }
        })
      }
    } catch (error) {
      console.error("Failed to rate track:", error)
    } finally {
      setRatingTrack(null)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="border border-[--border] p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[--muted] border-t-[--accent-primary] animate-spin" />
          <p className="text-sm text-[--muted]">Loading tracks...</p>
        </div>
      </div>
    )
  }

  if (tracks.length === 0) {
    return null
  }

  // Group by disc if multiple discs
  const hasMultipleDiscs = tracks.some(t => t.discNumber > 1)
  const tracksByDisc = hasMultipleDiscs
    ? tracks.reduce((acc, track) => {
        if (!acc[track.discNumber]) acc[track.discNumber] = []
        acc[track.discNumber].push(track)
        return acc
      }, {} as Record<number, Track[]>)
    : { 1: tracks }

  const visibleTracks = expanded ? tracks : tracks.slice(0, 5)

  return (
    <div className="border border-[--border] animate-fade-in">
      {/* Header with Progress */}
      <div className="p-4 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[--muted]">Tracklist</h3>
          </div>
          {session && progress && (
            <Tooltip content={`You've rated ${progress.rated} of ${progress.total} tracks${progress.userAverageRating ? ` (avg: ${progress.userAverageRating.toFixed(1)})` : ""}`}>
              <div className="flex items-center gap-2 cursor-help">
                <div className="w-20 h-1 bg-[--border] overflow-hidden">
                  <div
                    className={`h-full transition-all ${progress.isComplete ? "bg-green-500" : "bg-[--accent-primary]"}`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[--muted] tabular-nums">
                  {progress.rated}/{progress.total}
                </span>
                {progress.isComplete && (
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </Tooltip>
          )}
        </div>
        {!session && (
          <span className="text-[10px] text-[--muted] tracking-wide">Sign in to rate tracks</span>
        )}
      </div>

      {/* Track List */}
      <div className="divide-y divide-[--border]/50">
        {(expanded ? Object.entries(tracksByDisc) : [[1, visibleTracks]]).map(([disc, discTracks]) => (
          <div key={String(disc)}>
            {hasMultipleDiscs && expanded && (
              <div className="px-4 py-2 bg-[--muted]/5 text-[10px] text-[--muted] uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Disc {String(disc)}
              </div>
            )}
            {(discTracks as Track[]).map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                isLoggedIn={!!session}
                isRating={ratingTrack === track.id}
                onRate={(rating) => handleRateTrack(track.id, rating)}
                formatDuration={formatDuration}
                animationDelay={index * 30}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Expand/Collapse */}
      {tracks.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="track-row w-full p-3 text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-[--accent-primary] transition-all border-t border-[--border] flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show less
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show all {tracks.length} tracks
            </>
          )}
        </button>
      )}
    </div>
  )
}

// Individual track row component - NO INLINE STYLES FOR COLORS
// All colors are handled by CSS in globals.css
function TrackRow({
  track,
  isLoggedIn,
  isRating,
  onRate,
  formatDuration,
  animationDelay = 0
}: {
  track: Track
  isLoggedIn: boolean
  isRating: boolean
  onRate: (rating: number) => void
  formatDuration: (ms: number) => string
  animationDelay?: number
}) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [showRater, setShowRater] = useState(false)

  const displayRating = hoverRating ?? track.userRating

  return (
    <div
      className="track-row px-4 py-2.5 flex items-center gap-3 border-l-2 border-l-transparent transition-all group animate-fade-in hover:bg-[--surface-hover] hover:border-l-[--accent-primary]"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Track number */}
      <span className="track-number w-6 text-center text-sm tabular-nums font-medium transition-colors text-[--muted] group-hover:text-[--accent-primary]">
        {track.trackNumber}
      </span>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        {/* Track name */}
        <p className="track-name text-sm truncate transition-colors text-[--foreground] group-hover:text-[--accent-primary]">
          {track.name}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-[--muted]">
          <span className="tabular-nums">{formatDuration(track.durationMs)}</span>
          {track.averageRating !== null && (
            <>
              <span className="opacity-50">·</span>
              <span className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                {track.averageRating.toFixed(1)}
              </span>
            </>
          )}
          {track.totalReviews > 0 && (
            <>
              <span className="opacity-50">·</span>
              <span>{track.totalReviews} ratings</span>
            </>
          )}
        </div>
      </div>

      {/* Rating UI */}
      {isLoggedIn && (
        <div className="flex items-center gap-1">
          {showRater || track.userRating !== null ? (
            <div
              className="flex items-center gap-0.5"
              onMouseLeave={() => {
                setHoverRating(null)
                if (track.userRating === null) setShowRater(false)
              }}
            >
              {[2, 4, 6, 8, 10].map((rating) => (
                <button
                  key={rating}
                  disabled={isRating}
                  onClick={() => onRate(rating)}
                  onMouseEnter={() => setHoverRating(rating)}
                  className={`w-5 h-5 text-xs font-bold transition-all disabled:opacity-50 ${
                    displayRating !== null && rating <= displayRating
                      ? "bg-[--accent-primary] text-black"
                      : "bg-[--border] text-[--muted] hover:bg-[--border-dim]"
                  }`}
                  title={`Rate ${rating}/10`}
                >
                  {rating === 10 && (
                    <svg className="w-3 h-3 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              {displayRating !== null && (
                <span className="ml-1.5 text-xs font-bold tabular-nums text-[--accent-primary] w-5 text-center">
                  {displayRating}
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowRater(true)}
              className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] tracking-wide uppercase text-[--muted] hover:text-[--accent-hover] border border-[--border] group-hover:border-[--muted]/50 hover:border-[--accent-primary]/50 transition-all bg-[--surface]"
            >
              Rate
            </button>
          )}
        </div>
      )}

      {/* Show user's rating if not in edit mode */}
      {!isLoggedIn && track.averageRating !== null && (
        <span className="text-sm font-bold text-[--accent-primary] tabular-nums">
          {track.averageRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
