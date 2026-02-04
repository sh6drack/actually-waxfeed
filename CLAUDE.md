# CLAUDE.md - Project Context for Claude Code

## About the Developer

**Shadrack Annor** - Brown University CS & Religious Studies (Class of 2027)

- Website: shadrackannor.com
- GitHub: sh6drack
- Email: shadrack@brown.edu

### Projects
- **WAXFEED** (this project) - Music discovery platform, "Letterboxd for albums"
- **Polarity** - AI exocortex for personal knowledge mapping (polarity-lab.com)
- **WBRU 360** - Creative Director, transforming college radio into multimedia
- **A Very Distant Perspective** - Interview podcast
- **360 Sound** - Live DJ sets from global locations

### Working Style
- Knows what he's doing. Trust his visual feedback immediately.
- Don't second-guess when he says something is broken - act on it.
---

## Project: WAXFEED

Music taste platform with social features.

### Key Architecture
- Next.js 16 with App Router
- Prisma + PostgreSQL (Neon)
- NextAuth for authentication
- Vercel deployment
- Tailwind CSS with CSS variables for theming

### Commands
- `npm run dev` - Development server (usually runs on port 3000, fallback 3004)
- `npm run build` - Production build
- `npx vercel --prod` - Deploy to production

---

## CRITICAL: Vercel Deployment

**ALWAYS use project `actually-waxfeed-bkk6`** (www.wax-feed.com)

There are TWO Vercel projects - only ONE is correct:
- ✅ `actually-waxfeed-bkk6` → www.wax-feed.com (THE REAL ONE)
- ❌ `waxfeed2.0` → wax-feed.com (WRONG - DO NOT USE)

If CLI links to wrong project, run:
```bash
rm -rf .vercel && npx vercel link --yes --project actually-waxfeed-bkk6
```

**If deployments fail with "Resource provisioning failed":**
- Go to Vercel dashboard → Project Settings → Git
- Toggle Git LFS setting (this fixed a 4-day outage in Feb 2026)

---

## Homepage Layout (CRITICAL - DO NOT BREAK)

Two-column layout with specific requirements:

### Left Column: Trending Albums
- **Must show 48 albums** (not 15, not 50 - exactly 48 for 4x12 grid)
- Grid: 4 columns on desktop
- Source: Billboard 200 (scraped and imported)
- API: `/api/cron/billboard` updates the chart
- Query: `prisma.album.findMany({ where: { billboardRank: { not: null } }, take: 50 })`
- **If showing less than 48**: Billboard scrape might be failing or too many singles being skipped

### Right Column: Recent Reviews
- Shows 12 reviews with actual text (not quick rates)
- Query filters: `{ text: { not: null }, text: { not: '' } }`

### Grid CSS
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <TrendingAlbums /> {/* 48 albums, 4 cols */}
  <RecentReviews />  {/* 12 reviews */}
