import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StationApplicationForm } from "./station-form"
import { Tooltip, HelpTooltip } from "@/components/ui/tooltip"

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Hero */}
      <section className="border-b border-[--border]">
        <div className="max-w-4xl mx-auto px-6 py-20 lg:py-28">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-6 font-bold">
            College Radio Partnership
          </p>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-[-0.02em] mb-6 leading-tight">
            Your station breaks artists.<br />
            Now you can prove it.
          </h1>
          <p className="text-lg lg:text-xl text-[--muted] max-w-2xl mb-8">
            Every DJ at every station has said "I played them before anyone." 
            WaxFeed gives you timestamped, verified proof—and ranks your station 
            against every other station in the country.
          </p>
          <div className="flex flex-wrap gap-4">
            <a 
              href="#apply"
              className="px-8 py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition inline-block"
            >
              Apply for Founding Status
            </a>
            <a 
              href="#how-it-works"
              className="px-8 py-4 border border-[--border] text-[11px] tracking-[0.15em] uppercase hover:border-white transition inline-block"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* The Pitch */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            The Problem
          </p>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">
                College radio has the best taste in the country.
                Nobody knows it.
              </h2>
              <p className="text-[--muted] mb-6">
                Your DJs discover artists months before Spotify playlists catch up. 
                You put albums in rotation that later go gold. But there's no record. 
                No proof. No credit.
              </p>
              <p className="text-[--muted]">
                Meanwhile, algorithms get credit for "discovery" that college radio 
                actually made happen.
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-6 border border-[--border]">
                <p className="text-sm text-[--muted] mb-2">DJ reviews an album in October</p>
                <p className="font-medium">→ No record</p>
              </div>
              <div className="p-6 border border-[--border]">
                <p className="text-sm text-[--muted] mb-2">Album blows up in February</p>
                <p className="font-medium">→ Spotify playlist gets credit</p>
              </div>
              <div className="p-6 border border-[#ffd700]/30">
                <p className="text-sm text-[#ffd700] mb-2">With WaxFeed</p>
                <p className="font-medium text-[#ffd700]">→ Timestamped proof. Gold Spin badge. Station ranking.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            How It Works
          </p>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="p-6 border border-[--border]">
              <div className="w-10 h-10 border border-white flex items-center justify-center mb-4">
                <span className="text-lg font-bold">1</span>
              </div>
              <p className="text-lg font-bold mb-2">DJs review albums</p>
              <p className="text-sm text-[--muted]">
                When your DJs review an album on WaxFeed, their position is recorded. 
                "You were reviewer #7 of this album."
              </p>
            </div>
            <div className="p-6 border border-[--border]">
              <div className="w-10 h-10 border border-white flex items-center justify-center mb-4">
                <span className="text-lg font-bold">2</span>
              </div>
              <p className="text-lg font-bold mb-2">Albums trend</p>
              <p className="text-sm text-[--muted]">
                When an album hits 100+ reviews, enters Billboard, or gains momentum—
                everyone who called it early gets credit.
              </p>
            </div>
            <div className="p-6 border border-[#ffd700]/30">
              <div className="w-10 h-10 border border-[#ffd700] flex items-center justify-center mb-4 text-[#ffd700]">
                <span className="text-lg font-bold">3</span>
              </div>
              <p className="text-lg font-bold mb-2">Station earns badges</p>
              <p className="text-sm text-[--muted]">
                Gold Spin (first 10 reviewers), Silver Spin (first 50), Bronze Spin (first 100). 
                These roll up to your station's Tastemaker Score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Station Leaderboard Preview */}
      <section className="border-b border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-8">
            Station Leaderboards
          </p>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Which station has the best taste?
              </h2>
              <p className="text-[--muted] mb-6">
                For the first time, there's an objective answer. Station Tastemaker Scores 
                aggregate all DJs' badges. Conference rankings let you compete against 
                natural rivals.
              </p>
              <p className="text-sm text-[--muted]">
                Imagine being able to say: "WRVU is the #1 taste station in the SEC, 
                with 47 Gold Spins this semester."
              </p>
            </div>
            <div className="border border-[--border] p-6">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[--muted] mb-4">
                Preview: Big Ten Tastemaker Rankings
              </p>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "WJPZ", school: "Syracuse", score: 847, gold: 12 },
                  { rank: 2, name: "WMUC", school: "Maryland", score: 712, gold: 9 },
                  { rank: 3, name: "WRVU", school: "Vanderbilt", score: 698, gold: 8 },
                  { rank: 4, name: "WPTS", school: "Pittsburgh", score: 521, gold: 6 },
                  { rank: 5, name: "Your Station?", school: "", score: "—", gold: "?" },
                ].map((station, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between py-3 ${
                      i < 4 ? 'border-b border-[--border]' : ''
                    } ${station.rank === 5 ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-6 text-center font-bold ${
                        station.rank === 1 ? 'text-[#ffd700]' : ''
                      }`}>
                        {station.rank}
                      </span>
                      <div>
                        <p className="font-medium">{station.name}</p>
                        <p className="text-xs text-[--muted]">{station.school}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#ffd700]">G:{station.gold}</span>
                      <span className="font-bold tabular-nums">{station.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Offer */}
      <section className="border-b border-[--border] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffd700] mb-6 font-bold">
            Founding Station Program
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            50 stations. Founding status. Forever.
          </h2>
          <p className="text-lg text-[--muted] mb-8 max-w-2xl mx-auto">
            The first 50 college radio stations to join get Founding Station status—
            which means all premium features, forever, at no cost.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            <div className="p-6 border border-[--border] text-left">
              <p className="text-sm font-bold mb-3">What you get</p>
              <ul className="space-y-2 text-sm text-[--muted]">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Station dashboard with all DJ stats
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Conference leaderboard position
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Verified DJ badges for all members
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Trending Radar for all DJs
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  API access for your station website
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  "Founding Station" badge forever
                </li>
              </ul>
            </div>
            <div className="p-6 border border-[--border] text-left">
              <p className="text-sm font-bold mb-3">What we ask</p>
              <ul className="space-y-2 text-sm text-[--muted]">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center">1</span>
                  At least 5 DJs reviewing weekly
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center">2</span>
                  Link to WaxFeed in your "on rotation" or website
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-[--border]">
                <p className="text-xs text-[--muted]">
                  That's it. No credit card. No trial that expires. 
                  Founding status is permanent.
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-4 px-6 py-3 border border-[--border]">
            <span className="text-3xl font-bold text-[#ffd700]">{stats.foundingSpotsRemaining}</span>
            <span className="text-sm text-[--muted]">of {FOUNDING_STATION_LIMIT} spots remaining</span>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="border-b border-[--border]">
        <div className="max-w-xl mx-auto px-6 py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6 text-center">
            Apply Now
          </p>
          <h2 className="text-2xl font-bold mb-8 text-center">
            Get your station on the leaderboard
          </h2>
          
          <StationApplicationForm />

          <p className="text-xs text-[--muted] text-center mt-6">
            Questions? Email us at <a href="mailto:stations@waxfeed.com" className="underline">stations@waxfeed.com</a>
          </p>
        </div>
      </section>

      {/* Social Proof / Vision */}
      <section>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
            The Vision
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-6">
            College radio is where taste is made.<br />
            WaxFeed is where taste is proven.
          </h2>
          <p className="text-[--muted] max-w-2xl mx-auto mb-8">
            When your DJ says "I was playing them before anyone," they'll have the badge to prove it. 
            When labels ask who's breaking artists, your station's Tastemaker Score will answer.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div>
              <p className="text-4xl font-bold mb-1">{stats.totalDJs || 0}</p>
              <p className="text-xs text-[--muted]">DJs already active</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">{stats.foundingStations || 0}</p>
              <p className="text-xs text-[--muted]">Stations joined</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#ffd700] mb-1">{stats.foundingSpotsRemaining}</p>
              <p className="text-xs text-[--muted]">Founding spots left</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[--border]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[--muted]">
            Questions? <a href="mailto:stations@waxfeed.com" className="underline">stations@waxfeed.com</a>
          </p>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
            >
              WaxFeed Home
            </Link>
            <Link
              href="/leaderboard"
              className="text-[11px] tracking-[0.15em] uppercase text-[--muted] hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
