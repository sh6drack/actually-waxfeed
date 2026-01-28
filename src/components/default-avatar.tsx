interface DefaultAvatarProps {
  size?: "xs" | "sm" | "md" | "lg"
  name?: string | null
  className?: string
}

const sizeClasses = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-24 h-24",
}

const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-12 h-12",
}

export function DefaultAvatar({ size = "sm", name, className = "" }: DefaultAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[--surface] flex items-center justify-center ${className}`}
    >
      <svg
        className={`${iconSizes[size]} text-[--muted]`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  )
}
