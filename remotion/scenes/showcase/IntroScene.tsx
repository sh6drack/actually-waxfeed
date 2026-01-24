import { AbsoluteFill, interpolate, useCurrentFrame, Easing, Img } from "remotion";
import { COLORS, getAnimatedHolographicGradient } from "../../lib/colors";

interface IntroSceneProps {
  width?: number;
  height?: number;
}

export function IntroScene({ width = 1920, height = 1080 }: IntroSceneProps) {
  const frame = useCurrentFrame();

  // Logo fade in
  const logoOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const logoScale = interpolate(frame, [0, 30], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Tagline reveal
  const taglineOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [40, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Holographic disc rotation
  const discRotation = frame * 0.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Holographic disc logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <svg width={200} height={200} viewBox="0 0 200 200">
          <defs>
            <linearGradient
              id="holoGradient"
              gradientTransform={`rotate(${discRotation})`}
            >
              <stop offset="0%" stopColor={COLORS.holographic.pink} />
              <stop offset="25%" stopColor={COLORS.holographic.sky} />
              <stop offset="50%" stopColor={COLORS.holographic.lavender} />
              <stop offset="75%" stopColor={COLORS.holographic.mint} />
              <stop offset="100%" stopColor={COLORS.holographic.pink} />
            </linearGradient>
            <radialGradient id="discGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="url(#holoGradient)" stopOpacity="0.3" />
              <stop offset="70%" stopColor="url(#holoGradient)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="url(#holoGradient)" />
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
            fill="url(#discGradient)"
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
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.white,
          letterSpacing: "-0.03em",
          marginTop: 40,
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
          color: COLORS.gray[400],
          marginTop: 16,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Rate albums. Find your people.
      </p>

      {/* Subtle pulsing border */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: `1px solid ${COLORS.gray[800]}`,
          opacity: 0.5 + Math.sin(frame * 0.05) * 0.2,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
