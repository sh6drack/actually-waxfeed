"use client"

interface ViewToggleProps {
  view: "list" | "grid"
  onChange: (view: "list" | "grid") => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <button
        onClick={() => onChange("list")}
        className={`transition-colors ${
          view === "list" ? "text-[--foreground]" : "text-[--muted] hover:text-[--foreground]/70"
        }`}
      >
        List
      </button>
      <span className="text-[--muted]/50">|</span>
      <button
        onClick={() => onChange("grid")}
        className={`transition-colors ${
          view === "grid" ? "text-[--foreground]" : "text-[--muted] hover:text-[--foreground]/70"
        }`}
      >
        Grid
      </button>
    </div>
  )
}
