export function CuratedGrid() {
  const items = [
    {
      id: 1,
      title: "Midnight Sessions",
      artist: "Various Artists",
      image: "/dark-blue-vinyl-album-art-minimal.jpg",
      tracks: 24,
    },
    {
      id: 2,
      title: "Neon Dreams",
      artist: "Synth Collective",
      image: "/neon-pink-synthwave-album-cover.jpg",
      tracks: 18,
    },
    {
      id: 3,
      title: "Analog Warmth",
      artist: "Lo-Fi Archive",
      image: "/warm-orange-vintage-lo-fi-aesthetic.jpg",
      tracks: 32,
    },
    {
      id: 4,
      title: "Digital Void",
      artist: "Experimental",
      image: "/abstract-black-white-geometric-pattern.jpg",
      tracks: 15,
    },
    {
      id: 5,
      title: "Ethereal Echoes",
      artist: "Ambient Depths",
      image: "/soft-pastel-purple-ambient-music-art.jpg",
      tracks: 28,
    },
    {
      id: 6,
      title: "Raw Frequencies",
      artist: "Experimental Noise",
      image: "/glitch-art-red-black-electronic.jpg",
      tracks: 12,
    },
  ]

  return (
    <section className="px-16 py-24 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <h2 className="text-5xl font-light text-white mb-6 tracking-tight">Collections</h2>
          <p className="text-neutral-500 text-xs tracking-widest font-light uppercase">Hand-curated discoveries</p>
        </div>

        <div className="grid grid-cols-3 gap-16">
          {items.map((item) => (
            <article key={item.id} className="group cursor-pointer">
              <div className="mb-8 overflow-hidden aspect-square bg-neutral-900">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:opacity-70 transition-opacity duration-300"
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-light text-white group-hover:opacity-60 transition-opacity">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 tracking-wide font-light">{item.artist}</p>
                <p className="text-xs text-neutral-600 pt-2 font-light">{item.tracks} tracks</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
