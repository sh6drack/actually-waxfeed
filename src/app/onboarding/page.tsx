"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { DefaultAvatar } from "@/components/default-avatar"
import { RatingSlider } from "@/components/rating-slider"
import { COUNTRIES } from "@/data/countries"
import { useCustomization, ACCENT_COLORS, AccentColor, CARD_STYLES, CardStyle } from "@/components/customization-provider"

const TOTAL_STEPS = 5
const REQUIRED_RATINGS = 20

// Scientific mood/vibe descriptors for TasteID Polarity Model
// These map to psychological and acoustic dimensions
const VIBE_TAGS = [
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'chill', label: 'Chill', emoji: '🌊' },
  { id: 'emotional', label: 'Emotional', emoji: '💔' },
  { id: 'hype', label: 'Hype', emoji: '🔥' },
  { id: 'nostalgic', label: 'Nostalgic', emoji: '📼' },
  { id: 'experimental', label: 'Experimental', emoji: '🔬' },
  { id: 'timeless', label: 'Timeless', emoji: '💎' },
  { id: 'dark', label: 'Dark', emoji: '🌑' },
] as const

interface Album {
  id: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge: string | null
  genres: string[]
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { settings, updateSetting } = useCustomization()

  const [step, setStep] = useState(1)
  const [username, setUsername] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [country, setCountry] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Quick Rate state
  const [albums, setAlbums] = useState<Album[]>([])
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [rating, setRating] = useState(5)
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [ratedCount, setRatedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    // Don't auto-redirect during onboarding - let user complete all steps
    // The FirstTimeWelcome modal and header CTAs will guide them here if needed
  }, [session, status, router])

  // Fetch albums when reaching step 5
  useEffect(() => {
    if (step === 5 && albums.length === 0) {
      fetchAlbums()
    }
  }, [step])

  const fetchAlbums = async () => {
    setLoadingAlbums(true)
    try {
      // For onboarding, get popular/well-reviewed albums for broader appeal
      const res = await fetch('/api/albums/swipe?limit=30&onboarding=true', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setAlbums(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err)
    }
    setLoadingAlbums(false)
  }

  const checkUsername = async (value: string) => {
    if (value.length < 3) return
    setChecking(true)
    try {
      const res = await fetch(`/api/users?q=${value}`)
      const data = await res.json()
      if (data.data?.some((u: { username: string }) => u.username?.toLowerCase() === value.toLowerCase())) {
        setError("Username already taken")
      } else {
        setError("")
      }
    } catch {
      // Ignore check errors
    }
    setChecking(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setImage(data.url)
      } else {
        setError(data.error || "Upload failed")
      }
    } catch {
      setError("Upload failed")
    }

    setUploading(false)
  }

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to set username")
        setLoading(false)
        return
      }

      await update()
      setStep(2)
    } catch {
      setError("Something went wrong")
    }
    setLoading(false)
  }

  const handlePhotoComplete = async () => {
    if (image) {
      // Save the image to user profile
      try {
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        })
        await update()
      } catch {
        // Continue anyway
      }
    }
    setStep(3)
  }

  const handleCountrySubmit = async () => {
    if (!country) {
      setError("Please select your country")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      })

      if (!res.ok) {
        setError("Failed to save country")
        setLoading(false)
        return
      }

      await update()
      setStep(4)
    } catch {
      setError("Something went wrong")
    }
    setLoading(false)
  }

  const submitRating = async () => {
    if (currentAlbumIndex >= albums.length) return

    const album = albums[currentAlbumIndex]
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          albumId: album.id,
          rating,
          text: '',
          isQuickRate: true,
          vibes: selectedVibes, // Pass selected vibes for TasteID Polarity Model
        }),
      })
      const data = await res.json()

      if (data.success) {
        setRatedCount((prev) => prev + 1)
        nextAlbum()
      } else {
        // If album already rated, just skip to next
        if (data.error?.includes('already reviewed')) {
          nextAlbum()
        } else {
          setError(data.error || 'Failed to submit rating')
        }
      }
    } catch (err) {
      console.error('Failed to submit rating:', err)
      setError('Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const skip = () => {
    setSkippedCount((prev) => prev + 1)
    nextAlbum()
  }

  const nextAlbum = () => {
    setRating(5)
    setSelectedVibes([])
    setError("")
    setCurrentAlbumIndex((prev) => prev + 1)
  }

  const toggleVibe = (vibeId: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibeId) 
        ? prev.filter(v => v !== vibeId)
        : prev.length < 3 ? [...prev, vibeId] : prev // Max 3 vibes
    )
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (step !== 5 || submitting) return
      if (e.key === 'Enter') {
        e.preventDefault()
        submitRating()
      }
      if (e.key === 's' || e.key === 'S') {
        skip()
      }
    },
    [step, submitRating, skip, submitting]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Trigger TasteID computation with the new ratings
      await fetch('/api/tasteid/compute', { method: 'POST', credentials: 'include' })
    } catch {
      // Continue anyway
    }
    setLoading(false)
    router.push("/")
  }

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[--border] border-t-[var(--accent-primary)] animate-spin" />
          <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading</span>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentAlbumIndex]
  const isRatingComplete = ratedCount >= REQUIRED_RATINGS || currentAlbumIndex >= albums.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full px-4 lg:px-12 xl:px-20 max-w-xl mx-auto py-8">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 transition-colors ${step >= s ? "bg-[var(--accent-primary)]" : "bg-[--border]"}`}
            />
          ))}
        </div>

        {/* Step 1: Username */}
        {step === 1 && (
          <>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] mb-4">
              Step 1 of {TOTAL_STEPS}
            </p>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Claim Your Identity</h1>
            <p className="text-[--muted] mb-8">
              Your username is your handle for earning badges and climbing the leaderboard.
              Choose wisely—this is how people will remember you.
            </p>

            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-[--muted] mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[--muted]/70">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (e.target.value.length >= 3) {
                        checkUsername(e.target.value)
                      }
                    }}
                    placeholder="username"
                    className="w-full pl-8"
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-zA-Z0-9_]+$"
                    required
                    autoFocus
                  />
                </div>
                {checking && (
                  <p className="text-xs text-[--muted] mt-1">Checking availability...</p>
                )}
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
                <p className="text-xs text-[--muted]/70 mt-2">
                  3-30 characters, letters, numbers, and underscores only
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !!error || checking || username.length < 3}
                className="w-full bg-white text-black py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Setting up..." : "Continue"}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Photo */}
        {step === 2 && (
          <>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] mb-4">
              Step 2 of {TOTAL_STEPS}
            </p>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Show Your Face</h1>
            <p className="text-[--muted] mb-8">
              When you earn badges and climb the leaderboard, people will see this.
              Make it memorable.
            </p>

            <div className="flex flex-col items-center gap-6 mb-8">
              <div
                className="relative w-32 h-32 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover border border-[--border]"
                  />
                ) : (
                  <DefaultAvatar size="lg" className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-sm text-[--muted]">
                Click to upload • Max 5MB
              </p>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePhotoComplete}
                className="flex-1 border border-[--border] py-4 px-6 font-bold text-lg hover:bg-[--surface] transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handlePhotoComplete}
                disabled={!image}
                className="flex-1 bg-white text-black py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {image ? "Continue" : "Add a photo"}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Country */}
        {step === 3 && (
          <>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] mb-4">
              Step 3 of {TOTAL_STEPS}
            </p>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Where You At?</h1>
            <p className="text-[--muted] mb-8">
              This helps us personalize your music recommendations.
              We'll prioritize music from your region and similar markets.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm text-[--muted] mb-2">Search countries</label>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full"
                  autoFocus
                />
              </div>

              <div className="h-64 overflow-y-auto border border-[--border]">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c.code)
                      setError("")
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      country === c.code
                        ? 'bg-[var(--accent-primary)] text-black'
                        : 'hover:bg-[--surface]'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span>{c.name}</span>
                    {country === c.code && (
                      <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <button
              onClick={handleCountrySubmit}
              disabled={loading || !country}
              className="w-full bg-white text-black py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </>
        )}

        {/* Step 4: Customize */}
        {step === 4 && (
          <>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] mb-4">
              Step 4 of {TOTAL_STEPS}
            </p>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Make It Yours</h1>
            <p className="text-[--muted] mb-8">
              Customize how Waxfeed looks. You can always change these later in Settings.
            </p>

            <div className="space-y-8 mb-8">
              {/* Accent Color */}
              <div>
                <label className="block text-sm text-[--muted] mb-3">Accent Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(ACCENT_COLORS) as AccentColor[]).filter(k => k !== 'custom').map((colorKey) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => updateSetting('accentColor', colorKey)}
                      className={`aspect-square border-2 transition-all ${
                        settings.accentColor === colorKey
                          ? 'border-white scale-110'
                          : 'border-transparent hover:border-[--border]'
                      }`}
                      style={{ backgroundColor: ACCENT_COLORS[colorKey].primary }}
                      title={ACCENT_COLORS[colorKey].name}
                    />
                  ))}
                </div>
              </div>

              {/* Card Style */}
              <div>
                <label className="block text-sm text-[--muted] mb-3">Card Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(CARD_STYLES) as CardStyle[]).map((styleKey) => (
                    <button
                      key={styleKey}
                      type="button"
                      onClick={() => updateSetting('cardStyle', styleKey)}
                      className={`p-4 border transition-all text-center ${
                        settings.cardStyle === styleKey
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : 'border-[--border] hover:border-[#666]'
                      }`}
                    >
                      <span className="text-sm font-medium">{CARD_STYLES[styleKey].name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="border border-[--border] p-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted] mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 bg-[--surface]"
                    style={{
                      borderRadius: settings.cardStyle === 'outlined' ? '0' : '4px',
                      boxShadow: settings.cardStyle === 'elevated' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                      border: settings.cardStyle === 'outlined' ? '2px solid var(--border)' : '1px solid var(--border)'
                    }}
                  />
                  <div>
                    <p className="font-bold">Album Title</p>
                    <p className="text-sm text-[--muted]">Artist Name</p>
                    <p className="text-sm font-bold mt-1" style={{ color: 'var(--accent-primary)' }}>8.5</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(5)}
                className="flex-1 border border-[--border] py-4 px-6 font-bold text-lg hover:bg-[--surface] transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex-1 bg-white text-black py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 5: Quick Rate */}
        {step === 5 && (
          <>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] mb-4">
              Step 5 of {TOTAL_STEPS}
            </p>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">Train Your Taste</h1>
            <p className="text-[--muted] mb-6">
              Rate {REQUIRED_RATINGS} albums so we can understand your music taste.
              Skip anything you haven't heard.
            </p>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[--muted]">{ratedCount} of {REQUIRED_RATINGS} rated</span>
                {skippedCount > 0 && (
                  <span className="text-[--muted]/70">{skippedCount} skipped</span>
                )}
              </div>
              <div className="w-full h-2 bg-[--border]">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                  style={{ width: `${(ratedCount / REQUIRED_RATINGS) * 100}%` }}
                />
              </div>
            </div>

            {loadingAlbums ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[--border] border-t-[var(--accent-primary)] animate-spin mb-4" />
                <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading albums</span>
              </div>
            ) : isRatingComplete ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-[var(--accent-primary)]">
                  <span className="text-4xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-[--muted] mb-2">You rated</p>
                <p className="text-5xl font-bold text-[var(--accent-primary)] mb-2 tabular-nums">{ratedCount}</p>
                <p className="text-[--muted] mb-8">albums</p>
                <p className="text-sm text-[--muted]/70 mb-8">
                  We're building your TasteID now. The more you rate, the better your recommendations.
                </p>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-[var(--accent-primary)] text-black px-8 py-4 font-bold text-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Computing TasteID..." : "Enter Waxfeed"}
                </button>
              </div>
            ) : currentAlbum ? (
              <div className="space-y-6">
                {/* Album Card */}
                <div className="border border-[--border]">
                  <div className="aspect-square relative overflow-hidden">
                    {currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl ? (
                      <img
                        src={currentAlbum.coverArtUrlLarge || currentAlbum.coverArtUrl!}
                        alt={currentAlbum.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[--surface] flex items-center justify-center">
                        <svg className="w-20 h-20 text-[--border]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-1 truncate">{currentAlbum.title}</h2>
                    <p className="text-[--muted] truncate">{currentAlbum.artistName}</p>
                    {currentAlbum.genres && currentAlbum.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {currentAlbum.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="text-[10px] px-2 py-1 border border-[--border] text-[--muted]/70 uppercase tracking-wider"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vibe Tags - for TasteID Polarity Model */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[--muted] uppercase tracking-wider">Describe the vibe (optional)</p>
                    <p className="text-[10px] text-[--muted]/70">{selectedVibes.length}/3</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VIBE_TAGS.map((vibe) => (
                      <button
                        key={vibe.id}
                        type="button"
                        onClick={() => toggleVibe(vibe.id)}
                        disabled={submitting}
                        className={`px-3 py-2 text-sm font-medium transition-all ${
                          selectedVibes.includes(vibe.id)
                            ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]'
                            : 'bg-transparent text-[--muted] border-[--border] hover:border-[#666] hover:text-white'
                        } border`}
                      >
                        <span className="mr-1">{vibe.emoji}</span>
                        {vibe.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-4">
                  <RatingSlider value={rating} onChange={setRating} disabled={submitting} />

                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={skip}
                      disabled={submitting}
                      className="flex-1 py-4 border border-[--border] text-[--muted] font-bold uppercase tracking-wider hover:border-white hover:text-white transition-colors disabled:opacity-50"
                    >
                      Haven't Heard
                    </button>
                    <button
                      onClick={submitRating}
                      disabled={submitting}
                      className="flex-1 py-4 bg-[var(--accent-primary)] text-black font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Rate'}
                    </button>
                  </div>

                  <p className="text-center text-xs text-[--muted]/70">
                    <kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">Enter</kbd> to rate · <kbd className="px-1.5 py-0.5 border border-[--border] text-[10px]">S</kbd> to skip
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[--muted] mb-4">No more albums available.</p>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-[var(--accent-primary)] text-black px-8 py-4 font-bold text-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Continue to Waxfeed"}
                </button>
              </div>
            )}

            {/* Skip to finish option */}
            {!isRatingComplete && ratedCount >= 5 && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="text-[--muted]/70 text-sm hover:text-white transition-colors"
                >
                  Skip and finish with {ratedCount} ratings →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
