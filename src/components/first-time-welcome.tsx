"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function FirstTimeWelcome() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Only show for authenticated users who haven't seen it
    if (status === 'authenticated' && session?.user) {
      const hasSeenWelcome = localStorage.getItem('waxfeed-seen-welcome')
      const hasUsername = session.user.username

      // Show if user hasn't seen welcome OR doesn't have username (incomplete onboarding)
      if (!hasSeenWelcome || !hasUsername) {
        setIsVisible(true)
        setIsAnimating(true)
      }
    }
  }, [session, status])

  const handleCreateTasteID = () => {
    localStorage.setItem('waxfeed-seen-welcome', 'true')
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      router.push('/onboarding')
    }, 200)
  }

  const handleSkip = () => {
    localStorage.setItem('waxfeed-seen-welcome', 'true')
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
    }, 200)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isAnimating ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0'
      }`}
      style={{ pointerEvents: isAnimating ? 'auto' : 'none' }}
    >
      <div
        className={`max-w-2xl mx-4 transition-all duration-300 ${
          isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-[#0a0a0a] border-2 border-[#ffd700] p-8 md:p-12 relative">
          {/* Close button - top right */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 border-2 border-[#ffd700] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#ffd700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Welcome to WAXFEED
            </h2>

            {/* Subheadline */}
            <p className="text-[#ffd700] text-lg md:text-xl font-bold mb-6">
              Let's build your music identity
            </p>

            {/* Description */}
            <p className="text-[#888] text-base md:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              Rate albums, earn badges when they blow up, and find your music people.
              Your taste, timestamped and verified.
            </p>

            {/* Primary CTA - Game-like */}
            <div className="space-y-4">
              <button
                onClick={handleCreateTasteID}
                className="w-full bg-[#ffd700] text-black py-5 px-6 font-bold text-lg hover:bg-[#ffed4a] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="block text-xs uppercase tracking-[0.2em] mb-1 opacity-80">
                  Let's Play
                </span>
                <span className="block text-xl md:text-2xl">
                  🎮 Guess My Taste in 5 Minutes
                </span>
              </button>

              {/* Secondary CTA - Skip */}
              <button
                onClick={handleSkip}
                className="text-sm text-[#666] hover:text-[#888] transition-colors"
              >
                Skip for now, I'll explore first →
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 pt-6 border-t border-[#333]">
              <div className="flex flex-wrap justify-center gap-6 text-xs text-[#666]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ffd700] rounded-full" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ffd700] rounded-full" />
                  <span>Takes 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ffd700] rounded-full" />
                  <span>Fully optional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
