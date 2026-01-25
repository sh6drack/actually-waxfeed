import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";

interface Props {
  width?: number;
  height?: number;
}

// Real albums with Spotify cover art (640x640)
const ALBUMS = [
  {
    title: "DAMN.",
    artist: "Kendrick Lamar",
    rating: 9.5,
    cover: "https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc4e43d873869699",
    color: "#c41e1e",
  },
  {
    title: "Blonde",
    artist: "Frank Ocean",
    rating: 10,
    cover: "https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526",
    color: "#f5a623",
  },
  {
    title: "IGOR",
    artist: "Tyler, The Creator",
    rating: 9.0,
    cover: "https://i.scdn.co/image/ab67616d0000b2737005885df706891a3c182a57",
    color: "#ff69b4",
  },
  {
    title: "Ctrl",
    artist: "SZA",
    rating: 8.5,
    cover: "https://i.scdn.co/image/ab67616d0000b2734c79d5ec52a6d0302f3add25",
    color: "#2d5a27",
  },
  {
    title: "good kid, m.A.A.d city",
    artist: "Kendrick Lamar",
    rating: 10,
    cover: "https://i.scdn.co/image/ab67616d0000b273d28d2ebdedb220e479743797",
    color: "#1a1a2e",
  },
];

export const RateScene: React.FC<Props> = ({ width = 1920, height = 1080 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = height > width;

  // Each album gets ~24 frames (0.8 seconds)
  const albumIndex = Math.min(Math.floor(frame / 24), ALBUMS.length - 1);
  const albumFrame = frame % 24;
  const album = ALBUMS[albumIndex];

  // Album entrance with punch
  const albumScale = spring({ frame: albumFrame, fps, from: 0.7, to: 1, durationInFrames: 10, config: { damping: 12 } });
  const albumOpacity = interpolate(albumFrame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  // Rating swipe animation
  const ratingProgress = interpolate(albumFrame, [6, 16], [0, album.rating / 10], { extrapolateRight: "clamp" });
  const ratingOpacity = interpolate(albumFrame, [10, 14], [0, 1], { extrapolateRight: "clamp" });

  // "rate what you actually think" text at end
  const showEndText = frame > 100;
  const endTextOpacity = interpolate(frame, [100, 110], [0, 1], { extrapolateRight: "clamp" });

  const albumSize = isVertical ? 320 : 260;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Glow behind album */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: albumSize * 1.5,
          height: albumSize * 1.5,
          background: `radial-gradient(circle, ${album.color}40 0%, transparent 70%)`,
          filter: "blur(40px)",
          opacity: albumOpacity,
        }}
      />

      {/* Album Card */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -55%) scale(${albumScale})`,
          opacity: albumOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isVertical ? 24 : 18,
        }}
      >
        {/* Album Art */}
        <div
          style={{
            width: albumSize,
            height: albumSize,
            overflow: "hidden",
            boxShadow: `0 25px 80px ${album.color}50, 0 10px 30px rgba(0,0,0,0.5)`,
            position: "relative",
            border: "1px solid #333",
          }}
        >
          <Img
            src={album.cover}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Subtle shine overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* Album info */}
        <div style={{ textAlign: "center" }}>
          <h3
            style={{
              color: "#ededed",
              fontSize: isVertical ? 28 : 22,
              fontWeight: 700,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              margin: 0,
              marginBottom: 6,
            }}
          >
            {album.title}
          </h3>
          <p
            style={{
              color: "#888",
              fontSize: isVertical ? 18 : 15,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              margin: 0,
            }}
          >
            {album.artist}
          </p>
        </div>

        {/* Rating bar */}
        <div
          style={{
            width: albumSize,
            height: 6,
            backgroundColor: "#222",
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: `${ratingProgress * 100}%`,
              height: "100%",
              backgroundColor: "#ffd700",
              boxShadow: "0 0 20px #ffd70080",
            }}
          />
        </div>

        {/* Rating number */}
        <div
          style={{
            opacity: ratingOpacity,
            display: "flex",
            alignItems: "baseline",
            gap: 4,
          }}
        >
          <span
            style={{
              color: "#ffd700",
              fontSize: isVertical ? 72 : 56,
              fontWeight: 900,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              textShadow: "0 0 30px #ffd70060",
            }}
          >
            {album.rating}
          </span>
          <span
            style={{
              color: "#555",
              fontSize: isVertical ? 28 : 22,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 600,
            }}
          >
            /10
          </span>
        </div>
      </div>

      {/* End text overlay */}
      {showEndText && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "12%" : "10%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: endTextOpacity,
          }}
        >
          <h2
            style={{
              color: "#ededed",
              fontSize: isVertical ? 32 : 26,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            rate what you actually think
          </h2>
        </div>
      )}

      {/* Rating count indicator */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? 50 : 35,
          right: isVertical ? 35 : 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
          }}
        >
          {ALBUMS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                backgroundColor: i <= albumIndex ? "#ffd700" : "#333",
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
