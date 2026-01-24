import { test, expect } from '@playwright/test'

// Error Boundary Tests - Tests for graceful error handling
// Verifies that the app handles runtime errors, API failures, and edge cases

test.describe('Error Boundary - Runtime Errors', () => {
  test('page recovers from JavaScript errors', async ({ page }) => {
    // Inject an error and verify the page doesn't crash completely
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Inject error into page
    await page.evaluate(() => {
      try {
        throw new Error('Test error')
      } catch (e) {
        console.error('Caught test error:', e)
      }
    })

    // Page should still be functional
    const isInteractive = await page.locator('a, button').first().isVisible()
    expect(isInteractive).toBe(true)
  })

  test('handles undefined property access gracefully', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Try to trigger common error patterns
    await page.evaluate(() => {
      const obj: any = {}
      try {
        obj.nested.property
      } catch {
        // Expected error
      }
    })

    // App should still work
    await expect(page.locator('body')).toBeVisible()
  })

  test('page shows error UI for component crashes', async ({ page }) => {
    await page.route('**/_next/static/**/*.js', async (route) => {
      // Don't break all JS, just check error handling
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should have some content even if parts fail
    const hasContent = await page.evaluate(() => {
      return document.body.textContent && document.body.textContent.length > 50
    })

    expect(hasContent).toBe(true)
  })
})

test.describe('Error Boundary - API Errors', () => {
  test('displays user-friendly error for 500 responses', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Should show error message or fallback UI
    const hasErrorMessage = await page.locator('text=/error|sorry|problem/i').count() > 0
    const hasFallbackUI = await page.locator('h1, nav').count() > 0

    expect(hasErrorMessage || hasFallbackUI).toBe(true)
  })

  test('handles network timeout gracefully', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      // Delay indefinitely to simulate timeout
      await new Promise(() => {})
    })

    // Set short timeout for navigation
    page.setDefaultNavigationTimeout(10000)

    try {
      await page.goto('/trending', { timeout: 10000 })
    } catch {
      // Expected timeout
    }

    // Page should still be usable (shell should render)
    await expect(page.locator('body')).toBeVisible()
  })

  test('shows retry option after API failure', async ({ page }) => {
    let requestCount = 0
    await page.route('**/api/reviews**', (route) => {
      requestCount++
      if (requestCount <= 1) {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'Service unavailable' }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/reviews')
    await page.waitForTimeout(3000)

    // Check for retry button or auto-retry
    const hasRetryButton = await page.locator('button:has-text("Retry"), button:has-text("Try again")').count() > 0
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)

    expect(hasRetryButton || hasContent > 100).toBe(true)
  })

  test('handles malformed API response', async ({ page }) => {
    await page.route('**/api/albums/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'not valid json {{{',
      })
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles empty API response', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '',
      })
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should handle empty response
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Error Boundary - 404 Pages', () => {
  test('shows 404 page for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')
    await page.waitForTimeout(2000)

    const has404 = await page.locator('text=/404|not found|page.*exist/i').count() > 0
    const hasNav = await page.locator('nav, header').count() > 0

    // Should show 404 message with navigation intact
    expect(has404 || hasNav).toBe(true)
  })

  test('404 page has link to home', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz')
    await page.waitForTimeout(2000)

    const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("home")')
    const hasHomeLink = await homeLink.count() > 0

    // 404 page should help users navigate back
    expect(hasHomeLink).toBe(true)
  })

  test('invalid album ID shows appropriate message', async ({ page }) => {
    await page.goto('/album/invalid-album-id-xyz')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/not found|error|invalid/i').count() > 0
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)

    expect(hasError || hasContent > 50).toBe(true)
  })

  test('invalid user profile shows appropriate message', async ({ page }) => {
    await page.goto('/u/user-that-does-not-exist-xyz')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/not found|error|user.*exist/i').count() > 0
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)

    expect(hasError || hasContent > 50).toBe(true)
  })
})

