"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ConnectionCard } from "./ConnectionCard"
import type { EnhancedTasteMatch, ListeningSignature } from "@/lib/tasteid"

interface ConnectionsSectionProps {
  userId: string | undefined
}

type ConnectionMode = "all" | "twins" | "opposites" | "guides"

const MODE_CONFIG: Record<ConnectionMode, { label: string; description: string }> = {
  all: { label: "All", description: "All potential connections" },
  twins: { label: "Taste Twins", description: "People with very similar taste" },
  opposites: { label: "Opposite Attracts", description: "Different tastes to expand your horizons" },
  guides: { label: "Explorer Guides", description: "People who can introduce you to new music" },
}

interface ConnectionsResponse {
  connections: EnhancedTasteMatch[]
  grouped: {
    tasteTwins: EnhancedTasteMatch[]
    networkResonance: EnhancedTasteMatch[]
    oppositeAttracts: EnhancedTasteMatch[]
    explorerGuides: EnhancedTasteMatch[]
    genreBuddies: EnhancedTasteMatch[]
    complementary: EnhancedTasteMatch[]
  }
  total: number
  userTasteId: {
    archetype: string
    reviewCount: number
    polarityScore: number
  }
  error?: string
  message?: string
  reviewCount?: number
  required?: number
}

export function ConnectionsSection({ userId }: ConnectionsSectionProps) {
  const [mode, setMode] = useState<ConnectionMode>("all")
  const [connections, setConnections] = useState<EnhancedTasteMatch[]>([])
  const [userSignature, setUserSignature] = useState<ListeningSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsMoreReviews, setNeedsMoreReviews] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchConnections() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/connections/discover?mode=${mode}&limit=12`)
        const data: ConnectionsResponse = await response.json()

        if (!response.ok) {
          if (data.error === "More reviews needed" || data.error === "TasteID required") {
            setNeedsMoreReviews(true)
            setReviewCount(data.reviewCount || 0)
          } else {
            setError(data.error || "Failed to load connections")
          }
          setConnections([])
          return
        }

        setConnections(data.connections)
        setNeedsMoreReviews(false)

        // Fetch user signature for comparison visualizations
        const tasteResponse = await fetch(`/api/tasteid/me`)
        if (tasteResponse.ok) {
          const tasteData = await tasteResponse.json()
          setUserSignature(tasteData.tasteId?.polarity12?.listeningSignature || null)
        }
      } catch (err) {
        setError("Failed to load connections")
        setConnections([])
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()
  }, [userId, mode])

  const handleConnect = async (targetUserId: string) => {
    try {
      await fetch(`/api/connections/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      })
    } catch (err) {
      console.error("Failed to connect:", err)
    }
  }

  const handleDismiss = async (targetUserId: string) => {
    try {
      await fetch(`/api/connections/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      })
      // Remove from local state
      setConnections(prev => prev.filter(c => c.userId !== targetUserId))
    } catch (err) {
      console.error("Failed to dismiss:", err)
    }
  }

  if (!userId) {
    return (
      <div className="border-2 border-dashed border-[--border] p-8 text-center">
        <div className="text-3xl mb-3">🎵</div>
        <h3 className="text-lg font-bold mb-2">Discover Taste Connections</h3>
        <p className="text-sm text-[--muted] mb-4 max-w-md mx-auto">
          Sign in to find people who share your musical taste—or can expand your horizons.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold tracking-wide hover:bg-white/90 transition-colors"
        >
          Sign In to Connect
        </Link>
      </div>
    )
  }

  if (needsMoreReviews) {
    return (
      <div className="border-2 border-dashed border-[--border] p-8 text-center">
        <div className="text-3xl mb-3">📊</div>
        <h3 className="text-lg font-bold mb-2">Build Your TasteID</h3>
        <p className="text-sm text-[--muted] mb-4 max-w-md mx-auto">
          Review {20 - reviewCount} more albums to unlock taste connections.
          Your TasteID needs more data to find meaningful matches.
        </p>
        <div className="w-full max-w-xs mx-auto mb-4">
          <div className="h-2 bg-[--border] overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${(reviewCount / 20) * 100}%` }}
            />
          </div>
          <p className="text-xs text-[--muted] mt-1">{reviewCount} / 20 reviews</p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold tracking-wide hover:bg-white/90 transition-colors"
        >
          Find Albums to Review
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.entries(MODE_CONFIG) as [ConnectionMode, typeof MODE_CONFIG.all][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase whitespace-nowrap transition-colors ${
              mode === key
                ? "bg-white text-black"
                : "border border-[--border] text-[--muted] hover:border-white hover:text-white"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-[--muted] mb-6">{MODE_CONFIG[mode].description}</p>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-[--border] p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[--border]" />
                <div className="flex-1">
                  <div className="h-5 bg-[--border] w-2/3 mb-2" />
                  <div className="h-3 bg-[--border] w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="border-2 border-dashed border-[--border] p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-bold mb-2">Complete Your Brain ID</h3>
          <p className="text-sm text-[--muted] mb-4 max-w-md mx-auto">
            Review more albums to build your Brain ID and unlock taste connections.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold tracking-wide hover:bg-white/90 transition-colors"
          >
            Find Albums to Review
          </Link>
        </div>
      ) : connections.length === 0 ? (
        <div className="border-2 border-dashed border-[--border] p-8 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="text-lg font-bold mb-2">No connections found</h3>
          <p className="text-sm text-[--muted] max-w-md mx-auto">
            {mode === "twins"
              ? "No taste twins found yet. Keep reviewing to improve your matches!"
              : mode === "opposites"
              ? "No opposite taste profiles found. More users need to build their TasteIDs."
              : mode === "guides"
              ? "No explorer guides available right now."
              : "No potential connections found. More users are joining every day!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection, i) => (
            <div
              key={connection.userId}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <ConnectionCard
                connection={connection}
                userSignature={userSignature}
                onConnect={handleConnect}
                onDismiss={handleDismiss}
                showActions
              />
            </div>
          ))}
        </div>
      )}

      {/* View all link */}
      {connections.length > 0 && (
        <div className="mt-6 text-center">
          <Link
            href="/discover/connections"
            className="text-xs text-[--muted] hover:text-white transition-colors"
          >
            View all connections →
          </Link>
        </div>
      )}
    </div>
  )
}
