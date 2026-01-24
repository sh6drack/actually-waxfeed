"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type Props = {
  className?: string
  showLabel?: boolean
}

export function StreakIndicator({ className = "", showLabel = true }: Props) {
  const { data: session } = useSession()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const fetchStreak = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setStreak(data.data.currentStreak)
        }
      } catch (error) {
        console.error("Failed to fetch streak:", error)
      }
    }
    fetchStreak()
  }, [session])

  if (!session || streak === 0) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-orange-500">🔥</span>
      <span className="font-bold text-orange-500">{streak}</span>
      {showLabel && <span className="text-[#888] text-sm">streak</span>}
    </div>
  )
}
