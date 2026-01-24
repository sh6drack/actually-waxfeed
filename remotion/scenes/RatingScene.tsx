import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Easing,
  Sequence,
} from "remotion";
import { COLORS } from "../lib/colors";
import { FEATURED_ALBUMS } from "../data/sampleAlbums";

// Scene 3: THE RATING
// Albums rise, get rated. Numbers shatter into particles.

interface RatingSceneProps {
  width?: number;
  height?: number;
}

// Single rating animation component
function RatingAnimation({
  album,
  rating,
  delay = 0,
}: {
  album: (typeof FEATURED_ALBUMS)[0];
  rating: number;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - delay;

  if (adjustedFrame < 0) return null;

  // Album rise animation
  const albumY = interpolate(adjustedFrame, [0, 40], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  const albumOpacity = interpolate(adjustedFrame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const albumScale = interpolate(adjustedFrame, [0, 40], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Rating bar animation (starts at frame 50)
  const barRevealProgress = interpolate(adjustedFrame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor sweep (frames 70-110)
  const cursorPosition = interpolate(adjustedFrame, [70, 110], [0, rating / 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Number reveal (after cursor reaches position)
  const numberOpacity = interpolate(adjustedFrame, [115, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numberScale = interpolate(adjustedFrame, [115, 140], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Number shatter animation (frames 140-180)
  const shatterProgress = interpolate(adjustedFrame, [145, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 1, 1),
  });

  // Generate shatter particles
  const particleCount = 20;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
    const velocity = 100 + Math.random() * 200;
    const particleDelay = i * 0.02;

    return {
      x: Math.cos(angle) * velocity * Math.max(0, shatterProgress - particleDelay),
      y: Math.sin(angle) * velocity * Math.max(0, shatterProgress - particleDelay) - 50 * shatterProgress,
      opacity: 1 - shatterProgress,
      size: 4 + Math.random() * 4,
    };
  });

  const barWidth = 400;
  const barHeight = 8;
  const segments = 11; // 0-10

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      {/* Album cover */}
      <div
        style={{
          opacity: albumOpacity,
          transform: `translateY(${albumY}px) scale(${albumScale})`,
        }}
      >
        <Img
          src={album.coverMedium}
          style={{
            width: 280,
            height: 280,
            objectFit: "cover",
          }}
        />
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.white,
            textAlign: "center",
            marginTop: 16,
            opacity: 0.8,
          }}
        >
          {album.artist}
        </p>
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 14,
            color: COLORS.gray[500],
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {album.title}
        </p>
      </div>

      {/* Rating bar */}
      <div
        style={{
          width: barWidth,
          height: barHeight,
          display: "flex",
          gap: 4,
          opacity: barRevealProgress,
        }}
      >
        {Array.from({ length: segments }, (_, i) => {
          const filled = i / 10 <= cursorPosition;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: "100%",
                backgroundColor: filled ? COLORS.white : COLORS.gray[800],
                transition: "background-color 0.1s",
              }}
            />
          );
        })}
      </div>

      {/* Rating number */}
      {adjustedFrame >= 115 && shatterProgress < 1 && (
        <div style={{ position: "relative" }}>
          <span
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 120,
              fontWeight: 700,
              color: COLORS.white,
              opacity: numberOpacity * (1 - shatterProgress * 0.8),
              transform: `scale(${numberScale * (1 + shatterProgress * 0.3)})`,
              display: "inline-block",
            }}
          >
            {rating}
          </span>

          {/* Shatter particles */}
          {shatterProgress > 0 &&
            particles.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: p.size,
                  height: p.size,
                  backgroundColor: COLORS.white,
                  borderRadius: "50%",
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  opacity: p.opacity,
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function RatingScene({ width = 1920, height = 1080 }: RatingSceneProps) {
  const frame = useCurrentFrame();

  // Three ratings, each taking ~130 frames
  const ratings = [
    { album: FEATURED_ALBUMS[0], rating: 9, delay: 0 },
    { album: FEATURED_ALBUMS[1], rating: 8, delay: 130 },
    { album: FEATURED_ALBUMS[2], rating: 9, delay: 260 },
  ];

  // Determine which rating is active
  const activeIndex = Math.floor(frame / 130);
  const activeRating = ratings[Math.min(activeIndex, ratings.length - 1)];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Show each rating in sequence */}
      {ratings.map((r, i) => (
        <Sequence key={i} from={r.delay} durationInFrames={130}>
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RatingAnimation album={r.album} rating={r.rating} />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* Growing radar chart preview in corner */}
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 60,
          width: 150,
          height: 150,
          opacity: interpolate(frame, [130, 160], [0, 0.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <svg width="150" height="150" viewBox="0 0 150 150">
          <polygon
            points="75,10 130,45 130,105 75,140 20,105 20,45"
            fill="none"
            stroke={COLORS.gray[700]}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          {/* Animated data polygon grows with each rating */}
          <polygon
            points={`75,${75 - (frame > 130 ? 30 : 0)}
                     ${75 + (frame > 260 ? 25 : 0)},${75 - (frame > 260 ? 15 : 0)}
                     ${75 + (frame > 130 ? 25 : 0)},${75 + (frame > 130 ? 15 : 0)}
                     75,${75 + (frame > 0 ? 30 : 0)}
                     ${75 - (frame > 260 ? 25 : 0)},${75 + (frame > 260 ? 15 : 0)}
                     ${75 - (frame > 130 ? 25 : 0)},${75 - (frame > 130 ? 15 : 0)}`}
            fill={COLORS.white}
            fillOpacity="0.15"
            stroke={COLORS.white}
            strokeWidth="1"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
}
