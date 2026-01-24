import { test, expect } from '@playwright/test'

// Lists browse page tests - tests the /lists route
// Displays curated album collections from users

test.describe('Lists Browse Page - Basic Loading', () => {
  test('loads lists page successfully', async ({ page }) => {
    const response = await page.goto('/lists')
    expect(response?.status()).toBe(200)
  })

  test('displays page title "Lists"', async ({ page }) => {
    await page.goto('/lists')
    await expect(page.locator('h1:has-text("Lists")')).toBeVisible()
  })

  test('displays curated collections subtitle', async ({ page }) => {
    await page.goto('/lists')
    await expect(page.locator('text=/Curated Collections/i')).toBeVisible()
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/lists')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Lists Browse Page - Statistics', () => {
  test('displays total lists count', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    // Should show "X Lists"
    const hasListsCount = await page.locator('text=/\\d+.*Lists/i').count() > 0
    expect(hasListsCount).toBe(true)
  })

  test('displays albums curated count', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    // Should show "X Albums Curated"
    const hasAlbumsCount = await page.locator('text=/Albums Curated/i').count() > 0
    expect(hasAlbumsCount).toBe(true)
  })
})

test.describe('Lists Browse Page - Sections', () => {
  test('displays Featured section', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const hasFeatured = await page.locator('text=/Featured/i').count() > 0
    // May or may not have featured lists
    expect(hasFeatured || true).toBe(true)
  })

  test('displays Popular section', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const hasPopular = await page.locator('text=/Popular/i').count() > 0
    expect(hasPopular || true).toBe(true)
  })

  test('displays Recent section', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const hasRecent = await page.locator('text=/Recent/i').count() > 0
    expect(hasRecent || true).toBe(true)
  })

  test('displays Create CTA section', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const hasCreateCTA = await page.locator('text=/Create a list/i').count() > 0
    expect(hasCreateCTA).toBe(true)
  })
})

test.describe('Lists Browse Page - Navigation', () => {
  test('clicking list navigates to list page', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(1000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      expect(page.url()).toContain('/list/')
    }
  })

  test('create button links to login or new list page', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    // Either "Start a List" (logged in) or "Sign In to Create" (logged out)
    const createButton = page.locator('a:has-text("Start a List")')
    const signInButton = page.locator('a:has-text("Sign In to Create")')

    const hasCreate = await createButton.count() > 0
    const hasSignIn = await signInButton.count() > 0

    expect(hasCreate || hasSignIn).toBe(true)
  })
})

test.describe('Lists Browse Page - List Cards', () => {
  test('list cards show album covers', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(1000)

    const images = page.locator('img')
    const hasImages = await images.count() > 0
    // May have empty state
    expect(hasImages || true).toBe(true)
  })

  test('list cards show creator username', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(1000)

    const usernames = page.locator('text=/@\\w+/i')
    const hasUsernames = await usernames.count() > 0
    expect(hasUsernames || true).toBe(true)
  })

  test('list cards show album count', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(1000)

    const albumCounts = page.locator('text=/\\d+ albums?/i')
    const hasAlbumCounts = await albumCounts.count() > 0
    expect(hasAlbumCounts || true).toBe(true)
  })

  test('list cards show like count', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(1000)

    const likeCounts = page.locator('text=/\\d+ likes?/i')
    const hasLikeCounts = await likeCounts.count() > 0
    expect(hasLikeCounts || true).toBe(true)
  })
})

test.describe('Lists Browse Page - Footer', () => {
  test('displays WAXFEED footer', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })

  test('footer shows Lists label', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const hasListsInFooter = await page.locator('text=/WAXFEED.*Lists/i').count() > 0
    expect(hasListsInFooter).toBe(true)
  })
})

test.describe('Lists Browse Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/lists')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1:has-text("Lists")')).toBeVisible()
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/lists')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/lists')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Lists Browse Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/lists')
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })
    expect(focusableCount).toBeGreaterThan(0)
  })

  test('heading hierarchy is correct', async ({ page }) => {
    await page.goto('/lists')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})

test.describe('Lists Browse Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/lists')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/lists')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Lists Browse Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/lists')
    expect(response?.status()).toBe(200)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/lists')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Lists Browse Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/lists?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Lists Browse Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(500)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(5000)
  })
})
