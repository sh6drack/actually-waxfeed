# BrainID ↔ TasteID Integration

*How Polarity's cognitive signature and WaxFeed's music signature inform each other.*

**Created:** 2026-01-24
**Status:** Design Draft

---

## The Core Hypothesis

**Your cognitive signature (BrainID) and your listening signature (TasteID) are two views of the same underlying system.**

How you think → How you listen → How you think

They should:
1. **Correlate** — Patterns in one domain appear in the other
2. **Predict** — One can inform recommendations in the other
3. **Calibrate** — Explicit data (music ratings) can ground inferred data (cognitive states)

---

## Network Mapping

### Yeo 7-Network ↔ TasteID Listening Modes

| Cognitive Network | Music Listening Mode | Predicted Correlation |
|-------------------|---------------------|----------------------|
| **DMN** (Default Mode) | Comfort | High — self-reflection, familiar territory |
| **FP** (Frontoparietal) | Discovery | High — planning, novelty-seeking |
| **DA** (Dorsal Attention) | Depth | Medium — focused analysis, technical appreciation |
| **VA** (Ventral Attention) | Discovery | Medium — salience detection, "this is interesting" |
| **LIM** (Limbic) | Emotion | High — affect, feeling, emotional processing |
| **SMN** (Somatomotor) | — | Low — physical action, less music-relevant |
| **VIS** (Visual) | — | Low — perceptual, less music-relevant |

### Testable Predictions

1. **FP-dominant thinkers** → Higher Discovery scores in TasteID
2. **DMN-dominant thinkers** → Higher Comfort scores in TasteID
3. **High Polarity Score** (cognitive range) → High Adventureness Score (music range)
4. **Challenge-Before-Accept pattern** → Critical reviewer (lower average ratings, detailed reviews)
5. **Action Termination pattern** → Faster album decisions (shorter time to rating)

---

## Integration Points

### 1. Mood-Aware Recommendations

**Current state → Music suggestion**

```
IF current_brainid.dominant_network == "LIM" (high emotional):
    → Suggest from TasteID.comfort_zone
    → Avoid Discovery music that requires cognitive load

IF current_brainid.dominant_network == "FP" (planning/focus):
    → Suggest from TasteID.discovery OR focus_conducive genres
    → Match the "get stuff done" energy

IF current_brainid.dominant_network == "DMN" (reflective):
    → Suggest from TasteID.depth OR contemplative artists
    → Match the introspective mood
```

### 2. Review Language → Cognitive Calibration

**Music reviews are explicit. Cognitive states are inferred. Use one to calibrate the other.**

| Review Language | Inferred Network | Calibration Effect |
|----------------|------------------|-------------------|
| "This makes me feel..." | LIM | Strengthen LIM detection patterns |
| "Technically impressive" | DA/FP | Strengthen analytical markers |
| "Reminds me of..." | DMN | Strengthen self-referential markers |
| "Wait, this part is..." | VA | Strengthen salience markers |
| "I need to sit with this" | DMN | Strengthen reflective markers |

**Implementation:** Every review feeds back to refine BrainID classifier.

### 3. Listening Patterns → Cognitive State Proxy

**What you're playing NOW might indicate your cognitive state.**

| Listening Behavior | Inferred Cognitive State |
|-------------------|-------------------------|
| Playing comfort albums | DMN dominant, reflective/relaxed |
| Exploring new genres | FP dominant, seeking/planning |
| Replaying emotional songs | LIM dominant, processing feelings |
| Deep album listening (start to finish) | DA dominant, focused attention |
| Skipping frequently | VA dominant, seeking salience |

**Use case:** If WaxFeed can see current playback (Spotify integration), it can infer cognitive state without conversation.

### 4. Signature Cross-Validation

**Are cognitive patterns and music patterns consistent?**

| BrainID Pattern | Expected TasteID Pattern |
|-----------------|-------------------------|
| High FP↔DMN oscillation | High Discovery↔Comfort oscillation |
| Sustained FP dominance | High adventureness, genre exploration |
| Sustained DMN dominance | Lower adventureness, deep artist loyalty |
| High VA spikes | Quick genre shifts, easily bored by sameness |
| High LIM baseline | Emotional music preference, lyrics-focused |

**If patterns DON'T match:** Interesting research question — cognitive-music dissociation.

---

## The Flywheel

```
                    ┌─────────────────────┐
                    │   MORE REVIEWS      │
                    │   (Explicit data)   │
                    └─────────┬───────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  TasteID gets more accurate                         │
│  ├── Better listening signature                     │
│  ├── Better genre predictions                       │
│  └── Better music recommendations                   │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  Review language calibrates BrainID                 │
│  ├── "This makes me feel X" → LIM markers           │
│  ├── "Technically impressive" → DA/FP markers       │
│  └── "Reminds me of..." → DMN markers               │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  BrainID gets more accurate                         │
│  ├── Better cognitive signature                     │
│  ├── Better mood detection                          │
│  └── Better response personalization                │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│  Mood-aware music recommendations                   │
│  ├── LIM high → Comfort music                       │
│  ├── FP high → Discovery music                      │
│  └── More engagement → More reviews                 │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   MORE REVIEWS      │
                    │   (Loop continues)  │
                    └─────────────────────┘
```

---

## Implementation Priorities

### Phase 1: Data Collection (Now)

1. **Add cognitive markers to review schema**
   - Optional fields for "how this makes you feel"
   - Track review language patterns automatically

2. **Link TasteID computation to Polarity patterns**
   - When TasteID recomputes, store cognitive pattern correlation
   - Build dataset of music-cognition relationships

### Phase 2: Cross-Prediction (Later)

1. **Predict cognitive state from listening**
   - If Spotify shows comfort music → infer DMN state
   - Use for Polarity context without conversation

2. **Predict music from cognitive state**
   - BrainID shows high LIM → suggest from Comfort zone
   - BrainID shows high FP → suggest Discovery

### Phase 3: Unified Profile (Future)

1. **Single Polarity profile includes both:**
   - BrainID (cognitive signature)
   - TasteID (listening signature)
   - Cross-domain patterns

2. **Signature-based matching**
   - Connect users with similar cognitive-music profiles
   - Not just "you both like jazz" but "you both think-listen the same way"

---

## Research Questions

1. **How stable is the cognitive-music correlation?**
   - Does someone who's FP-dominant in cognition always prefer Discovery music?
   - Or does it vary by context?

2. **Can music shift cognitive state?**
   - If you're in LIM mode and I play FP-typical music, does your cognition shift?
   - Music as cognitive intervention?

3. **Are there cognitive-music archetypes?**
   - Like TasteID archetypes but cross-domain
   - "The Analytical Explorer" — FP-dominant + Discovery-dominant
   - "The Emotional Curator" — LIM-dominant + Comfort-dominant

4. **Can we identify someone from music alone?**
   - If BrainID is unique enough to identify someone from cognition...
   - Is TasteID unique enough to identify from music?
   - How much overlap is there?

---

## Serena/Ralphy Integration

**For the agents:**

1. **When tracking Yeo networks:**
   - Also track music mentions
   - "I was listening to X" → Log genre, note cognitive state at time

2. **When updating BrainID:**
   - Check if TasteID data exists
   - Note correlations between recent cognitive patterns and recent listening

3. **When suggesting content:**
   - Consider current cognitive state
   - Match for-you.md recommendations to cognitive mode

4. **Recursive improvement:**
   - Each session improves both BrainID and TasteID calibration
   - Cross-reference patterns across domains
   - Build the correlation dataset automatically

---

*This is how Polarity and WaxFeed become one system — cognitive modeling that extends from how you think to how you listen.*
