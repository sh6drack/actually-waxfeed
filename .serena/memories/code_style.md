# WAXFEED - Code Style & Conventions

## TypeScript
- **Strict mode** enabled
- Path aliases: `@/*` → `./src/*`
- Prefer explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/intersections

## File Naming
- React components: PascalCase (e.g., `AlbumCard.tsx`)
- Utilities/libs: kebab-case (e.g., `wax-engine.ts`)
- API routes: `route.ts` in appropriate directory
- Pages: `page.tsx` in App Router directories

## React/Next.js Patterns
- Use App Router conventions (page.tsx, layout.tsx, route.ts)
- Server Components by default, 'use client' only when needed
- Separate client actions into `*-actions.tsx` files
- Use React Server Components for data fetching
- API routes use NextRequest/NextResponse

## Component Organization
```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # Reusable UI components
│   ├── ui/        # Base UI components (buttons, inputs, etc.)
│   └── ...        # Feature-specific components
├── lib/           # Utilities, services, and helpers
├── types/         # TypeScript type definitions
└── data/          # Static data and constants
```

## Styling
- Tailwind CSS with CSS variables for theming
- Key CSS variables defined in globals.css:
  - `--accent-primary` - Gold accent
  - `--background`, `--foreground` - Base colors
  - `--surface`, `--border`, `--muted` - UI colors
- Use responsive design: mobile-first approach

## Database/Prisma
- Models use PascalCase (User, Album, Review)
- Fields use camelCase (userId, createdAt)
- Always include appropriate indexes
- Use enums for constrained values (UserRole, SubTier, TxType)

## API Patterns
- Return consistent JSON responses
- Use Zod for input validation
- Handle errors gracefully with appropriate status codes
- Authentication via `auth()` from NextAuth

## Critical Layout Note (DO NOT BREAK)
Homepage has a two-column layout:
- **Left**: Trending albums grid (48 albums, 4 columns)
- **Right**: Recent reviews (12 reviews)
- Grid: `grid grid-cols-1 lg:grid-cols-2`
