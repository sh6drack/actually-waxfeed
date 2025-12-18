"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { DefaultAvatar } from "@/components/default-avatar"
import { useUploadThing } from "@/lib/uploadthing"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [originalUsername, setOriginalUsername] = useState("")
  const [usernameChangesUsed, setUsernameChangesUsed] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [bio, setBio] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    spotify: "",
    website: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const { startUpload, isUploading } = useUploadThing("profilePicture", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        setImage(res[0].url)
        setMessage("Profile picture updated!")
        update()
      }
    },
    onUploadError: (error) => {
      setMessage(error.message || "Upload failed")
    },
  })

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
    await startUpload([file])
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

  const canChangeUsername = usernameChangesUsed === 0 || isPremium
  const usernameChanged = username !== originalUsername

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-[#888]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Settings</h1>

      {/* Profile Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Profile</h2>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm text-[#888] mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <label className="relative w-24 h-24 cursor-pointer group">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover border border-[#333]"
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
              <div className="text-sm text-[#888]">
                <p>Click to upload</p>
                <p className="text-xs text-[#666]">Max 4MB • JPEG, PNG, GIF, WebP</p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-[#888] mb-2">Username</label>
            <div className="flex items-center gap-2">
              <span className="text-[#666]">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder="username"
                maxLength={30}
                className="flex-1 bg-[#111] border border-[#333] px-3 py-2 text-white focus:outline-none focus:border-white transition-colors"
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
              <p className="text-xs text-[#666] mt-1">
                {usernameChangesUsed === 0
                  ? "First username change is free"
                  : isPremium
                    ? "Premium members can change username anytime"
                    : "Username changes cost $5"}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-[#888] mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              placeholder="Tell people about yourself..."
              className="w-full"
            />
            <p className="text-xs text-[#666] mt-1">{bio.length}/150</p>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm text-[#888] mb-2">Social Links</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[#888] w-20">Instagram</span>
                <input
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="@username or URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#888] w-20">Twitter</span>
                <input
                  type="text"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="@username or URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#888] w-20">Spotify</span>
                <input
                  type="text"
                  value={socialLinks.spotify}
                  onChange={(e) => setSocialLinks({ ...socialLinks, spotify: e.target.value })}
                  placeholder="Spotify profile URL"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#888] w-20">Website</span>
                <input
                  type="text"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  placeholder="https://..."
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading || (usernameChanged && !canChangeUsername)}
          className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        {message && (
          <p className={message.includes("saved") || message.includes("updated") ? "text-green-500" : "text-red-500"}>
            {message}
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <section className="mt-16 pt-8 border-t border-[#222]">
        <h2 className="text-xl font-bold mb-6 text-red-500">Danger Zone</h2>
        <p className="text-sm text-[#888] mb-4">
          Contact scrolling@waxfeed.com to delete your account.
        </p>
      </section>
    </div>
  )
}
