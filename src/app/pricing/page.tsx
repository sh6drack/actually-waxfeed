"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

const TIERS = {
  FREE: {
    name: "Free",
    price: "0",
    period: "",
    waxGrant: 0,
    features: [
      "Earn up to 100 Wax/week",
      "Award Standard Wax",
      "50 items per list",
      "Basic features",
    ],
    limitations: [
      "Weekly earning cap",
      "No Premium Wax",
      "Ads shown",
    ],
  },
  WAX_PLUS: {
    name: "Wax+",
    price: "4.99",
    period: "/mo",
    waxGrant: 300,
    features: [
      "300 Wax monthly",
      "No weekly cap",
      "1.5x earning multiplier",
      "Award Premium Wax",
      "100 items per list",
      "Ad-free",
    ],
    limitations: [],
  },
  WAX_PRO: {
    name: "Pro",
    price: "9.99",
    period: "/mo",
    waxGrant: 750,
    features: [
      "750 Wax monthly",
      "2x earning multiplier",
      "Award GOLD Wax",
      "Unlimited lists",
      "Full analytics",
      "Verified eligible",
    ],
    limitations: [],
  },
}

export default function PricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentTier, setCurrentTier] = useState<string>("FREE")
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const canceled = searchParams.get("canceled")

  useEffect(() => {
    if (canceled) {
      setMessage("Checkout canceled.")
    }
  }, [canceled])

  useEffect(() => {
    const fetchUserTier = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setCurrentTier(data.data.tier || "FREE")
        }
      } catch (error) {
        console.error("Failed to fetch tier:", error)
      }
    }
    fetchUserTier()
  }, [session])

  const handleSubscribe = async (tier: "WAX_PLUS" | "WAX_PRO") => {
    if (!session) {
      router.push("/login?redirect=/pricing")
      return
    }

    setLoading(tier)
    setMessage("")

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          productId: tier,
        }),
      })

      const data = await res.json()

      if (data.success && data.data.url) {
        window.location.href = data.data.url
      } else {
        setMessage(data.error || "Failed to start checkout")
      }
    } catch (error) {
      setMessage("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoading("manage")
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      })
      const data = await res.json()
      if (data.success && data.data.url) {
        window.location.href = data.data.url
      } else {
        setMessage(data.error || "Failed to open portal")
      }
    } catch (error) {
      setMessage("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                Membership
              </p>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-4">
                Wax Tiers
              </h1>
              <p className="text-base text-[--muted] max-w-xl">
                Earn more, award Premium & GOLD Wax, unlock exclusive features.
              </p>
            </div>
            <div className="flex-shrink-0 lg:text-right">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-1">
                Current Plan
              </p>
              <p className="text-2xl font-medium">
                {currentTier === "WAX_PRO" ? "Pro" : currentTier === "WAX_PLUS" ? "Wax+" : "Free"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="p-4 border border-[--border]" style={{ backgroundColor: 'var(--background)' }}>
            <p className="text-sm">{message}</p>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3">
          {/* Free Tier */}
          <div className="px-6 py-10 border-b lg:border-b-0 lg:border-r border-[--border]">
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                01 — Free
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-bold tracking-tight">$0</span>
              </div>
              <p className="text-sm text-[--muted]">
                For casual listeners
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {TIERS.FREE.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[--muted] mt-0.5">+</span>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
              {TIERS.FREE.limitations.map((limitation, i) => (
                <div key={i} className="flex items-start gap-3 text-[--muted]">
                  <span className="mt-0.5">−</span>
                  <span className="text-sm">{limitation}</span>
                </div>
              ))}
            </div>

            <button
              disabled
              className="w-full py-3 px-4 border border-[--border] text-[--muted] text-[11px] tracking-[0.15em] uppercase cursor-not-allowed"
            >
              {currentTier === "FREE" ? "Current Plan" : "Downgrade via Portal"}
            </button>
          </div>

          {/* Wax+ Tier */}
          <div className="px-6 py-10 border-b lg:border-b-0 lg:border-r border-[--border] relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-white" />
            
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                02 — Wax+
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-bold tracking-tight">$4.99</span>
                <span className="text-sm text-[--muted]">/mo</span>
              </div>
              <p className="text-sm text-[--muted]">
                For active reviewers
              </p>
              <p className="text-xs text-white/70 mt-2">
                +300 Wax monthly
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {TIERS.WAX_PLUS.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-white mt-0.5">+</span>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {currentTier === "WAX_PLUS" ? (
              <button
                onClick={handleManageSubscription}
                disabled={loading === "manage"}
                className="w-full py-3 px-4 border border-[--border] text-[11px] tracking-[0.15em] uppercase hover:bg-[--border]/20 transition disabled:opacity-50"
              >
                {loading === "manage" ? "Loading..." : "Manage Subscription"}
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe("WAX_PLUS")}
                disabled={loading === "WAX_PLUS" || currentTier === "WAX_PRO"}
                className="w-full py-3 px-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-[#e5e5e5] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "WAX_PLUS" ? "Loading..." : currentTier === "WAX_PRO" ? "Current: Pro" : "Upgrade to Wax+"}
              </button>
            )}
          </div>

          {/* Pro Tier */}
          <div className="px-6 py-10 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#ffd700]" />
            
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                03 — Pro
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-bold tracking-tight">$9.99</span>
                <span className="text-sm text-[--muted]">/mo</span>
              </div>
              <p className="text-sm text-[--muted]">
                For power users
              </p>
              <p className="text-xs text-[#ffd700] mt-2">
                +750 Wax monthly
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {TIERS.WAX_PRO.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[#ffd700] mt-0.5">+</span>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {currentTier === "WAX_PRO" ? (
              <button
                onClick={handleManageSubscription}
                disabled={loading === "manage"}
                className="w-full py-3 px-4 border border-[#ffd700]/50 text-[#ffd700] text-[11px] tracking-[0.15em] uppercase hover:bg-[#ffd700]/10 transition disabled:opacity-50"
              >
                {loading === "manage" ? "Loading..." : "Manage Subscription"}
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe("WAX_PRO")}
                disabled={loading === "WAX_PRO"}
                className="w-full py-3 px-4 bg-[#ffd700] text-black text-[11px] tracking-[0.15em] uppercase font-medium hover:bg-[#ffed4a] transition disabled:opacity-50"
              >
                {loading === "WAX_PRO" ? "Loading..." : "Go Pro"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Why Upgrade - Value Breakdown */}
      <section className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            Why Upgrade?
          </p>
          <div className="grid lg:grid-cols-4 gap-8">
            <div>
              <p className="text-3xl font-bold mb-2">300+</p>
              <p className="text-sm text-[--muted]">
                Free Wax every month with Wax+. 750 with Pro. That's worth $3-$7.50 in the shop.
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">2x</p>
              <p className="text-sm text-[--muted]">
                Earn Wax twice as fast with Pro. Every review, every daily, every bonus — doubled.
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2 text-[#ffd700]">GOLD</p>
              <p className="text-sm text-[--muted]">
                Award GOLD Wax to reviews that blow your mind. Pro exclusive. Reviews get noticed.
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold mb-2">∞</p>
              <p className="text-sm text-[--muted]">
                No weekly earning cap. Free users max out at 100/week. Subscribers keep earning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wax Types */}
      <section className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2">
            <div className="px-6 py-12 lg:border-r border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
                What is Wax?
              </p>
              <p className="text-sm text-[--muted] leading-relaxed mb-6">
                Wax is how you show appreciation on Waxfeed. Award it to reviews you love,
                and the author earns Wax too. Great reviewers build up Wax from the community.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-[--border] flex items-center justify-center">
                    <span className="text-[10px] font-bold">S</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Standard — 5 Wax</p>
                    <p className="text-xs text-[--muted]">Everyone can award</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-purple-500/50 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-purple-400">P</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Premium — 20 Wax</p>
                    <p className="text-xs text-[--muted]">Wax+ and Pro members</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-[#ffd700]/50 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#ffd700]">G</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">GOLD — 100 Wax</p>
                    <p className="text-xs text-[--muted]">Pro exclusive, highest honor</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-12 border-t lg:border-t-0 border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
                FAQ
              </p>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Can I cancel anytime?</p>
                  <p className="text-sm text-[--muted]">
                    Yes. Cancel via the billing portal. Benefits last until your billing period ends.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">What happens to my Wax if I downgrade?</p>
                  <p className="text-sm text-[--muted]">
                    Your balance stays. You just won't earn as quickly or award Premium/GOLD Wax.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Need more Wax instantly?</p>
                  <p className="text-sm text-[--muted]">
                    <Link href="/shop" className="underline hover:no-underline">
                      Visit the shop
                    </Link>
                    {" "}to purchase Wax Pax.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer nav */}
      <footer className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <Link
            href="/wallet"
            className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Wallet
          </Link>
          <Link
            href="/shop"
            className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors flex items-center gap-2"
          >
            Shop
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </footer>
    </div>
  )
}
