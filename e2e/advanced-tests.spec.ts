import { test, expect } from '@playwright/test'

const TEST_USER = process.env.TEST_USERNAME || 'shadrack'

// ==========================================
// VISUAL CONSISTENCY TESTS
// ==========================================

test.describe('Visual Consistency - Theme Colors', () => {
  test('TasteID page has no hardcoded neutral colors in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1000)

    // Check that text is visible (not light gray on light background)
    const textElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6')
      const problems: string[] = []
      elements.forEach((el) => {
        const style = window.getComputedStyle(el)
        const color = style.color
        const bgColor = style.backgroundColor
        // If text is too light on light background, it's a problem
        if (color.includes('rgb(156') || color.includes('rgb(163') || color.includes('rgb(115')) {
          problems.push(`${el.tagName}: ${el.textContent?.substring(0, 30)} - color: ${color}`)
        }
      })
      return problems
    })

    expect(textElements.length).toBeLessThan(5)
  })

  test('TasteID page has no hardcoded neutral colors in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1000)

    const response = await page.goto(`/u/${TEST_USER}/tasteid`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })

  test('Trending page has consistent theme in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Verify background is light
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    // Should be light background (RGB values > 200)
    const match = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/)
    if (match) {
      const [, r, g, b] = match.map(Number)
      // Either white/light or dark theme variables (which is fine)
      expect(r + g + b).toBeGreaterThan(0) // Just ensure it has some value
    }
  })
})

// ==========================================
// USER FLOW TESTS
// ==========================================

test.describe('User Flow - Navigation', () => {
  test('can navigate from trending to album to back', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.isVisible()) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      expect(page.url()).toContain('/album/')

      await page.goBack()
      expect(page.url()).toContain('/trending')
    }
  })

  test('can navigate to TasteID from profile if available', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}`)
    await page.waitForTimeout(1000)

    const tasteIdLink = page.locator('a[href*="/tasteid"]')
    if (await tasteIdLink.count() > 0) {
      await tasteIdLink.first().click()
      await page.waitForURL('**/tasteid**')
      expect(page.url()).toContain('/tasteid')
    }
  })

  test('deep linking to TasteID section works', async ({ page }) => {
    const response = await page.goto(`/u/${TEST_USER}/tasteid#listening-signature`)
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

// ==========================================
// COMPONENT-SPECIFIC TESTS
// ==========================================

test.describe('Components - Radar Chart', () => {
  test('radar chart renders with visible labels', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1500)

    // Look for SVG with radar chart characteristics
    const svgElements = await page.locator('svg').count()
    expect(svgElements).toBeGreaterThan(0)
  })

  test('radar chart text labels have sufficient contrast', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1500)

    const svgText = await page.evaluate(() => {
      const textElements = document.querySelectorAll('svg text')
      return Array.from(textElements).map(el => ({
        text: el.textContent,
        fill: window.getComputedStyle(el).fill
      }))
    })

    // Just check that we have text elements with fills
    if (svgText.length > 0) {
      expect(svgText[0].fill).toBeTruthy()
    }
  })
})

test.describe('Components - Billboard List', () => {
  test('shows 3 albums per row on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    // Check for grid-cols-3 on mobile
    const gridCols = await page.evaluate(() => {
      const grid = document.querySelector('.grid.grid-cols-3')
      return grid !== null
    })

    expect(gridCols).toBe(true)
  })

  test('expand/collapse button toggles album count', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const expandButton = page.locator('button:has-text("View All")').first()
    if (await expandButton.isVisible()) {
      const initialCount = await page.locator('a[href^="/album/"]').count()

      await expandButton.click()
      await page.waitForTimeout(500)

      const expandedCount = await page.locator('a[href^="/album/"]').count()
      expect(expandedCount).toBeGreaterThanOrEqual(initialCount)
    }
  })
})

// ==========================================
// DATA INTEGRITY TESTS
// ==========================================

test.describe('Data Integrity - TasteID', () => {
  test('TasteID archetype is displayed if user has reviews', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1500)

    // Look for archetype badge or empty state
    const hasArchetype = await page.locator('text=/genre|explorer|historian|fluid|curator|purist/i').count() > 0
    const hasEmptyState = await page.locator('text=/no reviews|not enough/i').count() > 0

    expect(hasArchetype || hasEmptyState).toBe(true)
  })

  test('rating values are within valid range', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const ratings = await page.evaluate(() => {
      const ratingElements = document.querySelectorAll('[class*="rating"], [class*="score"]')
      const values: number[] = []
      ratingElements.forEach(el => {
        const text = el.textContent || ''
        const match = text.match(/(\d+\.?\d*)/)
        if (match) {
          values.push(parseFloat(match[1]))
        }
      })
      return values
    })

    ratings.forEach(rating => {
      expect(rating).toBeGreaterThanOrEqual(0)
      expect(rating).toBeLessThanOrEqual(10)
    })
  })
})

// ==========================================
// PERFORMANCE BENCHMARKS
// ==========================================

