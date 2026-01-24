"use client"

type Props = {
  remaining: number | null
  total: number | null
  expiresAt: string | null
  className?: string
}

export function ScarcityBadge({ remaining, total, expiresAt, className = "" }: Props) {
  if (!remaining && !expiresAt) return null

  // Calculate urgency
  const isLowStock = remaining !== null && remaining <= 10
  const isVeryLowStock = remaining !== null && remaining <= 3

  // Calculate time remaining
  let timeRemaining = ""
  let isExpiringSoon = false
  if (expiresAt) {
    const expires = new Date(expiresAt)
    const now = new Date()
    const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60))
    const daysLeft = Math.floor(hoursLeft / 24)

    if (hoursLeft < 0) {
      return null // Already expired
    } else if (hoursLeft < 24) {
      timeRemaining = `${hoursLeft}h left`
      isExpiringSoon = true
    } else if (daysLeft < 7) {
      timeRemaining = `${daysLeft}d left`
      isExpiringSoon = daysLeft <= 2
    } else {
      timeRemaining = `${daysLeft}d left`
    }
  }

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
          {isVeryLowStock && "🔥"}
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
          ⏰ {timeRemaining}
        </span>
      )}
    </div>
  )
}
