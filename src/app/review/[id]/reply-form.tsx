"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ReplyFormProps {
  reviewId: string
}

export function ReplyForm({ reviewId }: ReplyFormProps) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/reviews/${reviewId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (res.ok) {
        setText("")
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to post reply")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-[--border]">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        maxLength={2000}
        rows={3}
        className="w-full bg-[--surface] border border-[--border] px-3 py-2 text-sm text-[--foreground] placeholder-[--muted] focus:outline-none focus:border-[--foreground] transition-colors resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-[--muted]">{text.length}/2000</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="bg-white text-black px-4 py-1.5 text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Reply"}
          </button>
        </div>
      </div>
    </form>
  )
}
