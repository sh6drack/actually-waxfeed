"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function FirstTimeWelcome() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const hasSeenWelcome = localStorage.getItem('waxfeed-seen-welcome')
    if (!hasSeenWelcome) {
      setIsVisible(true)
      setIsAnimating(true)
    }
  }, [])

  const handleCreateTasteID = () => {
    localStorage.setItem('waxfeed-seen-welcome', 'true')
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      router.push('/signup')
    }, 200)
  }

  const handleSkip = () => {
    localStorage.setItem('waxfeed-seen-welcome', 'true')
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 200)
  }

  if (!isMounted || !isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${
        isAnimating ? 'bg-black/95' : 'bg-black/0'
      }`}
      style={{ pointerEvents: isAnimating ? 'auto' : 'none' }}
    >
      <div
        className={`max-w-lg w-full max-h-[95vh] overflow-y-auto transition-all duration-400 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-[--surface] border border-[--border] relative">
          {/* Close */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 text-[--muted] hover:text-[--foreground] transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-5 sm:p-10 md:p-12">
            {/* Category label */}
            <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[var(--accent-primary)] font-bold mb-4 sm:mb-6">
              First of Its Kind
            </p>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 sm:mb-5 text-white pr-6">
              The world&apos;s first platform<br />
              <span className="text-[var(--accent-primary)]">that proves your taste.</span>
            </h2>

            {/* Subhead */}
            <p className="text-[#ccc] text-sm sm:text-base leading-relaxed mb-5 sm:mb-8 max-w-md">
              Every album you rate is timestamped. When it blows up months later,
              you have the proof. No more &quot;I told you so&quot; — just verified discovery.
            </p>

            {/* The differentiator - hidden on very small screens */}
            <div className="hidden sm:block border-l-4 border-[var(--accent-primary)] pl-5 mb-8 bg-[--surface-raised] py-4 pr-4">
              <p className="text-sm text-[#ddd] leading-relaxed">
                &quot;Letterboxd proved people care about logging films.
                WaxFeed proves people care about <span className="text-white font-bold">being first</span>.&quot;
              </p>
            </div>

            {/* What you get - clean list */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-10">
              <div>
                <div className="text-white font-bold text-sm sm:text-base mb-0.5 sm:mb-1">Timestamped Reviews</div>
                <div className="text-[--muted] text-xs sm:text-sm">Proof of discovery</div>
              </div>
              <div>
                <div className="text-white font-bold text-sm sm:text-base mb-0.5 sm:mb-1">First Spin Badges</div>
                <div className="text-[--muted] text-xs sm:text-sm">Early recognition</div>
              </div>
              <div>
                <div className="text-white font-bold text-sm sm:text-base mb-0.5 sm:mb-1">TasteID Profile</div>
                <div className="text-[--muted] text-xs sm:text-sm">Musical fingerprint</div>
              </div>
              <div>
                <div className="text-white font-bold text-sm sm:text-base mb-0.5 sm:mb-1">Taste Matching</div>
                <div className="text-[--muted] text-xs sm:text-sm">Find your people</div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleCreateTasteID}
              className="w-full py-3 sm:py-4 bg-[var(--accent-primary)] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#ffe44d] transition-colors"
            >
              Join Free — Takes 30 Seconds
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full mt-3 sm:mt-4 text-[--muted] text-sm hover:text-[--foreground] transition-colors"
            >
              Continue as guest
            </button>
          </div>

          {/* Bottom bar - simplified on mobile */}
          <div className="border-t border-[--border] px-5 sm:px-10 py-3 sm:py-4 flex items-center justify-between text-[10px] sm:text-xs text-[--muted]">
            <span>Free forever</span>
            <span className="hidden sm:inline">No credit card</span>
            <span>2,500+ members</span>
          </div>
        </div>
      </div>
    </div>
  )
}
