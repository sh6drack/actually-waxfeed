# Waxfeed Feature Log

> A social music review platform - "Letterboxd for music"
> Built by WBRU 2025 - Brown Broadcasting Service, Inc.

---

## Project Overview

**Started:** November 2025
**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, PostgreSQL (Neon), Prisma ORM, NextAuth.js, Spotify Web API

---

## Core Features Implemented

### 1. Authentication System
- [x] Google OAuth login via NextAuth.js v5
- [x] GitHub OAuth login (Feb 2026)
- [x] Email/Password credentials with rate limiting
- [x] Session management with PrismaAdapter
- [x] Custom login page (`/login`)
- [x] Onboarding flow for username selection (`/onboarding`)
- [x] Automatic notification settings creation on user signup
- [x] Automatic account linking (same email = merged accounts)

**Files:**
- `src/lib/auth.ts` - NextAuth configuration with Google, GitHub, and Credentials providers
- `src/app/login/page.tsx` - Login UI with OAuth buttons
- `src/app/signup/page.tsx` - Signup UI with OAuth buttons
- `src/app/onboarding/page.tsx` - Username setup
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API routes

### 2. User System
- [x] User profiles with username, bio, avatar
- [x] Profile page (`/u/[username]`)
- [x] Social links support (JSON field)
- [x] Wax score tracking (social currency)
- [x] Premium user support
- [x] Verified user badges
- [x] Username change limits (3 changes)
- [x] Hide follower count option

**API Routes:**
- `GET /api/users/[username]` - Get user profile
- `PATCH /api/users` - Update own profile
- `GET /api/users?q=` - Search users by username

### 3. Album System
- [x] Spotify integration for album metadata
- [x] Multiple cover art sizes (small, medium, large)
- [x] Genre tagging
- [x] Track listing with duration
- [x] Rating distribution tracking
- [x] Average rating calculation
- [x] Album type classification (album, single, EP, compilation)

**Mass Import Methods:**
- [x] Import by Spotify album IDs
- [x] Import by Spotify album URLs
- [x] Import by artist name (full discography)
- [x] Import by search queries (batch)
- [x] Admin panel for bulk imports (`/admin`)

**API Routes:**
- `GET /api/albums` - List albums with pagination
- `GET /api/albums/[id]` - Album details with reviews
- `GET /api/albums/search` - Search Spotify + local DB
- `POST /api/albums/import` - Bulk import endpoint

**Caching:**
- Album data: 24 hours
- Search results: 1 hour
- Artist data: 7 days

### 4. Review System
- [x] 0-10 rating scale (decimal support)
- [x] Text reviews (up to 5000 characters)
- [x] Edit history tracking
- [x] Like/unlike reviews
- [x] Reply threads on reviews
- [x] Wax awards (social currency gifts)
- [x] Review drafts (auto-save)

**API Routes:**
- `GET /api/reviews` - List reviews with filters
- `POST /api/reviews` - Create review
- `GET /api/reviews/[id]` - Get review with replies
- `PATCH /api/reviews/[id]` - Edit review
- `DELETE /api/reviews/[id]` - Delete review
- `POST /api/reviews/[id]/like` - Like review
- `DELETE /api/reviews/[id]/like` - Unlike review
- `POST /api/reviews/[id]/wax` - Give wax award
- `GET /api/reviews/[id]/replies` - Get replies
- `POST /api/reviews/[id]/replies` - Add reply

### 5. List System
- [x] Create custom album lists
- [x] Public/private visibility
- [x] Ranked vs unranked lists
- [x] List descriptions
- [x] Add/remove/reorder albums
- [x] Like lists
- [x] Remix (fork) other users' lists
- [x] List comments

**API Routes:**
- `GET /api/lists` - Browse public lists
- `POST /api/lists` - Create list
- `GET /api/lists/[id]` - Get list details
- `POST /api/lists/[id]` - Remix/fork list
- `POST /api/lists/[id]/items` - Add album to list
- `DELETE /api/lists/[id]/items` - Remove album
- `POST /api/lists/[id]/like` - Like list

### 6. Social System
- [x] Follow/unfollow users
- [x] Friend requests (mutual connections)
- [x] Accept/reject friend requests
- [x] Block users
- [x] Activity feed from followed users

**Three-tier social model:**
1. **Followers** - One-way follow
2. **Following** - Users you follow
3. **Friends** - Mutual connection (requires acceptance)

**API Routes:**
- `POST /api/users/[username]/follow` - Follow user
- `DELETE /api/users/[username]/follow` - Unfollow
- `POST /api/users/[username]/friend` - Send/accept friend request
- `GET /api/social/feed` - Personalized activity feed

