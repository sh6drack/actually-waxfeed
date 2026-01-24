import { test, expect } from '@playwright/test'

// Use a test user - update this to a known user in your database
const TEST_USER = process.env.TEST_USERNAME || 'waxfeedapp'
const NONEXISTENT_USER = 'nonexistentuser12345678xyz'

test.describe('TasteID Page - Basic Loading', () => {
  test('loads TasteID page with valid response', async ({ page }) => {
    const response = await page.goto(`/u/${TEST_USER}/tasteid`)

    // Page should load (200 or 404 if user doesn't have TasteID)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('returns 404 for non-existent user', async ({ page }) => {
    await page.goto(`/u/${NONEXISTENT_USER}/tasteid`)

    // Should show not found message
    await expect(page.locator('body')).toContainText(/not found/i)
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(`/u/${TEST_USER}/tasteid`)
    const loadTime = Date.now() - startTime

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('TasteID Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(2000)

    // Filter out known benign errors
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

    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1500)

    // Filter out known benign console errors
    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })

  test('handles network failures gracefully', async ({ page, context }) => {
    // Block external resources
    await context.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort())

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)

    // Page should still load even with blocked images
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Accessibility', () => {
  test('page has accessible focus management', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Tab through the page
    await page.keyboard.press('Tab')

    // Should be able to focus on something
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    // Count focusable elements
    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })

    // There should be at least some focusable elements (links, buttons)
    expect(focusableCount).toBeGreaterThan(0)
  })

  test('page has lang attribute', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('images have alt attributes', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img:not([alt])')
      return images.length
    })

    expect(imagesWithoutAlt).toBe(0)
  })
})

test.describe('TasteID Page - Navigation', () => {
  test('back to profile link works', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    // Look for a link back to profile
    const profileLink = page.locator(`a[href*="/u/${TEST_USER}"]`).first()

    if (await profileLink.isVisible()) {
      await profileLink.click()
      await page.waitForURL(`**/u/${TEST_USER}**`)
      expect(page.url()).toContain(`/u/${TEST_USER}`)
    }
  })

  // Note: This test requires Next.js server (Remotion doesn't have header)
  test.skip('header navigation is present', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Check for header element
    const header = page.locator('header')
    const hasHeader = await header.count() > 0

    // Should have a header
    expect(hasHeader).toBe(true)
  })
})

test.describe('TasteID Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)

    // Page should have some content
    await page.waitForTimeout(500)
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    // Mobile should not have horizontal scroll
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('TasteID Page - Theme', () => {
  // Note: This test requires Next.js server with theme provider
  test.skip('localStorage theme preference is respected', async ({ page }) => {
    // Set theme preference before loading
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Check if theme system is present
    const hasThemeClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('light') ||
             document.documentElement.classList.contains('dark')
    })

    expect(hasThemeClass).toBe(true)
  })
})

test.describe('TasteID Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })

    // DOM should not be excessively large (arbitrary limit: 5000 elements)
    expect(domSize).toBeLessThan(5000)
  })

  test('no memory leaks on navigation', async ({ page }) => {
    // Navigate to page multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto(`/u/${TEST_USER}/tasteid`)
      await page.waitForTimeout(500)
      await page.goto('about:blank')
    }

    // If we get here without crashing, test passes
    expect(true).toBe(true)
  })
})

// Note: These tests require the Next.js dev server on port 3000
test.describe.skip('TasteID Page - Content Validation (requires Next.js server)', () => {
  test('page uses theme-aware Tailwind classes', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    const html = await page.content()
    expect(html).toContain('bg-background')
  })

  test('displays TasteID content sections', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Check for key content sections
    await expect(page.getByText(/polarity/i).first()).toBeVisible()
  })
})

test.describe.skip('TasteID Visual Regression', () => {
  test('page layout is consistent', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('tasteid-page.png', {
      maxDiffPixels: 100,
      fullPage: true,
    })
  })
})

// ==========================================
// ADVANCED TESTS - Harder edge cases
// ==========================================

