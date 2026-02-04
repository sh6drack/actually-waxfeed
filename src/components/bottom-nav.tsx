"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const DiscoverIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const RateIcon = ({ active }: { active: boolean }) => (
  <svg className="w-7 h-7" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Hide on certain pages where it would interfere
  const hiddenPaths = ['/login', '/signup', '/onboarding']
  if (hiddenPaths.some(p => pathname?.startsWith(p))) {
    return null
  }

  const navItems = [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/discover", icon: DiscoverIcon, label: "Discover" },
    { href: "/quick-rate", icon: RateIcon, label: "Rate", highlight: true },
    {
      href: session?.user?.username ? `/u/${session.user.username}` : session?.user?.id ? `/u/${session.user.id}` : "/login",
      icon: ProfileIcon,
      label: session ? "Profile" : "Sign In"
    },
  ]

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[--background] to-transparent pointer-events-none" />

      {/* Nav bar */}
      <div
        className="flex items-center justify-around px-2 h-16 border-t"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)'
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          if (item.highlight) {
            // Rate button - centered, prominent
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  ${active
                    ? 'bg-[--accent-primary] text-black'
                    : 'bg-[--accent-primary]/20 text-[--accent-primary]'
                  }
                  transition-all active:scale-95
                `}>
                  <Icon active={active} />
                </div>
                <span className={`text-[10px] mt-1 font-medium ${active ? 'text-[--accent-primary]' : 'text-[--muted]'}`}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-[64px] min-h-[48px] active:scale-95 transition-transform"
            >
              <div className={active ? 'text-[--foreground]' : 'text-[--muted]'}>
                <Icon active={active} />
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-[--foreground]' : 'text-[--muted]'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[--background]" />
    </nav>
  )
}
