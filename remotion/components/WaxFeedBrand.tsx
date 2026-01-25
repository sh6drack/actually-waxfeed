import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

interface Props {
  size?: number;
  showTagline?: boolean;
  showUrl?: boolean;
  isVertical?: boolean;
}

/**
 * WaxFeed Brand Component for Remotion
 * Uses the real MiniDisc-style logo with iridescent vinyl
 */
export const WaxFeedBrand: React.FC<Props> = ({
  size = 300,
  showTagline = true,
  showUrl = true,
  isVertical = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Disc spin animation - 8 seconds for full rotation
  const discRotation = (frame / fps) * 45; // 45 degrees per second

  // Logo entrance
  const logoScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Tagline entrance
  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = spring({ frame: frame - 20, fps, from: 30, to: 0, durationInFrames: 15 });

  // URL entrance
  const urlOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  // Glow pulse
  const glowIntensity = 0.3 + Math.sin(frame * 0.1) * 0.1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isVertical ? 24 : 20,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,215,0,${glowIntensity}) 0%, transparent 70%)`,
          filter: "blur(60px)",
          zIndex: -1,
        }}
      />

      {/* Logo SVG - Full MiniDisc style */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 500 500"
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

            <linearGradient id="lightStreak" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0"/>
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.7"/>
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9"/>
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7"/>
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0"/>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
            </linearGradient>

            <radialGradient id="hubMetal" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f8f8f8"/>
              <stop offset="35%" stopColor="#d0d0d0"/>
              <stop offset="75%" stopColor="#888888"/>
              <stop offset="100%" stopColor="#686868"/>
            </radialGradient>

            <linearGradient id="caseMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f6f6f6"/>
              <stop offset="50%" stopColor="#e6e6e6"/>
              <stop offset="100%" stopColor="#d4d4d4"/>
            </linearGradient>

            <linearGradient id="shutterBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a078b0"/>
              <stop offset="50%" stopColor="#c8a0d8"/>
              <stop offset="100%" stopColor="#9870a8"/>
            </linearGradient>

            <filter id="mainShadow" x="-15%" y="-15%" width="135%" height="140%">
              <feDropShadow dx="5" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* CASE */}
          <g filter="url(#mainShadow)">
            <rect x="28" y="28" width="444" height="444" rx="10" fill="url(#caseMain)"/>
          </g>

          {/* Case edges */}
          <path d="M38,28 L462,28 Q472,28 472,38 L472,32 Q472,28 462,28 L38,28 Q28,28 28,38 L28,32" fill="#d0d0d0" opacity="0.5"/>
          <path d="M38,472 L462,472 Q472,472 472,462 L472,468 Q472,472 462,472 L38,472 Q28,472 28,462 L28,468" fill="#000000" opacity="0.15"/>

          {/* Inner well */}
          <rect x="42" y="42" width="416" height="416" rx="6" fill="#e0e0e0"/>

          {/* SPINNING DISC */}
          <g style={{ transform: `rotate(${discRotation}deg)`, transformOrigin: '250px 250px' }}>
            <circle cx="250" cy="250" r="175" fill="url(#holoBase)"/>
            <circle cx="250" cy="250" r="175" fill="url(#iridescentSweep)"/>

            {/* Data tracks */}
            <g fill="none" strokeOpacity="0.08">
              <circle cx="250" cy="250" r="168" stroke="#000" strokeWidth="12"/>
              <circle cx="250" cy="250" r="145" stroke="#000" strokeWidth="8"/>
              <circle cx="250" cy="250" r="128" stroke="#000" strokeWidth="6"/>
              <circle cx="250" cy="250" r="112" stroke="#000" strokeWidth="5"/>
              <circle cx="250" cy="250" r="95" stroke="#000" strokeWidth="4"/>
              <circle cx="250" cy="250" r="78" stroke="#000" strokeWidth="3"/>
              <circle cx="250" cy="250" r="62" stroke="#000" strokeWidth="2"/>
            </g>

            {/* Light streak */}
            <circle cx="250" cy="250" r="175" fill="url(#lightStreak)"/>

            {/* Center hub */}
            <circle cx="250" cy="250" r="52" fill="url(#hubMetal)"/>
            <circle cx="250" cy="250" r="40" fill="#a0a0a0"/>
            <circle cx="250" cy="250" r="25" fill="#909090"/>
            <circle cx="250" cy="250" r="12" fill="#787878"/>
            <circle cx="250" cy="250" r="5" fill="#1c1c1c"/>

            {/* "88" on disc */}
            <text x="335" y="262"
                  fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
                  fontSize="34"
                  fontWeight="700"
                  fill="#1a1a1a"
                  opacity="0.8"
                  textAnchor="middle">
              88
            </text>
          </g>

          {/* SHUTTER */}
          <rect x="358" y="152" width="78" height="196" rx="3" fill="url(#shutterBody)"/>

          {/* Shutter lines */}
          <g stroke="rgba(0,0,0,0.06)" strokeWidth="0.5">
            {[165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330].map(y => (
              <line key={y} x1="360" y1={y} x2="434" y2={y}/>
            ))}
          </g>

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

          {/* Corner screws */}
          {[[58, 58], [442, 58], [58, 442], [442, 442]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <circle r="10" fill="#d8d8d8"/>
              <circle r="6" fill="#c8c8c8"/>
              <circle r="2" fill="#a0a0a0"/>
            </g>
          ))}

          {/* WF badge */}
          <g transform="translate(68, 398)">
            <rect width="36" height="28" fill="none" stroke="#606060" strokeWidth="1.5" rx="3"/>
            <text x="18" y="19"
                  fontFamily="Helvetica Neue, Arial"
                  fontSize="12"
                  fontWeight="700"
                  fill="#505050"
                  textAnchor="middle">
              WF
            </text>
          </g>
        </svg>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p
          style={{
            color: "#888",
            fontSize: isVertical ? 24 : 20,
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: "0.02em",
          }}
        >
          rate albums. find your people.
        </p>
      )}

      {/* URL */}
      {showUrl && (
        <div style={{ opacity: urlOpacity, marginTop: isVertical ? 16 : 12 }}>
          <span
            style={{
              color: "#ffd700",
              fontSize: isVertical ? 32 : 26,
              fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            waxfeed.com
          </span>
        </div>
      )}
    </div>
  );
};
