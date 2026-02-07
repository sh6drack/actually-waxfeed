"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"

const FEATURES = [
  {
    id: "tasteid",
    label: "TasteID",
    headline: "Your musical DNA, decoded",
    description:
      "Rate albums. We analyze your patterns—genres, decades, moods, listening habits—and build a living profile of who you are musically. Not a playlist. A mirror.",
    color: "#ff6b6b",
    stat: "26 Archetypes",
    statLabel: "Which one are you?",
    visual: "radar",
  },
  {
    id: "discover",
    label: "Discover",
    headline: "Recs that actually make sense",
    description:
      "Once we know your taste, recommendations stop being random. Surface deep cuts from genres you didn't know you loved. Find the album that changes everything.",
    color: "#4ECDC4",
    stat: "Billboard 200",
    statLabel: "Updated weekly",
    visual: "grid",
  },
  {
    id: "connect",
    label: "Connect",
    headline: "Find your wavelength",
    description:
      "Taste Twins who share your exact frequency. Opposite Attracts who expand your horizons. Explorer Guides who chart new territory. Your people exist—we find them.",
    color: "#BB8FCE",
    stat: "4 Match Types",
    statLabel: "Algorithm-driven",
    visual: "network",
  },
  {
    id: "prove",
    label: "Prove It",
    headline: "Timestamped receipts",
    description:
      "You found that artist before they blew up? Prove it. Every rating is timestamped, every review is public. Build your credibility with an immutable taste record.",
    color: "#ffd700",
    stat: "Wax Economy",
    statLabel: "Earn, spend, flex",
    visual: "badge",
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className="group relative glass p-6 md:p-8 hover:border-white/10 transition-colors duration-500"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Color accent line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, ${feature.color}, transparent)` }}
      />

      {/* Label */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: feature.color }}
        />
        <span
          className="text-[10px] tracking-[0.4em] uppercase font-technical font-medium"
          style={{ color: feature.color }}
        >
          {feature.label}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-display font-bold mb-3 leading-tight">
        {feature.headline}
      </h3>
      <p className="text-sm text-[--muted] leading-relaxed mb-6">
        {feature.description}
      </p>

      {/* Stat chip */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold font-technical" style={{ color: feature.color }}>
          {feature.stat}
        </span>
        <span className="text-[10px] text-[--muted] tracking-wide uppercase">
          {feature.statLabel}
        </span>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-sm"
        style={{
          boxShadow: `inset 0 0 60px rgba(${feature.color === "#ff6b6b" ? "255,107,107" : feature.color === "#4ECDC4" ? "78,205,196" : feature.color === "#BB8FCE" ? "187,143,206" : "255,215,0"}, 0.03)`,
        }}
      />
    </motion.div>
  )
}

export function FeatureShowcase() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: "-50px" })

  return (
    <section className="relative py-20 md:py-28 px-6 md:px-12 lg:px-20 xl:px-32">
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[--polarity-teal] font-technical mb-4">
            The Platform
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight max-w-xl">
            Not a playlist app.
            <br />
            <span className="text-[--muted]">A taste lab.</span>
          </h2>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-12 md:mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[--accent-primary] text-black text-xs font-bold uppercase tracking-[0.2em] hover:scale-[1.02] transition-all glow-gold"
          >
            Start Your TasteID
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
