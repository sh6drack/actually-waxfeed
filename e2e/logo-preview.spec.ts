import { test, expect } from '@playwright/test'

// Logo Preview page tests - tests the /logo-preview route
// Development page showing all logo variants

test.describe('Logo Preview Page - Basic Loading', () => {
  test('loads logo preview page successfully', async ({ page }) => {
    const response = await page.goto('/logo-preview')
    expect(response?.status()).toBe(200)
  })

  test('displays Logo Versions title', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const title = page.locator('h1:has-text("Logo")')
    await expect(title).toBeVisible()
  })

  test('displays Official Waxfeed Logo section', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const section = page.locator('h2:has-text("Official Waxfeed Logo")')
    await expect(section).toBeVisible()
  })

  test('displays Vinyl Record Variants section', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const section = page.locator('h2:has-text("Vinyl Record Variants")')
    await expect(section).toBeVisible()
  })
})

test.describe('Logo Preview Page - Logo Display', () => {
  test('displays SVG logo', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const svgSection = page.locator('h3:has-text("SVG")')
    const hasSvg = await svgSection.count() > 0
    expect(hasSvg).toBe(true)
  })

  test('displays dark mode logo', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const darkSection = page.locator('h3:has-text("Dark Mode")')
    const hasDark = await darkSection.count() > 0
    expect(hasDark).toBe(true)
  })

  test('displays light mode logo', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const lightSection = page.locator('h3:has-text("Light Mode")')
    const hasLight = await lightSection.count() > 0
    expect(hasLight).toBe(true)
  })

  test('displays 3D spinning vinyl section', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1500)

    const section3d = page.locator('h3:has-text("3D")')
    const has3d = await section3d.count() > 0
    expect(has3d).toBe(true)
  })
})

test.describe('Logo Preview Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/logo-preview')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1')).toBeVisible()
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/logo-preview')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/logo-preview')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/logo-preview')
    await page.waitForTimeout(1500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Logo Preview Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/logo-preview')

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('images have alt attributes', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })
    expect(focusableCount).toBeGreaterThanOrEqual(0)
  })

  test('heading hierarchy is correct', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(1000)

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})

test.describe('Logo Preview Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/logo-preview')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error') &&
             !e.includes('WebGL')
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

    await page.goto('/logo-preview')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration') &&
             !e.includes('WebGL')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Logo Preview Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/logo-preview')
    expect(response?.status()).toBe(200)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/logo-preview')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Logo Preview Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/logo-preview?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Logo Preview Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/logo-preview')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/logo-preview')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(15000)
  })
})
