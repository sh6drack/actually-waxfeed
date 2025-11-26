import { RecordPlayer3D } from "./record-player-3d"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black border-opacity-10">
      <div className="flex items-center justify-between px-16 py-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16">
            <RecordPlayer3D />
          </div>
          <span className="text-black font-light text-sm tracking-tight">waxfeed</span>
        </div>

        <nav className="flex items-center gap-20 text-black text-xs font-normal tracking-wide">
          <a href="#" className="hover:opacity-60 transition-opacity duration-200">
            collections
          </a>
          <a href="#" className="hover:opacity-60 transition-opacity duration-200">
            friends
          </a>
        </nav>

        <div className="flex items-center gap-8">
          <button className="text-black hover:opacity-60 transition-opacity duration-200" aria-label="Search">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          <button className="text-black hover:opacity-60 transition-opacity duration-200" aria-label="Add">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-black text-xs font-light">username</span>
            <div className="w-8 h-8 bg-neutral-300"></div>
          </div>
        </div>
      </div>
    </header>
  )
}
