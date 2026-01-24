"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

const WAX_PAX = [
  { id: "wax_100", name: "100 Wax", wax: 100, price: 99, priceDisplay: "$0.99" },
  { id: "wax_500", name: "500 Wax", wax: 500, price: 399, priceDisplay: "$3.99", popular: true },
  { id: "wax_1500", name: "1,500 Wax", wax: 1500, price: 999, priceDisplay: "$9.99" },
  { id: "wax_5000", name: "5,000 Wax", wax: 5000, price: 2499, priceDisplay: "$24.99", best: true },
]

export default function ShopPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const fetchBalance = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setBalance(data.data.balance || 0)
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error)
      }
    }
    fetchBalance()
  }, [session])

  const handlePurchase = async (paxId: string) => {
    if (!session) {
      router.push("/login?redirect=/shop")
      return
    }

    setLoading(paxId)
    setMessage("")

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wax_pax",
          productId: paxId,
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-3">
                Shop
              </p>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-[-0.02em] mb-4">
                Get Wax
              </h1>
              <p className="text-base text-[--muted] max-w-xl">
                Buy Wax to tip reviews you love. Your tips support great reviewers 
                and help surface quality content.
              </p>
            </div>
            {session && (
              <div className="text-right">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-1">
                  Your Balance
                </p>
                <p className="text-3xl font-bold tabular-nums">{balance.toLocaleString()}</p>
              </div>
            )}
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

      {/* Wax Pax Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
          Wax Pax
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WAX_PAX.map((pax) => (
            <div 
              key={pax.id} 
              className={`p-6 border relative ${
                pax.best 
                  ? 'border-[#ffd700]/50' 
                  : pax.popular 
                    ? 'border-white/50' 
                    : 'border-[--border]'
              }`}
            >
              {pax.best && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#ffd700] text-black text-[9px] tracking-wider uppercase font-bold">
                  Best Value
                </div>
              )}
              {pax.popular && !pax.best && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-white text-black text-[9px] tracking-wider uppercase font-bold">
                  Popular
                </div>
              )}
              
              <p className="text-3xl font-bold mb-2 tabular-nums">
                {pax.wax.toLocaleString()}
              </p>
              <p className="text-sm text-[--muted] mb-6">Wax</p>
              
              <button
                onClick={() => handlePurchase(pax.id)}
                disabled={loading === pax.id}
                className={`w-full py-3 text-[11px] tracking-[0.15em] uppercase font-medium transition disabled:opacity-50 ${
                  pax.best
                    ? 'bg-[#ffd700] text-black hover:bg-[#ffed4a]'
                    : 'bg-white text-black hover:bg-[#e5e5e5]'
                }`}
              >
                {loading === pax.id ? "Loading..." : pax.priceDisplay}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* What Wax Is For */}
      <section className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            What Wax Is For
          </p>
          <div className="grid lg:grid-cols-3 gap-8">
            <div>
              <p className="text-lg font-medium mb-2">Tip Reviews</p>
              <p className="text-sm text-[--muted]">
                Award Wax to reviews you love. Standard, Premium, or GOLD.
                The reviewer earns a portion.
              </p>
            </div>
            <div>
              <p className="text-lg font-medium mb-2">Support Tastemakers</p>
              <p className="text-sm text-[--muted]">
                Great reviewers accumulate Wax from the community. Your tips 
                help surface quality content.
              </p>
            </div>
            <div>
              <p className="text-lg font-medium mb-2">Social Currency</p>
              <p className="text-sm text-[--muted]">
                Wax represents community appreciation. More Wax received means 
                a respected voice in the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Earn Instead */}
      <section className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2">
                Prefer to Earn?
              </p>
              <p className="text-lg font-medium mb-2">
                Review albums early. Earn badges and Wax.
              </p>
              <p className="text-sm text-[--muted]">
                First Spin badges can earn you 25 to 100 Wax each when albums trend.
              </p>
            </div>
            <Link
              href="/discover"
              className="px-6 py-3 border border-[--border] text-[11px] tracking-[0.15em] uppercase hover:border-white transition flex-shrink-0"
            >
              Discover Albums
            </Link>
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
            href="/pricing"
            className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors flex items-center gap-2"
          >
            Membership
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </footer>
    </div>
  )
}
