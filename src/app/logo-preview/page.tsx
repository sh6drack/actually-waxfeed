"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { VinylLogoBlackWhite } from "../../../logo-versions/vinyl-logo-black-white"
import { VinylLogoRGBStripes } from "../../../logo-versions/vinyl-logo-rgb-stripes"

const RecordPlayer3D = dynamic(
  () => import("../../../logo-versions/record-player-3d").then((mod) => mod.RecordPlayer3D),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-[#444]">Loading 3D...</div>
  }
)

export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <h1 className="text-3xl font-bold mb-8">Logo Versions</h1>

      {/* Official Logo */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[#888]">Official Waxfeed Logo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-[#222] p-6">
            <h3 className="text-lg font-bold mb-4">SVG (Adaptive)</h3>
            <div className="flex justify-center mb-4 bg-black p-4">
              <img src="/icon.svg" alt="Waxfeed Logo" className="w-24 h-24" />
            </div>
            <p className="text-sm text-[#888]">Adapts to light/dark mode</p>
          </div>
          <div className="border border-[#222] p-6">
            <h3 className="text-lg font-bold mb-4">Dark Mode (32x32)</h3>
            <div className="flex justify-center mb-4 bg-black p-4">
              <img src="/icon-dark-32x32.png" alt="Waxfeed Logo Dark" className="w-8 h-8" />
            </div>
            <p className="text-sm text-[#888]">For dark backgrounds</p>
          </div>
          <div className="border border-[#222] p-6">
            <h3 className="text-lg font-bold mb-4">Light Mode (32x32)</h3>
            <div className="flex justify-center mb-4 bg-white p-4">
              <img src="/icon-light-32x32.png" alt="Waxfeed Logo Light" className="w-8 h-8" />
            </div>
            <p className="text-sm text-[#888]">For light backgrounds</p>
          </div>
        </div>
      </section>

      {/* Vinyl Logos */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[#888]">Vinyl Record Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Black & White Vinyl */}
          <div className="border border-[#222] p-6">
            <h3 className="text-lg font-bold mb-4">Black & White Vinyl</h3>
            <div className="flex justify-center mb-4">
              <VinylLogoBlackWhite />
            </div>
            <p className="text-sm text-[#888]">Simple vinyl record icon</p>
          </div>

          {/* RGB Stripes */}
          <div className="border border-[#222] p-6">
            <h3 className="text-lg font-bold mb-4">RGB Stripes</h3>
            <div className="flex justify-center mb-4">
              <VinylLogoRGBStripes />
            </div>
            <p className="text-sm text-[#888]">RGB striped variant</p>
          </div>

          {/* 3D Record Player */}
          <div className="border border-[#222] p-6">
            <h3 className="text-lg font-bold mb-4">3D Spinning Vinyl</h3>
            <div className="h-64 bg-black rounded overflow-hidden">
              <RecordPlayer3D />
            </div>
            <p className="text-sm text-[#888] mt-4">Interactive 3D vinyl record</p>
          </div>
        </div>
      </section>

      <div className="text-sm text-[#666]">
        <p>Logo files:</p>
        <ul className="list-disc list-inside mt-2">
          <li>public/icon.svg - Main logo (adaptive)</li>
          <li>public/icon-dark-32x32.png - Dark mode favicon</li>
          <li>public/icon-light-32x32.png - Light mode favicon</li>
          <li>logo-versions/vinyl-logo-black-white.png</li>
          <li>logo-versions/vinyl-logo-rgb-stripes.png</li>
        </ul>
      </div>
    </div>
  )
}
