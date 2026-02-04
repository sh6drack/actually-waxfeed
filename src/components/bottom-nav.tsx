"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const DiscoverIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const RateIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Hide on certain pages where it would interfere
  const hiddenPaths = ['/login', '/signup', '/onboarding', '/quick-rate']
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-[env(safe-area-inset-bottom)]">
      {/* Gradient fade effect - taller for more dramatic effect */}
      <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

      {/* Nav bar - Glass morphism */}
      <div className="relative mx-auto max-w-md mb-2">
        <div
          className="flex items-center justify-around h-16 rounded-2xl border border-white/10 backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(20, 20, 20, 0.85)',
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            if (item.highlight) {
              // Rate button - Floating action style
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center
                      transition-all duration-200 active:scale-90
                      ${active
                        ? 'bg-[#ffd700] text-black shadow-lg shadow-[#ffd700]/40'
                        : 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30'
                      }
                    `}
                  >
                    <Icon active={active} />
                  </div>
                  <span className={`text-[10px] mt-1.5 font-semibold tracking-wide ${
                    active ? 'text-[#ffd700]' : 'text-white/50'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center min-w-[72px] py-2
                  transition-all duration-200 active:scale-90
                  ${active ? 'opacity-100' : 'opacity-60'}
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-colors
                  ${active ? 'bg-white/10 text-white' : 'text-white/70'}
                `}>
                  <Icon active={active} />
                </div>
                <span className={`text-[10px] mt-1 font-medium tracking-wide ${
                  active ? 'text-white' : 'text-white/50'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
