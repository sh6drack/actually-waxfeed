import { AbsoluteFill, interpolate, useCurrentFrame, Easing, Img } from "remotion";
import { COLORS } from "../../lib/colors";
import { SAMPLE_ALBUMS } from "../../data/sampleAlbums";

interface DiscoverSceneProps {
  width?: number;
  height?: number;
}

export function DiscoverScene({ width = 1920, height = 1080 }: DiscoverSceneProps) {
  const frame = useCurrentFrame();

  // Featured albums for recommendations
  const recommendedAlbums = [
    { ...SAMPLE_ALBUMS[4], matchScore: 94 },  // Blonde
    { ...SAMPLE_ALBUMS[12], matchScore: 91 }, // channel ORANGE
    { ...SAMPLE_ALBUMS[13], matchScore: 88 }, // Ctrl
    { ...SAMPLE_ALBUMS[15], matchScore: 85 }, // Miseducation
    { ...SAMPLE_ALBUMS[8], matchScore: 82 },  // Kind of Blue
    { ...SAMPLE_ALBUMS[18], matchScore: 79 }, // 99.9%
  ];

  // Scene label
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelFadeOut = interpolate(frame, [60, 80], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title reveal
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [20, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Album card animations (staggered)
  const cardAnimations = recommendedAlbums.map((_, i) => {
    const startFrame = 60 + i * 25;
    const opacity = interpolate(frame, [startFrame, startFrame + 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const y = interpolate(frame, [startFrame, startFrame + 30], [40, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    const scale = interpolate(frame, [startFrame, startFrame + 30], [0.95, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    return { opacity, y, scale };
  });

  // Match score count up for each card
  const matchScores = recommendedAlbums.map((album, i) => {
    const startFrame = 120 + i * 25;
    const progress = interpolate(frame, [startFrame, startFrame + 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    return Math.round(album.matchScore * progress);
  });

  // "Based on your taste" caption
  const captionOpacity = interpolate(frame, [280, 310], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        padding: 80,
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
          03 / Discover
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
        }}
      >
        {/* Section title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 60,
          }}
        >
          <h2
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Recommended for you
          </h2>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 20,
              fontWeight: 400,
              color: COLORS.gray[400],
              margin: 0,
              marginTop: 12,
            }}
          >
            Albums that match your TasteID
          </p>
        </div>

        {/* Album grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 24,
          }}
        >
          {recommendedAlbums.map((album, i) => (
            <div
              key={album.id}
              style={{
                opacity: cardAnimations[i].opacity,
                transform: `translateY(${cardAnimations[i].y}px) scale(${cardAnimations[i].scale})`,
              }}
            >
              {/* Album cover */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  marginBottom: 16,
                }}
              >
                <Img
                  src={album.coverMedium}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Match score overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    backgroundColor: COLORS.white,
                    padding: "4px 10px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLORS.black,
                    }}
                  >
                    {matchScores[i]}%
                  </span>
                </div>
              </div>

              {/* Album info */}
              <h3
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.white,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {album.title}
              </h3>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 400,
                  color: COLORS.gray[400],
                  margin: 0,
                  marginTop: 4,
                }}
              >
                {album.artist}
              </p>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div
          style={{
            marginTop: 60,
            opacity: captionOpacity,
          }}
        >
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 16,
              fontWeight: 400,
              color: COLORS.gray[500],
            }}
          >
            Personalized recommendations powered by your listening history
          </p>
        </div>
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 80,
          width: interpolate(frame, [0, 100], [0, 200], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 1,
          backgroundColor: COLORS.gray[700],
        }}
      />
    </AbsoluteFill>
  );
}
