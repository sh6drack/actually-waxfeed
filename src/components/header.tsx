"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import { DefaultAvatar } from "./default-avatar"

const RecordPlayer3D = dynamic(
  () => import("../../logo-versions/record-player-3d").then((mod) => mod.RecordPlayer3D),
  { ssr: false }
)

export function Header() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white text-black border-b border-black">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10">
            <RecordPlayer3D />
          </div>
          <span className="font-bold text-xl tracking-tight no-underline">WAXFEED</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search albums, users, lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black px-4 py-2 text-sm text-black placeholder-gray-500 focus:outline-none focus:border-black"
          />
        </form>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="no-underline hover:underline">
            Home
          </Link>
          <Link href="/trending" className="no-underline hover:underline">
            Trending
          </Link>
          <Link href="/lists" className="no-underline hover:underline">
            Lists
          </Link>

          {status === "loading" ? (
            <span className="text-gray-500">...</span>
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 no-underline"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 border border-black"
                  />
                ) : (
                  <DefaultAvatar size="sm" />
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-black min-w-48 py-2">
                  <div className="px-4 py-2 border-b border-black">
                    <p className="font-bold">{session.user?.username || session.user?.name}</p>
                    <p className="text-xs text-gray-600">{session.user?.email}</p>
                  </div>
                  <Link
                    href={`/u/${session.user?.username || session.user?.id}`}
                    className="block px-4 py-2 no-underline hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/notifications"
                    className="block px-4 py-2 no-underline hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Notifications
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 no-underline hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-t border-black mt-2"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-gray-100"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
