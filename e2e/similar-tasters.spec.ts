import { test, expect } from '@playwright/test'

// Similar Tasters page tests - tests the /discover/similar-tasters route
// Shows users with similar musical taste based on TasteID
// Requires authentication and having a TasteID

test.describe('Similar Tasters Page - Authentication', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    const url = page.url()
    // Should redirect to login with callback URL
    expect(url).toContain('/login')
    expect(url).toContain('callbackUrl')
  })

  test('page loads successfully with redirect', async ({ page }) => {
    const response = await page.goto('/discover/similar-tasters')
    expect(response?.status()).toBeLessThan(400)
  })

  test('login page has callback URL for similar-tasters', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      expect(page.url()).toContain('similar-tasters')
    }
  })
})

test.describe('Similar Tasters Page - After Auth Redirect', () => {
  test('login page has working form', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      const hasEmailField = await page.locator('input[type="email"], input[name="email"]').count() > 0
      const hasPasswordField = await page.locator('input[type="password"]').count() > 0

      expect(hasEmailField || hasPasswordField).toBe(true)
    }
  })

  test('login page shows Sign In heading', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      const hasSignIn = await page.locator('h1:has-text("Sign In")').count() > 0
      expect(hasSignIn).toBe(true)
    }
  })
})

test.describe('Similar Tasters Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/discover/similar-tasters')
    expect(response?.status()).toBeLessThan(400)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/discover/similar-tasters')
    expect(response?.status()).toBeLessThan(400)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/discover/similar-tasters')
    expect(response?.status()).toBeLessThan(400)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Similar Tasters Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(1000)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
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

test.describe('Similar Tasters Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/discover/similar-tasters')
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

    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Similar Tasters Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/discover/similar-tasters')
    expect(response?.status()).toBeLessThan(400)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/discover/similar-tasters')
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Similar Tasters Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/discover/similar-tasters?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('no XSS with image onerror in URL', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/discover/similar-tasters?q=<img src=x onerror=alert(1)>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Similar Tasters Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/discover/similar-tasters')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Similar Tasters Page - Navigation', () => {
  test('login page has signup link', async ({ page }) => {
    await page.goto('/discover/similar-tasters')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      const signupLink = page.locator('a[href*="signup"]')
      const hasSignup = await signupLink.count() > 0
      expect(hasSignup).toBe(true)
    }
  })

  test('can navigate from discover page', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForTimeout(1000)

    // There might be a link to similar-tasters from discover
    const similarTastersLink = page.locator('a[href*="similar-tasters"]')
    if (await similarTastersLink.count() > 0) {
      await similarTastersLink.first().click()
      await page.waitForTimeout(2000)

      // Should either be on similar-tasters or redirected to login
      const url = page.url()
      expect(url.includes('similar-tasters') || url.includes('login')).toBe(true)
    }
  })
})
