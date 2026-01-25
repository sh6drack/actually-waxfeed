import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  width?: number;
  height?: number;
}

const TESTIMONIALS = [
  { text: "finally someone gets it", user: "@melodymaven" },
  { text: "my music twin is in japan??", user: "@basshead_22" },
  { text: "94% match is crazy", user: "@vinylvibes" },
];

const STATS = [
  { value: "47K", label: "albums rated" },
  { value: "12K", label: "taste matches" },
  { value: "89%", label: "match accuracy" },
];

export const ProofScene: React.FC<Props> = ({ width = 1920, height = 1080 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = height > width;

  // Testimonials fly in
  const testimonial1Y = spring({ frame, fps, from: 100, to: 0, durationInFrames: 15 });
  const testimonial1Opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const testimonial2Y = spring({ frame: frame - 15, fps, from: 100, to: 0, durationInFrames: 15 });
  const testimonial2Opacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" });

  const testimonial3Y = spring({ frame: frame - 30, fps, from: 100, to: 0, durationInFrames: 15 });
  const testimonial3Opacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" });

  // Stats counter animation
  const showStats = frame > 60;
  const statsOpacity = interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" });

  // Notification pop
  const showNotification = frame > 100;
  const notifScale = spring({ frame: frame - 100, fps, from: 0.5, to: 1, durationInFrames: 12 });
  const notifOpacity = interpolate(frame, [100, 108], [0, 1], { extrapolateRight: "clamp" });

  const testimonialStyles = [
    { opacity: testimonial1Opacity, transform: `translateY(${testimonial1Y}px)` },
    { opacity: testimonial2Opacity, transform: `translateY(${testimonial2Y}px)` },
    { opacity: testimonial3Opacity, transform: `translateY(${testimonial3Y}px)` },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Testimonials */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? "15%" : "20%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isVertical ? 16 : 12,
          padding: "0 20px",
        }}
      >
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            style={{
              ...testimonialStyles[i],
              backgroundColor: "#1a1a1a",
              padding: isVertical ? "16px 24px" : "12px 20px",
              borderRadius: 12,
              borderLeft: "3px solid #ffd700",
              maxWidth: isVertical ? "90%" : "400px",
            }}
          >
            <p
              style={{
                color: "#fff",
                fontSize: isVertical ? 20 : 16,
                fontFamily: "system-ui",
                margin: 0,
              }}
            >
              "{t.text}"
            </p>
            <span
              style={{
                color: "#666",
                fontSize: isVertical ? 14 : 12,
                fontFamily: "system-ui",
              }}
            >
              {t.user}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      {showStats && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "25%" : "20%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: isVertical ? 40 : 60,
            opacity: statsOpacity,
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#ffd700",
                  fontSize: isVertical ? 36 : 28,
                  fontWeight: 900,
                  fontFamily: "system-ui",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  color: "#666",
                  fontSize: isVertical ? 12 : 10,
                  fontFamily: "system-ui",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Notification popup */}
      {showNotification && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "10%" : "8%",
            left: "50%",
            transform: `translateX(-50%) scale(${notifScale})`,
            opacity: notifOpacity,
            backgroundColor: "#1db954",
            padding: isVertical ? "14px 28px" : "10px 20px",
            borderRadius: 50,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🔔</span>
          <span
            style={{
              color: "#000",
              fontSize: isVertical ? 16 : 14,
              fontWeight: 600,
              fontFamily: "system-ui",
            }}
          >
            3 new taste matches
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
