"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RatingSlider } from "@/components/rating-slider"
import { Tooltip } from "@/components/ui/tooltip"

interface Props {
  albumId: string
  currentReviewCount: number
  existingReview?: {
    id: string
    rating: number
    text: string | null
  } | null
}

const MIN_REVIEW_LENGTH = 20
const FIRST_SPIN_THRESHOLD = 100

export function AlbumReviewForm({ albumId, currentReviewCount, existingReview }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 5)
  const [text, setText] = useState(existingReview?.text ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Calculate user's potential position
  const potentialPosition = currentReviewCount + 1
  const isFirstSpinEligible = potentialPosition <= FIRST_SPIN_THRESHOLD
  const textRequired = isFirstSpinEligible && !existingReview
  const textLength = text.trim().length
  const textValid = textLength >= MIN_REVIEW_LENGTH

  // Determine badge tier
  const getBadgeTier = () => {
    if (potentialPosition <= 10) return { tier: "Gold", color: "text-[#ffd700]", reward: 100 }
    if (potentialPosition <= 50) return { tier: "Silver", color: "text-gray-300", reward: 50 }
    if (potentialPosition <= 100) return { tier: "Bronze", color: "text-amber-600", reward: 25 }
    return null
  }
  const badge = getBadgeTier()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")

    // Client-side validation for First Spin eligibility
    if (textRequired && !textValid) {
      setError(`Write at least ${MIN_REVIEW_LENGTH} characters to claim your spot as reviewer #${potentialPosition}`)
      setLoading(false)
      return
    }

    try {
      const url = existingReview
        ? `/api/reviews/${existingReview.id}`
        : "/api/reviews"

      const method = existingReview ? "PATCH" : "POST"

      const body = existingReview
        ? { rating, text }
        : { albumId, rating, text }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit review")
        setLoading(false)
        return
      }

      // Show success message with First Spin info
      if (data.data?.firstSpinMessage) {
        setSuccessMessage(data.data.firstSpinMessage)
      }

      router.refresh()
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingReview || !confirm("Are you sure you want to delete your review?")) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${existingReview.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
      }
    } catch {
      setError("Failed to delete review")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* First Spin Info Banner - only for new reviews in first 100 */}
      {!existingReview && badge && (
        <div className={`p-4 border ${badge.tier === 'Gold' ? 'border-[#ffd700]/50 bg-[#ffd700]/10' : badge.tier === 'Silver' ? 'border-gray-400/50 bg-gray-400/10' : 'border-amber-600/50 bg-amber-600/10'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {badge.tier === 'Gold' ? '🥇' : badge.tier === 'Silver' ? '🥈' : '🥉'}
            </span>
            <div className="flex-1">
              <p className={`font-bold ${badge.color}`}>
                You'll be reviewer #{potentialPosition}
              </p>
              <p className="text-sm text-[--muted] mt-1">
                {badge.tier} Spin eligible! If this album trends, you'll earn a {badge.tier} badge + {badge.reward} Wax.
              </p>
              <p className="text-xs text-[--muted] mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Written review required for First Spin positions
              </p>
            </div>
          </div>
        </div>
      )}

      <RatingSlider value={rating} onChange={setRating} disabled={loading} />

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm text-[--muted]">
            Review {textRequired ? <span className="text-[var(--accent-primary)]">*</span> : "(optional)"}
          </label>
          <Tooltip content="Share your thoughts about the album. For the first 100 reviews, this is required to ensure quality. After that, it's optional.">
            <svg className="w-4 h-4 text-[--muted] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={textRequired 
            ? `Share your thoughts (at least ${MIN_REVIEW_LENGTH} characters to claim your #${potentialPosition} spot)`
            : "What did you think of this album?"
          }
          rows={3}
          maxLength={5000}
          disabled={loading}
          className="w-full resize-none"
        />
        <div className="flex justify-between mt-1">
          <p className={`text-xs ${textRequired && !textValid ? 'text-amber-500' : 'text-[--muted]'}`}>
            {textRequired && !textValid
              ? `${MIN_REVIEW_LENGTH - textLength} more characters needed`
              : `${text.length}/5000`
            }
          </p>
          {!existingReview && (
            <p className="text-xs text-[--muted]">+5 Wax for reviewing</p>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || (textRequired && !textValid)}
          className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : existingReview
            ? "Update Review"
            : "Submit Review"}
        </button>

        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 text-sm hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
