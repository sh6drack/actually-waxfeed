"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Tooltip } from "@/components/ui/tooltip"

type UserStats = {
  tastemakeScore: number
  goldSpinCount: number
  silverSpinCount: number
  bronzeSpinCount: number
  waxBalance: number
  tier: string
}

export function FirstSpinWidget() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setStats({
            tastemakeScore: data.data.tastemakeScore || 0,
            goldSpinCount: data.data.goldSpinCount || 0,
            silverSpinCount: data.data.silverSpinCount || 0,
            bronzeSpinCount: data.data.bronzeSpinCount || 0,
            waxBalance: data.data.balance || 0,
            tier: data.data.tier || "FREE",
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [session])

  if (!session) {
    return (
      <div className="border border-[--border]">
        {/* Header */}
        <div className="p-4 border-b border-[--border]">
          <h3 className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
            Your Taste Verified
          </h3>
          <p className="text-xl font-bold">Called It First?</p>
          <p className="text-xl font-bold text-[--muted]">Prove It.</p>
        </div>

        {/* The Hook */}
        <div className="p-4 border-b border-[--border]">
          <p className="text-sm text-[--muted] mb-4">
            Write thoughtful reviews to earn badges. When an album trends, early reviewers get credited.
          </p>
          <p className="text-[10px] text-[--muted]/70 mb-4 border-l-2 border-[var(--accent-primary)]/30 pl-2">
            Only reviews with text count toward First Spin badges. Quick rates don't qualify.
          </p>
          <div className="p-3 border border-[var(--accent-primary)]/30 mb-4">
            <p className="text-sm">
              <span className="text-[var(--accent-primary)] font-bold">47 Gold Spins</span>
              <span className="text-[--muted]"> means you called 47 albums first</span>
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--accent-primary)]">Gold Spin</span>
              <span className="text-[--muted]">First 10 reviewers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Silver Spin</span>
              <span className="text-[--muted]">First 50 reviewers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Bronze Spin</span>
              <span className="text-[--muted]">First 100 reviewers</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-4">
          <Link
            href="/login"
            className="block w-full py-3 bg-white text-black text-center text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition no-underline"
          >
            Start Building Your Record
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border border-[--border] p-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
          Loading...
        </p>
      </div>
    )
  }

  const hasAnySpins = stats && (stats.goldSpinCount > 0 || stats.silverSpinCount > 0 || stats.bronzeSpinCount > 0)
  const totalSpins = (stats?.goldSpinCount || 0) + (stats?.silverSpinCount || 0) + (stats?.bronzeSpinCount || 0)
  const isSubscriber = stats?.tier && stats.tier !== "FREE"

  return (
    <div className="border border-[--border]">
      {/* Header with Tastemaker Score */}
      <div className="p-4 border-b border-[--border]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              Tastemaker Score
            </h3>
            <Tooltip content="Your discovery reputation. Earn points by reviewing albums before they trend: Gold = 10pts, Silver = 5pts, Bronze = 2pts.">
              <svg className="w-3 h-3 text-[#666] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </div>
          {isSubscriber && (
            <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
              {stats?.tier === "WAX_PRO" ? "Pro" : "Wax+"}
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-4xl font-bold tabular-nums">{stats?.tastemakeScore || 0}</p>
          <Tooltip content="Wax is WaxFeed's currency. Earn it by reviewing albums, getting badges, and engaging with the community. Spend it in the shop.">
            <div className="text-right cursor-help">
              <p className="text-lg font-bold tabular-nums">{stats?.waxBalance?.toLocaleString() || 0}</p>
              <p className="text-[9px] text-[--muted] uppercase">Wax</p>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Spin Badges */}
      <div className="p-4 border-b border-[--border]">
        <div className="flex items-center justify-between gap-2">
          <Tooltip content="Gold Spin: You were one of the FIRST 10 people to review this album before it trended. Earns +100 Wax.">
            <div className="flex-1 text-center p-2 cursor-help hover:bg-[var(--accent-primary)]/5 transition-colors rounded">
              <p className="text-2xl font-bold tabular-nums text-[var(--accent-primary)]">{stats?.goldSpinCount || 0}</p>
              <p className="text-[9px] text-[--muted] uppercase tracking-wider">Gold</p>
            </div>
          </Tooltip>
          <div className="w-px h-8 bg-[--border]" />
          <Tooltip content="Silver Spin: You were one of the first 50 reviewers before the album trended. Earns +50 Wax.">
            <div className="flex-1 text-center p-2 cursor-help hover:bg-gray-400/5 transition-colors rounded">
              <p className="text-2xl font-bold tabular-nums text-gray-400">{stats?.silverSpinCount || 0}</p>
              <p className="text-[9px] text-[--muted] uppercase tracking-wider">Silver</p>
            </div>
          </Tooltip>
          <div className="w-px h-8 bg-[--border]" />
          <Tooltip content="Bronze Spin: You were one of the first 100 reviewers before the album trended. Earns +25 Wax.">
            <div className="flex-1 text-center p-2 cursor-help hover:bg-amber-700/5 transition-colors rounded">
              <p className="text-2xl font-bold tabular-nums text-amber-700">{stats?.bronzeSpinCount || 0}</p>
              <p className="text-[9px] text-[--muted] uppercase tracking-wider">Bronze</p>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        {isSubscriber ? (
          <div>
            <Link
              href="/radar"
              className="flex items-center justify-between w-full p-3 border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)] transition mb-3 no-underline"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">Trending Radar</span>
              </div>
              <span className="text-xs text-[--muted]">View</span>
            </Link>
            <Link
              href="/discover"
              className="block w-full py-2 text-center text-[10px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition no-underline"
            >
              Discover Albums
            </Link>
          </div>
        ) : (
          <div>
            {hasAnySpins ? (
              <p className="text-xs text-[--muted] mb-3">
                {totalSpins} badge{totalSpins !== 1 ? 's' : ''} earned. Keep building.
              </p>
            ) : (
              <p className="text-xs text-[--muted] mb-3">
                Write reviews before albums trend to earn badges.
              </p>
            )}
            <Link
              href="/radar"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-[--border] text-center text-[10px] tracking-[0.15em] uppercase hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition no-underline mb-2"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Trending Radar
            </Link>
            <Link
              href="/discover"
              className="block w-full py-2.5 bg-white text-black text-center text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition no-underline"
            >
              Find Albums
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