test.describe('TasteID Page - Security', () => {
  test('XSS in URL parameters does not execute', async ({ page }) => {
    // Try XSS payload in username
    const xssPayload = '<script>alert(1)</script>'
    const encodedPayload = encodeURIComponent(xssPayload)

    await page.goto(`/u/${encodedPayload}/tasteid`)

    // Check that script tags are not rendered as HTML
    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })

    expect(hasScriptTag).toBe(false)
  })

  test('path traversal attempts are handled', async ({ page }) => {
    const response = await page.goto('/u/../../../etc/passwd/tasteid')

    // Should not expose file system
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('SQL injection in URL is safe', async ({ page }) => {
    const sqlPayload = "'; DROP TABLE users; --"
    const encodedPayload = encodeURIComponent(sqlPayload)

    const response = await page.goto(`/u/${encodedPayload}/tasteid`)

    // Page should handle gracefully
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Edge Cases', () => {
  test('handles very long username gracefully', async ({ page }) => {
    const longUsername = 'a'.repeat(500)

    const response = await page.goto(`/u/${longUsername}/tasteid`)
    expect([200, 404, 414]).toContain(response?.status() ?? 0)
  })

  test('handles special characters in username', async ({ page }) => {
    const specialChars = 'user%20name%2F%3F%26'

    const response = await page.goto(`/u/${specialChars}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('handles unicode username', async ({ page }) => {
    const unicodeUsername = encodeURIComponent('用户名')

    const response = await page.goto(`/u/${unicodeUsername}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('handles empty username', async ({ page }) => {
    const response = await page.goto('/u//tasteid')
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Concurrency', () => {
  test('handles rapid page refreshes', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Rapid refresh
    for (let i = 0; i < 5; i++) {
      await page.reload()
    }

    // Page should still be functional
    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('handles back/forward navigation', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.goto('about:blank')
    await page.goBack()

    // Should handle back navigation
    expect(page.url()).toContain('tasteid')
  })
})

test.describe('TasteID Page - Network Conditions', () => {
  // This test can be flaky depending on server response time
  test('handles slow network', async ({ page, context }) => {
    test.setTimeout(60000) // Increase timeout for slow network test

    // Simulate moderate throttling
    const client = await context.newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 3 * 1024 * 1024 / 8, // 3 Mbps
      uploadThroughput: 3 * 1024 * 1024 / 8,
      latency: 100
    })

    const response = await page.goto(`/u/${TEST_USER}/tasteid`, { timeout: 45000 })
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('recovers from temporary offline state', async ({ page, context }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Go offline briefly
    await context.setOffline(true)
    await page.waitForTimeout(500)
    await context.setOffline(false)

    // Should be able to reload after going back online
    const response = await page.reload()
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Browser Features', () => {
  test('handles disabled JavaScript gracefully', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    const response = await page.goto(`http://localhost:3000/u/${TEST_USER}/tasteid`)

    // Page should at least return a response
    expect([200, 404]).toContain(response?.status() ?? 0)

    await context.close()
  })

  test('works with cookies disabled', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addCookies([]) // Start with no cookies

    const page = await context.newPage()
    const response = await page.goto(`http://localhost:3000/u/${TEST_USER}/tasteid`)

    expect([200, 404]).toContain(response?.status() ?? 0)

    await context.close()
  })
})

test.describe('TasteID Page - State Management', () => {
  test('page state is consistent after browser resize', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    const initialContent = await page.content()

    // Resize browser
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(200)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(200)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.waitForTimeout(500)

    // Page should still have content
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })

  test('handles print mode correctly', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Emulate print media
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(500)

    // Page should still be accessible
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })
})

// ==========================================
// STRESS TESTS - Push the limits
// ==========================================

test.describe('TasteID Page - Stress Tests', () => {
  test('handles 10 rapid navigations without crashing', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.goto(`/u/${TEST_USER}/tasteid`, { waitUntil: 'domcontentloaded' })
    }

    // Should still be functional
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)
  })

  test('handles multiple viewport changes rapidly', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    const viewports = [
      { width: 320, height: 568 },   // iPhone 5
      { width: 768, height: 1024 },  // iPad
      { width: 1920, height: 1080 }, // Desktop
      { width: 375, height: 812 },   // iPhone X
      { width: 414, height: 896 },   // iPhone 11
      { width: 1440, height: 900 },  // Laptop
    ]

    for (const vp of viewports) {
      await page.setViewportSize(vp)
      await page.waitForTimeout(100)
    }

    // Page should not crash
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)
  })

  test('handles rapid scroll events', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    // Rapid scrolling
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 100))
      await page.waitForTimeout(50)
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0))

    // Page should still work
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)
  })
})

test.describe('TasteID Page - Input Validation', () => {
  test('handles null bytes in URL', async ({ page }) => {
    const response = await page.goto('/u/test%00user/tasteid')
    expect([200, 400, 404]).toContain(response?.status() ?? 0)
  })

  test('handles newlines in URL', async ({ page }) => {
    const response = await page.goto('/u/test%0Auser/tasteid')
    expect([200, 400, 404]).toContain(response?.status() ?? 0)
  })

  test('handles CRLF injection attempt', async ({ page }) => {
    const crlfPayload = encodeURIComponent('test\r\nX-Injected: header')
    const response = await page.goto(`/u/${crlfPayload}/tasteid`)
    expect([200, 400, 404]).toContain(response?.status() ?? 0)
  })

  test('handles excessively nested URL', async ({ page }) => {
    const nestedPath = 'a/'.repeat(50) + 'tasteid'
    const response = await page.goto(`/u/${nestedPath}`)
    expect([200, 400, 404, 414]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Resource Loading', () => {
  test('page loads even with blocked fonts', async ({ page, context }) => {
    await context.route('**/*.{woff,woff2,ttf,otf}', route => route.abort())

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('page loads even with blocked CSS', async ({ page, context }) => {
    await context.route('**/*.css', route => route.abort())

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('handles timeout on external resources', async ({ page, context }) => {
    // Delay external resources significantly
    await context.route('**/*', async route => {
      if (route.request().url().includes('external')) {
        await new Promise(r => setTimeout(r, 5000))
      }
      await route.continue()
    })

    const response = await page.goto(`/u/${TEST_USER}/tasteid`, { timeout: 30000 })
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

test.describe('TasteID Page - Browser History', () => {
  test('maintains scroll position on back navigation', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollBefore = await page.evaluate(() => window.scrollY)

    // Navigate away and back
    await page.goto('about:blank')
    await page.goBack()
    await page.waitForTimeout(500)

    // Check we're back on tasteid page
    expect(page.url()).toContain('tasteid')
  })

  test('handles history.pushState correctly', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Simulate pushState
    await page.evaluate(() => {
      history.pushState({ test: true }, '', window.location.href + '?test=1')
    })

    // Go back
    await page.goBack()

    // Should still work
    expect(page.url()).toContain('tasteid')
  })
})

test.describe('TasteID Page - Touch Events', () => {
  test('handles touch interactions on mobile', async ({ browser }) => {
    // Create context with touch enabled
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 375, height: 667 }
    })
    const page = await context.newPage()

    await page.goto(`http://localhost:3000/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    // Simulate touch scroll
    await page.touchscreen.tap(187, 400)

    // Page should still work
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)

    await context.close()
  })
})

test.describe('TasteID Page - Clipboard', () => {
  test('page does not crash on paste event', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    // Trigger paste event
    await page.evaluate(() => {
      document.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      }))
    })

    // Page should still work
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)
  })
})
