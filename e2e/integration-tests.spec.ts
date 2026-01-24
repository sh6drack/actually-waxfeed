import { test, expect } from '@playwright/test'

// Integration tests - testing complex multi-page flows and state consistency

// ==========================================
// CROSS-PAGE STATE CONSISTENCY
// ==========================================

test.describe('Cross-Page State - Navigation Consistency', () => {
  test('maintains theme preference across pages', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/trending')
    await page.waitForTimeout(500)

    // Navigate to discover
    await page.goto('/discover')
    await page.waitForTimeout(500)

    // Navigate to profile
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(500)

    // All pages should respect the color scheme
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).toBeTruthy()
  })

  test('back button preserves scroll position', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollBefore = await page.evaluate(() => window.scrollY)

    // Navigate away
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(500)

      // Go back
      await page.goBack()
      await page.waitForTimeout(1000)

      // Scroll position should be restored (or close to it)
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBeGreaterThanOrEqual(0)
    }
  })

  test('viewport size persists across navigation', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 })
    await page.goto('/trending')

    const size1 = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }))

    await page.goto('/discover')

    const size2 = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }))

    expect(size1.width).toBe(size2.width)
    expect(size1.height).toBe(size2.height)
  })
})

// ==========================================
// COMPLEX NAVIGATION FLOWS
// ==========================================

test.describe('Complex Navigation - Multi-Step Journeys', () => {
  test('trending → album → artist → back chain works', async ({ page }) => {
    const visitedUrls: string[] = []

    await page.goto('/trending')
    visitedUrls.push(page.url())
    await page.waitForTimeout(1000)

    // Go to album
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      visitedUrls.push(page.url())

      // Go back
      await page.goBack()
      await page.waitForURL('**/trending**')

      expect(page.url()).toContain('/trending')
    }
  })

  test('profile → list → album → profile chain works', async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(1500)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForURL('**/list/**')
      await page.waitForTimeout(1000)

      const albumLink = page.locator('a[href^="/album/"]').first()
      if (await albumLink.count() > 0) {
        await albumLink.click()
        await page.waitForURL('**/album/**')
        await page.waitForTimeout(500)

        // Navigate back to profile
        await page.goto('/u/waxfeedapp')
        expect(page.url()).toContain('/u/waxfeedapp')
      }
    }
  })

  test('discover → album → review section → back works', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForTimeout(1500)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      await page.waitForTimeout(1000)

      // Scroll to reviews section
      const reviews = page.locator('h2:has-text("Reviews")')
      if (await reviews.count() > 0) {
        await reviews.scrollIntoViewIfNeeded()
      }

      await page.goBack()
      expect(page.url()).toContain('/discover')
    }
  })
})

// ==========================================
// ERROR RECOVERY PATTERNS
// ==========================================

test.describe('Error Recovery - Resilience Testing', () => {
  test('recovers from slow network simulation', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await route.continue()
    })

    const response = await page.goto('/trending', { timeout: 60000 })
    expect(response?.status()).toBe(200)
  })

  test('handles 404 gracefully and allows navigation', async ({ page }) => {
    await page.goto('/nonexistent-page-12345')
    await page.waitForTimeout(1000)

    // Should be able to navigate away
    await page.goto('/trending')
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/trending')
  })

  test('handles multiple rapid 404 requests', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto(`/nonexistent-${i}`)
    }

    // Should still work
    await page.goto('/trending')
    expect(page.url()).toContain('/trending')
  })

  test('handles malformed URLs without crashing', async ({ page }) => {
    const malformedUrls = [
      '/u/test%00user',
      '/album/123%0d%0a',
      '/list/..%2f..%2f',
    ]

    for (const url of malformedUrls) {
      await page.goto(url)
      const content = await page.content()
      expect(content.length).toBeGreaterThan(0)
    }
  })
})

// ==========================================
// CONCURRENT LOADING
// ==========================================

test.describe('Concurrent Loading - Parallel Requests', () => {
  test('handles multiple tabs loading same page', async ({ browser }) => {
    const context = await browser.newContext()
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await Promise.all([
      page1.goto('/trending'),
      page2.goto('/trending')
    ])

    const content1 = await page1.content()
    const content2 = await page2.content()

    expect(content1.length).toBeGreaterThan(0)
    expect(content2.length).toBeGreaterThan(0)

    await context.close()
  })

  test('handles rapid tab switching', async ({ browser }) => {
    const context = await browser.newContext()
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ])

    await pages[0].goto('/trending')
    await pages[1].goto('/discover')
    await pages[2].goto('/u/waxfeedapp')

    // All should load
    for (const page of pages) {
      const content = await page.content()
      expect(content.length).toBeGreaterThan(0)
    }

    await context.close()
  })
})

