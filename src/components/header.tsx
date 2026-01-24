"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { DefaultAvatar } from "./default-avatar"
import { WaxfeedLogo } from "./waxfeed-logo"
import { useTheme } from "./theme-provider"
import { Tooltip } from "./ui/tooltip"

type WaxStats = {
  balance: number
  tastemakeScore: number
  goldSpinCount: number
  silverSpinCount: number
  bronzeSpinCount: number
  tier: string
}

export function Header() {
  const { data: session, status } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [waxStats, setWaxStats] = useState<WaxStats | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch Wax stats
  useEffect(() => {
    const fetchWax = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/wax/balance")
        const data = await res.json()
        if (data.success) {
          setWaxStats({
            balance: data.data.balance || 0,
            tastemakeScore: data.data.tastemakeScore || 0,
            goldSpinCount: data.data.goldSpinCount || 0,
            silverSpinCount: data.data.silverSpinCount || 0,
            bronzeSpinCount: data.data.bronzeSpinCount || 0,
            tier: data.data.tier || 'FREE',
          })
        }
      } catch (error) {
        console.error("Failed to fetch wax:", error)
      }
    }
    fetchWax()
  }, [session])

  // Fetch unread messages
  useEffect(() => {
    const fetchUnread = async () => {
      if (!session?.user) return
      try {
        const res = await fetch("/api/messages/unread")
        const data = await res.json()
        if (data.success) {
          setUnreadMessages(data.data.unreadCount || 0)
        }
      } catch (error) {
        console.error("Failed to fetch unread:", error)
      }
    }
    fetchUnread()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [session])

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
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200" style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 lg:h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <WaxfeedLogo size="md" />
          <span className="font-bold text-lg lg:text-xl tracking-tight">WAXFEED</span>
        </Link>

        {/* Desktop Search - only show on large screens */}
        <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search albums, users, lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--header-bg)',
              color: 'var(--header-text)',
              border: '1px solid var(--header-border)'
            }}
          />
        </form>

        {/* Desktop Navigation - only show on large screens */}
        <nav className="hidden lg:flex items-center gap-5 text-[11px] tracking-[0.1em]">
          {/* Primary CTA - Review */}
          <Link 
            href="/discover" 
            className="px-3 py-1.5 no-underline transition-colors"
            style={{ backgroundColor: 'var(--header-text)', color: 'var(--header-bg)' }}
          >
            REVIEW
          </Link>
          <Link href="/trending" className="no-underline hover:opacity-60 transition-opacity">
            TRENDING
          </Link>
          <Link href="/radar" className="no-underline hover:opacity-60 transition-opacity flex items-center gap-1">
            <svg className="w-3 h-3 text-[#ffd700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            RADAR
          </Link>
          <Link href="/leaderboard" className="no-underline hover:opacity-60 transition-opacity">
            RANKS
          </Link>
          <Link href="/lists" className="no-underline hover:opacity-60 transition-opacity">
            LISTS
          </Link>

          {/* Messages - Social Hub */}
          {session && (
            <Tooltip content="Messages, Album Rooms, and Taste Circles">
              <Link
                href="/messages"
                className="relative no-underline hover:opacity-60 transition-opacity flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-[#ffd700] text-black text-[9px] font-bold flex items-center justify-center rounded-full px-0.5">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            </Tooltip>
          )}

          {/* Wax Balance - Links to Shop */}
          {session && waxStats && (
            <Tooltip content="Your Wax balance. Use Wax to tip great reviews and support tastemakers.">
              <Link
                href="/shop"
                className="flex items-center gap-1.5 px-2 py-1.5 no-underline hover:opacity-70 transition-opacity text-[#ffd700]"
              >
                <span className="text-[10px] tracking-[0.1em] uppercase opacity-80">Wax</span>
                <span className="font-bold tabular-nums">{waxStats.balance.toLocaleString()}</span>
              </Link>
            </Tooltip>
          )}

          {/* Tastemaker Score - Links to Wallet */}
          {session && waxStats && (
            <Tooltip content="Your discovery score. Earn badges by reviewing albums before they trend: Gold (top 10), Silver (top 50), Bronze (top 100).">
              <Link
                href="/wallet"
                className="flex items-center gap-3 px-3 py-1.5 no-underline hover:opacity-70 transition-opacity"
                style={{ border: '1px solid var(--header-border)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] tracking-[0.1em] uppercase opacity-60">Score</span>
                  <span className="font-bold tabular-nums">{waxStats.tastemakeScore}</span>
                </div>
                {(waxStats.goldSpinCount > 0 || waxStats.silverSpinCount > 0 || waxStats.bronzeSpinCount > 0) && (
                  <div className="flex items-center gap-1 text-[10px]">
                    {waxStats.goldSpinCount > 0 && <span className="text-[#ffd700]">G:{waxStats.goldSpinCount}</span>}
                    {waxStats.silverSpinCount > 0 && <span className="text-gray-400">S:{waxStats.silverSpinCount}</span>}
                    {waxStats.bronzeSpinCount > 0 && <span className="text-amber-700">B:{waxStats.bronzeSpinCount}</span>}
                  </div>
                )}
              </Link>
            </Tooltip>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:opacity-70 transition-opacity"
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {status === "loading" ? (
            <span style={{ opacity: 0.5 }}>...</span>
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
                    className="w-8 h-8 object-cover"
                    style={{ border: '1px solid var(--header-border)' }}
                  />
                ) : (
                  <DefaultAvatar size="sm" />
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 min-w-48 py-2 shadow-lg" style={{ backgroundColor: 'var(--header-bg)', border: '1px solid var(--header-border)' }}>
                  <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--header-border)' }}>
                    <p className="font-bold">{session.user?.username || session.user?.name}</p>
                    <p className="text-xs" style={{ opacity: 0.6 }}>{session.user?.email}</p>
                  </div>

                  <Link
                    href={`/u/${session.user?.username || session.user?.id}`}
                    className="block px-4 py-2 no-underline hover:opacity-70"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/wallet"
                    className="block px-4 py-2 no-underline hover:opacity-70"
                    onClick={() => setShowDropdown(false)}
                  >
                    Wallet & Badges
                  </Link>
                  <Link
                    href="/friends"
                    className="block px-4 py-2 no-underline hover:opacity-70"
                    onClick={() => setShowDropdown(false)}
                  >
                    Friends
                  </Link>
                  
                  {/* Social Messaging Section */}
                  <div style={{ borderTop: '1px solid var(--header-border)', marginTop: '8px', paddingTop: '8px' }}>
                    <p className="px-4 py-1 text-[10px] uppercase tracking-wider" style={{ opacity: 0.5 }}>Social</p>
                    <Link
                      href="/messages"
                      className="flex items-center justify-between px-4 py-2 no-underline hover:opacity-70"
                      onClick={() => setShowDropdown(false)}
                    >
                      <span>Messages</span>
                      {unreadMessages > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#ffd700] text-black text-[10px] font-bold">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/rooms"
                      className="block px-4 py-2 no-underline hover:opacity-70"
                      onClick={() => setShowDropdown(false)}
                    >
                      Album Rooms
                    </Link>
                    <Link
                      href="/circles"
                      className="block px-4 py-2 no-underline hover:opacity-70"
                      onClick={() => setShowDropdown(false)}
                    >
                      Taste Circles
                    </Link>
                  </div>
                  
                  <Link
                    href="/notifications"
                    className="block px-4 py-2 no-underline hover:opacity-70"
                    onClick={() => setShowDropdown(false)}
                    style={{ borderTop: '1px solid var(--header-border)', marginTop: '8px' }}
                  >
                    Notifications
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 no-underline hover:opacity-70"
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  
                  {/* Upgrade CTA for free users - the subtle offer */}
                  {waxStats && waxStats.tier === 'FREE' && (
                    <Link
                      href="/pricing"
                      className="block px-4 py-2 no-underline text-[#ffd700] hover:opacity-70"
                      onClick={() => setShowDropdown(false)}
                      style={{ borderTop: '1px solid var(--header-border)' }}
                    >
                      ⚡ Upgrade to Wax+
                    </Link>
                  )}
                  
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 hover:opacity-70"
                    style={{ borderTop: '1px solid var(--header-border)' }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-[11px] tracking-[0.1em] font-medium no-underline transition-colors inline-block"
              style={{ backgroundColor: 'var(--header-text)', color: 'var(--header-bg)' }}
            >
              SIGN IN
            </Link>
          )}
        </nav>

        {/* Mobile/Tablet: Wax + Score + Search + Menu */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Wax Balance - Mobile - Links to Shop */}
          {session && waxStats && (
            <Link
              href="/shop"
              className="flex items-center gap-1 px-2 py-1 no-underline text-[#ffd700]"
            >
              <span className="text-[9px] uppercase opacity-80">Wax</span>
              <span className="font-bold tabular-nums text-sm">{waxStats.balance.toLocaleString()}</span>
            </Link>
          )}
          
          {/* Tastemaker Score - Mobile */}
          {session && waxStats && (
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-2 py-1 no-underline"
              style={{ border: '1px solid var(--header-border)' }}
            >
              <span className="text-[9px] uppercase opacity-60">Score</span>
              <span className="font-bold tabular-nums text-sm">{waxStats.tastemakeScore}</span>
            </Link>
          )}

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
        <div className="lg:hidden fixed inset-0 top-14 z-40 overflow-y-auto" style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)' }}>
          {/* Search bar in menu */}
          <form onSubmit={handleSearch} className="p-4" style={{ borderBottom: '1px solid var(--header-border)' }}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search albums, artists, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 text-base focus:outline-none"
                style={{
                  backgroundColor: 'var(--header-bg)',
                  color: 'var(--header-text)',
                  border: '1px solid var(--header-border)'
                }}
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ opacity: 0.6 }}
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
              className="flex items-center justify-between px-4 py-4 text-[13px] tracking-[0.15em] font-medium no-underline hover:opacity-70"
              style={{ borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>HOME</span>
              <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/discover"
              className="flex items-center justify-between px-4 py-4 text-[13px] tracking-[0.15em] font-medium no-underline hover:opacity-70"
              style={{ borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>DISCOVER</span>
              <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/trending"
              className="flex items-center justify-between px-4 py-4 text-[13px] tracking-[0.15em] font-medium no-underline hover:opacity-70"
              style={{ borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>TRENDING</span>
              <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/lists"
              className="flex items-center justify-between px-4 py-4 text-[13px] tracking-[0.15em] font-medium no-underline hover:opacity-70"
              style={{ borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>LISTS</span>
              <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/hot-takes"
              className="flex items-center justify-between px-4 py-4 text-[13px] tracking-[0.15em] font-medium no-underline hover:opacity-70"
              style={{ borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>HOT TAKES</span>
              <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Theme toggle in mobile menu */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-4 py-4 text-[13px] tracking-[0.15em] font-medium hover:opacity-70"
              style={{ borderBottom: '1px solid var(--header-border)' }}
            >
              <span>{theme === "light" ? "DARK MODE" : "LIGHT MODE"}</span>
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* User Section */}
            {status !== "loading" && (
              session ? (
                <div className="mt-4" style={{ borderTop: '1px solid var(--header-border)' }}>
                  {/* First Spin Stats - Mobile */}
                  {waxStats && (
                    <div style={{ borderBottom: '1px solid var(--header-border)' }}>
                      <Link
                        href="/wallet"
                        className="flex items-center justify-between px-4 py-4 no-underline"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div>
                          <span className="text-[10px] tracking-[0.15em] uppercase" style={{ opacity: 0.6 }}>Tastemaker</span>
                          <p className="text-2xl font-bold tabular-nums">{waxStats.tastemakeScore}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {waxStats.goldSpinCount > 0 && (
                            <div className="text-center">
                              <span className="text-[10px] text-[#ffd700]">GOLD</span>
                              <p className="text-lg font-bold text-[#ffd700]">{waxStats.goldSpinCount}</p>
                            </div>
                          )}
                          {waxStats.silverSpinCount > 0 && (
                            <div className="text-center">
                              <span className="text-[10px] text-gray-400">SILVER</span>
                              <p className="text-lg font-bold text-gray-400">{waxStats.silverSpinCount}</p>
                            </div>
                          )}
                          {waxStats.bronzeSpinCount > 0 && (
                            <div className="text-center">
                              <span className="text-[10px] text-amber-700">BRONZE</span>
                              <p className="text-lg font-bold text-amber-700">{waxStats.bronzeSpinCount}</p>
                            </div>
                          )}
                        </div>
                      </Link>
                      <Link
                        href="/wallet"
                        className="flex items-center justify-between px-4 py-3 no-underline"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>Wax Balance</span>
                        <span className="font-bold tabular-nums">{waxStats.balance.toLocaleString()}</span>
                      </Link>
                      <Link
                        href="/shop"
                        className="flex items-center justify-between px-4 py-4 text-base no-underline hover:opacity-70"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>Get Wax</span>
                        <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link
                        href="/pricing"
                        className="flex items-center justify-between px-4 py-4 text-base no-underline hover:opacity-70"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>Upgrade</span>
                        <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}

                  {/* User info header */}
                  <div className="px-4 py-4 flex items-center gap-3" style={{ opacity: 0.9 }}>
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-12 h-12 object-cover"
                        style={{ border: '1px solid var(--header-border)' }}
                      />
                    ) : (
                      <DefaultAvatar size="md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{session.user?.username || session.user?.name}</p>
                      <p className="text-sm truncate" style={{ opacity: 0.6 }}>{session.user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href={`/u/${session.user?.username || session.user?.id}`}
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:opacity-70"
                    style={{ borderBottom: '1px solid var(--header-border)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Your Profile</span>
                    <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/friends"
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:opacity-70"
                    style={{ borderBottom: '1px solid var(--header-border)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Friends</span>
                    <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:opacity-70"
                    style={{ borderBottom: '1px solid var(--header-border)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Notifications</span>
                    <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center justify-between px-4 py-4 text-base no-underline hover:opacity-70"
                    style={{ borderBottom: '1px solid var(--header-border)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Settings</span>
                    <svg className="w-5 h-5" style={{ opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-4 text-base hover:opacity-70 text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="p-4 mt-4 space-y-3" style={{ borderTop: '1px solid var(--header-border)' }}>
                  <Link
                    href="/login"
                    className="block w-full px-4 py-4 text-[12px] tracking-[0.15em] font-medium text-center no-underline transition-colors"
                    style={{ backgroundColor: 'var(--header-text)', color: 'var(--header-bg)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    SIGN IN
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full px-4 py-4 text-[12px] tracking-[0.15em] font-medium text-center no-underline transition-colors"
                    style={{ border: '2px solid var(--header-text)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    CREATE ACCOUNT
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
