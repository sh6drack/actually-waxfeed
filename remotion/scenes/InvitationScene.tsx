import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";
import { HolographicDisc } from "../components/HolographicDisc";
import { SAMPLE_ALBUMS } from "../data/sampleAlbums";

// Scene 8: THE INVITATION
// Logo centers. "WaxFeed" types. Album mosaic border. Fade to black.

interface InvitationSceneProps {
  width?: number;
  height?: number;
}

export function InvitationScene({
  width = 1920,
  height = 1080,
}: InvitationSceneProps) {
  const frame = useCurrentFrame();

  // Disc spin deceleration and center
  const spinDeceleration = interpolate(frame, [0, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Logo scale animation
  const logoScale = interpolate(frame, [0, 60], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  const logoOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "WAXFEED" text typing
  const fullText = "WaxFeed";
  const typeProgress = interpolate(frame, [80, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visibleChars = Math.floor(typeProgress * fullText.length);
  const displayText = fullText.substring(0, visibleChars);
  const showCursor = frame > 80 && frame < 150;

  // Tagline reveal
  const taglineOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [150, 190], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Album mosaic border
  const mosaicAlbums = SAMPLE_ALBUMS.slice(0, 24);
  const albumSize = 64;
  const cols = Math.ceil(width / albumSize);
  const rows = Math.ceil(height / albumSize);

  // Border pulse at end
  const borderPulse = interpolate(
    frame,
    [250, 260, 280],
    [1, 1.015, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Final fade
  const finalFade = interpolate(frame, [280, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {/* Album mosaic border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexWrap: "wrap",
          opacity: finalFade,
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0 }}>
          {Array.from({ length: cols }, (_, i) => {
            const albumIndex = i % mosaicAlbums.length;
            const delay = 180 + (i % 20) * 2;
            const opacity = interpolate(frame, [delay, delay + 30], [0, 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div key={`top-${i}`} style={{ width: albumSize, height: albumSize, opacity }}>
                <Img
                  src={mosaicAlbums[albumIndex].coverSmall}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", position: "absolute", bottom: 0, left: 0, right: 0 }}>
          {Array.from({ length: cols }, (_, i) => {
            const albumIndex = (i + 5) % mosaicAlbums.length;
            const delay = 180 + ((cols - i) % 20) * 2;
            const opacity = interpolate(frame, [delay, delay + 30], [0, 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div key={`bottom-${i}`} style={{ width: albumSize, height: albumSize, opacity }}>
                <Img
                  src={mosaicAlbums[albumIndex].coverSmall}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>

        {/* Left column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: albumSize,
            bottom: albumSize,
            left: 0,
          }}
        >
          {Array.from({ length: rows - 2 }, (_, i) => {
            const albumIndex = (i + 10) % mosaicAlbums.length;
            const delay = 180 + (i % 15) * 3;
            const opacity = interpolate(frame, [delay, delay + 30], [0, 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div key={`left-${i}`} style={{ width: albumSize, height: albumSize, opacity }}>
                <Img
                  src={mosaicAlbums[albumIndex].coverSmall}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: albumSize,
            bottom: albumSize,
            right: 0,
          }}
        >
          {Array.from({ length: rows - 2 }, (_, i) => {
            const albumIndex = (i + 15) % mosaicAlbums.length;
            const delay = 180 + ((rows - i) % 15) * 3;
            const opacity = interpolate(frame, [delay, delay + 30], [0, 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div key={`right-${i}`} style={{ width: albumSize, height: albumSize, opacity }}>
                <Img
                  src={mosaicAlbums[albumIndex].coverSmall}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Pulsing border */}
      <div
        style={{
          position: "absolute",
          inset: albumSize,
          border: `2px solid ${COLORS.white}`,
          transform: `scale(${borderPulse})`,
          opacity: finalFade * 0.8,
          pointerEvents: "none",
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
          opacity: finalFade,
        }}
      >
        {/* Holographic disc */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            marginBottom: 40,
          }}
        >
          <HolographicDisc
            size={200}
            spinning={spinDeceleration > 0.01}
            spinSpeed={0.8 * spinDeceleration}
          />
        </div>

        {/* WaxFeed text */}
        <h1
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 120,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: "-0.04em",
            margin: 0,
            position: "relative",
          }}
        >
          {displayText}
          {showCursor && (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 100,
                backgroundColor: COLORS.white,
                marginLeft: 4,
                opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
              }}
            />
          )}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.gray[500],
            letterSpacing: "0.02em",
            marginTop: 30,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Rate albums. Find your music people.
        </p>
      </div>

      {/* Gradient overlay for center visibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${COLORS.black} 30%, transparent 70%)`,
          pointerEvents: "none",
          opacity: finalFade,
        }}
      />
    </AbsoluteFill>
  );
}
