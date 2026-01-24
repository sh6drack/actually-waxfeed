"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DefaultAvatar } from "@/components/default-avatar"

interface ListeningSession {
  id: string
  title: string | null
  status: string
  inviteCode: string
  currentTrackIndex: number
  isPlaying: boolean
  createdAt: string
  host: {
    id: string
    username: string
    image: string | null
  }
  guest: {
    id: string
    username: string
    image: string | null
  } | null
  currentAlbum: {
    id: string
    spotifyId: string
    name: string
    artist: string
    imageUrl: string | null
  } | null
}

export default function ListenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<ListeningSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    fetchSessions()
  }, [session?.user?.id, status])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/listening")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    try {
      setCreating(true)
      setError(null)
      const response = await fetch("/api/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Listening Session" }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/listen/${data.session.inviteCode}`)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create session")
      }
    } catch (err) {
      setError("Failed to create session")
    } finally {
      setCreating(false)
    }
  }

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    try {
      setJoining(true)
      setError(null)
      const response = await fetch(`/api/listening/${joinCode.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      })

      if (response.ok) {
        router.push(`/listen/${joinCode.trim()}`)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to join session")
      }
    } catch (err) {
      setError("Failed to join session")
    } finally {
      setJoining(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[--muted]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎧</div>
          <h1 className="text-3xl font-bold mb-4">Shared Listening</h1>
          <p className="text-[--muted] mb-6">
            Sign in to listen to albums together with friends in real-time.
          </p>
          <Link
            href="/login?callbackUrl=/listen"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Sign In to Listen
          </Link>
        </div>
      </div>
    )
  }

  const activeSessions = sessions.filter((s) => s.status === "active" || s.status === "waiting")
  const endedSessions = sessions.filter((s) => s.status === "ended")

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="border-b border-[--border]">
        <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-xs text-[--muted] hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Discover
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">Shared Listening</h1>
          <p className="text-[--muted] max-w-xl">
            Listen to albums together with friends in real-time. Start a session and share the code.
          </p>
        </div>
      </header>

      {/* Actions */}
      <div className="border-b border-[--border]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create session */}
            <div className="border border-[--border] p-6">
              <h2 className="text-lg font-bold mb-2">Start a Session</h2>
              <p className="text-sm text-[--muted] mb-4">
                Create a new listening room and invite a friend to join.
              </p>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className="w-full px-5 py-3 bg-white text-black font-bold text-sm disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Session"}
              </button>
            </div>

            {/* Join session */}
            <div className="border border-[--border] p-6">
              <h2 className="text-lg font-bold mb-2">Join a Session</h2>
              <p className="text-sm text-[--muted] mb-4">
                Enter the invite code shared by a friend.
              </p>
              <form onSubmit={handleJoinSession} className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-3 bg-transparent border border-[--border] text-sm focus:border-white outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim() || joining}
                  className="px-5 py-3 bg-white text-black font-bold text-sm disabled:opacity-50"
                >
                  {joining ? "..." : "Join"}
                </button>
              </form>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Sessions */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-[--border] p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[--border]" />
                  <div className="flex-1">
                    <div className="h-5 bg-[--border] w-1/3 mb-2" />
                    <div className="h-3 bg-[--border] w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Active sessions */}
            {activeSessions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs uppercase tracking-wider text-[--muted] mb-4">Active Sessions</h2>
                <div className="space-y-4">
                  {activeSessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/listen/${s.inviteCode}`}
                      className="block border border-[--border] p-6 hover:border-white/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {s.currentAlbum?.imageUrl ? (
                          <img
                            src={s.currentAlbum.imageUrl}
                            alt=""
                            className="w-16 h-16 object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-[--surface] flex items-center justify-center text-2xl">
                            🎧
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">
                            {s.currentAlbum ? s.currentAlbum.name : s.title || "Listening Session"}
                          </h3>
                          <p className="text-sm text-[--muted]">
                            {s.currentAlbum?.artist || "No album selected"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 overflow-hidden">
                              {s.host.image ? (
                                <img src={s.host.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <DefaultAvatar size="sm" className="w-full h-full" />
                              )}
                            </div>
                            {s.guest && (
                              <>
                                <span className="text-[--muted]">+</span>
                                <div className="w-5 h-5 overflow-hidden">
                                  {s.guest.image ? (
                                    <img src={s.guest.image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <DefaultAvatar size="sm" className="w-full h-full" />
                                  )}
                                </div>
                              </>
                            )}
                            <span className="text-xs text-[--muted] ml-2">
                              {s.isPlaying ? "Playing" : "Paused"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[--muted]">{formatTime(s.createdAt)}</p>
                          <p className="text-xs font-mono mt-1">{s.inviteCode}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ended sessions */}
            {endedSessions.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-[--muted] mb-4">Past Sessions</h2>
                <div className="space-y-4">
                  {endedSessions.map((s) => (
                    <div
                      key={s.id}
                      className="border border-[--border] p-6 opacity-60"
                    >
                      <div className="flex items-center gap-4">
                        {s.currentAlbum?.imageUrl ? (
                          <img
                            src={s.currentAlbum.imageUrl}
                            alt=""
                            className="w-12 h-12 object-cover grayscale"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[--surface] flex items-center justify-center text-xl">
                            🎧
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {s.currentAlbum ? s.currentAlbum.name : s.title || "Listening Session"}
                          </h3>
                          <p className="text-sm text-[--muted]">
                            with @{s.guest?.username || "guest"}
                          </p>
                        </div>

                        <p className="text-xs text-[--muted]">{formatTime(s.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {sessions.length === 0 && (
              <div className="border-2 border-dashed border-[--border] p-12 text-center">
                <div className="text-4xl mb-4">🎧</div>
                <h3 className="text-xl font-bold mb-2">No listening sessions yet</h3>
                <p className="text-[--muted] max-w-md mx-auto">
                  Start a session and invite a friend to listen to music together in real-time.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
