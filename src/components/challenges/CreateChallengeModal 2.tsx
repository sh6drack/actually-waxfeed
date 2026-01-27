"use client"

import { useState, useEffect } from "react"
import { DefaultAvatar } from "@/components/default-avatar"

interface CreateChallengeModalProps {
  partnerId?: string | null
  onClose: () => void
  onCreate: (data: {
    partnerId: string
    challengeType: string
    targetAlbumId?: string
    targetGenre?: string
    targetDecade?: string
  }) => void
}

interface SearchUser {
  id: string
  username: string
  image: string | null
}

const CHALLENGE_TYPES = [
  {
    id: "rate_same_album",
    label: "Rate Same Album",
    icon: "⚔️",
    description: "Both rate the same album - highest rating wins!",
  },
  {
    id: "genre_swap",
    label: "Genre Swap",
    icon: "🔄",
    description: "Rate 3 albums from a genre you don't usually listen to",
  },
  {
    id: "decade_dive",
    label: "Decade Dive",
    icon: "📅",
    description: "Explore music from a specific decade together",
  },
  {
    id: "discover_together",
    label: "Discover Together",
    icon: "🔍",
    description: "Find and rate new albums neither of you have heard",
  },
]

const DECADES = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]

export function CreateChallengeModal({
  partnerId: initialPartnerId,
  onClose,
  onCreate,
}: CreateChallengeModalProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartnerId || null)
  const [selectedPartner, setSelectedPartner] = useState<SearchUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [targetGenre, setTargetGenre] = useState("")
  const [targetDecade, setTargetDecade] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search for users
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.users || [])
        }
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectPartner = (user: SearchUser) => {
    setSelectedPartnerId(user.id)
    setSelectedPartner(user)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleCreate = async () => {
    if (!selectedType || !selectedPartnerId) return

    setLoading(true)
    setError(null)

    try {
      onCreate({
        partnerId: selectedPartnerId,
        challengeType: selectedType,
        targetGenre: selectedType === "genre_swap" ? targetGenre : undefined,
        targetDecade: selectedType === "decade_dive" ? targetDecade : undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create challenge")
      setLoading(false)
    }
  }

  const needsAdditionalInput =
    (selectedType === "genre_swap" && !targetGenre) ||
    (selectedType === "decade_dive" && !targetDecade)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[--background] border border-[--border] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[--border]">
          <div>
            <h2 className="text-lg font-bold">Create Challenge</h2>
            {selectedPartner && (
              <p className="text-xs text-[--muted]">Challenge @{selectedPartner.username}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[--surface] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Partner selection */}
          {!selectedPartnerId ? (
            <div>
              <label className="text-xs text-[--muted] uppercase tracking-wider block mb-2">
                Challenge Who?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a user..."
                  className="w-full px-3 py-2 bg-transparent border border-[--border] text-sm focus:border-white outline-none transition-colors"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border border-[--border] divide-y divide-[--border]">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectPartner(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[--surface] transition-colors"
                    >
                      <div className="w-8 h-8 overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <DefaultAvatar size="sm" className="w-full h-full" />
                        )}
                      </div>
                      <span className="font-medium">@{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border border-[--border]">
              <div className="flex items-center gap-3">
                {selectedPartner && (
                  <>
                    <div className="w-8 h-8 overflow-hidden">
                      {selectedPartner.image ? (
                        <img src={selectedPartner.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <DefaultAvatar size="sm" className="w-full h-full" />
                      )}
                    </div>
                    <span className="font-medium">@{selectedPartner.username}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedPartnerId(null)
                  setSelectedPartner(null)
                }}
                className="text-xs text-[--muted] hover:text-white"
              >
                Change
              </button>
            </div>
          )}

          {/* Custom title */}
          <div>
            <label className="text-xs text-[--muted] uppercase tracking-wider block mb-2">
              Challenge Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your challenge a name..."
              className="w-full px-3 py-2 bg-transparent border border-[--border] text-sm focus:border-white outline-none transition-colors"
            />
          </div>

          {/* Challenge type selection */}
          <div>
            <label className="text-xs text-[--muted] uppercase tracking-wider block mb-2">
              Challenge Type
            </label>
            <div className="space-y-2">
              {CHALLENGE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full p-3 border text-left transition-colors ${
                    selectedType === type.id
                      ? "border-white bg-white/5"
                      : "border-[--border] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-[--muted]">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional inputs based on type */}
          {selectedType === "genre_swap" && (
            <div>
              <label className="text-xs text-[--muted] uppercase tracking-wider block mb-2">
                Target Genre
              </label>
              <input
                type="text"
                value={targetGenre}
                onChange={(e) => setTargetGenre(e.target.value)}
                placeholder="e.g., jazz, metal, country..."
                className="w-full px-3 py-2 bg-transparent border border-[--border] text-sm focus:border-white outline-none transition-colors"
              />
            </div>
          )}

          {selectedType === "decade_dive" && (
            <div>
              <label className="text-xs text-[--muted] uppercase tracking-wider block mb-2">
                Target Decade
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DECADES.map((decade) => (
                  <button
                    key={decade}
                    onClick={() => setTargetDecade(decade)}
                    className={`py-2 text-sm border transition-colors ${
                      targetDecade === decade
                        ? "border-white bg-white text-black"
                        : "border-[--border] hover:border-white/30"
                    }`}
                  >
                    {decade}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-[--border]">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[--border] text-sm font-medium hover:border-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedType || !selectedPartnerId || needsAdditionalInput || loading}
            className="flex-1 py-2 bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Send Challenge"}
          </button>
        </div>
      </div>
    </div>
  )
}
