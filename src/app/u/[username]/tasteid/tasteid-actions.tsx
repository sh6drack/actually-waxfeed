"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Small recompute button inside the section
export function SmallRecomputeButton() {
  const [loading, setLoading] = useState(false)

  const handleRecompute = async () => {
    setLoading(true)
    
    try {
      const res = await fetch("/api/tasteid/compute", { 
        method: "POST",
        credentials: "include"
      })
      const data = await res.json()
      
      if (res.ok && data.data?.tasteId) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Recompute error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleRecompute}
      className="px-2 py-1 text-xs border border-white/30 text-white/70 hover:text-white hover:border-white hover:bg-white/10 transition-colors rounded flex items-center gap-1"
      title="Recompute TasteID"
    >
      {loading ? (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      <span>{loading ? "..." : "refresh"}</span>
    </button>
  )
}

export function GenerateTasteIDButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/tasteid/compute", { method: "POST" })
      const data = await res.json()
      
      if (res.ok && data.data?.tasteId) {
        setResult(`✓ ${data.data.tasteId.primaryArchetype} @ ${Math.round(data.data.tasteId.archetypeConfidence * 100)}%`)
        // Force hard refresh to bust cache
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setResult(`✗ ${data.error || 'Failed'}`)
      }
    } catch (error) {
      console.error("Failed to generate TasteID:", error)
      setResult("✗ Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 border-2 border-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleGenerate}
      >
        {loading ? "COMPUTING..." : "GENERATE MY TASTEID"}
      </button>
      {result && (
        <div className="text-sm text-center">{result}</div>
      )}
    </div>
  )
}

export function RecomputeButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleRecompute = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/tasteid/compute", { method: "POST" })
      const data = await res.json()
      
      console.log("[TasteID Recompute] Response:", data)
      
      if (res.ok && data.data?.tasteId) {
        const archetype = data.data.tasteId.primaryArchetype
        const confidence = Math.round(data.data.tasteId.archetypeConfidence * 100)
        const adventureness = Math.round(data.data.tasteId.adventurenessScore * 100)
        setResult(`✓ ${archetype} @ ${confidence}% (${adventureness}% adv)`)
        
        // Force hard page reload after 1.5s to bust Next.js cache
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setResult(`✗ ${data.error || 'Failed to compute'}`)
      }
    } catch (error) {
      console.error("Failed to recompute TasteID:", error)
      setResult("✗ Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={loading}
        className="w-full sm:w-auto px-4 py-3 sm:py-2 border-2 border-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleRecompute}
      >
        {loading ? "COMPUTING..." : "RECOMPUTE TASTEID"}
      </button>
      {result && (
        <div className={`text-sm ${result.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
          {result}
        </div>
      )}
    </div>
  )
}

const CONFIRM_TEXT = "DELETE"

export function ResetTasteIDButton() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'type' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [deletedCount, setDeletedCount] = useState(0)
  const [confirmInput, setConfirmInput] = useState("")
  const router = useRouter()

  const handleReset = async () => {
    if (step === 'idle') {
      setStep('confirm')
      return
    }

    if (step === 'confirm') {
      setStep('type')
      return
    }

    if (step !== 'type') return

    if (confirmInput !== CONFIRM_TEXT) {
      setError(`Please type "${CONFIRM_TEXT}" to confirm`)
      return
    }

    setStep('loading')
    setError(null)

    try {
      const res = await fetch("/api/tasteid/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_ALL_MY_REVIEWS" })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setDeletedCount(data.deleted?.reviews || 0)
        setStep('done')
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 2000)
      } else {
        setError(data.error || 'Failed to reset')
        setStep('type')
      }
    } catch (err) {
      console.error("Reset error:", err)
      setError("Network error")
      setStep('type')
    }
  }

  const handleCancel = () => {
    setStep('idle')
    setConfirmInput("")
    setError(null)
  }

  if (step === 'done') {
    return (
      <div className="text-center p-4 border border-green-500/50 bg-green-500/10">
        <div className="text-green-400 font-bold mb-1">RESET COMPLETE</div>
        <div className="text-sm text-muted-foreground">
          Deleted {deletedCount} reviews. Redirecting...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {step === 'confirm' && (
        <div className="p-3 border border-red-500/50 bg-red-500/10 text-sm">
          <div className="font-bold text-red-400 mb-1">ARE YOU SURE?</div>
          <div className="text-muted-foreground">
            This will permanently delete ALL your reviews and your TasteID.
            This action cannot be undone.
          </div>
        </div>
      )}

      {step === 'type' && (
        <div className="p-3 border border-red-500/50 bg-red-500/10 text-sm space-y-3">
          <div className="font-bold text-red-400">FINAL CONFIRMATION</div>
          <div className="text-muted-foreground">
            Type <span className="font-mono text-red-400">{CONFIRM_TEXT}</span> to permanently delete all your reviews.
          </div>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={`Type ${CONFIRM_TEXT} here`}
            className="w-full px-3 py-2 bg-transparent border border-red-500/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500"
            autoFocus
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={step === 'loading' || (step === 'type' && confirmInput !== CONFIRM_TEXT)}
          onClick={handleReset}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            step === 'confirm' || step === 'type'
              ? 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
              : 'border border-red-500/30 text-red-500/70 hover:border-red-500 hover:text-red-500'
          }`}
        >
          {step === 'loading' ? 'DELETING...' : step === 'type' ? 'DELETE EVERYTHING' : step === 'confirm' ? 'YES, CONTINUE' : 'RESET TASTEID'}
        </button>

        {(step === 'confirm' || step === 'type') && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            CANCEL
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-400">{error}</div>
      )}
    </div>
  )
}
