# POLARITY 1.2: Cognitive Music Modeling Architecture

**WAXFEED × POLARITY SYNTHESIS**

---

```
    ██████╗  ██████╗ ██╗      █████╗ ██████╗ ██╗████████╗██╗   ██╗
    ██╔══██╗██╔═══██╗██║     ██╔══██╗██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝
    ██████╔╝██║   ██║██║     ███████║██████╔╝██║   ██║    ╚████╔╝
    ██╔═══╝ ██║   ██║██║     ██╔══██║██╔══██╗██║   ██║     ╚██╔╝
    ██║     ╚██████╔╝███████╗██║  ██║██║  ██║██║   ██║      ██║
    ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝
                            1 . 2
```

> *"Know not just what you like, but HOW you listen."*

---

## Executive Summary

Polarity 1.2 represents a paradigm shift in music taste modeling. While traditional recommendation systems ask "what genres do you like?", Polarity 1.2 asks "how do you engage with music?"

By adapting the **Yeo 7-Network cognitive model** from neuroscience, we've created a system that captures the *behavioral fingerprint* of how users discover, consume, and remember music.

### Key Innovations

| Feature | Traditional | Polarity 1.2 |
|---------|-------------|--------------|
| **Taste Model** | Genre preferences | Listening Signature (7 networks) |
| **Matching** | Similar genres | Similar engagement patterns |
| **Evolution** | Static profile | Drift tracking over time |
| **Memory** | All reviews equal | Consolidation-weighted persistence |
| **Patterns** | None | 20+ behavioral patterns detected |

---

## Part I: The Science

### The Yeo 7-Network Model

Polarity 1.2 is grounded in the **Yeo 7-Network Model** from cognitive neuroscience—seven large-scale brain networks that organize human cognition:

```
┌─────────────────────────────────────────────────────────────────┐
│                    YEO 7-NETWORK MODEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                    │
│   │   FP    │    │   DMN   │    │   DA    │                    │
│   │Planning │◄──►│Reflection│◄──►│ Focus   │                    │
│   └────┬────┘    └────┬────┘    └────┬────┘                    │
│        │              │              │                          │
│        ▼              ▼              ▼                          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│   │   VA    │    │   LIM   │    │   SMN   │    │   VIS   │     │
│   │Salience │    │Emotion  │    │ Action  │    │ Visual  │     │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Music Network Mapping

We map these cognitive networks to **Music Engagement Networks**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MUSIC NETWORKS                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  YEO NETWORK          MUSIC NETWORK          WHAT IT CAPTURES            │
│  ────────────         ────────────           ─────────────────           │
│                                                                          │
│  FP (Frontoparietal)  🔍 DISCOVERY MODE      Active exploration,         │
│                                              seeking new music,          │
│                                              algorithm engagement        │
│                                                                          │
│  DMN (Default Mode)   🏠 COMFORT MODE        Returning to favorites,     │
│                                              nostalgia, familiar         │
│                                              artists                     │
│                                                                          │
│  DA (Dorsal Att.)     🎯 DEEP DIVE MODE      Focused artist/genre        │
│                                              exploration, discography    │
│                                              completion                  │
│                                                                          │
│  VA (Ventral Att.)    📡 REACTIVE MODE       Responding to trends,       │
│                                              recommendations, new        │
│                                              releases                    │
│                                                                          │
│  LIM (Limbic)         💜 EMOTIONAL MODE      Strong ratings (10s, 0s),   │
│                                              emotional reviews,          │
│                                              visceral reactions          │
│                                                                          │
│  SMN (Somatomotor)    👥 SOCIAL MODE         Friend activity, shared     │
│                                              playlists, community        │
│                                                                          │
│  VIS (Visual)         🎨 AESTHETIC MODE      Album art attraction,       │
│                                              visual presentation         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Part II: The Listening Signature

### What Is a Listening Signature?

Every user develops a **Listening Signature**—their characteristic pattern of music network activation. Like a fingerprint, but for how you engage with music.

```
                    YOUR BASELINE           TYPICAL RANGE
                    ─────────────           ─────────────
