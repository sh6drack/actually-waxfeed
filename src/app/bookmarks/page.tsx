"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { BookmarkFilledIcon } from "@/components/icons"

interface BookmarkedAlbum {
  id: string
  createdAt: string
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl: string | null
    coverArtUrlMedium: string | null
    releaseDate: string
    genres: string[]
    averageRating: number | null
    totalReviews: number
  }
}

export default function BookmarksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkedAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/bookmarks")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchBookmarks()
    }
  }, [status, page])

  const fetchBookmarks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookmarks?page=${page}&limit=24`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        if (page === 1) {
          setBookmarks(data.data.bookmarks)
        } else {
          setBookmarks(prev => [...prev, ...data.data.bookmarks])
        }
        setTotal(data.data.total)
        setHasMore(data.data.hasMore)
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err)
    }
    setLoading(false)
  }

  const removeBookmark = async (albumId: string) => {
    try {
      const res = await fetch(`/api/albums/${albumId}/bookmark`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.album.id !== albumId))
        setTotal(prev => prev - 1)
      }
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[--border] border-t-[--accent-primary] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-12 xl:px-20 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookmarkFilledIcon size={24} className="text-[--accent-primary]" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Saved Albums</h1>
          </div>
          <p className="text-sm text-[--muted]">
            {total} {total === 1 ? 'album' : 'albums'} saved for later
          </p>
        </div>
        <Link
          href="/quick-rate"
          className="px-4 py-2 border border-[--muted-faint] text-[--muted] text-sm uppercase tracking-wider hover:border-[--accent-primary] hover:text-[--accent-primary] transition-colors"
        >
          Discover More
        </Link>
      </div>

      {/* Content */}
      {loading && bookmarks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[--border] border-t-[--accent-primary] animate-spin" />
            <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading saved albums</span>
          </div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookmarkFilledIcon size={48} className="text-[--muted-faint] mb-4" />
          <h2 className="text-xl font-bold mb-2">No saved albums yet</h2>
          <p className="text-[--muted] mb-6 max-w-md">
            Save albums you want to listen to later. Look for the bookmark icon on album pages and in quick-rate.
          </p>
          <Link
            href="/quick-rate"
            className="px-6 py-3 bg-[--accent-primary] text-black font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors"
          >
            Start Rating
          </Link>
        </div>
      ) : (
        <>
          {/* Album Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="group relative">
                <Link href={`/album/${bookmark.album.spotifyId}`}>
                  <div className="aspect-square relative overflow-hidden bg-[--surface]">
                    {bookmark.album.coverArtUrlMedium || bookmark.album.coverArtUrl ? (
                      <img
                        src={bookmark.album.coverArtUrlMedium || bookmark.album.coverArtUrl!}
                        alt={bookmark.album.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--muted]/30">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    )}
                    {/* Rating badge */}
                    {bookmark.album.averageRating !== null && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold">
                        {bookmark.album.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium truncate">{bookmark.album.title}</h3>
                    <p className="text-xs text-[--muted] truncate">{bookmark.album.artistName}</p>
                  </div>
                </Link>
                {/* Remove button */}
                <button
                  onClick={() => removeBookmark(bookmark.album.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/70 border border-[--border] flex items-center justify-center text-[--accent-primary] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  title="Remove from saved"
                >
                  <BookmarkFilledIcon size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="px-8 py-3 border border-[--muted-faint] text-[--muted] font-bold uppercase tracking-wider hover:border-[--accent-primary] hover:text-[--accent-primary] transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
