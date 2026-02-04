"use client"

import Link from "next/link"
import { useState } from "react"

interface FAQItem {
  question: string
  answer: string | React.ReactNode
  category: "badges" | "ratings" | "tasteid" | "wax" | "general"
}

const FAQ_ITEMS: FAQItem[] = [
  // Badges
  {
    category: "badges",
    question: "What are First Spin badges?",
    answer: "First Spin badges reward you for discovering albums early. When you write a review for an album before it trends (reaches 100 reviews), you're eligible for Gold, Silver, or Bronze badges based on when you reviewed it."
  },
  {
    category: "badges",
    question: "How do I earn a Gold Spin badge?",
    answer: "Be one of the first 10 people to write a review (with text) for an album. If that album later trends, you earn a Gold Spin badge and +100 Wax."
  },
  {
    category: "badges",
    question: "What's the difference between Gold, Silver, and Bronze?",
    answer: (
      <div className="space-y-2">
        <p><span className="text-[var(--accent-primary)] font-bold">Gold Spin</span> — First 10 reviewers (+100 Wax, +10 Tastemaker Score)</p>
        <p><span className="text-gray-400 font-bold">Silver Spin</span> — Reviews 11-50 (+50 Wax, +5 Tastemaker Score)</p>
        <p><span className="text-amber-700 font-bold">Bronze Spin</span> — Reviews 51-100 (+25 Wax, +2 Tastemaker Score)</p>
      </div>
    )
  },
  {
    category: "badges",
    question: "Do quick rates count toward badges?",
    answer: (
      <div className="space-y-2">
        <p className="font-bold text-[var(--accent-primary)]">No. Only written reviews count toward First Spin badges.</p>
        <p>A review must have at least 20 characters of text to qualify for badge eligibility. Quick rates (just a number rating) help train your TasteID but don&apos;t count toward the first 100 reviewers.</p>
        <p className="text-[--muted]">This ensures badges go to people who actually engaged with the music and shared their thoughts.</p>
      </div>
    )
  },
  {
    category: "badges",
    question: "When do badges get awarded?",
    answer: "Badges are awarded when an album reaches 100 written reviews (\"trends\"). If you wrote one of the first 100 reviews, you'll receive your badge automatically. You can see pending badges on album pages."
  },

  // Ratings
  {
    category: "ratings",
    question: "What's the difference between a review and a quick rate?",
    answer: (
      <div className="space-y-2">
        <p><span className="font-bold">Quick Rate</span> — Just a rating (and optional vibes). Fast way to log albums and train your TasteID.</p>
        <p><span className="font-bold">Review</span> — Rating plus written text. Counts toward badges and appears in feeds.</p>
        <p className="text-[--muted]">Both contribute to your TasteID, but only reviews count for First Spin badges.</p>
      </div>
    )
  },
  {
    category: "ratings",
    question: "Can I change my rating later?",
    answer: "Yes! Your most recent rating is what counts. If your opinion changes, just rate it again. Your badge eligibility is locked to your first review date, so updating won't affect badge position."
  },
  {
    category: "ratings",
    question: "What are vibes?",
    answer: "Vibes are descriptors that capture the feeling of an album—like \"energetic,\" \"nostalgic,\" or \"experimental.\" They help our TasteID system understand your preferences beyond just genres."
  },

  // TasteID
  {
    category: "tasteid",
    question: "What is TasteID?",
    answer: "TasteID is your musical fingerprint. It analyzes your ratings, vibes, and listening patterns to understand your unique taste and connect you with like-minded listeners."
  },
  {
    category: "tasteid",
    question: "How do I unlock TasteID?",
    answer: "Rate at least 20 albums to unlock your TasteID. The more you rate, the more accurate it becomes. At 100+ ratings, you'll see detailed taste archetypes and genre breakdowns."
  },
  {
    category: "tasteid",
    question: "What are TasteID tiers?",
    answer: (
      <div className="space-y-1">
        <p><span className="font-bold">Listener</span> (0-19 ratings) — Getting started</p>
        <p><span className="font-bold">Enthusiast</span> (20-49) — TasteID unlocked</p>
        <p><span className="font-bold">Connoisseur</span> (50-99) — Refined predictions</p>
        <p><span className="font-bold">Sommelier</span> (100-199) — Expert-level matching</p>
        <p><span className="font-bold">Curator</span> (200-499) — Taste authority</p>
        <p><span className="font-bold">Oracle</span> (500+) — Maximum precision</p>
      </div>
    )
  },

  // Wax
  {
    category: "wax",
    question: "What is Wax?",
    answer: "Wax is WaxFeed's currency. Earn it by reviewing albums, earning badges, and engaging with the community. Spend it in the shop on exclusive items."
  },
  {
    category: "wax",
    question: "How do I earn Wax?",
    answer: (
      <div className="space-y-1">
        <p>• <span className="font-bold">Write reviews</span> — +5 Wax per review</p>
        <p>• <span className="font-bold">Gold Spin badge</span> — +100 Wax</p>
        <p>• <span className="font-bold">Silver Spin badge</span> — +50 Wax</p>
        <p>• <span className="font-bold">Bronze Spin badge</span> — +25 Wax</p>
        <p>• <span className="font-bold">Daily activity</span> — Various bonuses</p>
      </div>
    )
  },
  {
    category: "wax",
    question: "What's Tastemaker Score?",
    answer: "Your Tastemaker Score measures your discovery reputation. Earn points by finding albums before they trend. Higher scores unlock exclusive features and recognition on leaderboards."
  },

  // General
  {
    category: "general",
    question: "Why can't I find an album?",
    answer: "We import albums from Spotify's catalog. If an album is missing, try searching with the exact title and artist name. Some very new releases may take a day to appear."
  },
  {
    category: "general",
    question: "What about singles?",
    answer: "WaxFeed focuses on albums and EPs. Singles are not available on the platform—we believe in the album as an art form."
  },
  {
    category: "general",
    question: "How do I connect with other users?",
    answer: "Use the Connect page to find users with similar taste. You can follow users, message them, and see their reviews in your feed. TasteID compatibility scores help you find your musical soulmates."
  },
]

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "badges", label: "Badges" },
  { id: "ratings", label: "Ratings" },
  { id: "tasteid", label: "TasteID" },
  { id: "wax", label: "Wax" },
  { id: "general", label: "General" },
]

