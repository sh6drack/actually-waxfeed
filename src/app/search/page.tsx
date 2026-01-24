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
  averageRating: number | null
  totalReviews: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [spotifyResults, setSpotifyResults] = useState<SpotifyAlbum[]>([])
  const [localResults, setLocalResults] = useState<LocalAlbum[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "local" | "spotify">("all")

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSpotifyResults([])
      setLocalResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/albums/search?q=${encodeURIComponent(q)}&source=both`)
      const data = await res.json()

      if (data.success) {
        setSpotifyResults(data.data.spotify || [])
        setLocalResults(data.data.local || [])
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
      await fetch("/api/albums/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyIds: [spotifyId] }),
      })
      // Refresh search to show imported album
      await search(query)
    } catch (error) {
      console.error("Import error:", error)
    }
    setImporting(null)
  }

  const filteredSpotify = activeTab === "local" ? [] : spotifyResults
  const filteredLocal = activeTab === "spotify" ? [] : localResults

  return (
    <>
      {/* Search Input */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for albums, artists..."
          className="w-full max-w-xl text-lg"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-[--border]">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 px-1 text-sm ${activeTab === "all" ? "border-b-2 border-white" : "text-[--muted]"}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("local")}
          className={`pb-2 px-1 text-sm ${activeTab === "local" ? "border-b-2 border-white" : "text-[--muted]"}`}
        >
          On Waxfeed ({localResults.length})
        </button>
        <button
          onClick={() => setActiveTab("spotify")}
          className={`pb-2 px-1 text-sm ${activeTab === "spotify" ? "border-b-2 border-white" : "text-[--muted]"}`}
        >
          Spotify ({spotifyResults.length})
        </button>
      </div>

      {loading ? (
        <p className="text-[--muted]">Searching...</p>
      ) : (
        <div className="space-y-12">
          {/* Local Results */}
          {filteredLocal.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">On Waxfeed</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredLocal.map((album) => (
                  <AlbumCard
                    key={album.id}
                    id={album.id}
                    spotifyId={album.spotifyId}
                    title={album.title}
                    artistName={album.artistName}
                    coverArtUrl={album.coverArtUrl}
                    averageRating={album.averageRating}
                    totalReviews={album.totalReviews}
                  />
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
                        <div className="aspect-square bg-[--border] relative overflow-hidden border border-[--border-dim]">
                          {album.images[0]?.url ? (
                            <img
                              src={album.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[--muted-dim]">
                              No Cover
                            </div>
                          )}
                          {!isImported && (
                            <button
                              onClick={() => importAlbum(album.id)}
                              disabled={importing === album.id}
                              className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold"
                            >
                              {importing === album.id ? "Importing..." : "Import to Waxfeed"}
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
                          <p className="text-[--muted-dim] text-xs">
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
          {query && !loading && filteredLocal.length === 0 && filteredSpotify.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[--muted]">No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Initial State */}
          {!query && (
            <div className="text-center py-12">
              <p className="text-[--muted]">Start typing to search for albums</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Search</h1>
      <Suspense fallback={<p className="text-[--muted]">Loading...</p>}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
