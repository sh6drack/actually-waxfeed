# WAXFEED Feature Log

## Version 1.0.0 - Pre-Refactor Snapshot (January 2026)

### Current State Issues to Address

1. **Header/Body Color Mismatch**
   - Header: White background (`bg-white text-black`)
   - Body: Dark background (`bg-[#0a0a0a]`)
   - Creates jarring visual contrast

2. **No Dark Mode Toggle**
   - App is hardcoded to dark theme in body
   - Header is hardcoded to light theme
   - No user preference support

3. **Excessive Quotation Marks**
   - Location: `src/app/discover/page.tsx:248`
   - `Because you liked "{album.title}"` - quotes unnecessary

4. **Missing Items (reported but not found in code)**
   - "for those who know" tagline - NOT IN CODEBASE
   - "homebru" - NOT IN CODEBASE
   - "djfeed" - NOT IN CODEBASE
   - "MORE" tab - NOT IN CODEBASE
   - NOTE: Live site not accessible to verify. User should check if these exist in:
     - Database content (lists, user-generated)
     - Different branch/deployment
     - Browser cache of old version

---

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 16+ (App Router)
- **Styling:** Tailwind CSS v4 + PostCSS
- **Auth:** NextAuth v5 with Prisma adapter
- **Database:** Prisma ORM
- **API Integration:** Spotify API
- **File Upload:** Cloudinary
- **Analytics:** Vercel Analytics

### Key Files
- `src/app/layout.tsx` - Root layout, theme class
- `src/components/header.tsx` - Navigation header
- `src/app/globals.css` - CSS variables and global styles
- `src/app/page.tsx` - Homepage
- `src/app/discover/page.tsx` - Discovery/recommendations

### Directory Structure
```
/src
├── /app
│   ├── /admin - Admin panel
│   ├── /album/[id] - Album detail pages
│   ├── /api - API routes
│   ├── /discover - Discovery/recommendations
│   ├── /list/[id] - List detail pages
│   ├── /lists - Lists overview
│   ├── /login - Authentication
│   ├── /notifications - Notifications
│   ├── /onboarding - Onboarding flow
│   ├── /review/[id] - Review detail pages
│   ├── /reviews - Reviews feed
│   ├── /search - Search
│   ├── /settings - User settings
│   ├── /trending - Billboard charts
│   ├── /u/[username] - User profiles
│   └── page.tsx - Homepage
├── /components - Reusable components
├── /lib - Utilities (prisma, auth, spotify)
└── /types - TypeScript types
```

---

## Changelog

### [Unreleased]
- [x] Fix header color (make dark to match body)
- [ ] Implement dark/light mode toggle
- [x] Remove excessive quotation marks from discover and list-content
- [ ] Investigate and remove homebru/djfeed if found (not in codebase - check database)
- [ ] Remove "for those who know" tagline if found (not in codebase - check database)
- [ ] Clean up demo content

### [1.0.1] - 2026-01-16
- Fixed header to use dark theme (`bg-[#0a0a0a]`) matching body
- Updated all header elements (search, dropdowns, mobile menu) to dark theme
- Removed excessive quotation marks from:
  - Discover page "Because you liked" section
  - List content notes display

### [1.0.0] - 2026-01-16
- Initial feature log created
- Documented current state before refactor
