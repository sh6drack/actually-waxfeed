"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"

type WalletStats = {
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
  weeklyEarned: number
  weeklyCap: number | null
  weeklyRemaining: number | null
  daysUntilReset: number
  currentStreak: number
  canClaimDaily: boolean
  tier: string
  earnMultiplier: number
}

type Transaction = {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
  metadata: Record<string, unknown> | null
}

const TX_TYPE_ICONS: Record<string, string> = {
  DAILY_CLAIM: "📅",
  STREAK_BONUS: "🔥",
  REVIEW_REWARD: "✍️",
  WAX_RECEIVED: "🎁",
  FIRST_ALBUM_BONUS: "🏆",
  REFERRAL_BONUS: "👥",
  SUBSCRIPTION_GRANT: "⭐",
  PURCHASE: "💳",
  AWARD_STANDARD: "🕯️",
  AWARD_PREMIUM: "💜",
  AWARD_GOLD: "✨",
  BOOST_REVIEW: "🚀",
  BUY_BADGE: "🏅",
  BUY_FRAME: "🖼️",
  USERNAME_CHANGE: "✏️",
  TRENDING_BONUS: "📈",
}

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState("")

  const purchaseSuccess = searchParams.get("purchase")
  const waxAmount = searchParams.get("wax")

  useEffect(() => {
    if (purchaseSuccess === "success" && waxAmount) {
      setMessage(`🎉 Success! ${waxAmount} Wax has been added to your wallet!`)
    }
  }, [purchaseSuccess, waxAmount])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/wallet")
      return
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return

      try {
        const [statsRes, txRes] = await Promise.all([
          fetch("/api/wax/balance"),
          fetch("/api/wax/transactions?limit=30"),
        ])

        const statsData = await statsRes.json()
        const txData = await txRes.json()

        if (statsData.success) {
          setStats(statsData.data)
        }

        if (txData.success) {
          setTransactions(txData.data.transactions)
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  const handleClaimDaily = async () => {
    setClaiming(true)
    setMessage("")

    try {
      const res = await fetch("/api/wax/claim-daily", {
        method: "POST",
      })

      const data = await res.json()

      if (data.success) {
        setMessage(`🎉 Claimed ${data.data.earned} Wax!`)
        setStats(data.data.stats)
        // Refresh transactions
        const txRes = await fetch("/api/wax/transactions?limit=30")
        const txData = await txRes.json()
        if (txData.success) {
          setTransactions(txData.data.transactions)
        }
      } else {
        setMessage(data.error || "Failed to claim")
      }
    } catch (error) {
      setMessage("Something went wrong")
    } finally {
      setClaiming(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-[#888]">Loading wallet...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-[#888]">Failed to load wallet data.</p>
      </div>
    )
  }

  const weeklyProgress = stats.weeklyCap
    ? (stats.weeklyEarned / stats.weeklyCap) * 100
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Wax Wallet</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes("🎉")
            ? "bg-green-900/20 border border-green-600/30"
            : "bg-yellow-900/20 border border-yellow-600/30"
        }`}>
          {message}
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600/30 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-sm text-[#888] mb-1">Your Balance</div>
            <div className="text-5xl font-bold text-yellow-500">
              🕯️ {stats.balance.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#888]">Tier</div>
            <div className={`font-bold ${
              stats.tier === "WAX_PRO" ? "text-purple-400" 
              : stats.tier === "WAX_PLUS" ? "text-yellow-500" 
              : "text-[#888]"
            }`}>
              {stats.tier === "WAX_PRO" ? "Pro" : stats.tier === "WAX_PLUS" ? "Wax+" : "Free"}
            </div>
            {stats.earnMultiplier > 1 && (
              <div className="text-sm text-green-500">{stats.earnMultiplier}x earning</div>
            )}
          </div>
        </div>

        {/* Daily Claim */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleClaimDaily}
            disabled={!stats.canClaimDaily || claiming}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              stats.canClaimDaily
                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                : "bg-[#333] text-[#666] cursor-not-allowed"
            }`}
          >
            {claiming ? "Claiming..." : stats.canClaimDaily ? "🎁 Claim Daily Wax" : "✓ Daily Claimed"}
          </button>
          <div className="text-center">
            <div className="text-2xl">🔥</div>
            <div className="text-sm font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-[#888]">streak</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-[#333] rounded-xl p-4">
          <div className="text-sm text-[#888] mb-1">Lifetime Earned</div>
          <div className="text-2xl font-bold text-green-500">
            +{stats.lifetimeEarned.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111] border border-[#333] rounded-xl p-4">
          <div className="text-sm text-[#888] mb-1">Lifetime Spent</div>
          <div className="text-2xl font-bold text-red-400">
            -{stats.lifetimeSpent.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111] border border-[#333] rounded-xl p-4">
          <div className="text-sm text-[#888] mb-1">Longest Streak</div>
          <div className="text-2xl font-bold text-orange-500">
            🔥 {stats.currentStreak}
          </div>
        </div>
      </div>

      {/* Weekly Cap Progress (Free users only) */}
      {stats.weeklyCap !== null && (
        <div className="bg-[#111] border border-[#333] rounded-xl p-4 mb-8">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">Weekly Earning Progress</div>
            <div className="text-sm text-[#888]">
              Resets in {stats.daysUntilReset} day{stats.daysUntilReset !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="h-3 bg-[#333] rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${
                weeklyProgress >= 100 ? "bg-red-500" : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">
              {stats.weeklyEarned} / {stats.weeklyCap} Wax earned
            </span>
            {weeklyProgress >= 100 ? (
              <span className="text-red-400">Cap reached!</span>
            ) : (
              <span className="text-green-500">{stats.weeklyRemaining} remaining</span>
            )}
          </div>
          {weeklyProgress >= 80 && (
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <p className="text-sm">
                ⚠️ {weeklyProgress >= 100 ? "You've hit your weekly cap!" : "Almost at your weekly cap!"}{" "}
                <button 
                  onClick={() => router.push("/pricing")}
                  className="text-yellow-500 underline hover:no-underline"
                >
                  Upgrade for unlimited earning →
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#333]">
          <h2 className="font-bold text-lg">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-[#888]">
            No transactions yet. Start earning Wax by reviewing albums!
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-[#1a1a1a] transition">
                <div className="text-2xl">
                  {TX_TYPE_ICONS[tx.type] || "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{tx.description}</div>
                  <div className="text-sm text-[#888]">
                    {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className={`font-bold ${tx.amount > 0 ? "text-green-500" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/shop")}
          className="p-4 bg-[#111] border border-[#333] rounded-xl text-left hover:border-yellow-500/50 transition"
        >
          <div className="text-2xl mb-2">🛒</div>
          <div className="font-bold">Shop</div>
          <div className="text-sm text-[#888]">Buy Wax Pax & items</div>
        </button>
        <button
          onClick={() => router.push("/pricing")}
          className="p-4 bg-[#111] border border-[#333] rounded-xl text-left hover:border-yellow-500/50 transition"
        >
          <div className="text-2xl mb-2">⭐</div>
          <div className="font-bold">Upgrade</div>
          <div className="text-sm text-[#888]">Get Wax+ or Pro</div>
        </button>
      </div>
    </div>
  )
}
