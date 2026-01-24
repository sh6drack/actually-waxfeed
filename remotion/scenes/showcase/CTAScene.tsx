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

  // Holographic disc rotation
  const discRotation = frame * 0.5;

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
        {/* Holographic disc logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <svg width={160} height={160} viewBox="0 0 200 200">
            <defs>
              <linearGradient
                id="ctaHoloGradient"
                gradientTransform={`rotate(${discRotation})`}
              >
                <stop offset="0%" stopColor={COLORS.holographic.pink} />
                <stop offset="25%" stopColor={COLORS.holographic.sky} />
                <stop offset="50%" stopColor={COLORS.holographic.lavender} />
                <stop offset="75%" stopColor={COLORS.holographic.mint} />
                <stop offset="100%" stopColor={COLORS.holographic.pink} />
              </linearGradient>
              <radialGradient id="ctaDiscGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="30%" stopColor="url(#ctaHoloGradient)" stopOpacity="0.3" />
                <stop offset="70%" stopColor="url(#ctaHoloGradient)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="url(#ctaHoloGradient)" />
              </radialGradient>
            </defs>

            {/* Outer disc */}
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke={COLORS.white}
              strokeWidth="2"
            />

            {/* Holographic fill */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="url(#ctaDiscGradient)"
              opacity="0.8"
            />

            {/* Inner groove rings */}
            {[70, 55, 40].map((r, i) => (
              <circle
                key={r}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={COLORS.white}
                strokeWidth="0.5"
                opacity={0.3 + i * 0.1}
              />
            ))}

            {/* Center hole */}
            <circle cx="100" cy="100" r="15" fill={COLORS.black} />
            <circle
              cx="100"
              cy="100"
              r="15"
              fill="none"
              stroke={COLORS.white}
              strokeWidth="2"
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
            waxfeed.com
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
