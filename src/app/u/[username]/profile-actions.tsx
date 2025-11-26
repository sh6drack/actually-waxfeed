"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  username: string
  isFriend: boolean
  isLoggedIn: boolean
}

export function ProfileActions({ username, isFriend: initialFriend, isLoggedIn }: Props) {
  const router = useRouter()
  const [isFriend, setIsFriend] = useState(initialFriend)
  const [loading, setLoading] = useState(false)

  const handleFriend = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      if (isFriend) {
        const res = await fetch(`/api/users/${username}/friend`, {
          method: "DELETE",
        })
        if (res.ok) {
          setIsFriend(false)
        }
      } else {
        const res = await fetch(`/api/users/${username}/friend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send" }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data?.status === "accepted") {
            setIsFriend(true)
          }
        }
      }
    } catch (error) {
      console.error("Friend error:", error)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleFriend}
      disabled={loading}
      className={`px-4 py-2 text-sm font-bold transition-colors ${
        isFriend
          ? "border border-[#333] hover:bg-[#111]"
          : "bg-white text-black hover:bg-gray-100"
      }`}
    >
      {isFriend ? "Friends ✓" : "Add Friend"}
    </button>
  )
}
