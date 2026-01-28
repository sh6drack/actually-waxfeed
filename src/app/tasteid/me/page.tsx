"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// Shortcut route: /tasteid/me redirects to /u/[username]/tasteid
export default function TasteIDMeRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/tasteid/me")
      return
    }

    if (session?.user) {
      const username = session.user.username || session.user.id
      router.replace(`/u/${username}/tasteid`)
    }
  }, [session, status, router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[--muted] border-t-[var(--accent-primary)] rounded-full animate-spin" />
        <span className="text-xs tracking-[0.2em] uppercase text-[--muted]">Loading your TasteID...</span>
      </div>
    </div>
  )
}
