"use client"

import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"

interface Album {
  id: string
  spotifyId: string | null
  title: string
  artistName: string
  coverArtUrl: string | null
}

interface AlbumMarqueeProps {
  albums: Album[]
}

export function AlbumMarquee({ albums }: AlbumMarqueeProps) {
  const prefersReducedMotion = useReducedMotion()

  if (!albums.length) return null

  // Double albums for seamless loop
  const displayAlbums = [...albums, ...albums]

  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-b border-[--border]">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[--background] to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[--background] to-transparent z-10 pointer-events-none" />

      <div className="mb-8 px-6 md:px-12 lg:px-20">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[--muted] font-technical">
          Now Trending
        </p>
      </div>

      {/* Marquee row */}
      <motion.div
        className="flex gap-4 md:gap-5"
        animate={prefersReducedMotion ? {} : { x: [0, -(albums.length * 172)] }}
        transition={{
          x: {
            duration: albums.length * 3,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {displayAlbums.map((album, i) => (
          <Link
            key={`${album.id}-${i}`}
            href={`/album/${album.spotifyId}`}
            className="group flex-shrink-0 w-[152px] md:w-[172px]"
          >
            <div className="relative aspect-square overflow-hidden bg-[--surface]">
              {album.coverArtUrl && (
                <img
                  src={album.coverArtUrl}
                  alt={album.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                <div className="p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  <p className="text-xs font-bold text-white truncate">{album.title}</p>
                  <p className="text-[10px] text-white/70 truncate">{album.artistName}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  )
}
