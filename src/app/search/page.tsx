"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AlbumCard } from "@/components/album-card"
import Link from "next/link"

interface SpotifyAlbum {
  id: string
  name: string
  album_type: string
  images: { url: string }[]
  artists: { name: string }[]
  release_date: string
}

interface LocalAlbum {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  releaseDate: string | null
  averageRating: number | null
  totalReviews: number
}

interface Track {
  id: string
  spotifyId: string
  name: string
  trackNumber: number
  durationMs: number
  averageRating: number | null
  totalReviews: number
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl: string | null
    coverArtUrlMedium: string | null
  }
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [spotifyResults, setSpotifyResults] = useState<SpotifyAlbum[]>([])
  const [localResults, setLocalResults] = useState<LocalAlbum[]>([])
  const [trackResults, setTrackResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "albums" | "tracks" | "spotify">("all")

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSpotifyResults([])
      setLocalResults([])
      setTrackResults([])
      return
    }

    setLoading(true)
    try {
      // Search albums and tracks in parallel
      const [albumRes, trackRes] = await Promise.all([
        fetch(`/api/albums/search?q=${encodeURIComponent(q)}&source=both`),
        fetch(`/api/tracks/search?q=${encodeURIComponent(q)}&limit=20`)
      ])
      
      const albumData = await albumRes.json()
      const trackData = await trackRes.json()

      if (albumData.success) {
        setSpotifyResults(albumData.data.spotify || [])
        setLocalResults(albumData.data.local || [])
      }
      
      if (trackData.success) {
        setTrackResults(trackData.data.tracks || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(debounce)
  }, [query, search])

  const importAlbum = async (spotifyId: string) => {
    setImporting(spotifyId)
    try {
      const res = await fetch("/api/albums/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyIds: [spotifyId] }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        console.error("Import failed:", data.error || data)
        alert(data.error || "Failed to import album")
        setImporting(null)
        return
      }

      // Refresh search to show imported album
      await search(query)
    } catch (error) {
      console.error("Import error:", error)
      alert("Failed to import album. Please try again.")
    }
    setImporting(null)
  }

  const showAlbums = activeTab === "all" || activeTab === "albums"
  const showTracks = activeTab === "all" || activeTab === "tracks"
  const showSpotify = activeTab === "all" || activeTab === "spotify"

  const filteredSpotify = showSpotify ? spotifyResults : []
  const filteredLocal = showAlbums ? localResults : []
  const filteredTracks = showTracks ? trackResults : []

  return (
    <>
      {/* Search Input */}
      <div className="mb-6 sm:mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search albums, songs, artists..."
          className="w-full max-w-xl text-base sm:text-lg min-h-[48px] px-4"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-4 mb-6 sm:mb-8 border-b border-[--border] overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 px-2 sm:px-3 text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px] flex items-end ${activeTab === "all" ? "border-b-2 border-[--foreground]" : "text-[--muted]"}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("albums")}
          className={`pb-2 px-2 sm:px-3 text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px] flex items-end ${activeTab === "albums" ? "border-b-2 border-[--foreground]" : "text-[--muted]"}`}
        >
          Albums <span className="hidden sm:inline ml-1">({localResults.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("tracks")}
          className={`pb-2 px-2 sm:px-3 text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px] flex items-end ${activeTab === "tracks" ? "border-b-2 border-[--foreground]" : "text-[--muted]"}`}
        >
          Songs <span className="hidden sm:inline ml-1">({trackResults.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("spotify")}
          className={`pb-2 px-2 sm:px-3 text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px] flex items-end ${activeTab === "spotify" ? "border-b-2 border-[--foreground]" : "text-[--muted]"}`}
        >
          Spotify <span className="hidden sm:inline ml-1">({spotifyResults.length})</span>
        </button>
      </div>

      {loading ? (
        <p className="text-[--muted]">Searching...</p>
      ) : (
        <div className="space-y-12">
          {/* Local Album Results */}
          {filteredLocal.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">Albums on Waxfeed</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredLocal.map((album) => (
                  <AlbumCard
                    key={album.id}
                    id={album.id}
                    spotifyId={album.spotifyId}
                    title={album.title}
                    artistName={album.artistName}
                    coverArtUrl={album.coverArtUrl}
                    releaseDate={album.releaseDate}
                    averageRating={album.averageRating}
                    totalReviews={album.totalReviews}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Track Results */}
          {filteredTracks.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">Songs</h2>
              <div className="space-y-2">
                {filteredTracks.map((track) => (
                  <TrackResult key={track.id} track={track} />
                ))}
              </div>
            </section>
          )}

          {/* Spotify Results */}
          {filteredSpotify.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">From Spotify</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredSpotify.map((album) => {
                  const isImported = localResults.some(l => l.spotifyId === album.id)
                  return (
                    <div key={album.id} className="group">
                      <div className="w-40">
                        <div className="aspect-square bg-[--surface] relative overflow-hidden border border-[--border]">
                          {album.images[0]?.url ? (
                            <img
                              src={album.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[--muted]/70">
                              No Cover
                            </div>
                          )}
                          {!isImported && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                importAlbum(album.id)
                              }}
                              disabled={importing === album.id}
                              className="absolute bottom-0 left-0 right-0 z-10 bg-[var(--accent-primary)] text-black py-2 text-xs font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {importing === album.id ? "Importing..." : "+ Import"}
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          {isImported ? (
                            <Link
                              href={`/album/${album.id}`}
                              className="font-bold text-sm truncate block hover:underline"
                            >
                              {album.name}
                            </Link>
                          ) : (
                            <p className="font-bold text-sm truncate">{album.name}</p>
                          )}
                          <p className="text-[--muted] text-xs truncate">
                            {album.artists.map(a => a.name).join(", ")}
                          </p>
                          <p className="text-[--muted]/70 text-xs">
                            {album.album_type} • {album.release_date?.split("-")[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Empty State */}
          {query && !loading && filteredLocal.length === 0 && filteredSpotify.length === 0 && filteredTracks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[--muted]">No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Initial State */}
          {!query && (
            <div className="text-center py-12">
              <p className="text-[--muted]">Start typing to search for albums and songs</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// Track search result row
function TrackResult({ track }: { track: Track }) {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Link
      href={`/album/${track.album.id}`}
      className="flex items-center gap-4 p-3 border border-[--border] hover:bg-[--border]/20 transition-colors no-underline group"
    >
      {/* Album art */}
      <div className="w-12 h-12 flex-shrink-0 bg-[--border]">
        {track.album.coverArtUrlMedium || track.album.coverArtUrl ? (
          <img
            src={track.album.coverArtUrlMedium || track.album.coverArtUrl || ""}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[--muted] text-xs">
            No Cover
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-[var(--accent-primary)] transition-colors">
          {track.name}
        </p>
        <p className="text-sm text-[--muted] truncate">
          {track.album.artistName} · {track.album.title}
        </p>
      </div>

      {/* Duration */}
      <div className="text-sm text-[--muted] tabular-nums">
        {formatDuration(track.durationMs)}
      </div>

      {/* Rating */}
      {track.averageRating !== null && (
        <div className="text-sm font-bold text-[var(--accent-primary)] tabular-nums">
          {track.averageRating.toFixed(1)}
        </div>
      )}
      {track.totalReviews > 0 && (
        <div className="text-xs text-[--muted]">
          {track.totalReviews} {track.totalReviews === 1 ? "rating" : "ratings"}
        </div>
      )}
    </Link>
  )
}

export default function SearchPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-12 xl:px-20 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter mb-6 sm:mb-8">Search</h1>
      <Suspense fallback={<p className="text-[--muted]">Loading...</p>}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
