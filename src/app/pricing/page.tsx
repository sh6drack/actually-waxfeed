"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

const TIERS = {
  FREE: {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Basic features",
      "Earn up to 100 Wax/week",
      "Award Standard Wax only",
      "50 items per list",
    ],
    limitations: [
      "Weekly earning cap",
      "No Premium Wax",
      "No GOLD Wax",
      "Ads shown",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  WAX_PLUS: {
    name: "Wax+",
    price: "$4.99",
    period: "/month",
    features: [
      "300 Wax monthly grant",
      "No weekly earning cap",
      "1.5x earning multiplier",
      "Award Premium Wax (20 Wax)",
      "100 items per list",
      "Ad-free experience",
      "Unlimited username changes",
      "Basic profile analytics",
    ],
    limitations: [],
    cta: "Upgrade to Wax+",
    popular: true,
  },
  WAX_PRO: {
    name: "Wax Pro",
    price: "$9.99",
    period: "/month",
    features: [
      "750 Wax monthly grant",
      "No weekly earning cap",
      "2x earning multiplier",
      "Award GOLD Wax (100 Wax)",
      "Award Premium Wax (15 Wax)",
      "Unlimited list items",
      "Full profile analytics",
      "Verified badge eligible",
      "Exclusive badges access",
      "Priority in Hot Takes",
    ],
    limitations: [],
    cta: "Go Pro",
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
      setMessage("Checkout canceled. You can try again anytime.")
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tighter mb-4">
          Unlock Your Full Wax Potential
        </h1>
        <p className="text-xl text-[#888] max-w-2xl mx-auto">
          Earn more Wax, award Premium & GOLD Wax to reviews you love, 
          and stand out with exclusive features.
        </p>
      </div>

      {message && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-center">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Free Tier */}
        <div className="border border-[#333] rounded-2xl p-6 bg-[#111]">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">{TIERS.FREE.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{TIERS.FREE.price}</span>
              <span className="text-[#888]">{TIERS.FREE.period}</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {TIERS.FREE.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-[#ccc]">{feature}</span>
              </li>
            ))}
            {TIERS.FREE.limitations.map((limitation, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span className="text-[#666]">{limitation}</span>
              </li>
            ))}
          </ul>

          <button
            disabled
            className="w-full py-3 px-4 rounded-lg bg-[#222] text-[#666] cursor-not-allowed"
          >
            {currentTier === "FREE" ? "Current Plan" : "Downgrade via Portal"}
          </button>
        </div>

        {/* Wax+ Tier */}
        <div className="border-2 border-yellow-500 rounded-2xl p-6 bg-[#111] relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
            MOST POPULAR
          </div>

          <div className="mb-6 mt-2">
            <h3 className="text-2xl font-bold mb-2">{TIERS.WAX_PLUS.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{TIERS.WAX_PLUS.price}</span>
              <span className="text-[#888]">{TIERS.WAX_PLUS.period}</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {TIERS.WAX_PLUS.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">✓</span>
                <span className="text-[#ccc]">{feature}</span>
              </li>
            ))}
          </ul>

          {currentTier === "WAX_PLUS" ? (
            <button
              onClick={handleManageSubscription}
              disabled={loading === "manage"}
              className="w-full py-3 px-4 rounded-lg bg-[#333] text-white hover:bg-[#444] transition disabled:opacity-50"
            >
              {loading === "manage" ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <button
              onClick={() => handleSubscribe("WAX_PLUS")}
              disabled={loading === "WAX_PLUS" || currentTier === "WAX_PRO"}
              className="w-full py-3 px-4 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
            >
              {loading === "WAX_PLUS" ? "Loading..." : currentTier === "WAX_PRO" ? "Downgrade via Portal" : TIERS.WAX_PLUS.cta}
            </button>
          )}
        </div>

        {/* Wax Pro Tier */}
        <div className="border border-purple-500 rounded-2xl p-6 bg-[#111] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full" />

          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{TIERS.WAX_PRO.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{TIERS.WAX_PRO.price}</span>
              <span className="text-[#888]">{TIERS.WAX_PRO.period}</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {TIERS.WAX_PRO.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">✓</span>
                <span className="text-[#ccc]">{feature}</span>
              </li>
            ))}
          </ul>

          {currentTier === "WAX_PRO" ? (
            <button
              onClick={handleManageSubscription}
              disabled={loading === "manage"}
              className="w-full py-3 px-4 rounded-lg bg-[#333] text-white hover:bg-[#444] transition disabled:opacity-50"
            >
              {loading === "manage" ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <button
              onClick={() => handleSubscribe("WAX_PRO")}
              disabled={loading === "WAX_PRO"}
              className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition disabled:opacity-50"
            >
              {loading === "WAX_PRO" ? "Loading..." : TIERS.WAX_PRO.cta}
            </button>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <details className="border border-[#333] rounded-lg p-4 group">
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
              What is Wax?
              <span className="text-[#666] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-[#888]">
              Wax is the currency of Waxfeed. You earn it by being active (daily logins, reviews, receiving Wax on your reviews) 
              and spend it to award Wax to reviews you appreciate, boost your content, and unlock exclusive items in the shop.
            </p>
          </details>

          <details className="border border-[#333] rounded-lg p-4 group">
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
              What&apos;s the difference between Standard, Premium, and GOLD Wax?
              <span className="text-[#666] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-[#888]">
              Standard Wax is available to everyone. Premium Wax (purple) is exclusive to Wax+ and Pro subscribers and 
              shows extra appreciation. GOLD Wax (gold) is the highest honor, exclusive to Pro subscribers, 
              and makes reviews really stand out.
            </p>
          </details>

          <details className="border border-[#333] rounded-lg p-4 group">
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
              Can I cancel anytime?
              <span className="text-[#666] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-[#888]">
              Yes! You can cancel your subscription at any time from the billing portal. 
              You&apos;ll keep your benefits until the end of your billing period.
            </p>
          </details>

          <details className="border border-[#333] rounded-lg p-4 group">
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
              What happens to my Wax if I downgrade?
              <span className="text-[#666] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-[#888]">
              Your Wax balance stays with you forever! You just won&apos;t earn as quickly and 
              won&apos;t be able to award Premium/GOLD Wax until you subscribe again.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}
