"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { TasteIDHeroCard } from "./TasteIDHeroCard"
import { TierJourney } from "./TierJourney"
import { ArtistDNAStrip } from "./ArtistDNAStrip"
import { TasteCardShare } from "./TasteCardShare"
import {
  MusicNetworksVisualization,
  MusicNetworksLegend,
  ListeningModeIndicator,
  MusicNetworkKey,
} from "@/components/tasteid"
import { CCXGraphMini, DyadicIndicator } from "@/components/polarity-system"
import { ArrowRightIcon } from "@/components/icons"

const TABS = [
  { id: "identity", label: "Identity" },
  { id: "signature", label: "Signature" },
  { id: "analysis", label: "Analysis" },
  { id: "evolution", label: "Evolution" },
  { id: "share", label: "Share" },
] as const

type TabId = (typeof TABS)[number]["id"]

interface TasteIDDashboardProps {
  username: string
  image: string | null
  isOwnProfile: boolean
  archetypeInfo: { id: string; name: string; description: string; icon?: string }
  secondaryInfo?: { id: string; name: string; description: string; icon?: string } | null
  archetypeConfidence: number
  polarityScore: number
  polarityScore2: number | null
  genreVector: Record<string, number>
  reviewCount: number
  topArtists: string[]
  topGenres: string[]
  decadePrefs: Record<string, number>
  ratingSkew: string
  averageRating: number
  ratingStdDev: number
  adventurenessScore: number
  reviewDepth: string
  avgReviewLength: number
  // Listening signature data
  signatureData: {
    network: string
    name: string
    icon: string
    percentage: number
    deviation: string
    deviationAmount: number
    typicalRange: { min: number; max: number }
  }[] | null
  signatureInsight: string
  uniqueness: { score: number; standoutNetworks: { network: string; direction: string; deviation: number }[] } | null
  musicNetworks: Partial<Record<MusicNetworkKey, number>> | null
  signaturePatterns: string[]
  patternMeanings: Record<string, string>
  networkMeanings: Record<string, string>
  // Polarity OS
  polarityOS: {
    patterns: { confirmed: any[]; emerging: any[]; total: number }
    driftAlerts: any[]
    metrics: { patternStability: number; explorationRate: number; graphDensity: number }
  } | null
  // Evolution data
  memorableMoments: any[]
  futureSelvesMusic: any[]
  evolution: {
    since: string
    interpretation: string
    overallDrift: number
    significantChanges: { network: string; direction: string; change: number }[]
  } | null
  consolidation: {
    headline: string
    details: string
    coreGenres: string[]
    coreArtists: string[]
    items: { type: string; name: string; strength: number; trend: string }[]
  } | null
  // Actions
  recomputeButton: React.ReactNode
  smallRecomputeButton: React.ReactNode
  resetButton: React.ReactNode
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`glass p-5 md:p-6 mb-4 ${className}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1.5 h-1.5 bg-[--polarity-teal] rounded-full" />
      <h3 className="text-[10px] tracking-[0.4em] uppercase text-[--foreground] font-technical font-bold">
        {label}
      </h3>
      {tag && (
        <span className="text-[9px] px-2 py-0.5 border border-[--polarity-teal]/30 text-[--polarity-teal] uppercase tracking-wider font-technical">
          {tag}
        </span>
      )}
    </div>
  )
}

export function TasteIDDashboard(props: TasteIDDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("identity")
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const tabBarRef = useRef<HTMLDivElement>(null)

  // Scroll to section when tab changes
  useEffect(() => {
    const el = sectionRefs.current[activeTab]
    if (el) {
      const offset = tabBarRef.current?.offsetHeight || 60
      const top = el.getBoundingClientRect().top + window.scrollY - offset - 80
      window.scrollTo({ top, behavior: "smooth" })
    }
  }, [activeTab])

  // IntersectionObserver to update active tab on scroll
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    TABS.forEach(({ id }) => {
      const el = sectionRefs.current[id]
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveTab(id)
        },
        { rootMargin: "-40% 0px -50% 0px" }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-20">
      {/* Back link */}
      <div className="flex items-center justify-between gap-4 mb-6 pt-4">
        <Link
          href={`/u/${props.username}`}
          className="text-sm text-[--muted] hover:text-[--foreground] transition-colors"
        >
          ← Back to profile
        </Link>
        <div className="flex gap-2">
          {props.isOwnProfile && (
            <Link
              href="/quick-rate"
              className="px-4 py-2 bg-[--accent-primary] text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[--accent-hover] transition-colors"
            >
              Keep Building
            </Link>
          )}
          {!props.isOwnProfile && (
            <Link
              href={`/u/${props.username}/compare`}
              className="flex items-center gap-2 px-4 py-2 border border-[--border] text-[10px] font-bold uppercase tracking-[0.2em] hover:border-[--foreground] transition-colors"
            >
              Compare Taste <ArrowRightIcon className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Sticky tab navigation */}
      <div
        ref={tabBarRef}
        className="sticky top-16 z-30 bg-[--background]/80 backdrop-blur-lg border-b border-[--border] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 mb-8"
      >
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-technical font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-black"
                  : "text-[--muted] hover:text-[--foreground]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* IDENTITY SECTION */}
      <div ref={(el) => { sectionRefs.current.identity = el }}>
        <TasteIDHeroCard
          username={props.username}
          image={props.image}
          archetypeInfo={props.archetypeInfo}
          secondaryInfo={props.secondaryInfo}
          archetypeConfidence={props.archetypeConfidence}
          polarityScore={props.polarityScore}
          genreVector={props.genreVector}
          isOwnProfile={props.isOwnProfile}
        />
        <TierJourney ratingCount={props.reviewCount} />

        {/* Defining Artists */}
        {props.topArtists.length > 0 && (
          <SectionCard>
            <SectionHeader label="Defining Artists" />
            <ArtistDNAStrip artists={props.topArtists} />
          </SectionCard>
        )}
      </div>

      {/* SIGNATURE SECTION */}
      <div ref={(el) => { sectionRefs.current.signature = el }}>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Polarity Score" value={props.polarityScore.toFixed(2)} description="Taste distinctiveness" progress={Math.min(100, props.polarityScore * 100)} color="var(--polarity-teal)" />
          <StatCard label="Adventureness" value={`${Math.round(props.adventurenessScore * 100)}%`} description="Genre diversity" progress={Math.round(props.adventurenessScore * 100)} color="#00ff88" />
          <StatCard label="Rating Style" value={props.ratingSkew.toUpperCase()} description={props.ratingSkew === "harsh" ? "High standards" : props.ratingSkew === "lenient" ? "Finds joy easily" : "Balanced critic"} />
          <StatCard label="Avg Rating" value={props.averageRating.toFixed(1)} description={`±${props.ratingStdDev.toFixed(1)} std dev`} progress={(props.averageRating / 10) * 100} color="var(--accent-primary)" />
        </div>

        {/* Listening Signature */}
        {props.signatureData && (
          <SectionCard>
            <SectionHeader label="Listening Signature" tag="Polarity 1.9" />
            <p className="text-sm text-[--muted] mb-6 leading-relaxed">{props.signatureInsight}</p>

            {props.uniqueness && props.uniqueness.standoutNetworks.length > 0 && (
              <div className="mb-5 p-3 border border-[--border] bg-white/[0.02]">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-2 font-technical">What Makes You Unique</p>
                <div className="flex flex-wrap gap-2">
                  {props.uniqueness.standoutNetworks.map((s) => (
                    <span key={s.network} className={`text-xs px-2 py-1 border ${s.direction === "high" ? "border-green-500/30 text-green-400" : "border-orange-500/30 text-orange-400"}`}>
                      {s.direction === "high" ? "+" : "-"}{s.deviation}% {s.network.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {props.signatureData.map((network, i) => (
                <div key={network.network}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide">{network.name}</span>
                          {network.deviation !== "typical" && (
                            <span className={`text-[10px] px-1.5 py-0.5 ${network.deviation === "above" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                              {network.deviation === "above" ? "↑" : "↓"} {network.deviationAmount}%
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[--muted] font-technical">{network.percentage}%</span>
                      </div>
                      <div className="h-2 bg-white/[0.04] overflow-hidden relative">
                        <div className="absolute h-full bg-white/[0.06]" style={{ left: `${network.typicalRange.min}%`, width: `${network.typicalRange.max - network.typicalRange.min}%` }} />
                        <motion.div
                          className={`h-full ${network.deviation === "above" ? "bg-green-400" : network.deviation === "below" ? "bg-orange-400" : "bg-[--foreground]"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(network.percentage, 100)}%` }}
                          transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(props.polarityScore2 || props.uniqueness) && (
              <div className="mt-5 pt-4 border-t border-[--border] grid grid-cols-2 gap-4">
                {props.polarityScore2 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] font-technical">Polarity 2.0</span>
                      <span className="text-xl font-bold font-technical">{props.polarityScore2.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-[--muted]">Taste identity strength</p>
                  </div>
                )}
                {props.uniqueness && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] font-technical">Uniqueness</span>
                      <span className="text-xl font-bold font-technical">{Math.round(props.uniqueness.score * 100)}%</span>
                    </div>
                    <p className="text-[10px] text-[--muted]">How distinct from typical</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {/* Music Networks */}
        {props.musicNetworks && (
          <SectionCard>
            <SectionHeader label="7 Music Networks" tag="Yeo Model" />
            <p className="text-sm text-[--muted] mb-6 leading-relaxed">
              Your listening signature mapped to 7 distinct modes of musical engagement.
            </p>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex justify-center lg:justify-start">
                <MusicNetworksVisualization networkActivations={props.musicNetworks} size={220} />
              </div>
              <div className="flex-1 space-y-4">
                <ListeningModeIndicator networkActivations={props.musicNetworks} className="mb-4" />
                <div className="pt-4 border-t border-[--border]">
                  <MusicNetworksLegend showYeoMapping={true} />
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* ANALYSIS SECTION */}
      <div ref={(el) => { sectionRefs.current.analysis = el }}>
        {/* Top Genres */}
        {props.topGenres.length > 0 && (
          <SectionCard>
            <SectionHeader label="Top Genres" />
            <div className="flex flex-wrap gap-2">
              {props.topGenres.map((genre, i) => (
                <div key={genre} className="flex items-center gap-2 px-3 py-2 border border-[--border] hover:border-[--foreground] transition-colors">
                  <span className="text-[10px] text-[--muted] font-technical">{i + 1}</span>
                  <span className="font-bold uppercase text-sm">{genre}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Decades */}
        {Object.keys(props.decadePrefs).length > 0 && (
          <SectionCard>
            <SectionHeader label="Decade Preferences" />
            <div className="space-y-3">
              {Object.entries(props.decadePrefs)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([decade, value]) => (
                  <div key={decade} className="flex items-center gap-3">
                    <span className="w-14 text-sm font-bold font-technical">{decade}</span>
                    <div className="flex-1 h-3 bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full bg-[--foreground]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${value * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-[--muted] font-technical">{Math.round(value * 100)}%</span>
                  </div>
                ))}
            </div>
          </SectionCard>
        )}

        {/* Review Depth */}
        <SectionCard>
          <SectionHeader label="Review Profile" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] font-technical mb-1">Style</p>
              <p className="text-lg font-bold uppercase">{props.reviewDepth}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] font-technical mb-1">Analyzed</p>
              <p className="text-lg font-bold font-technical">{props.reviewCount}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] font-technical mb-1">Avg Length</p>
              <p className="text-lg font-bold font-technical">{props.avgReviewLength} <span className="text-xs text-[--muted]">words</span></p>
            </div>
          </div>
        </SectionCard>

        {/* Patterns */}
        {props.signaturePatterns.length > 0 && (
          <SectionCard>
            <SectionHeader label="Your Patterns" />
            <div className="space-y-3">
              {props.signaturePatterns.map((pattern) => (
                <div key={pattern} className="p-3 border border-[--border] hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-[--foreground]" />
                    <span className="font-bold uppercase tracking-wide text-sm">{pattern}</span>
                  </div>
                  <p className="text-xs text-[--muted] pl-3.5">{props.patternMeanings[pattern]}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Polarity OS */}
        {props.polarityOS && (props.polarityOS.patterns.total > 0 || props.polarityOS.driftAlerts.length > 0) && (
          <SectionCard className="border-[--polarity-teal]/20">
            <SectionHeader label="Polarity OS" tag="2.1 Cognitive" />
            <p className="text-sm text-[--muted] mb-5">Advanced cognitive modeling — detecting behavioral patterns and taste evolution.</p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-white/[0.02] border border-[--border] text-center">
                <p className="text-2xl font-bold text-[--polarity-teal] font-technical">{props.polarityOS.patterns.total}</p>
                <p className="text-[9px] uppercase tracking-wider text-[--muted] font-technical">Patterns</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-[--border] text-center">
                <p className="text-2xl font-bold text-green-400 font-technical">{(props.polarityOS.metrics.patternStability * 100).toFixed(0)}%</p>
                <p className="text-[9px] uppercase tracking-wider text-[--muted] font-technical">Stability</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-[--border] text-center">
                <p className="text-2xl font-bold text-amber-400 font-technical">{(props.polarityOS.metrics.explorationRate * 100).toFixed(0)}%</p>
                <p className="text-[9px] uppercase tracking-wider text-[--muted] font-technical">Exploration</p>
              </div>
            </div>

            {props.polarityOS.patterns.confirmed.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] tracking-wider uppercase text-[--muted] mb-2 flex items-center gap-2 font-technical">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Confirmed
                </p>
                <div className="flex flex-wrap gap-2">
                  {props.polarityOS.patterns.confirmed.slice(0, 5).map((p: any) => (
                    <span key={p.id} className="text-xs px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400">{p.name}</span>
                  ))}
                </div>
              </div>
            )}

            {props.polarityOS.patterns.emerging.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] tracking-wider uppercase text-[--muted] mb-2 flex items-center gap-2 font-technical">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Emerging
                </p>
                <div className="flex flex-wrap gap-2">
                  {props.polarityOS.patterns.emerging.slice(0, 3).map((p: any) => (
                    <span key={p.id} className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400">{p.name}</span>
                  ))}
                </div>
              </div>
            )}

            {props.polarityOS.driftAlerts.length > 0 && (
              <div className="pt-3 border-t border-[--border]">
                <p className="text-[10px] tracking-wider uppercase text-[--muted] mb-2 flex items-center gap-2 font-technical">
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" /> Taste Drift
                </p>
                <div className="space-y-2">
                  {props.polarityOS.driftAlerts.slice(0, 3).map((alert: any, i: number) => (
                    <div key={i} className="text-xs p-2 bg-rose-500/5 border border-rose-500/15 text-rose-300">
                      {alert.message || alert.type}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* EVOLUTION SECTION */}
      <div ref={(el) => { sectionRefs.current.evolution = el }}>
        {/* Memorable Moments */}
        {props.memorableMoments.length > 0 && (
          <SectionCard>
            <SectionHeader label="Memorable Moments" />
            <div className="space-y-3">
              {props.memorableMoments.slice(0, 5).map((moment: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 border border-[--border] hover:border-white/15 transition-colors">
                  <div className="w-10 h-10 border border-[--foreground] flex items-center justify-center text-sm font-bold flex-shrink-0 font-technical">
                    {moment.type === "first_10" ? "10" : moment.type === "first_0" ? "0" : "★"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{moment.albumTitle}</p>
                    <p className="text-xs text-[--muted] truncate">{moment.artistName}</p>
                  </div>
                  <span className="text-[10px] text-[--muted] uppercase tracking-wider font-technical whitespace-nowrap">
                    {moment.description}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Musical Futures */}
        {props.futureSelvesMusic.length > 0 && (
          <SectionCard>
            <SectionHeader label="Musical Futures" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {props.futureSelvesMusic.map((future: any) => (
                <div key={future.id} className="p-4 border border-[--border] hover:border-white/15 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold uppercase tracking-wide text-sm">{future.name}</h4>
                    <span className="text-xs font-technical text-[--muted]">{Math.round(future.progress * 100)}%</span>
                  </div>
                  <p className="text-xs text-[--muted] mb-3">{future.description}</p>
                  <div className="h-1.5 bg-white/[0.04]">
                    <motion.div
                      className="h-full bg-[--foreground]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${future.progress * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <p className="text-[10px] text-[--muted] mt-2 font-technical">
                    Next: {future.nextSteps?.[0] || "Continue exploring"}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Taste Evolution */}
        {props.evolution && (
          <SectionCard>
            <SectionHeader label="Taste Evolution" />
            <p className="text-sm text-[--muted] mb-4">{props.evolution.interpretation}</p>
            {props.evolution.significantChanges.length > 0 && (
              <div className="space-y-2 mb-4">
                {props.evolution.significantChanges.slice(0, 4).map((change) => (
                  <div key={change.network} className="flex items-center gap-3 text-sm">
                    <span className={`w-5 text-center ${change.direction === "increased" ? "text-green-400" : change.direction === "decreased" ? "text-orange-400" : "text-[--muted]"}`}>
                      {change.direction === "increased" ? "↑" : change.direction === "decreased" ? "↓" : "→"}
                    </span>
                    <span className="uppercase font-bold text-xs">{change.network.replace("_", " ")}</span>
                    <span className="text-xs text-[--muted] font-technical">{change.change > 0 ? "+" : ""}{change.change}%</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-[--border]">
              <span className="text-[10px] text-[--muted] font-technical uppercase">Overall drift</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-white/[0.04]">
                  <div
                    className={`h-full ${props.evolution.overallDrift > 0.3 ? "bg-amber-400" : props.evolution.overallDrift > 0.15 ? "bg-blue-400" : "bg-green-400"}`}
                    style={{ width: `${props.evolution.overallDrift * 100}%` }}
                  />
                </div>
                <span className="text-xs font-technical text-[--muted]">{Math.round(props.evolution.overallDrift * 100)}%</span>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Consolidation */}
        {props.consolidation && (
          <SectionCard>
            <SectionHeader label="Taste Consolidation" tag="What's Sticking" />
            <p className="text-lg font-bold mb-1">{props.consolidation.headline}</p>
            <p className="text-sm text-[--muted] mb-4">{props.consolidation.details}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {props.consolidation.coreGenres.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-wider uppercase text-[--muted] mb-2 font-technical">Core Genres</p>
                  <div className="flex flex-wrap gap-1">
                    {props.consolidation.coreGenres.map((g) => (
                      <span key={g} className="text-xs px-2 py-1 border border-green-500/20 text-green-400">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {props.consolidation.coreArtists.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-wider uppercase text-[--muted] mb-2 font-technical">Core Artists</p>
                  <div className="flex flex-wrap gap-1">
                    {props.consolidation.coreArtists.map((a) => (
                      <span key={a} className="text-xs px-2 py-1 border border-blue-500/20 text-blue-400">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {props.consolidation.items.length > 0 && (
              <div className="pt-3 border-t border-[--border] space-y-2">
                {props.consolidation.items.slice(0, 5).map((item) => (
                  <div key={`${item.type}-${item.name}`} className="flex items-center gap-2">
                    <span className="text-[9px] w-10 text-[--muted] uppercase font-technical">{item.type}</span>
                    <span className="w-24 text-xs truncate">{item.name}</span>
                    <div className="flex-1 h-1.5 bg-white/[0.04]">
                      <div className={`h-full ${item.trend === "strengthening" ? "bg-green-400" : item.trend === "fading" ? "bg-orange-400" : "bg-[--foreground]"}`} style={{ width: `${item.strength * 100}%` }} />
                    </div>
                    <span className={`text-[10px] ${item.trend === "strengthening" ? "text-green-400" : item.trend === "fading" ? "text-orange-400" : "text-[--muted]"}`}>
                      {item.trend === "strengthening" ? "↑" : item.trend === "fading" ? "↓" : "→"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* SHARE SECTION */}
      <div ref={(el) => { sectionRefs.current.share = el }}>
        {props.isOwnProfile && (
          <SectionCard>
            <TasteCardShare username={props.username} archetype={props.archetypeInfo.name} />
          </SectionCard>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          {props.isOwnProfile && props.recomputeButton}
          <Link
            href="/discover/similar-tasters"
            className="px-4 py-3 border border-[--border] text-[10px] font-bold uppercase tracking-[0.2em] hover:border-[--foreground] transition-colors"
          >
            Find Similar Tasters
          </Link>
        </div>

        {/* Last computed */}
        <p className="text-[10px] text-[--muted] mt-8 font-technical">
          Last computed: {new Date().toLocaleDateString()}
        </p>

        {/* Danger zone */}
        {props.isOwnProfile && (
          <div className="mt-12 pt-6 border-t border-red-500/20">
            <p className="text-[10px] tracking-[0.3em] uppercase text-red-500/60 mb-4 font-technical">Danger Zone</p>
            {props.resetButton}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  progress,
  color = "var(--accent-primary)",
}: {
  label: string
  value: string
  description: string
  progress?: number
  color?: string
}) {
  return (
    <motion.div
      className="glass p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-[9px] tracking-[0.3em] uppercase text-[--muted] font-technical font-bold mb-1">{label}</p>
      <p className="text-xl font-bold font-technical" style={progress !== undefined ? { color } : undefined}>{value}</p>
      {progress !== undefined && (
        <div className="h-1.5 bg-white/[0.04] overflow-hidden mt-2 mb-1">
          <motion.div
            className="h-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
      <p className="text-[10px] text-[--muted] mt-1">{description}</p>
    </motion.div>
  )
}
