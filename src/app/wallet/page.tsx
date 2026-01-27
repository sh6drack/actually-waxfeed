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
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
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
  const [activeTab, setActiveTab] = useState<"earn" | "badges" | "history">("earn")

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

        try {
          const badgesRes = await fetch("/api/first-spin/badges")
          const badgesData = await badgesRes.json()
          if (badgesData.success) setBadges(badgesData.data || [])
        } catch (e) {}
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
          <p className="text-[var(--muted)]">Failed to load wallet.</p>
        </div>
      </div>
    )
  }

  const totalBadges = stats.goldSpinCount + stats.silverSpinCount + stats.bronzeSpinCount

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Section */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* WAX Balance */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-2">
                Your WAX Balance
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl lg:text-7xl font-bold tracking-tight tabular-nums text-[#ffd700]">
                  {stats.balance.toLocaleString()}
                </span>
                <span className="text-lg text-[var(--muted)]">WAX</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2">
                Lifetime earned: <span className="text-green-500">+{stats.lifetimeEarned.toLocaleString()}</span>
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">{stats.tastemakeScore}</p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">Score</p>
              </div>
              <div className="h-10 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#ffd700] tabular-nums">{stats.goldSpinCount}</p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--muted)]">Gold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#888] tabular-nums">{stats.silverSpinCount}</p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--muted)]">Silver</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600 tabular-nums">{stats.bronzeSpinCount}</p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--muted)]">Bronze</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA Banner - Earn OR Buy */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earn WAX */}
            <div className="flex items-center justify-between gap-4 p-4 border border-[var(--border)]">
              <div>
                <p className="font-bold">
                  Earn <span className="text-[#ffd700]">+1 WAX</span> per rating
                </p>
                <p className="text-sm text-[var(--muted)]">Free, unlimited</p>
              </div>
              <Link
                href="/quick-rate"
                className="px-5 py-2 border border-[var(--foreground)] text-sm font-bold uppercase tracking-wider hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                Rate
              </Link>
            </div>
            {/* Buy WAX */}
            <div className="flex items-center justify-between gap-4 p-4 border border-[#ffd700]">
              <div>
                <p className="font-bold text-[#ffd700]">
                  Get WAX Packs
                </p>
                <p className="text-sm text-[var(--muted)]">Starting at $0.99</p>
              </div>
              <Link
                href="/shop"
                className="px-5 py-2 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("earn")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeTab === "earn"
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              How to Earn
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeTab === "badges"
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Badges ({totalBadges})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 text-[11px] tracking-[0.15em] uppercase transition border-b-2 -mb-px ${
                activeTab === "history"
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </section>

      {/* HOW TO EARN Tab */}
      {activeTab === "earn" && (
        <section className="w-full px-6 lg:px-12 xl:px-20 py-10">
          {/* Main Ways */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Rate Albums */}
            <Link href="/quick-rate" className="group p-6 border border-[var(--border)] hover:border-[#ffd700] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 border border-[#ffd700] flex items-center justify-center text-[#ffd700]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-[#ffd700]">+1</span>
              </div>
              <p className="font-bold mb-1 group-hover:text-[var(--muted)] transition-colors">Rate Any Album</p>
              <p className="text-sm text-[var(--muted)]">
                Every album you rate earns 1 WAX instantly. Quick and simple.
              </p>
            </Link>

            {/* Write Review */}
            <Link href="/discover" className="group p-6 border border-[var(--border)] hover:border-[var(--foreground)] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 border border-[var(--border)] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold">+5</span>
              </div>
              <p className="font-bold mb-1 group-hover:text-[var(--muted)] transition-colors">Write a Full Review</p>
              <p className="text-sm text-[var(--muted)]">
                Add written thoughts to your rating for 5 bonus WAX.
              </p>
            </Link>
          </div>

          {/* First Spin Bonuses */}
          <div className="mb-12">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-6">
              Bonus: First Spin Badges
            </p>
            <p className="text-sm text-[var(--muted)] mb-6 max-w-2xl">
              Review albums before they trend. When an album hits 100+ reviews, 
              early reviewers automatically receive badges and bonus WAX.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 border border-[#ffd700]/30 bg-[#ffd700]/5">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-[#ffd700]">Gold Spin</span>
                  <span className="text-xl font-bold text-[#ffd700]">+100</span>
                </div>
                <p className="text-sm text-[var(--muted)]">First 10 reviewers</p>
              </div>
              <div className="p-5 border border-[var(--border)]">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-[var(--muted)]">Silver Spin</span>
                  <span className="text-xl font-bold">+50</span>
                </div>
                <p className="text-sm text-[var(--muted)]">Positions 11-50</p>
              </div>
              <div className="p-5 border border-amber-600/30">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-amber-600">Bronze Spin</span>
                  <span className="text-xl font-bold text-amber-600">+25</span>
                </div>
                <p className="text-sm text-[var(--muted)]">Positions 51-100</p>
              </div>
            </div>
          </div>

          {/* What WAX Can Do - Value Proposition */}
          <div className="mb-12">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-6">
              What WAX Can Do
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 border border-[var(--border)]">
                <p className="text-2xl font-bold mb-2">Tip Reviews</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Support tastemakers who help you discover music. Tipped reviews get more visibility.
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 border border-[var(--border)]">5 WAX</span>
                  <span className="px-2 py-1 border border-purple-500/30 text-purple-500">20 WAX</span>
                  <span className="px-2 py-1 border border-[#ffd700]/30 text-[#ffd700]">100 WAX</span>
                </div>
              </div>
              <div className="p-5 border border-[var(--border)]">
                <p className="text-2xl font-bold mb-2">Custom Cursor</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Unlock custom cursor colors and styles. Show off your personality.
                </p>
                <p className="text-xs text-[#ffd700]">Coming Soon</p>
              </div>
              <div className="p-5 border border-[var(--border)]">
                <p className="text-2xl font-bold mb-2">Profile Flair</p>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Special badges, profile borders, and customization options.
                </p>
                <p className="text-xs text-[#ffd700]">Coming Soon</p>
              </div>
            </div>
          </div>

          {/* Get More WAX - Purchase CTA */}
          <div className="p-6 border border-[#ffd700] bg-[#ffd700]/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-2">
                  Need More WAX?
                </p>
                <p className="text-xl font-bold mb-2">Get WAX Packs</p>
                <p className="text-sm text-[var(--muted)]">
                  Instant delivery. Bonus WAX on larger packs. Support the platform.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/shop"
                  className="px-8 py-3 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors text-center"
                >
                  View WAX Packs
                </Link>
                <p className="text-xs text-center text-[var(--muted)]">From $0.99 · Up to 50% bonus</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BADGES Tab */}
      {activeTab === "badges" && (
        <section className="w-full px-6 lg:px-12 xl:px-20 py-10">
          {totalBadges === 0 ? (
            <div className="py-16 border border-[var(--border)] text-center">
              <div className="w-14 h-14 border border-[#ffd700] flex items-center justify-center mx-auto mb-4 text-[#ffd700]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-lg font-bold mb-2">No badges yet</p>
              <p className="text-sm text-[var(--muted)] mb-6 max-w-sm mx-auto">
                Review albums early. When they trend, you'll earn badges based on your position.
              </p>
              <Link
                href="/discover"
                className="inline-block px-6 py-3 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Start Reviewing
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-6">
                Your Collection
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`p-5 border ${
                      badge.badgeType === 'GOLD' 
                        ? 'border-[#ffd700]/50 bg-[#ffd700]/5' 
                        : badge.badgeType === 'SILVER'
                          ? 'border-[var(--border)]'
                          : 'border-amber-600/50 bg-amber-600/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold ${
                        badge.badgeType === 'GOLD' 
                          ? 'border border-[#ffd700] text-[#ffd700]' 
                          : badge.badgeType === 'SILVER'
                            ? 'border border-[var(--border)]'
                            : 'border border-amber-600 text-amber-600'
                      }`}>
                        #{badge.position}
                      </div>
                      <span className={`text-lg font-bold ${
                        badge.badgeType === 'GOLD' 
                          ? 'text-[#ffd700]' 
                          : badge.badgeType === 'SILVER'
                            ? 'text-[var(--foreground)]'
                            : 'text-amber-600'
                      }`}>
                        +{badge.waxAwarded}
                      </span>
                    </div>
                    <p className={`text-sm font-bold mb-1 ${
                      badge.badgeType === 'GOLD' 
                        ? 'text-[#ffd700]' 
                        : badge.badgeType === 'SILVER'
                          ? ''
                          : 'text-amber-600'
                    }`}>{badge.badgeType} Spin</p>
                    <p className="text-xs text-[var(--muted)]">
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
        <section className="w-full px-6 lg:px-12 xl:px-20 py-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)] mb-6">
            Recent Transactions
          </p>

          {transactions.length === 0 ? (
            <div className="py-16 text-center border border-[var(--border)]">
              <p className="text-[var(--muted)] mb-4">No transactions yet.</p>
              <Link
                href="/quick-rate"
                className="inline-block px-6 py-3 bg-[#ffd700] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#ffed4a] transition-colors"
              >
                Start Rating
              </Link>
            </div>
          ) : (
            <div className="border border-[var(--border)]">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.id} 
                  className={`flex items-center gap-4 px-5 py-4 ${
                    index < transactions.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <div className={`w-12 text-right font-bold tabular-nums ${
                    tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Bottom CTAs */}
      <section className="border-t border-[var(--border)]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8">
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/discover"
              className="group flex items-center justify-between p-5 border border-[var(--border)] hover:border-[var(--foreground)] transition-colors"
            >
              <div>
                <p className="font-bold group-hover:text-[var(--muted)] transition-colors">
                  Discover Albums
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Review early, earn badges
                </p>
              </div>
              <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link 
              href="/shop"
              className="group flex items-center justify-between p-5 border border-[#ffd700]/50 hover:border-[#ffd700] transition-colors"
            >
              <div>
                <p className="font-bold text-[#ffd700] group-hover:text-[#ffed4a] transition-colors">
                  Get WAX Packs
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Instant WAX, bonus included
                </p>
              </div>
              <svg className="w-5 h-5 text-[#ffd700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
