import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Changelog | WAXFEED",
  description: "WAXFEED platform updates and new features",
}

const CHANGELOG_ENTRIES = [
  {
    version: "2.1",
    codename: "Cognitive",
    date: "2026-02-01",
    highlight: true,
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
                2.1
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
