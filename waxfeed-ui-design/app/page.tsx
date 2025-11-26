import { Header } from "@/components/header"
import { FeaturedTrack } from "@/components/featured-track"
import { CuratedGrid } from "@/components/curated-grid"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-24">
        <FeaturedTrack />
        <CuratedGrid />
      </main>
    </div>
  )
}
