# Polarity 1.2: Music Cognitive Modeling

*Synthesizing Polarity's cognitive fingerprinting with WAXFEED's TasteID system.*

---

## The Vision

**Polarity** models how you THINK through the Yeo 7-Network cognitive model.
**TasteID** models what music you LIKE through genre vectors and archetypes.

**Polarity 1.2** fuses these: modeling HOW you engage with music, not just WHAT you like.

---

## Mapping: Yeo Networks → Music Networks

Just as Polarity tracks which brain networks activate during conversation, we track which "listening modes" activate during music engagement.

| Yeo Network | Music Network | What It Captures |
|-------------|---------------|------------------|
| **FP** (Frontoparietal) | **Discovery Mode** | Active exploration, seeking new music, algorithm engagement |
| **DMN** (Default Mode) | **Comfort Mode** | Returning to favorites, nostalgia, familiar artists |
| **DA** (Dorsal Attention) | **Deep Dive Mode** | Focused artist/genre exploration, discography completion |
| **VA** (Ventral Attention) | **Reactive Mode** | Responding to trends, recommendations, social signals |
| **LIM** (Limbic) | **Emotional Mode** | Strong ratings (10s, 0s), emotional reviews, visceral reactions |
| **SMN** (Somatomotor) | **Social Mode** | Friend activity, shared playlists, community engagement |
| **VIS** (Visual) | **Aesthetic Mode** | Album art attraction, visual presentation, crate digging |

### Detection Signals

| Music Network | Detected By |
|---------------|-------------|
| **Discovery** | New artist ratings, algorithm-sourced albums, genre exploration |
| **Comfort** | Re-ratings of old favorites, same-artist clusters, decade regression |
| **Deep Dive** | Multiple albums same artist, chronological listening, completionist behavior |
| **Reactive** | Quick ratings after release, trending album engagement, friend-suggested reviews |
| **Emotional** | Rating extremes (0-2, 8-10), long emotional reviews, exclamation marks |
| **Social** | Reviews on friend-reviewed albums, follows from recommendations |
| **Aesthetic** | Vinyl interest, visual-first discovery, physical media preference |

---

## Listening Signature (Like BrainID)

Every user develops a **Listening Signature** - their characteristic pattern of music network activation.

### Example Signature

```
                    YOUR BASELINE           TYPICAL RANGE
Discovery           ████████████  35%      [20-30%]
Comfort             ████████      22%      [25-35%]
Deep Dive           ██████        18%      [10-20%]
Reactive            ███           10%      [15-25%]
Emotional           ████          12%      [10-20%]
Social              ░░             2%      [5-15%]
Aesthetic           ░              1%      [3-10%]
```

### Signature Patterns

Like Polarity's FP↔DMN oscillation, we detect characteristic patterns:

| Pattern | Description | Example Behavior |
|---------|-------------|------------------|
| **Discovery↔Comfort Oscillation** | Alternates between exploration and retreat | Rates 5 new albums, then re-rates 3 classics |
| **Deep Dive Sprints** | Periodic intense artist focus | Goes through entire Radiohead discography in a week |
| **Reactive Spikes** | Engages heavily with new releases | Reviews every Friday release |
| **Emotional Clusters** | Groups of strong ratings | Three 10s followed by a 0 |
| **Social Triggers** | Friend activity drives engagement | Reviews spike when friends are active |

---

## Memory Architecture for Music

Adapting Polarity's tiered memory system for music taste:

### Tier 1: Working Memory (Per-Session)
- Current listening session
- Albums being considered
- Active network states

### Tier 2: Episodic Memory (Per-Insight)
- Notable rating moments (first 10, first 0)
- Strong reviews with emotional content
- Discovery "aha" moments (new genre love)
- Artist revelations

### Tier 3: Semantic Memory (Per-Data)
- Genre preferences (factual)
- Artist knowledge
- Era expertise
- Objective taste data

### Tier 4: Pattern Memory (Per-Session Consolidation)
- Listening signature
- Network activation patterns
- Signature behaviors
- Taste drift tracking

### Tier 5: Prospective Memory (Per-Learning)
- Musical "future selves"
- Genre exploration queue
- Artist discographies to complete
- Skill trees for music knowledge

---

## Consolidation Factors

What makes music taste STICK? Same factors as cognitive memory:

| Factor | In Polarity | In Music |
|--------|-------------|----------|
| **Repetition** | Mentions across conversations | Repeated genre/artist engagement |
| **Emotional Charge** | Strong feeling expression | Strong ratings (10s, 0s), passionate reviews |
| **Connection** | Links to existing knowledge | Genre/artist connections, era clustering |
| **Novelty** | New concepts that engage | First encounter with genre that clicks |
| **Personal Relevance** | Identity-tied content | Music that defines who you are |