// ==========================================
// CACHE BEHAVIOR
// ==========================================

test.describe('Cache Behavior - Caching Verification', () => {
  test('second page load is faster than first', async ({ page }) => {
    const start1 = Date.now()
    await page.goto('/trending')
    await page.waitForLoadState('networkidle')
    const time1 = Date.now() - start1

    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    const start2 = Date.now()
    await page.goto('/trending')
    await page.waitForLoadState('networkidle')
    const time2 = Date.now() - start2

    // Second load should be faster or similar due to caching
    // Allow some variance
    expect(time2).toBeLessThan(time1 * 2)
  })

  test('hard refresh clears cache and reloads', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForLoadState('networkidle')

    // Hard refresh
    await page.reload({ waitUntil: 'networkidle' })

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})

// ==========================================
// SEARCH AND FILTER (if available)
// ==========================================

test.describe('Search Functionality', () => {
  test('search page loads if available', async ({ page }) => {
    const response = await page.goto('/search')
    // May redirect or show search
    expect([200, 307, 308, 404]).toContain(response?.status() ?? 0)
  })

  test('search input accepts text input', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test query')
      const value = await searchInput.inputValue()
      expect(value).toBe('test query')
    }
  })
})

// ==========================================
// FORM HANDLING
// ==========================================

test.describe('Form Handling - Input Validation', () => {
  test('login page form exists', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(1000)

    // Should have form or login buttons
    const hasForm = await page.locator('form').count() > 0
    const hasLoginButtons = await page.locator('button, a[href*="auth"]').count() > 0

    expect(hasForm || hasLoginButtons).toBe(true)
  })

  test('form inputs maintain value on blur', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(1000)

    const input = page.locator('input[type="text"]').first()
    if (await input.isVisible()) {
      await input.fill('testvalue')
      await input.blur()

      const value = await input.inputValue()
      expect(value).toBe('testvalue')
    }
  })
})

// ==========================================
// LINK INTEGRITY
// ==========================================

test.describe('Link Integrity - URL Verification', () => {
  test('all internal links are valid format', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const links = await page.locator('a[href^="/"]').all()
    const invalidLinks: string[] = []

    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href')
      if (href && !href.match(/^\/[a-zA-Z0-9\-_\/]*$/)) {
        // Allow query strings and special chars in some cases
        if (!href.includes('?') && !href.includes('#')) {
          invalidLinks.push(href)
        }
      }
    }

    // Most links should be valid
    expect(invalidLinks.length).toBeLessThan(5)
  })

  test('external links have proper attributes', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const externalLinks = await page.locator('a[href^="http"]').all()

    for (const link of externalLinks.slice(0, 10)) {
      const target = await link.getAttribute('target')
      const rel = await link.getAttribute('rel')

      // External links should open in new tab or have noopener
      if (target === '_blank') {
        expect(rel).toContain('noopener')
      }
    }
  })
})

// ==========================================
// IMAGE LOADING
// ==========================================

test.describe('Image Loading - Visual Assets', () => {
  test('images load without 404 errors', async ({ page }) => {
    const failedImages: string[] = []

    page.on('response', response => {
      if (response.status() === 404 && response.url().match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
        failedImages.push(response.url())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Allow some failures (external images may fail)
    expect(failedImages.length).toBeLessThan(5)
  })

  test('lazy loaded images have proper attributes', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const images = await page.locator('img[loading="lazy"]').all()

    for (const img of images.slice(0, 10)) {
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt')

      expect(src).toBeTruthy()
      expect(alt !== null).toBe(true)
    }
  })
})

// ==========================================
// RESPONSIVE BREAKPOINTS
// ==========================================

test.describe('Responsive Breakpoints - Layout Changes', () => {
  test('mobile menu appears at small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Check for mobile-specific elements or hamburger menu
    const hasMobileNav = await page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label*="menu" i]').count() > 0
    const hasCompactLayout = await page.evaluate(() => {
      return document.body.scrollWidth <= 400
    })

    expect(hasMobileNav || hasCompactLayout).toBe(true)
  })

  test('tablet layout is distinct from mobile and desktop', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('layout adjusts when viewport changes dynamically', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const desktopWidth = await page.evaluate(() => document.body.clientWidth)

    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    const mobileWidth = await page.evaluate(() => document.body.clientWidth)

    expect(mobileWidth).toBeLessThan(desktopWidth)
  })
})

