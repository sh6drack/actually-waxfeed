"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { DefaultAvatar } from "@/components/default-avatar"

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [username, setUsername] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (session?.user?.username) {
      router.push("/")
    }
  }, [session, status, router])

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

  const handleComplete = async () => {
    await update()
    router.push("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-[#888]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 ${step >= 1 ? "bg-white" : "bg-[#333]"}`} />
          <div className={`h-1 flex-1 ${step >= 2 ? "bg-white" : "bg-[#333]"}`} />
        </div>

        {step === 1 && (
          <>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Welcome to Waxfeed</h1>
            <p className="text-[#888] mb-8">
              First, choose your username. This is how you'll be known on Waxfeed.
            </p>

            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-[#888] mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">@</span>
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
                  <p className="text-xs text-[#888] mt-1">Checking availability...</p>
                )}
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
                <p className="text-xs text-[#666] mt-2">
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

        {step === 2 && (
          <>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Add a Profile Picture</h1>
            <p className="text-[#888] mb-8">
              Help your friends recognize you. You can always change this later.
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
                    className="w-full h-full object-cover border border-[#333]"
                  />
                ) : (
                  <DefaultAvatar size="lg" className="w-full h-full" />
                )}
                {/* Hover overlay with plus icon */}
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
              <p className="text-sm text-[#888]">
                Click to upload • Max 5MB
              </p>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="flex-1 border border-[#333] py-4 px-6 font-bold text-lg hover:bg-[#111] transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleComplete}
                disabled={!image}
                className="flex-1 bg-white text-black py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {image ? "Let's go!" : "Add a photo"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
