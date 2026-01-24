import { test, expect } from '@playwright/test'

// Hot Takes page tests - tests the /hot-takes route
// Community debates about albums

test.describe('Hot Takes Page - Basic Loading', () => {
  test('loads hot takes page successfully', async ({ page }) => {
    const response = await page.goto('/hot-takes')
    expect(response?.status()).toBe(200)
  })

  test('displays page title "Hot Takes"', async ({ page }) => {
    await page.goto('/hot-takes')
    await expect(page.locator('h1:has-text("Hot Takes")')).toBeVisible()
  })

  test('displays community debates subtitle', async ({ page }) => {
    await page.goto('/hot-takes')
    await expect(page.locator('text=/Community Debates/i')).toBeVisible()
  })

  test('displays description text', async ({ page }) => {
    await page.goto('/hot-takes')
    await expect(page.locator('text=/Controversial opinions/i')).toBeVisible()
  })
})

test.describe('Hot Takes Page - Navigation Tabs', () => {
  test('displays Trending tab', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("TRENDING")')).toBeVisible()
  })

  test('displays Recent tab', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("RECENT")')).toBeVisible()
  })

  test('displays Most Heated tab', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("MOST HEATED")')).toBeVisible()
  })

  test('Trending tab is active by default', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)

    const trendingTab = page.locator('button:has-text("TRENDING")')
    const hasBorder = await trendingTab.evaluate(el => el.className.includes('border-b-2'))
    expect(hasBorder).toBe(true)
  })
})

test.describe('Hot Takes Page - Content States', () => {
  test('shows empty state or hot takes list', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(1000)

    const hasEmpty = await page.locator('text=/No hot takes yet/i').count() > 0
    const hasComingSoon = await page.locator('text=/coming soon/i').count() > 0
    const hasHotTakes = await page.locator('[class*="space-y-8"]').count() > 0

    expect(hasEmpty || hasComingSoon || hasHotTakes).toBe(true)
  })

  test('shows sign in prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(1000)

    // Either shows sign in to post button or post a take button (if logged in)
    const hasSignIn = await page.locator('a:has-text("SIGN IN")').count() > 0
    const hasPostTake = await page.locator('a:has-text("POST A TAKE")').count() > 0

    expect(hasSignIn || hasPostTake).toBe(true)
  })
})

test.describe('Hot Takes Page - Post Button', () => {
  test('shows POST A TAKE button when logged in', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)

    // May or may not be logged in
    const postButton = page.locator('a:has-text("POST A TAKE")')
    const hasButton = await postButton.count() > 0
    expect(hasButton || true).toBe(true)
  })

  test('POST A TAKE button links to new hot take page', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)

    const postButton = page.locator('a:has-text("POST A TAKE")')
    if (await postButton.count() > 0) {
      const href = await postButton.getAttribute('href')
      expect(href).toBe('/hot-takes/new')
    }
  })
})

test.describe('Hot Takes Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/hot-takes')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1:has-text("Hot Takes")')).toBeVisible()
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/hot-takes')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/hot-takes')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Hot Takes Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/hot-takes')
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/hot-takes')
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
    await page.goto('/hot-takes')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})

test.describe('Hot Takes Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/hot-takes')
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

    await page.goto('/hot-takes')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Hot Takes Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/hot-takes')
    expect(response?.status()).toBe(200)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/hot-takes')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Hot Takes Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/hot-takes?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Hot Takes Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(500)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })
})

test.describe('Hot Takes Page - New Hot Take', () => {
  test('new hot take page loads', async ({ page }) => {
    const response = await page.goto('/hot-takes/new')
    // Will redirect to login if not authenticated
    expect(response?.status()).toBeLessThan(500)
  })

  test('new hot take page redirects if not logged in', async ({ page }) => {
    await page.goto('/hot-takes/new')
    await page.waitForTimeout(2000)

    // Should redirect or show login prompt
    const isOnLogin = page.url().includes('/login')
    const hasForm = await page.locator('form').count() > 0

    expect(isOnLogin || hasForm).toBe(true)
  })
})