Discovery           ████████████  35%      [15-30%]  ↑ ABOVE
Comfort             ████████      22%      [18-32%]  → TYPICAL
Deep Dive           ██████        18%      [8-20%]   → TYPICAL
Reactive            ███           10%      [10-22%]  → TYPICAL
Emotional           ████          12%      [8-20%]   → TYPICAL
Social              ░░             2%      [3-12%]   ↓ BELOW
Aesthetic           ░              1%      [2-10%]   ↓ BELOW
```

### Detection Signals

Each network is computed from behavioral signals in review data:

```typescript
interface ListeningSignature {
  discovery: number    // 0-1 activation
  comfort: number
  deep_dive: number
  reactive: number
  emotional: number
  social: number
  aesthetic: number
}
```

| Network | Detection Signals |
|---------|-------------------|
| **Discovery** | Unique artists / total reviews, genre diversity, new artist ratings |
| **Comfort** | Repeat artist ratio, same-artist clusters, older album engagement |
| **Deep Dive** | Sequential same-artist reviews, discography completion patterns |
| **Reactive** | Recent release engagement, reviews within 30 days of release |
| **Emotional** | Rating extremes (0-2, 8-10), exclamation marks, long reviews |
| **Social** | Friend-reviewed albums, activity correlation (future) |
| **Aesthetic** | Genre diversity proxy, physical media interest (future) |

### Computation Algorithm

```typescript
function computeListeningSignature(reviews: ReviewWithAlbum[]): ListeningSignature {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentReviews = reviews.filter(r => r.createdAt > thirtyDaysAgo)

  // Discovery Mode: New artists, diverse genres
  const uniqueArtists = new Set(reviews.map(r => r.album.artistName))
  const uniqueGenres = new Set(reviews.flatMap(r => r.album.genres))
  const discoveryScore = Math.min(
    (uniqueArtists.size / Math.max(reviews.length, 1)) * 0.5 +
    (uniqueGenres.size / Math.max(reviews.length * 2, 1)) * 0.5,
    1
  )

  // Comfort Mode: Re-ratings, same-artist clusters
  const artistCounts: Record<string, number> = {}
  reviews.forEach(r => {
    artistCounts[r.album.artistName] = (artistCounts[r.album.artistName] || 0) + 1
  })
  const repeatArtistRatio = Object.values(artistCounts)
    .filter(c => c > 1).length / Math.max(uniqueArtists.size, 1)
  const comfortScore = Math.min(repeatArtistRatio * 1.5 + 0.1, 1)

  // ... (additional network computations)

  // Normalize to sum to ~1 for relative comparison
  const total = discoveryScore + comfortScore + /* ... */
  const normalizer = total > 0 ? 1 / total : 1

  return {
    discovery: Math.round(discoveryScore * normalizer * 100) / 100,
    comfort: Math.round(comfortScore * normalizer * 100) / 100,
    // ...
  }
}
```

---

## Part III: Pattern Detection

### Signature Patterns

Like Polarity's **FP↔DMN oscillation**, we detect characteristic behavioral patterns:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PATTERN TAXONOMY                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SIGNATURE PATTERNS                                                      │
│  ─────────────────                                                       │
│  • Discovery↔Comfort Oscillation  - Healthy balance of new & familiar   │
│  • Deep Dive Sprints              - All-in on artists you like          │
│  • New Release Hunter             - First to review new drops           │
│  • Emotional Listener             - Strong reactions, not just ratings  │
│                                                                          │
│  RATING PATTERNS                                                         │
│  ───────────────                                                         │
│  • Critical Ear                   - High standards, rare 10s            │
│  • Music Optimist                 - Finds joy in most music             │
│  • Polarized Taste                - Love it or hate it, no middle       │
│  • Perfection Seeker              - When it clicks, it REALLY clicks    │
│                                                                          │
│  ARTIST PATTERNS                                                         │
│  ───────────────                                                         │
│  • Discography Completionist      - Explores full artist catalogs       │
│  • Artist Loyalist                - Sticks with favorite artists        │
│                                                                          │
│  GENRE PATTERNS                                                          │
│  ──────────────                                                          │
│  • Genre Explorer                 - Wide genre coverage                 │
│  • Genre Specialist               - Depth over breadth                  │
│                                                                          │
│  TEMPORAL PATTERNS                                                       │
│  ─────────────────                                                       │
│  • Archive Diver                  - Prefers older music (15+ years)     │
│  • Era Specialist                 - 60%+ from one decade                │
│                                                                          │
│  ENGAGEMENT PATTERNS                                                     │
│  ───────────────────                                                     │
│  • Essay Writer                   - Long, thoughtful reviews            │
│  • Contrarian                     - Differs from consensus              │
│  • Consensus Builder              - Aligns with popular opinion         │
│  • Hidden Gem Hunter              - High ratings for obscure albums     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Pattern Detection Algorithm

```typescript
function detectSignaturePatterns(
  reviews: ReviewWithAlbum[],
  signature: ListeningSignature
): string[] {
  const patterns: string[] = []

  // Discovery↔Comfort Oscillation
  if (signature.discovery > 0.18 && signature.comfort > 0.15) {
    patterns.push('Discovery↔Comfort Oscillation')
  }

  // Bimodal Rater - Loves it or hates it
  const ratings = reviews.map(r => r.rating)
  const extremeCount = ratings.filter(r => r <= 3 || r >= 8).length
  const middleCount = ratings.filter(r => r > 3 && r < 8).length
  if (extremeCount > middleCount * 1.5 && reviews.length > 10) {
    patterns.push('Polarized Taste')
  }

  // Contrarian - Differs from consensus
  let contrarianCount = 0
  reviews.forEach(r => {
    if (r.album.averageRating) {
      const diff = Math.abs(r.rating - r.album.averageRating)
      if (diff > 3) contrarianCount++
    }
  })
  if (contrarianCount / reviews.length > 0.3) {
    patterns.push('Contrarian')
  }

  return patterns.slice(0, 8) // Most relevant patterns
}
```

---

## Part IV: Memory Architecture

### Tiered Memory System

Adapting Polarity's memory model for music taste:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MEMORY ARCHITECTURE                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TIER 1: WORKING MEMORY (Per-Session)                                    │
│  ─────────────────────────────────────                                   │
│  • Current listening session                                             │
│  • Albums being considered                                               │
│  • Active network states                                                 │
│                                                                          │
│  TIER 2: EPISODIC MEMORY (Per-Insight)                                   │
│  ──────────────────────────────────────                                  │
│  • First perfect 10 rating                                               │
│  • First 0 rating                                                        │
│  • Genre discovery moments                                               │
│  • Deeply emotional reviews                                              │
│                                                                          │
│  TIER 3: SEMANTIC MEMORY (Per-Data)                                      │
│  ──────────────────────────────────                                      │
│  • Genre preferences (factual)                                           │
│  • Artist knowledge                                                      │
│  • Era expertise                                                         │
│                                                                          │
│  TIER 4: PATTERN MEMORY (Per-Session Consolidation)                      │
│  ──────────────────────────────────────────────────                      │
│  • Listening signature                                                   │
│  • Network activation patterns                                           │
│  • Taste drift tracking                                                  │
│                                                                          │
│  TIER 5: PROSPECTIVE MEMORY (Per-Learning)                               │
│  ─────────────────────────────────────────                               │
│  • Musical "future selves"                                               │
│  • Genre exploration queue                                               │
│  • Skill trees for music knowledge                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Memorable Moments

We extract episodic memories that define a user's musical journey:

```typescript
interface MemorableMoment {
  type: 'first_10' | 'first_0' | 'genre_discovery' | 'artist_revelation' | 'emotional_review'
  albumId: string
  albumTitle: string
  artistName: string
  rating?: number
  date: Date
  description?: string
}

