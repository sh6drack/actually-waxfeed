"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface LyricsData {
  track: {
    id: string
    name: string
    artistName: string
    albumTitle: string
    coverArtUrl: string | null
  }
  lyrics: string | null
  geniusUrl: string | null
  geniusId: string | null
  source: string
  notFound: boolean
  songDetails?: {
    description: string
    releaseDate: string
    writers: string[]
    producers: string[]
    albumName: string
  }
}

export default function LyricsPage() {
  const params = useParams()
  const trackId = params.trackId as string

  const [data, setData] = useState<LyricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        const res = await fetch(`/api/lyrics/${trackId}`)
        const json = await res.json()

        if (!res.ok) {
          setError(json.error || "Failed to load lyrics")
          return
        }

        setData(json.data)
      } catch {
        setError("Failed to load lyrics")
      } finally {
        setLoading(false)
      }
    }

    if (trackId) {
      fetchLyrics()
    }
  }, [trackId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#222] w-1/3 mb-4"></div>
          <div className="h-4 bg-[#222] w-1/2 mb-8"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[#222] w-full"></div>
            <div className="h-4 bg-[#222] w-5/6"></div>
            <div className="h-4 bg-[#222] w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="border border-[#222] p-8 text-center">
          <p className="text-[#888] mb-4">{error || "Track not found"}</p>
          <Link href="/" className="text-white hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {/* Album Art */}
        <div className="w-32 h-32 bg-[#222] flex-shrink-0">
          {data.track.coverArtUrl ? (
            <img
              src={data.track.coverArtUrl}
              alt={data.track.albumTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#666]">
              No Cover
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tighter mb-1 truncate">
            {data.track.name}
          </h1>
          <p className="text-xl text-[#888] mb-2">{data.track.artistName}</p>
          <p className="text-sm text-[#666]">From: {data.track.albumTitle}</p>

          {/* Song Details */}
          {data.songDetails && (
            <div className="mt-4 space-y-1 text-sm text-[#888]">
              {data.songDetails.releaseDate && (
                <p>Released: {data.songDetails.releaseDate}</p>
              )}
              {data.songDetails.writers.length > 0 && (
                <p>Written by: {data.songDetails.writers.slice(0, 3).join(", ")}</p>
              )}
              {data.songDetails.producers.length > 0 && (
                <p>Produced by: {data.songDetails.producers.slice(0, 3).join(", ")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lyrics Content */}
      <div className="border border-[#222] p-6">
        {data.notFound ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-[#444]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-[#888] mb-2">Lyrics not found for this track</p>
            <p className="text-sm text-[#666]">
              We couldn&apos;t find lyrics on Genius for this song
            </p>
          </div>
        ) : (
          <>
            {/* Description */}
            {data.songDetails?.description && (
              <div className="mb-6 pb-6 border-b border-[#222]">
                <h2 className="text-sm font-bold text-[#888] uppercase tracking-wide mb-2">
                  About
                </h2>
                <p className="text-sm text-[#ccc] leading-relaxed">
                  {data.songDetails.description}
                </p>
              </div>
            )}

            {/* Link to Genius */}
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-[#FFFF64]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.075 2.001c-5.493 0-9.952 4.458-9.952 9.952 0 5.493 4.459 9.952 9.952 9.952s9.951-4.459 9.951-9.952c0-5.494-4.458-9.952-9.951-9.952zm0 18.218c-4.564 0-8.266-3.702-8.266-8.266s3.702-8.266 8.266-8.266 8.266 3.702 8.266 8.266-3.702 8.266-8.266 8.266z" />
                <path d="M13.703 8.138c-.37-.147-.802-.22-1.295-.22-.985 0-1.757.305-2.314.917-.558.612-.837 1.467-.837 2.565 0 1.098.279 1.954.837 2.565.558.612 1.329.917 2.314.917.493 0 .925-.073 1.295-.22.37-.147.696-.355.978-.624l.037-.035V12.19H12.22v1.395h1.483v.633c-.185.125-.396.218-.634.279-.237.06-.502.09-.793.09-.618 0-1.096-.19-1.434-.571-.337-.38-.506-.92-.506-1.617s.169-1.236.506-1.617c.338-.38.816-.571 1.434-.571.291 0 .556.03.793.09.238.061.449.154.634.279v-1.56a3.38 3.38 0 00-.978-.624 3.224 3.224 0 00-.022-.008z" />
              </svg>
              <p className="text-[#888] mb-4">
                View full lyrics and annotations on Genius
              </p>
              {data.geniusUrl && (
                <a
                  href={data.geniusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#FFFF64] text-black px-6 py-3 font-bold hover:bg-[#FFFF80] transition-colors no-underline"
                >
                  <span>View on Genius</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
              <p className="text-xs text-[#666] mt-4">
                Lyrics provided by Genius. We link rather than display to respect copyright.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Back Link */}
      <div className="mt-6">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-[#888] hover:text-white transition-colors"
        >
          &larr; Back to album
        </button>
      </div>
    </div>
  )
}
