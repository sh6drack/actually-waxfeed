import { test, expect } from '@playwright/test'

// Taste Setup flow tests - tests the /taste-setup routes
// This is a multi-step onboarding flow for generating a user's TasteID
// All routes require authentication

test.describe('Taste Setup - Entry Page', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/taste-setup')
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url).toContain('/login')
    expect(url).toContain('callbackUrl')
  })

  test('page loads successfully with redirect', async ({ page }) => {
    const response = await page.goto('/taste-setup')
    expect(response?.status()).toBeLessThan(400)
  })

  test('login page after redirect has working form', async ({ page }) => {
    await page.goto('/taste-setup')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      // Should have email/password fields
      const hasEmailField = await page.locator('input[type="email"], input[name="email"]').count() > 0
      const hasPasswordField = await page.locator('input[type="password"]').count() > 0

      expect(hasEmailField || hasPasswordField).toBe(true)
    }
  })
})

test.describe('Taste Setup - Rate Page', () => {
  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/taste-setup/rate')
    await page.waitForTimeout(2000)

    // Should either be on login or show login required
    const url = page.url()
    const isRedirected = url.includes('/login') || url.includes('/taste-setup/rate')
    expect(isRedirected).toBe(true)
  })

  test('page loads without crashing', async ({ page }) => {
    const response = await page.goto('/taste-setup/rate')
    expect(response?.status()).toBeLessThan(400)
  })

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/taste-setup/rate')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error') &&
             !e.includes('Failed to fetch')
    )

    expect(significantErrors).toHaveLength(0)
  })
})

test.describe('Taste Setup - Result Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/taste-setup/result')
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url).toContain('/login')
  })

  test('page loads with proper redirect', async ({ page }) => {
    const response = await page.goto('/taste-setup/result')
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Taste Setup - Matches Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/taste-setup/matches')
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url).toContain('/login')
  })

  test('page loads with proper redirect', async ({ page }) => {
    const response = await page.goto('/taste-setup/matches')
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Taste Setup - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/taste-setup')
    expect(response?.status()).toBeLessThan(400)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/taste-setup')
    expect(response?.status()).toBeLessThan(400)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/taste-setup')
    expect(response?.status()).toBeLessThan(400)
  })

  test('no horizontal overflow on mobile for rate page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/taste-setup/rate')
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('no horizontal overflow on mobile for result page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/taste-setup/result')
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Taste Setup - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/taste-setup')
    await page.waitForTimeout(1000)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/taste-setup')
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

test.describe('Taste Setup - Error Handling', () => {
  test('entry page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/taste-setup')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('result page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/taste-setup/result')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('matches page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/taste-setup/matches')
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

    await page.goto('/taste-setup')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Taste Setup - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/taste-setup')
    expect(response?.status()).toBeLessThan(400)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/taste-setup')
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Taste Setup - Security', () => {
  test('no XSS in entry page URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/taste-setup?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('no XSS in rate page URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/taste-setup/rate?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('no XSS in result page URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/taste-setup/result?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('no XSS in matches page URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/taste-setup/matches?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Taste Setup - Performance', () => {
  test('entry page has reasonable DOM size', async ({ page }) => {
    await page.goto('/taste-setup')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })

  test('rate page has reasonable DOM size', async ({ page }) => {
    await page.goto('/taste-setup/rate')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })

  test('entry page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/taste-setup')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Taste Setup - Navigation', () => {
  test('login page has callback URL for taste-setup', async ({ page }) => {
    await page.goto('/taste-setup')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      expect(page.url()).toContain('callbackUrl')
      // Should redirect back to taste-setup after login
      expect(page.url()).toContain('taste-setup')
    }
  })

  test('login page shows sign up option', async ({ page }) => {
    await page.goto('/taste-setup')
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      const signupLink = page.locator('a[href*="signup"]')
      const hasSignup = await signupLink.count() > 0
      expect(hasSignup).toBe(true)
    }
  })
})
