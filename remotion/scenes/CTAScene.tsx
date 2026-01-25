import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  width?: number;
  height?: number;
}

export const CTAScene: React.FC<Props> = ({ width = 1920, height = 1080 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = height > width;

  // Disc spin - 45 degrees per second
  const discRotation = (frame / fps) * 45;

  // Logo entrance
  const logoScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Tagline
  const taglineOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = spring({ frame: frame - 25, fps, from: 30, to: 0, durationInFrames: 15 });

  // URL
  const urlOpacity = interpolate(frame, [50, 65], [0, 1], { extrapolateRight: "clamp" });

  // Pulse effect
  const pulseScale = 1 + Math.sin(frame * 0.12) * 0.015;

  // Glow intensity
  const glowIntensity = interpolate(frame, [0, 40, 80], [0, 0.4, 0.3]);

  const logoSize = isVertical ? 280 : 220;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 24 : 20,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: logoSize * 1.8,
          height: logoSize * 1.8,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,215,0,${glowIntensity}) 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      {/* MiniDisc Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale * pulseScale})`,
        }}
      >
        <svg width={logoSize} height={logoSize} viewBox="0 0 500 500">
          <defs>
            {/* DISC GRADIENTS */}
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
              <stop offset="100%" stopColor="#ffb8c8" stopOpacity="0.2"/>
            </radialGradient>

            <linearGradient id="lightStreak" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0"/>
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.8"/>
              <stop offset="52%" stopColor="#ffffff" stopOpacity="0.8"/>
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0"/>
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

            <filter id="caseShadow" x="-20%" y="-20%" width="145%" height="150%">
              <feDropShadow dx="4" dy="6" stdDeviation="12" floodColor="#000000" floodOpacity="0.35"/>
            </filter>
          </defs>

          {/* CASE */}
          <g filter="url(#caseShadow)">
            <rect x="28" y="28" width="444" height="444" rx="12" fill="url(#caseMain)"/>
          </g>

          {/* Case bevels */}
          <path d="M40,28 L460,28 Q472,28 472,40 L472,34 Q472,28 460,28 L40,28 Q28,28 28,40 L28,34" fill="#e8e8e8"/>
          <path d="M40,472 L460,472 Q472,472 472,460 L472,466 Q472,472 460,472 L40,472 Q28,472 28,460 L28,466" fill="#000000" opacity="0.12"/>

          {/* Inner well */}
          <rect x="44" y="44" width="412" height="412" rx="8" fill="#e2e2e2"/>

          {/* SPINNING DISC */}
          <g style={{ transform: `rotate(${discRotation}deg)`, transformOrigin: '250px 250px' }}>
            {/* Holographic base */}
            <circle cx="250" cy="250" r="175" fill="url(#holoBase)"/>
            <circle cx="250" cy="250" r="175" fill="url(#iridescentSweep)"/>

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

            {/* Light streak reflection */}
            <circle cx="250" cy="250" r="175" fill="url(#lightStreak)"/>

            {/* Edge shadow */}
            <circle cx="250" cy="250" r="175" fill="none" stroke="#000" strokeWidth="2" opacity="0.15"/>

            {/* Center hub */}
            <circle cx="250" cy="250" r="52" fill="url(#hubMetal)"/>
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
          <rect x="356" y="150" width="82" height="200" rx="4" fill="url(#shutterBody)"/>

          {/* Shutter texture lines */}
          <g stroke="rgba(0,0,0,0.05)" strokeWidth="0.5">
            {[162, 177, 192, 207, 222, 237, 252, 267, 282, 297, 312, 327, 342].map(y => (
              <line key={y} x1="358" y1={y} x2="436" y2={y}/>
            ))}
          </g>

          {/* WAXFEED text on shutter */}
          <text x="397" y="260"
                fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#1a1a1a"
                textAnchor="middle"
                letterSpacing="2"
                transform="rotate(-90 397 260)">
            WAXFEED
          </text>

          {/* Corner screws */}
          {[[58, 58], [442, 58], [58, 442], [442, 442]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <circle r="10" fill="#d8d8d8"/>
              <circle r="6" fill="#c0c0c0"/>
              <circle r="2.5" fill="#a0a0a0"/>
            </g>
          ))}

          {/* WF badge */}
          <g transform="translate(68, 396)">
            <rect width="38" height="30" rx="4" fill="none" stroke="#707070" strokeWidth="1.5"/>
            <text x="19" y="20"
                  fontFamily="Helvetica Neue, Arial"
                  fontSize="13"
                  fontWeight="700"
                  fill="#606060"
                  textAnchor="middle">
              WF
            </text>
          </g>
        </svg>
      </div>

      {/* Tagline */}
      <p
        style={{
          color: "#888",
          fontSize: isVertical ? 26 : 22,
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          margin: 0,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontWeight: 400,
          letterSpacing: "0.05em",
        }}
      >
        rate albums. find your people.
      </p>

      {/* URL */}
      <div style={{ opacity: urlOpacity, marginTop: isVertical ? 12 : 8 }}>
        <span
          style={{
            color: "#ffd700",
            fontSize: isVertical ? 36 : 28,
            fontWeight: 700,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          waxfeed.com
        </span>
      </div>

      {/* Social handle */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? 60 : 40,
          opacity: urlOpacity,
        }}
      >
        <span
          style={{
            color: "#555",
            fontSize: isVertical ? 18 : 15,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          @waxfeedapp
        </span>
      </div>
    </AbsoluteFill>
  );
};