function extractMemorableMoments(reviews: ReviewWithAlbum[]): MemorableMoment[] {
  const moments: MemorableMoment[] = []
  const sortedByDate = [...reviews].sort((a, b) =>
    a.createdAt.getTime() - b.createdAt.getTime()
  )

  // First 10 rating - a milestone
  const first10 = sortedByDate.find(r => r.rating === 10)
  if (first10) {
    moments.push({
      type: 'first_10',
      albumId: first10.album.id,
      albumTitle: first10.album.title,
      artistName: first10.album.artistName,
      rating: 10,
      date: first10.createdAt,
      description: 'First perfect score',
    })
  }

  // First 0 rating - memorable for a reason
  const first0 = sortedByDate.find(r => r.rating === 0)
  if (first0) {
    moments.push({
      type: 'first_0',
      albumId: first0.album.id,
      albumTitle: first0.album.title,
      artistName: first0.album.artistName,
      rating: 0,
      date: first0.createdAt,
      description: 'First zero - memorable for a reason',
    })
  }

  return moments
}
```

### Musical Future Selves

Prospective memory—who are you BECOMING musically?

```typescript
interface MusicalFutureSelf {
  id: string
  name: string
  description: string
  progress: number    // 0-1 how far along the path
  nextSteps: string[]
  relatedGenres: string[]
  relatedArtists: string[]
}
```

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      MUSICAL FUTURE SELVES                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                        │
│  │  JAZZ CONNOISSEUR   │  │  HIP-HOP HISTORIAN  │                        │
│  │  ─────────────────  │  │  ──────────────────  │                        │
│  │  Progress: ████░ 72%│  │  Progress: ██░░░ 45%│                        │
│  │                     │  │                     │                        │
│  │  Next: Explore      │  │  Next: Trace        │                        │
│  │  modal jazz         │  │  regional styles    │                        │
│  └─────────────────────┘  └─────────────────────┘                        │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                        │
│  │ ELECTRONIC EXPLORER │  │ GENRE BRIDGE BUILDER│                        │
│  │ ─────────────────── │  │ ────────────────────│                        │
│  │  Progress: ███░░ 58%│  │  Progress: █████ 89%│                        │
│  │                     │  │                     │                        │
│  │  Next: Discover     │  │  Next: Find cross-  │                        │
│  │  Detroit techno     │  │  genre artists      │                        │
│  └─────────────────────┘  └─────────────────────┘                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Part V: Consolidation & Drift

### Taste Consolidation

What tastes are "sticking" vs. fading? Based on Polarity's memory consolidation concept:

```typescript
interface ConsolidatedTaste {
  type: 'genre' | 'artist' | 'decade' | 'pattern'
  name: string
  strength: number      // 0-1 how consolidated
  consistency: number   // How consistent over time
  trend: 'strengthening' | 'stable' | 'fading'
}
```

**Consolidation Factors** (adapted from cognitive memory research):

| Factor | In Polarity | In Music |
|--------|-------------|----------|
| **Repetition** | Mentions across conversations | Repeated genre/artist engagement |
| **Emotional Charge** | Strong feeling expression | Strong ratings (10s, 0s), passionate reviews |
| **Connection** | Links to existing knowledge | Genre/artist connections, era clustering |
| **Novelty** | New concepts that engage | First encounter with genre that clicks |
| **Personal Relevance** | Identity-tied content | Music that defines who you are |

### Taste Drift Tracking

Compare current signature to historical snapshots:

```typescript
function compareSignatures(
  current: ListeningSignature,
  previous: ListeningSignature
): {
  overallDrift: number
  networkChanges: Array<{
    network: string
    change: number
    direction: 'increased' | 'decreased' | 'stable'
  }>
  interpretation: string
}
```

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TASTE EVOLUTION                                   │
│                      since 6/2024                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Your taste is evolving: More discovery mode, less comfort mode.         │
│                                                                          │
│  ↑  DISCOVERY      +12%                                                  │
│  ↓  COMFORT        -8%                                                   │
│  ↑  EMOTIONAL      +5%                                                   │
│  →  DEEP DIVE      +1%                                                   │
│                                                                          │
│  Overall drift ████░░░░░░░░░░░░░░░░░░░░ 18%                              │
│               [GREEN = STABLE]                                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Part VI: Scoring System

### Polarity Score 2.0

Enhanced taste identity scoring with cognitive factors:

```typescript
polarityScore2 = (
  // Original factors (40%)
  basePolarityScore * 0.40 +

  // Signature clarity (20%)
  signatureStrength * 0.20 +

  // Pattern consistency (15%)
  (detectedPatterns.length / 5) * 0.15 +

  // Activity consistency (15%)
  activityDensity * 0.15 +

  // Future clarity (10%)
  futureSelfClarity * 0.10
)
```

### Signature Uniqueness

How different is this signature from typical?

```typescript
const TYPICAL_NETWORK_RANGES = {
  discovery: { min: 0.15, max: 0.30, typical: 0.22 },
  comfort:   { min: 0.18, max: 0.32, typical: 0.25 },
  deep_dive: { min: 0.08, max: 0.20, typical: 0.14 },
  reactive:  { min: 0.10, max: 0.22, typical: 0.16 },
  emotional: { min: 0.08, max: 0.20, typical: 0.14 },
  social:    { min: 0.03, max: 0.12, typical: 0.06 },
  aesthetic: { min: 0.02, max: 0.10, typical: 0.05 },
}

