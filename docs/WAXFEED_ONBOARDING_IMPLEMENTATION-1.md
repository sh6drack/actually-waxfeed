# WAXFEED ONBOARDING IMPLEMENTATION SPEC
## Comprehensive Technical Specification for Cursor

**Version**: 1.0  
**Created**: January 15, 2026  
**Purpose**: Complete implementation guide for dopamine-optimized onboarding flow  
**Target**: Cursor AI / Developer Implementation

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [User Flow Diagram](#user-flow-diagram)
3. [Screen Specifications](#screen-specifications)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Endpoints](#api-endpoints)
7. [Data Models](#data-models)
8. [Animations & Transitions](#animations--transitions)
9. [Copy & Microcopy](#copy--microcopy)
10. [Styling & Design System](#styling--design-system)
11. [Edge Cases](#edge-cases)
12. [Testing Requirements](#testing-requirements)
13. [Implementation Checklist](#implementation-checklist)

---

## OVERVIEW

### Goal

Create an onboarding flow that:
1. Gets users to rate 5 albums in under 60 seconds
2. Reveals a personalized "Taste Type" to create dopamine hit
3. Shows compatible users to prove social value
4. Creates a return hook via album prediction
5. Maximizes Day 1 and Day 7 retention

### Success Metrics

| Metric | Target |
|--------|--------|
| Onboarding completion rate | >70% |
| Time to complete | <90 seconds |
| Day 1 return rate | >40% |
| Day 7 return rate | >25% |

### Tech Stack Assumptions

- **Frontend**: React/Next.js (or React Native for mobile)
- **Styling**: Tailwind CSS or styled-components
- **State**: React Context or Zustand
- **API**: REST or GraphQL
- **Database**: PostgreSQL (existing WaxFeed backend)

---

## USER FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONBOARDING FLOW                                    │
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  WELCOME │───▶│  RATING  │───▶│ ANALYSIS │───▶│  TASTE   │              │
│  │  SCREEN  │    │  FLOW    │    │  LOADER  │    │  REVEAL  │              │
│  │          │    │ (5 albums)│    │          │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │               │                     │
│       │               │               │               ▼                     │
│       │               │               │         ┌──────────┐               │
│       │               │               │         │  MATCHES │               │
│       │               │               │         │  SCREEN  │               │
│       │               │               │         └──────────┘               │
│       │               │               │               │                     │
│       │               │               │               ▼                     │
│       │               │               │         ┌──────────┐               │
│       │               │               │         │PREDICTION│               │
│       │               │               │         │  SCREEN  │               │
│       │               │               │         └──────────┘               │
│       │               │               │               │                     │
│       │               │               │               ▼                     │
│       │               │               │         ┌──────────┐               │
│       │               │               │         │   HOME   │               │
│       │               │               │         │  (Done)  │               │
│       │               │               │         └──────────┘               │
│                                                                             │
│  EXIT POINTS:                                                               │
│  • X button on any screen → Save progress, allow return                     │
│  • Skip on rating → Skip album, still count toward 5                        │
│  • "Rate later" on prediction → Go to home                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN SPECIFICATIONS

### SCREEN 1: WELCOME

**Purpose**: Set expectation, create anticipation, get commitment

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  [X Close]                                                      │
│                                                                 │
│                         🎧                                      │
│                                                                 │
│              Discover music & friends                           │
│                 tailored to you                                 │
│                                                                 │
│         Rate 5 albums. We'll find your                          │
│                music people.                                    │
│                                                                 │
│           Takes less than 60 seconds                            │
│                                                                 │
│        ┌─────────────────────────────────┐                      │
│        │         Let's go →              │                      │
│        └─────────────────────────────────┘                      │
│                                                                 │
│             Already have an account? Log in                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Spec**:

```typescript
// WelcomeScreen.tsx

interface WelcomeScreenProps {
  onStart: () => void;
  onLogin: () => void;
  onClose: () => void;
}

// Elements:
// - Logo/emoji at top (🎧 or WaxFeed logo)
// - Primary headline: "Discover music & friends tailored to you"
// - Secondary text: "Rate 5 albums. We'll find your music people."
// - Time indicator: "Takes less than 60 seconds"
// - Primary CTA button: "Let's go →"
// - Secondary link: "Already have an account? Log in"
// - Close button (X) in top right
```

**Animations**:
- Fade in from center (0.3s ease-out)
- Logo subtle pulse animation
- Button has hover scale (1.02)

**Exit Actions**:
- "Let's go" → Navigate to Rating Flow
- "Log in" → Navigate to Login screen
- "X" → Close onboarding, return to landing

---

### SCREEN 2: RATING FLOW (5 Screens)

**Purpose**: Collect 5 album ratings quickly with minimal friction

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]                                      [X Close]        │
│                                                                 │
│                    ●●●○○  3 of 5                                │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │                                         │              │
│        │                                         │              │
│        │           [ALBUM ARTWORK]               │              │
│        │              300x300                    │              │
│        │                                         │              │
│        │                                         │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│                      Blonde                                     │
│                    Frank Ocean                                  │
│                       2016                                      │
│                                                                 │
│            How do you feel about this album?                    │
│                                                                 │
│        😐 ─────────────────────────────────── 😍                │
│        1   2   3   4   5   6   7   8   9   10                   │
│                                                                 │
│                  Haven't heard it? Skip                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Spec**:

```typescript
// RatingScreen.tsx

interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  artworkUrl: string;
}

interface RatingScreenProps {
  album: Album;
  currentStep: number; // 1-5
  totalSteps: number; // 5
  onRate: (albumId: string, rating: number) => void;
  onSkip: (albumId: string) => void;
  onBack: () => void;
  onClose: () => void;
}

// Sub-components:
// - ProgressIndicator (dots or bar showing 1/5, 2/5, etc.)
// - AlbumCard (artwork, title, artist, year)
// - RatingSlider (1-10 scale with emoji endpoints)
// - SkipButton
```

**Rating Slider Spec**:

```typescript
// RatingSlider.tsx

interface RatingSliderProps {
  value: number | null;
  onChange: (value: number) => void;
  onConfirm: () => void; // Called when user taps a rating
}

// Visual:
// - 10 tappable segments (1-10)
// - Left emoji: 😐 (neutral)
// - Right emoji: 😍 (love)
// - Selected rating shows filled state
// - Numbers below each segment
// - Haptic feedback on selection (mobile)

// Behavior:
// - Tap any number to select
// - Rating auto-advances after 0.5s delay (or tap again to confirm)
// - Swipe left/right to adjust (optional)
```

**Album Selection Algorithm**:

```typescript
// selectOnboardingAlbums.ts

interface AlbumSelectionCriteria {
  // Mix of genres to ensure variety
  genres: ['hip-hop', 'indie', 'pop', 'r&b', 'rock'];
  
  // Mix of eras
  eras: ['2020s', '2010s', '2000s', '1990s', 'classic'];
  
  // High recognition rate (>70% of users have heard)
  minRecognitionRate: 0.7;
  
  // Polarizing albums (high variance in ratings) are better
  minRatingVariance: 1.5;
}

function selectOnboardingAlbums(userRegion?: string): Album[] {
  // Returns 8 albums (5 to show + 3 backup for skips)
  // Algorithm:
  // 1. Get pool of high-recognition albums
  // 2. Ensure genre diversity (no 2 same genre in a row)
  // 3. Ensure era diversity
  // 4. Prioritize polarizing albums (create stronger taste signal)
  // 5. Optionally weight by user's region (e.g., more UK artists for UK users)
}
```

**Suggested Starter Albums Pool**:

```typescript
const ONBOARDING_ALBUM_POOL = [
  // Hip-Hop
  { id: 'blonde', title: 'Blonde', artist: 'Frank Ocean', year: 2016 },
  { id: 'tpab', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', year: 2015 },
  { id: 'igor', title: 'IGOR', artist: 'Tyler, The Creator', year: 2019 },
  { id: 'graduation', title: 'Graduation', artist: 'Kanye West', year: 2007 },
  
  // Indie/Rock
  { id: 'in-rainbows', title: 'In Rainbows', artist: 'Radiohead', year: 2007 },
  { id: 'is-this-it', title: 'Is This It', artist: 'The Strokes', year: 2001 },
  { id: 'ok-computer', title: 'OK Computer', artist: 'Radiohead', year: 1997 },
  { id: 'loveless', title: 'Loveless', artist: 'My Bloody Valentine', year: 1991 },
  
  // Pop
  { id: 'after-hours', title: 'After Hours', artist: 'The Weeknd', year: 2020 },
  { id: '1989', title: '1989', artist: 'Taylor Swift', year: 2014 },
  { id: 'future-nostalgia', title: 'Future Nostalgia', artist: 'Dua Lipa', year: 2020 },
  
  // R&B
  { id: 'ctrl', title: 'Ctrl', artist: 'SZA', year: 2017 },
  { id: 'malibu', title: 'Malibu', artist: 'Anderson .Paak', year: 2016 },
  { id: 'channel-orange', title: 'Channel Orange', artist: 'Frank Ocean', year: 2012 },
  
  // Classic
  { id: 'abbey-road', title: 'Abbey Road', artist: 'The Beatles', year: 1969 },
  { id: 'thriller', title: 'Thriller', artist: 'Michael Jackson', year: 1982 },
  { id: 'purple-rain', title: 'Purple Rain', artist: 'Prince', year: 1984 },
];
```

**Animations**:
- Album card slides in from right (0.3s ease-out)
- On rate: card slides out left, next slides in from right
- Progress dots animate fill
- Rating selection has subtle bounce (0.1s)

---

### SCREEN 3: ANALYSIS LOADER

**Purpose**: Build anticipation, justify the personalization coming next

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                                                                 │
│                          🧠                                     │
│                                                                 │
│                 Analyzing your taste...                         │
│                                                                 │
│          ████████████████░░░░░░░░░░  67%                        │
│                                                                 │
│              Comparing with 580,000 albums                      │
│                                                                 │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Spec**:

```typescript
// AnalysisLoader.tsx

interface AnalysisLoaderProps {
  onComplete: () => void;
}

// States (timed sequence):
const ANALYSIS_STEPS = [
  { percent: 0, text: 'Analyzing your ratings...', duration: 800 },
  { percent: 25, text: 'Comparing with 580,000 albums...', duration: 800 },
  { percent: 50, text: 'Mapping your taste profile...', duration: 800 },
  { percent: 75, text: 'Finding your music people...', duration: 800 },
  { percent: 100, text: 'Almost there...', duration: 600 },
];

// Total duration: ~4 seconds
// Then auto-navigate to Taste Reveal
```

**Critical Implementation Notes**:
- Duration must be 3-5 seconds (shorter = feels cheap, longer = frustrating)
- Progress bar should NOT be linear — use easing that slows near end
- Text changes create sense of work being done
- Do NOT allow skip — this builds anticipation

**Animations**:
- Brain emoji pulses subtly
- Progress bar fills with easing (ease-in-out)
- Text fades between steps
- At 100%, brief pause then transition to reveal

---

### SCREEN 4: TASTE TYPE REVEAL

**Purpose**: Create "aha moment" with personalized identity

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                     [X Close]   │
│                                                                 │
│                   Your Taste Profile                            │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │                                         │              │
│        │     [TASTE FINGERPRINT VISUAL]          │              │
│        │        (Unique pattern/graph)           │              │
│        │                                         │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│                      You're a                                   │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │          🎭 GENRE EXPLORER              │              │
│        │                                         │              │
│        │    You don't stick to lanes.            │              │
│        │    Hip-hop, indie, R&B — you follow     │              │
│        │    the music, not the labels.           │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│           Top Traits:                                           │
│           • Emotionally complex taste                           │
│           • Album-focused listener                              │
│           • Ahead of mainstream trends                          │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │       See who shares your taste →       │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Spec**:

```typescript
// TasteReveal.tsx

interface TasteType {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  traits: string[];
}

interface TasteRevealProps {
  tasteType: TasteType;
  tasteFingerprint: TasteFingerprintData; // For visualization
  onContinue: () => void;
  onClose: () => void;
}
```

**Taste Types Definition**:

```typescript
// tasteTypes.ts

const TASTE_TYPES: TasteType[] = [
  {
    id: 'genre-explorer',
    name: 'GENRE EXPLORER',
    emoji: '🎭',
    tagline: "You don't stick to lanes.",
    description: "Hip-hop, indie, R&B — you follow the music, not the labels. Your taste crosses boundaries that most listeners never even approach.",
    traits: [
      'Eclectic and unpredictable',
      'Values artistry over genre',
      'Early adopter of crossover artists'
    ]
  },
  {
    id: 'deep-diver',
    name: 'DEEP DIVER',
    emoji: '🔬',
    tagline: "You go deep, not wide.",
    description: "When you find something you love, you explore every corner. Full discographies, B-sides, influences — you want to understand, not just listen.",
    traits: [
      'Encyclopedic genre knowledge',
      'Appreciates artistic evolution',
      'Seeks out deep cuts'
    ]
  },
  {
    id: 'era-traveler',
    name: 'ERA TRAVELER',
    emoji: '⏳',
    tagline: "You hear music across time.",
    description: "Whether it's 70s soul, 90s hip-hop, or yesterday's drop — you appreciate music from every era. The year doesn't matter, only the quality.",
    traits: [
      'Historical perspective',
      'Respects the classics',
      'Connects past to present'
    ]
  },
  {
    id: 'mood-curator',
    name: 'MOOD CURATOR',
    emoji: '🌙',
    tagline: "Music is how you feel.",
    description: "You don't organize by genre or artist — you organize by feeling. Rainy day albums. Late night albums. Albums for when you need to feel something.",
    traits: [
      'Emotionally intuitive',
      'Master playlist builder',
      'Connects music to moments'
    ]
  },
  {
    id: 'hype-tracker',
    name: 'HYPE TRACKER',
    emoji: '🚀',
    tagline: "You hear it first.",
    description: "Before the masses catch on, you've already moved on. You're connected to the pulse of what's coming, not what's already here.",
    traits: [
      'Trend forecaster',
      'Plugged into the underground',
      'Shapes what others will love'
    ]
  },
  {
    id: 'classic-keeper',
    name: 'CLASSIC KEEPER',
    emoji: '👑',
    tagline: "You know what stands the test of time.",
    description: "Not everything needs to be new. You appreciate the albums that defined eras, shaped genres, and still sound essential decades later.",
    traits: [
      'Respects the canon',
      'Quality over novelty',
      'Understands influence'
    ]
  },
  {
    id: 'sonic-architect',
    name: 'SONIC ARCHITECT',
    emoji: '🎛️',
    tagline: "You hear how it's made.",
    description: "Production, mixing, sonic texture — you notice what most people don't. An album's sound matters as much as its songs.",
    traits: [
      'Production-focused ear',
      'Appreciates sonic innovation',
      'Notices the details'
    ]
  },
  {
    id: 'lyric-decoder',
    name: 'LYRIC DECODER',
    emoji: '📝',
    tagline: "Words matter to you.",
    description: "You listen closely. Metaphors, wordplay, storytelling — the lyrics are what make an album stick. You can quote your favorite bars.",
    traits: [
      'Analytical listener',
      'Values storytelling',
      'Remembers the lines that hit'
    ]
  }
];
```

**Taste Type Assignment Algorithm**:

```typescript
// assignTasteType.ts

interface UserRatings {
  albumId: string;
  rating: number;
}

function assignTasteType(ratings: UserRatings[]): TasteType {
  // Algorithm considerations:
  
  // 1. Genre diversity score
  //    - High diversity → Genre Explorer
  //    - Low diversity → Deep Diver
  
  // 2. Era distribution
  //    - Wide era range → Era Traveler
  //    - Mostly recent → Hype Tracker
  //    - Mostly classic → Classic Keeper
  
  // 3. Album characteristics (from database)
  //    - High production rating albums → Sonic Architect
  //    - High lyric rating albums → Lyric Decoder
  //    - High emotional rating albums → Mood Curator
  
  // 4. Popularity score
  //    - Rates obscure albums highly → Deep Diver
  //    - Rates popular albums highly → varies
  
  // For MVP: Can use simpler heuristics based on:
  // - Genre spread of rated albums
  // - Average release year
  // - Comparison to most common patterns
  
  // Default fallback: Genre Explorer (most universally flattering)
}
```

**Animations**:
- Fade in from center (0.4s)
- Taste type card slides up with bounce (0.5s)
- Traits appear one by one (stagger 0.2s each)
- Fingerprint visualization animates in

---

### SCREEN 5: MATCHES SCREEN

**Purpose**: Social proof — show compatible users immediately

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                     [X Close]   │
│                                                                 │
│                   Your Music People                             │
│                                                                 │
│              327 people share your taste                        │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │  [Avatar]  @sarahmusic                  │              │
│        │            ████████████████░░  94%      │              │
│        │            Also loves: Blonde, IGOR     │              │
│        │                              [View →]   │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │  [Avatar]  @jakethebeatmaker            │              │
│        │            ███████████████░░░  91%      │              │
│        │            Also loves: Malibu, Ctrl     │              │
│        │                              [View →]   │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │  [Avatar]  @indiekid2024                │              │
│        │            ██████████████░░░░  87%      │              │
│        │            Also loves: In Rainbows      │              │
│        │                              [View →]   │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │           Continue →                    │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Spec**:

```typescript
// MatchesScreen.tsx

interface UserMatch {
  id: string;
  username: string;
  avatarUrl: string;
  compatibilityPercent: number; // 0-100
  sharedAlbums: string[]; // Album titles they both rated highly
}

interface MatchesScreenProps {
  totalMatches: number; // e.g., 327
  topMatches: UserMatch[]; // Top 3-5 matches
  onViewProfile: (userId: string) => void;
  onContinue: () => void;
  onClose: () => void;
}
```

**Match Calculation**:

```typescript
// calculateCompatibility.ts

interface Compatibility {
  userId: string;
  percent: number;
  sharedHighRatings: string[]; // Albums both rated 7+
  sharedLowRatings: string[]; // Albums both rated <5
}

function calculateCompatibility(
  userARatings: Map<string, number>,
  userBRatings: Map<string, number>
): Compatibility {
  // Algorithm:
  // 1. Find overlapping albums (both users rated)
  // 2. Calculate correlation coefficient of ratings
  // 3. Weight by number of overlapping albums
  // 4. Bonus for shared high ratings (both 8+)
  // 5. Bonus for shared controversial opinions (both love/hate unpopular opinion)
  
  // Formula (simplified):
  // compatibility = (correlation * 50) + (sharedHighRatings * 10) + baseline
  // Clamped to 0-100
  
  // For new users with only 5 ratings:
  // - Use predicted ratings based on taste type
  // - Show "estimated" compatibility with asterisk
  // - Update as they rate more
}
```

**Cold Start Problem (New Users)**:

```typescript
// For onboarding, we may not have real matches yet
// Solutions:

// Option 1: Pre-seed with "demo" users (not recommended - feels fake)

// Option 2: Use aggregate compatibility
// "Your taste aligns with 327 users" based on:
// - Users who rated the same 5 albums similarly
// - Statistical projection from taste type

// Option 3: Show real users who rated ANY of the same albums highly
// Even 1 shared album = potential match to show

// Option 4: Show "finding matches..." and update in real-time
// As user rates more, matches become more accurate
```

**Animations**:
- Header fades in
- Match cards slide in from bottom (stagger 0.15s each)
- Compatibility bars animate fill (0.5s each)

---

### SCREEN 6: PREDICTION SCREEN

**Purpose**: Create return hook via curiosity and unfinished loop

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                     [X Close]   │
│                                                                 │
│                    One more thing...                            │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │                                         │              │
│        │           [ALBUM ARTWORK]               │              │
│        │              250x250                    │              │
│        │                                         │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│                         GNX                                     │
│                    Kendrick Lamar                               │
│                   Released this week                            │
│                                                                 │
│           Based on your taste, we predict                       │
│               you'll rate this album:                           │
│                                                                 │
│        ┌─────────────────────────────────────────┐              │
│        │              8.7 / 10                   │              │
│        └─────────────────────────────────────────┘              │
│                                                                 │
│                   Were we right?                                │
│                                                                 │
│        ┌───────────────────┐  ┌───────────────────┐             │
│        │    Rate it now    │  │    Rate later     │             │
│        └───────────────────┘  └───────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Spec**:

```typescript
// PredictionScreen.tsx

interface PredictedAlbum {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  releaseContext: string; // "Released this week" / "New release" / "Classic"
  predictedRating: number; // e.g., 8.7
}

interface PredictionScreenProps {
  album: PredictedAlbum;
  onRateNow: () => void;
  onRateLater: () => void;
  onClose: () => void;
}
```

**Album Selection for Prediction**:

```typescript
// selectPredictionAlbum.ts

function selectPredictionAlbum(
  userTasteType: TasteType,
  userRatings: UserRatings[]
): PredictedAlbum {
  // Priority order:
  
  // 1. New release this week (if any major album dropped)
  //    - Timely, creates urgency
  //    - User might not have heard it yet
  
  // 2. Recent release (last 30 days) matching taste type
  //    - Still fresh
  //    - High chance they haven't rated yet
  
  // 3. Highly rated album by similar users that this user hasn't rated
  //    - Personalized recommendation
  //    - "People like you love this"
  
  // 4. Fallback: Classic album from their top genre
  //    - Safe bet
  //    - Still creates prediction curiosity
  
  // Prediction algorithm:
  // Based on collaborative filtering:
  // - Find users with similar ratings to this user
  // - Average their rating of the prediction album
  // - Add some uncertainty (8.7 not 9.0 - specificity = believability)
}
```

**Animations**:
- Album slides in from bottom
- Predicted rating "reveals" with number counting up
- Buttons fade in after rating reveals

---

## COMPONENT ARCHITECTURE

### File Structure

```
/src
├── /components
│   ├── /onboarding
│   │   ├── OnboardingFlow.tsx          # Main container/orchestrator
│   │   ├── WelcomeScreen.tsx
│   │   ├── RatingScreen.tsx
│   │   ├── RatingSlider.tsx
│   │   ├── AlbumCard.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── AnalysisLoader.tsx
│   │   ├── TasteReveal.tsx
│   │   ├── TasteFingerprint.tsx        # Visualization component
│   │   ├── MatchesScreen.tsx
│   │   ├── MatchCard.tsx
│   │   ├── PredictionScreen.tsx
│   │   └── index.ts
│   └── /shared
│       ├── Button.tsx
│       ├── CloseButton.tsx
│       └── Modal.tsx
├── /hooks
│   ├── useOnboarding.ts                # Onboarding state management
│   └── useAlbumRating.ts
├── /lib
│   ├── /onboarding
│   │   ├── tasteTypes.ts               # Taste type definitions
│   │   ├── selectOnboardingAlbums.ts   # Album selection logic
│   │   ├── assignTasteType.ts          # Taste type algorithm
│   │   ├── calculateCompatibility.ts   # Match calculation
│   │   └── selectPredictionAlbum.ts    # Prediction selection
│   └── /api
│       └── onboarding.ts               # API calls
├── /context
│   └── OnboardingContext.tsx           # React context for onboarding
└── /types
    └── onboarding.ts                   # TypeScript types
```

### Main Orchestrator Component

```typescript
// OnboardingFlow.tsx

import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';

type OnboardingStep = 
  | 'welcome'
  | 'rating'
  | 'analysis'
  | 'taste-reveal'
  | 'matches'
  | 'prediction'
  | 'complete';

export function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const { 
    albums, 
    ratings, 
    tasteType, 
    matches, 
    prediction,
    addRating,
    skipAlbum,
    completeOnboarding 
  } = useOnboarding();

  const handleRatingComplete = () => {
    setStep('analysis');
    // API call to analyze happens here
  };

  const handleAnalysisComplete = () => {
    setStep('taste-reveal');
  };

  // ... render logic for each step
  
  return (
    <div className="onboarding-container">
      {step === 'welcome' && (
        <WelcomeScreen onStart={() => setStep('rating')} />
      )}
      {step === 'rating' && (
        <RatingScreen 
          albums={albums}
          onComplete={handleRatingComplete}
          // ...
        />
      )}
      {/* ... other screens */}
    </div>
  );
}
```

---

## STATE MANAGEMENT

### Onboarding State Shape

```typescript
// types/onboarding.ts

interface OnboardingState {
  // Current step
  currentStep: OnboardingStep;
  
  // Albums to rate
  albumsToRate: Album[];
  currentAlbumIndex: number;
  
  // User's ratings during onboarding
  ratings: Map<string, number>;
  skippedAlbums: Set<string>;
  
  // Results (populated after analysis)
  tasteType: TasteType | null;
  tasteFingerprint: TasteFingerprintData | null;
  matches: UserMatch[];
  totalMatchCount: number;
  predictionAlbum: PredictedAlbum | null;
  
  // Meta
  startedAt: Date | null;
  completedAt: Date | null;
  isComplete: boolean;
}

interface OnboardingActions {
  startOnboarding: () => void;
  rateAlbum: (albumId: string, rating: number) => void;
  skipAlbum: (albumId: string) => void;
  goBack: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}
```

### React Context

```typescript
// context/OnboardingContext.tsx

import { createContext, useContext, useReducer, ReactNode } from 'react';

const OnboardingContext = createContext<{
  state: OnboardingState;
  actions: OnboardingActions;
} | null>(null);

type OnboardingAction = 
  | { type: 'START_ONBOARDING'; albums: Album[] }
  | { type: 'RATE_ALBUM'; albumId: string; rating: number }
  | { type: 'SKIP_ALBUM'; albumId: string }
  | { type: 'SET_STEP'; step: OnboardingStep }
  | { type: 'SET_RESULTS'; tasteType: TasteType; matches: UserMatch[]; prediction: PredictedAlbum }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'START_ONBOARDING':
      return {
        ...initialState,
        currentStep: 'rating',
        albumsToRate: action.albums,
        startedAt: new Date(),
      };
    case 'RATE_ALBUM':
      const newRatings = new Map(state.ratings);
      newRatings.set(action.albumId, action.rating);
      const nextIndex = state.currentAlbumIndex + 1;
      const isLastAlbum = nextIndex >= 5 || nextIndex >= state.albumsToRate.length;
      return {
        ...state,
        ratings: newRatings,
        currentAlbumIndex: nextIndex,
        currentStep: isLastAlbum ? 'analysis' : 'rating',
      };
    // ... other cases
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  
  const actions: OnboardingActions = {
    startOnboarding: async () => {
      const albums = await fetchOnboardingAlbums();
      dispatch({ type: 'START_ONBOARDING', albums });
    },
    rateAlbum: (albumId, rating) => {
      dispatch({ type: 'RATE_ALBUM', albumId, rating });
    },
    // ... other actions
  };
  
  return (
    <OnboardingContext.Provider value={{ state, actions }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
```

---

## API ENDPOINTS

### Required Endpoints

```typescript
// Endpoint 1: Get Onboarding Albums
GET /api/onboarding/albums

Response: {
  albums: Album[];
}

// Endpoint 2: Submit Ratings & Get Analysis
POST /api/onboarding/analyze

Request: {
  ratings: { albumId: string; rating: number }[];
}

Response: {
  tasteType: TasteType;
  tasteFingerprint: TasteFingerprintData;
  matches: UserMatch[];
  totalMatchCount: number;
  predictionAlbum: PredictedAlbum;
}

// Endpoint 3: Complete Onboarding
POST /api/onboarding/complete

Request: {
  userId: string;
  tasteTypeId: string;
  ratings: { albumId: string; rating: number }[];
  predictionAlbumId: string;
}

Response: {
  success: boolean;
  user: User;
}

// Endpoint 4: Rate Prediction Album (optional - can use regular rating endpoint)
POST /api/albums/:albumId/rate

Request: {
  rating: number;
}
```

### API Implementation Notes

```typescript
// For MVP, some endpoints can be mocked/simplified:

// 1. Albums can be hardcoded list initially
// 2. Taste type can use simple heuristics
// 3. Matches can be based on album overlap only
// 4. Prediction can be most recent popular album

// Scale later with:
// - Collaborative filtering for matches
// - ML model for taste type
// - Personalized prediction based on similar users
```

---

## DATA MODELS

### Database Schema (PostgreSQL)

```sql
-- New tables for onboarding

-- Store taste types (can be seeded)
CREATE TABLE taste_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  tagline TEXT,
  description TEXT,
  traits JSONB -- Array of trait strings
);

-- Track user's assigned taste type
ALTER TABLE users ADD COLUMN taste_type_id VARCHAR(50) REFERENCES taste_types(id);

-- Store onboarding completion
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  albums_shown JSONB, -- Array of album IDs shown
  ratings JSONB, -- Map of albumId -> rating
  assigned_taste_type_id VARCHAR(50) REFERENCES taste_types(id),
  prediction_album_id UUID REFERENCES albums(id),
  prediction_rating DECIMAL(3,1) -- What we predicted
);

-- For compatibility calculations (cache)
CREATE TABLE user_compatibility_cache (
  user_a_id UUID REFERENCES users(id),
  user_b_id UUID REFERENCES users(id),
  compatibility_score INTEGER, -- 0-100
  shared_albums JSONB, -- Array of shared album IDs
  calculated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_a_id, user_b_id)
);

CREATE INDEX idx_compatibility_user_a ON user_compatibility_cache(user_a_id);
CREATE INDEX idx_compatibility_score ON user_compatibility_cache(compatibility_score DESC);
```

---

## ANIMATIONS & TRANSITIONS

### Animation Library

Recommend using **Framer Motion** for React:

```bash
npm install framer-motion
```

### Animation Specs

```typescript
// animations/onboarding.ts

import { Variants } from 'framer-motion';

// Screen transitions
export const screenTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

// Card slide (for album cards)
export const cardSlide: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' }
  })
};

// Stagger children (for lists)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Progress bar fill
export const progressBar = (percent: number) => ({
  initial: { width: '0%' },
  animate: { 
    width: `${percent}%`,
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
});

// Number count up (for prediction reveal)
export const countUp = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.34, 1.56, 0.64, 1] // Bounce
    }
  }
};

// Taste type reveal
export const tasteTypeReveal: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.34, 1.56, 0.64, 1] // Bounce
    }
  }
};
```

### Component Example with Animations

```typescript
// AlbumCard.tsx with Framer Motion

import { motion, AnimatePresence } from 'framer-motion';
import { cardSlide } from '@/animations/onboarding';

interface AlbumCardProps {
  album: Album;
  direction: number; // 1 for forward, -1 for back
}

export function AlbumCard({ album, direction }: AlbumCardProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={album.id}
        custom={direction}
        variants={cardSlide}
        initial="enter"
        animate="center"
        exit="exit"
        className="album-card"
      >
        <img src={album.artworkUrl} alt={album.title} />
        <h3>{album.title}</h3>
        <p>{album.artist}</p>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## COPY & MICROCOPY

### All Text Strings

```typescript
// copy/onboarding.ts

export const ONBOARDING_COPY = {
  // Welcome Screen
  welcome: {
    headline: 'Discover music & friends tailored to you',
    subheadline: "Rate 5 albums. We'll find your music people.",
    timeEstimate: 'Takes less than 60 seconds',
    cta: "Let's go",
    loginLink: 'Already have an account? Log in',
  },
  
  // Rating Screen
  rating: {
    question: 'How do you feel about this album?',
    skipText: "Haven't heard it? Skip",
    progress: (current: number, total: number) => `${current} of ${total}`,
  },
  
  // Analysis Loader
  analysis: {
    steps: [
      'Analyzing your ratings...',
      'Comparing with 580,000 albums...',
      'Mapping your taste profile...',
      'Finding your music people...',
      'Almost there...',
    ],
  },
  
  // Taste Reveal
  tasteReveal: {
    headline: 'Your Taste Profile',
    youreA: "You're a",
    topTraits: 'Top Traits:',
    cta: 'See who shares your taste →',
  },
  
  // Matches Screen
  matches: {
    headline: 'Your Music People',
    matchCount: (count: number) => `${count} people share your taste`,
    compatibility: (percent: number) => `${percent}% match`,
    alsoLoves: 'Also loves:',
    viewProfile: 'View →',
    cta: 'Continue →',
  },
  
  // Prediction Screen
  prediction: {
    headline: 'One more thing...',
    releaseContext: {
      thisWeek: 'Released this week',
      recent: 'New release',
      classic: 'Classic album',
    },
    predictionIntro: 'Based on your taste, we predict you\'ll rate this album:',
    challenge: 'Were we right?',
    rateNow: 'Rate it now',
    rateLater: 'Rate later',
  },
  
  // Shared
  shared: {
    close: 'Close',
    back: 'Back',
  },
};
```

---

## STYLING & DESIGN SYSTEM

### Colors

```typescript
// styles/colors.ts

export const colors = {
  // Primary
  primary: '#6366F1', // Indigo
  primaryHover: '#4F46E5',
  primaryLight: '#E0E7FF',
  
  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundDark: '#111827',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  
  // UI
  border: '#E5E7EB',
  borderFocus: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Compatibility colors (for match percentages)
  compatHigh: '#10B981', // 80-100%
  compatMedium: '#F59E0B', // 60-79%
  compatLow: '#6B7280', // <60%
};
```

### Spacing

```typescript
// styles/spacing.ts

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};
```

### Typography

```typescript
// styles/typography.ts

export const typography = {
  // Headlines
  h1: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '22px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  
  // Body
  body: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // UI
  button: {
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1,
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
  },
};
```

### Tailwind Config (if using Tailwind)

```javascript
// tailwind.config.js additions

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#E0E7FF',
        },
        compat: {
          high: '#10B981',
          medium: '#F59E0B',
          low: '#6B7280',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
};
```

---

## EDGE CASES

### Handle These Scenarios

```typescript
// 1. User exits during onboarding
// - Save progress to localStorage
// - On return, ask "Continue where you left off?"
// - After 24 hours, reset and start fresh

// 2. User skips all 5 albums
// - Should not happen (curate well-known albums)
// - If it does: show 3 more albums from backup pool
// - If still skipping: assign "Undiscovered" taste type, encourage more ratings

// 3. User rates everything the same (all 10s or all 1s)
// - Detect this pattern
// - Still assign a taste type (Genre Explorer if all high, Skeptic if all low)
// - Show message: "Rate more albums to refine your profile"

// 4. No matches found (new platform, few users)
// - Show "estimated" matches based on similar ratings to albums
// - Message: "We're growing! Rate more to find your people."
// - Still show prediction to create return hook

// 5. API failure during analysis
// - Retry 3 times with exponential backoff
// - If still fails: show error with retry button
// - Never leave user in limbo

// 6. User already completed onboarding but returns to /onboarding
// - Redirect to home/profile
// - Or show "Retake your taste quiz?" option

// 7. User has existing account with ratings
// - Skip onboarding, use existing data
// - Or offer "Update your taste profile?"

// 8. Mobile browser back button during onboarding
// - Handle history state properly
// - Back should go to previous step, not exit onboarding

// 9. Slow network (album art loading)
// - Show skeleton/placeholder while loading
// - Preload next 2 albums while rating current

// 10. User taps rating but doesn't wait for auto-advance
// - Allow immediate tap-again to confirm and advance
// - Or just advance immediately on tap (test both)
```

---

## TESTING REQUIREMENTS

### Unit Tests

```typescript
// __tests__/onboarding/

// 1. selectOnboardingAlbums.test.ts
describe('selectOnboardingAlbums', () => {
  it('returns exactly 8 albums (5 + 3 backup)');
  it('ensures genre diversity');
  it('ensures era diversity');
  it('returns high-recognition albums');
});

// 2. assignTasteType.test.ts
describe('assignTasteType', () => {
  it('assigns Genre Explorer for diverse ratings');
  it('assigns Deep Diver for single-genre focus');
  it('assigns Era Traveler for cross-decade ratings');
  it('handles all edge cases (all same rating, etc.)');
});

// 3. calculateCompatibility.test.ts
describe('calculateCompatibility', () => {
  it('returns 100 for identical ratings');
  it('returns 0 for opposite ratings');
  it('weights shared high ratings');
  it('handles users with no overlap');
});
```

### Integration Tests

```typescript
// __tests__/onboarding/flow.test.ts

describe('Onboarding Flow', () => {
  it('completes full flow from welcome to prediction');
  it('saves progress on exit');
  it('resumes from saved progress');
  it('handles API errors gracefully');
  it('tracks analytics events at each step');
});
```

### E2E Tests (Playwright/Cypress)

```typescript
// e2e/onboarding.spec.ts

describe('Onboarding E2E', () => {
  it('new user can complete onboarding', async () => {
    // 1. Visit landing page
    // 2. Click "Get Started"
    // 3. Rate 5 albums
    // 4. Wait for analysis
    // 5. See taste type
    // 6. See matches
    // 7. See prediction
    // 8. Click "Rate later"
    // 9. Arrive at home page with profile
  });
  
  it('onboarding takes less than 90 seconds', async () => {
    // Time the full flow
    // Assert < 90000ms
  });
});
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Core Flow (Days 1-2)

- [ ] Create `OnboardingFlow.tsx` orchestrator component
- [ ] Create `WelcomeScreen.tsx`
- [ ] Create `RatingScreen.tsx` with slider
- [ ] Create `AlbumCard.tsx`
- [ ] Create `ProgressIndicator.tsx`
- [ ] Implement navigation between screens
- [ ] Set up `OnboardingContext.tsx` for state
- [ ] Create hardcoded album pool for MVP
- [ ] Style all components (mobile-first)

### Phase 2: Analysis & Reveal (Days 2-3)

- [ ] Create `AnalysisLoader.tsx` with timed steps
- [ ] Create `TasteReveal.tsx`
- [ ] Implement taste type definitions
- [ ] Create simple taste type assignment algorithm
- [ ] Add animations (Framer Motion)
- [ ] Create `TasteFingerprint.tsx` visualization (can be simple v1)

### Phase 3: Matches & Prediction (Days 3-4)

- [ ] Create `MatchesScreen.tsx`
- [ ] Create `MatchCard.tsx`
- [ ] Implement compatibility calculation (simple version)
- [ ] Create `PredictionScreen.tsx`
- [ ] Implement prediction album selection
- [ ] Add all remaining animations

### Phase 4: API Integration (Days 4-5)

- [ ] Create `/api/onboarding/albums` endpoint
- [ ] Create `/api/onboarding/analyze` endpoint
- [ ] Create `/api/onboarding/complete` endpoint
- [ ] Connect frontend to real APIs
- [ ] Handle loading states
- [ ] Handle error states

### Phase 5: Polish & Testing (Days 5-7)

- [ ] Add all microcopy
- [ ] Implement edge case handling
- [ ] Add progress saving to localStorage
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual QA on mobile and desktop
- [ ] Performance optimization (preload images)
- [ ] Analytics events

### Phase 6: Launch (Day 7)

- [ ] Deploy to staging
- [ ] Team testing
- [ ] Fix any bugs
- [ ] Deploy to production
- [ ] Monitor analytics

---

## QUICK START FOR CURSOR

**To implement this feature, start with:**

1. **Create the file structure** as outlined in Component Architecture
2. **Start with `OnboardingFlow.tsx`** — the main orchestrator
3. **Build screens in order**: Welcome → Rating → Analysis → Reveal → Matches → Prediction
4. **Use the exact copy from Copy & Microcopy section**
5. **Follow the animation specs from Animations section**
6. **Test each screen before moving to next**

**Key files to create first:**
```
/components/onboarding/OnboardingFlow.tsx
/components/onboarding/WelcomeScreen.tsx
/components/onboarding/RatingScreen.tsx
/context/OnboardingContext.tsx
/lib/onboarding/tasteTypes.ts
```

**MVP shortcuts (acceptable for v1):**
- Hardcode album pool (no API needed initially)
- Simple taste type algorithm (genre diversity only)
- Show 3 random existing users as "matches"
- Use most recent popular album for prediction

---

*This spec contains everything needed to build the onboarding flow. Each section is self-contained and can be referenced independently.*

**Questions? Start with Welcome Screen and build forward.**

— **CD**
