"use client"

export function WaxfeedLogo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  const dimension = sizes[size]

  // Full MiniDisc-style logo - only the iridescent vinyl disc spins
  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 500 500"
      className={className}
    >
      <defs>
        {/* DISC SURFACE GRADIENTS */}
        <linearGradient id="holoBase" x1="20%" y1="80%" x2="80%" y2="20%">
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

        <radialGradient id="iridescentSweep" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5"/>
          <stop offset="15%" stopColor="#ffb8e0" stopOpacity="0.6"/>
          <stop offset="30%" stopColor="#b8ffb8" stopOpacity="0.4"/>
          <stop offset="45%" stopColor="#b8d8ff" stopOpacity="0.35"/>
          <stop offset="60%" stopColor="#e8b8ff" stopOpacity="0.4"/>
          <stop offset="75%" stopColor="#ffe8b8" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#ffb8c8" stopOpacity="0.2"/>
        </radialGradient>

        <radialGradient id="iridescentSweep2" cx="70%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#c8ffe8" stopOpacity="0.3"/>
          <stop offset="30%" stopColor="#ffc8e8" stopOpacity="0.25"/>
          <stop offset="60%" stopColor="#c8c8ff" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#ffe8c8" stopOpacity="0.15"/>
        </radialGradient>

        <linearGradient id="lightStreak" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.7"/>
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9"/>
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7"/>
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>

        <radialGradient id="discEdgeDepth" cx="50%" cy="50%" r="50%">
          <stop offset="88%" stopColor="#000000" stopOpacity="0"/>
          <stop offset="94%" stopColor="#000000" stopOpacity="0.1"/>
          <stop offset="97%" stopColor="#000000" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35"/>
        </radialGradient>

        {/* CENTER HUB GRADIENTS */}
        <radialGradient id="hubMetal" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f8f8f8"/>
          <stop offset="15%" stopColor="#e8e8e8"/>
          <stop offset="35%" stopColor="#d0d0d0"/>
          <stop offset="55%" stopColor="#a8a8a8"/>
          <stop offset="75%" stopColor="#888888"/>
          <stop offset="100%" stopColor="#686868"/>
        </radialGradient>

        <radialGradient id="ringMetal1" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#d8d8d8"/>
          <stop offset="50%" stopColor="#a0a0a0"/>
          <stop offset="100%" stopColor="#707070"/>
        </radialGradient>

        <radialGradient id="ringMetal2" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#c0c0c0"/>
          <stop offset="50%" stopColor="#909090"/>
          <stop offset="100%" stopColor="#606060"/>
        </radialGradient>

        <radialGradient id="spindleClamp" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e0e0e0"/>
          <stop offset="30%" stopColor="#b8b8b8"/>
          <stop offset="60%" stopColor="#909090"/>
          <stop offset="100%" stopColor="#585858"/>
        </radialGradient>

        {/* CASE GRADIENTS - original clear plastic */}
        <linearGradient id="caseMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6f6f6"/>
          <stop offset="25%" stopColor="#efefef"/>
          <stop offset="50%" stopColor="#e6e6e6"/>
          <stop offset="75%" stopColor="#dedede"/>
          <stop offset="100%" stopColor="#d4d4d4"/>
        </linearGradient>

        <radialGradient id="caseWell" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8e8e8"/>
          <stop offset="70%" stopColor="#e0e0e0"/>
          <stop offset="100%" stopColor="#c8c8c8"/>
        </radialGradient>

        <linearGradient id="wallLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8e8e8"/>
          <stop offset="50%" stopColor="#d8d8d8"/>
          <stop offset="100%" stopColor="#c0c0c0"/>
        </linearGradient>

        <linearGradient id="wallRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c8c8c8"/>
          <stop offset="50%" stopColor="#b8b8b8"/>
          <stop offset="100%" stopColor="#a8a8a8"/>
        </linearGradient>

        <linearGradient id="wallTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f0f0"/>
          <stop offset="50%" stopColor="#e0e0e0"/>
          <stop offset="100%" stopColor="#d0d0d0"/>
        </linearGradient>

        <linearGradient id="wallBottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c0c0c0"/>
          <stop offset="50%" stopColor="#b0b0b0"/>
          <stop offset="100%" stopColor="#a0a0a0"/>
        </linearGradient>

        {/* SHUTTER GRADIENTS */}
        <linearGradient id="shutterBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a078b0"/>
          <stop offset="20%" stopColor="#b890c8"/>
          <stop offset="40%" stopColor="#c8a0d8"/>
          <stop offset="60%" stopColor="#c8a0d8"/>
          <stop offset="80%" stopColor="#b890c8"/>
          <stop offset="100%" stopColor="#9870a8"/>
        </linearGradient>

        <linearGradient id="shutterHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d8c0e8"/>
          <stop offset="50%" stopColor="#c8b0d8"/>
          <stop offset="100%" stopColor="#b8a0c8"/>
        </linearGradient>

        {/* FILTERS */}
        <filter id="mainShadow" x="-15%" y="-15%" width="135%" height="140%">
          <feDropShadow dx="5" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
      </defs>

      {/* CASE STRUCTURE */}
      <g filter="url(#mainShadow)">
        <rect x="28" y="28" width="444" height="444" rx="10" fill="url(#caseMain)"/>
      </g>

      {/* Case outer bevel - NO WHITE BORDERS - using subtle dark tones */}
      <path d="M38,28 L462,28 Q472,28 472,38 L472,32 Q472,28 462,28 L38,28 Q28,28 28,38 L28,32" fill="#d0d0d0" opacity="0.5"/>
      <path d="M28,38 L28,462 Q28,472 38,472 L32,472 Q28,472 28,462 L28,38 Q28,28 38,28 L32,28" fill="#c8c8c8" opacity="0.4"/>
      <path d="M38,472 L462,472 Q472,472 472,462 L472,468 Q472,472 462,472 L38,472 Q28,472 28,462 L28,468" fill="#000000" opacity="0.15"/>
      <path d="M472,38 L472,462 Q472,472 462,472 L468,472 Q472,472 472,462 L472,38 Q472,28 462,28 L468,28" fill="#000000" opacity="0.12"/>

      {/* Inner case well */}
      <rect x="42" y="42" width="416" height="416" rx="6" fill="url(#caseWell)"/>

      {/* Inner well shadow edges */}
      <rect x="42" y="42" width="416" height="8" fill="url(#wallTop)" rx="3"/>
      <rect x="42" y="42" width="8" height="416" fill="url(#wallLeft)" rx="3"/>
      <rect x="42" y="450" width="416" height="8" fill="url(#wallBottom)" rx="3"/>
      <rect x="450" y="42" width="8" height="416" fill="url(#wallRight)" rx="3"/>

      {/* Case wall ridges */}
      <rect x="35" y="80" width="4" height="340" fill="#d8d8d8" rx="1"/>
      <rect x="35" y="80" width="1" height="340" fill="#e8e8e8"/>
      <rect x="461" y="80" width="4" height="340" fill="#c0c0c0" rx="1"/>
      <rect x="464" y="80" width="1" height="340" fill="#a8a8a8"/>
      <rect x="80" y="35" width="340" height="4" fill="#e0e0e0" rx="1"/>
      <rect x="80" y="35" width="340" height="1" fill="#f0f0f0"/>
      <rect x="80" y="461" width="340" height="4" fill="#b0b0b0" rx="1"/>
      <rect x="80" y="464" width="340" height="1" fill="#a0a0a0"/>

      {/* CORNER SCREW MOUNTS */}
      <g transform="translate(58, 58)">
        <circle cx="0" cy="0" r="12" fill="#e4e4e4"/>
        <circle cx="0" cy="0" r="10" fill="#d8d8d8"/>
        <circle cx="0" cy="0" r="8" fill="#e0e0e0"/>
        <circle cx="0" cy="0" r="6" fill="#c8c8c8"/>
        <circle cx="0" cy="0" r="4" fill="#b8b8b8"/>
        <circle cx="0" cy="0" r="2" fill="#a0a0a0"/>
        <ellipse cx="-3" cy="-3" rx="3" ry="2" fill="#ffffff" opacity="0.6" transform="rotate(-45)"/>
      </g>

      <g transform="translate(442, 58)">
        <circle cx="0" cy="0" r="12" fill="#e0e0e0"/>
        <circle cx="0" cy="0" r="10" fill="#d4d4d4"/>
        <circle cx="0" cy="0" r="8" fill="#dcdcdc"/>
        <circle cx="0" cy="0" r="6" fill="#c4c4c4"/>
        <circle cx="0" cy="0" r="4" fill="#b4b4b4"/>
        <circle cx="0" cy="0" r="2" fill="#9c9c9c"/>
        <ellipse cx="-3" cy="-3" rx="3" ry="2" fill="#ffffff" opacity="0.5" transform="rotate(-45)"/>
      </g>

      <g transform="translate(58, 442)">
        <circle cx="0" cy="0" r="12" fill="#d8d8d8"/>
        <circle cx="0" cy="0" r="10" fill="#cccccc"/>
        <circle cx="0" cy="0" r="8" fill="#d4d4d4"/>
        <circle cx="0" cy="0" r="6" fill="#bcbcbc"/>
        <circle cx="0" cy="0" r="4" fill="#acacac"/>
        <circle cx="0" cy="0" r="2" fill="#949494"/>
        <ellipse cx="-2" cy="-2" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.4" transform="rotate(-45)"/>
      </g>

      <g transform="translate(442, 442)">
        <circle cx="0" cy="0" r="12" fill="#d4d4d4"/>
        <circle cx="0" cy="0" r="10" fill="#c8c8c8"/>
        <circle cx="0" cy="0" r="8" fill="#d0d0d0"/>
        <circle cx="0" cy="0" r="6" fill="#b8b8b8"/>
        <circle cx="0" cy="0" r="4" fill="#a8a8a8"/>
        <circle cx="0" cy="0" r="2" fill="#909090"/>
        <ellipse cx="-2" cy="-2" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.35" transform="rotate(-45)"/>
      </g>

      {/* ENTIRE VINYL DISC - spins around its center like a real record */}
      <g className="animate-spin-slow" style={{ transformOrigin: '250px 250px' }}>
        {/* Disc base with holographic surface */}
        <circle cx="250" cy="250" r="175" fill="url(#holoBase)"/>

        {/* Iridescent color sweeps */}
        <circle cx="250" cy="250" r="175" fill="url(#iridescentSweep)"/>
        <circle cx="250" cy="250" r="175" fill="url(#iridescentSweep2)"/>

        {/* Data track rings */}
        <g fill="none" strokeOpacity="0.08">
          <circle cx="250" cy="250" r="168" stroke="#000" strokeWidth="12"/>
          <circle cx="250" cy="250" r="150" stroke="#fff" strokeWidth="1"/>
          <circle cx="250" cy="250" r="145" stroke="#000" strokeWidth="8"/>
          <circle cx="250" cy="250" r="132" stroke="#fff" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="128" stroke="#000" strokeWidth="6"/>
          <circle cx="250" cy="250" r="118" stroke="#fff" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="112" stroke="#000" strokeWidth="5"/>
          <circle cx="250" cy="250" r="102" stroke="#fff" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="95" stroke="#000" strokeWidth="4"/>
          <circle cx="250" cy="250" r="85" stroke="#fff" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="78" stroke="#000" strokeWidth="3"/>
          <circle cx="250" cy="250" r="68" stroke="#fff" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="62" stroke="#000" strokeWidth="2"/>
        </g>

        {/* Light streak reflection */}
        <circle cx="250" cy="250" r="175" fill="url(#lightStreak)"/>

        {/* Edge depth/shadow */}
        <circle cx="250" cy="250" r="175" fill="url(#discEdgeDepth)"/>

        {/* Disc rim highlight */}
        <circle cx="250" cy="250" r="174" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.5"
                strokeDasharray="300 250" strokeDashoffset="50"/>

        {/* Disc rim shadow */}
        <circle cx="250" cy="250" r="175" fill="none" stroke="#000000" strokeWidth="1" opacity="0.25"
                strokeDasharray="300 250" strokeDashoffset="-200"/>

        {/* CENTER HUB/LABEL - part of the disc, spins with it */}
        <circle cx="250" cy="250" r="52" fill="url(#hubMetal)"/>
        <circle cx="250" cy="250" r="52" fill="none" stroke="#888" strokeWidth="0.5"/>

        <circle cx="250" cy="250" r="48" fill="none" stroke="#666" strokeWidth="2"/>
        <circle cx="250" cy="250" r="47" fill="url(#ringMetal1)"/>

        <circle cx="250" cy="250" r="42" fill="none" stroke="#555" strokeWidth="1.5"/>
        <circle cx="250" cy="250" r="40" fill="url(#ringMetal2)"/>

        <circle cx="250" cy="250" r="35" fill="none" stroke="#666" strokeWidth="1"/>
        <circle cx="250" cy="250" r="33" fill="#a8a8a8"/>

        <circle cx="250" cy="250" r="28" fill="none" stroke="#505050" strokeWidth="2"/>
        <circle cx="250" cy="250" r="25" fill="url(#spindleClamp)"/>

        <circle cx="250" cy="250" r="20" fill="none" stroke="#606060" strokeWidth="1.5"/>
        <circle cx="250" cy="250" r="17" fill="#909090"/>

        <circle cx="250" cy="250" r="12" fill="none" stroke="#484848" strokeWidth="2"/>
        <circle cx="250" cy="250" r="9" fill="#787878"/>

        {/* Center hole */}
        <circle cx="250" cy="250" r="5" fill="#1c1c1c"/>
        <circle cx="250" cy="250" r="3.5" fill="#282828"/>
        <circle cx="250" cy="250" r="2" fill="#101010"/>

        {/* Hub specular highlights */}
        <ellipse cx="235" cy="232" rx="18" ry="8" fill="#ffffff" opacity="0.6" transform="rotate(-50 235 232)"/>
        <ellipse cx="242" cy="240" rx="8" ry="4" fill="#ffffff" opacity="0.8" transform="rotate(-50 242 240)"/>
        <ellipse cx="260" cy="262" rx="6" ry="3" fill="#ffffff" opacity="0.25" transform="rotate(40 260 262)"/>

        {/* "88" printed on disc surface */}
        <text x="335" y="262"
              fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
              fontSize="34"
              fontWeight="700"
              fill="#1a1a1a"
              opacity="0.8"
              textAnchor="middle">
          88
        </text>

        {/* Small technical text */}
        <g opacity="0.4" fill="#333">
          <text x="205" y="320"
                fontFamily="Helvetica, Arial, sans-serif"
                fontSize="5"
                letterSpacing="0.5"
                transform="rotate(-20 205 320)">
            RECORDABLE
          </text>
          <text x="170" y="300"
                fontFamily="Helvetica, Arial, sans-serif"
                fontSize="4.5"
                letterSpacing="0.3"
                transform="rotate(-35 170 300)">
            74 / 2892
          </text>
        </g>
      </g>

      {/* SHUTTER MECHANISM - static */}
      <rect x="358" y="152" width="78" height="196" rx="3" fill="#000000" opacity="0.15" transform="translate(3,4)"/>
      <rect x="358" y="152" width="78" height="196" rx="3" fill="url(#shutterBody)"/>

      {/* Shutter surface texture */}
      <g stroke="rgba(0,0,0,0.06)" strokeWidth="0.5">
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

      {/* Shutter edges */}
      <rect x="358" y="152" width="3" height="196" fill="url(#shutterHighlight)" rx="1"/>
      <rect x="433" y="152" width="3" height="196" fill="#785888" opacity="0.3" rx="1"/>
      <rect x="358" y="152" width="78" height="2" fill="#d8c0e8" opacity="0.5" rx="1"/>
      <rect x="358" y="346" width="78" height="2" fill="#786088" opacity="0.3" rx="1"/>

      {/* WAXFEED on shutter */}
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

      {/* WF LOGO */}
      <g transform="translate(68, 398)">
        <rect x="0" y="0" width="36" height="28" fill="none" stroke="#606060" strokeWidth="1.5" rx="3"/>
        <rect x="2" y="2" width="32" height="24" fill="none" stroke="#808080" strokeWidth="0.5" rx="2"/>
        <text x="18" y="19"
              fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
              fontSize="12"
              fontWeight="700"
              fill="#505050"
              textAnchor="middle">
          WF
        </text>
      </g>

      {/* CASE SURFACE REFLECTIONS - subtle, no white borders */}
      <polygon points="28,140 140,28 200,28 28,220" fill="#ffffff" opacity="0.08"/>
      <polygon points="28,280 60,28 80,28 28,310" fill="#ffffff" opacity="0.04"/>
      <polygon points="400,472 472,390 472,430 440,472" fill="#ffffff" opacity="0.03"/>
    </svg>
  )
}
