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
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4 tracking-tight">Application received</h2>
        <p className="text-[--muted] leading-relaxed">
          We'll review your application and get back to you within 48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
        <label className="block text-sm mb-2 font-medium">
          Station Name / Call Letters <span className="text-[var(--accent-primary)]">*</span>
        </label>
        <input
          type="text"
          value={stationName}
          onChange={(e) => setStationName(e.target.value)}
          placeholder="e.g., WRVU"
          required
          disabled={loading}
          className="w-full px-4 py-3.5 text-base bg-[--background] border border-[--border] text-[--foreground] placeholder:text-[--muted]/50 focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--accent-primary)]/5 transition-all disabled:opacity-50"
        />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
        <label className="block text-sm mb-2 font-medium">University / College</label>
        <input
          type="text"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          placeholder="e.g., Vanderbilt University"
          disabled={loading}
          className="w-full px-4 py-3.5 text-base bg-[--background] border border-[--border] text-[--foreground] placeholder:text-[--muted]/50 focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--accent-primary)]/5 transition-all disabled:opacity-50"
        />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <label className="block text-sm mb-2 font-medium">
          Your Email (Station Manager/MD) <span className="text-[var(--accent-primary)]">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="md@station.edu"
          required
          disabled={loading}
          className="w-full px-4 py-3.5 text-base bg-[--background] border border-[--border] text-[--foreground] placeholder:text-[--muted]/50 focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--accent-primary)]/5 transition-all disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/10 animate-fade-in">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[var(--accent-primary)] text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 animate-fade-in"
        style={{ animationDelay: '150ms' }}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <span>Apply for Founding Status</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
