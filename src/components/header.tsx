"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { DefaultAvatar } from "./default-avatar"
import { RGBDotsLogo } from "./rgb-dots-logo"

export function Header() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
      setMobileMenuOpen(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white text-black border-b border-black">
      <div className="max-w-7xl mx-auto px-4 h-14 lg:h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <RGBDotsLogo className="h-6 lg:h-8" />
          <span className="font-bold text-lg lg:text-xl tracking-tight">WAXFEED</span>
        </Link>

        {/* Desktop Search - only show on large screens */}
        <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search albums, users, lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black px-4 py-2 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
          />
        </form>

        {/* Desktop Navigation - only show on large screens */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <Link href="/" className="no-underline hover:underline">
            Home
          </Link>
          <Link href="/discover" className="no-underline hover:underline">
            Discover
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
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 border border-black object-cover"
                  />
                ) : (
                  <DefaultAvatar size="sm" />
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-black min-w-48 py-2 shadow-lg">
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
            <Link
              href="/login"
              className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 no-underline transition-colors inline-block"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile/Tablet: Search icon + Menu button */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Search icon - links to search page */}
          <Link
            href="/search"
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-white z-40 overflow-y-auto">
          {/* Search bar in menu */}
          <form onSubmit={handleSearch} className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search albums, artists, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 px-4 py-3 text-base text-black placeholder-gray-500 focus:outline-none focus:border-black focus:bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Nav Links */}
          <nav>
            <Link
              href="/"
              className="flex items-center justify-between px-4 py-4 text-lg font-medium no-underline hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Home</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/discover"
              className="flex items-center justify-between px-4 py-4 text-lg font-medium no-underline hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Discover</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/trending"
              className="flex items-center justify-between px-4 py-4 text-lg font-medium no-underline hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Trending</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/lists"
              className="flex items-center justify-between px-4 py-4 text-lg font-medium no-underline hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Lists</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* User Section */}
            {status !== "loading" && (
              session ? (
                <div className="mt-4 border-t border-gray-200">
                  {/* User info header */}
                  <div className="px-4 py-4 flex items-center gap-3 bg-gray-50">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-12 h-12 border border-gray-300 object-cover"
                      />
                    ) : (
                      <DefaultAvatar size="md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{session.user?.username || session.user?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href={`/u/${session.user?.username || session.user?.id}`}
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Your Profile</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Notifications</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Settings</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-4 text-base hover:bg-gray-50 text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="p-4 mt-4 space-y-3 border-t border-gray-200">
                  <Link
                    href="/login"
                    className="block w-full bg-black text-white px-4 py-4 text-base font-bold text-center no-underline hover:bg-gray-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full border-2 border-black text-black px-4 py-4 text-base font-bold text-center no-underline hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