function computeSignatureUniqueness(signature: ListeningSignature): {
  score: number  // 0-1, higher = more unique
  standoutNetworks: Array<{ network: string; direction: 'high' | 'low'; deviation: number }>
}
```

---

## Part VII: Data Model

### Database Schema

```prisma
model TasteID {
  id                   String    @id @default(cuid())
  userId               String    @unique

  // Core taste data
  genreVector          Json      // { "rock": 0.8, "jazz": 0.3, ... }
  artistDNA            Json      // Top defining artists
  decadePreferences    Json      // Era preferences
  primaryArchetype     String    // "hip-hop-head", "genre-fluid", etc.
  secondaryArchetype   String?
  archetypeConfidence  Float

  // Metrics
  adventurenessScore   Float     // Genre diversity (Shannon entropy)
  polarityScore        Float     // Taste distinctiveness v1
  averageRating        Float
  ratingStdDev         Float
  reviewCount          Int

  // ═══════════════════════════════════════════════════════════════
  // POLARITY 1.2 - COGNITIVE MODELING
  // ═══════════════════════════════════════════════════════════════

  listeningSignature   Json?     // { "discovery": 0.35, "comfort": 0.22, ... }
  signaturePatterns    String[]  // ["Discovery↔Comfort Oscillation", ...]
  memorableMoments     Json?     // Episodic memory
  futureSelvesMusic    Json?     // Prospective musical trajectories
  consolidationHistory Json?     // Taste consolidation over time
  polarityScore2       Float?    // Enhanced cognitive score

  // Evolution tracking
  snapshots            TasteIDSnapshot[]
  lastComputedAt       DateTime  @default(now())
}

