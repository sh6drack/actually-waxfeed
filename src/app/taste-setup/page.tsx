import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function TasteSetupPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/taste-setup")
  }

  // Check if user already has a TasteID
  const tasteId = await prisma.tasteID.findUnique({
    where: { userId: session.user.id },
  })

  if (tasteId) {
    // Already has TasteID, redirect to it
    redirect(`/u/${session.user.username}/tasteid`)
  }

  // Check review count
  const reviewCount = await prisma.review.count({
    where: { userId: session.user.id },
  })

  if (reviewCount >= 20) {
    // Has enough reviews, just compute and redirect
    redirect("/taste-setup/result")
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-white" />
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-neutral-700" />
          <div className="w-3 h-3 bg-neutral-700" />
        </div>

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider">
            DISCOVER MUSIC & FRIENDS
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-400">
            TAILORED TO YOU
          </h2>
        </div>

        {/* Description */}
        <p className="text-lg text-neutral-400 max-w-md mx-auto">
          Rate a few albums to unlock your unique TasteID - a fingerprint of your musical preferences.
          Then we&apos;ll connect you with people who share your taste.
        </p>

        {/* What you'll get */}
        <div className="border-2 border-[var(--accent-primary)] p-6 text-left space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-[var(--accent-primary)] font-bold">
            TWO THINGS HAPPEN WHEN YOU RATE
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <span className="font-bold">Each rating is a timestamped review</span>
                <p className="text-sm text-neutral-500">Your position is recorded. When albums trend, you earn badges.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <span className="font-bold">You unlock your TasteID</span>
                <p className="text-sm text-neutral-500">A unique fingerprint of your taste. Match with similar music lovers.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Link
            href="/taste-setup/rate"
            className="inline-block w-full md:w-auto px-8 py-4 bg-white text-black font-bold uppercase tracking-wider text-lg hover:bg-neutral-200 transition-colors"
          >
            LET&apos;S GO
          </Link>
          <div>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              Skip for now →
            </Link>
          </div>
        </div>

        {/* Time estimate */}
        <p className="text-xs text-neutral-600 uppercase tracking-wider">
          Takes less than 2 minutes
        </p>
      </div>
    </div>
  )
}