### 7. Notification System
- [x] In-app notifications
- [x] Notification settings per type
- [x] Mark as read
- [x] Notification types:
  - Replies to reviews
  - Likes on reviews
  - Friend requests
  - New followers
  - Friend's new reviews
  - Review trending alerts

**API Routes:**
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Mark as read

### 8. Wax Award System
- [x] Social currency ("Wax")
- [x] Give wax to reviews you appreciate
- [x] Wax score on user profiles
- [x] Three tiers: Standard (5 Wax), Premium (20 Wax), Gold (100 Wax)
- [x] No subscription gating - anyone with enough balance can tip any tier
- [x] Redesigned tip UI with vinyl icons and clearer menu

### 9. Frontend Pages
- [x] Home page with stats, recent reviews, trending (`/`)
- [x] Search page with dual source (Spotify + local) (`/search`)
- [x] Album detail page with review form (`/album/[id]`)
- [x] User profile page (`/u/[username]`)
- [x] Lists browser (`/lists`)
- [x] List detail page with ranked/grid views (`/list/[id]`)
- [x] Trending page (`/trending`)
- [x] Settings page (`/settings`)
- [x] Notifications page (`/notifications`)
- [x] Admin import panel (`/admin`)
- [x] Login page (`/login`)
- [x] Onboarding page (`/onboarding`)

### 10. Components
- [x] `Header` - Navigation with auth state
- [x] `AlbumCard` - Album display card (multiple sizes)
- [x] `ReviewCard` - Review display with actions
- [x] `RatingSlider` - 0-10 rating input
- [x] `SessionProvider` - Auth context wrapper

### 11. Audio DNA / Prediction System (v2.5)
- [x] Real-time taste learning from Spotify audio features
- [x] Rating predictions before user rates (with confidence %)
- [x] Streak tracking for consecutive correct predictions
- [x] "Decipher Progress" gamification (0-100% taste mapped)
- [x] Surprise detection for albums that defy predictions
- [x] Vibe-to-audio feature mapping (POLARITY_DESCRIPTORS)
- [x] Pearson correlation analysis of feature-rating relationships

**Prediction Algorithm:**
```
predictedRating = (
  featureSimilarityScore * 0.3 +    // Match to user's preferred ranges
  correlationPrediction * 0.4 +      // Feature correlations with past ratings
  similarAlbumAverage * 0.3          // Ratings of similar-sounding albums
)
// Match = within 1.5 points of actual
// Surprise = difference > 2.5 points
```

**Gamification:**
- Streaks: 3 ("Getting warm"), 5 ("We see you!"), 10 ("Taste twin!"), 25 ("Predictable")
- Decipher %: `accuracy * 40 + (ratings/100) * 20 + vibeConsistency * 20 + correlationStrength * 20`

**Files:**
- `src/lib/audio-dna.ts` - User preference learning engine
- `src/lib/prediction-engine.ts` - Rating prediction algorithm
- `src/app/api/audio-dna/compute/route.ts` - Compute/recompute Audio DNA
- `src/app/api/audio/predict/route.ts` - Get/record predictions

**UI Components (in `quick-rate/page.tsx`):**
- `DecipherProgressBar` - DNA signal visualization with animated bars
- `PredictionDisplay` - Confidence ring, predicted rating, audio spectrum
- `AudioFeatureBar` - VU meter-style segment visualization
- `PredictionCelebration` - Cinematic match/surprise overlays
- `MobileDecipherProgress` - Compact inline version for mobile

---

## Database Schema

### Models (30 total)
1. **User** - Profiles, auth, social
2. **Account** - OAuth accounts (NextAuth)
3. **Session** - User sessions (NextAuth)
4. **Album** - Spotify-sourced metadata
5. **Track** - Album tracks
6. **Artist** - Artist metadata
7. **AlbumTag** - Genre/mood tags
8. **Review** - User album reviews
9. **ReviewDraft** - Auto-saved drafts
10. **Reply** - Review replies
11. **ReviewLike** - Review likes
12. **ReplyLike** - Reply likes
13. **List** - Curated album lists
14. **ListItem** - Albums in lists
15. **ListLike** - List likes
16. **ListComment** - List comments
17. **Follow** - Follow relationships
18. **FriendRequest** - Pending friend requests
19. **Friendship** - Confirmed friendships
20. **Block** - Blocked users
21. **WaxAward** - Wax given to reviews
22. **Notification** - User notifications
23. **NotificationSettings** - Notification preferences
24. **Report** - Content reports
25. **UserYearlyStats** - Year-in-review data
26. **SpotifyCache** - API response caching
27. **TrackAudioFeatures** - Spotify audio features per track (energy, valence, danceability, etc.)
28. **AlbumAudioProfile** - Aggregated audio features for albums with variance metrics
29. **UserAudioDNA** - User taste preferences learned from ratings + audio features
30. **PredictionHistory** - Prediction records with actual results for learning