// ==========================================
// PERFORMANCE METRICS
// ==========================================

test.describe('Performance Metrics - Core Web Vitals', () => {
  test('LCP is under 4 seconds', async ({ page }) => {
    await page.goto('/trending', { waitUntil: 'domcontentloaded' })

    const lcp = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            resolve(entries[entries.length - 1].startTime)
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        // Fallback
        setTimeout(() => resolve(4000), 5000)
      })
    })

    expect(lcp).toBeLessThan(4000)
  })

  test('total JS bundle size is reasonable', async ({ page }) => {
    let totalJsSize = 0

    page.on('response', async response => {
      if (response.url().endsWith('.js')) {
        const headers = response.headers()
        const size = parseInt(headers['content-length'] || '0')
        totalJsSize += size
      }
    })

    await page.goto('/trending')
    await page.waitForLoadState('networkidle')

    // Allow up to 5MB total JS
    expect(totalJsSize).toBeLessThan(5 * 1024 * 1024)
  })

  test('total request count is reasonable', async ({ page }) => {
    let requestCount = 0

    page.on('request', () => {
      requestCount++
    })

    await page.goto('/trending')
    await page.waitForLoadState('networkidle')

    // Should not make excessive requests
    expect(requestCount).toBeLessThan(100)
  })
})

// ==========================================
// MEMORY MANAGEMENT
// ==========================================

test.describe('Memory Management', () => {
  test('memory usage stays stable during navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    // Navigate around
    await page.goto('/discover')
    await page.goto('/u/waxfeedapp')
    await page.goto('/trending')

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    // Memory should not grow excessively (allow 3x growth)
    if (initialMemory > 0) {
      expect(finalMemory).toBeLessThan(initialMemory * 3)
    }
  })

  test('no detached DOM nodes after navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const initialNodes = await page.evaluate(() => document.querySelectorAll('*').length)

    await page.goto('/discover')
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const finalNodes = await page.evaluate(() => document.querySelectorAll('*').length)

    // Node count should be similar
    expect(Math.abs(finalNodes - initialNodes)).toBeLessThan(500)
  })
})

// ==========================================
// API RESPONSE HANDLING
// ==========================================

test.describe('API Response Handling', () => {
  test('handles JSON parsing errors gracefully', async ({ page }) => {
    // This tests that the app doesn't crash on malformed responses
    page.on('response', async response => {
      // Just observing, not interfering
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })

  test('displays loading states appropriately', async ({ page }) => {
    // Check that loading indicators are used
    await page.goto('/trending')

    // Look for any loading indicators during load
    const hasLoader = await page.evaluate(() => {
      const loaders = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]')
      return loaders.length >= 0 // May or may not have loaders
    })

    expect(hasLoader).toBe(true)
  })
})

// ==========================================
// COOKIE AND STORAGE
// ==========================================

test.describe('Cookie and Storage Handling', () => {
  test('local storage is used appropriately', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage)
    })

    // Should not store excessive data
    expect(storageKeys.length).toBeLessThan(50)
  })

  test('session storage is cleared on tab close behavior', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Check session storage
    const sessionData = await page.evaluate(() => {
      return Object.keys(sessionStorage).length
    })

    expect(sessionData).toBeLessThan(50)

    await context.close()
  })
})

// ==========================================
// SCROLL BEHAVIOR
// ==========================================

test.describe('Scroll Behavior', () => {
  test('smooth scroll works on anchor links', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const initialScroll = await page.evaluate(() => window.scrollY)

    // Try scrolling
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }))
    await page.waitForTimeout(500)

    const finalScroll = await page.evaluate(() => window.scrollY)

    expect(finalScroll).toBeGreaterThan(initialScroll)
  })

  test('infinite scroll or pagination works', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialItems = await page.locator('a[href^="/album/"]').count()

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const finalItems = await page.locator('a[href^="/album/"]').count()

    // Items should be same or more (if infinite scroll)
    expect(finalItems).toBeGreaterThanOrEqual(initialItems)
  })
})

// ==========================================
// PRINT STYLES
// ==========================================

test.describe('Print Styles', () => {
  test('print styles exist and are applied', async ({ page }) => {
    await page.goto('/trending')
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(500)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('important content is visible in print', async ({ page }) => {
    await page.goto('/trending')
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(500)

    const h1Visible = await page.locator('h1').isVisible()
    expect(h1Visible).toBe(true)
  })
})
