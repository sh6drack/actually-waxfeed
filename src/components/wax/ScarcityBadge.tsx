"use client"

import { useState, useEffect } from "react"
import { FlameIcon } from "@/components/icons"
import { ClockUrgentIcon } from "@/components/icons/ui-icons"

type Props = {
  remaining: number | null
  total: number | null
  expiresAt: string | null
  className?: string
}

export function ScarcityBadge({ remaining, total, expiresAt, className = "" }: Props) {
  const [isMounted, setIsMounted] = useState(false)
  const [timeData, setTimeData] = useState<{ timeRemaining: string; isExpiringSoon: boolean }>({
    timeRemaining: "",
    isExpiringSoon: false
  })

  useEffect(() => {
    setIsMounted(true)
    
    // Calculate time remaining only on client
    if (expiresAt) {
      const expires = new Date(expiresAt)
      const now = new Date()
      const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60))
      const daysLeft = Math.floor(hoursLeft / 24)

      if (hoursLeft < 0) {
        setTimeData({ timeRemaining: "expired", isExpiringSoon: false })
      } else if (hoursLeft < 24) {
        setTimeData({ timeRemaining: `${hoursLeft}h left`, isExpiringSoon: true })
      } else if (daysLeft < 7) {
        setTimeData({ timeRemaining: `${daysLeft}d left`, isExpiringSoon: daysLeft <= 2 })
      } else {
        setTimeData({ timeRemaining: `${daysLeft}d left`, isExpiringSoon: false })
      }
    }
  }, [expiresAt])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) return null
  if (!remaining && !expiresAt) return null
  if (timeData.timeRemaining === "expired") return null

  // Calculate urgency
  const isLowStock = remaining !== null && remaining <= 10
  const isVeryLowStock = remaining !== null && remaining <= 3
  const { timeRemaining, isExpiringSoon } = timeData
  const isUrgent = isVeryLowStock || isExpiringSoon

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {remaining !== null && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isVeryLowStock
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : isLowStock
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          }`}
        >
          {isVeryLowStock && <FlameIcon size={14} />}
          {remaining} left
          {total && <span className="text-[#888]">/ {total}</span>}
        </span>
      )}
      {timeRemaining && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isExpiringSoon
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          }`}
        >
          <ClockUrgentIcon size={14} /> {timeRemaining}
        </span>
      )}
    </div>
  )
}
