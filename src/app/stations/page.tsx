import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StationApplicationForm } from "./station-form"

// Force dynamic rendering - this page needs DB access
export const dynamic = 'force-dynamic'

// Constants for the Founding Station program
const FOUNDING_STATION_LIMIT = 50

async function getStationStats() {
  const [foundingStations, totalDJs, totalReviews] = await Promise.all([
    prisma.station.count({ where: { isFoundingStation: true } }),
    prisma.stationMember.count(),
    // Count reviews from station members
    prisma.review.count({
      where: {
        user: {
          stationMemberships: { some: {} }
        }
      }
    })
  ])

  return {
    foundingStations,
    foundingSpotsRemaining: Math.max(0, FOUNDING_STATION_LIMIT - foundingStations),
    totalDJs,
    totalReviews
  }
}

export default async function StationsPage() {
  const stats = await getStationStats()

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      {/* Hero */}
      <section className="border-b border-[--border] animate-fade-in">
        <div className="max-w-4xl mx-auto px-6 py-20 lg:py-28">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-[var(--accent-primary)]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] font-bold">
              College Radio Partnership
            </p>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-[-0.02em] mb-6 leading-tight">
            Your station breaks artists.<br />
            Now you can prove it.
          </h1>
          <p className="text-lg lg:text-xl text-[--muted] max-w-2xl mb-8 leading-relaxed">
            Every DJ at every station has said &quot;I played them before anyone.&quot;
            WaxFeed gives you timestamped, verified proof—and ranks your station
            against every other station in the country.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#apply"
              className="group px-8 py-4 bg-[var(--accent-primary)] text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[var(--accent-hover)] transition-all inline-flex items-center gap-3"
            >
              <span>Apply for Founding Status</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-[--border] text-[11px] tracking-[0.15em] uppercase hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] transition-all inline-block"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* The Pitch */}
      <section className="border-b border-[--border] animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-1.5 bg-[--muted]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              The Problem
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 tracking-tight">
                College radio has the best taste in the country.
                Nobody knows it.
              </h2>
              <p className="text-[--muted] mb-6 leading-relaxed">
                Your DJs discover artists months before Spotify playlists catch up.
                You put albums in rotation that later go gold. But there&apos;s no record.
                No proof. No credit.
              </p>
              <p className="text-[--muted] leading-relaxed">
                Meanwhile, algorithms get credit for &quot;discovery&quot; that college radio
                actually made happen.
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-6 border border-[--border] hover:border-[--muted]/50 transition-colors">
                <p className="text-sm text-[--muted] mb-2">DJ reviews an album in October</p>
                <p className="font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  No record
                </p>
              </div>
              <div className="p-6 border border-[--border] hover:border-[--muted]/50 transition-colors">
                <p className="text-sm text-[--muted] mb-2">Album blows up in February</p>
                <p className="font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  Spotify playlist gets credit
                </p>
              </div>
              <div className="p-6 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 transition-colors">
                <p className="text-sm text-[var(--accent-primary)] mb-2">With WaxFeed</p>
                <p className="font-medium text-[var(--accent-primary)] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Timestamped proof. Gold Spin badge. Station ranking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b border-[--border] animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-1.5 bg-[--muted]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              How It Works
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="p-6 border border-[--border] hover:border-[--muted]/50 transition-colors group">
              <div className="w-10 h-10 border border-white flex items-center justify-center mb-4 group-hover:border-[var(--accent-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                <span className="text-lg font-bold">1</span>
              </div>
              <p className="text-lg font-bold mb-2">DJs review albums</p>
              <p className="text-sm text-[--muted] leading-relaxed">
                When your DJs review an album on WaxFeed, their position is recorded.
                &quot;You were reviewer #7 of this album.&quot;
              </p>
            </div>
            <div className="p-6 border border-[--border] hover:border-[--muted]/50 transition-colors group">
              <div className="w-10 h-10 border border-white flex items-center justify-center mb-4 group-hover:border-[var(--accent-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                <span className="text-lg font-bold">2</span>
              </div>
              <p className="text-lg font-bold mb-2">Albums trend</p>
              <p className="text-sm text-[--muted] leading-relaxed">
                When an album hits 100+ reviews, enters Billboard, or gains momentum—
                everyone who called it early gets credit.
              </p>
            </div>
            <div className="p-6 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 transition-colors group">
              <div className="w-10 h-10 border border-[var(--accent-primary)] flex items-center justify-center mb-4 text-[var(--accent-primary)]">
                <span className="text-lg font-bold">3</span>
              </div>
              <p className="text-lg font-bold mb-2">Station earns badges</p>
              <p className="text-sm text-[--muted] leading-relaxed">
                Gold Spin (first 10 reviewers), Silver Spin (first 50), Bronze Spin (first 100).
                These roll up to your station&apos;s Tastemaker Score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Station Leaderboard Preview */}
      <section className="border-b border-[--border] animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-1.5 bg-[--muted]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              Station Leaderboards
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6 tracking-tight">
                Which station has the best taste?
              </h2>
              <p className="text-[--muted] mb-6 leading-relaxed">
                For the first time, there&apos;s an objective answer. Station Tastemaker Scores
                aggregate all DJs&apos; badges. Conference rankings let you compete against
                natural rivals.
              </p>
              <p className="text-sm text-[--muted] leading-relaxed">
                Imagine being able to say: &quot;WRVU is the #1 taste station in the SEC,
                with 47 Gold Spins this semester.&quot;
              </p>
            </div>
            <div className="border border-[--border] p-6">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted] mb-4">
                Preview: Big Ten Tastemaker Rankings
              </p>
              <div className="space-y-0">
                {[
                  { rank: 1, name: "WJPZ", school: "Syracuse", score: 847, gold: 12 },
                  { rank: 2, name: "WMUC", school: "Maryland", score: 712, gold: 9 },
                  { rank: 3, name: "WRVU", school: "Vanderbilt", score: 698, gold: 8 },
                  { rank: 4, name: "WPTS", school: "Pittsburgh", score: 521, gold: 6 },
                  { rank: 5, name: "Your Station?", school: "", score: "—", gold: "?" },
                ].map((station, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-3 transition-colors hover:bg-[--muted]/5 ${
                      i < 4 ? 'border-b border-[--border]' : ''
                    } ${station.rank === 5 ? 'opacity-60 hover:opacity-100' : ''}`}
                    style={{ animationDelay: `${400 + i * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-6 text-center font-bold tabular-nums ${
                        station.rank === 1 ? 'text-[var(--accent-primary)]' : ''
                      }`}>
                        {station.rank}
                      </span>
                      <div>
                        <p className="font-medium">{station.name}</p>
                        {station.school && (
                          <p className="text-xs text-[--muted]">{station.school}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[var(--accent-primary)] flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                        </svg>
                        {station.gold}
                      </span>
                      <span className="font-bold tabular-nums w-12 text-right">{station.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Offer */}
      <section className="border-b border-[--border] bg-gradient-to-b from-[var(--accent-primary)]/5 to-transparent animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2 h-2 bg-[var(--accent-primary)]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] font-bold">
              Founding Station Program
            </p>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 tracking-tight">
            50 stations. Founding status. Forever.
          </h2>
          <p className="text-lg text-[--muted] mb-8 max-w-2xl mx-auto leading-relaxed">
            The first 50 college radio stations to join get Founding Station status—
            which means all premium features, forever, at no cost.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            <div className="p-6 border border-[--border] text-left hover:border-[var(--accent-primary)]/30 transition-colors">
              <p className="text-sm font-bold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                What you get
              </p>
              <ul className="space-y-3 text-sm text-[--muted]">
                {[
                  "Station dashboard with all DJ stats",
                  "Conference leaderboard position",
                  "Verified DJ badges for all members",
                  "Trending Radar for all DJs",
                  "API access for your station website",
                  "\"Founding Station\" badge forever"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 border border-[--border] text-left hover:border-[var(--accent-primary)]/30 transition-colors">
              <p className="text-sm font-bold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                What we ask
              </p>
              <ul className="space-y-3 text-sm text-[--muted]">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center border border-[--border] text-[10px] font-bold">1</span>
                  At least 5 DJs reviewing weekly
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center border border-[--border] text-[10px] font-bold">2</span>
                  Link to WaxFeed in your &quot;on rotation&quot; or website
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-[--border]">
                <p className="text-xs text-[--muted] leading-relaxed">
                  That&apos;s it. No credit card. No trial that expires.
                  Founding status is permanent.
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-4 px-6 py-4 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5">
            <span className="text-4xl font-bold text-[var(--accent-primary)] tabular-nums">{stats.foundingSpotsRemaining}</span>
            <div className="text-left">
              <span className="text-sm text-[--foreground] block">spots remaining</span>
              <span className="text-xs text-[--muted]">of {FOUNDING_STATION_LIMIT} founding stations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="border-b border-[--border] animate-fade-in" style={{ animationDelay: '500ms' }}>
        <div className="max-w-xl mx-auto px-6 py-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 bg-[--muted]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              Apply Now
            </p>
          </div>
          <h2 className="text-2xl font-bold mb-8 text-center tracking-tight">
            Get your station on the leaderboard
          </h2>

          <StationApplicationForm />

          <p className="text-xs text-[--muted] text-center mt-6">
            Questions? Email us at{" "}
            <a href="mailto:stations@waxfeed.com" className="text-[var(--accent-primary)] hover:underline">
              stations@waxfeed.com
            </a>
          </p>
        </div>
      </section>

      {/* Social Proof / Vision */}
      <section className="animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 bg-[--muted]" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
              The Vision
            </p>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-6 tracking-tight">
            College radio is where taste is made.<br />
            WaxFeed is where taste is proven.
          </h2>
          <p className="text-[--muted] max-w-2xl mx-auto mb-10 leading-relaxed">
            When your DJ says &quot;I was playing them before anyone,&quot; they&apos;ll have the badge to prove it.
            When labels ask who&apos;s breaking artists, your station&apos;s Tastemaker Score will answer.
          </p>
          <div className="grid sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="p-6 border border-[--border]">
              <p className="text-4xl font-bold mb-2 tabular-nums">{stats.totalDJs || 0}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">DJs active</p>
            </div>
            <div className="p-6 border border-[--border]">
              <p className="text-4xl font-bold mb-2 tabular-nums">{stats.foundingStations || 0}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Stations joined</p>
            </div>
            <div className="p-6 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5">
              <p className="text-4xl font-bold text-[var(--accent-primary)] mb-2 tabular-nums">{stats.foundingSpotsRemaining}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Spots left</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[--border] animate-fade-in" style={{ animationDelay: '700ms' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[--muted]">
            Questions?{" "}
            <a href="mailto:stations@waxfeed.com" className="text-[var(--accent-primary)] hover:underline">
              stations@waxfeed.com
            </a>
          </p>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-[var(--accent-primary)] transition-colors"
            >
              WaxFeed Home
            </Link>
            <Link
              href="/leaderboard"
              className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-[var(--accent-primary)] transition-colors"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
