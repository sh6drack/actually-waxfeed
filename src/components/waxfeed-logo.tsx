import Image from "next/image"

export function WaxfeedLogo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
  }

  const { width, height } = sizes[size]

  return (
    <Image
      src="/logo/waxfeed-disc-128.png"
      alt="Waxfeed"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