---

## API Utilities

**File:** `src/lib/api-utils.ts`

- `successResponse()` - Standardized success JSON
- `errorResponse()` - Standardized error JSON
- `getAuthenticatedUser()` - Get current user from session
- `requireAuth()` - Throw if not authenticated
- `isBlocked()` - Check block status between users
- `areFriends()` - Check friendship status
- `isFollowing()` - Check follow status
- `updateAlbumStats()` - Recalculate album ratings
- `createNotification()` - Create notification with settings check
- `getPagination()` - Parse pagination params

---

## Spotify Integration

**File:** `src/lib/spotify.ts`

### Functions
- `getSpotifyToken()` - Client credentials auth
- `searchAlbums()` - Search Spotify catalog
- `getAlbum()` - Get album details
- `getArtist()` - Get artist info
- `getArtistAlbums()` - Get artist discography
- `getMultipleAlbums()` - Batch album fetch
- `importAlbumToDatabase()` - Import single album
- `bulkImportAlbums()` - Import multiple albums
- `searchAndImportAlbums()` - Search + import

### Audio Features (v2.5)
- `getAudioFeatures()` - Get audio features for a single track
- `getBatchAudioFeatures()` - Batch fetch up to 100 tracks
- `getTrackAudioFeatures()` - Search + get features by track name
- `computeAlbumAudioProfile()` - Aggregate features for an album
- `storeTrackAudioFeatures()` - Persist to TrackAudioFeatures table
- `storeAlbumAudioProfile()` - Persist to AlbumAudioProfile table

### Audio Feature Types
```typescript
interface SpotifyAudioFeatures {
  danceability: number   // 0-1: Suitable for dancing
  energy: number         // 0-1: Intensity (fast, loud, noisy)
  valence: number        // 0-1: Positiveness/happiness
  acousticness: number   // 0-1: Acoustic vs electronic
  instrumentalness: number // 0-1: No vocals (>0.5 = instrumental)
  speechiness: number    // 0-1: Spoken words
  liveness: number       // 0-1: Live recording audience
  tempo: number          // BPM
  loudness: number       // dB (-60 to 0)
}
```