### Taste Persistence Scoring

Each rating/review gets scored for persistence potential:

```typescript
persistenceScore = (
  repetitionFactor * 0.25 +    // Have they engaged with this genre before?
  emotionalChargeFactor * 0.30 + // How extreme was the rating?
  connectionFactor * 0.20 +    // Does this connect to existing taste?
  noveltyFactor * 0.15 +       // Is this new territory for them?
  personalRelevanceFactor * 0.10 // Did they write about identity/meaning?
)
```

---

## Musical Future Selves

From Polarity's prospective memory: who are you BECOMING musically?

### Examples

| Future Self | Current Signals | Path |
|-------------|-----------------|------|
| **Jazz Connoisseur** | High ratings on jazz, curiosity about subgenres | Complete bebop canon → explore modal → free jazz |
| **Vinyl Archaeologist** | Interest in album art, physical media mentions | Start collection → crate digging → rare finds |
| **Genre Bridge Builder** | High adventureness, cross-genre appreciation | Connect disparate genres → build taste map |
| **Era Expert** | Decade obsession emerging | Master one decade → expand to adjacent |

---

## Polarity Score 2.0

Enhanced with cognitive factors:

```typescript
polarityScore = (
  // Original factors
  dataConfidence * 0.20 +        // Review count maturity
  ratingConsistency * 0.15 +     // Consistent rater?
  tasteDistinctiveness * 0.15 +  // How unique?
  engagementDepth * 0.10 +       // Written reviews?

  // New Polarity 1.2 factors
  signatureStrength * 0.15 +     // How clear is their listening signature?
  patternConsistency * 0.10 +    // Do patterns hold over time?
  memoryConsolidation * 0.10 +   // How stable is consolidated taste?
  futureSelfClarity * 0.05       // How clear are musical trajectories?
)
```

---

## Integration with WAXFEED

### Database Additions

```prisma
model TasteID {
  // ... existing fields ...

  // Polarity 1.2 fields
  listeningSignature    Json?     // Network activation baseline
  signaturePatterns     String[]  // Detected patterns
  memoryTier           Json?     // Memory architecture state
  futureSelvesMusic    Json?     // Prospective musical paths
  consolidationHistory Json?     // How taste has consolidated
  polarityScore2       Float?    // Enhanced score
}

model ListeningSession {
  id            String   @id @default(cuid())
  userId        String
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  networkStates Json     // Per-action network activations
  sessionType   String?  // "discovery", "comfort", "deep_dive", etc.

  user          User     @relation(fields: [userId], references: [id])
}
```

### API Enhancements

- `POST /api/tasteid/compute` → Also computes listening signature
- `GET /api/tasteid/signature` → Returns listening signature visualization
- `GET /api/tasteid/patterns` → Returns detected signature patterns
- `GET /api/tasteid/futures` → Returns musical future selves
- `POST /api/sessions/start` → Starts listening session tracking
- `POST /api/sessions/end` → Ends session, consolidates network states

---

## UI Components

### Signature Visualization
- Radar chart of music networks
- Compared to "typical" baseline
- Historical drift visualization

### Pattern Display
- "Your signature moves": Discovery↔Comfort Oscillation
- Pattern explanations in plain language

### Future Selves Dashboard
- Musical trajectories
- Skill trees for music knowledge
- "Your next genre journey" recommendations

---

## Research Questions

Carrying forward from Polarity:

1. **How unique are listening signatures?** Can we identify someone from their Discovery↔Comfort pattern alone?
2. **What's the minimum data needed?** How many ratings before signature stabilizes?
3. **Which patterns are most discriminating?** What signature aspects vary most between people?
4. **Are there "listening twins"?** People with nearly identical signatures?
5. **Does music signature correlate with cognitive signature?** Do FP-dominant thinkers have Discovery-dominant listening?

---

## Implementation Roadmap

### Phase 1: Signature Tracking
- [ ] Add network classification to review submission
- [ ] Compute listening signature on TasteID generation
- [ ] Store signature patterns

### Phase 2: Memory Architecture
- [ ] Implement episodic memory (notable moments)
- [ ] Implement pattern memory (consolidation)
- [ ] Track taste drift over time

### Phase 3: Future Selves
- [ ] Detect emerging musical trajectories
- [ ] Build skill trees for music knowledge
- [ ] Personalized discovery based on futures

### Phase 4: Research
- [ ] Collect signature data
- [ ] Analyze uniqueness
- [ ] Publish findings

---

*Polarity 1.2 - Know not just what you like, but how you listen.*
