"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

type ShopItem = {
  id: string
  type: string
  name: string
  description: string | null
  waxPrice: number
  imageUrl: string | null
  isLimited: boolean
  stock: number | null
  soldCount: number
  expiresAt: string | null
  minTier: string
  owned: boolean
  available: boolean
  remaining: number | null
  metadata: Record<string, unknown> | null
}

const WAX_PAX = [
  { id: "starter", name: "Starter Pax", wax: 100, price: "$0.99", bonus: "" },
  { id: "popular", name: "Popular Pax", wax: 550, price: "$4.99", bonus: "+10%", popular: true },
  { id: "value", name: "Value Pax", wax: 1200, price: "$9.99", bonus: "+20%" },
  { id: "super", name: "Super Pax", wax: 2700, price: "$19.99", bonus: "+35%" },
  { id: "mega", name: "Mega Pax", wax: 6000, price: "$39.99", bonus: "+50%", best: true },
]

export default function ShopPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<ShopItem[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"wax" | "badges" | "frames">("wax")

  const canceled = searchParams.get("canceled")

  useEffect(() => {
    if (canceled) {
      setMessage("Purchase canceled. You can try again anytime.")
    }
  }, [canceled])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, balanceRes] = await Promise.all([
          fetch("/api/shop/items?limit=50"),
          session ? fetch("/api/wax/balance") : Promise.resolve(null),
        ])

        const itemsData = await itemsRes.json()
        if (itemsData.success) {
          setItems(itemsData.data.items)
        }

        if (balanceRes) {
          const balanceData = await balanceRes.json()
          if (balanceData.success) {
            setBalance(balanceData.data.balance)
          }
        }
      } catch (error) {
        console.error("Failed to fetch shop data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [session])

  const handleBuyWaxPax = async (paxId: string) => {
    if (!session) {
      router.push("/login?redirect=/shop")
      return
    }

    setPurchasing(paxId)
    setMessage("")

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wax_pax",
          productId: packId,
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
      setPurchasing(null)
    }
  }

  const handleBuyItem = async (itemId: string) => {
    if (!session) {
      router.push("/login?redirect=/shop")
      return
    }

    setPurchasing(itemId)
    setMessage("")

    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage(data.data.message || "Purchase successful!")
        setBalance(data.data.newBalance)
        // Update item as owned
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, owned: true } : item
        ))
      } else {
        setMessage(data.error || "Failed to purchase")
      }
    } catch (error) {
      setMessage("Something went wrong")
    } finally {
      setPurchasing(null)
    }
  }

  const badges = items.filter(i => i.type === "BADGE")
  const frames = items.filter(i => i.type === "FRAME")

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Wax Shop</h1>
          <p className="text-[#888] mt-1">Get Wax Pax and exclusive items</p>
        </div>
        {session && (
          <div className="text-right">
            <div className="text-sm text-[#888]">Your Balance</div>
            <div className="text-2xl font-bold text-yellow-500">
              🕯️ {balance.toLocaleString()} Wax
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes("successful") || message.includes("success")
            ? "bg-green-900/20 border border-green-600/30"
            : "bg-yellow-900/20 border border-yellow-600/30"
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-[#333]">
        <button
          onClick={() => setActiveTab("wax")}
          className={`pb-3 px-1 font-medium transition ${
            activeTab === "wax"
              ? "text-yellow-500 border-b-2 border-yellow-500"
              : "text-[#888] hover:text-white"
          }`}
        >
          🕯️ Wax Pax
        </button>
        <button
          onClick={() => setActiveTab("badges")}
          className={`pb-3 px-1 font-medium transition ${
            activeTab === "badges"
              ? "text-yellow-500 border-b-2 border-yellow-500"
              : "text-[#888] hover:text-white"
          }`}
        >
          🏅 Badges {badges.length > 0 && `(${badges.length})`}
        </button>
        <button
          onClick={() => setActiveTab("frames")}
          className={`pb-3 px-1 font-medium transition ${
            activeTab === "frames"
              ? "text-yellow-500 border-b-2 border-yellow-500"
              : "text-[#888] hover:text-white"
          }`}
        >
          🖼️ Frames {frames.length > 0 && `(${frames.length})`}
        </button>
      </div>

      {/* Wax Pax Tab */}
      {activeTab === "wax" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {WAX_PAX.map((pax) => (
            <div
              key={pax.id}
              className={`border rounded-xl p-4 bg-[#111] relative ${
                pax.popular ? "border-yellow-500" : pax.best ? "border-purple-500" : "border-[#333]"
              }`}
            >
              {pax.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold">
                  POPULAR
                </div>
              )}
              {pax.best && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  BEST VALUE
                </div>
              )}

              <div className="text-center mb-4 pt-2">
                <div className="text-3xl mb-2">🕯️</div>
                <div className="font-bold">{pax.name}</div>
                <div className="text-2xl font-bold text-yellow-500">
                  {pax.wax.toLocaleString()}
                </div>
                {pax.bonus && (
                  <div className="text-sm text-green-500">{pax.bonus} bonus</div>
                )}
              </div>

              <button
                onClick={() => handleBuyWaxPax(pax.id)}
                disabled={purchasing === pax.id}
                className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                  pax.popular
                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                    : pax.best
                    ? "bg-purple-600 text-white hover:bg-purple-500"
                    : "bg-[#333] text-white hover:bg-[#444]"
                } disabled:opacity-50`}
              >
                {purchasing === pax.id ? "..." : pax.price}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <div>
          {loading ? (
            <p className="text-[#888]">Loading badges...</p>
          ) : badges.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏅</div>
              <p className="text-[#888]">No badges available yet.</p>
              <p className="text-sm text-[#666]">Check back soon for exclusive badges!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 bg-[#111] ${
                    item.isLimited ? "border-red-500/50" : "border-[#333]"
                  }`}
                >
                  {item.isLimited && item.remaining !== null && (
                    <div className="text-xs text-red-400 mb-2">
                      ⏰ Limited: {item.remaining} left
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 mx-auto" />
                      ) : (
                        "🏅"
                      )}
                    </div>
                    <div className="font-bold">{item.name}</div>
                    {item.description && (
                      <p className="text-sm text-[#888] mt-1">{item.description}</p>
                    )}
                  </div>

                  <div className="text-center mb-4">
                    <span className="text-yellow-500 font-bold">
                      🕯️ {item.waxPrice.toLocaleString()}
                    </span>
                  </div>

                  {item.owned ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg bg-green-900/30 text-green-500 border border-green-600/30"
                    >
                      ✓ Owned
                    </button>
                  ) : !item.available ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg bg-[#222] text-[#666]"
                    >
                      Sold Out
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyItem(item.id)}
                      disabled={purchasing === item.id || balance < item.waxPrice}
                      className="w-full py-2 px-4 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {purchasing === item.id
                        ? "..."
                        : balance < item.waxPrice
                        ? "Not enough Wax"
                        : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frames Tab */}
      {activeTab === "frames" && (
        <div>
          {loading ? (
            <p className="text-[#888]">Loading frames...</p>
          ) : frames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🖼️</div>
              <p className="text-[#888]">No frames available yet.</p>
              <p className="text-sm text-[#666]">Check back soon for profile frames!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {frames.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 bg-[#111] ${
                    item.isLimited ? "border-red-500/50" : "border-[#333]"
                  }`}
                >
                  {item.isLimited && item.remaining !== null && (
                    <div className="text-xs text-red-400 mb-2">
                      ⏰ Limited: {item.remaining} left
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 mx-auto" />
                      ) : (
                        "🖼️"
                      )}
                    </div>
                    <div className="font-bold">{item.name}</div>
                    {item.description && (
                      <p className="text-sm text-[#888] mt-1">{item.description}</p>
                    )}
                  </div>

                  <div className="text-center mb-4">
                    <span className="text-yellow-500 font-bold">
                      🕯️ {item.waxPrice.toLocaleString()}
                    </span>
                  </div>

                  {item.owned ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg bg-green-900/30 text-green-500 border border-green-600/30"
                    >
                      ✓ Owned
                    </button>
                  ) : !item.available ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg bg-[#222] text-[#666]"
                    >
                      Sold Out
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyItem(item.id)}
                      disabled={purchasing === item.id || balance < item.waxPrice}
                      className="w-full py-2 px-4 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {purchasing === item.id
                        ? "..."
                        : balance < item.waxPrice
                        ? "Not enough Wax"
                        : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade CTA */}
      <div className="mt-12 p-6 bg-gradient-to-r from-yellow-900/20 to-purple-900/20 border border-yellow-600/30 rounded-xl text-center">
        <h3 className="text-xl font-bold mb-2">Want More Wax?</h3>
        <p className="text-[#888] mb-4">
          Upgrade to Wax+ or Pro to earn Wax faster with multipliers and monthly grants!
        </p>
        <button
          onClick={() => router.push("/pricing")}
          className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition"
        >
          View Plans
        </button>
      </div>
    </div>
  )
}
