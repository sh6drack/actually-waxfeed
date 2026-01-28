"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

// Pages that don't require onboarding to be complete
const ALLOWED_PATHS = [
  '/onboarding',
  '/login',
  '/signup',
  '/api',
  '/privacy',
  '/terms',
]

export function OnboardingGuard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't check during loading
    if (status === "loading") return

    // Only check for authenticated users
    if (status !== "authenticated" || !session?.user) return

    // Skip if on allowed paths
    if (ALLOWED_PATHS.some(path => pathname.startsWith(path))) return

    // If user has no username, redirect to onboarding
    if (!session.user.username) {
      router.push('/onboarding')
    }
  }, [session, status, pathname, router])

  return null
}