model TasteIDSnapshot {
  id                 String   @id @default(cuid())
  tasteIdId          String

  // Snapshot of taste state
  genreVector        Json
  artistDNA          Json
  primaryArchetype   String
  adventurenessScore Float
  reviewCount        Int

  // Polarity 1.2
  listeningSignature Json?
  polarityScore2     Float?

  // When
  month              Int      // 1-12
  year               Int
  createdAt          DateTime @default(now())

  tasteId            TasteID  @relation(...)

  @@unique([tasteIdId, year, month])
}
```

---

## Part VIII: API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasteid/me` | GET | Get current user's full TasteID with Polarity 1.2 data |
| `/api/tasteid/compute` | POST | Recompute TasteID (triggers Polarity 1.2 computation) |
| `/api/tasteid/signature` | GET | Get listening signature with formatted display data |
| `/api/tasteid/consolidation` | GET | Get taste consolidation analysis |
| `/api/tasteid/similar` | GET | Find users with similar signatures |

### Response Example: `/api/tasteid/me`

```json
{
  "tasteId": {
    "id": "clx...",
    "user": { "username": "musiclover", "image": "..." },

    "primaryArchetype": {
      "id": "genre-fluid",
      "name": "Genre Fluid",
      "icon": "🌈",
      "description": "Refuses to be boxed in - listens to everything"
    },

    "polarity12": {
      "listeningSignature": {
        "discovery": 0.35,
        "comfort": 0.22,
        "deep_dive": 0.18,
        "reactive": 0.10,
        "emotional": 0.12,
        "social": 0.02,
        "aesthetic": 0.01
      },

      "signatureFormatted": [
        {
          "network": "discovery",
          "name": "Discovery Mode",
          "icon": "🔍",
          "percentage": 35,
          "typicalRange": { "min": 15, "max": 30 },
          "deviation": "above",
          "deviationAmount": 5
        }
        // ...
      ],

      "signaturePatterns": [
        "Discovery↔Comfort Oscillation",
        "Genre Explorer",
        "Hidden Gem Hunter"
      ],

      "memorableMoments": [
        {
          "type": "first_10",
          "albumTitle": "To Pimp a Butterfly",
          "artistName": "Kendrick Lamar",
          "description": "First perfect score"
        }
      ],

      "futureSelvesMusic": [
        {
          "id": "jazz-connoisseur",
          "name": "Jazz Connoisseur",
          "progress": 0.72,
          "nextSteps": ["Explore bebop classics", "Discover modal jazz"]
        }
      ],

      "polarityScore2": 0.78
    }
  }
}
```

