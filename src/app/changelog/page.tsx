import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Changelog | WAXFEED",
  description: "WAXFEED platform updates and new features",
}

const CHANGELOG_ENTRIES = [
  {
    version: "2.8",
    codename: "Surface",
    date: "2026-02-07",
    highlight: true,
    summary: "New landing page, redesigned TasteID dashboard, and codebase cleanup. First impressions matter.",
    changes: [
      {
        type: "feature" as const,
        title: "Landing Page",
        description: "Cinematic hero section with album marquee, feature showcase, and review highlights. The front door finally matches the house.",
      },
      {
        type: "feature" as const,
        title: "TasteID Dashboard",
        description: "Full dashboard with hero card, genre breakdown, vibe signature, and listening stats. Your taste profile, visualized.",
      },
      {
        type: "feature" as const,
        title: "Tier Journey",
        description: "Visual progression from Listener to Oracle. See exactly where you are and what's next.",
      },
      {
        type: "enhancement" as const,
        title: "Archetype Badges",
        description: "Redesigned archetype badges across circles, messaging, and TasteID pages.",
      },
      {
        type: "enhancement" as const,
        title: "Onboarding Flow",
        description: "Updated onboarding page with improved layout and component structure.",
      },
      {
        type: "fix" as const,
        title: "Codebase Cleanup",
        description: "Removed old waxfeed-ui-design prototype directory. Leaner repo, faster clones.",
      },
    ],
  },
  {
    version: "2.7",
    codename: "Vault",
    date: "2026-02-07",
    highlight: true,
    summary: "Complete Stripe payment system overhaul. Bulletproof webhook handling, proper idempotency, and fulfillment safety nets across every payment flow.",
    changes: [
      {
        type: "fix" as const,
        title: "Webhook Reliability",
        description: "All Stripe API calls now use lazy initialization (getStripe) instead of a static import that could be null. Webhook signature verification and event processing are now rock-solid.",
      },
      {
        type: "fix" as const,
        title: "Idempotency Protection",
        description: "Every Wax grant (purchases and subscription grants) now stores stripeEventId in metadata. Duplicate webhook events are caught even after server restarts.",
      },
      {
        type: "fix" as const,
        title: "Subscription Activation",
        description: "Cleaned up handleSubscriptionCreated to eliminate redundant Stripe API calls and properly mark Purchase records as completed.",
      },
      {
        type: "feature" as const,
        title: "Fulfillment Safety Net",
        description: "PaymentForm now calls /api/stripe/fulfill after successful payment as a fallback if webhooks are delayed. Shop and wallet pages also trigger fulfillment checks.",
      },
      {
        type: "enhancement" as const,
        title: "Checkout Modal State",
        description: "Proper state reset on close, retry button correctly clears locks, and useCallback prevents stale closure bugs.",
      },
      {
        type: "fix" as const,
        title: "Portal & Checkout Routes",
        description: "Fixed all remaining Stripe API routes that used the potentially-null static stripe import.",
      },
    ],
  },
  {
    version: "2.6",
    codename: "Signal",
    date: "2026-02-05",
    highlight: false,
    summary: "Skip behavior now shapes your TasteID. Track ratings aggregate into album scores. Smarter taste intelligence.",
    changes: [
      {
        type: "feature" as const,
        title: "Skip Tracking",
        description: "Skips are now recorded and feed into TasteID. High-skip genres get reduced affinity in your taste profile.",
      },
      {
        type: "feature" as const,
        title: "Skip Reason Prompts",
        description: "Every 5th skip, a subtle toast asks why: \"Not my vibe\", \"Know it already\", or \"Not in the mood\".",
      },
      {
        type: "feature" as const,
        title: "Track → Album Aggregation",
        description: "Rate 50%+ of an album's tracks and we'll auto-generate an album rating from your track scores.",
      },
      {
        type: "enhancement" as const,
        title: "Track Ratings Visible by Default",
        description: "Track rating widgets now show immediately when logged in. No more hidden controls.",
      },
      {
        type: "enhancement" as const,
        title: "Progress Always Visible",
        description: "Track rating progress bar shows even with 0 ratings. Unrated tracks get a subtle dot indicator.",
      },
      {
        type: "enhancement" as const,
        title: "Skip Signal Intelligence",
        description: "TasteID now penalizes genres with high skip rates—up to 40% reduction in affinity scores.",
      },
      {
        type: "feature" as const,
        title: "The Taste Algorithm v2",
        description: "Completely rebuilt quick-rate selection. Now uses TasteID genre vectors, Audio DNA matching, skip penalties, quality signals, and smart interleaving.",
      },
      {
        type: "enhancement" as const,
        title: "Recency-Weighted Preferences",
        description: "What you liked this month matters more than 6 months ago. Recent favorites surface first.",
      },
      {
        type: "enhancement" as const,
        title: "True Random Discovery",
        description: "Random DB offsets ensure you see different albums each session, not the same shuffled results.",
      },
      {
        type: "enhancement" as const,
        title: "Interleaved Variety",
        description: "No more 5 hip-hop albums in a row. Categories are mixed: artist → genre → quality → discovery.",
      },
    ],
  },
  {
    version: "2.5.1",
    codename: "Decipher Polish",
    date: "2026-02-04",
    highlight: false,
    summary: "Premium polish pass on the Audio DNA prediction system. Smoother, smarter, more satisfying.",
    changes: [
      {
        type: "enhancement" as const,
        title: "Premium Rating Slider",
        description: "Rebuilt from scratch with tier labels (Skip → Classic), color-coded gradient, and prediction marker showing where we thought you'd land.",
      },
      {
        type: "feature" as const,
        title: "Audio DNA Onboarding",
        description: "New users see a DNA-themed \"Awaiting First Read\" state with breathing plasma tube animation.",
      },
      {
        type: "enhancement" as const,
        title: "Keyboard Shortcut Hints",
        description: "Action buttons now show keyboard shortcuts (Enter, S, B) for power users.",
      },
      {
        type: "enhancement" as const,
        title: "Celebration Timing",
        description: "Perfect celebrations now display for full 3.5s before transition. Exit animations added for smoother flow.",
      },
      {
        type: "enhancement" as const,
        title: "Suggested Vibes",
        description: "Vibes that match the album's audio features get highlighted with a subtle glow effect.",
      },
      {
        type: "enhancement" as const,
        title: "Accessibility",
        description: "Added ARIA labels, live regions, and proper dialog roles throughout prediction UI.",
      },
      {
        type: "enhancement" as const,
        title: "Tier Progress Bar",
        description: "Premium styling with tier markers, milestone glow effects, and smooth fill animations.",
      },
      {
        type: "fix" as const,
        title: "Miss Celebrations",
        description: "Added proper feedback for near-miss predictions with streak loss messaging.",
      },
    ],
  },
  {
    version: "2.5",
    codename: "Decipher",
    date: "2026-02-04",
    highlight: false,
    summary: "AI-powered taste prediction. WAXFEED now learns your taste and predicts what you'll rate.",
    changes: [
      {
        type: "feature" as const,
        title: "Audio DNA",
        description: "Your taste fingerprint powered by Spotify audio features—energy, mood, danceability, and more.",
      },
      {
        type: "feature" as const,
        title: "Rating Predictions",
        description: "Before you rate, we predict your score. See how well we know your taste.",
      },
      {
        type: "feature" as const,
        title: "Decipher Progress",
        description: "\"Your taste is X% deciphered.\" Watch as the system learns what makes you tick.",
      },
      {
        type: "feature" as const,
        title: "Prediction Streaks",
        description: "Build streaks when predictions match your ratings. How predictable are you?",
      },
      {
        type: "feature" as const,
        title: "Surprise Detection",
        description: "Albums that defy prediction get marked as surprises—helping us learn your edge cases.",
      },
      {
        type: "enhancement" as const,
        title: "Cinematic Celebrations",
        description: "Perfect predictions, close calls, and surprises each get their own premium animation.",
      },
    ],
  },
  {
    version: "2.4",
    codename: "Polish",
    date: "2026-02-04",
    highlight: false,
    summary: "Refined experience with better feedback and navigation.",
    changes: [
      {
        type: "fix" as const,
        title: "Wax Award Feedback",
        description: "Clear error messages when awarding Wax fails, with quick link to get more.",
      },
      {
        type: "enhancement" as const,
        title: "Footer Navigation",
        description: "FAQ and Changelog now accessible from homepage footer.",
      },
      {
        type: "enhancement" as const,
        title: "Code Quality",
        description: "Fixed 70+ lint errors across the platform for improved stability.",
      },
      {
        type: "fix" as const,
        title: "Button Visibility",
        description: "Ghost buttons now have explicit text colors for better visibility across themes.",
      },
    ],
  },
  {
    version: "2.3",
    codename: "Gateway",
    date: "2026-02-03",
    highlight: false,
    summary: "More ways to sign in, better account security.",
    changes: [
      {
        type: "feature" as const,
        title: "GitHub Login",
        description: "Sign in with your GitHub account for faster access.",
      },
      {
        type: "feature" as const,
        title: "Account Linking",
        description: "Multiple sign-in methods automatically link to one account.",
      },
      {
        type: "enhancement" as const,
        title: "Login Security",
        description: "Rate limiting protects against brute force attempts.",
      },
    ],
  },
  {
    version: "2.2",
    codename: "Clarity",
    date: "2026-02-03",
    highlight: false,
    summary: "Accessibility improvements and visual polish.",
    changes: [
      {
        type: "enhancement" as const,
        title: "WCAG AA Compliance",
        description: "Improved color contrast across the platform to meet accessibility standards.",
      },
      {
        type: "enhancement" as const,
        title: "Profile Social Links",
        description: "Redesigned social links with platform icons and brand hover colors.",
      },
      {
        type: "enhancement" as const,
        title: "Image Performance",
        description: "Added lazy loading to album grids for faster page loads.",
      },
      {
        type: "fix" as const,
        title: "Heading Hierarchy",
        description: "Fixed heading structure for improved screen reader navigation.",
      },
    ],
  },
  {
    version: "2.1",
    codename: "Cognitive",
    date: "2026-02-01",
    highlight: false,
    summary: "Smarter taste intelligence that learns how you listen.",
    changes: [
      {
        type: "feature" as const,
        title: "Enhanced Taste Engine",
        description: "Deeper analysis of your listening patterns to surface what makes your taste unique.",
      },
      {
        type: "feature" as const,
        title: "Pattern Recognition",
        description: "We now detect behavioral patterns in how you rate and discover music.",
      },
      {
        type: "feature" as const,
        title: "Taste Evolution",
        description: "Track how your preferences shift over time with new drift indicators.",
      },
      {
        type: "feature" as const,
        title: "Session Insights",
        description: "Better understanding of your listening sessions and rating habits.",
      },
      {
        type: "enhancement" as const,
        title: "Mobile Optimization",
        description: "Improved responsive layouts across all TasteID components.",
      },
      {
        type: "enhancement" as const,
        title: "New Metrics",
        description: "Additional TasteID stats for stability, exploration, and connection density.",
      },
    ],
  },
  {
    version: "2.0",
    codename: "Revival",
    date: "2026-02-02",
    highlight: false,
    summary: "Platform stability and payments.",
    changes: [
      {
        type: "feature" as const,
        title: "Payments",
        description: "Secure checkout for Wax purchases and subscriptions.",
      },
      {
        type: "fix" as const,
        title: "Platform Stability",
        description: "Resolved deployment issues and improved reliability.",
      },
      {
        type: "enhancement" as const,
        title: "Performance",
        description: "Faster builds and optimized infrastructure.",
      },
    ],
  },
  {
    version: "1.9",
    codename: "Dyad",
    date: "2026-02",
    highlight: false,
    summary: "Your connection to your taste, visualized.",
    changes: [
      {
        type: "feature" as const,
        title: "Relationship Mapping",
        description: "New ways to understand how your taste connects across genres and artists.",
      },
      {
        type: "feature" as const,
        title: "Connection Indicators",
        description: "Visual cues showing the strength of your musical identity.",
      },
      {
        type: "enhancement" as const,
        title: "Visual Refresh",
        description: "New animations and UI elements throughout the interface.",
      },
      {
        type: "enhancement" as const,
        title: "Smarter Recommendations",
        description: "Improved context for personalized suggestions.",
      },
    ],
  },
  {
    version: "1.2",
    codename: null,
    date: "2025-06",
    highlight: false,
    summary: "Understanding how you engage with music.",
    changes: [
      {
        type: "feature" as const,
        title: "Listening Signature",
        description: "A unique fingerprint of your music engagement style.",
      },
      {
        type: "feature" as const,
        title: "Cognitive Mapping",
        description: "Visualize the different ways you connect with music.",
      },
      {
        type: "feature" as const,
        title: "Behavioral Insights",
        description: "Discover patterns in how you explore and rate music.",
      },
    ],
  },
  {
    version: "1.0",
    codename: null,
    date: "2025-01",
    highlight: false,
    summary: "Platform launch.",
    changes: [
      {
        type: "feature" as const,
        title: "TasteID",
        description: "Your music taste fingerprint with archetype classification.",
      },
      {
        type: "feature" as const,
        title: "Polarity Score",
        description: "See how unique your taste is compared to the mainstream.",
      },
      {
        type: "feature" as const,
        title: "First Spin",
        description: "Be first to discover and review albums, earn badges.",
      },
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="text-xs text-[--muted] hover:text-[--foreground] transition-colors"
            >
              &larr; Back to WAXFEED
            </Link>
            <span className="text-[--muted]/30">|</span>
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[var(--accent-primary)]">
              UPDATES
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Changelog
          </h1>
          <p className="text-[--muted] max-w-2xl text-lg leading-relaxed">
            What&apos;s new on WAXFEED. Features, fixes, and improvements.
          </p>

          {/* Decorative indicator */}
          <div className="mt-8 flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="4" fill="var(--accent-primary)" opacity="0.8" className="animate-pulse" />
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const rad = (angle - 90) * (Math.PI / 180)
                  const x = 32 + 20 * Math.cos(rad)
                  const y = 32 + 20 * Math.sin(rad)
                  return (
                    <g key={i}>
                      <line x1="32" y1="32" x2={x} y2={y} stroke={i % 2 === 0 ? "var(--accent-primary)" : "#22d3ee"} strokeWidth="0.5" opacity="0.3" />
                      <circle cx={x} cy={y} r="2.5" fill={i % 2 === 0 ? "var(--accent-primary)" : "#22d3ee"} opacity="0.6" />
                    </g>
                  )
                })}
              </svg>
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[--muted]">
                TASTE INTELLIGENCE
              </span>
              <p className="text-sm text-[--muted]/70">
                Always evolving
              </p>
            </div>
          </div>
        </header>

        {/* Version entries */}
        <div className="space-y-16">
          {CHANGELOG_ENTRIES.map((entry, entryIndex) => (
            <article
              key={entry.version}
              className={`relative ${entry.highlight ? "ccx-frame p-8" : "border-l-2 border-[--border] pl-8"}`}
              style={{ animationDelay: `${entryIndex * 0.1}s` }}
            >
              {/* Version header */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div
                  className={`px-4 py-2 ${
                    entry.highlight
                      ? "bg-[var(--accent-primary)] text-black"
                      : "border border-[--border]"
                  }`}
                >
                  <span className="font-mono text-lg font-bold">v{entry.version}</span>
                  {entry.codename && (
                    <span className="ml-2 text-sm opacity-80">&quot;{entry.codename}&quot;</span>
                  )}
                </div>
                <span className="font-mono text-sm text-[--muted]">{entry.date}</span>
                {entry.highlight && (
                  <span className="px-3 py-1 bg-cyan-400/20 text-cyan-400 text-[10px] font-mono uppercase tracking-wider">
                    Latest
                  </span>
                )}
              </div>

              {/* Summary */}
              <p className="text-[--muted] mb-8 text-sm max-w-xl">
                {entry.summary}
              </p>

              {/* Changes list */}
              <div className="space-y-6">
                {entry.changes.map((change, i) => (
                  <div key={i} className="flex gap-4">
                    <span
                      className={`shrink-0 px-2 py-1 h-fit text-[9px] font-mono uppercase tracking-wider ${
                        change.type === "feature"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {change.type}
                    </span>
                    <div>
                      <h3 className="font-bold mb-1">{change.title}</h3>
                      <p className="text-sm text-[--muted] leading-relaxed">{change.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-[--border]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[var(--accent-primary)] animate-pulse" />
                <div className="w-4 h-px bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400 opacity-60" />
                <div className="w-2 h-2 bg-cyan-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
              </div>
              <span className="text-[--muted]/30">|</span>
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500/50 animate-ping" />
              </div>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[--foreground]/40">
                waxfeed
              </span>
              <span className="font-mono text-[10px] text-[var(--accent-primary)]">
                2.8
              </span>
            </div>
            <span className="text-xs text-[--muted]">
              WAXFEED
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
