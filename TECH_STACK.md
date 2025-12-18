# Waxfeed Tech Stack

This document lists all third-party services and tools used in the Waxfeed codebase. When funding is secured, consider migrating to a unified Supabase stack.

## Current Services

### Database
- **Neon PostgreSQL** - Serverless Postgres database
  - URL: `postgresql://...@neon.tech`
  - Used for: All application data (users, reviews, albums, etc.)
  - **Supabase alternative**: Supabase PostgreSQL

### ORM
- **Prisma** - TypeScript ORM
  - Used for: Database queries, migrations, schema management
  - **Supabase alternative**: Supabase client with RLS

### Authentication
- **NextAuth.js v5 (Auth.js)** - Authentication library
  - Provider: Email/password (credentials)
  - Used for: User login, sessions, JWT tokens
  - **Supabase alternative**: Supabase Auth

### File Storage
- **Uploadthing** - File upload service (free tier)
  - Used for: Profile picture uploads
  - Requires: `UPLOADTHING_TOKEN` env variable
  - **Supabase alternative**: Supabase Storage

### External APIs
- **Spotify Web API** - Music metadata
  - Used for: Album search, track info, cover art
  - Requires: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
  - **No change needed**

- **Genius API** - Lyrics
  - Used for: Song lyrics fetching
  - Requires: `GENIUS_ACCESS_TOKEN`
  - **No change needed**

### Hosting & Deployment
- **Vercel** - Hosting platform
  - Used for: Next.js deployment, serverless functions, cron jobs
  - Cron jobs defined in `vercel.json`
  - **No change needed** (or use Supabase Edge Functions)

### Analytics
- **Vercel Analytics** - Web analytics
  - Used for: Page views, performance metrics
  - **No change needed**

---

## Environment Variables Required

```env
# Database (Neon → Supabase)
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"

# Uploadthing (→ Supabase Storage)
UPLOADTHING_TOKEN="..."

# Spotify API
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."

# Genius API
GENIUS_ACCESS_TOKEN="..."

# Cron job protection
CRON_SECRET="..."
```

---

## Migration Plan to Supabase

When switching to Supabase, the following migrations would be needed:

### 1. Database
- Export Neon data
- Create Supabase project
- Update `DATABASE_URL` to Supabase connection string
- Run Prisma migrations on new database

### 2. Authentication
- Replace NextAuth with Supabase Auth
- Update all `auth()` calls to use Supabase client
- Migrate user sessions

### 3. File Storage
- Replace Uploadthing with Supabase Storage
- Update upload API routes
- Migrate existing uploaded files (if any)
- Create storage buckets with appropriate policies

### 4. Real-time (Future Feature)
- Supabase provides real-time subscriptions out of the box
- Useful for: notifications, live activity feed, chat

---

## Cron Jobs

Located in `src/app/api/cron/`:

1. **Billboard 200 Import** (`/api/cron/billboard`)
   - Schedule: Weekly
   - Purpose: Import trending albums from Billboard chart

2. **Fetch Album Tracks** (`/api/cron/fetch-tracks`)
   - Schedule: Every 6 hours
   - Purpose: Fetch tracks for albums missing track data

---

## NPM Packages

### Core
- `next` - React framework
- `react`, `react-dom` - UI library
- `typescript` - Type safety

### Database & Auth
- `prisma`, `@prisma/client` - ORM
- `next-auth` - Authentication

### File Uploads
- `uploadthing`, `@uploadthing/react` - File uploads

### UI & Styling
- `tailwindcss` - CSS framework
- `clsx`, `tailwind-merge` - Utility for class names

### Data Fetching & Validation
- `zod` - Schema validation
- `cheerio` - HTML parsing (for Billboard scraping)

### Utilities
- `date-fns` - Date formatting
- `bcryptjs` - Password hashing
