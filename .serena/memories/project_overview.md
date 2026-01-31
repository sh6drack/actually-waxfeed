# WAXFEED - Project Overview

## Purpose
WAXFEED is a social music discovery and review platform - often described as "Letterboxd for music". Users can:
- Rate and review albums (0-10 scale with half-point precision)
- Create curated album lists
- Get matched with users of similar taste (TasteID system)
- Participate in album discussion rooms
- Earn "Wax" currency for engagement
- Win "First Spin" badges for early album reviews

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM (hosted on Neon)
- **Authentication**: NextAuth v5 (beta.30)
- **Payments**: Stripe (subscriptions + one-time purchases)
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Music Data**: Spotify API (albums, tracks, artist info)
- **Animations**: Framer Motion
- **Deployment**: Vercel
- **Video**: Remotion for promotional video generation
- **Testing**: Playwright for E2E tests

## Key Features
1. **Album Reviews** - Rich reviews with ratings, vibes, and reactions
2. **TasteID** - AI-generated taste profiles with archetypes and compatibility matching
3. **First Spin Badges** - Gold/Silver/Bronze badges for early reviewers
4. **Wax Economy** - Virtual currency earned/spent for engagement
5. **Lists** - Ranked and unranked album lists with remix capability
6. **Hot Takes** - Community debates (Overrated/Underrated/Masterpiece/Trash)
7. **Messaging** - Taste-gated DMs (60%+ match required) and album rooms
8. **Circles** - Archetype-based communities
9. **Stations** - College radio station profiles

## Environment
- Darwin (macOS)
- Node.js with npm
- Path alias: `@/*` maps to `./src/*`
