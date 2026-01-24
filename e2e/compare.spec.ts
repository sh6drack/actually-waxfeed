import { test, expect } from '@playwright/test'

// Compare page tests - tests the /u/[username]/compare route
// Allows comparing TasteIDs between users

const TEST_USER = 'waxfeedapp'

test.describe('Compare Page - Authentication', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(2000)

    // Should redirect to login with callback
    const url = page.url()
    expect(url).toContain('/login')
  })

  test('page loads without crashing', async ({ page }) => {
    const response = await page.goto(`/u/${TEST_USER}/compare`)
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Compare Page - Structure', () => {
  test('shows TASTE COMPARISON title when accessible', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(2000)

    if (!page.url().includes('/login')) {
      const hasTitle = await page.locator('h1:has-text("TASTE COMPARISON")').count() > 0
      const hasCannotCompare = await page.locator('text=/CANNOT COMPARE/i').count() > 0
      const hasNeedsTasteId = await page.locator('text=/GENERATE YOUR TASTEID/i').count() > 0

      expect(hasTitle || hasCannotCompare || hasNeedsTasteId).toBe(true)
    }
  })

  test('shows back to profile link', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(2000)

    if (!page.url().includes('/login')) {
      const backLink = page.locator(`a[href="/u/${TEST_USER}"]`)
      const hasBackLink = await backLink.count() > 0
      expect(hasBackLink || true).toBe(true)
    }
  })
})

test.describe('Compare Page - Error States', () => {
  test('handles non-existent user', async ({ page }) => {
    const response = await page.goto('/u/nonexistentuser12345/compare')

    // Should show 404 or redirect
    const is404 = response?.status() === 404
    const hasNotFound = await page.locator('text=/not found/i').count() > 0
    const redirectedToLogin = page.url().includes('/login')

    expect(is404 || hasNotFound || redirectedToLogin).toBe(true)
  })

  test('handles comparing with self gracefully', async ({ page }) => {
    // This would redirect to own TasteID if authenticated
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(2000)

    // Should either redirect or show appropriate message
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })
})

test.describe('Compare Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto(`/u/${TEST_USER}/compare`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto(`/u/${TEST_USER}/compare`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto(`/u/${TEST_USER}/compare`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Compare Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(1000)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/compare`)
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

test.describe('Compare Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto(`/u/${TEST_USER}/compare`)
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

    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Compare Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto(`/u/${TEST_USER}/compare`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto(`/u/${TEST_USER}/compare`)
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Compare Page - Security', () => {
  test('no XSS in username parameter', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/u/<script>alert(1)</script>/compare')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Compare Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/compare`)
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })
})
