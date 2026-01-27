"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

type WalletStats = {
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
  tastemakeScore: number
  goldSpinCount: number
  silverSpinCount: number
  bronzeSpinCount: number
  tier: string
}

type Badge = {
  id: string
  badgeType: 'GOLD' | 'SILVER' | 'BRONZE'
  position: number
  waxAwarded: number
  createdAt: string
  albumId: string
}

type Transaction = {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

function WalletLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={<WalletLoading />}>
      <WalletContent />
    </Suspense>
  )
}

function WalletContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"badges" | "wax" | "history">("wax")

  const purchaseSuccess = searchParams.get("purchase")

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

        if (statsData.success) {
          setStats({
            balance: statsData.data.balance || 0,
            lifetimeEarned: statsData.data.lifetimeEarned || 0,
            lifetimeSpent: statsData.data.lifetimeSpent || 0,
            tastemakeScore: statsData.data.tastemakeScore || 0,
            goldSpinCount: statsData.data.goldSpinCount || 0,
            silverSpinCount: statsData.data.silverSpinCount || 0,
            bronzeSpinCount: statsData.data.bronzeSpinCount || 0,
            tier: statsData.data.tier || "FREE",
          })
        }
        if (txData.success) setTransactions(txData.data.transactions)

        // Fetch badges
        try {
          const badgesRes = await fetch("/api/first-spin/badges")
          const badgesData = await badgesRes.json()
          if (badgesData.success) setBadges(badgesData.data || [])
        } catch (e) {
          // API might not exist yet
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  if (status === "loading" || loading) {
    return <WalletLoading />
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-[var(--muted)]">Failed to load wallet.</p>
        </div>
      </div>
    )
  }

  const totalBadges = stats.goldSpinCount + stats.silverSpinCount + stats.bronzeSpinCount
  const isSubscriber = stats.tier !== "FREE"

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* HERO CTA - Prominent Earn WAX Section */}
      <section className="bg-[#ffd700]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p className="text-sm font-bold text-black/60 uppercase tracking-wider mb-2">
                Earn WAX Every Time You Rate
              </p>
              <h1 className="text-4xl lg:text-5xl font-black text-black mb-4">
                +1 WAX Per Album
              </h1>
              <p className="text-lg text-black/80 max-w-lg">
                Rate albums to earn WAX and build your TasteID. 
                The more you rate, the more you earn.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/quick-rate"
                className="px-10 py-5 bg-black text-[#ffd700] text-lg font-bold uppercase tracking-wider hover:bg-black/90 transition-colors text-center"
              >
                Start Rating Now
              </Link>
              <p className="text-sm text-black/60 text-center">
                20 ratings = Unlock TasteID
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WAX Balance + Stats Bar */}
      <section className="border-b-2 border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* WAX Balance */}
            <div className="p-4 border-2 border-[#ffd700] bg-[#ffd700]/10">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                WAX Balance
              </p>
              <p className="text-4xl font-black text-[#ffd700] tabular-nums">
                {stats.balance.toLocaleString()}
              </p>
            </div>
            
            {/* Tastemaker Score */}
            <div className="p-4 border-2 border-[var(--border)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Tastemaker Score
              </p>
              <p className="text-4xl font-black tabular-nums">
                {stats.tastemakeScore}
              </p>
            </div>
            
            {/* Lifetime Earned */}
            <div className="p-4 border-2 border-[var(--border)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                Lifetime Earned
              </p>
              <p className="text-4xl font-black text-green-600 tabular-nums">
                +{stats.lifetimeEarned.toLocaleString()}
              </p>
            </div>
            
            {/* Badges */}
            <div className="p-4 border-2 border-[var(--border)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                First Spin Badges
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-[#ffd700]">{stats.goldSpinCount}G</span>
                <span className="text-xl font-black text-gray-500">{stats.silverSpinCount}S</span>
                <span className="text-xl font-black text-amber-700">{stats.bronzeSpinCount}B</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b-2 border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("wax")}
              className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === "wax"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              How to Earn
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === "badges"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Badges ({totalBadges})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === "history"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </section>

      {/* HOW TO EARN Tab */}
      {activeTab === "wax" && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          {/* Ways to Earn Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            {/* Rate Albums */}
            <div className="p-6 border-2 border-[#ffd700] bg-[#ffd700]/5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#ffd700] flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <span className="text-3xl font-black text-[#ffd700]">+1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Rate Any Album</h3>
              <p className="text-[var(--muted)] mb-4">
                Every album you rate earns 1 WAX instantly. Quick and simple.
              </p>
              <Link
                href="/quick-rate"
                className="inline-block px-6 py-3 bg-[#ffd700] text-black font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Rate Albums
              </Link>
            </div>

            {/* Write Review */}
            <div className="p-6 border-2 border-[var(--border)]">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 border-2 border-[var(--foreground)] flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-3xl font-black">+5</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Write a Full Review</h3>
              <p className="text-[var(--muted)] mb-4">
                Add written thoughts to your rating for 5 bonus WAX.
              </p>
              <Link
                href="/discover"
                className="inline-block px-6 py-3 border-2 border-[var(--foreground)] font-bold uppercase tracking-wider hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                Find Albums
              </Link>
            </div>
          </div>

          {/* First Spin Bonuses */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Bonus: First Spin Badges</h2>
            <p className="text-[var(--muted)] mb-6 max-w-2xl">
              Review albums before they trend. When an album hits 100+ reviews, 
              early reviewers automatically receive badges and bonus WAX.
            </p>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="p-6 border-2 border-[#ffd700]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#ffd700] flex items-center justify-center">
                    <span className="text-black font-black">1-10</span>
                  </div>
                  <span className="text-4xl font-black text-[#ffd700]">+100</span>
                </div>
                <p className="font-bold text-[#ffd700]">GOLD SPIN</p>
                <p className="text-sm text-[var(--muted)]">First 10 reviewers</p>
              </div>
              <div className="p-6 border-2 border-gray-400">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-400 flex items-center justify-center">
                    <span className="text-white font-black text-sm">11-50</span>
                  </div>
                  <span className="text-4xl font-black text-gray-500">+50</span>
                </div>
                <p className="font-bold text-gray-500">SILVER SPIN</p>
                <p className="text-sm text-[var(--muted)]">Positions 11-50</p>
              </div>
              <div className="p-6 border-2 border-amber-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-700 flex items-center justify-center">
                    <span className="text-white font-black text-sm">51-100</span>
                  </div>
                  <span className="text-4xl font-black text-amber-700">+25</span>
                </div>
                <p className="font-bold text-amber-700">BRONZE SPIN</p>
                <p className="text-sm text-[var(--muted)]">Positions 51-100</p>
              </div>
            </div>
          </div>

          {/* Spending */}
          <div className="p-6 border-2 border-[var(--border)]">
            <h3 className="text-xl font-bold mb-4">How to Spend WAX</h3>
            <p className="text-[var(--muted)] mb-4">
              Tip reviews you appreciate. Support great tastemakers.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 border-2 border-[var(--border)]">
                <span className="font-bold">5 WAX</span>
                <span className="ml-2 text-[var(--muted)]">Standard Tip</span>
              </div>
              <div className="px-4 py-2 border-2 border-purple-500">
                <span className="font-bold text-purple-500">20 WAX</span>
                <span className="ml-2 text-[var(--muted)]">Premium Tip</span>
              </div>
              <div className="px-4 py-2 border-2 border-[#ffd700]">
                <span className="font-bold text-[#ffd700]">100 WAX</span>
                <span className="ml-2 text-[var(--muted)]">GOLD Tip</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BADGES Tab */}
      {activeTab === "badges" && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          {totalBadges === 0 ? (
            <div className="py-16 border-2 border-[#ffd700] text-center bg-[#ffd700]/10">
              <div className="w-20 h-20 bg-[#ffd700] flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Your Badge Collection Starts Here</h2>
              <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
                Review albums early. When they trend, you earn badges based on your position.
              </p>
              <Link
                href="/discover"
                className="inline-block px-8 py-4 bg-[#ffd700] text-black text-lg font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Start Reviewing Albums
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-6">Your Collection ({totalBadges})</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`p-6 border-2 ${
                      badge.badgeType === 'GOLD' 
                        ? 'border-[#ffd700] bg-[#ffd700]/10' 
                        : badge.badgeType === 'SILVER'
                          ? 'border-gray-400 bg-gray-400/10'
                          : 'border-amber-700 bg-amber-700/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 flex items-center justify-center ${
                        badge.badgeType === 'GOLD' 
                          ? 'bg-[#ffd700] text-black' 
                          : badge.badgeType === 'SILVER'
                            ? 'bg-gray-400 text-white'
                            : 'bg-amber-700 text-white'
                      }`}>
                        <span className="text-lg font-black">#{badge.position}</span>
                      </div>
                      <span className={`text-2xl font-black ${
                        badge.badgeType === 'GOLD' 
                          ? 'text-[#ffd700]' 
                          : badge.badgeType === 'SILVER'
                            ? 'text-gray-500'
                            : 'text-amber-700'
                      }`}>
                        +{badge.waxAwarded}
                      </span>
                    </div>
                    <p className={`font-bold mb-1 ${
                      badge.badgeType === 'GOLD' 
                        ? 'text-[#ffd700]' 
                        : badge.badgeType === 'SILVER'
                          ? 'text-gray-500'
                          : 'text-amber-700'
                    }`}>{badge.badgeType} SPIN</p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatDistanceToNow(new Date(badge.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* HISTORY Tab */}
      {activeTab === "history" && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-xl font-bold mb-6">Transaction History</h2>

          {transactions.length === 0 ? (
            <div className="py-16 text-center border-2 border-[var(--border)]">
              <p className="text-[var(--muted)] mb-4">No transactions yet.</p>
              <Link
                href="/quick-rate"
                className="inline-block px-6 py-3 bg-[#ffd700] text-black font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Start Rating to Earn
              </Link>
            </div>
          ) : (
            <div className="border-2 border-[var(--border)]">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.id} 
                  className={`flex items-center gap-4 px-6 py-4 ${
                    index < transactions.length - 1 ? 'border-b-2 border-[var(--border)]' : ''
                  }`}
                >
                  <div className={`w-16 h-16 flex items-center justify-center font-black text-2xl tabular-nums ${
                    tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tx.description}</p>
                    <p className="text-sm text-[var(--muted)]">
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
