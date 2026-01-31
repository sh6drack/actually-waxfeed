# WAXFEED - Task Completion Checklist

## Before Marking a Task Complete

### 1. Type Check
```bash
npm run build   # This includes prisma generate + db push + next build
```
Or for quick type checking without full build:
```bash
npx tsc --noEmit
```

### 2. Linting
```bash
npm run lint
```

### 3. Test Changes
- Run `npm run dev` and manually verify the feature
- For critical flows, consider E2E tests with Playwright

### 4. Database Changes
If you modified `prisma/schema.prisma`:
```bash
npm run db:push      # Push changes to database
npx prisma generate  # Regenerate Prisma client
```

### 5. Review for Security
- No hardcoded secrets or API keys
- Proper authentication checks on protected routes
- Input validation with Zod where needed
- No SQL injection vulnerabilities (Prisma handles this)

### 6. Check for Breaking Changes
- If modifying API responses, check all consumers
- If changing component props, check all usages
- If modifying database schema, check for data migrations needed

## Deployment
Once all checks pass:
```bash
npx vercel --prod    # Deploy to production
```

## Common Issues
- **Prisma errors**: Run `npx prisma generate` after schema changes
- **Type errors**: Check imports and ensure types match
- **Build failures**: Check for missing environment variables
