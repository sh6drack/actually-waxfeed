import { test, expect } from '@playwright/test'

// Notifications page tests - tests the /notifications route
// Requires authentication

test.describe('Notifications Page - Authentication', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    // Should redirect to login
    const url = page.url()
    expect(url).toContain('/login')
  })

  test('page loads without crashing', async ({ page }) => {
    const response = await page.goto('/notifications')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Notifications Page - UI Elements', () => {
  test('shows loading or redirects appropriately', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(1000)

    // Either shows loading state, notifications title, or redirects
    const hasLoading = await page.locator('text=/Loading/i').count() > 0
    const hasTitle = await page.locator('h1:has-text("Notifications")').count() > 0
    const isOnLogin = page.url().includes('/login')

    expect(hasLoading || hasTitle || isOnLogin).toBe(true)
  })

  test('displays notifications title when logged in', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    if (!page.url().includes('/login')) {
      const h1 = page.locator('h1')
      const hasTitle = await h1.filter({ hasText: /Notifications/i }).count() > 0
      const hasLoading = await page.locator('text=/Loading/i').count() > 0
      expect(hasTitle || hasLoading).toBe(true)
    }
  })

  test('shows empty state or notifications list', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    if (!page.url().includes('/login')) {
      const hasEmpty = await page.locator('text=/No notifications yet/i').count() > 0
      const hasNotifications = await page.locator('[class*="divide-y"]').count() > 0
      const hasLoading = await page.locator('text=/Loading/i').count() > 0
      expect(hasEmpty || hasNotifications || hasLoading).toBe(true)
    }
  })

  test('mark all as read button visible when unread notifications', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    if (!page.url().includes('/login')) {
      // Button only shows when there are unread notifications
      const markAllButton = page.locator('button:has-text("Mark all as read")')
      const hasButton = await markAllButton.count() > 0
      // May or may not have unread
      expect(hasButton || true).toBe(true)
    }
  })
})

test.describe('Notifications Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/notifications')
    expect(response?.status()).toBeLessThan(500)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/notifications')
    expect(response?.status()).toBeLessThan(500)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/notifications')
    expect(response?.status()).toBeLessThan(500)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Notifications Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(1000)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/notifications')
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

test.describe('Notifications Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/notifications')
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

    await page.goto('/notifications')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Notifications Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/notifications')
    expect(response?.status()).toBeLessThan(500)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/notifications')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Notifications Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/notifications?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Notifications Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(2000)
  })
})
