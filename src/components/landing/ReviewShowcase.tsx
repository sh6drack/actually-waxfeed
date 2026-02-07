"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { DefaultAvatar } from "@/components/default-avatar"

interface Review {
  id: string
  rating: number
  text: string | null
  createdAt: Date
  user: { id: string; username: string | null; image: string | null }
  album: { id: string; spotifyId: string | null; title: string; artistName: string; coverArtUrl: string | null }
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      className="glass p-5 md:p-6 group hover:border-white/10 transition-all duration-500"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Album + User */}
      <div className="flex items-start gap-4 mb-4">
        <Link href={`/album/${review.album.spotifyId}`} className="flex-shrink-0">
          <div className="w-14 h-14 bg-[--surface] overflow-hidden group-hover:shadow-lg transition-shadow">
            {review.album.coverArtUrl && (
              <img
                src={review.album.coverArtUrl}
                alt={review.album.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{review.album.title}</p>
          <p className="text-xs text-[--muted] truncate">{review.album.artistName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-[--accent-primary] font-technical">
              {review.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-[--muted]">·</span>
            <div className="flex items-center gap-1.5">
              {review.user.image ? (
                <img src={review.user.image} alt="" className="w-3.5 h-3.5 rounded-full" />
              ) : (
                <DefaultAvatar size="xs" />
              )}
              <span className="text-[10px] text-[--muted]">@{review.user.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review text */}
      {review.text && (
        <p className="text-xs text-[--muted] leading-relaxed line-clamp-3">
          &ldquo;{review.text}&rdquo;
        </p>
      )}
    </motion.div>
  )
}

export function ReviewShowcase({ reviews }: { reviews: Review[] }) {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: "-50px" })

  if (!reviews.length) return null

  return (
    <section className="relative py-20 md:py-28 px-6 md:px-12 lg:px-20 xl:px-32 border-t border-[--border]">
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
          <p className="text-[10px] tracking-[0.4em] uppercase text-[--polarity-coral] font-technical mb-4">
            Community
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">
            Real opinions.
            <br />
            <span className="text-[--muted]">Real people.</span>
          </h2>
        </motion.div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>

        {/* Join CTA */}
        <motion.div
          className="mt-16 md:mt-20 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-sm text-[--muted] mb-6 max-w-md mx-auto">
            Join the conversation. Your taste matters here.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 border border-[--foreground] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[--foreground] hover:text-[--background] transition-all duration-300"
          >
            Create Your Profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
