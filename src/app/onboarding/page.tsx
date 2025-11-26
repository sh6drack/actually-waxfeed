"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      router.push("/")
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
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
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Choose Your Username</h1>
        <p className="text-[#888] mb-8">
          This is how you'll be known on Waxfeed. Choose wisely - you get one free change.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            disabled={loading || !!error || checking}
            className="w-full bg-white text-black py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}
