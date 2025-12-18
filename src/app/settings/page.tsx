"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { DefaultAvatar } from "@/components/default-avatar"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [bio, setBio] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    spotify: "",
    website: "",
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage("")

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
        setMessage("Profile picture updated!")
        await update()
      } else {
        setMessage(data.error || "Upload failed")
      }
    } catch {
      setMessage("Upload failed")
    }

    setUploading(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          socialLinks,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Settings saved!")
        await update()
      } else {
        setMessage(data.error || "Failed to save")
      }
    } catch {
      setMessage("Something went wrong")
    }

    setLoading(false)
  }

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
              <div
                className="relative w-24 h-24 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
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
                {uploading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <div className="text-sm text-[#888]">
                <p>Click to upload</p>
                <p className="text-xs text-[#666]">Max 5MB • JPEG, PNG, GIF, WebP</p>
              </div>
            </div>
          </div>

          {/* Username (display only) */}
          <div>
            <label className="block text-sm text-[#888] mb-2">Username</label>
            <p className="text-lg">@{session?.user?.username || "—"}</p>
            <p className="text-xs text-[#666] mt-1">
              Username changes cost $5 (first change is free)
            </p>
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
          disabled={loading}
          className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
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
