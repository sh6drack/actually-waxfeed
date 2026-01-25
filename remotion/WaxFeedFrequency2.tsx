import { AbsoluteFill, Sequence } from "remotion";
import { HookScene } from "./scenes/HookScene";
import { StruggleScene } from "./scenes/StruggleScene";
import { RateScene } from "./scenes/RateScene";
import { MapScene } from "./scenes/MapScene";
import { MatchScene } from "./scenes/MatchScene";
import { ProofScene } from "./scenes/ProofScene";
import { CTAScene } from "./scenes/CTAScene";

/**
 * WaxFeed "FREQUENCY 2.0" - Gen Z Cut
 *
 * 30-second TikTok-ready promo (900 frames @ 30fps)
 * Hook → Problem → Solution → Proof → CTA
 *
 * Scene Structure:
 * 1. HOOK (0:00-0:03) - 90 frames - "what music are you into?" anxiety
 * 2. STRUGGLE (0:03-0:06) - 90 frames - "I listen to everything" cringe
 * 3. RATE (0:06-0:10) - 120 frames - Rating albums, satisfying swipes
 * 4. MAP (0:10-0:14) - 120 frames - Taste fingerprint + archetype reveal
 * 5. MATCH (0:14-0:19) - 150 frames - Finding your music people
 * 6. PROOF (0:19-0:24) - 150 frames - Social proof + stats
 * 7. CTA (0:24-0:30) - 180 frames - Logo + "waxfeed.com"
 */

export const WaxFeedFrequency2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Scene 1: THE HOOK - 3s */}
      <Sequence from={0} durationInFrames={90}>
        <HookScene />
      </Sequence>

      {/* Scene 2: THE STRUGGLE - 3s */}
      <Sequence from={90} durationInFrames={90}>
        <StruggleScene />
      </Sequence>

      {/* Scene 3: THE RATE - 4s */}
      <Sequence from={180} durationInFrames={120}>
        <RateScene />
      </Sequence>

      {/* Scene 4: THE MAP - 4s */}
      <Sequence from={300} durationInFrames={120}>
        <MapScene />
      </Sequence>

      {/* Scene 5: THE MATCH - 5s */}
      <Sequence from={420} durationInFrames={150}>
        <MatchScene />
      </Sequence>

      {/* Scene 6: THE PROOF - 5s */}
      <Sequence from={570} durationInFrames={150}>
        <ProofScene />
      </Sequence>

      {/* Scene 7: THE CTA - 6s */}
      <Sequence from={720} durationInFrames={180}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Vertical variant for TikTok/Reels (9:16)
export const WaxFeedFrequency2Vertical: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <Sequence from={0} durationInFrames={90}>
        <HookScene width={1080} height={1920} />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <StruggleScene width={1080} height={1920} />
      </Sequence>

      <Sequence from={180} durationInFrames={120}>
        <RateScene width={1080} height={1920} />
      </Sequence>

      <Sequence from={300} durationInFrames={120}>
        <MapScene width={1080} height={1920} />
      </Sequence>

      <Sequence from={420} durationInFrames={150}>
        <MatchScene width={1080} height={1920} />
      </Sequence>

      <Sequence from={570} durationInFrames={150}>
        <ProofScene width={1080} height={1920} />
      </Sequence>

      <Sequence from={720} durationInFrames={180}>
        <CTAScene width={1080} height={1920} />
      </Sequence>
    </AbsoluteFill>
  );
};
