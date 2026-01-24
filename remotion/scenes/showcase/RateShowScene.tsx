import { AbsoluteFill, interpolate, useCurrentFrame, Easing, Img } from "remotion";
import { COLORS } from "../../lib/colors";
import { SAMPLE_ALBUMS } from "../../data/sampleAlbums";

interface RateShowSceneProps {
  width?: number;
  height?: number;
}

export function RateShowScene({ width = 1920, height = 1080 }: RateShowSceneProps) {
  const frame = useCurrentFrame();
  const album = SAMPLE_ALBUMS[0]; // To Pimp a Butterfly
  const targetRating = 9.5;

  // Scene label fade
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelFadeOut = interpolate(frame, [60, 80], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Album cover reveal
  const coverScale = interpolate(frame, [30, 70], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const coverOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Album info slide in
  const infoX = interpolate(frame, [70, 110], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const infoOpacity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rating animation - number counts up
  const ratingProgress = interpolate(frame, [130, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const displayRating = (targetRating * ratingProgress).toFixed(1);

  // Rating circle fill
  const circleProgress = interpolate(frame, [130, 200], [0, targetRating / 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Review text typing effect
  const reviewText = "A masterpiece that redefines hip-hop. Every track is a journey.";
  const typedChars = Math.floor(
    interpolate(frame, [220, 320], [0, reviewText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displayedReview = reviewText.slice(0, typedChars);

  // Review opacity
  const reviewOpacity = interpolate(frame, [210, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor blink
  const cursorVisible = Math.floor(frame / 15) % 2 === 0 && typedChars < reviewText.length;

  // Circle stroke calculation
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference * (1 - circleProgress);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          opacity: labelOpacity * labelFadeOut,
        }}
      >
        <span
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.gray[500],
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          01 / Rate
        </span>
      </div>

      {/* Main content container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 80,
        }}
      >
        {/* Album cover */}
        <div
          style={{
            opacity: coverOpacity,
            transform: `scale(${coverScale})`,
          }}
        >
          <Img
            src={album.coverLarge}
            style={{
              width: 400,
              height: 400,
              objectFit: "cover",
            }}
          />
        </div>

        {/* Album info + rating */}
        <div
          style={{
            opacity: infoOpacity,
            transform: `translateX(${infoX}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Album title */}
          <div>
            <h2
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 48,
                fontWeight: 700,
                color: COLORS.white,
                letterSpacing: "-0.02em",
                margin: 0,
                maxWidth: 500,
              }}
            >
              {album.title}
            </h2>
            <p
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 24,
                fontWeight: 400,
                color: COLORS.gray[400],
                margin: 0,
                marginTop: 8,
              }}
            >
              {album.artist}
            </p>
          </div>

          {/* Rating circle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              marginTop: 16,
            }}
          >
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                {/* Background circle */}
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={COLORS.gray[800]}
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={COLORS.white}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 70 70)"
                />
              </svg>
              {/* Rating number */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: 48,
                    fontWeight: 700,
                    color: COLORS.white,
                  }}
                >
                  {displayRating}
                </span>
              </div>
            </div>

            {/* "Your Rating" label */}
            <div
              style={{
                opacity: ratingProgress > 0 ? 1 : 0,
              }}
            >
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.gray[500],
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Your Rating
              </span>
            </div>
          </div>

          {/* Review text */}
          <div
            style={{
              opacity: reviewOpacity,
              marginTop: 24,
              maxWidth: 450,
            }}
          >
            <p
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 18,
                fontWeight: 400,
                color: COLORS.gray[300],
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              "{displayedReview}
              {cursorVisible && (
                <span style={{ color: COLORS.white }}>|</span>
              )}
              "
            </p>
          </div>
        </div>
      </div>

      {/* Subtle corner accent */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 80,
          width: 100,
          height: 1,
          backgroundColor: COLORS.gray[700],
        }}
      />
    </AbsoluteFill>
  );
}
