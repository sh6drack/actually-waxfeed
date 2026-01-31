# WAXFEED - Architecture Overview

## Directory Structure
```
waxfeed2.0/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── albums/         # Album CRUD, search, import
│   │   │   ├── auth/           # NextAuth routes
│   │   │   ├── circles/        # Taste circles (archetype communities)
│   │   │   ├── cron/           # Scheduled jobs (lyrics, tracks, billboard)
│   │   │   ├── hot-takes/      # Hot takes CRUD and voting
│   │   │   ├── lists/          # User lists CRUD
│   │   │   ├── messages/       # Direct messaging
│   │   │   ├── notifications/  # User notifications
│   │   │   ├── og/             # OpenGraph image generation
│   │   │   ├── reviews/        # Review CRUD, likes, reactions
│   │   │   ├── rooms/          # Album discussion rooms
│   │   │   ├── shop/           # Wax shop purchases
│   │   │   ├── stripe/         # Payment webhooks, checkout
│   │   │   ├── tasteid/        # TasteID computation and matching
│   │   │   ├── tracks/         # Track search and reviews
│   │   │   ├── users/          # User profiles, friends
│   │   │   └── wax/            # Wax balance, transactions
│   │   │
│   │   ├── album/[id]/         # Album detail page
│   │   ├── u/[username]/       # User profile pages
│   │   ├── review/[id]/        # Review detail page
│   │   ├── list/[id]/          # List detail page
│   │   ├── discover/           # Discovery features (swipe, similar-tasters)
│   │   ├── tasteid/            # TasteID dashboard
│   │   └── ...                 # Other feature pages
│   │
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── wax/                # Wax-related components
│   │   ├── tasteid/            # TasteID visualization components
│   │   ├── messages/           # Messaging components
│   │   ├── brainid/            # Brain/personality components
│   │   └── ...                 # Feature-specific components
│   │
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── spotify.ts          # Spotify API client
│   │   ├── stripe.ts           # Stripe client
│   │   ├── tasteid.ts          # TasteID computation logic
│   │   ├── wax-engine.ts       # Wax economy logic
│   │   ├── first-spin.ts       # First Spin badge logic
│   │   ├── messaging.ts        # Messaging utilities
│   │   └── api-utils.ts        # API helper functions
│   │
│   ├── types/                  # TypeScript type definitions
│   └── data/                   # Static data and constants
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding script
│
├── public/                     # Static assets
├── remotion/                   # Promotional video components
└── e2e/                        # Playwright E2E tests
```

## Key Data Models (Prisma)
- **User** - Core user model with auth, wallet, stats
- **Album/Track/Artist** - Music catalog from Spotify
- **Review/TrackReview** - User ratings and reviews
- **List/ListItem** - Curated album lists
- **TasteID** - Computed taste profiles
- **HotTake** - Community debates
- **Conversation/Message** - Direct messaging
- **AlbumRoom/RoomMessage** - Album discussion rooms
- **WaxTransaction** - Currency transactions
- **FirstSpinBadge** - Early reviewer badges

## Key Integrations
1. **Spotify API** - Album/track/artist data
2. **Stripe** - Payments (subscriptions, wax packs)
3. **NextAuth** - Authentication (credentials + OAuth)
4. **Neon** - PostgreSQL database hosting
5. **Vercel** - Deployment and serverless functions
6. **Cloudinary** - Image uploads
