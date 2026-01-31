import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { WaxFeedBrand } from "./components/WaxFeedBrand";
import { COLORS } from "./lib/colors";

/**
 * WAXFEED INVESTOR PROMO
 * Brutalist styling, fast cuts, key stats
 * 45 seconds @ 30fps = 1350 frames
 */

// Brutalist text component
const BrutalistText: React.FC<{
  children: React.ReactNode;
  size?: number;
  weight?: number;
  color?: string;
  delay?: number;
  letterSpacing?: string;
}> = ({ children, size = 120, weight = 900, color = "#fff", delay = 0, letterSpacing = "-0.05em" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const adjustedFrame = frame - delay;
  const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = spring({ frame: Math.max(0, adjustedFrame), fps, from: 60, to: 0, durationInFrames: 15 });
  
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        color,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        letterSpacing,
        lineHeight: 0.9,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Stat counter component
const StatCounter: React.FC<{
  value: string;
  label: string;
  delay?: number;
}> = ({ value, label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const adjustedFrame = frame - delay;
  const scale = spring({ frame: Math.max(0, adjustedFrame), fps, from: 0.5, to: 1, durationInFrames: 20 });
  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  return (
    <div
      style={{
        textAlign: "center",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontSize: 180,
          fontWeight: 900,
          color: "#ffd700",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: "#666",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginTop: 20,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Scene: Opening Hook
const HookScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <BrutalistText size={180} delay={0}>FILM HAS</BrutalistText>
        <BrutalistText size={180} color="#ffd700" delay={8}>LETTERBOXD</BrutalistText>
      </div>
    </AbsoluteFill>
  );
};

// Scene: The Gap
const GapScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <BrutalistText size={180} delay={0}>MUSIC HAS</BrutalistText>
        <BrutalistText size={180} color="#444" delay={8}>NOTHING</BrutalistText>
      </div>
    </AbsoluteFill>
  );
};

// Scene: The Market
const MarketScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <StatCounter value="616M" label="streaming subscribers" delay={0} />
    </AbsoluteFill>
  );
};

// Scene: Zero Spent
const ZeroScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <StatCounter value="$0" label="on social music discovery" delay={0} />
    </AbsoluteFill>
  );
};

// Scene: Logo Reveal
const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 30 });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ transform: `scale(${scale})` }}>
        <WaxFeedBrand size={400} showTagline={false} showUrl={false} />
      </div>
    </AbsoluteFill>
  );
};

// Scene: Product Name
const NameScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BrutalistText size={280} delay={0}>WAXFEED</BrutalistText>
    </AbsoluteFill>
  );
};

// Scene: Tagline
const TaglineScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <BrutalistText size={100} weight={300} color="#888" letterSpacing="-0.02em" delay={0}>
          LETTERBOXD FOR MUSIC
        </BrutalistText>
      </div>
    </AbsoluteFill>
  );
};

// Scene: First Spin
const FirstSpinScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            marginBottom: 30,
          }}
        >
          THE DIFFERENTIATOR
        </div>
        <BrutalistText size={160} color="#ffd700" delay={0}>FIRST SPIN</BrutalistText>
        <div style={{ marginTop: 40 }}>
          <BrutalistText size={48} weight={300} color="#888" delay={15}>
            PROVE YOU CALLED IT FIRST
          </BrutalistText>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene: Badges
const BadgesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const badges = [
    { color: "#ffd700", label: "GOLD", req: "First 10" },
    { color: "#c0c0c0", label: "SILVER", req: "First 50" },
    { color: "#cd7f32", label: "BRONZE", req: "First 100" },
  ];
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 100 }}>
        {badges.map((badge, i) => {
          const delay = i * 8;
          const adjustedFrame = frame - delay;
          const scale = spring({ frame: Math.max(0, adjustedFrame), fps, from: 0, to: 1, durationInFrames: 15 });
          const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          
          return (
            <div
              key={badge.label}
              style={{
                textAlign: "center",
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: badge.color,
                  margin: "0 auto 30px",
                }}
              />
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.1em",
                }}
              >
                {badge.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#666",
                  marginTop: 10,
                }}
              >
                {badge.req}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene: College Radio
const CollegeRadioScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            marginBottom: 30,
          }}
        >
          DISTRIBUTION
        </div>
        <BrutalistText size={140} delay={0}>COLLEGE RADIO</BrutalistText>
        <div style={{ marginTop: 50, display: "flex", gap: 80, justifyContent: "center" }}>
          <StatCounter value="1,400" label="STATIONS" delay={15} />
          <StatCounter value="100K+" label="DJS" delay={25} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene: The Ask
const AskScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            marginBottom: 30,
          }}
        >
          SERIES SEED
        </div>
        <BrutalistText size={220} color="#ffd700" delay={0}>$850K</BrutalistText>
        <div style={{ marginTop: 30 }}>
          <BrutalistText size={48} weight={300} color="#666" delay={15}>
            18 MONTHS RUNWAY
          </BrutalistText>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene: Urgency
const UrgencyScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <BrutalistText size={90} delay={0}>EARLY INVESTORS</BrutalistText>
        <BrutalistText size={90} color="#ffd700" delay={10}>SHAPE THE CULTURE</BrutalistText>
      </div>
    </AbsoluteFill>
  );
};

// Scene: CTA
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.15) * 0.03;
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ transform: `scale(${pulse})`, marginBottom: 60 }}>
          <WaxFeedBrand size={300} showTagline={false} showUrl={false} />
        </div>
        <BrutalistText size={60} weight={400} color="#ffd700" letterSpacing="0.1em" delay={20}>
          PROVE YOUR TASTE
        </BrutalistText>
        <div
          style={{
            marginTop: 50,
            fontSize: 28,
            color: "#666",
            letterSpacing: "0.05em",
          }}
        >
          waxfeed.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const WaxFeedInvestorPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Hook: Film has Letterboxd */}
      <Sequence from={0} durationInFrames={60}>
        <HookScene />
      </Sequence>
      
      {/* Gap: Music has nothing */}
      <Sequence from={60} durationInFrames={60}>
        <GapScene />
      </Sequence>
      
      {/* Market: 616M */}
      <Sequence from={120} durationInFrames={75}>
        <MarketScene />
      </Sequence>
      
      {/* Zero spent */}
      <Sequence from={195} durationInFrames={75}>
        <ZeroScene />
      </Sequence>
      
      {/* Logo reveal */}
      <Sequence from={270} durationInFrames={60}>
        <LogoScene />
      </Sequence>
      
      {/* Name */}
      <Sequence from={330} durationInFrames={45}>
        <NameScene />
      </Sequence>
      
      {/* Tagline */}
      <Sequence from={375} durationInFrames={60}>
        <TaglineScene />
      </Sequence>
      
      {/* First Spin */}
      <Sequence from={435} durationInFrames={90}>
        <FirstSpinScene />
      </Sequence>
      
      {/* Badges */}
      <Sequence from={525} durationInFrames={90}>
        <BadgesScene />
      </Sequence>
      
      {/* College Radio */}
      <Sequence from={615} durationInFrames={120}>
        <CollegeRadioScene />
      </Sequence>
      
      {/* The Ask */}
      <Sequence from={735} durationInFrames={90}>
        <AskScene />
      </Sequence>
      
      {/* Urgency */}
      <Sequence from={825} durationInFrames={75}>
        <UrgencyScene />
      </Sequence>
      
      {/* CTA */}
      <Sequence from={900} durationInFrames={150}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Square version for social
export const WaxFeedInvestorPromoSquare: React.FC = () => {
  return <WaxFeedInvestorPromo />;
};
