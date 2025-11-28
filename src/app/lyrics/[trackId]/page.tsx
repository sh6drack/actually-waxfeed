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
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFFF64] mb-6">
                <span className="text-black font-bold text-2xl">G</span>
              </div>
              <h2 className="text-xl font-bold mb-2">View Lyrics on Genius</h2>
              <p className="text-[#888] mb-6 max-w-md mx-auto">
                Full lyrics, annotations, and song meanings from the Genius community
              </p>
              {data.geniusUrl && (
                <a
                  href={data.geniusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#FFFF64] text-black px-8 py-3 font-bold hover:bg-[#FFFF80] transition-colors no-underline"
                >
                  <span>Open in Genius</span>
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
              <p className="text-xs text-[#555] mt-6">
                We link to Genius to respect copyright
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
