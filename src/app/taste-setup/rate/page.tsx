"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlMedium: string | null
}

export default function TasteSetupRatePage() {
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch popular albums for rating
  useEffect(() => {
    async function fetchAlbums() {
      try {
        const res = await fetch("/api/albums/popular?limit=30")
        const data = await res.json()
        if (data.success && data.albums) {
          setAlbums(data.albums)
        }
      } catch (error) {
        console.error("Failed to fetch albums:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlbums()
  }, [])

  const currentAlbum = albums[currentIndex]
  const ratedCount = Object.keys(ratings).length
  const canProceed = ratedCount >= 20

  const handleRate = async (rating: number) => {
    if (!currentAlbum) return

    const newRatings = { ...ratings, [currentAlbum.id]: rating }
    setRatings(newRatings)

    // Submit the review
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: currentAlbum.id,
          rating,
          text: null,
        }),
      })
    } catch (error) {
      console.error("Failed to submit rating:", error)
    }

    // Move to next album
    if (currentIndex < albums.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleSkip = () => {
    if (currentIndex < albums.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleComplete = async () => {
    if (!canProceed) return

    setIsSubmitting(true)

    try {
      // Compute TasteID
      await fetch("/api/tasteid/compute", { method: "POST" })
      router.push("/taste-setup/result")
    } catch (error) {
      console.error("Failed to compute TasteID:", error)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl uppercase tracking-wider animate-pulse">
          Loading albums...
        </div>
      </div>
    )
  }

  if (albums.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-xl">No albums available for rating.</p>
          <Link href="/" className="text-neutral-400 hover:text-white">
            Go to homepage →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-white" />
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            RATE ALBUMS
          </h1>
          <p className="text-neutral-400">
            Rate at least 20 albums to generate your TasteID
          </p>
        </div>

        {/* Rating progress */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 ${i < ratedCount ? "bg-white" : "bg-neutral-800"}`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-neutral-500">
          {ratedCount} / 20 minimum
        </p>

        {/* Current album */}
        {currentAlbum && !canProceed && (
          <div className="space-y-6">
            {/* Album display */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-64 h-64 border-2 border-white">
                {currentAlbum.coverArtUrlMedium || currentAlbum.coverArtUrl ? (
                  <img
                    src={currentAlbum.coverArtUrlMedium || currentAlbum.coverArtUrl || ""}
                    alt={currentAlbum.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800" />
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{currentAlbum.title}</h2>
                <p className="text-neutral-400">{currentAlbum.artistName}</p>
              </div>
            </div>

            {/* Rating buttons */}
            <div className="space-y-4">
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleRate(i)}
                    className={`
                      aspect-square border-2 border-white font-bold text-sm
                      hover:bg-white hover:text-black transition-colors
                      ${ratings[currentAlbum.id] === i ? "bg-white text-black" : ""}
                    `}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-neutral-500 uppercase">
                <span>Skip it</span>
                <span>Masterpiece</span>
              </div>
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="w-full py-3 text-neutral-500 hover:text-white transition-colors"
            >
              Haven't heard it? Skip →
            </button>
          </div>
        )}

        {/* Completion state */}
        {canProceed && (
          <div className="space-y-6 text-center">
            <div className="text-4xl">🎉</div>
            <h2 className="text-2xl font-bold uppercase">NICE TASTE!</h2>
            <p className="text-neutral-400">
              You've rated {ratedCount} albums. Ready to see your TasteID?
            </p>

            {/* Rated albums grid */}
            <div className="flex justify-center gap-2 flex-wrap">
              {albums
                .filter((a) => ratings[a.id] !== undefined)
                .slice(0, 5)
                .map((album) => (
                  <div key={album.id} className="text-center">
                    <div className="w-12 h-12 border border-white">
                      {album.coverArtUrlMedium || album.coverArtUrl ? (
                        <img
                          src={album.coverArtUrlMedium || album.coverArtUrl || ""}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800" />
                      )}
                    </div>
                    <span className="text-xs font-bold">{ratings[album.id]}</span>
                  </div>
                ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-wider text-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "COMPUTING..." : "REVEAL MY TASTEID"}
            </button>

            {currentIndex < albums.length - 1 && (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                Keep rating for better accuracy →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
