"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ChallengeCard } from "@/components/challenges/ChallengeCard"
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal"

interface Challenge {
  id: string
  challengeType: string
  title: string | null
  status: string
  targetAlbumId: string | null
  targetGenre: string | null
  targetDecade: string | null
  creatorProgress: Record<string, unknown> | null
  partnerProgress: Record<string, unknown> | null
  winnerId: string | null
  expiresAt: string
  createdAt: string
  completedAt: string | null
  creator: {
    id: string
    username: string
    image: string | null
  }
  partner: {
    id: string
    username: string
    image: string | null
  }
  targetAlbum?: {
    id: string
    spotifyId: string
    name: string
    artist: string
    imageUrl: string | null
  }
}

type TabType = "active" | "pending" | "completed"

export default function ChallengesPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<TabType>("active")
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    fetchChallenges()
  }, [session?.user?.id, status])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/challenges")
      if (response.ok) {
        const data = await response.json()
        setChallenges(data.challenges)
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })
      if (response.ok) {
        fetchChallenges()
      }
    } catch (err) {
      console.error("Failed to accept challenge:", err)
    }
  }

  const handleDecline = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      })
      if (response.ok) {
        fetchChallenges()
      }
    } catch (err) {
      console.error("Failed to decline challenge:", err)
    }
  }

  const handleCreateChallenge = async (data: {
    partnerId: string
    challengeType: string
    targetAlbumId?: string
    targetGenre?: string
    targetDecade?: string
  }) => {
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setShowCreateModal(false)
        setSelectedPartnerId(null)
        fetchChallenges()
      }
    } catch (err) {
      console.error("Failed to create challenge:", err)
    }
  }

  const filteredChallenges = challenges.filter((c) => {
    if (tab === "active") return c.status === "active"
    if (tab === "pending") return c.status === "pending"
    if (tab === "completed") return c.status === "completed" || c.status === "expired"
    return true
  })

  const pendingForMe = challenges.filter(
    (c) => c.status === "pending" && c.partner.id === session?.user?.id
  )

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
          <div className="text-6xl mb-6">🎯</div>
          <h1 className="text-3xl font-bold mb-4">Taste Challenges</h1>
          <p className="text-[--muted] mb-6">
            Sign in to challenge your friends to musical duels and discover new music together.
          </p>
          <Link
            href="/login?callbackUrl=/discover/challenges"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Sign In to Challenge
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="border-b border-[--border]">
        <div className="max-w-5xl mx-auto px-6 py-8 lg:py-12">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-xs text-[--muted] hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Discover
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">Taste Challenges</h1>
              <p className="text-[--muted] max-w-xl">
                Challenge friends to musical duels. Rate the same album, swap genres, or explore decades together.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
            >
              <span>+</span>
              New Challenge
            </button>
          </div>
        </div>
      </header>

      {/* Pending invites banner */}
      {pendingForMe.length > 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <p className="text-sm">
              <span className="font-bold text-yellow-400">{pendingForMe.length} challenge{pendingForMe.length > 1 ? "s" : ""}</span>
              {" "}waiting for your response
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[--border] sticky top-0 bg-[--background] z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-6 py-4">
            {(["active", "pending", "completed"] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm font-medium capitalize transition-colors ${
                  tab === t ? "text-white" : "text-[--muted] hover:text-white"
                }`}
              >
                {t}
                {t === "pending" && pendingForMe.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-yellow-500 text-black rounded-full">
                    {pendingForMe.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile create button */}
      <div className="lg:hidden px-6 py-4 border-b border-[--border]">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-black font-bold text-sm"
        >
          <span>+</span>
          New Challenge
        </button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[--border] p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[--border]" />
                  <div className="flex-1">
                    <div className="h-5 bg-[--border] w-1/3 mb-2" />
                    <div className="h-3 bg-[--border] w-1/4" />
                  </div>
                </div>
                <div className="h-16 bg-[--border]" />
              </div>
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="border-2 border-dashed border-[--border] p-12 text-center">
            <div className="text-4xl mb-4">
              {tab === "active" ? "🎮" : tab === "pending" ? "📬" : "🏆"}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {tab === "active"
                ? "No active challenges"
                : tab === "pending"
                ? "No pending challenges"
                : "No completed challenges yet"}
            </h3>
            <p className="text-[--muted] mb-6 max-w-md mx-auto">
              {tab === "active"
                ? "Start a challenge with a friend to compare your musical tastes!"
                : tab === "pending"
                ? "All caught up! No challenges waiting for you."
                : "Complete some challenges to see your history here."}
            </p>
            {tab !== "completed" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
              >
                Create Challenge
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={session.user.id}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateChallengeModal
          partnerId={selectedPartnerId}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedPartnerId(null)
          }}
          onCreate={handleCreateChallenge}
        />
      )}
    </div>
  )
}
