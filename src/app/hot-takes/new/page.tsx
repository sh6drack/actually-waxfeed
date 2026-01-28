"use client"

import { useRouter } from "next/navigation"
import { HotTakeForm } from "@/components/hot-take-form"
import Link from "next/link"

export default function NewHotTakePage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    albumId: string
    stance: string
    content: string
  }) => {
    const res = await fetch("/api/hot-takes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to post hot take")
    }

    const result = await res.json()
    router.push(`/hot-takes/${result.data.id}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 lg:px-12 xl:px-20 py-6 lg:py-12">
      {/* Header */}
      <header className="mb-12">
        <Link
          href="/hot-takes"
          className="inline-block text-[10px] tracking-[0.2em] uppercase text-[--muted] hover:text-[--foreground] mb-4"
        >
          ← Back to Hot Takes
        </Link>
        <h1 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">
          Post a Hot Take
        </h1>
        <p className="text-sm text-[--muted]">
          Share your controversial opinion. Pick an album, take a stance, make your case.
        </p>
      </header>

      {/* Form */}
      <HotTakeForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  )
}
