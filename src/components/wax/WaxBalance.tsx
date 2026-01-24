"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type WalletStats = {
  balance: number
  canClaimDaily: boolean
  currentStreak: number
  tier: string
  weeklyRemaining: number | null
  weeklyCap: number | null
}

export function WaxBalance() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const fetchBalance = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error)
      }
    }
    fetchBalance()
  }, [session])

  if (!session || !stats) return null

  const hasNotification = stats.canClaimDaily

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition"
      >
        <span className="text-yellow-500">🕯️</span>
        <span className="font-bold">{stats.balance.toLocaleString()}</span>
        {hasNotification && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-[#111] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Balance Header */}
            <div className="p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-b border-[#333]">
              <div className="text-xs text-[#888]">Your Wax Balance</div>
              <div className="text-2xl font-bold text-yellow-500">
                🕯️ {stats.balance.toLocaleString()}
              </div>
              {stats.currentStreak > 0 && (
                <div className="text-xs text-orange-500 mt-1">
                  🔥 {stats.currentStreak} day streak
                </div>
              )}
            </div>

            {/* Daily Reward Alert */}
            {stats.canClaimDaily && (
              <Link
                href="/wallet"
                onClick={() => setShowDropdown(false)}
                className="block p-3 bg-green-900/20 border-b border-[#333] hover:bg-green-900/30 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="font-medium text-green-500">Daily Wax Ready!</div>
                    <div className="text-xs text-[#888]">Claim your free Wax</div>
                  </div>
                </div>
              </Link>
            )}

            {/* Weekly Cap Warning */}
            {stats.weeklyCap !== null && stats.weeklyRemaining !== null && stats.weeklyRemaining <= 20 && (
              <div className="p-3 bg-yellow-900/20 border-b border-[#333]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="font-medium text-yellow-500">
                      {stats.weeklyRemaining === 0 ? "Cap reached!" : `${stats.weeklyRemaining} Wax left`}
                    </div>
                    <div className="text-xs text-[#888]">Weekly earning limit</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-2">
              <Link
                href="/wallet"
                onClick={() => setShowDropdown(false)}
                className="block px-3 py-2 rounded-lg hover:bg-[#222] transition"
              >
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span>View Wallet</span>
                </div>
              </Link>
              <Link
                href="/shop"
                onClick={() => setShowDropdown(false)}
                className="block px-3 py-2 rounded-lg hover:bg-[#222] transition"
              >
                <div className="flex items-center gap-2">
                  <span>🛒</span>
                  <span>Shop</span>
                </div>
              </Link>
              <Link
                href="/pricing"
                onClick={() => setShowDropdown(false)}
                className="block px-3 py-2 rounded-lg hover:bg-[#222] transition"
              >
                <div className="flex items-center gap-2">
                  <span>⭐</span>
                  <span>Upgrade</span>
                  {stats.tier === "FREE" && (
                    <span className="ml-auto text-xs text-yellow-500">Get 2x earning</span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