</div>
```

---

## Quick Rate Page (`/quick-rate`)

### Design (Feb 2026 Redesign)
- **Cinematic split layout** on desktop: Album art (55% left), controls (45% right)
- **Ambient album glow**: Blurred album art as background
- **Grain texture overlay**: Premium analog feel
- **Pill-shaped vibes buttons**: Rounded-full with hover scale effects
- **Gold accent (#ffd700)** for primary actions
- **Cyan (#22d3ee)** for Spotify waveform indicator

### Key Features
- 30-second track previews from Deezer API
- Real waveforms from Spotify Audio Analysis (cyan colored)
- Pseudo-waveforms for tracks without Spotify data (gray)
- Vibes selection (0-5 descriptors from POLARITY_DESCRIPTORS)
- Keyboard shortcuts: Enter=Rate, S=Skip, B/Backspace=Back
- TasteID tier progress bar at bottom

### Files
- `src/app/quick-rate/page.tsx` - Main component
- `src/app/api/albums/[id]/tracks/route.ts` - Fetches tracks from Deezer + waveforms from Spotify
- `src/lib/spotify.ts` - Spotify API integration including `getTrackWaveform()`

---

## Spotify Integration

### Credentials (in .env.local)
```
SPOTIFY_CLIENT_ID=555cda9a4ce144ae97215f443af0bbe7
SPOTIFY_CLIENT_SECRET=c0db665ecf584e739dd20be206a7e947
```

### Key Functions (`src/lib/spotify.ts`)
- `getAccessToken()` - Client credentials flow
- `searchAlbum()` - Find album on Spotify
- `getAlbum()` - Full album details with tracks
- `importAlbumToDatabase()` - Import to Prisma
- `getTrackWaveform(trackName, artistName)` - Get real waveform data
- `getAudioAnalysis(spotifyTrackId)` - Raw audio analysis
- `segmentsToWaveform()` - Convert segments to 40-bar array

### Waveform Data
- 40 bars, values 0-1
- Comes from Spotify's `audio-analysis` endpoint
- Cached in `SpotifyCache` table
- Displayed cyan when real, gray when pseudo-generated

---

## TasteID System

### Tiers (in `src/lib/tasteid-tiers.ts`)
- **Listener** (0-19 ratings): 40% accuracy
- **Enthusiast** (20-49 ratings): 60% accuracy
- **Connoisseur** (50-99 ratings): 75% accuracy
- **Sommelier** (100-199 ratings): 85% accuracy
- **Curator** (200-499 ratings): 92% accuracy
- **Oracle** (500+ ratings): 98% accuracy

### Computation
- API: `POST /api/tasteid/compute`
- Background recompute every 5 ratings after unlock (20)
- Stores: primaryArchetype, genreProfile, vibeSignature, etc.

### Polarity OS Integration (v2.1)
- Pattern learning engine with lifecycle: emerging → confirmed → fading → dormant
- Drift detection for taste changes
- Cognitive graph with PageRank scoring
- Files in `src/lib/polarity/`

---

## API Routes

### Albums
- `GET /api/albums/[id]` - Album details
- `GET /api/albums/[id]/tracks` - Tracks with previews and waveforms (Deezer + Spotify)
- `GET /api/albums/swipe` - Albums for quick-rate (excludes already rated)

### Reviews
- `POST /api/reviews` - Submit review/rating
- `GET /api/reviews/[id]` - Single review

### Cron Jobs
- `GET /api/cron/billboard` - Scrape Billboard 200, import to DB
- `GET /api/cron/fetch-lyrics` - Background lyrics fetching

### TasteID
- `POST /api/tasteid/compute` - Recompute user's TasteID
- `GET /api/tasteid/[userId]` - Get TasteID data

---

## Design System

### Colors (CSS Variables in `globals.css`)
```css
--accent-primary: #ffd700;      /* Gold - primary actions */
--accent-hover: #ffe44d;        /* Gold hover state */
--background: #0a0a0a;          /* Near-black */
--foreground: #fafafa;          /* Near-white */
--surface: #141414;             /* Card backgrounds */
--border: #262626;              /* Borders */
--muted: #a3a3a3;               /* Secondary text */
```

### Secondary Colors
- **Cyan (#22d3ee)**: Spotify data indicator
- **Emerald (#00ff88)**: Success states, unlocks
- **Red (#ef4444)**: Errors

### Typography
- Use tracking-wide/tracking-wider for labels
- Uppercase for labels and small UI text
- Font weights: font-medium, font-semibold, font-bold

### Components
- Rounded-full buttons for primary actions
- Pill-shaped tags and chips
- Subtle borders (border-white/10 or border-[--border])
- Backdrop blur for floating elements

---

## Site-Wide Policies

### NO SINGLES
- Singles (`album_type === 'single'`) are NEVER allowed anywhere on the site
- All queries filter: `albumType: { not: 'single' }`
- Import functions skip singles automatically

### No Guess URLs
- Never generate or guess URLs for the user
- Only use URLs provided by user or from known sources

---

## Stripe Integration

### MCP Server
Use the Stripe MCP plugin for debugging payment issues:
- Plugin enabled in `.claude/settings.json`
- Skills: `stripe:explain-error`, `stripe:test-cards`, `stripe:stripe-best-practices`

### Environment Variables
**Stored in `.env` (gitignored) and Vercel Production:**
- `STRIPE_SECRET_KEY` - Live secret key (`sk_live_51St5aA...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live publishable key (`pk_live_51St5aA...`)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_WAX_*_PRICE_ID` - Product price IDs for Wax Pax

**Keys are saved in `.env` file (gitignored, safe).**

### Key Files
- `src/lib/stripe.ts` - Stripe config, pricing tiers, Wax Pax definitions
- `src/app/api/stripe/payment-intent/route.ts` - Creates payment intents
- `src/app/api/stripe/webhook/route.ts` - Handles Stripe webhooks
- `src/components/CheckoutModal.tsx` - Embedded checkout UI
- `src/components/PaymentForm.tsx` - Stripe Elements form

### Important
- **Never mix test and live keys** - both must match environment
- Test keys (`sk_test_`, `pk_test_`) only work with test card numbers
- Live keys (`sk_live_`, `pk_live_`) process real payments

---

## Common Issues & Fixes

### Billboard shows less than 48 albums
- Check `/api/cron/billboard` response
- Singles are being skipped (correct behavior)
- Billboard website structure may have changed (update cheerio selectors)
- Spotify search not finding albums (check API)

### Quick Rate not updating
- Hard refresh the page (Cmd+Shift+R)
- Dev server may be caching - restart with `npm run dev`

### Waveforms not showing
- Check Spotify credentials in .env.local
- Tracks may not have audio analysis available
- Deezer may not have the album

### Deployment fails
- Check correct Vercel project (`actually-waxfeed-bkk6`)
- Toggle Git LFS in project settings
- Check build logs for TypeScript errors

---

## After Sizeable Updates

**Always update FEATURE_LOG.md** after implementing significant features or changes:
- New authentication methods
- New pages or components
- API changes
- Database schema changes
- Major UI/UX updates

This keeps the project documentation current and helps track progress.

---

## Authentication Providers

Currently enabled:
- **Google OAuth** - Client ID in Vercel env vars
- **GitHub OAuth** - Added Feb 2026
- **Email/Password** - With rate limiting (5 attempts per 15 min)

Callback URLs (must be set in provider dashboards):
- Google: `https://www.wax-feed.com/api/auth/callback/google`
- GitHub: `https://www.wax-feed.com/api/auth/callback/github`

Account linking is automatic - if a user signs up with email then later uses Google/GitHub with the same email, accounts are merged.

### Google OAuth Credentials (Feb 2026)
```
GOOGLE_CLIENT_ID=853701019564-uheh07y0egjmbsetq7jggoreserkke.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**Google Cloud Console:** Project with OAuth client named "waxfeed"
- Authorized JavaScript origins: `https://www.wax-feed.com`
- Authorized redirect URIs: `https://www.wax-feed.com/api/auth/callback/google`

**If Google OAuth breaks with "invalid_client":**
1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Check if the OAuth client still exists
3. If deleted, create new one with above settings
4. Update credentials in `.env.local` AND Vercel env vars
5. Redeploy

### GitHub OAuth Credentials (Feb 2026)
```
GITHUB_CLIENT_ID=Ov23liotc8cUK0dw4LTe
GITHUB_CLIENT_SECRET=c664f9993e4bbdd6c2c69a236bda6fc399201094
```

**GitHub Developer Settings:** OAuth App named "WAXFEED"
- Homepage URL: `https://www.wax-feed.com`
- Authorization callback URL: `https://www.wax-feed.com/api/auth/callback/github`
