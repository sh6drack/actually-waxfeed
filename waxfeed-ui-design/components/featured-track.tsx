export function FeaturedTrack() {
  return (
    <section className="pt-32 pb-24 px-16 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-32 items-center">
          <div className="aspect-square bg-neutral-900 overflow-hidden">
            <img src="/vinyl-record-purple-aesthetic.jpg" alt="Featured album" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-16">
            <div className="space-y-8">
              <p className="text-neutral-500 text-xs tracking-widest font-light uppercase">Featured</p>
              <h1 className="text-7xl font-light leading-tight text-white tracking-tight">
                Echoes in
                <br />
                Digital Space
              </h1>
            </div>

            <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl font-light">
              Curated collection of emerging electronic and ambient artists pushing the boundaries of sonic exploration.
              Hand-selected for their innovative approach to production and arrangement.
            </p>

            <div className="flex gap-12 pt-8">
              <button className="px-10 py-3 border border-white text-white hover:bg-white hover:text-black transition-all duration-200 text-xs font-normal tracking-widest uppercase">
                Explore
              </button>
              <button className="text-neutral-400 hover:text-white transition-colors text-xs font-normal tracking-widest uppercase">
                Add to Library
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