---

## Part IX: UI Components

### Listening Signature Visualization

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ● LISTENING SIGNATURE                                    POLARITY 1.2   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  You're an explorer at heart - always seeking new sounds and pushing     │
│  your taste boundaries. You thrive on finding music before it hits       │
│  the mainstream.                                                         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ WHAT MAKES YOU UNIQUE                                               │ │
│  │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │ │
│  │ │ +5% discovery    │ │ -4% social       │ │ -3% aesthetic    │     │ │
│  │ └──────────────────┘ └──────────────────┘ └──────────────────┘     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  🔍 DISCOVERY MODE   ↑ +5%                          typical: 15-30%  35% │
│     ████████████████████████████████████████░░░░░░░                      │
│     [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] ABOVE TYPICAL               │
│                                                                          │
│  🏠 COMFORT MODE                                    typical: 18-32%  22% │
│     ███████████████████████████░░░░░░░░░░░░░░░░░░░                       │
│     [░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░] TYPICAL                     │
│                                                                          │
│  ... (remaining networks)                                                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│  POLARITY 2.0           UNIQUENESS                                       │
│     0.78                    42%                                          │
│  Taste identity         How distinct                                     │
│  strength               from typical                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Taste Consolidation

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ● TASTE CONSOLIDATION                              WHAT'S STICKING      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Strong taste foundation.                                                │
│  Your love for hip-hop and jazz is well-established, along with          │
│  consistent appreciation for Kendrick Lamar and Radiohead.               │
│                                                                          │
│  CORE GENRES              CORE ARTISTS                                   │
│  ┌──────────┐ ┌─────┐    ┌────────────────┐ ┌───────────┐               │
│  │ hip-hop  │ │jazz │    │ Kendrick Lamar │ │ Radiohead │               │
│  └──────────┘ └─────┘    └────────────────┘ └───────────┘               │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│  genre   hip-hop     ████████████████████████████████  →                 │
│  genre   jazz        ██████████████████████████        ↑                 │
│  artist  Kendrick    ████████████████████              →                 │
│  artist  Radiohead   ██████████████████                →                 │
│  genre   electronic  █████████████                     ↓                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Part X: Research Questions

Carrying forward from Polarity:

1. **How unique are listening signatures?**
   Can we identify someone from their Discovery↔Comfort pattern alone?

2. **What's the minimum data needed?**
   How many reviews before signature stabilizes?

