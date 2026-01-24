"use client"

import { useState } from "react"

export function StationApplicationForm() {
  const [email, setEmail] = useState("")
  const [stationName, setStationName] = useState("")
  const [university, setUniversity] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stations/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, stationName, university }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit application")
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Application received</h2>
        <p className="text-[--muted]">
          We'll review your application and get back to you within 48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm mb-2">Station Name / Call Letters *</label>
        <input
          type="text"
          value={stationName}
          onChange={(e) => setStationName(e.target.value)}
          placeholder="e.g., WRVU"
          required
          disabled={loading}
          className="w-full px-4 py-3 text-base focus:outline-none transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)'
          }}
        />
      </div>
      <div>
        <label className="block text-sm mb-2">University / College</label>
        <input
          type="text"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          placeholder="e.g., Vanderbilt University"
          disabled={loading}
          className="w-full px-4 py-3 text-base focus:outline-none transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)'
          }}
        />
      </div>
      <div>
        <label className="block text-sm mb-2">Your Email (Station Manager/MD) *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="md@station.edu"
          required
          disabled={loading}
          className="w-full px-4 py-3 text-base focus:outline-none transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)'
          }}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Apply for Founding Status"}
      </button>
    </form>
  )
}
