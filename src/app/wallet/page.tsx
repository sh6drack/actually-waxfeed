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

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"badges" | "wax" | "history">("badges")

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

  const totalBadges = stats.goldSpinCount + stats.silverSpinCount + stats.bronzeSpinCount
  const isSubscriber = stats.tier !== "FREE"

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Tastemaker Score
              </p>
              <div className="flex items-baseline gap-4">
                <span className="text-7xl lg:text-8xl font-bold tracking-tight tabular-nums">
                  {stats.tastemakeScore}
                </span>
              </div>
              <p className="text-sm text-[--muted] mt-2">
                {totalBadges === 0 
                  ? "Review albums early to earn badges and build your score."
                  : `Based on ${totalBadges} First Spin badge${totalBadges !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            {/* Badge Summary */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="w-14 h-14 border-2 border-[#ffd700] flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-[#ffd700]">{stats.goldSpinCount}</span>
                </div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">Gold</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 border-2 border-gray-400 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-gray-400">{stats.silverSpinCount}</span>
                </div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">Silver</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 border-2 border-amber-700 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-amber-700">{stats.bronzeSpinCount}</span>
                </div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">Bronze</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wax Balance Bar */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">Wax Balance</p>
              <p className="text-xl font-bold tabular-nums">{stats.balance.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-[--border]" />
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted]">Lifetime Earned</p>
              <p className="text-sm tabular-nums text-green-500">+{stats.lifetimeEarned.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSubscriber ? (
              <span className="text-[9px] tracking-wider uppercase px-2 py-1 bg-[#ffd700]/20 text-[#ffd700]">
                {stats.tier === "WAX_PRO" ? "Pro" : "Wax+"}
              </span>
            ) : (
              <Link
                href="/pricing"
                className="px-4 py-2 border border-[--border] text-[10px] tracking-[0.15em] uppercase hover:border-white transition"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("badges")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeTab === "badges"
                  ? "border-white text-white"
                  : "border-transparent text-[--muted] hover:text-white"
              }`}
            >
              First Spin Badges
            </button>
            <button
              onClick={() => setActiveTab("wax")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeTab === "wax"
                  ? "border-white text-white"
                  : "border-transparent text-[--muted] hover:text-white"
              }`}
            >
              How to Earn
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeTab === "history"
                  ? "border-white text-white"
                  : "border-transparent text-[--muted] hover:text-white"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </section>

      {/* BADGES Tab */}
      {activeTab === "badges" && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          {totalBadges === 0 ? (
            <div className="py-16 border border-[--border] text-center">
              <div className="w-16 h-16 border-2 border-[--border] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-[--muted]">?</span>
              </div>
              <p className="text-lg font-medium mb-2">No badges yet</p>
              <p className="text-sm text-[--muted] mb-6 max-w-md mx-auto">
                Review albums before they trend to earn First Spin badges. 
                Your position is recorded. If it blows up you get credit.
              </p>
              <Link
                href="/discover"
                className="inline-block px-6 py-3 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-[#e5e5e5] transition"
              >
                Discover Albums
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
                Your Collection
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`p-4 border ${
                      badge.badgeType === 'GOLD' 
                        ? 'border-[#ffd700]/50' 
                        : badge.badgeType === 'SILVER'
                          ? 'border-gray-400/50'
                          : 'border-amber-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                        badge.badgeType === 'GOLD' 
                          ? 'border-[#ffd700] text-[#ffd700]' 
                          : badge.badgeType === 'SILVER'
                            ? 'border-gray-400 text-gray-400'
                            : 'border-amber-700 text-amber-700'
                      }`}>
                        <span className="text-sm font-bold">#{badge.position}</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        badge.badgeType === 'GOLD' 
                          ? 'text-[#ffd700]' 
                          : badge.badgeType === 'SILVER'
                            ? 'text-gray-400'
                            : 'text-amber-700'
                      }`}>
                        +{badge.waxAwarded}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{badge.badgeType} Spin</p>
                    <p className="text-xs text-[--muted]">
                      {formatDistanceToNow(new Date(badge.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* HOW TO EARN Tab */}
      {activeTab === "wax" && (
        <section className="max-w-7xl mx-auto">
          {/* First Spin */}
          <div className="px-6 py-8 border-b border-[--border]">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
              Primary Way to Earn
            </p>
            <h2 className="text-2xl font-bold mb-4">First Spin Badges</h2>
            <p className="text-sm text-[--muted] mb-6 max-w-2xl">
              Review albums before they trend. When an album hits 100+ reviews 
              early reviewers automatically receive badges and Wax rewards.
            </p>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="p-4 border border-[#ffd700]/30">
                <p className="text-3xl font-bold text-[#ffd700] mb-1">+100</p>
                <p className="text-sm">Gold Spin for first 10</p>
              </div>
              <div className="p-4 border border-gray-400/30">
                <p className="text-3xl font-bold text-gray-400 mb-1">+50</p>
                <p className="text-sm">Silver Spin for first 50</p>
              </div>
              <div className="p-4 border border-amber-700/30">
                <p className="text-3xl font-bold text-amber-700 mb-1">+25</p>
                <p className="text-sm">Bronze Spin for first 100</p>
              </div>
            </div>
          </div>

          {/* Other Ways */}
          <div className="px-6 py-8 border-b border-[--border]">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
              Other Ways
            </p>
            <div className="grid lg:grid-cols-2 gap-6">
              <Link href="/search" className="p-4 border border-[--border] hover:border-white transition group">
                <p className="text-xl font-bold mb-1 group-hover:text-[--muted] transition">+5 Wax</p>
                <p className="text-sm font-medium mb-2">Write a Review</p>
                <p className="text-xs text-[--muted]">
                  Every review earns you 5 Wax. Plus tracks your position for First Spin.
                </p>
              </Link>
              <div className="p-4 border border-[--border]">
                <p className="text-xl font-bold mb-1">+1 to +10 Wax</p>
                <p className="text-sm font-medium mb-2">Get Tipped</p>
                <p className="text-xs text-[--muted]">
                  When others tip your reviews you earn a portion. Standard +1, Premium +3, GOLD +10.
                </p>
              </div>
            </div>
          </div>

          {/* Trending Radar CTA for non subscribers */}
          {!isSubscriber && (
            <div className="px-6 py-8 border-b border-[--border]">
              <Link
                href="/radar"
                className="flex items-center justify-between p-4 border border-[#ffd700]/30 hover:border-[#ffd700] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-[#ffd700] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#ffd700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[--muted] transition">Trending Radar</p>
                    <p className="text-xs text-[--muted]">See albums about to trend</p>
                  </div>
                </div>
                <span className="text-xs text-[#ffd700]">Subscriber feature</span>
              </Link>
            </div>
          )}

          {/* How to Spend */}
          <div className="px-6 py-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
              How to Spend
            </p>
            <p className="text-sm text-[--muted] mb-6 max-w-2xl">
              Tip reviews you appreciate. The reviewer earns Wax and your tip shows 
              community support. Better reviews get more visibility.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 border border-[--border]">
                <span className="text-sm">Standard</span>
                <span className="ml-2 text-[--muted]">5 Wax</span>
              </div>
              <div className="px-4 py-2 border border-purple-500/30">
                <span className="text-sm text-purple-400">Premium</span>
                <span className="ml-2 text-[--muted]">20 Wax</span>
              </div>
              <div className="px-4 py-2 border border-[#ffd700]/30">
                <span className="text-sm text-[#ffd700]">GOLD</span>
                <span className="ml-2 text-[--muted]">100 Wax</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HISTORY Tab */}
      {activeTab === "history" && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              Recent Transactions
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center border border-[--border]">
              <p className="text-[--muted] mb-2">No transactions yet.</p>
              <p className="text-sm text-[--muted]">
                Start reviewing albums to earn Wax.
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
                  <div className={`w-12 h-12 flex items-center justify-center font-bold tabular-nums ${
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

      {/* CTA */}
      <section className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link 
            href="/discover"
            className="block p-6 border border-[--border] hover:border-white transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium group-hover:text-[--muted] transition">
                  Find Your Next Call
                </p>
                <p className="text-sm text-[--muted]">
                  Discover new releases and review them before they trend.
                </p>
              </div>
              <svg className="w-5 h-5 text-[--muted] group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
