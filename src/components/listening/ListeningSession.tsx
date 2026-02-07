"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DefaultAvatar } from "@/components/default-avatar"
import { HeadphonesIcon, WarningIcon, MusicNoteIcon } from "@/components/icons/ui-icons"

interface Track {
  id: string
  name: string
  trackNumber: number
  durationMs: number
  previewUrl: string | null
}

interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge: string | null
  tracks: Track[]
}

interface User {
  id: string
  username: string
  image: string | null
}

interface Message {
  id: string
  userId: string
  content: string
  type: string
  createdAt: string
  user: User
}

interface Session {
  id: string
  inviteCode: string
  title: string | null
  status: string
  isPlaying: boolean
  currentTrackIndex: number
  playbackPosition: number
  host: User
  guest: User | null
  currentAlbum: Album | null
  messages: Message[]
  isHost: boolean
  canJoin: boolean
}

interface ListeningSessionProps {
  inviteCode: string
  currentUserId: string
}

export function ListeningSession({ inviteCode, currentUserId }: ListeningSessionProps) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playingPromiseRef = useRef<Promise<void> | null>(null)

  // Fetch session data
  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/listening/${inviteCode}`)
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Session not found")
        return
      }
      const data = await response.json()
      setSession(data.session)
      setLocalMessages(data.session.messages || [])
      setError(null)
    } catch (err) {
      setError("Failed to load session")
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [inviteCode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages])

  // Sync audio playback with proper promise handling
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !session?.currentAlbum?.tracks[session.currentTrackIndex]?.previewUrl) {
      return
    }

    if (session.isPlaying) {
      playingPromiseRef.current = audio.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          console.warn("Audio autoplay blocked by browser")
        }
      })
    } else {
      if (playingPromiseRef.current) {
        playingPromiseRef.current.then(() => audio.pause()).catch(() => audio.pause())
      } else {
        audio.pause()
      }
    }
  }, [session?.isPlaying, session?.currentTrackIndex, session?.currentAlbum])

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/listening/${inviteCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      })
      if (response.ok) {
        fetchSession()
      }
    } catch (err) {
      console.error("Action failed:", err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/listening/${inviteCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_message", message: message.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.message) {
          setLocalMessages((prev) => [...prev, data.message])
        }
        setMessage("")
      }
    } finally {
      setSending(false)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-[--muted]">Loading session...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <div className="mb-4"><WarningIcon size={40} /></div>
        <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
        <p className="text-[--muted] mb-6">{error || "This listening session doesn't exist or has ended."}</p>
        <Link
          href="/listen"
          className="inline-flex px-6 py-2 bg-white text-black font-bold text-sm"
        >
          Back to Sessions
        </Link>
      </div>
    )
  }

  const currentTrack = session.currentAlbum?.tracks[session.currentTrackIndex]

  if (session.status === "ended") {
    return (
      <div className="text-center py-12">
        <div className="mb-4"><HeadphonesIcon size={40} /></div>
        <h2 className="text-xl font-bold mb-2">Session Ended</h2>
        <p className="text-[--muted] mb-6">Thanks for listening together!</p>
        <Link
          href="/listen"
          className="inline-flex px-6 py-2 bg-white text-black font-bold text-sm"
        >
          Back to Sessions
        </Link>
      </div>
    )
  }

  if (session.status === "waiting" && !session.isHost) {
    return (
      <div className="text-center py-12">
        <div className="mb-4"><HeadphonesIcon size={40} /></div>
        <h2 className="text-xl font-bold mb-2">Join Listening Session</h2>
        <p className="text-[--muted] mb-6">
          @{session.host.username} invited you to listen together
        </p>
        <button
          onClick={() => handleAction("join")}
          className="inline-flex px-6 py-2 bg-white text-black font-bold text-sm"
        >
          Join Session
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/listen"
          className="inline-flex items-center gap-2 text-xs text-[--muted] hover:text-white transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{session.title || "Listening Session"}</h1>
            <p className="text-sm text-[--muted] font-mono">Code: {session.inviteCode}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Now Playing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Album display */}
          {session.currentAlbum ? (
            <div className="border border-[--border] p-6">
              <div className="flex gap-6">
                <div className="w-40 h-40 flex-shrink-0">
                  {session.currentAlbum.coverArtUrlLarge || session.currentAlbum.coverArtUrl ? (
                    <img
                      src={session.currentAlbum.coverArtUrlLarge || session.currentAlbum.coverArtUrl!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[--border]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[--muted] uppercase tracking-wider mb-1">Now Playing</p>
                  <Link
                    href={`/album/${session.currentAlbum.spotifyId}`}
                    className="hover:underline"
                  >
                    <h2 className="text-2xl font-bold truncate">{session.currentAlbum.title}</h2>
                  </Link>
                  <p className="text-[--muted]">{session.currentAlbum.artistName}</p>

                  {currentTrack && (
                    <div className="mt-4">
                      <p className="font-medium">
                        {currentTrack.trackNumber}. {currentTrack.name}
                      </p>
                      <p className="text-xs text-[--muted]">
                        {formatTime(currentTrack.durationMs)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden audio element for preview */}
              {currentTrack?.previewUrl && (
                <audio ref={audioRef} src={currentTrack.previewUrl} />
              )}

              {/* Controls - Host only */}
              {session.isHost && (
                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-[--border]">
                  <button
                    onClick={() => handleAction("change_track", {
                      trackIndex: Math.max(0, session.currentTrackIndex - 1),
                    })}
                    className="p-2 hover:bg-[--surface] transition-colors"
                    disabled={session.currentTrackIndex === 0}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAction(session.isPlaying ? "pause" : "play")}
                    className="p-4 bg-white text-black rounded-full hover:bg-white/90 transition-colors"
                  >
                    {session.isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction("change_track", {
                      trackIndex: Math.min(
                        (session.currentAlbum?.tracks.length || 1) - 1,
                        session.currentTrackIndex + 1
                      ),
                    })}
                    className="p-2 hover:bg-[--surface] transition-colors"
                    disabled={
                      session.currentTrackIndex >= (session.currentAlbum?.tracks.length || 1) - 1
                    }
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Track list */}
              <div className="mt-6 pt-6 border-t border-[--border] max-h-48 overflow-y-auto">
                {session.currentAlbum.tracks.map((track, i) => (
                  <button
                    key={track.id}
                    onClick={() => session.isHost && handleAction("change_track", { trackIndex: i })}
                    disabled={!session.isHost}
                    className={`w-full flex items-center gap-3 py-2 px-3 text-left transition-colors ${
                      i === session.currentTrackIndex
                        ? "bg-white/10"
                        : session.isHost
                        ? "hover:bg-[--surface]"
                        : ""
                    } ${!session.isHost ? "cursor-default" : ""}`}
                  >
                    <span className="text-xs text-[--muted] w-5">{track.trackNumber}</span>
                    <span className="flex-1 text-sm truncate">{track.name}</span>
                    <span className="text-xs text-[--muted]">{formatTime(track.durationMs)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[--border] p-12 text-center">
              <div className="mb-4"><MusicNoteIcon size={40} /></div>
              <p className="text-[--muted]">
                {session.isHost
                  ? "Select an album to start listening"
                  : "Waiting for host to select an album"}
              </p>
            </div>
          )}

          {/* Session controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 border-2 border-[--background] overflow-hidden">
                  {session.host.image ? (
                    <img src={session.host.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <DefaultAvatar size="sm" className="w-full h-full" />
                  )}
                </div>
                {session.guest && (
                  <div className="w-8 h-8 border-2 border-[--background] overflow-hidden">
                    {session.guest.image ? (
                      <img src={session.guest.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultAvatar size="sm" className="w-full h-full" />
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  @{session.host.username}
                  {session.guest && ` & @${session.guest.username}`}
                </p>
                <p className="text-xs text-[--muted]">
                  {session.guest ? "Listening together" : "Waiting for guest"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!session.isHost && session.guest && (
                <button
                  onClick={() => handleAction("leave")}
                  className="px-4 py-2 border border-[--border] text-sm hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  Leave
                </button>
              )}
              {session.isHost && (
                <button
                  onClick={() => handleAction("end")}
                  className="px-4 py-2 border border-[--border] text-sm hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="border border-[--border] flex flex-col h-[600px]">
          <div className="p-4 border-b border-[--border]">
            <h3 className="font-bold">Session Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {localMessages.length === 0 ? (
              <p className="text-center text-[--muted] text-sm py-8">
                No messages yet. Say hi!
              </p>
            ) : (
              localMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.user.username === session.host.username ||
                    msg.user.username === session.guest?.username
                      ? ""
                      : "opacity-50"
                  }`}
                >
                  <div className="w-6 h-6 flex-shrink-0 overflow-hidden">
                    {msg.user.image ? (
                      <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultAvatar size="sm" className="w-full h-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[--muted]">@{msg.user.username}</p>
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-[--border]">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 bg-transparent border border-[--border] text-sm focus:border-white outline-none transition-colors"
                disabled={!session.guest && !session.isHost}
              />
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="px-4 py-2 bg-white text-black font-bold text-sm disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
