import { AbsoluteFill, Sequence } from "remotion";
import { VoidScene } from "./scenes/VoidScene";
import { FloodScene } from "./scenes/FloodScene";
import { RatingScene } from "./scenes/RatingScene";
import { FingerprintScene } from "./scenes/FingerprintScene";
import { MatchScene } from "./scenes/MatchScene";
import { EcosystemScene } from "./scenes/EcosystemScene";
import { ArtifactScene } from "./scenes/ArtifactScene";
import { InvitationScene } from "./scenes/InvitationScene";

/**
 * WaxFeed "FREQUENCY" Promo
 *
 * 90-second cinematic promo (2700 frames @ 30fps)
 * Transforms album data into visual art through 8 scenes.
 *
 * Scene Structure:
 * 1. THE VOID (0:00-0:05) - 150 frames
 * 2. THE FLOOD (0:05-0:15) - 300 frames
 * 3. THE RATING (0:15-0:28) - 390 frames
 * 4. THE FINGERPRINT (0:28-0:40) - 360 frames
 * 5. THE MATCH (0:40-0:55) - 450 frames
 * 6. THE ECOSYSTEM (0:55-1:10) - 450 frames
 * 7. THE ARTIFACT (1:10-1:20) - 300 frames
 * 8. THE INVITATION (1:20-1:30) - 300 frames
 */

export const WaxFeedFrequency: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Scene 1: THE VOID - 0:00-0:05 */}
      <Sequence from={0} durationInFrames={150}>
        <VoidScene />
      </Sequence>

      {/* Scene 2: THE FLOOD - 0:05-0:15 */}
      <Sequence from={150} durationInFrames={300}>
        <FloodScene />
      </Sequence>

      {/* Scene 3: THE RATING - 0:15-0:28 */}
      <Sequence from={450} durationInFrames={390}>
        <RatingScene />
      </Sequence>

      {/* Scene 4: THE FINGERPRINT - 0:28-0:40 */}
      <Sequence from={840} durationInFrames={360}>
        <FingerprintScene />
      </Sequence>

      {/* Scene 5: THE MATCH - 0:40-0:55 */}
      <Sequence from={1200} durationInFrames={450}>
        <MatchScene />
      </Sequence>

      {/* Scene 6: THE ECOSYSTEM - 0:55-1:10 */}
      <Sequence from={1650} durationInFrames={450}>
        <EcosystemScene />
      </Sequence>

      {/* Scene 7: THE ARTIFACT - 1:10-1:20 */}
      <Sequence from={2100} durationInFrames={300}>
        <ArtifactScene />
      </Sequence>

      {/* Scene 8: THE INVITATION - 1:20-1:30 */}
      <Sequence from={2400} durationInFrames={300}>
        <InvitationScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Square variant for social media (1:1)
export const WaxFeedFrequencySquare: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Same scene structure, components will adapt to square dimensions */}
      <Sequence from={0} durationInFrames={150}>
        <VoidScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={150} durationInFrames={300}>
        <FloodScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={450} durationInFrames={390}>
        <RatingScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={840} durationInFrames={360}>
        <FingerprintScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={1200} durationInFrames={450}>
        <MatchScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={1650} durationInFrames={450}>
        <EcosystemScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={2100} durationInFrames={300}>
        <ArtifactScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={2400} durationInFrames={300}>
        <InvitationScene width={1080} height={1080} />
      </Sequence>
    </AbsoluteFill>
  );
};
