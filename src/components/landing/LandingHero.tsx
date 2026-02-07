"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"

interface LandingHeroProps {
  stats: { albumCount: number; reviewCount: number; userCount: number }
  albumCovers: string[]
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export function LandingHero({ stats, albumCovers }: LandingHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div ref={containerRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Gradient mesh background */}
      <motion.div
        className="absolute inset-0 gradient-mesh"
        style={{ y: bgY }}
      />

      {/* Floating album covers - ambient backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {albumCovers.slice(0, 12).map((cover, i) => {
          const positions = [
            { left: "5%", top: "10%", delay: 0, size: 100, rotate: -8 },
            { left: "80%", top: "5%", delay: 0.5, size: 120, rotate: 5 },
            { left: "15%", top: "65%", delay: 1, size: 90, rotate: -12 },
            { left: "70%", top: "60%", delay: 0.3, size: 110, rotate: 8 },
            { left: "40%", top: "15%", delay: 0.7, size: 80, rotate: -5 },
            { left: "90%", top: "40%", delay: 1.2, size: 95, rotate: 10 },
            { left: "2%", top: "40%", delay: 0.8, size: 85, rotate: -15 },
            { left: "55%", top: "70%", delay: 0.4, size: 100, rotate: 3 },
            { left: "30%", top: "80%", delay: 1.1, size: 75, rotate: -7 },
            { left: "85%", top: "75%", delay: 0.6, size: 70, rotate: 12 },
            { left: "48%", top: "45%", delay: 0.9, size: 65, rotate: -3 },
            { left: "22%", top: "30%", delay: 1.3, size: 70, rotate: 6 },
          ]
          const pos = positions[i] || positions[0]
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.size,
                height: pos.size,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.04, 0.08, 0.04],
                scale: [0.95, 1.05, 0.95],
                rotate: [pos.rotate, pos.rotate + 3, pos.rotate],
              }}
              transition={{
                duration: 8 + i * 0.5,
                repeat: Infinity,
                delay: pos.delay,
                ease: "easeInOut",
              }}
            >
              <img
                src={cover}
                alt=""
                className="w-full h-full object-cover rounded-sm"
                style={{ filter: "blur(1px)" }}
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          )
        })}
      </div>

      {/* Grain overlay */}
      <div className="grain absolute inset-0 pointer-events-none" />

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full px-6 md:px-12 lg:px-20 xl:px-32 py-24 md:py-32"
        style={{ opacity }}
      >
        <div className="max-w-5xl">
          {/* Tagline */}
          <motion.p
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-[--polarity-teal] font-technical mb-6 md:mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Music Taste Intelligence
          </motion.p>

          {/* Main headline - staggered reveal */}
          <div className="mb-8 md:mb-10">
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                &ldquo;I listen to
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                everything.&rdquo;
              </motion.span>
              <motion.span
                className="block text-[--muted] mt-2"
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                Do you though?
              </motion.span>
            </motion.h1>
          </div>

          {/* Description */}
          <motion.p
            className="text-base md:text-lg lg:text-xl text-[--muted] max-w-2xl leading-relaxed mb-10 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            Everyone says it. Nobody means it. WAXFEED{" "}
            <span className="text-[--foreground] font-medium">reflects your taste back to you</span>
            —what you actually love, why you love it, and what that says about you.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-wrap gap-3 md:gap-4 mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.9 }}
          >
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-[--accent-primary] text-[--background] text-xs font-bold uppercase tracking-[0.2em] hover:bg-[--accent-hover] hover:scale-[1.02] transition-all"
            >
              <span className="relative z-10">Get Started Free</span>
            </Link>
            <Link
              href="/discover"
              className="px-8 py-4 border border-[--border] text-xs font-bold uppercase tracking-[0.2em] text-[--muted] hover:border-[--foreground] hover:text-[--foreground] transition-all glass"
            >
              Explore First
            </Link>
          </motion.div>

          {/* Animated stats */}
          <motion.div
            className="flex gap-8 md:gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.2 }}
          >
            <div>
              <p className="text-2xl md:text-3xl font-display font-bold">
                <AnimatedCounter value={stats.albumCount} />
              </p>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mt-1">Albums</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-display font-bold">
                <AnimatedCounter value={stats.reviewCount} />
              </p>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mt-1">Ratings</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-display font-bold">
                <AnimatedCounter value={stats.userCount} suffix="+" />
              </p>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mt-1">Members</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[--background] to-transparent z-10 pointer-events-none" />
    </div>
  )
}
