"use client"

import { LandingHero } from "./LandingHero"
import { AlbumMarquee } from "./AlbumMarquee"
import { FeatureShowcase } from "./FeatureShowcase"
import { ReviewShowcase } from "./ReviewShowcase"

interface Album {
  id: string
  spotifyId: string | null
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge?: string | null
}

interface Review {
  id: string
  rating: number
  text: string | null
  createdAt: Date
  user: { id: string; username: string | null; image: string | null }
  album: { id: string; spotifyId: string | null; title: string; artistName: string; coverArtUrl: string | null }
}

interface LandingPageProps {
  stats: { albumCount: number; reviewCount: number; userCount: number }
  albums: Album[]
  reviews: Review[]
}

export function LandingPage({ stats, albums, reviews }: LandingPageProps) {
  const albumCovers = albums
    .filter((a) => a.coverArtUrl)
    .map((a) => a.coverArtUrlLarge || a.coverArtUrl!)

  return (
    <div className="-mt-16">
      {/* Hero - full viewport */}
      <LandingHero stats={stats} albumCovers={albumCovers} />

      {/* Album marquee */}
      <AlbumMarquee albums={albums.slice(0, 24)} />

      {/* Feature showcase */}
      <FeatureShowcase />

      {/* Real reviews as social proof */}
      <ReviewShowcase reviews={reviews.slice(0, 8)} />
    </div>
  )
}
