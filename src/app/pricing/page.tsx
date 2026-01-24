"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

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
      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 lg:py-24 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
            Membership
          </p>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-[-0.02em] mb-6">
            Your taste.<br />Verified forever.
          </h1>
          <p className="text-lg text-[--muted] max-w-2xl mx-auto mb-8">
            Every album you call before it blows up is recorded. Every Gold Spin is proof. 
            This is your permanent music credibility.
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#ffd700]/30 text-sm">
            <span className="text-[#ffd700] font-bold">47 Gold Spins</span>
            <span className="text-[--muted]">=</span>
            <span>"I called 47 albums before they trended"</span>
          </div>
        </div>
      </section>

      {message && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="p-4 border border-[--border]">
            <p className="text-sm">{message}</p>
          </div>
        </div>
      )}

      {/* The Value */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
              How it works
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">
              Everyone earns badges fairly.<br />
              Subscribers see what others miss.
            </h2>
            <p className="text-[--muted] mb-8">
              Free users and subscribers both earn badges when they call albums early. 
              The difference is subscribers see which albums are <span className="text-white">about to trend</span> so 
              they can still get in before it happens.
            </p>
            
            {/* Trending Radar */}
            <div className="border-2 border-white/20 p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border border-[#ffd700] flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#ffd700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold mb-2">Trending Radar</p>
                  <p className="text-sm text-[--muted] mb-3">
                    Albums at 70, 80, 90 reviews. Approaching the 100 threshold. 
                    Review now and you still qualify for a badge when it trends.
                  </p>
                  <p className="text-xs text-[#ffd700]">
                    Subscribers earn 3x more Gold Spins on average.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Math */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            The math
          </p>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="p-6 border border-[--border]">
              <p className="text-5xl font-bold mb-2">1</p>
              <p className="text-lg font-medium mb-2">Gold Spin per month</p>
              <p className="text-sm text-[--muted] mb-4">
                One early call on a trending album earns you 100 Wax.
              </p>
              <p className="text-xs text-[--muted]">
                Worth about $1 in Wax
              </p>
            </div>
            <div className="p-6 border border-[--border]">
              <p className="text-5xl font-bold mb-2">$5</p>
              <p className="text-lg font-medium mb-2">Monthly subscription</p>
              <p className="text-sm text-[--muted] mb-4">
                Trending Radar helps you catch 2 to 3 more badges every month.
              </p>
              <p className="text-xs text-[--muted]">
                200 to 300 extra Wax
              </p>
            </div>
            <div className="p-6 border border-[#ffd700]/30">
              <p className="text-5xl font-bold text-[#ffd700] mb-2">∞</p>
              <p className="text-lg font-medium mb-2">Permanent record</p>
              <p className="text-sm text-[--muted] mb-4">
                Your Tastemaker Score lives forever. Your music resume.
              </p>
              <p className="text-xs text-[#ffd700]">
                Priceless credibility
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3">
            {/* Free Tier */}
            <div className="px-6 py-12 lg:border-r border-b lg:border-b-0 border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                Free
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <p className="text-sm text-[--muted] mb-8">
                Earn badges. Build your score. Forever free.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Earn First Spin badges</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Build Tastemaker Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">5 Wax per review</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Tip reviews</span>
                </div>
                <div className="flex items-center gap-3 text-[--muted]">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">No Trending Radar</span>
                </div>
              </div>

              <button
                disabled
                className="w-full py-3 px-4 border border-[--border] text-[--muted] text-[11px] tracking-[0.15em] uppercase cursor-not-allowed"
              >
                {currentTier === "FREE" ? "Current" : "Downgrade"}
              </button>
            </div>

            {/* Wax+ Tier */}
            <div className="px-6 py-12 lg:border-r border-b lg:border-b-0 border-[--border] relative bg-white/[0.02]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-white" />
              <div className="absolute -top-3 left-6 px-3 py-1 bg-white text-black text-[9px] tracking-wider uppercase font-bold">
                Most Popular
              </div>
              
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3 mt-2">
                Wax+
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-sm text-[--muted]">/mo</span>
              </div>
              <p className="text-sm text-[--muted] mb-8">
                See what others miss. Never miss a Gold Spin.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Everything in Free</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#ffd700] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium">Trending Radar</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Unlimited tipping</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Premium tips</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Early notifications</span>
                </div>
              </div>

              {currentTier === "WAX_PLUS" ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading === "manage"}
                  className="w-full py-3 px-4 border border-white text-[11px] tracking-[0.15em] uppercase hover:bg-white/10 transition disabled:opacity-50"
                >
                  {loading === "manage" ? "Loading..." : "Manage"}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe("WAX_PLUS")}
                  disabled={loading === "WAX_PLUS" || currentTier === "WAX_PRO"}
                  className="w-full py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === "WAX_PLUS" ? "Loading..." : currentTier === "WAX_PRO" ? "Current Pro" : "Get Started"}
                </button>
              )}
            </div>

            {/* Pro Tier */}
            <div className="px-6 py-12 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#ffd700]" />
              
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                Pro
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-sm text-[--muted]">/mo</span>
              </div>
              <p className="text-sm text-[--muted] mb-8">
                For serious tastemakers. Maximum credibility.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Everything in Wax+</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#ffd700] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-[#ffd700]">GOLD tips</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#ffd700] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Momentum Analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#ffd700] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Verified badge eligible</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#ffd700] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Featured in leaderboards</span>
                </div>
              </div>

              {currentTier === "WAX_PRO" ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading === "manage"}
                  className="w-full py-3 px-4 border border-[#ffd700]/50 text-[#ffd700] text-[11px] tracking-[0.15em] uppercase hover:bg-[#ffd700]/10 transition disabled:opacity-50"
                >
                  {loading === "manage" ? "Loading..." : "Manage"}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe("WAX_PRO")}
                  disabled={loading === "WAX_PRO"}
                  className="w-full py-4 bg-[#ffd700] text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#ffed4a] transition disabled:opacity-50"
                >
                  {loading === "WAX_PRO" ? "Loading..." : "Go Pro"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Real Value */}
      <section className="border-b border-[--border]">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
            What it means
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-6">
            This is proof.
          </h2>
          <p className="text-[--muted] mb-8 max-w-2xl mx-auto">
            Anyone can say they were listening to something before it blew up. 
            WAXFEED gives you timestamped, verified proof that you called it.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            <div className="p-4 border border-[--border]">
              <p className="text-sm font-medium mb-1">For DJs</p>
              <p className="text-xs text-[--muted]">
                "My Tastemaker Score is 340. I have 12 Gold Spins."
              </p>
            </div>
            <div className="p-4 border border-[--border]">
              <p className="text-sm font-medium mb-1">For Writers</p>
              <p className="text-xs text-[--muted]">
                "I reviewed this 6 months before Pitchfork."
              </p>
            </div>
            <div className="p-4 border border-[--border]">
              <p className="text-sm font-medium mb-1">For A&R</p>
              <p className="text-xs text-[--muted]">
                "I spotted 8 artists before they signed."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency */}
      <section className="border-b border-[--border] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-lg font-medium mb-3">
            Albums are trending every day.
          </p>
          <p className="text-sm text-[--muted] mb-6">
            Every day without reviewing is a potential Gold Spin you might miss.
          </p>
          <Link
            href="/discover"
            className="inline-block px-8 py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition"
          >
            Start Reviewing
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            Questions
          </p>
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl">
            <div>
              <p className="text-sm font-medium mb-2">What if I cancel?</p>
              <p className="text-sm text-[--muted]">
                Your badges and Tastemaker Score stay forever. You just lose 
                access to Trending Radar and premium features.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Is badge earning fair?</p>
              <p className="text-sm text-[--muted]">
                Yes. Free users and subscribers earn badges the same way. 
                Subscribers just have better tools to find opportunities.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">What is Trending Radar?</p>
              <p className="text-sm text-[--muted]">
                A feed showing albums approaching 100 reviews. Review them now 
                and you still qualify for badges when they trend.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Can I try before subscribing?</p>
              <p className="text-sm text-[--muted]">
                Yes. Free forever. Earn badges, build your score. Subscribe 
                when you want to maximize your shot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[--muted]">
            Your taste. Verified forever.
          </p>
          <div className="flex gap-4">
            <Link
              href="/wallet"
              className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
            >
              Your Spins
            </Link>
            <Link
              href="/leaderboard"
              className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
