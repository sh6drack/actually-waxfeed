"use client"

import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ListeningSession } from "@/components/listening/ListeningSession"

export default function ListeningSessionPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const inviteCode = params.inviteCode as string

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[--muted]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎧</div>
          <h1 className="text-3xl font-bold mb-4">Join Listening Session</h1>
          <p className="text-[--muted] mb-6">
            Sign in to join this shared listening session.
          </p>
          <Link
            href={`/login?callbackUrl=/listen/${inviteCode}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Sign In to Join
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <ListeningSession inviteCode={inviteCode} currentUserId={session.user.id} />
    </div>
  )
}
