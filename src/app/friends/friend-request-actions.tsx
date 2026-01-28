"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  username: string
  type: "incoming" | "outgoing"
}

export function FriendRequestActions({ username, type }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${username}/friend`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <span className="text-sm" style={{ color: 'var(--muted)' }}>
        Done
      </span>
    )
  }

  if (type === "incoming") {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-bold bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Accept"}
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-bold border border-[--border] text-[--muted] hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    )
  }

  // Outgoing request
  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="px-3 py-1.5 text-sm font-bold border border-[--border] text-[--muted] hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Cancel"}
    </button>
  )
}