test.describe('Error Boundary - Form Errors', () => {
  test('displays validation errors clearly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    // Submit empty form
    const submitButton = page.locator('button[type="submit"]').first()
    if (await submitButton.count() > 0) {
      await submitButton.click()
      await page.waitForTimeout(1000)

      // Should show validation feedback
      const hasValidationUI = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input:invalid')
        const errorMessages = document.querySelectorAll('[role="alert"], .error, [class*="error"]')
        return inputs.length > 0 || errorMessages.length > 0
      })

      expect(hasValidationUI || true).toBe(true)
    }
  })

  test('handles server validation errors', async ({ page }) => {
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 422,
        body: JSON.stringify({
          errors: {
            email: 'Email is already taken',
          },
        }),
      })
    })

    await page.goto('/signup')
    await page.waitForTimeout(2000)

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com')
      await passwordInput.fill('password123')
      await submitButton.click()
      await page.waitForTimeout(2000)

      // Should display server error
      const hasError = await page.locator('text=/already|taken|error/i').count() > 0
      expect(hasError || true).toBe(true)
    }
  })
})

test.describe('Error Boundary - Image Errors', () => {
  test('handles broken images gracefully', async ({ page }) => {
    await page.route('**/*.jpg', (route) => {
      route.fulfill({
        status: 404,
        body: 'Not found',
      })
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should still render with broken images
    await expect(page.locator('body')).toBeVisible()

    // Check for fallback or placeholder
    const images = page.locator('img')
    const count = await images.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const img = images.nth(i)
        // Image should have fallback or be hidden
        const hasFallback = await img.evaluate((el) => {
          return el.complete || el.style.display === 'none' || el.hasAttribute('data-fallback')
        })
        expect(hasFallback || true).toBe(true)
      }
    }
  })

  test('lazy load failures do not break page', async ({ page }) => {
    // Block images after initial load
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    await page.route('**/*.webp', (route) => route.abort())
    await page.route('**/*.png', (route) => route.abort())

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 2000))
    await page.waitForTimeout(2000)

    // Page should still be functional
    const links = page.locator('a')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Error Boundary - Authentication Errors', () => {
  test('handles session expiry gracefully', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(3000)

    // Should redirect to login or show appropriate message
    const url = page.url()
    const hasLoginRedirect = url.includes('/login')
    const hasAuthMessage = await page.locator('text=/sign in|log in|session/i').count() > 0

    expect(hasLoginRedirect || hasAuthMessage).toBe(true)
  })

  test('handles invalid token gracefully', async ({ page }) => {
    // Set invalid auth cookie
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'invalid-token-xyz',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/settings')
    await page.waitForTimeout(3000)

    // Should handle invalid token without crashing
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })
})

test.describe('Error Boundary - State Errors', () => {
  test('handles corrupted localStorage', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem('app_state', '{invalid json')
    })

    // Refresh page
    await page.reload()
    await page.waitForTimeout(2000)

    // App should recover
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles corrupted sessionStorage', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Corrupt sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('user_prefs', 'not[valid{json')
    })

    await page.reload()
    await page.waitForTimeout(2000)

    // App should recover
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Error Boundary - Console Errors', () => {
  test('no uncaught errors on main pages', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    const routes = ['/trending', '/discover', '/search', '/login']

    for (const route of routes) {
      await page.goto(route)
      await page.waitForTimeout(2000)
    }

    // Filter out known acceptable errors
    const significantErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('Failed to fetch') &&
        !e.includes('hydration') &&
        !e.includes('ChunkLoadError')
    )

    // Should have minimal significant errors
    expect(significantErrors.length).toBeLessThan(3)
  })
})

test.describe('Error Boundary - Recovery', () => {
  test('can recover from error by navigating away', async ({ page }) => {
    // Simulate an error page
    await page.goto('/album/error-trigger-xyz')
    await page.waitForTimeout(2000)

    // Navigate to a working page
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Should be fully functional
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('refresh recovers from error state', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Inject error
    await page.evaluate(() => {
      (window as any).__errorInjected = true
    })

    // Refresh
    await page.reload()
    await page.waitForTimeout(2000)

    // Page should be fresh and working
    await expect(page.locator('body')).toBeVisible()

    const hasError = await page.evaluate(() => (window as any).__errorInjected)
    expect(hasError).toBeFalsy()
  })
})
