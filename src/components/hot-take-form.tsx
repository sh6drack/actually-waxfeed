"use client"

import { useState, useCallback } from "react"
import { HotTake } from "./hot-take-card"

interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  isSpotifyOnly?: boolean // true if not yet in database
}

interface HotTakeFormProps {
  album?: Album
  onSubmit: (data: {
    albumId: string
    stance: HotTake["stance"]
    content: string
  }) => Promise<void>
  onCancel?: () => void
}

const STANCES: { value: HotTake["stance"]; label: string; description: string }[] = [
  { value: "OVERRATED", label: "OVERRATED", description: "This album gets way more praise than it deserves" },
  { value: "UNDERRATED", label: "UNDERRATED", description: "This album is criminally slept on" },
  { value: "MASTERPIECE", label: "MASTERPIECE", description: "This is peak artistry, fight me" },
  { value: "TRASH", label: "TRASH", description: "This album is genuinely bad" },
  { value: "AHEAD_OF_TIME", label: "AHEAD OF ITS TIME", description: "People will appreciate this later" },
  { value: "DATED", label: "DATED", description: "This hasn't aged well" },
]

export function HotTakeForm({ album, onSubmit, onCancel }: HotTakeFormProps) {
  const [stance, setStance] = useState<HotTake["stance"] | null>(null)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Album search state (if no album provided)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Album[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(album || null)
  const [isSearching, setIsSearching] = useState(false)

  const searchAlbums = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/albums/search?q=${encodeURIComponent(query)}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        // Combine local and spotify results, prioritizing local (already in DB)
        const local: Album[] = data.data?.local || []
        const spotify = data.data?.spotify || []
        // Get spotifyIds already in local results to avoid duplicates
        const localSpotifyIds = new Set(local.map((a: Album) => a.spotifyId))
        // Map spotify results to match Album interface, excluding duplicates
        const spotifyMapped = spotify
          .filter((s: { id: string }) => !localSpotifyIds.has(s.id))
          .map((s: { id: string; name: string; artists: { name: string }[]; images: { url: string }[] }) => ({
            id: s.id,
            spotifyId: s.id,
            title: s.name,
            artistName: s.artists?.[0]?.name || 'Unknown Artist',
            coverArtUrl: s.images?.[0]?.url || null,
            isSpotifyOnly: true,
          }))
        setSearchResults([...local, ...spotifyMapped])
      }
    } catch {
      // Silently fail search
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Debounced search
    const timeoutId = setTimeout(() => searchAlbums(value), 300)
    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAlbum) {
      setError("Select an album first")
      return
    }
    if (!stance) {
      setError("Choose your stance")
      return
    }
    if (content.length < 10) {
      setError("Your take needs to be at least 10 characters")
      return
    }
    if (content.length > 280) {
      setError("Keep it under 280 characters")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let albumId = selectedAlbum.id

      // If album is from Spotify and not yet in DB, import it first
      if (selectedAlbum.isSpotifyOnly) {
        const importRes = await fetch("/api/albums/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spotifyIds: [selectedAlbum.spotifyId] }),
        })

        if (!importRes.ok) {
          throw new Error("Failed to import album")
        }

        // Fetch the album from DB to get the database ID
        const lookupRes = await fetch(`/api/albums/search?q=${encodeURIComponent(selectedAlbum.title)}&source=local&limit=10`)
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json()
          const imported = lookupData.data?.local?.find((a: Album) => a.spotifyId === selectedAlbum.spotifyId)
          if (imported) {
            albumId = imported.id
          } else {
            throw new Error("Album import failed")
          }
        } else {
          throw new Error("Failed to find imported album")
        }
      }

      await onSubmit({
        albumId,
        stance,
        content,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit hot take")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Album selection */}
      {!album && (
        <div>
          <label className="block text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
            Select Album
          </label>

          {selectedAlbum ? (
            <div className="flex items-center gap-4 p-4 border border-[--border] bg-[--surface]">
              <div className="w-16 h-16 flex-shrink-0 bg-[--surface]">
                {selectedAlbum.coverArtUrl && (
                  <img
                    src={selectedAlbum.coverArtUrl}
                    alt={selectedAlbum.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{selectedAlbum.title}</p>
                <p className="text-sm text-[--muted] truncate">{selectedAlbum.artistName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlbum(null)}
                className="text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-[--foreground]"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for an album..."
                className="w-full bg-transparent border border-[--border] px-4 py-3 text-[--foreground] placeholder-[--muted] focus:border-[--foreground] focus:outline-none"
              />

              {/* Search results dropdown */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-[--border] bg-[--background] z-10 max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-[--muted] text-sm">Searching...</div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setSelectedAlbum(result)
                          setSearchQuery("")
                          setSearchResults([])
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[--surface] transition-colors text-left"
                      >
                        <div className="w-10 h-10 flex-shrink-0 bg-[--surface]">
                          {result.coverArtUrl && (
                            <img
                              src={result.coverArtUrl}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{result.title}</p>
                          <p className="text-xs text-[--muted] truncate">{result.artistName}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stance selection */}
      <div>
        <label className="block text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
          Your Stance
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {STANCES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStance(s.value)}
              className={`p-4 border text-left transition-all ${
                stance === s.value
                  ? "border-[--foreground] bg-[--foreground] text-[--background]"
                  : "border-[--border] hover:border-[--foreground]/30"
              }`}
            >
              <span className="block text-sm font-bold tracking-wide">{s.label}</span>
              <span
                className={`block text-[10px] mt-1 ${
                  stance === s.value ? "text-[--muted]" : "text-[--muted]"
                }`}
              >
                {s.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* The hot take content */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
            Your Hot Take
          </label>
          <span
            className={`text-[10px] tracking-[0.1em] ${
              content.length > 280 ? "text-[#ff3b3b]" : "text-[--muted]"
            }`}
          >
            {content.length}/280
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Make your case. Be bold. Be controversial."
          rows={4}
          className="w-full bg-transparent border border-[--border] px-4 py-3 text-[--foreground] placeholder-[--muted] focus:border-[--foreground] focus:outline-none resize-none text-lg"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-[#ff3b3b] text-sm">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !selectedAlbum || !stance || content.length < 10}
          className="flex-1 bg-[--foreground] text-[--background] py-4 font-bold text-sm tracking-wide hover:bg-[--foreground]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "POSTING..." : "POST HOT TAKE"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-4 border border-[--border] font-bold text-sm tracking-wide hover:border-[--foreground] transition-colors"
          >
            CANCEL
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] tracking-[0.1em] uppercase text-[--muted]/70 text-center">
        Hot takes are meant to spark discussion. Be respectful, be bold.
      </p>
    </form>
  )
}
