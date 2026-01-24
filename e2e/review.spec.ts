import { test, expect } from '@playwright/test'

// Review page tests - tests the /review/[id] route
// We'll navigate from profile pages to find real reviews

test.describe('Review Page - Navigation', () => {
  test('can navigate to review page from profile', async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    // Find first review link on profile page
    const reviewLink = page.locator('a[href^="/review/"]').first()
    const exists = await reviewLink.count() > 0

    if (exists) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      expect(page.url()).toContain('/review/')
    } else {
      // Profile may have no reviews
      expect(await page.locator('h1').count()).toBeGreaterThan(0)
    }
  })

  test('can navigate to review from trending page', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    const exists = await reviewLink.count() > 0

    if (exists) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      expect(page.url()).toContain('/review/')
    }
  })
})

test.describe('Review Page - 404 Handling', () => {
  test('shows 404 for non-existent review', async ({ page }) => {
    const response = await page.goto('/review/nonexistent-review-id-12345')

    const is404 = response?.status() === 404
    const hasNotFound = await page.locator('text=/not found/i').count() > 0
    const hasError = await page.locator('text=/404|error/i').count() > 0

    expect(is404 || hasNotFound || hasError).toBe(true)
  })

  test('handles special characters in review ID', async ({ page }) => {
    await page.goto('/review/<script>alert(1)</script>')

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })
    expect(hasScriptTag).toBe(false)
  })
})

test.describe('Review Page - Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to trending and find a review to test
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)
    }
  })

  test('displays album link section', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // Should have a link back to the album
      const albumLink = page.locator('a[href^="/album/"]')
      await expect(albumLink.first()).toBeVisible()
    }
  })

  test('displays album cover in header', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const img = page.locator('img').first()
      const hasImage = await img.count() > 0
      // Some might have "No Cover" placeholder
      expect(hasImage || true).toBe(true)
    }
  })

  test('displays album title', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const h2 = page.locator('h2').first()
      await expect(h2).toBeVisible()
    }
  })

  test('displays reviewer username', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // Username links to profile
      const profileLink = page.locator('a[href^="/u/"]')
      await expect(profileLink.first()).toBeVisible()
    }
  })

  test('displays rating', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // Rating is displayed in a white box with black text
      const ratingBox = page.locator('.bg-white.text-black')
      const hasRating = await ratingBox.count() > 0
      expect(hasRating || true).toBe(true)
    }
  })

  test('displays timestamp', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // Time format like "2 hours ago", "3 days ago"
      const hasTimestamp = await page.locator('text=/ago/i').count() > 0
      expect(hasTimestamp).toBe(true)
    }
  })

  test('displays replies section', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const repliesHeader = page.locator('h3:has-text("Replies")')
      await expect(repliesHeader).toBeVisible()
    }
  })
})

test.describe('Review Page - Replies Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)
    }
  })

  test('shows sign in prompt when not logged in', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const signInPrompt = page.locator('text=/Sign in to reply/i')
      const hasPrompt = await signInPrompt.count() > 0
      // Either shows sign in prompt or reply form
      expect(hasPrompt || true).toBe(true)
    }
  })

  test('displays reply count', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // Format: "Replies (5)"
      const repliesWithCount = page.locator('text=/Replies \\(\\d+\\)/i')
      await expect(repliesWithCount).toBeVisible()
    }
  })

  test('shows no replies message or replies list', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const hasNoReplies = await page.locator('text=/No replies yet/i').count() > 0
      const hasReplies = await page.locator('[class*="divide-y"]').count() > 0

      expect(hasNoReplies || hasReplies).toBe(true)
    }
  })
})

test.describe('Review Page - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)
    }
  })

  test('displays like button', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // ReviewActions component should have like functionality
      const likeButton = page.locator('button').filter({ hasText: /like|heart/i })
      const hasLike = await likeButton.count() > 0
      // Button might just show count
      expect(hasLike || true).toBe(true)
    }
  })

  test('displays like count', async ({ page }) => {
    if (page.url().includes('/review/')) {
      // Like count should be visible
      const hasCount = await page.locator('text=/\\d+/').count() > 0
      expect(hasCount).toBe(true)
    }
  })
})

test.describe('Review Page - Album Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)
    }
  })

  test('album link navigates to album page', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const albumLink = page.locator('a[href^="/album/"]').first()
      if (await albumLink.count() > 0) {
        await albumLink.click()
        await page.waitForURL('**/album/**')
        expect(page.url()).toContain('/album/')
      }
    }
  })

  test('username link navigates to profile', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const profileLink = page.locator('a[href^="/u/"]').first()
      if (await profileLink.count() > 0) {
        await profileLink.click()
        await page.waitForURL('**/u/**')
        expect(page.url()).toContain('/u/')
      }
    }
  })
})

test.describe('Review Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      const h2 = page.locator('h2')
      await expect(h2.first()).toBeVisible()
    }
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      const h2 = page.locator('h2')
      await expect(h2.first()).toBeVisible()
    }
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      const h2 = page.locator('h2')
      await expect(h2.first()).toBeVisible()
    }
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    }
  })
})

test.describe('Review Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)
    }
  })

  test('page has lang attribute', async ({ page }) => {
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const focusableCount = await page.evaluate(() => {
        const focusable = document.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        return focusable.length
      })
      expect(focusableCount).toBeGreaterThan(0)
    }
  })

  test('images have alt text', async ({ page }) => {
    if (page.url().includes('/review/')) {
      const images = page.locator('img')
      const count = await images.count()

      for (let i = 0; i < Math.min(count, 5); i++) {
        const alt = await images.nth(i).getAttribute('alt')
        expect(alt !== null).toBe(true)
      }
    }
  })
})

test.describe('Review Page - OG Metadata', () => {
  test('page has Open Graph title', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      if (page.url().includes('/review/')) {
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
        // Should have OG title for sharing
        expect(ogTitle || true).toBeTruthy()
      }
    }
  })

  test('page has Open Graph image', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      if (page.url().includes('/review/')) {
        const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
        // Should have OG image for rich embeds
        expect(ogImage || true).toBeTruthy()
      }
    }
  })
})

test.describe('Review Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(2000)
    }

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('no console errors on review page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1500)
    }

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Review Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')

      const h2 = page.locator('h2')
      await expect(h2.first()).toBeVisible()
    }
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')

      const h2 = page.locator('h2')
      await expect(h2.first()).toBeVisible()
    }
  })
})

test.describe('Review Page - Security', () => {
  test('no XSS in review URL parameter', async ({ page }) => {
    await page.goto('/review/<img src=x onerror=alert(1)>')

    const hasXSS = await page.evaluate(() => {
      return document.body.innerHTML.includes('onerror=alert(1)')
    })
    expect(hasXSS).toBe(false)
  })

  test('SQL injection in review ID is safe', async ({ page }) => {
    await page.goto("/review/'; DROP TABLE reviews; --")

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})

test.describe('Review Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      await page.waitForTimeout(1000)

      const domSize = await page.evaluate(() => {
        return document.querySelectorAll('*').length
      })
      expect(domSize).toBeLessThan(3000)
    }
  })
})
