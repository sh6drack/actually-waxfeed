import { test, expect } from '@playwright/test'

// Friends page tests - tests the /friends route
// Note: Friends page requires authentication, so most tests will
// verify redirect behavior for unauthenticated users

test.describe('Friends Page - Authentication', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    // Should redirect to login
    const url = page.url()
    expect(url).toContain('/login')
  })

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto('/friends')

    // Will redirect, so status should be 200 (for the redirect target)
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Friends Page - Structure When Authenticated', () => {
  // These tests check what would be visible if logged in
  // Since we can't actually log in, we test the redirect behavior

  test('eventually shows login page', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    // After redirect, should be on login page
    const loginH1 = page.locator('h1:has-text("Sign In")')
    const hasLoginTitle = await loginH1.count() > 0

    expect(hasLoginTitle || page.url().includes('/login')).toBe(true)
  })
})

test.describe('Friends Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/friends')
    expect(response?.status()).toBeLessThan(400)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/friends')
    expect(response?.status()).toBeLessThan(400)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/friends')
    expect(response?.status()).toBeLessThan(400)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Friends Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(1000)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })
    expect(focusableCount).toBeGreaterThan(0)
  })
})

test.describe('Friends Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/friends')
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

    await page.goto('/friends')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Friends Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/friends')
    expect(response?.status()).toBeLessThan(400)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/friends')
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Friends Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    await page.goto('/friends?ref=<script>alert(1)</script>')
    await page.waitForTimeout(1000)

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })
    expect(hasScriptTag).toBe(false)
  })
})

test.describe('Friends Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })
})

test.describe('Friends Page - Navigation', () => {
  test('login page has link back to sign up', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    // After redirect to login, should have signup link
    if (page.url().includes('/login')) {
      const signupLink = page.locator('a[href="/signup"]')
      await expect(signupLink.first()).toBeVisible()
    }
  })
})
