"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  username: string
  isFriend: boolean
  hasPendingRequest: boolean
  pendingRequestSentByMe: boolean
  isLoggedIn: boolean
}

export function ProfileActions({
  username,
  isFriend: initialFriend,
  hasPendingRequest: initialPending,
  pendingRequestSentByMe: initialSentByMe,
  isLoggedIn
}: Props) {
  const router = useRouter()
  const [isFriend, setIsFriend] = useState(initialFriend)
  const [hasPendingRequest, setHasPendingRequest] = useState(initialPending)
  const [pendingRequestSentByMe, setPendingRequestSentByMe] = useState(initialSentByMe)
  const [loading, setLoading] = useState(false)

  const handleFriend = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      if (isFriend) {
        // Unfriend
        const res = await fetch(`/api/users/${username}/friend`, {
          method: "DELETE",
        })
        if (res.ok) {
          setIsFriend(false)
        }
      } else if (hasPendingRequest && pendingRequestSentByMe) {
        // Cancel pending request
        const res = await fetch(`/api/users/${username}/friend`, {
          method: "DELETE",
        })
        if (res.ok) {
          setHasPendingRequest(false)
          setPendingRequestSentByMe(false)
        }
      } else if (hasPendingRequest && !pendingRequestSentByMe) {
        // Accept their request
        const res = await fetch(`/api/users/${username}/friend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        })
        if (res.ok) {
          setIsFriend(true)
          setHasPendingRequest(false)
        }
      } else {
        // Send friend request
        const res = await fetch(`/api/users/${username}/friend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send" }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data?.status === "accepted") {
            setIsFriend(true)
          } else if (data.data?.status === "pending") {
            setHasPendingRequest(true)
            setPendingRequestSentByMe(true)
          }
        }
      }
    } catch (error) {
      console.error("Friend error:", error)
    }
    setLoading(false)
  }

  // Determine button text and style
  let buttonText = "Add Friend"
  let buttonStyle = "bg-white text-black hover:bg-gray-100"

  if (isFriend) {
    buttonText = "Friends"
    buttonStyle = "border border-[#333] hover:bg-[#111] hover:border-red-500 hover:text-red-500"
  } else if (hasPendingRequest && pendingRequestSentByMe) {
    buttonText = "Request Sent"
    buttonStyle = "border border-[#333] text-[#888] hover:bg-[#111] hover:border-red-500 hover:text-red-500"
  } else if (hasPendingRequest && !pendingRequestSentByMe) {
    buttonText = "Accept Request"
    buttonStyle = "bg-white text-black hover:bg-gray-100"
  }

  return (
    <button
      onClick={handleFriend}
      disabled={loading}
      className={`px-4 py-2 text-sm font-bold transition-colors ${buttonStyle} ${loading ? "opacity-50" : ""}`}
    >
      {loading ? "..." : buttonText}
    </button>
  )
}