### Caching Strategy
- Uses `SpotifyCache` model
- Audio features: 30 days (they don't change)
- Album data: 24 hours
- Search results: 1 hour
- Artist data: 7 days

---

## Environment Variables

```env
DATABASE_URL          # PostgreSQL connection string
AUTH_SECRET           # NextAuth secret key
AUTH_URL              # App base URL
GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET  # Google OAuth
SPOTIFY_CLIENT_ID     # Spotify API
SPOTIFY_CLIENT_SECRET # Spotify API
```

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production
npm run lint         # ESLint
npm run db:push      # Push schema to DB
npm run db:migrate   # Run migrations
npm run db:studio    # Prisma Studio GUI
npm run db:seed      # Seed database
```

---

## Changelog

### v2.5 "Decipher" — February 4, 2026
- **Audio DNA System**: AI learns your taste in real-time using Spotify audio features
- **Rating Predictions**: System predicts your rating before you rate, with dynamic confidence levels
- **Perfect Predictions**: New "PERFECT" celebration for exact matches with gold bullseye animation
- **Decipher Progress**: "Your taste is X% deciphered" with granular milestones (10%, 20%... 99%)
- **Streak Tracking**: 12 milestone tiers (3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100+)
- **Surprise Detection**: Albums that defy predictions get tracked with recalibration feedback
- **Dynamic Confidence**: Historical accuracy now factors into prediction confidence levels
- **Match Quality Tiers**: perfect > close > match > miss > surprise for nuanced celebrations
- **Audio Feature Visualization**: VU meter-style bars for energy, mood, dance, acoustic
- **Premium UI Components**: Cinematic celebration overlays, DNA signal visualizations
- **Varied Messages**: 30+ unique reasoning and celebration messages to reduce repetition
- **Database Models**: 4 new models (TrackAudioFeatures, AlbumAudioProfile, UserAudioDNA, PredictionHistory)
- **Spotify Integration**: Audio Features API integration with batch fetching and caching

### v2.4 "Polish" — February 4, 2026
- **Wax Award Feedback**: Clear error messages when awarding Wax fails, with quick link to get more
- **Footer Navigation**: FAQ and Changelog now accessible from homepage footer
- **Code Quality**: Fixed 70+ lint errors across the platform
- **Button Visibility**: Ghost buttons now have explicit text colors across themes
- **Wax Tipping Overhaul** (internal):
  - Anyone with enough Wax balance can tip any tier (Standard/Premium/Gold)
  - No longer requires WAX+ or WAX Pro subscription
  - New vinyl icon replaces confusing "WAX 0" text button
  - Redesigned tip menu with clear tier descriptions

### v2.3 "Gateway" — February 3, 2026
- **GitHub Login**: Sign in with GitHub account for faster access
- **Account Linking**: Multiple sign-in methods automatically link to one account
- **Login Security**: Rate limiting protects against brute force attempts
- **Marketing Messaging Overhaul** (internal):
  - New "Learn Your Taste" positioning
  - Hero: "I listen to everything. Do you though?"
  - "How It Works" section (Rate → Learn → Go Deeper)

### v2.2 "Clarity" — February 3, 2026
- **WCAG AA Compliance**: Improved color contrast across the platform
- **Profile Social Links**: Redesigned with platform icons and brand hover colors
- **Image Performance**: Lazy loading for album grids
- **Heading Hierarchy**: Fixed structure for screen reader navigation

### v2.1 "Cognitive" — February 1, 2026
- **Enhanced Taste Engine**: Deeper analysis of listening patterns
- **Pattern Recognition**: Behavioral patterns in rating and discovery
- **Taste Evolution**: Track how preferences shift over time with drift indicators
- **Session Insights**: Better understanding of listening sessions
- **Mobile Optimization**: Improved responsive layouts for TasteID
- **New Metrics**: TasteID stats for stability, exploration, connection density

### v2.0 "Revival" — February 2, 2026
- **Payments**: Secure checkout for Wax purchases and subscriptions (Stripe integration)
- **Platform Stability**: Resolved deployment issues
- **Performance**: Faster builds and optimized infrastructure
- **Homepage Redesign**: Split layout with Billboard 200 (left) + Recent Reviews (right)
- **Auth Account Linking**: Google OAuth links to existing email accounts

### v1.9 "Dyad" — February 2026
- **Relationship Mapping**: Taste connections across genres and artists
- **Connection Indicators**: Visual cues for musical identity strength
- **Visual Refresh**: New animations and UI elements
- **Smarter Recommendations**: Improved personalization context

### v1.5 "Theme" — January 16, 2026
- **Dark/Light Mode Toggle**: User-selectable theme with color inversion
- **ThemeProvider Component**: localStorage persistence for theme preference
- **CSS Variables**: Full theming support (`--header-bg`, `--header-text`, `--background`, `--foreground`)
- **Logo Animation**: WaxfeedLogo disc now spins independently (not entire logo)

### v1.4 — January 16, 2026
- **Dark Theme Fix**: Header now uses dark theme (`bg-[#0a0a0a]`) matching body
- **UI Cleanup**: Removed excessive quotation marks from Discover page and list content

### v1.2 — June 2025
- **Listening Signature**: Unique fingerprint of music engagement style
- **Cognitive Mapping**: Visualize connections with music
- **Behavioral Insights**: Patterns in exploration and rating

### v1.0 — Summer 2025
- **TasteID**: Music taste fingerprint with archetype classification
- **Polarity Score**: Uniqueness compared to mainstream
- **First Spin**: First discovery badges

### v0.1 — November 2025
- Initial project setup
- Backend API implementation
- Spotify bulk import system
- Google OAuth authentication
- Database schema with 26 models

---

## Planned Features (Future)

- [ ] Apple Music integration
- [ ] Year-in-review stats page
- [ ] Advanced search filters
- [ ] List reorder suggestions
- [ ] Premium subscriptions
- [ ] Email notifications
- [ ] Mobile app
- [ ] Album of the day
- [ ] Charts/leaderboards
- [ ] Review embeds
- [ ] API rate limiting
- [ ] Admin moderation panel
- [ ] Audio DNA comparison between users
- [ ] "Surprise Gallery" - albums that defied predictions
- [ ] Prediction leaderboard - who has the most predictable taste?
- [ ] Taste evolution timeline visualization

---

## Original Specification

The original specification document included detailed requirements for:
- Album-focused community with discourse-heavy music nerd culture
- Three-tier social model (followers, following, friends)
- Wax award system as social currency
- 0-10 rating scale with visual distribution
- List creation with remix/fork capability
- Privacy controls and blocking
- Notification preferences
- Mobile-responsive design

---

## Contact

scrolling@waxfeed.com

WBRU © 2025 · BROWN BROADCASTING SERVICE, INC. · PROVIDENCE, RI
