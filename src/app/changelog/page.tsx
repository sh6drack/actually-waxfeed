import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Changelog | WAXFEED",
  description: "WAXFEED platform updates and Polarity system evolution",
}

const CHANGELOG_ENTRIES = [
  {
    version: "2.0",
    codename: "Revival",
    date: "2026-02-02",
    highlight: true,
    summary: "Critical infrastructure fixes and Stripe payments integration.",
    changes: [
      {
        type: "feature" as const,
        title: "Stripe Payments",
        description: "Live Stripe Elements integration for Wax purchases and subscriptions. Secure payment processing with webhook fulfillment.",
      },
      {
        type: "fix" as const,
        title: "Deployment Recovery",
        description: "Fixed 4-day deployment outage caused by Git LFS provisioning and turbopack configuration issues.",
      },
      {
        type: "fix" as const,
        title: "Vercel Project Sync",
        description: "Resolved CLI linking to wrong Vercel project. Documented correct project: actually-waxfeed-bkk6.",
      },
      {
        type: "enhancement" as const,
        title: "Build Optimization",
        description: "Removed prisma db push from build command to prevent deployment timeouts. Cleaned unused dependencies.",
      },
      {
        type: "enhancement" as const,
        title: "Documentation",
        description: "Updated CLAUDE.md with critical deployment instructions and troubleshooting guides.",
      },
    ],
  },
  {
    version: "1.9",
    codename: "Dyad",
    date: "2026-02",
    highlight: false,
    summary: "Relationship-based identity. The dyad represents user-taste connection.",
    changes: [
      {
        type: "feature" as const,
        title: "CCX Integration",
        description: "Conversational Connectomics powers taste relationships. 14 node types, 13 edge types for deeper connection mapping.",
      },
      {
        type: "feature" as const,
        title: "Dyadic Indicators",
        description: "Visual representation of connection strength between you and your music taste identity.",
      },
      {
        type: "enhancement" as const,
        title: "Enhanced Visual System",
        description: "New CCX graph visualizations, dyadic pulse effects, and connection indicators throughout the interface.",
      },
      {
        type: "enhancement" as const,
        title: "Agent Context",
        description: "Session continuity for AI-powered taste analysis and recommendations.",
      },
      {
        type: "enhancement" as const,
        title: "Corner Brackets 2.0",
        description: "CCX node indicators at screen corners with alternating gold/cyan pulse patterns.",
      },
    ],
  },
  {
    version: "1.2",
    codename: null,
    date: "2025-06",
    highlight: false,
    summary: "Cognitive listening signatures and BrainID integration.",
    changes: [
      {
        type: "feature" as const,
        title: "Listening Signature",
        description: "7-Network cognitive model for music engagement patterns based on neuroscience research.",
      },
      {
        type: "feature" as const,
        title: "BrainID Visualization",
        description: "Yeo 7-Network inspired cognitive mapping for music taste.",
      },
      {
        type: "feature" as const,
        title: "Pattern Detection",
        description: "20+ behavioral patterns including Discovery-Comfort Oscillation and Temporal Anchoring.",
      },
      {
        type: "enhancement" as const,
        title: "Memory Architecture",
        description: "Tiered memory system for taste consolidation tracking.",
      },
    ],
  },
  {
    version: "1.0",
    codename: null,
    date: "2025-01",
    highlight: false,
    summary: "Platform launch with TasteID and Polarity Score.",
    changes: [
      {
        type: "feature" as const,
        title: "TasteID Launch",
        description: "Music taste fingerprint system with archetype classification across 8 dimensions.",
      },
      {
        type: "feature" as const,
        title: "CCX POLARITY Model",
        description: "8-dimensional taste profiling: Commercial-Underground, Retro-Forward, Acoustic-Electronic, and more.",
      },
      {
        type: "feature" as const,
        title: "Polarity Score",
        description: "Taste distinctiveness metric measuring uniqueness from mainstream listening patterns.",
      },
      {
        type: "feature" as const,
        title: "First Spin Tracking",
        description: "Be first to discover and review albums, tracked with First Spin badges.",
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
              POLARITY EVOLUTION
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Changelog
          </h1>
          <p className="text-[--muted] max-w-2xl text-lg leading-relaxed">
            Track the evolution of WAXFEED&apos;s Polarity taste intelligence system.
            From basic profiling to cognitive connectomics.
          </p>

          {/* CCX Graph indicator */}
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
                TASTE CONNECTOME
              </span>
              <p className="text-sm text-[--muted]/70">
                Your music identity, visualized
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

        {/* Polarity badge footer */}
        <footer className="mt-20 pt-8 border-t border-[--border]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Dyadic indicator */}
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
                polarity
              </span>
              <span className="font-mono text-[10px] text-[var(--accent-primary)]">
                1.9
              </span>
              <span className="font-mono text-[8px] text-cyan-400/60 tracking-widest uppercase">
                dyad
              </span>
            </div>
            <span className="text-xs text-[--muted]">
              WAXFEED &times; Polarity Lab LLC
            </span>
          </div>

          {/* Technical readout */}
          <div className="mt-6 font-mono text-[9px] text-[--muted]/40 tracking-wider">
            <span>CCX: 14 NODE TYPES</span>
            <span className="mx-2">|</span>
            <span>13 EDGE TYPES</span>
            <span className="mx-2">|</span>
            <span>DYADIC AUTH: ENABLED</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
