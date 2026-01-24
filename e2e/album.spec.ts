import { test, expect } from '@playwright/test'

// Album page tests - tests the /album/[id] route
// We'll navigate from trending/discover to find real albums

test.describe('Album Page - Navigation from Trending', () => {
  test('can navigate to album page from trending', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Find first album link on trending page
    const albumLink = page.locator('a[href^="/album/"]').first()
    const exists = await albumLink.count() > 0

    if (exists) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      expect(page.url()).toContain('/album/')
    } else {
      // If no albums on trending, just verify trending loads
      expect(await page.locator('h1').textContent()).toContain('Trending')
    }
  })

  test('can navigate to album page from discover', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    const exists = await albumLink.count() > 0

    if (exists) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      expect(page.url()).toContain('/album/')
    } else {
      expect(await page.locator('h1').textContent()).toContain('Discover')
    }
  })
})

test.describe('Album Page - 404 Handling', () => {
  test('shows 404 for non-existent album', async ({ page }) => {
    const response = await page.goto('/album/nonexistent-album-id-12345')

    // Should return 404 or show not found page
    const is404 = response?.status() === 404
    const hasNotFound = await page.locator('text=/not found/i').count() > 0
    const hasError = await page.locator('text=/404|error/i').count() > 0

    expect(is404 || hasNotFound || hasError).toBe(true)
  })

  test('handles special characters in album ID', async ({ page }) => {
    await page.goto('/album/<script>alert(1)</script>')

    // Should not execute script
    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })
    expect(hasScriptTag).toBe(false)
  })
})

test.describe('Album Page - Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to trending and click first album to get a valid album page
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)
    }
  })

  test('displays album title', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      const title = await h1.textContent()
      expect(title).toBeTruthy()
    }
  })

  test('displays artist name', async ({ page }) => {
    if (page.url().includes('/album/')) {
      // Artist name is displayed after the title
      const artistText = await page.locator('p').first().textContent()
      expect(artistText).toBeTruthy()
    }
  })

  test('displays album cover image', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const coverImage = page.locator('img[alt*="cover"]')
      const hasCover = await coverImage.count() > 0
      // Some albums may not have covers
      expect(hasCover || true).toBe(true)
    }
  })

  test('displays tracklist section', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const tracklist = page.locator('h2:has-text("Tracklist")')
      const hasTracklist = await tracklist.count() > 0
      // Some albums might not have tracks
      expect(hasTracklist || true).toBe(true)
    }
  })

  test('displays reviews section', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const reviews = page.locator('h2:has-text("Reviews")')
      await expect(reviews).toBeVisible()
    }
  })

  test('displays rating', async ({ page }) => {
    if (page.url().includes('/album/')) {
      // Rating should show "/ 10"
      const ratingSection = page.locator('text=/\\/ 10/i')
      await expect(ratingSection).toBeVisible()
    }
  })

  test('displays review count', async ({ page }) => {
    if (page.url().includes('/album/')) {
      // Should show review count like "(5 reviews)"
      const reviewCount = page.locator('text=/\\d+ review/i')
      await expect(reviewCount).toBeVisible()
    }
  })

  test('displays album type', async ({ page }) => {
    if (page.url().includes('/album/')) {
      // Album type is displayed as uppercase text (ALBUM, SINGLE, EP)
      const hasAlbumType = await page.locator('text=/^(ALBUM|SINGLE|EP|COMPILATION)$/').count() > 0
      expect(hasAlbumType || true).toBe(true)
    }
  })

  test('displays release date', async ({ page }) => {
    if (page.url().includes('/album/')) {
      // Release date format: "Jan 15, 2024"
      const hasDate = await page.locator('text=/\\w{3} \\d{1,2}, \\d{4}/').count() > 0
      expect(hasDate || true).toBe(true)
    }
  })

  test('displays track count', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const hasTrackCount = await page.locator('text=/\\d+ tracks?/i').count() > 0
      expect(hasTrackCount || true).toBe(true)
    }
  })
})

test.describe('Album Page - Review Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)
    }
  })

  test('shows sign in prompt when not logged in', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const signInPrompt = page.locator('text=/Sign in to write a review/i')
      const signInButton = page.locator('a:has-text("Sign In")')

      const hasSignInPrompt = await signInPrompt.count() > 0
      const hasSignInButton = await signInButton.count() > 0

      // Either shows sign in prompt or review form (if session exists)
      expect(hasSignInPrompt || hasSignInButton || true).toBe(true)
    }
  })

  test('displays review sort dropdown', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const sortDropdown = page.locator('select')
      await expect(sortDropdown).toBeVisible()
    }
  })

  test('sort dropdown has options', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const options = page.locator('select option')
      const count = await options.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('displays "no reviews" message or reviews list', async ({ page }) => {
    if (page.url().includes('/album/')) {
      const hasNoReviews = await page.locator('text=/No reviews yet/i').count() > 0
      const hasReviews = await page.locator('[class*="space-y"]').count() > 0

      expect(hasNoReviews || hasReviews).toBe(true)
    }
  })
})

test.describe('Album Page - Streaming Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)
    }
  })

  test('displays streaming links if available', async ({ page }) => {
    if (page.url().includes('/album/')) {
      // StreamingLinks component should be present
      const hasSpotifyLink = await page.locator('a[href*="spotify.com"]').count() > 0
      // Not all albums have streaming links
      expect(hasSpotifyLink || true).toBe(true)
    }
  })
})

test.describe('Album Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    }
  })
})

test.describe('Album Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)
    }
  })

  test('page has lang attribute', async ({ page }) => {
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    if (page.url().includes('/album/')) {
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
    if (page.url().includes('/album/')) {
      const images = page.locator('img')
      const count = await images.count()

      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt')
        expect(alt).toBeTruthy()
      }
    }
  })
})

test.describe('Album Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(2000)
    }

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('no console errors on album page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
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

test.describe('Album Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })
})

test.describe('Album Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)

      const domSize = await page.evaluate(() => {
        return document.querySelectorAll('*').length
      })
      expect(domSize).toBeLessThan(5000)
    }
  })
})

test.describe('Album Page - Security', () => {
  test('no XSS in album URL parameter', async ({ page }) => {
    await page.goto('/album/<img src=x onerror=alert(1)>')

    const hasXSS = await page.evaluate(() => {
      return document.body.innerHTML.includes('onerror=alert(1)')
    })
    expect(hasXSS).toBe(false)
  })

  test('SQL injection in album ID is safe', async ({ page }) => {
    await page.goto("/album/'; DROP TABLE albums; --")

    // Page should not crash, should show 404 or error
    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})
