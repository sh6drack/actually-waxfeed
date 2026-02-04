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
- [x] Premium wax for paid users (future)

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

---

## Database Schema

### Models (17 total)
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

### Caching Strategy
- Uses `SpotifyCache` model
- Configurable TTL per data type
- Reduces API calls significantly

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

### February 3, 2026
- **Marketing Messaging Overhaul**: New "Learn Your Taste" positioning
  - Hero: "I listen to everything. Do you though?" — reflects taste back to users
  - Shifted from "prove you found it first" to "understand your musical identity"
  - "What You'll Unlock" → "What You'll Learn" with TasteID as lead feature
  - "What Makes WAXFEED Different?" → "How It Works" (3 steps: Rate → Learn → Go Deeper)
  - Final CTA: "Ready to learn what you actually like?"
  - Footer tagline: "Learn your music taste."
  - Core insight: Everyone says "I listen to everything" but doesn't know their taste

### January 20, 2026
- **Homepage Redesign**: Split layout with Billboard 200 (left) + Recent Reviews (right)
  - Left: Magazine-style grid with bigger album covers from Billboard 200
  - Right: Recent reviews feed
  - 50/50 split down the middle
  - Trending pulls from `billboardRank` field in Album model
- **Auth Account Linking**: Google OAuth now links to existing email accounts
  - If user signs up with email, then later signs in with Google (same email), accounts are merged
  - Google profile picture syncs to existing account if none set

### November 26, 2025
- Initial project setup
- Complete backend API implementation
- Minimal frontend for all core features
- Spotify bulk import system
- Google OAuth authentication
- Database schema with 26 models
- First 20 albums imported (Drake discography)
- User "shadrack" created via onboarding

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
