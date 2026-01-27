"use client"

import { useId } from 'react'

interface Props {
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "hero"
  spinning?: boolean
}

export function WaxfeedLogo({ className = "", size = "md", spinning = true }: Props) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    hero: 200,
  }

  const dimension = sizes[size]
  const reactId = useId()
  const uniqueId = `waxfeed-${reactId.replace(/:/g, '')}`

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 500 500"
      className={className}
    >
      <style>
        {`
          @keyframes spin-disc {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning-disc {
            animation: spin-disc 3s linear infinite;
            transform-origin: center;
            transform-box: fill-box;
          }
        `}
      </style>
      <defs>
        {/* DISC SURFACE GRADIENTS */}
        <linearGradient id={`${uniqueId}-holoBase`} x1="20%" y1="80%" x2="80%" y2="20%">
          <stop offset="0%" stopColor="#e4a8c8"/>
          <stop offset="12%" stopColor="#f0b8d8"/>
          <stop offset="24%" stopColor="#d898c8"/>
          <stop offset="36%" stopColor="#98d8b8"/>
          <stop offset="48%" stopColor="#88c8d8"/>
          <stop offset="60%" stopColor="#b898d8"/>
          <stop offset="72%" stopColor="#d8a8c8"/>
          <stop offset="84%" stopColor="#c8e8a8"/>
          <stop offset="100%" stopColor="#e8c8d8"/>
        </linearGradient>

        <radialGradient id={`${uniqueId}-iridescentSweep`} cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5"/>
          <stop offset="15%" stopColor="#ffb8e0" stopOpacity="0.6"/>
          <stop offset="30%" stopColor="#b8ffb8" stopOpacity="0.4"/>
          <stop offset="45%" stopColor="#b8d8ff" stopOpacity="0.35"/>
          <stop offset="60%" stopColor="#e8b8ff" stopOpacity="0.4"/>
          <stop offset="75%" stopColor="#ffe8b8" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#ffb8c8" stopOpacity="0.2"/>
        </radialGradient>

        <linearGradient id={`${uniqueId}-lightStreak`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.8"/>
          <stop offset="52%" stopColor="#ffffff" stopOpacity="0.8"/>
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>

        <radialGradient id={`${uniqueId}-hubMetal`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f8f8f8"/>
          <stop offset="35%" stopColor="#d0d0d0"/>
          <stop offset="75%" stopColor="#888888"/>
          <stop offset="100%" stopColor="#686868"/>
        </radialGradient>

        <linearGradient id={`${uniqueId}-caseMain`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6f6f6"/>
          <stop offset="50%" stopColor="#e6e6e6"/>
          <stop offset="100%" stopColor="#d4d4d4"/>
        </linearGradient>

        <linearGradient id={`${uniqueId}-shutterBody`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a078b0"/>
          <stop offset="50%" stopColor="#c8a0d8"/>
          <stop offset="100%" stopColor="#9870a8"/>
        </linearGradient>

        <filter id={`${uniqueId}-shadow`} x="-15%" y="-15%" width="135%" height="140%">
          <feDropShadow dx="5" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
      </defs>

      {/* CASE */}
      <g filter={`url(#${uniqueId}-shadow)`}>
        <rect x="28" y="28" width="444" height="444" rx="10" fill={`url(#${uniqueId}-caseMain)`}/>
      </g>

      {/* Case bevels */}
      <path d="M38,28 L462,28 Q472,28 472,38 L472,32 Q472,28 462,28 L38,28 Q28,28 28,38 L28,32" fill="#d0d0d0" opacity="0.5"/>
      <path d="M38,472 L462,472 Q472,472 472,462 L472,468 Q472,472 462,472 L38,472 Q28,472 28,462 L28,468" fill="#000000" opacity="0.15"/>

      {/* Inner well */}
      <rect x="42" y="42" width="416" height="416" rx="6" fill="#e0e0e0"/>

      {/* SPINNING DISC */}
      <g style={{ transformOrigin: '250px 250px' }} className={spinning ? "spinning-disc" : ""}>

        {/* Holographic base */}
        <circle cx="250" cy="250" r="175" fill={`url(#${uniqueId}-holoBase)`}/>
        <circle cx="250" cy="250" r="175" fill={`url(#${uniqueId}-iridescentSweep)`}/>

        {/* Data tracks */}
        <g fill="none" strokeOpacity="0.07">
          <circle cx="250" cy="250" r="168" stroke="#000" strokeWidth="12"/>
          <circle cx="250" cy="250" r="148" stroke="#000" strokeWidth="8"/>
          <circle cx="250" cy="250" r="130" stroke="#000" strokeWidth="6"/>
          <circle cx="250" cy="250" r="114" stroke="#000" strokeWidth="5"/>
          <circle cx="250" cy="250" r="98" stroke="#000" strokeWidth="4"/>
          <circle cx="250" cy="250" r="82" stroke="#000" strokeWidth="3"/>
          <circle cx="250" cy="250" r="66" stroke="#000" strokeWidth="2"/>
        </g>

        {/* Light streak */}
        <circle cx="250" cy="250" r="175" fill={`url(#${uniqueId}-lightStreak)`}/>

        {/* Edge shadow */}
        <circle cx="250" cy="250" r="175" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.2"/>

        {/* Center hub */}
        <circle cx="250" cy="250" r="52" fill={`url(#${uniqueId}-hubMetal)`}/>
        <circle cx="250" cy="250" r="42" fill="#b0b0b0"/>
        <circle cx="250" cy="250" r="32" fill="#a0a0a0"/>
        <circle cx="250" cy="250" r="22" fill="#909090"/>
        <circle cx="250" cy="250" r="12" fill="#707070"/>
        <circle cx="250" cy="250" r="5" fill="#1a1a1a"/>

        {/* Hub highlight */}
        <ellipse cx="235" cy="235" rx="15" ry="6" fill="#fff" opacity="0.5" transform="rotate(-45 235 235)"/>

        {/* "88" marking */}
        <text x="335" y="262"
              fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
              fontSize="32"
              fontWeight="700"
              fill="#1a1a1a"
              opacity="0.75"
              textAnchor="middle">
          88
        </text>
      </g>

      {/* SHUTTER */}
      <rect x="358" y="152" width="78" height="196" rx="3" fill="#000" opacity="0.15" transform="translate(3,4)"/>
      <rect x="358" y="152" width="78" height="196" rx="3" fill={`url(#${uniqueId}-shutterBody)`}/>

      {/* Shutter lines */}
      <g stroke="rgba(0,0,0,0.05)" strokeWidth="0.5">
        <line x1="360" y1="165" x2="434" y2="165"/>
        <line x1="360" y1="180" x2="434" y2="180"/>
        <line x1="360" y1="195" x2="434" y2="195"/>
        <line x1="360" y1="210" x2="434" y2="210"/>
        <line x1="360" y1="225" x2="434" y2="225"/>
        <line x1="360" y1="240" x2="434" y2="240"/>
        <line x1="360" y1="255" x2="434" y2="255"/>
        <line x1="360" y1="270" x2="434" y2="270"/>
        <line x1="360" y1="285" x2="434" y2="285"/>
        <line x1="360" y1="300" x2="434" y2="300"/>
        <line x1="360" y1="315" x2="434" y2="315"/>
        <line x1="360" y1="330" x2="434" y2="330"/>
      </g>

      {/* WAXFEED text */}
      <text x="397" y="262"
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fontSize="14"
            fontWeight="700"
            fill="#1a1a1a"
            textAnchor="middle"
            letterSpacing="2"
            transform="rotate(-90 397 262)">
        WAXFEED
      </text>

      {/* Corner screws */}
      <g transform="translate(58, 58)">
        <circle r="10" fill="#d8d8d8"/>
        <circle r="6" fill="#c0c0c0"/>
        <circle r="2.5" fill="#a0a0a0"/>
      </g>
      <g transform="translate(442, 58)">
        <circle r="10" fill="#d8d8d8"/>
        <circle r="6" fill="#c0c0c0"/>
        <circle r="2.5" fill="#a0a0a0"/>
      </g>
      <g transform="translate(58, 442)">
        <circle r="10" fill="#d8d8d8"/>
        <circle r="6" fill="#c0c0c0"/>
        <circle r="2.5" fill="#a0a0a0"/>
      </g>
      <g transform="translate(442, 442)">
        <circle r="10" fill="#d8d8d8"/>
        <circle r="6" fill="#c0c0c0"/>
        <circle r="2.5" fill="#a0a0a0"/>
      </g>

      {/* WF badge */}
      <g transform="translate(68, 398)">
        <rect width="36" height="28" rx="3" fill="none" stroke="#606060" strokeWidth="1.5"/>
        <text x="18" y="19"
              fontFamily="Helvetica Neue, Arial"
              fontSize="12"
              fontWeight="700"
              fill="#505050"
              textAnchor="middle">
          WF
        </text>
      </g>

      {/* Case reflections */}
      <polygon points="28,140 140,28 200,28 28,220" fill="#ffffff" opacity="0.08"/>
      <polygon points="28,280 60,28 80,28 28,310" fill="#ffffff" opacity="0.04"/>
    </svg>
  )
}