export default function FAQPage() {
  const [category, setCategory] = useState<string>("all")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFAQ = category === "all"
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter(item => item.category === category)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-[10px] tracking-[0.2em] uppercase text-[--muted] hover:text-white transition mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-2">FAQ</h1>
          <p className="text-[--muted]">Everything you need to know about WaxFeed</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                category === cat.id
                  ? 'bg-white text-black'
                  : 'border border-[--border] text-[--muted] hover:border-white hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Important Notice */}
        <div className="mb-8 p-4 border-2 border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--accent-primary)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-[var(--accent-primary)] mb-1">Important: Badge Eligibility</p>
              <p className="text-sm text-[--muted]">
                Only reviews with written text (20+ characters) count toward First Spin badges.
                Quick rates help train your TasteID but don&apos;t qualify for Gold, Silver, or Bronze badges.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-2">
          {filteredFAQ.map((item, index) => (
            <div key={index} className="border border-[--border]">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-3 text-left flex items-center justify-between gap-4 hover:bg-[--surface] transition"
              >
                <span className="font-medium">{item.question}</span>
                <svg
                  className={`w-4 h-4 text-[--muted] transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-sm text-[--muted] border-t border-[--border] pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-[--border] text-center">
          <p className="text-[--muted] text-sm mb-2">Still have questions?</p>
          <a
            href="mailto:shadrack@brown.edu"
            className="text-[var(--accent-primary)] hover:underline text-sm"
          >
            Contact us
          </a>
        </div>
      </div>
    </div>
  )
}
