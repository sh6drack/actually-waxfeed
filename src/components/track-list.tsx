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
      <div className="border border-[--border] p-4">
        <p className="text-sm text-[--muted]">Loading tracks...</p>
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
    <div className="border border-[--border]">
      {/* Header with Progress */}
      <div className="p-4 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">Tracklist</h3>
          {session && progress && (
            <Tooltip content={`You've rated ${progress.rated} of ${progress.total} tracks${progress.userAverageRating ? ` (avg: ${progress.userAverageRating.toFixed(1)})` : ""}`}>
              <div className="flex items-center gap-2 cursor-help">
                <div className="w-20 h-1.5 bg-[--border] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${progress.isComplete ? "bg-green-500" : "bg-[#ffd700]"}`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <span className="text-xs text-[--muted]">
                  {progress.rated}/{progress.total}
                </span>
                {progress.isComplete && (
                  <span className="text-xs text-green-500">✓</span>
                )}
              </div>
            </Tooltip>
          )}
        </div>
        {!session && (
          <span className="text-xs text-[--muted]">Sign in to rate tracks</span>
        )}
      </div>

      {/* Track List */}
      <div className="divide-y divide-[--border]">
        {(expanded ? Object.entries(tracksByDisc) : [[1, visibleTracks]]).map(([disc, discTracks]) => (
          <div key={disc}>
            {hasMultipleDiscs && expanded && (
              <div className="px-4 py-2 bg-[--border]/20 text-xs text-[--muted] uppercase tracking-wider">
                Disc {disc}
              </div>
            )}
            {(discTracks as Track[]).map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isLoggedIn={!!session}
                isRating={ratingTrack === track.id}
                onRate={(rating) => handleRateTrack(track.id, rating)}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Expand/Collapse */}
      {tracks.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 text-sm text-[--muted] hover:text-[--foreground] transition-colors border-t border-[--border]"
        >
          {expanded ? "Show less" : `Show all ${tracks.length} tracks`}
        </button>
      )}
    </div>
  )
}

// Individual track row component
function TrackRow({ 
  track, 
  isLoggedIn, 
  isRating, 
  onRate, 
  formatDuration 
}: { 
  track: Track
  isLoggedIn: boolean
  isRating: boolean
  onRate: (rating: number) => void
  formatDuration: (ms: number) => string
}) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [showRater, setShowRater] = useState(false)

  const displayRating = hoverRating ?? track.userRating

  return (
    <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-[--border]/10 transition-colors group">
      {/* Track number */}
      <span className="w-6 text-center text-sm text-[--muted] tabular-nums">
        {track.trackNumber}
      </span>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{track.name}</p>
        <div className="flex items-center gap-2 text-xs text-[--muted]">
          <span>{formatDuration(track.durationMs)}</span>
          {track.averageRating !== null && (
            <>
              <span>·</span>
              <span>{track.averageRating.toFixed(1)} avg</span>
            </>
          )}
          {track.totalReviews > 0 && (
            <>
              <span>·</span>
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
                      ? "bg-[#ffd700] text-black"
                      : "bg-[--border] text-[--muted] hover:bg-[#ffd700]/30"
                  }`}
                  title={`Rate ${rating}/10`}
                >
                  {rating === 10 ? "★" : ""}
                </button>
              ))}
              {displayRating !== null && (
                <span className="ml-1 text-xs font-bold tabular-nums text-[#ffd700] w-5 text-center">
                  {displayRating}
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowRater(true)}
              className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-[--muted] hover:text-[#ffd700] border border-transparent hover:border-[#ffd700]/30 transition-all"
            >
              Rate
            </button>
          )}
        </div>
      )}

      {/* Show user's rating if not in edit mode */}
      {!isLoggedIn && track.averageRating !== null && (
        <span className="text-sm font-bold text-[#ffd700]">
          {track.averageRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
