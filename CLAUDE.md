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
- He pays for this tool. Don't waste his time with lazy debugging.

---

## Project: WAXFEED

Music taste platform with social features.

### Key Architecture
- Next.js 16 with App Router
- Prisma + PostgreSQL (Neon)
- NextAuth for authentication
- Vercel deployment
- Tailwind CSS with CSS variables for theming

### Critical Layout (DO NOT BREAK)
Homepage has a two-column layout:
- **Left**: Trending albums grid (48 albums, 4 columns)
- **Right**: Recent reviews (12 reviews)
- Grid: `grid grid-cols-1 lg:grid-cols-2`

### Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npx vercel --prod` - Deploy to production

### CRITICAL: Vercel Deployment
**ALWAYS use project `actually-waxfeed-bkk6`** (www.wax-feed.com)

There are TWO Vercel projects - only ONE is correct:
- ✅ `actually-waxfeed-bkk6` → www.wax-feed.com (THE REAL ONE)
- ❌ `waxfeed2.0` → wax-feed.com (WRONG - DO NOT USE)

If CLI links to wrong project, run:
```bash
rm -rf .vercel && npx vercel link --yes --project actually-waxfeed-bkk6
```

**Never remove or modify `.vercel/project.json` without checking the projectName.**

### CSS Variables
Theme colors defined in `globals.css`:
- `--accent-primary` - Gold accent color
- `--background`, `--foreground` - Base colors
- `--surface`, `--border`, `--muted` - UI colors