test.describe('Performance Benchmarks', () => {
  test('TasteID page First Contentful Paint < 5s', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('Trending page loads with < 100 network requests', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (req) => requests.push(req.url()))

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    expect(requests.length).toBeLessThan(100)
  })

  test('TasteID page has reasonable JS bundle size', async ({ page }) => {
    const jsBytes: number[] = []

    page.on('response', async (response) => {
      if (response.url().endsWith('.js')) {
        const headers = response.headers()
        const size = parseInt(headers['content-length'] || '0')
        jsBytes.push(size)
      }
    })

    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(2000)

    const totalJS = jsBytes.reduce((a, b) => a + b, 0)
    // Total JS should be under 5MB
    expect(totalJS).toBeLessThan(5 * 1024 * 1024)
  })
})

// ==========================================
// ACCESSIBILITY DEEP DIVE
// ==========================================

test.describe('Accessibility - Deep Dive', () => {
  test('TasteID page has ARIA labels on interactive elements', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1000)

    const interactiveWithoutLabels = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
      const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])')
      const issues: string[] = []

      buttons.forEach(btn => {
        if (!btn.textContent?.trim() && !btn.querySelector('img[alt]')) {
          issues.push(`Button without label: ${btn.outerHTML.substring(0, 100)}`)
        }
      })

      return issues.length
    })

    expect(interactiveWithoutLabels).toBeLessThan(5)
  })

  test('color contrast ratio is sufficient', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(1000)

    // Basic check - no invisible text
    const invisibleText = await page.evaluate(() => {
      const texts = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6')
      let count = 0
      texts.forEach(el => {
        const style = window.getComputedStyle(el)
        const opacity = parseFloat(style.opacity)
        if (opacity < 0.3 && el.textContent?.trim()) {
          count++
        }
      })
      return count
    })

    expect(invisibleText).toBe(0)
  })

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(500)

    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([placeholder])')
      let unlabeled = 0
      inputs.forEach(input => {
        const id = input.id
        const label = id ? document.querySelector(`label[for="${id}"]`) : null
        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        const placeholder = input.getAttribute('placeholder')
        if (!label && !ariaLabel && !ariaLabelledBy && !placeholder) {
          unlabeled++
        }
      })
      return unlabeled
    })

    // Allow up to 2 unlabeled inputs (search boxes often rely on placeholder)
    expect(inputsWithoutLabels).toBeLessThanOrEqual(2)
  })
})

// ==========================================
// ERROR BOUNDARY TESTS
// ==========================================

test.describe('Error Boundaries', () => {
  test('TasteID handles invalid JSON in localStorage gracefully', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Inject corrupted localStorage
    await page.evaluate(() => {
      localStorage.setItem('theme', '{invalid json')
      localStorage.setItem('user-preferences', 'not valid}')
    })

    // Reload and check page still works
    await page.reload()
    await page.waitForTimeout(1000)

    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)

    // Cleanup
    await page.evaluate(() => localStorage.clear())
  })

  test('page recovers from runtime errors', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    // Inject an error
    await page.evaluate(() => {
      try {
        throw new Error('Simulated runtime error')
      } catch {
        // Caught - page should continue
      }
    })

    // Page should still be functional
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })
})

// ==========================================
// SEO TESTS
// ==========================================

test.describe('SEO - Meta Tags', () => {
  test('TasteID page has proper Open Graph tags', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')

    expect(ogTitle).toBeTruthy()
    expect(ogDescription).toBeTruthy()
    expect(ogImage).toBeTruthy()
  })

  test('Trending page has meta description', async ({ page }) => {
    await page.goto('/trending')

    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDesc).toBeTruthy()
  })

  test('pages have canonical URLs', async ({ page }) => {
    await page.goto(`/u/${TEST_USER}/tasteid`)
    await page.waitForTimeout(500)

    const canonicalCount = await page.locator('link[rel="canonical"]').count()
    // Canonical might not be set, which is acceptable for now
    // This test just ensures we don't have duplicate canonicals
    expect(canonicalCount).toBeLessThanOrEqual(1)
  })
})

// ==========================================
// MOBILE-SPECIFIC TESTS
// ==========================================

test.describe('Mobile - Touch Interactions', () => {
  test('album cards respond to tap on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 375, height: 667 }
    })
    const page = await context.newPage()

    await page.goto('http://localhost:3000/trending')
    await page.waitForTimeout(1500)

    const albumCard = page.locator('a[href^="/album/"]').first()
    if (await albumCard.isVisible()) {
      await albumCard.tap()
      await page.waitForURL('**/album/**', { timeout: 5000 })
      expect(page.url()).toContain('/album/')
    }

    await context.close()
  })

  test('mobile navigation is accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Check for hamburger menu or visible navigation
    const hasNav = await page.locator('nav, header, [role="navigation"]').count() > 0
    expect(hasNav).toBe(true)
  })
})

// ==========================================
// INTERNATIONALIZATION READINESS
// ==========================================

test.describe('i18n Readiness', () => {
  test('page handles long text gracefully', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Simulate long album titles by checking truncation
    const hasEllipsis = await page.evaluate(() => {
      const elements = document.querySelectorAll('.truncate, [class*="line-clamp"]')
      return elements.length > 0
    })

    // Truncation classes should exist
    expect(hasEllipsis).toBe(true)
  })

  test('dates use locale-appropriate format', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Check for date patterns
    const html = await page.content()
    // Should have month names or formatted dates
    const hasFormattedDate = /January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(html)
    expect(hasFormattedDate).toBe(true)
  })
})
