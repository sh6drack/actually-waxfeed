import { AbsoluteFill, interpolate, useCurrentFrame, Easing, Img } from "remotion";
import { COLORS } from "../../lib/colors";
import { SAMPLE_ALBUMS } from "../../data/sampleAlbums";

interface CTASceneProps {
  width?: number;
  height?: number;
}

export function CTAScene({ width = 1920, height = 1080 }: CTASceneProps) {
  const frame = useCurrentFrame();

  // Album mosaic for border
  const mosaicAlbums = SAMPLE_ALBUMS.slice(0, 16);

  // Background fade
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo animation
  const logoScale = interpolate(frame, [20, 60], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const logoOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline reveal
  const taglineOpacity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [70, 100], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // URL reveal
  const urlOpacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Mosaic fade in (staggered)
  const mosaicOpacities = mosaicAlbums.map((_, i) => {
    const delay = 30 + i * 5;
    return interpolate(frame, [delay, delay + 30], [0, 0.15], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  // Disc rotation - smooth and continuous
  const discRotation = frame * 0.8;

  // Light streak position shifts with rotation
  const streakOffset = (frame * 2) % 360;

  // Final fade to black
  const fadeOut = interpolate(frame, [200, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {/* Album mosaic background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          opacity: bgOpacity,
        }}
      >
        {mosaicAlbums.map((album, i) => (
          <div
            key={album.id}
            style={{
              position: "relative",
              opacity: mosaicOpacities[i],
            }}
          >
            <Img
              src={album.coverMedium}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "grayscale(80%)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${COLORS.black} 40%, transparent 100%)`,
        }}
      />

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* Iridescent MiniDisc Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <svg width={160} height={160} viewBox="0 0 200 200">
            <defs>
              {/* Holographic base gradient - shifts with rotation */}
              <linearGradient
                id="ctaHoloBase"
                x1="20%"
                y1="80%"
                x2="80%"
                y2="20%"
                gradientTransform={`rotate(${discRotation}, 0.5, 0.5)`}
              >
                <stop offset="0%" stopColor="#e4a8c8" />
                <stop offset="12%" stopColor="#f0b8d8" />
                <stop offset="24%" stopColor="#d898c8" />
                <stop offset="36%" stopColor="#98d8b8" />
                <stop offset="48%" stopColor="#88c8d8" />
                <stop offset="60%" stopColor="#b898d8" />
                <stop offset="72%" stopColor="#d8a8c8" />
                <stop offset="84%" stopColor="#c8e8a8" />
                <stop offset="100%" stopColor="#e8c8d8" />
              </linearGradient>

              {/* Iridescent sweep 1 */}
              <radialGradient id="ctaIridescentSweep" cx="30%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="15%" stopColor="#ffb8e0" stopOpacity="0.6" />
                <stop offset="30%" stopColor="#b8ffb8" stopOpacity="0.4" />
                <stop offset="45%" stopColor="#b8d8ff" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#e8b8ff" stopOpacity="0.4" />
                <stop offset="75%" stopColor="#ffe8b8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffb8c8" stopOpacity="0.2" />
              </radialGradient>

              {/* Iridescent sweep 2 */}
              <radialGradient id="ctaIridescentSweep2" cx="70%" cy="70%" r="60%">
                <stop offset="0%" stopColor="#c8ffe8" stopOpacity="0.3" />
                <stop offset="30%" stopColor="#ffc8e8" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#c8c8ff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffe8c8" stopOpacity="0.15" />
              </radialGradient>

              {/* Dynamic light streak */}
              <linearGradient
                id="ctaLightStreak"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
                gradientTransform={`rotate(${streakOffset}, 0.5, 0.5)`}
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Edge depth */}
              <radialGradient id="ctaDiscEdge" cx="50%" cy="50%" r="50%">
                <stop offset="88%" stopColor="#000000" stopOpacity="0" />
                <stop offset="94%" stopColor="#000000" stopOpacity="0.1" />
                <stop offset="97%" stopColor="#000000" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
              </radialGradient>

              {/* Hub metal gradient */}
              <radialGradient id="ctaHubMetal" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f8f8f8" />
                <stop offset="35%" stopColor="#d0d0d0" />
                <stop offset="70%" stopColor="#888888" />
                <stop offset="100%" stopColor="#686868" />
              </radialGradient>
            </defs>

            {/* Spinning disc group */}
            <g transform={`rotate(${discRotation}, 100, 100)`}>
              {/* Disc base with holographic surface */}
              <circle cx="100" cy="100" r="90" fill="url(#ctaHoloBase)" />

              {/* Iridescent color sweeps */}
              <circle cx="100" cy="100" r="90" fill="url(#ctaIridescentSweep)" />
              <circle cx="100" cy="100" r="90" fill="url(#ctaIridescentSweep2)" />

              {/* Data track rings */}
              <g fill="none" strokeOpacity="0.08">
                <circle cx="100" cy="100" r="85" stroke="#000" strokeWidth="6" />
                <circle cx="100" cy="100" r="75" stroke="#fff" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="70" stroke="#000" strokeWidth="4" />
                <circle cx="100" cy="100" r="62" stroke="#fff" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="55" stroke="#000" strokeWidth="3" />
                <circle cx="100" cy="100" r="48" stroke="#fff" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="42" stroke="#000" strokeWidth="2" />
                <circle cx="100" cy="100" r="36" stroke="#fff" strokeWidth="0.5" />
              </g>

              {/* Light streak reflection */}
              <circle cx="100" cy="100" r="90" fill="url(#ctaLightStreak)" />

              {/* Edge depth/shadow */}
              <circle cx="100" cy="100" r="90" fill="url(#ctaDiscEdge)" />

              {/* Disc rim highlight */}
              <circle
                cx="100"
                cy="100"
                r="89"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.5"
                strokeDasharray="150 120"
                strokeDashoffset="25"
              />
            </g>

            {/* Outer ring border (doesn't spin) */}
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke={COLORS.white}
              strokeWidth="2"
            />

            {/* Center hub (spins with disc) */}
            <g transform={`rotate(${discRotation}, 100, 100)`}>
              <circle cx="100" cy="100" r="22" fill="url(#ctaHubMetal)" />
              <circle cx="100" cy="100" r="22" fill="none" stroke="#888" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="18" fill="#a8a8a8" />
              <circle cx="100" cy="100" r="14" fill="#909090" />
              <circle cx="100" cy="100" r="10" fill="#787878" />

              {/* Center hole */}
              <circle cx="100" cy="100" r="6" fill={COLORS.black} />

              {/* Hub highlight */}
              <ellipse
                cx="94"
                cy="94"
                rx="8"
                ry="4"
                fill="#ffffff"
                opacity="0.6"
                transform="rotate(-45, 94, 94)"
              />
            </g>

            {/* Static center ring */}
            <circle
              cx="100"
              cy="100"
              r="6"
              fill="none"
              stroke={COLORS.white}
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Brand name */}
        <h1
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 80,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: "-0.03em",
            margin: 0,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          WaxFeed
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.gray[300],
            margin: 0,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Join the discourse.
        </p>

        {/* URL */}
        <div
          style={{
            marginTop: 24,
            opacity: urlOpacity,
          }}
        >
          <span
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: COLORS.white,
              padding: "12px 28px",
              border: `2px solid ${COLORS.white}`,
              letterSpacing: "0.05em",
            }}
          >
            wax-feed.com
          </span>
        </div>
      </div>

      {/* Fade to black overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.black,
          opacity: fadeOut,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
