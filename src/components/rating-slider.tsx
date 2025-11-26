"use client"

import { useState } from "react"

interface RatingSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function RatingSlider({ value, onChange, disabled }: RatingSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#888]">Your Rating</span>
        <span className="font-bold text-2xl">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-[#666]">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  )
}
