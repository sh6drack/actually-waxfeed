"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { DefaultAvatar } from "./default-avatar"
import { WaxfeedLogo } from "./waxfeed-logo"
import { useTheme } from "./theme-provider"

type WaxStats = {
  balance: number
  tastemakeScore: number
  goldSpinCount: number
  silverSpinCount: number
  bronzeSpinCount: number
  tier: string
  hasTasteID?: boolean
  reviewCount?: number
}

export function Header() {
  const { data: session, status } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [waxStats, setWaxStats] = useState<WaxStats | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
            hasTasteID: data.data.hasTasteID || false,
            reviewCount: data.data.reviewCount || 0,
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
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // Check if user needs to build TasteID
  const needsTasteID = isMounted && session && waxStats && !waxStats.hasTasteID && (waxStats.reviewCount || 0) < 20

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
      style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderBottom: '1px solid var(--header-border)' 
      }}
    >
      <div className="w-full px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <WaxfeedLogo size="md" />
          <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--header-text)' }}>WAXFEED</span>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search albums, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm transition-colors focus:outline-none"
            style={{
              backgroundColor: 'var(--header-bg)',
              border: '1px solid var(--header-border)',
              color: 'var(--header-text)',
            }}
          />
        </form>

        {/* Desktop Navigation - Clean & Complete */}
        <nav className="hidden lg:flex items-center gap-4">
          {/* Core Navigation */}
          <Link 
            href="/discover" 
            className="text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--header-text)' }}
          >
            Discover
          </Link>
          <Link 
            href="/trending" 
            className="text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--header-text)' }}
          >
            Trending
          </Link>
          
          {/* KEEP BUILDING - Primary CTA for users building TasteID */}
          {needsTasteID && (
            <Link
              href="/quick-rate"
              className="px-4 py-2 bg-[--accent-primary] text-black text-xs font-bold uppercase tracking-wider hover:bg-[--accent-hover] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Keep Building
            </Link>
          )}
          
          {/* WAX Button - Always visible */}
          <Link
            href={session ? "/wallet" : "/signup"}
            className="px-4 py-1.5 text-xs font-medium transition-colors hover:opacity-70 text-center"
            style={{ border: '1px solid var(--header-border)', color: 'var(--header-text)' }}
          >
            WAX
          </Link>

          {/* College Radio Program */}
          <Link
            href="/stations"
            className="px-4 py-1.5 text-xs font-medium transition-colors hover:opacity-70 text-center"
            style={{ border: '1px solid var(--header-border)', color: 'var(--header-text)' }}
          >
            College Radio Program
          </Link>

          {/* Messages Button */}
          {isMounted && session && (
            <Link
              href="/messages"
              className="relative p-2 transition-colors hover:opacity-70"
              style={{ color: 'var(--header-text)' }}
              title="Messages"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[--accent-primary] text-black text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          )}

          {/* Settings Button */}
          {isMounted && session && (
            <Link
              href="/settings"
              className="p-2 transition-colors hover:opacity-70"
              style={{ color: 'var(--header-text)' }}
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--header-text)' }}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* User Menu */}
          {!isMounted || status === "loading" ? (
            <span style={{ color: 'var(--header-text)', opacity: 0.5 }}>...</span>
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
                    className="w-9 h-9 object-cover"
                    style={{ border: '1px solid var(--header-border)' }}
                  />
                ) : (
                  <DefaultAvatar size="sm" />
                )}
              </button>

              {showDropdown && (
                <div 
                  className="absolute right-0 top-full mt-2 min-w-52 py-2 shadow-xl"
                  style={{ 
                    backgroundColor: 'var(--header-bg)', 
                    border: '1px solid var(--header-border)' 
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--header-border)' }}>
                    <p className="font-bold" style={{ color: 'var(--header-text)' }}>{session.user?.username || session.user?.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--header-text)', opacity: 0.6 }}>{session.user?.email}</p>
                  </div>

                  <Link
                    href={`/u/${session.user?.username || session.user?.id}`}
                    className="block px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                    style={{ color: 'var(--header-text)' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/wallet"
                    className="block px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                    style={{ color: 'var(--header-text)' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    Wallet & Badges
                  </Link>
                  <Link
                    href="/friends"
                    className="block px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                    style={{ color: 'var(--header-text)' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    Friends
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                    style={{ color: 'var(--header-text)' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    <span>Messages</span>
                    {unreadMessages > 0 && (
                      <span className="px-1.5 py-0.5 bg-[--accent-primary] text-black text-[10px] font-bold">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2.5 text-sm transition-colors hover:opacity-70"
                    style={{ color: 'var(--header-text)' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  
                  <div style={{ borderTop: '1px solid var(--header-border)', marginTop: '8px', paddingTop: '8px' }}>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:opacity-70 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-bold transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--header-text)', color: 'var(--header-bg)' }}
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-1">
          {/* Keep Building - Mobile */}
          {needsTasteID && (
            <Link
              href="/quick-rate"
              className="px-2.5 py-2 bg-[--accent-primary] text-black text-[10px] font-bold uppercase tracking-wider min-h-[44px] flex items-center"
            >
              Build
            </Link>
          )}

          {/* WAX Balance - Mobile */}
          {isMounted && session && waxStats && (
            <Link
              href="/wallet"
              className="flex items-center gap-1 px-2 min-h-[44px] min-w-[44px] justify-center text-[--accent-primary]"
            >
              <span className="text-xs font-bold">{waxStats.balance}</span>
            </Link>
          )}

          {/* Messages - Mobile */}
          {isMounted && session && (
            <Link
              href="/messages"
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              style={{ color: 'var(--header-text)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-[--accent-primary] text-black text-[9px] font-bold flex items-center justify-center px-0.5">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          )}

          {/* Search */}
          <Link
            href="/search"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: 'var(--header-text)' }}
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: 'var(--header-text)' }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-16 z-40 overflow-y-auto"
          style={{ backgroundColor: 'var(--header-bg)' }}
        >
          {/* Search */}
          <form onSubmit={handleSearch} className="p-4" style={{ borderBottom: '1px solid var(--header-border)' }}>
            <input
              type="text"
              placeholder="Search albums, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 text-base focus:outline-none"
              style={{
                backgroundColor: 'var(--header-bg)',
                border: '1px solid var(--header-border)',
                color: 'var(--header-text)',
              }}
              autoFocus
            />
          </form>

          {/* Keep Building CTA */}
          {needsTasteID && (
            <div className="p-4" style={{ borderBottom: '1px solid var(--header-border)' }}>
              <Link
                href="/quick-rate"
                className="flex items-center justify-center gap-2 w-full px-4 py-4 text-sm font-bold bg-[--accent-primary] text-black"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Keep Building TasteID ({waxStats?.reviewCount || 0}/20)
              </Link>
            </div>
          )}

          {/* Main Navigation */}
          <nav className="py-2">
            <Link
              href="/"
              className="flex items-center justify-between px-6 py-4 text-base font-medium"
              style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/discover"
              className="flex items-center justify-between px-6 py-4 text-base font-medium"
              style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Discover
              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/trending"
              className="flex items-center justify-between px-6 py-4 text-base font-medium"
              style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Trending
              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/lists"
              className="flex items-center justify-between px-6 py-4 text-base font-medium"
              style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Lists
              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/stations"
              className="flex items-center justify-between px-6 py-4 text-base font-medium"
              style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                College Radio
              </span>
              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-6 py-4 text-base font-medium"
              style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
            >
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </nav>

          {/* User Section */}
          {status !== "loading" && (
            session ? (
              <div style={{ borderTop: '1px solid var(--header-border)', marginTop: '16px', paddingTop: '16px' }}>
                {/* User Info */}
                <div className="px-6 py-4 flex items-center gap-4">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="" 
                      className="w-14 h-14 object-cover"
                      style={{ border: '1px solid var(--header-border)' }}
                    />
                  ) : (
                    <DefaultAvatar size="md" />
                  )}
                  <div>
                    <p className="font-bold" style={{ color: 'var(--header-text)' }}>{session.user?.username || session.user?.name}</p>
                    <p className="text-sm" style={{ color: 'var(--header-text)', opacity: 0.6 }}>{session.user?.email}</p>
                  </div>
                </div>

                {/* WAX Stats */}
                {waxStats && (
                  <div className="mx-6 p-4 mb-4" style={{ backgroundColor: 'var(--header-bg)', border: '1px solid var(--header-border)' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs uppercase" style={{ color: 'var(--header-text)', opacity: 0.6 }}>WAX Balance</p>
                        <p className="text-2xl font-bold text-[--accent-primary]">{waxStats.balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase" style={{ color: 'var(--header-text)', opacity: 0.6 }}>Score</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--header-text)' }}>{waxStats.tastemakeScore}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  href={`/u/${session.user?.username || session.user?.id}`}
                  className="flex items-center justify-between px-6 py-4 text-base"
                  style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                  <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/wallet"
                  className="flex items-center justify-between px-6 py-4 text-base"
                  style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Wallet & Badges
                  <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/friends"
                  className="flex items-center justify-between px-6 py-4 text-base"
                  style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Friends
                  <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center justify-between px-6 py-4 text-base"
                  style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                  {unreadMessages > 0 && (
                    <span className="px-2 py-0.5 bg-[--accent-primary] text-black text-xs font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center justify-between px-6 py-4 text-base"
                  style={{ color: 'var(--header-text)', borderBottom: '1px solid var(--header-border)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                  <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false) }}
                  className="w-full text-left px-6 py-4 text-base text-red-500 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-6 mt-4 space-y-3" style={{ borderTop: '1px solid var(--header-border)' }}>
                <Link
                  href="/login"
                  className="block w-full px-4 py-4 text-sm font-bold text-center"
                  style={{ backgroundColor: 'var(--header-text)', color: 'var(--header-bg)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full px-4 py-4 text-sm font-bold text-center"
                  style={{ border: '2px solid var(--header-text)', color: 'var(--header-text)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </header>
  )
}
