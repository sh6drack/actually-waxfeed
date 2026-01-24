import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";
import { HolographicDisc } from "../components/HolographicDisc";
import { SAMPLE_PROFILES } from "../data/sampleProfiles";
import { SAMPLE_ALBUMS } from "../data/sampleAlbums";

// Scene 7: THE ARTIFACT
// 3D rotating profile card. Orbiting albums. MiniDisc logo shimmers.

interface ArtifactSceneProps {
  width?: number;
  height?: number;
}

export function ArtifactScene({ width = 1920, height = 1080 }: ArtifactSceneProps) {
  const frame = useCurrentFrame();

  const profile = SAMPLE_PROFILES[0];
  const topAlbums = SAMPLE_ALBUMS.slice(0, 5);

  // Card 3D rotation
  const rotateY = interpolate(frame, [0, 300], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Card reveal
  const cardOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardScale = interpolate(frame, [0, 50], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Holographic light streak position
  const streakPosition = interpolate(frame, [0, 300], [-100, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Orbiting albums
  const orbitRadius = 280;
  const orbitSpeed = 0.008;

  const orbitingAlbums = topAlbums.map((album, i) => {
    const baseAngle = (i / topAlbums.length) * Math.PI * 2;
    const angle = baseAngle + frame * orbitSpeed;
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius * 0.3; // Elliptical orbit
    const z = Math.sin(angle) * 100; // Depth for 3D effect
    const scale = 0.6 + (z + 100) / 400; // Scale based on depth

    const revealDelay = 50 + i * 15;
    const opacity = interpolate(frame, [revealDelay, revealDelay + 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return { album, x, y, z, scale, opacity };
  });

  // Sort by z for proper layering
  const sortedAlbums = [...orbitingAlbums].sort((a, b) => a.z - b.z);

  // Logo reveal
  const logoOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
      }}
    >
      {/* Orbiting albums (behind card) */}
      {sortedAlbums
        .filter((a) => a.z < 0)
        .map((item, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${item.x}px, ${item.y}px) scale(${item.scale})`,
              opacity: item.opacity * 0.6,
              zIndex: Math.floor(item.z),
            }}
          >
            <Img
              src={item.album.coverMedium}
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
              }}
            />
          </div>
        ))}

      {/* Profile card with 3D rotation */}
      <div
        style={{
          opacity: cardOpacity,
          transform: `scale(${cardScale}) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        <div
          style={{
            width: 400,
            padding: 40,
            backgroundColor: COLORS.black,
            border: `2px solid ${COLORS.white}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Holographic light streak */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg,
                transparent ${streakPosition - 60}%,
                rgba(255,255,255,0.1) ${streakPosition - 30}%,
                rgba(255,255,255,0.3) ${streakPosition}%,
                rgba(255,255,255,0.1) ${streakPosition + 30}%,
                transparent ${streakPosition + 60}%
              )`,
              pointerEvents: "none",
            }}
          />

          {/* TASTEID label */}
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 10,
              fontWeight: 600,
              color: COLORS.gray[600],
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: 0,
              marginBottom: 20,
            }}
          >
            TASTEID
          </p>

          {/* Username */}
          <h2
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: COLORS.white,
              margin: 0,
              marginBottom: 8,
            }}
          >
            @{profile.username}
          </h2>

          {/* Archetype */}
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              border: `2px solid ${COLORS.white}`,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.white,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {profile.archetype.name}
            </span>
          </div>

          {/* Top genres */}
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 10,
              fontWeight: 500,
              color: COLORS.gray[600],
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
              marginBottom: 8,
            }}
          >
            TOP GENRES
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {profile.topGenres.slice(0, 4).map((genre, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: COLORS.white,
                  padding: "4px 10px",
                  border: `1px solid ${COLORS.gray[600]}`,
                }}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 30 }}>
            <div>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 9,
                  color: COLORS.gray[600],
                  letterSpacing: "0.1em",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                REVIEWS
              </p>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.white,
                  margin: 0,
                }}
              >
                {profile.reviewCount}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 9,
                  color: COLORS.gray[600],
                  letterSpacing: "0.1em",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                AVG RATING
              </p>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.white,
                  margin: 0,
                }}
              >
                {profile.averageRating}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 9,
                  color: COLORS.gray[600],
                  letterSpacing: "0.1em",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                POLARITY
              </p>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.white,
                  margin: 0,
                }}
              >
                {profile.polarityScore.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orbiting albums (in front of card) */}
      {sortedAlbums
        .filter((a) => a.z >= 0)
        .map((item, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${item.x}px, ${item.y}px) scale(${item.scale})`,
              opacity: item.opacity,
              zIndex: Math.floor(item.z) + 100,
            }}
          >
            <Img
              src={item.album.coverMedium}
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        ))}

      {/* MiniDisc logo in corner */}
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 60,
          opacity: logoOpacity,
        }}
      >
        <HolographicDisc
          size={120}
          spinning={true}
          spinSpeed={0.5}
          labelText={String(profile.reviewCount)}
        />
      </div>
    </AbsoluteFill>
  );
}
