"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RatingSlider } from "@/components/rating-slider"

interface Props {
  albumId: string
  existingReview?: {
    id: string
    rating: number
    text: string | null
  } | null
}

export function AlbumReviewForm({ albumId, existingReview }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 5)
  const [text, setText] = useState(existingReview?.text ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

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
      <RatingSlider value={rating} onChange={setRating} disabled={loading} />

      <div>
        <label className="block text-sm text-[#888] mb-2">
          Review (optional)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you think of this album?"
          rows={3}
          maxLength={5000}
          disabled={loading}
          className="w-full resize-none"
        />
        <p className="text-xs text-[#666] mt-1">{text.length}/5000</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
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
