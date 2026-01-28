"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { DefaultAvatar } from "@/components/default-avatar"
import { useTheme } from "@/components/theme-provider"
import {
  useCustomization,
  ACCENT_COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  LAYOUT_DENSITIES,
  CARD_STYLES,
  BACKGROUND_TEXTURES,
  GRID_COLUMNS,
  COVER_STYLES,
  REVIEW_DISPLAYS,
  HOMEPAGE_LAYOUTS,
  type AccentColor,
  type FontFamily,
  type FontSize,
  type LayoutDensity,
  type CardStyle,
  type BackgroundTexture,
  type GridColumns,
  type CoverStyle,
  type ReviewDisplay,
  type HomepageLayout,
} from "@/components/customization-provider"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { settings, updateSetting, resetSettings } = useCustomization()

  const [username, setUsername] = useState("")
  const [originalUsername, setOriginalUsername] = useState("")
  const [usernameChangesUsed, setUsernameChangesUsed] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [userRole, setUserRole] = useState<string | undefined>(undefined)
  const [bio, setBio] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    spotify: "",
    website: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.username) return
      try {
        const res = await fetch(`/api/users/${session.user.username}`)
        const data = await res.json()
        if (data.success) {
          setUsername(data.data.username || "")
          setOriginalUsername(data.data.username || "")
          setUsernameChangesUsed(data.data.usernameChangesUsed || 0)
          setIsPremium(data.data.isPremium || false)
          setUserRole(data.data.role)
          setBio(data.data.bio || "")
          setImage(data.data.image || null)
          setSocialLinks(data.data.socialLinks || {
            instagram: "",
            twitter: "",
            spotify: "",
            website: "",
          })
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }
    fetchProfile()
  }, [session?.user?.username])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMessage("")
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.url) {
        setImage(data.url)
        setMessage("Profile picture updated!")
        update()
      } else {
        setMessage(data.error || "Upload failed")
      }
    } catch {
      setMessage("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage("")

    try {
      const payload: Record<string, unknown> = {
        bio,
        socialLinks,
      }

      // Only include username if it changed
      if (username !== originalUsername) {
        payload.username = username
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Settings saved!")
        setOriginalUsername(username)
        if (data.data?.usernameChangesUsed !== undefined) {
          setUsernameChangesUsed(data.data.usernameChangesUsed)
        }
        await update()
        router.refresh()
      } else {
        setMessage(data.error || "Failed to save")
      }
    } catch {
      setMessage("Something went wrong")
    }

    setLoading(false)
  }

  // ADMIN and PREMIUM roles can always change username
  const hasPrivilegedRole = userRole === 'ADMIN' || userRole === 'PREMIUM'
  const canChangeUsername = usernameChangesUsed === 0 || isPremium || hasPrivilegedRole
  const usernameChanged = username !== originalUsername

  if (status === "loading") {
    return (
      <div className="w-full px-4 lg:px-12 xl:px-20 max-w-4xl py-8">
        <p className="text-[--muted]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-full px-4 lg:px-12 xl:px-20 max-w-4xl py-6 sm:py-8">
      <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter mb-6 sm:mb-8">Settings</h1>

      {/* Profile Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Profile</h2>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm text-[--muted] mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <label className="relative w-24 h-24 cursor-pointer group">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover border border-[--border-dim]"
                  />
                ) : (
                  <DefaultAvatar size="lg" className="w-full h-full" />
                )}
                {/* Hover overlay with plus icon */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
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
                {isUploading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              <div className="text-sm text-[--muted]">
                <p>Click to upload</p>
                <p className="text-xs text-[--muted-dim]">Max 4MB • JPEG, PNG, GIF, WebP</p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-[--muted] mb-2">Username</label>
            <div className="flex items-center gap-2">
              <span className="text-[--muted-dim]">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder="username"
                maxLength={30}
                className="flex-1 bg-[--surface] border border-[--border-dim] px-3 py-2 text-[--foreground] focus:outline-none focus:border-[--foreground] transition-colors"
              />
            </div>
            {usernameChanged && !canChangeUsername && (
              <p className="text-xs text-red-500 mt-1">
                Username change requires payment ($5) or premium subscription
              </p>
            )}
            {usernameChanged && canChangeUsername && usernameChangesUsed === 0 && (
              <p className="text-xs text-green-500 mt-1">
                First username change is free!
              </p>
            )}
            {!usernameChanged && (
              <p className="text-xs text-[--muted-dim] mt-1">
                {hasPrivilegedRole
                  ? "You can change your username anytime"
                  : usernameChangesUsed === 0
                    ? "First username change is free"
                    : isPremium
                      ? "Premium members can change username anytime"
                      : "Username changes cost $5"}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-[--muted] mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              placeholder="Tell people about yourself..."
              className="w-full"
            />
            <p className="text-xs text-[--muted-dim] mt-1">{bio.length}/150</p>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm text-[--muted] mb-2">Social Links</label>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-[--muted] text-sm sm:w-20">Instagram</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[--muted-dim]">@</span>
                  <input
                    type="text"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '') })}
                    placeholder="username"
                    className="flex-1 min-h-[44px]"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-[--muted] text-sm sm:w-20">Twitter/X</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[--muted-dim]">@</span>
                  <input
                    type="text"
                    value={socialLinks.twitter}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '') })}
                    placeholder="username"
                    className="flex-1 min-h-[44px]"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-[--muted] text-sm sm:w-20">Spotify</span>
                <input
                  type="text"
                  value={socialLinks.spotify}
                  onChange={(e) => setSocialLinks({ ...socialLinks, spotify: e.target.value })}
                  placeholder="Spotify profile URL"
                  className="flex-1 min-h-[44px]"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-[--muted] text-sm sm:w-20">Website</span>
                <input
                  type="text"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <button
          onClick={handleSave}
          disabled={loading || (usernameChanged && !canChangeUsername)}
          className="w-full sm:w-auto bg-white text-black px-6 py-3 min-h-[48px] font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        {message && (
          <p className={`text-sm ${message.includes("saved") || message.includes("updated") ? "text-green-500" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>

      {/* Customization Section */}
      <section className="mt-12 pt-8 border-t border-[--border]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Customize Your Magazine</h2>
            <p className="text-sm text-[--muted] mt-1">Make WAXFEED your own</p>
          </div>
          <button
            onClick={resetSettings}
            className="text-xs text-[--muted] hover:text-[--foreground] transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        <div className="space-y-8">
          {/* Theme Toggle */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`flex-1 p-4 border transition-all ${
                  theme === "dark"
                    ? "border-[--accent-primary] bg-[--surface]"
                    : "border-[--border] hover:border-[--muted]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0a0a0a] border border-[--border]" />
                  <div className="text-left">
                    <p className="font-bold text-sm">Dark</p>
                    <p className="text-xs text-[--muted]">White header, dark body</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`flex-1 p-4 border transition-all ${
                  theme === "light"
                    ? "border-[--accent-primary] bg-[--surface]"
                    : "border-[--border] hover:border-[--muted]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#f5f5f0] border border-[--border]" />
                  <div className="text-left">
                    <p className="font-bold text-sm">Light</p>
                    <p className="text-xs text-[--muted]">Dark header, light body</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Accent Color</label>
            <div className="grid grid-cols-4 sm:grid-cols-9 gap-2">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).filter(c => c !== 'custom').map((color) => (
                <button
                  key={color}
                  onClick={() => updateSetting("accentColor", color)}
                  className={`aspect-square border-2 transition-all ${
                    settings.accentColor === color
                      ? "border-[--foreground] scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: ACCENT_COLORS[color].primary }}
                  title={ACCENT_COLORS[color].name}
                >
                  {settings.accentColor === color && (
                    <svg className="w-4 h-4 mx-auto text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              {/* Custom color option */}
              <button
                onClick={() => updateSetting("accentColor", "custom")}
                className={`aspect-square border-2 transition-all relative overflow-hidden ${
                  settings.accentColor === "custom"
                    ? "border-[--foreground] scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{
                  background: settings.accentColor === "custom"
                    ? settings.customAccentHex
                    : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                }}
                title="Custom Color"
              >
                {settings.accentColor === "custom" && (
                  <svg className="w-4 h-4 mx-auto text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Custom color picker - shown when custom is selected */}
            {settings.accentColor === "custom" && (
              <div className="mt-4 p-4 border border-[--border] bg-[--surface]">
                <label className="block text-xs text-[--muted] mb-2">Custom Hex Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.customAccentHex}
                    onChange={(e) => updateSetting("customAccentHex", e.target.value)}
                    className="w-12 h-12 cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={settings.customAccentHex}
                    onChange={(e) => {
                      const hex = e.target.value
                      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        updateSetting("customAccentHex", hex)
                      }
                    }}
                    placeholder="#ffd700"
                    className="flex-1 bg-[--background] border border-[--border] px-3 py-2 text-sm font-mono uppercase"
                    maxLength={7}
                  />
                  <div
                    className="w-12 h-12 border border-[--border]"
                    style={{ backgroundColor: settings.customAccentHex }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-[--muted] mt-2">
              Selected: {settings.accentColor === "custom" ? `Custom (${settings.customAccentHex})` : ACCENT_COLORS[settings.accentColor].name}
            </p>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Typography</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(FONT_FAMILIES) as FontFamily[]).map((font) => (
                <button
                  key={font}
                  onClick={() => updateSetting("fontFamily", font)}
                  className={`p-4 border text-left transition-all ${
                    settings.fontFamily === font
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <p
                    className="font-bold text-lg mb-1"
                    style={{ fontFamily: FONT_FAMILIES[font].value }}
                  >
                    Aa
                  </p>
                  <p className="text-sm font-bold">{FONT_FAMILIES[font].name}</p>
                  <p className="text-xs text-[--muted]">{FONT_FAMILIES[font].style}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Text Size</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(FONT_SIZES) as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting("fontSize", size)}
                  className={`p-4 border text-left transition-all ${
                    settings.fontSize === size
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <p
                    className="font-bold mb-1"
                    style={{ fontSize: `${FONT_SIZES[size].scale}rem` }}
                  >
                    Aa
                  </p>
                  <p className="text-sm font-bold">{FONT_SIZES[size].name}</p>
                  <p className="text-xs text-[--muted]">{FONT_SIZES[size].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Density */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Layout Density</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(LAYOUT_DENSITIES) as LayoutDensity[]).map((density) => (
                <button
                  key={density}
                  onClick={() => updateSetting("layoutDensity", density)}
                  className={`p-4 border text-left transition-all ${
                    settings.layoutDensity === density
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-[--muted] h-2"
                        style={{
                          width: `${20 * LAYOUT_DENSITIES[density].scale}px`,
                          marginRight: `${4 * LAYOUT_DENSITIES[density].scale}px`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold">{LAYOUT_DENSITIES[density].name}</p>
                  <p className="text-xs text-[--muted]">{LAYOUT_DENSITIES[density].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Card Style */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Card Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(CARD_STYLES) as CardStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => updateSetting("cardStyle", style)}
                  className={`p-4 border text-left transition-all ${
                    settings.cardStyle === style
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div
                    className={`w-full h-12 mb-2 ${
                      style === "minimal"
                        ? "border border-[--border]"
                        : style === "elevated"
                        ? "border border-[--border] shadow-md"
                        : "border-2 border-[--foreground]"
                    }`}
                  />
                  <p className="text-sm font-bold">{CARD_STYLES[style].name}</p>
                  <p className="text-xs text-[--muted]">{CARD_STYLES[style].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Background Texture */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Background Texture</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(BACKGROUND_TEXTURES) as BackgroundTexture[]).map((texture) => (
                <button
                  key={texture}
                  onClick={() => updateSetting("backgroundTexture", texture)}
                  className={`p-4 border text-left transition-all ${
                    settings.backgroundTexture === texture
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div className="w-full h-10 mb-2 bg-[--background] border border-[--border] relative overflow-hidden">
                    {texture === "paper" && (
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
                      }} />
                    )}
                    {texture === "grain" && (
                      <div className="absolute inset-0 opacity-40" style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(128,128,128,0.1) 2px, rgba(128,128,128,0.1) 4px)"
                      }} />
                    )}
                    {texture === "noise" && (
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
                      }} />
                    )}
                  </div>
                  <p className="text-sm font-bold">{BACKGROUND_TEXTURES[texture].name}</p>
                  <p className="text-xs text-[--muted]">{BACKGROUND_TEXTURES[texture].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Columns */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Grid Columns</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(Object.keys(GRID_COLUMNS) as GridColumns[]).map((cols) => (
                <button
                  key={cols}
                  onClick={() => updateSetting("gridColumns", cols)}
                  className={`p-4 border text-left transition-all ${
                    settings.gridColumns === cols
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: cols === "auto" ? 3 : parseInt(GRID_COLUMNS[cols].cols) }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-[--muted] h-6 flex-1"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold">{GRID_COLUMNS[cols].name}</p>
                  <p className="text-xs text-[--muted]">{GRID_COLUMNS[cols].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cover Art Style */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Cover Art Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(COVER_STYLES) as CoverStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => updateSetting("coverStyle", style)}
                  className={`p-4 border text-left transition-all ${
                    settings.coverStyle === style
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div
                    className={`w-16 h-16 mb-2 bg-[--muted] ${
                      style === "square"
                        ? ""
                        : style === "rounded"
                        ? "rounded-lg"
                        : "shadow-lg"
                    }`}
                  />
                  <p className="text-sm font-bold">{COVER_STYLES[style].name}</p>
                  <p className="text-xs text-[--muted]">{COVER_STYLES[style].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Review Display Mode */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Review Display</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(REVIEW_DISPLAYS) as ReviewDisplay[]).map((display) => (
                <button
                  key={display}
                  onClick={() => updateSetting("reviewDisplay", display)}
                  className={`p-4 border text-left transition-all ${
                    settings.reviewDisplay === display
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div className={`w-full h-10 mb-2 flex gap-1 ${
                    display === "cards" ? "flex-wrap" :
                    display === "list" ? "flex-col" :
                    "flex-row items-center"
                  }`}>
                    {display === "cards" && (
                      <>
                        <div className="w-8 h-8 bg-[--muted]" />
                        <div className="w-8 h-8 bg-[--muted]" />
                        <div className="w-8 h-8 bg-[--muted]" />
                      </>
                    )}
                    {display === "list" && (
                      <>
                        <div className="w-full h-2 bg-[--muted]" />
                        <div className="w-full h-2 bg-[--muted]" />
                        <div className="w-3/4 h-2 bg-[--muted]" />
                      </>
                    )}
                    {display === "magazine" && (
                      <>
                        <div className="w-10 h-10 bg-[--muted]" />
                        <div className="flex-1 flex flex-col gap-1 justify-center">
                          <div className="w-full h-2 bg-[--muted]" />
                          <div className="w-3/4 h-2 bg-[--muted]" />
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-bold">{REVIEW_DISPLAYS[display].name}</p>
                  <p className="text-xs text-[--muted]">{REVIEW_DISPLAYS[display].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Homepage Layout */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Homepage Layout</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(HOMEPAGE_LAYOUTS) as HomepageLayout[]).map((layout) => (
                <button
                  key={layout}
                  onClick={() => updateSetting("homepageLayout", layout)}
                  className={`p-4 border text-left transition-all ${
                    settings.homepageLayout === layout
                      ? "border-[--accent-primary] bg-[--surface]"
                      : "border-[--border] hover:border-[--muted]"
                  }`}
                >
                  <div className="w-full h-12 mb-2 border border-[--border] relative overflow-hidden">
                    {layout === "editorial" && (
                      <div className="flex h-full">
                        <div className="w-1/2 bg-[--muted]/30 flex items-center justify-center">
                          <div className="w-6 h-6 bg-[--muted]" />
                        </div>
                        <div className="w-1/2 p-1 flex flex-col gap-0.5">
                          <div className="w-full h-1 bg-[--muted]" />
                          <div className="w-3/4 h-1 bg-[--muted]" />
                        </div>
                      </div>
                    )}
                    {layout === "grid" && (
                      <div className="grid grid-cols-4 gap-0.5 p-1 h-full">
                        <div className="bg-[--muted]" />
                        <div className="bg-[--muted]" />
                        <div className="bg-[--muted]" />
                        <div className="bg-[--muted]" />
                      </div>
                    )}
                    {layout === "stream" && (
                      <div className="flex flex-col gap-1 p-1 h-full justify-center">
                        <div className="w-3/4 h-1.5 bg-[--muted] mx-auto" />
                        <div className="w-2/3 h-1.5 bg-[--muted] mx-auto" />
                        <div className="w-3/4 h-1.5 bg-[--muted] mx-auto" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold">{HOMEPAGE_LAYOUTS[layout].name}</p>
                  <p className="text-xs text-[--muted]">{HOMEPAGE_LAYOUTS[layout].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div>
            <label className="block text-sm text-[--muted] mb-3">Preferences</label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-[--border] cursor-pointer hover:border-[--muted] transition-colors">
                <div>
                  <p className="text-sm font-bold">Animations</p>
                  <p className="text-xs text-[--muted]">Enable smooth transitions and effects</p>
                </div>
                <div
                  className={`w-12 h-6 relative transition-colors ${
                    settings.showAnimations ? "bg-[--accent-primary]" : "bg-[--border]"
                  }`}
                  onClick={() => updateSetting("showAnimations", !settings.showAnimations)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
                      settings.showAnimations ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 border border-[--border] cursor-pointer hover:border-[--muted] transition-colors">
                <div>
                  <p className="text-sm font-bold">Show Ratings</p>
                  <p className="text-xs text-[--muted]">Display rating scores on albums and tracks</p>
                </div>
                <div
                  className={`w-12 h-6 relative transition-colors ${
                    settings.showRatings ? "bg-[--accent-primary]" : "bg-[--border]"
                  }`}
                  onClick={() => updateSetting("showRatings", !settings.showRatings)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
                      settings.showRatings ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 border border-[--border] cursor-pointer hover:border-[--muted] transition-colors">
                <div>
                  <p className="text-sm font-bold">Custom Cursor</p>
                  <p className="text-xs text-[--muted]">Show the custom purple dot cursor (desktop only)</p>
                </div>
                <div
                  className={`w-12 h-6 relative transition-colors ${
                    settings.showCursor ? "bg-[--accent-primary]" : "bg-[--border]"
                  }`}
                  onClick={() => updateSetting("showCursor", !settings.showCursor)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
                      settings.showCursor ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 border border-[--border] cursor-pointer hover:border-[--muted] transition-colors">
                <div>
                  <p className="text-sm font-bold">Compact Mode</p>
                  <p className="text-xs text-[--muted]">Reduce spacing and padding throughout the app</p>
                </div>
                <div
                  className={`w-12 h-6 relative transition-colors ${
                    settings.compactMode ? "bg-[--accent-primary]" : "bg-[--border]"
                  }`}
                  onClick={() => updateSetting("compactMode", !settings.compactMode)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
                      settings.compactMode ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-16 pt-8 border-t border-[--border]">
        <h2 className="text-xl font-bold mb-6 text-red-500">Danger Zone</h2>
        <p className="text-sm text-[--muted] mb-4">
          Contact polarity@polarity-lab.com to delete your account.
        </p>
      </section>
    </div>
  )
}
