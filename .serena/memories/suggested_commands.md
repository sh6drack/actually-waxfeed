# WAXFEED - Suggested Commands

## Development
```bash
npm run dev          # Start development server (Next.js)
npm run build        # Production build (includes Prisma generate + db push)
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Database (Prisma)
```bash
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database (tsx prisma/seed.ts)
npx prisma generate  # Generate Prisma client (also runs on postinstall)
```

## Deployment
```bash
npx vercel --prod    # Deploy to Vercel production
npx vercel           # Deploy to Vercel preview
```

## Remotion (Video Generation)
```bash
npm run remotion:studio                # Open Remotion studio
npm run remotion:render                # Render WaxFeedPromo
npm run remotion:render:square         # Render square promo
npm run remotion:render:frequency      # Render frequency video
npm run remotion:render:showcase       # Render showcase video
```

## Testing
```bash
npx playwright test                    # Run E2E tests
npx playwright test --ui               # Open Playwright UI
```

## System Utilities (Darwin/macOS)
```bash
ls -la               # List files with details
cd <dir>             # Change directory
grep -r "pattern" .  # Search recursively
find . -name "*.ts"  # Find files by pattern
git status           # Check git status
git diff             # See changes
git log --oneline    # View commit history
```

## TypeScript
```bash
npx tsc --noEmit     # Type check without emitting
```