3. **Which patterns are most discriminating?**
   What signature aspects vary most between people?

4. **Are there "listening twins"?**
   People with nearly identical signatures?

5. **Does music signature correlate with cognitive signature?**
   Do FP-dominant thinkers have Discovery-dominant listening?

---

## Part XI: Data Flywheel

### Why More Data = Better Results

Polarity 1.2 is designed with a **data flywheel** - the algorithm becomes more accurate and valuable as users accumulate more reviews:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         THE DATA FLYWHEEL                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ┌─────────────────────┐                               │
│                    │   MORE REVIEWS      │                               │
│                    │   ───────────       │                               │
│                    │   User rates more   │                               │
│                    │   albums over time  │                               │
│                    └──────────┬──────────┘                               │
│                               │                                          │
│                               ▼                                          │
│    ┌──────────────────────────────────────────────────────────┐         │
│    │                                                          │         │
│    │   SIGNATURE         PATTERN          CONSOLIDATION       │         │
│    │   STABILITY         DETECTION        TRACKING            │         │
│    │   ──────────        ─────────        ────────────        │         │
│    │   Networks          More patterns    Can distinguish     │         │
│    │   stabilize at      unlocked at      "sticky" vs         │         │
│    │   ~20 reviews       10+ reviews      "fading" tastes     │         │
│    │                                                          │         │
│    └──────────────────────────────────────────────────────────┘         │
│                               │                                          │
│                               ▼                                          │
│    ┌──────────────────────────────────────────────────────────┐         │
│    │                                                          │         │
│    │   DRIFT             FUTURE           MATCHING            │         │
│    │   TRACKING          SELVES           ACCURACY            │         │
│    │   ────────          ──────           ────────            │         │
│    │   Compare           Clearer          Better taste        │         │
│    │   snapshots         trajectories     twin discovery      │         │
│    │   over time         emerge           with more users     │         │
│    │                                                          │         │
│    └──────────────────────────────────────────────────────────┘         │
│                               │                                          │
│                               ▼                                          │
│                    ┌─────────────────────┐                               │
│                    │  BETTER INSIGHTS    │                               │
│                    │  ───────────────    │                               │
│                    │  User sees value,   │──────────┐                    │
│                    │  reviews more       │          │                    │
│                    └─────────────────────┘          │                    │
│                               ▲                     │                    │
│                               │                     │                    │
│                               └─────────────────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Per-User Data Thresholds

