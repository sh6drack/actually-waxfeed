"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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
  const [activeSection, setActiveSection] = useState<"earn" | "spend" | "history">("earn")

  const purchaseSuccess = searchParams.get("purchase")
  const waxAmount = searchParams.get("wax")

  useEffect(() => {
    if (purchaseSuccess === "success" && waxAmount) {
      setMessage(`+${waxAmount} Wax added`)
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
          fetch("/api/wax/transactions?limit=20"),
        ])

        const statsData = await statsRes.json()
        const txData = await txRes.json()

        if (statsData.success) setStats(statsData.data)
        if (txData.success) setTransactions(txData.data.transactions)
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
      const res = await fetch("/api/wax/claim-daily", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        setMessage(`+${data.data.earned} Wax claimed!`)
        setStats(data.data.stats)
        // Refresh transactions
        const txRes = await fetch("/api/wax/transactions?limit=20")
        const txData = await txRes.json()
        if (txData.success) setTransactions(txData.data.transactions)
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-[--muted]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-[--muted]">Failed to load wallet.</p>
        </div>
      </div>
    )
  }

  const weeklyProgress = stats.weeklyCap
    ? Math.min((stats.weeklyEarned / stats.weeklyCap) * 100, 100)
    : 0

  const streakBonus = Math.min(stats.currentStreak * 2, 20)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Balance Header */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Your Wax
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl lg:text-7xl font-bold tracking-tight tabular-nums">
                  {stats.balance.toLocaleString()}
                </span>
              </div>
              {stats.tier !== "FREE" && (
                <p className="text-sm text-[--muted] mt-2">
                  {stats.tier === "WAX_PRO" ? "Pro" : "Wax+"} · {stats.earnMultiplier}x earning
                </p>
              )}
            </div>

            {/* Streak */}
            <div className="flex items-center gap-8">
              <div>
                <p className="text-4xl font-light tabular-nums">{stats.currentStreak}</p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Day Streak</p>
                {stats.currentStreak > 0 && (
                  <p className="text-xs text-green-500 mt-1">+{streakBonus} bonus</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div className="border-b border-[--border] bg-green-500/10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <p className="text-sm text-green-500">{message}</p>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveSection("earn")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeSection === "earn"
                  ? "border-white text-white"
                  : "border-transparent text-[--muted] hover:text-white"
              }`}
            >
              Earn Wax
            </button>
            <button
              onClick={() => setActiveSection("spend")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeSection === "spend"
                  ? "border-white text-white"
                  : "border-transparent text-[--muted] hover:text-white"
              }`}
            >
              Spend Wax
            </button>
            <button
              onClick={() => setActiveSection("history")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeSection === "history"
                  ? "border-white text-white"
                  : "border-transparent text-[--muted] hover:text-white"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </section>

      {/* EARN Section */}
      {activeSection === "earn" && (
        <section className="max-w-7xl mx-auto">
          {/* Daily Reward - Featured */}
          <div className="px-6 py-8 border-b border-[--border]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
                    01 — Daily Reward
                  </p>
                  {stats.canClaimDaily && (
                    <span className="px-2 py-0.5 text-[9px] tracking-wider uppercase bg-green-500/20 text-green-500">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-2xl font-medium mb-1">
                  +{5 + streakBonus} Wax
                </p>
                <p className="text-sm text-[--muted]">
                  {stats.canClaimDaily 
                    ? "Claim your daily Wax now. Keep your streak going!" 
                    : "Come back tomorrow to keep your streak going."}
                </p>
              </div>
              <button
                onClick={handleClaimDaily}
                disabled={!stats.canClaimDaily || claiming}
                className={`px-8 py-4 text-[11px] tracking-[0.15em] uppercase font-medium transition ${
                  stats.canClaimDaily
                    ? "bg-white text-black hover:bg-[#e5e5e5]"
                    : "border border-[--border] text-[--muted] cursor-not-allowed"
                }`}
              >
                {claiming ? "Claiming..." : stats.canClaimDaily ? "Claim Now" : "Claimed"}
              </button>
            </div>
          </div>

          {/* Earning Actions Grid */}
          <div className="grid lg:grid-cols-2 border-b border-[--border]">
            {/* Write a Review */}
            <Link 
              href="/search"
              className="px-6 py-8 lg:border-r border-b lg:border-b-0 border-[--border] hover:bg-[--border]/10 transition group"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                02 — Write a Review
              </p>
              <p className="text-2xl font-medium mb-1 group-hover:text-[--muted] transition">
                +10 Wax
              </p>
              <p className="text-sm text-[--muted] mb-4">
                First review of the day. Share your take on an album.
              </p>
              <span className="text-[10px] tracking-[0.15em] uppercase text-[--muted] group-hover:text-white transition">
                Search Albums →
              </span>
            </Link>

            {/* First Album Review */}
            <Link 
              href="/discover"
              className="px-6 py-8 hover:bg-[--border]/10 transition group"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                03 — First Album Review
              </p>
              <p className="text-2xl font-medium mb-1 group-hover:text-[--muted] transition">
                +15 Wax
              </p>
              <p className="text-sm text-[--muted] mb-4">
                Be the first to review an album. Discover new releases.
              </p>
              <span className="text-[10px] tracking-[0.15em] uppercase text-[--muted] group-hover:text-white transition">
                Discover Music →
              </span>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 border-b border-[--border]">
            {/* Get Wax from Others */}
            <div className="px-6 py-8 lg:border-r border-b lg:border-b-0 border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                04 — Get Appreciated
              </p>
              <p className="text-2xl font-medium mb-1">
                +1 to +10 Wax
              </p>
              <p className="text-sm text-[--muted] mb-4">
                Write great reviews. When others award you Wax, you earn too.
              </p>
              <div className="flex gap-4 text-xs text-[--muted]">
                <span>Standard: +1</span>
                <span className="text-purple-400">Premium: +3</span>
                <span className="text-[#ffd700]">GOLD: +10</span>
              </div>
            </div>

            {/* Trending Bonus */}
            <Link 
              href="/hot-takes"
              className="px-6 py-8 hover:bg-[--border]/10 transition group"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                05 — Go Trending
              </p>
              <p className="text-2xl font-medium mb-1 group-hover:text-[--muted] transition">
                +50 Wax
              </p>
              <p className="text-sm text-[--muted] mb-4">
                Make a Hot Take that gets featured. The community decides.
              </p>
              <span className="text-[10px] tracking-[0.15em] uppercase text-[--muted] group-hover:text-white transition">
                Hot Takes →
              </span>
            </Link>
          </div>

          {/* Weekly Cap Warning (Free users) */}
          {stats.weeklyCap !== null && (
            <div className="px-6 py-8 border-b border-[--border]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                    Weekly Limit
                  </p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-medium tabular-nums">{stats.weeklyEarned}</span>
                    <span className="text-[--muted]">/ {stats.weeklyCap} Wax</span>
                  </div>
                  <div className="w-full max-w-md h-2 bg-[--border]">
                    <div 
                      className={`h-full transition-all ${weeklyProgress >= 100 ? 'bg-[#ff3b3b]' : 'bg-white'}`}
                      style={{ width: `${weeklyProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[--muted] mt-2">
                    Resets in {stats.daysUntilReset} day{stats.daysUntilReset !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link 
                  href="/pricing"
                  className="px-6 py-3 border border-[--border] text-[11px] tracking-[0.15em] uppercase hover:border-white transition"
                >
                  Remove Limit →
                </Link>
              </div>
            </div>
          )}

          {/* Buy Wax */}
          <div className="px-6 py-8">
            <Link 
              href="/shop"
              className="block p-6 border border-[--border] hover:border-white transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                    Need Wax Now?
                  </p>
                  <p className="text-lg font-medium group-hover:text-[--muted] transition">
                    Buy Wax Pax in the Shop
                  </p>
                  <p className="text-sm text-[--muted]">
                    Starting at $0.99 for 100 Wax
                  </p>
                </div>
                <svg className="w-5 h-5 text-[--muted] group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* SPEND Section */}
      {activeSection === "spend" && (
        <section className="max-w-7xl mx-auto">
          <div className="px-6 py-8 border-b border-[--border]">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
              What Wax is For
            </p>
            <p className="text-lg max-w-2xl">
              Wax lets you show appreciation, boost your presence, and unlock exclusive items. 
              The more Wax you give, the more the community thrives.
            </p>
          </div>

          {/* Award Wax */}
          <div className="grid lg:grid-cols-3 border-b border-[--border]">
            <div className="px-6 py-8 lg:border-r border-b lg:border-b-0 border-[--border]">
              <div className="w-10 h-10 border border-[--border] flex items-center justify-center mb-4">
                <span className="text-sm font-bold">S</span>
              </div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Standard Wax
              </p>
              <p className="text-2xl font-medium mb-2">5 Wax</p>
              <p className="text-sm text-[--muted]">
                Show appreciation for any review. Available to everyone.
              </p>
            </div>

            <div className="px-6 py-8 lg:border-r border-b lg:border-b-0 border-[--border]">
              <div className="w-10 h-10 border border-purple-500/50 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-purple-400">P</span>
              </div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Premium Wax
              </p>
              <p className="text-2xl font-medium mb-2 text-purple-400">20 Wax</p>
              <p className="text-sm text-[--muted]">
                Extra recognition. Requires Wax+ or Pro membership.
              </p>
            </div>

            <div className="px-6 py-8">
              <div className="w-10 h-10 border border-[#ffd700]/50 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-[#ffd700]">G</span>
              </div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                GOLD Wax
              </p>
              <p className="text-2xl font-medium mb-2 text-[#ffd700]">100 Wax</p>
              <p className="text-sm text-[--muted]">
                Highest honor. Pro exclusive. Makes reviews stand out.
              </p>
            </div>
          </div>

          {/* Other Spending */}
          <div className="grid lg:grid-cols-2 border-b border-[--border]">
            <Link 
              href="/shop"
              className="px-6 py-8 lg:border-r border-b lg:border-b-0 border-[--border] hover:bg-[--border]/10 transition group"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Badges & Frames
              </p>
              <p className="text-lg font-medium mb-2 group-hover:text-[--muted] transition">
                Customize Your Profile
              </p>
              <p className="text-sm text-[--muted] mb-4">
                Exclusive badges and profile frames. Show off your status.
              </p>
              <span className="text-[10px] tracking-[0.15em] uppercase text-[--muted] group-hover:text-white transition">
                Browse Shop →
              </span>
            </Link>

            <div className="px-6 py-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Boost & Promote
              </p>
              <p className="text-lg font-medium mb-2">
                Make Your Reviews Stand Out
              </p>
              <p className="text-sm text-[--muted] mb-4">
                Boost reviews for visibility. Pin your best takes to your profile.
              </p>
              <div className="flex gap-4 text-xs text-[--muted]">
                <span>24h Boost: 50 Wax</span>
                <span>7d Boost: 250 Wax</span>
                <span>Pin: 25 Wax</span>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          {stats.tier === "FREE" && (
            <div className="px-6 py-8">
              <Link 
                href="/pricing"
                className="block p-6 border border-[--border] hover:border-white transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                      Unlock Premium & GOLD Wax
                    </p>
                    <p className="text-lg font-medium group-hover:text-[--muted] transition">
                      Upgrade to Wax+ or Pro
                    </p>
                    <p className="text-sm text-[--muted]">
                      Get monthly Wax, earn faster, and award higher tiers.
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[--muted] group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* HISTORY Section */}
      {activeSection === "history" && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              Recent Transactions
            </p>
            <div className="flex gap-6 text-sm">
              <span className="text-green-500">+{stats.lifetimeEarned.toLocaleString()} earned</span>
              <span className="text-[#ff3b3b]">−{stats.lifetimeSpent.toLocaleString()} spent</span>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center border border-[--border]">
              <p className="text-[--muted] mb-2">No transactions yet.</p>
              <p className="text-sm text-[--muted]">
                Start earning Wax by claiming your daily reward above.
              </p>
            </div>
          ) : (
            <div className="border border-[--border]">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.id} 
                  className={`flex items-center gap-4 px-4 py-4 ${
                    index < transactions.length - 1 ? 'border-b border-[--border]' : ''
                  }`}
                >
                  <div className={`w-10 h-10 flex items-center justify-center font-bold tabular-nums ${
                    tx.amount > 0 ? 'text-green-500' : 'text-[#ff3b3b]'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-[10px] text-[--muted]">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
