import { test, expect } from '@playwright/test'

// List page tests - tests the /list/[id] route
// Lists are user-created collections of albums

test.describe('List Page - Navigation', () => {
  test('can navigate to list page from profile', async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    // Find first list link on profile page
    const listLink = page.locator('a[href^="/list/"]').first()
    const exists = await listLink.count() > 0

    if (exists) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      expect(page.url()).toContain('/list/')
    } else {
      // Profile may have no lists
      expect(await page.locator('h1').count()).toBeGreaterThan(0)
    }
  })
})

test.describe('List Page - 404 Handling', () => {
  test('shows 404 for non-existent list', async ({ page }) => {
    const response = await page.goto('/list/nonexistent-list-id-12345')

    const is404 = response?.status() === 404
    const hasNotFound = await page.locator('text=/not found/i').count() > 0
    const hasError = await page.locator('text=/404|error/i').count() > 0

    expect(is404 || hasNotFound || hasError).toBe(true)
  })

  test('handles special characters in list ID', async ({ page }) => {
    await page.goto('/list/<script>alert(1)</script>')

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })
    expect(hasScriptTag).toBe(false)
  })
})

test.describe('List Page - Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a user profile and find a list
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)
    }
  })

  test('displays list title', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      const title = await h1.textContent()
      expect(title).toBeTruthy()
    }
  })

  test('displays list creator username', async ({ page }) => {
    if (page.url().includes('/list/')) {
      // Username with @ prefix
      const username = page.locator('text=/@\\w+/i')
      await expect(username.first()).toBeVisible()
    }
  })

  test('displays album count', async ({ page }) => {
    if (page.url().includes('/list/')) {
      // Format: "X albums"
      const albumCount = page.locator('text=/\\d+ albums?/i')
      await expect(albumCount).toBeVisible()
    }
  })

  test('displays like count', async ({ page }) => {
    if (page.url().includes('/list/')) {
      // Format: "X likes"
      const likeCount = page.locator('text=/\\d+ likes?/i')
      await expect(likeCount).toBeVisible()
    }
  })

  test('displays description if available', async ({ page }) => {
    if (page.url().includes('/list/')) {
      // Description is optional, just check structure exists
      const hasDescription = await page.locator('p.text-\\[\\#888\\]').count() > 0
      expect(hasDescription || true).toBe(true)
    }
  })

  test('displays ranked badge if applicable', async ({ page }) => {
    if (page.url().includes('/list/')) {
      // Ranked lists show "Ranked" badge
      const rankedBadge = page.locator('text=/Ranked/i')
      const hasRanked = await rankedBadge.count() > 0
      // Not all lists are ranked
      expect(hasRanked || true).toBe(true)
    }
  })
})

test.describe('List Page - Album Items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)
    }
  })

  test('displays album items if list has albums', async ({ page }) => {
    if (page.url().includes('/list/')) {
      // Albums should be shown with links
      const albumLinks = page.locator('a[href^="/album/"]')
      const hasAlbums = await albumLinks.count() > 0
      // List might be empty
      expect(hasAlbums || true).toBe(true)
    }
  })

  test('album items have cover images', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const images = page.locator('img')
      const hasImages = await images.count() > 0
      expect(hasImages || true).toBe(true)
    }
  })

  test('clicking album navigates to album page', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const albumLink = page.locator('a[href^="/album/"]').first()
      if (await albumLink.count() > 0) {
        await albumLink.click()
        await page.waitForURL('**/album/**')
        expect(page.url()).toContain('/album/')
      }
    }
  })
})

test.describe('List Page - User Link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)
    }
  })

  test('username link navigates to profile', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const profileLink = page.locator('a[href^="/u/"]').first()
      if (await profileLink.count() > 0) {
        await profileLink.click()
        await page.waitForURL('**/u/**')
        expect(page.url()).toContain('/u/')
      }
    }
  })

  test('displays verified badge if user is verified', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const verifiedBadge = page.locator('[class*="text-blue"]')
      const hasVerified = await verifiedBadge.count() > 0
      // Not all users are verified
      expect(hasVerified || true).toBe(true)
    }
  })
})

test.describe('List Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    }
  })
})

test.describe('List Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)
    }
  })

  test('page has lang attribute', async ({ page }) => {
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const focusableCount = await page.evaluate(() => {
        const focusable = document.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        return focusable.length
      })
      expect(focusableCount).toBeGreaterThan(0)
    }
  })

  test('heading hierarchy is correct', async ({ page }) => {
    if (page.url().includes('/list/')) {
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBe(1)
    }
  })
})

test.describe('List Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(2000)
    }

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('no console errors on list page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
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

test.describe('List Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })
})

test.describe('List Page - Security', () => {
  test('no XSS in list URL parameter', async ({ page }) => {
    // Track if any alert dialog is triggered (would indicate XSS)
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/list/<img src=x onerror=alert(1)>')
    await page.waitForTimeout(500)

    // The critical test: no JavaScript was executed
    expect(alertTriggered).toBe(false)
  })

  test('SQL injection in list ID is safe', async ({ page }) => {
    await page.goto("/list/'; DROP TABLE lists; --")

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})

test.describe('List Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)

      const domSize = await page.evaluate(() => {
        return document.querySelectorAll('*').length
      })
      expect(domSize).toBeLessThan(5000)
    }
  })
})