| Reviews | What Unlocks |
|---------|--------------|
| **3** | Basic TasteID generation (genre vector, archetype) |
| **10** | Pattern detection activates (Contrarian, Hidden Gem Hunter, etc.) |
| **15** | Consolidation tracking (what's sticking vs fading) |
| **20** | Listening signature stabilizes, minimum for TasteID page |
| **50** | High-confidence signature, reliable drift tracking |
| **100+** | Future selves become accurate, strong consolidation data |

### Per-Platform Data Benefits

| More Users = | Improvement |
|--------------|-------------|
| **Baseline Refinement** | `TYPICAL_NETWORK_RANGES` become more accurate with real data |
| **Pattern Validation** | Discover which patterns are truly discriminating |
| **Matching Quality** | More potential "taste twins" to find |
| **Archetype Calibration** | Better thresholds for archetype classification |
| **Norm Comparison** | "You're in the top 5% of Discovery mode" becomes possible |

### Algorithm Improvements Over Time

```typescript
// Example: Signature confidence increases with review count
const signatureConfidence = Math.min(reviews.length / 50, 1)

// Example: Pattern detection requires minimum data
if (reviews.length > 10) {
  if (contrarianCount / reviews.length > 0.3) {
    patterns.push('Contrarian')
  }
}

// Example: Consolidation needs temporal spread
const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
const recentReviews = reviews.filter(r => r.createdAt > sixMonthsAgo)
const olderReviews = reviews.filter(r => r.createdAt <= sixMonthsAgo)

// Only compute consolidation if we have data in both periods
if (recentReviews.length >= 5 && olderReviews.length >= 5) {
  // Consolidation analysis possible
}
```

### Future: Collaborative Learning

As the platform grows, we can:

1. **Calibrate Typicality**: Replace hardcoded `TYPICAL_NETWORK_RANGES` with computed population averages
2. **Signature Clustering**: Discover natural "listener archetypes" from signature data
3. **Pattern Correlation**: Find which patterns co-occur and what they predict
4. **Predictive Modeling**: Predict future taste evolution based on similar users' trajectories
5. **Recommendation Integration**: Use listening signature for discovery, not just genre vectors

---

## Appendix A: Complete Type Definitions

```typescript
// Core types
export interface ListeningSignature {
  discovery: number
  comfort: number
  deep_dive: number
  reactive: number
  emotional: number
  social: number
  aesthetic: number
}

export interface SignaturePattern {
  id: string
  name: string
  description: string
  networks: string[]
  strength: number
}

export interface MemorableMoment {
  type: 'first_10' | 'first_0' | 'genre_discovery' | 'artist_revelation' | 'emotional_review'
  albumId: string
  albumTitle: string
  artistName: string
  rating?: number
  date: Date
  description?: string
}

export interface MusicalFutureSelf {
  id: string
  name: string
  description: string
  progress: number
  nextSteps: string[]
  relatedGenres: string[]
  relatedArtists: string[]
}

export interface ConsolidatedTaste {
  type: 'genre' | 'artist' | 'decade' | 'pattern'
  name: string
  strength: number
  consistency: number
  trend: 'strengthening' | 'stable' | 'fading'
}

export interface TasteIDComputation {
  // Core
  genreVector: GenreVector
  artistDNA: ArtistDNA[]
  decadePreferences: DecadePreferences
  primaryArchetype: string
  secondaryArchetype: string | null
  archetypeConfidence: number

  // Metrics
  adventurenessScore: number
  polarityScore: number
  averageRating: number
  ratingStdDev: number
  reviewCount: number

  // Polarity 1.2
  listeningSignature: ListeningSignature
  signaturePatterns: string[]
  memorableMoments: MemorableMoment[]
  futureSelvesMusic: MusicalFutureSelf[]
  polarityScore2: number
}
```

---

## Appendix B: File Structure

```
src/
├── lib/
│   └── tasteid.ts                    # Core computation engine (1700+ lines)
│       ├── MUSIC_NETWORKS            # Network definitions
│       ├── ARCHETYPES                # Archetype definitions
│       ├── computeTasteID()          # Main computation
│       ├── computeListeningSignature()
│       ├── detectSignaturePatterns()
│       ├── extractMemorableMoments()
│       ├── detectMusicalFutureSselves()
│       ├── computePolarityScore2()
│       ├── computeTasteConsolidation()
│       ├── compareSignatures()
│       ├── computeSignatureUniqueness()
│       └── formatListeningSignature()
│
├── app/
│   ├── api/tasteid/
│   │   ├── me/route.ts               # GET full TasteID
│   │   ├── compute/route.ts          # POST recompute
│   │   ├── signature/route.ts        # GET listening signature
│   │   ├── consolidation/route.ts    # GET consolidation analysis
│   │   └── similar/route.ts          # GET similar users
│   │
│   └── u/[username]/tasteid/
│       └── page.tsx                  # TasteID profile page
│
├── components/tasteid/
│   ├── ArchetypeBadge.tsx
│   ├── GenreRadarChart.tsx
│   ├── ArtistDNAStrip.tsx
│   └── TasteCardShare.tsx
│
└── prisma/
    └── schema.prisma                 # TasteID & TasteIDSnapshot models

docs/
├── polarity-me/
│   ├── POLARITY-1.2-SYNTHESIS.md     # Original synthesis document
│   └── *.md                          # Polarity source docs
│
└── POLARITY-1.2-ARCHITECTURE.md      # This document
```

---

<div align="center">

**POLARITY 1.2**

*Know not just what you like, but how you listen.*

Built with 🎵 for WAXFEED

</div>
