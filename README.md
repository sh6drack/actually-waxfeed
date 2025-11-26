# Waxfeed

A social music review platform - "Letterboxd for music". Album-focused community with discourse-heavy music nerd culture.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Music Data**: Spotify Web API

## Getting Started

### 1. Clone and Install

```bash
git clone <repo>
cd waxfeed2.0
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/waxfeed"

# NextAuth.js
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

# Spotify API (get from Spotify Developer Dashboard)
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-secret"
```

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy Client ID and Secret to `.env`

## Album Import

### Via Admin Panel

Navigate to `/admin` to bulk import albums:

- **Search Queries**: Import top results for search terms (e.g., "radiohead", "kendrick lamar")
- **Spotify IDs**: Direct album IDs for specific imports
- **Spotify URLs**: Paste album URLs
- **Artist Name**: Import all albums from an artist

### Via API

```bash
# Import by Spotify IDs
curl -X POST http://localhost:3000/api/albums/import \
  -H "Content-Type: application/json" \
  -d '{"spotifyIds": ["6dVIqQ8qmQ5GBnJ9shOYGE"]}'

# Import by search queries
curl -X POST http://localhost:3000/api/albums/import \
  -H "Content-Type: application/json" \
  -d '{"searchQueries": ["radiohead", "frank ocean", "kendrick lamar"]}'

# Import artist discography
curl -X POST http://localhost:3000/api/albums/import \
  -H "Content-Type: application/json" \
  -d '{"artistName": "Radiohead"}'
```

## Database Schema

Key models:
- **User**: Profiles, auth, social connections
- **Album**: Spotify-sourced metadata, cover art (multiple sizes), tracks
- **Review**: 0-10 ratings, text, likes, wax awards
- **Reply**: Threaded replies on reviews
- **List**: Curated album collections with remix support
- **Follow/Friendship**: Social graph
- **Notification**: In-app notifications
- **WaxAward**: Social currency system

## API Routes

### Albums
- `GET /api/albums` - List albums
- `GET /api/albums/[id]` - Get album details
- `GET /api/albums/search` - Search albums
- `POST /api/albums/import` - Bulk import albums

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `PATCH /api/reviews/[id]` - Update review
- `DELETE /api/reviews/[id]` - Delete review
- `POST /api/reviews/[id]/like` - Like review
- `POST /api/reviews/[id]/wax` - Give wax award

### Lists
- `GET /api/lists` - List public lists
- `POST /api/lists` - Create list
- `POST /api/lists/[id]` - Remix (duplicate) list
- `POST /api/lists/[id]/items` - Add album to list

### Users
- `GET /api/users/[username]` - Get profile
- `PATCH /api/users` - Update own profile
- `POST /api/users/[username]/follow` - Follow user
- `POST /api/users/[username]/friend` - Send friend request

### Social
- `GET /api/social/feed` - Get personalized feed
- `GET /api/notifications` - Get notifications

## Deployment

### Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Database

Use Vercel Postgres, Neon, Supabase, or any PostgreSQL provider.

## Contact

scrolling@waxfeed.com

---

WBRU © 2025 · BROWN BROADCASTING SERVICE, INC. · PROVIDENCE, RI
