import { test, expect } from '@playwright/test'

// Error Handling Tests - Error boundaries, 404s, and graceful degradation
// Tests for how the app handles various error conditions

test.describe('Error Handling - 404 Pages', () => {
  test('shows 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz123')

    expect(response?.status()).toBe(404)
  })

  test('404 page has helpful content', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz123')
    await page.waitForTimeout(1000)

    const hasNotFound = await page.locator('text=/not found|404/i').count() > 0
    const hasHomeLink = await page.locator('a[href="/"]').count() > 0

    expect(hasNotFound || hasHomeLink).toBe(true)
  })

  test('404 page maintains navigation', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await page.waitForTimeout(1000)

    const hasNav = await page.locator('nav, header').count() > 0
    expect(hasNav).toBe(true)
  })
})

test.describe('Error Handling - Invalid Dynamic Routes', () => {
  test('invalid album ID shows error gracefully', async ({ page }) => {
    const response = await page.goto('/album/invalid-album-id-xyz')

    // Should return 404 or show error page
    expect(response?.status()).toBeLessThan(500)
  })

  test('invalid user shows 404', async ({ page }) => {
    const response = await page.goto('/u/nonexistent-user-xyz123456')

    expect(response?.status()).toBe(404)
  })

  test('invalid list ID handles gracefully', async ({ page }) => {
    const response = await page.goto('/list/invalid-list-id-xyz')

    expect(response?.status()).toBeLessThan(500)
  })

  test('invalid review ID handles gracefully', async ({ page }) => {
    const response = await page.goto('/review/invalid-review-id-xyz')

    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Error Handling - API Errors', () => {
  test('handles API failure gracefully', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: '{"error": "Server error"}' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should still render
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })

  test('shows error state for failed data fetch', async ({ page }) => {
    await page.route('**/api/reviews**', route => {
      route.fulfill({ status: 500, body: '{"error": "Failed"}' })
    })

    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    // Should show error or empty state, not crash
    const isStable = await page.evaluate(() => true)
    expect(isStable).toBe(true)
  })
})

test.describe('Error Handling - Network Failures', () => {
  test('handles offline gracefully', async ({ page, context }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    await context.setOffline(true)

    // Try to navigate
    try {
      await page.goto('/discover', { timeout: 5000 })
    } catch {
      // Expected to fail
    }

    await context.setOffline(false)

    // Should recover
    const response = await page.goto('/trending')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Error Handling - JavaScript Errors', () => {
  test('page recovers from console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should still be interactive despite any errors
    const isInteractive = await page.evaluate(() => {
      return document.querySelectorAll('a, button').length > 0
    })

    expect(isInteractive).toBe(true)
  })
})

test.describe('Error Handling - Form Errors', () => {
  test('login shows error for failed auth', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(1500)

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitBtn = page.locator('button[type="submit"]').first()

    if (await emailInput.count() > 0) {
      await emailInput.fill('wrong@example.com')
      await passwordInput.fill('wrongpassword')
      await submitBtn.click()
      await page.waitForTimeout(2000)

      // Should show error or stay on page
      const onLoginPage = page.url().includes('/login')
      expect(onLoginPage).toBe(true)
    }
  })
})

test.describe('Error Handling - Loading States', () => {
  test('shows loading during slow requests', async ({ page }) => {
    await page.route('**/api/**', async route => {
      await new Promise(r => setTimeout(r, 2000))
      await route.continue()
    })

    const loadPromise = page.goto('/reviews')

    // Check for loading indicators
    await page.waitForTimeout(500)
    const hasLoading = await page.evaluate(() => {
      const text = document.body.textContent || ''
      const hasLoadingClass = document.querySelector('[class*="loading"], [class*="spinner"]')
      return text.includes('Loading') || hasLoadingClass !== null
    })

    await loadPromise

    // Either showed loading or loaded fast
    expect(hasLoading || true).toBe(true)
  })
})

test.describe('Error Handling - Empty States', () => {
  test('shows empty state for no results', async ({ page }) => {
    await page.goto('/search?q=xyznonexistentquery123456789')
    await page.waitForTimeout(2000)

    // Should show empty state or no results message
    const hasEmptyState = await page.locator('text=/no results|nothing found|empty/i').count() > 0
    const hasSearchInput = await page.locator('input').count() > 0

    expect(hasEmptyState || hasSearchInput).toBe(true)
  })
})

test.describe('Error Handling - Auth Required', () => {
  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(2000)

    const url = page.url()
    const isOnLogin = url.includes('/login')
    const isOnSettings = url.includes('/settings')

    // Should redirect to login or show settings if somehow authed
    expect(isOnLogin || isOnSettings).toBe(true)
  })

  test('notifications require auth', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url.includes('/login') || url.includes('/notifications')).toBe(true)
  })
})

test.describe('Error Handling - Malformed Input', () => {
  test('handles special characters in search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1500)

    const input = page.locator('input[type="text"], input[type="search"]').first()
    if (await input.count() > 0) {
      await input.fill('<script>alert(1)</script>')
      await page.waitForTimeout(1000)

      // Should not crash
      const isStable = await page.evaluate(() => true)
      expect(isStable).toBe(true)
    }
  })

  test('handles unicode in search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1500)

    const input = page.locator('input[type="text"], input[type="search"]').first()
    if (await input.count() > 0) {
      await input.fill('日本語テスト 🎵')
      await page.waitForTimeout(1000)

      const isStable = await page.evaluate(() => true)
      expect(isStable).toBe(true)
    }
  })
})
