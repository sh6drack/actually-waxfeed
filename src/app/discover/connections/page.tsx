"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ConnectionCard } from "@/components/connections"
import { SignatureComparison } from "@/components/connections/SignatureComparison"
import type { EnhancedTasteMatch, ListeningSignature } from "@/lib/tasteid"

type ConnectionMode = "all" | "twins" | "opposites" | "guides"

const MODE_CONFIG: Record<ConnectionMode, { label: string; description: string; icon: string }> = {
  all: { label: "All Connections", description: "Everyone with potential musical chemistry", icon: "🎵" },
  twins: { label: "Taste Twins", description: "Your musical soulmates with nearly identical taste", icon: "👯" },
  opposites: { label: "Opposite Attracts", description: "Different tastes that could expand your horizons", icon: "🔄" },
  guides: { label: "Explorer Guides", description: "People who can introduce you to new music", icon: "🧭" },
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
}

export default function ConnectionsPage() {
  const { data: session, status } = useSession()
  const [mode, setMode] = useState<ConnectionMode>("all")
  const [connections, setConnections] = useState<EnhancedTasteMatch[]>([])
  const [userSignature, setUserSignature] = useState<ListeningSignature | null>(null)
  const [userTasteId, setUserTasteId] = useState<{ archetype: string; reviewCount: number; polarityScore: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<EnhancedTasteMatch | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [connectionsRes, tasteRes] = await Promise.all([
          fetch(`/api/connections/discover?mode=${mode}&limit=50`),
          fetch("/api/tasteid/me"),
        ])

        if (!connectionsRes.ok) {
          const data = await connectionsRes.json()
          setError(data.message || data.error)
          setConnections([])
          return
        }

        const connectionsData: ConnectionsResponse = await connectionsRes.json()
        setConnections(connectionsData.connections)
        setUserTasteId(connectionsData.userTasteId)

        if (tasteRes.ok) {
          const tasteData = await tasteRes.json()
          setUserSignature(tasteData.tasteId?.polarity12?.listeningSignature || null)
        }
      } catch (err) {
        setError("Failed to load connections")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session?.user?.id, mode, status])

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
      setConnections(prev => prev.filter(c => c.userId !== targetUserId))
      if (selectedConnection?.userId === targetUserId) {
        setSelectedConnection(null)
      }
    } catch (err) {
      console.error("Failed to dismiss:", err)
    }
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
          <div className="text-6xl mb-6">🎵</div>
          <h1 className="text-3xl font-bold mb-4">Taste Connections</h1>
          <p className="text-[--muted] mb-6">
            Sign in to discover people who share your musical taste—or can expand your horizons.
          </p>
          <Link
            href="/login?callbackUrl=/discover/connections"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Sign In to Connect
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
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
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">Taste Connections</h1>
              <p className="text-[--muted] max-w-xl">
                Find your musical tribe. Polarity-powered matching connects you with people based on how you listen, not just what you listen to.
              </p>
            </div>
            {userTasteId && (
              <div className="hidden lg:block text-right">
                <p className="text-xs text-[--muted] uppercase tracking-wider mb-1">Your Profile</p>
                <p className="font-bold">{userTasteId.archetype}</p>
                <p className="text-sm text-[--muted]">{userTasteId.reviewCount} reviews</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mode tabs */}
      <div className="border-b border-[--border] sticky top-0 bg-[--background] z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {(Object.entries(MODE_CONFIG) as [ConnectionMode, typeof MODE_CONFIG.all][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  mode === key
                    ? "bg-white text-black"
                    : "text-[--muted] hover:text-white"
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-sm text-[--muted] mb-8">{MODE_CONFIG[mode].description}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border border-[--border] p-4 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-[--border]" />
                  <div className="flex-1">
                    <div className="h-5 bg-[--border] w-2/3 mb-2" />
                    <div className="h-3 bg-[--border] w-1/2" />
                  </div>
                </div>
                <div className="h-20 bg-[--border]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border-2 border-dashed border-[--border] p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">More reviews needed</h3>
            <p className="text-[--muted] mb-6 max-w-md mx-auto">{error}</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
            >
              Find Albums to Review
            </Link>
          </div>
        ) : connections.length === 0 ? (
          <div className="border-2 border-dashed border-[--border] p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No connections found</h3>
            <p className="text-[--muted] max-w-md mx-auto">
              No matches found for this category. Try a different filter or check back as more users join.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connection list */}
            <div className="lg:col-span-2 space-y-4">
              {connections.map((connection, i) => (
                <div
                  key={connection.userId}
                  onClick={() => setSelectedConnection(connection)}
                  className={`cursor-pointer transition-all ${
                    selectedConnection?.userId === connection.userId
                      ? "ring-2 ring-white"
                      : ""
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
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

            {/* Detailed comparison panel */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                {selectedConnection && userSignature ? (
                  <div className="border border-[--border] p-6">
                    <h3 className="text-lg font-bold mb-4">Signature Comparison</h3>
                    <p className="text-xs text-[--muted] mb-6">
                      How your listening patterns compare with @{selectedConnection.username}
                    </p>

                    <div className="flex justify-center mb-6">
                      <SignatureComparison
                        userSignature={userSignature}
                        otherSignature={selectedConnection.networkResonance as unknown as ListeningSignature}
                        userName="You"
                        otherName={selectedConnection.username}
                        size={220}
                        animated
                      />
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[--muted]">Signature Similarity</span>
                        <span className="font-bold">{Math.round(selectedConnection.signatureSimilarity * 100)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[--muted]">Genre Overlap</span>
                        <span className="font-bold">{selectedConnection.genreOverlap}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[--muted]">Rating Alignment</span>
                        <span className="font-bold">{selectedConnection.ratingAlignment}%</span>
                      </div>
                    </div>

                    {selectedConnection.potentialIntroductions.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-[--border]">
                        <p className="text-xs text-[--muted] uppercase tracking-wider mb-2">
                          Could introduce you to
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedConnection.potentialIntroductions.map((intro, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 border border-[--border]"
                            >
                              {intro}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-[--border] p-6 text-center">
                    <p className="text-[--muted] text-sm">
                      Click on a connection to see detailed comparison
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
