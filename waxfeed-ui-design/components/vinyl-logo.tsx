"use client"

import dynamic from "next/dynamic"

const RecordPlayer = dynamic(() => import("./record-player-3d").then((mod) => mod.RecordPlayer3D), {
  ssr: false,
  loading: () => <div className="w-12 h-12 bg-neutral-200"></div>,
})

export function VinylLogo() {
  return (
    <div className="w-12 h-12">
      <RecordPlayer />
    </div>
  )
}
