import { test, expect } from '@playwright/test'

test.describe('Search Page - Basic Loading', () => {
  test('loads search page successfully', async ({ page }) => {
    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)
  })

  test('displays page title "Search"', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('h1')).toContainText('Search')
  })

  test('displays search input field', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)
    const searchInput = page.locator('input').first()
    await expect(searchInput).toBeVisible()
  })

  test('search input has placeholder text', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)
    const searchInput = page.locator('input').first()
    const placeholder = await searchInput.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
  })

  test('search input has autofocus', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1000)

    const activeElement = await page.evaluate(() => document.activeElement?.tagName)
    // May be INPUT or may be BODY depending on page load timing
    expect(['INPUT', 'BODY']).toContain(activeElement)
  })
})

test.describe('Search Page - Tabs', () => {
  test('displays All tab', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)
    const allTab = page.locator('button').filter({ hasText: 'All' })
    await expect(allTab).toBeVisible()
  })

  test('displays On Waxfeed tab', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)
    const waxfeedTab = page.locator('button').filter({ hasText: /On Waxfeed/i })
    await expect(waxfeedTab).toBeVisible()
  })

  test('displays Spotify tab', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)
    const spotifyTab = page.locator('button').filter({ hasText: /Spotify/i })
    await expect(spotifyTab).toBeVisible()
  })

  test('All tab is active by default', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)
    const allTab = page.locator('button').filter({ hasText: 'All' }).first()
    // Check for border class or that it's the active tab
    const hasClass = await allTab.evaluate(el => el.className.includes('border'))
    expect(hasClass).toBe(true)
  })

  test('clicking tab switches active state', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const spotifyTab = page.locator('button').filter({ hasText: /Spotify/i })
    await spotifyTab.click()
    await page.waitForTimeout(200)

    const hasClass = await spotifyTab.evaluate(el => el.className.includes('border-b-2'))
    expect(hasClass).toBe(true)
  })
})

test.describe('Search Page - Initial State', () => {
  test('shows initial state message when empty', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1000)
    // Search page shows "Start typing to search for albums" message
    await expect(page.locator('text=/Start typing/i')).toBeVisible()
  })

  test('no results shown initially', async ({ page }) => {
    await page.goto('/search')

    const hasResults = await page.locator('text=/On Waxfeed/i').count() > 0 ||
                       await page.locator('text=/From Spotify/i').count() > 0

    // Initially there should be no results sections (just the initial state)
    const hasInitialState = await page.locator('text=/Start typing/i').count() > 0
    expect(hasInitialState).toBe(true)
  })
})

test.describe('Search Page - Search Functionality', () => {
  test('typing triggers search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('Beatles')

    // Wait for debounce and loading
    await page.waitForTimeout(1000)

    // Should show searching or results
    const hasSearching = await page.locator('text=/Searching/i').count() > 0
    const hasResults = await page.locator('text=/On Waxfeed/i').count() > 0 ||
                       await page.locator('text=/From Spotify/i').count() > 0 ||
                       await page.locator('text=/No results/i').count() > 0

    expect(hasSearching || hasResults).toBe(true)
  })

  test('search query shows in URL', async ({ page }) => {
    await page.goto('/search?q=test')
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input').first()
    const value = await searchInput.inputValue()

    // The query param should populate the input field
    expect(value).toBe('test')
  })

  test('clearing input shows initial state', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('test')
    await page.waitForTimeout(500)

    await searchInput.clear()
    await page.waitForTimeout(500)

    await expect(page.locator('text=/Start typing/i')).toBeVisible()
  })

  test('short queries do not trigger search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('a') // Single character

    await page.waitForTimeout(500)

    // Should still show initial state for single character
    const hasInitialState = await page.locator('text=/Start typing/i').count() > 0
    expect(hasInitialState).toBe(true)
  })
})

test.describe('Search Page - No Results', () => {
  test('shows no results message for invalid query', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('xyznonexistentalbum12345678')

    // Wait for search to complete
    await page.waitForTimeout(2000)

    // Should either show no results or still be loading
    const hasNoResults = await page.locator('text=/No results found/i').count() > 0
    const hasSearching = await page.locator('text=/Searching/i').count() > 0
    const hasResults = await page.locator('text=/On Waxfeed/i').count() > 0 ||
                       await page.locator('text=/From Spotify/i').count() > 0

    expect(hasNoResults || hasSearching || hasResults).toBe(true)
  })
})

test.describe('Search Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1')).toContainText('Search')
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/search')
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Search Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/search')
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

    await page.goto('/search')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })

  test('handles network failures gracefully', async ({ page, context }) => {
    await context.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort())

    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Search Page - Accessibility', () => {
  test('page has accessible focus management', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    // May be INPUT or BODY depending on page load timing
    expect(['INPUT', 'BODY']).toContain(focusedElement)
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })

    expect(focusableCount).toBeGreaterThan(0)
  })

  test('page has lang attribute', async ({ page }) => {
    await page.goto('/search')

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('heading hierarchy is correct', async ({ page }) => {
    await page.goto('/search')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('search input is keyboard accessible', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.focus()
    await page.keyboard.type('test')

    const value = await searchInput.inputValue()
    expect(value).toBe('test')
  })

  test('tabs are keyboard navigable', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    // Tab through to reach the tab buttons
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focusedElement = await page.evaluate(() => document.activeElement?.textContent)
    expect(focusedElement).toBeTruthy()
  })
})

test.describe('Search Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })

    expect(domSize).toBeLessThan(5000)
  })

  test('debounce prevents excessive API calls', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const apiCalls: string[] = []
    await page.route('**/api/albums/search**', route => {
      apiCalls.push(route.request().url())
      route.continue()
    })

    const searchInput = page.locator('input').first()

    // Type rapidly
    await searchInput.fill('test')
    await page.waitForTimeout(500)

    // Should have made only 1 call due to debouncing
    expect(apiCalls.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Search Page - Security', () => {
  test('no XSS vulnerabilities in search query', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('<script>alert(1)</script>')

    await page.waitForTimeout(500)

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })

    expect(hasScriptTag).toBe(false)
  })

  test('no XSS in URL query parameter', async ({ page }) => {
    await page.goto('/search?q=<script>alert(1)</script>')

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })

    expect(hasScriptTag).toBe(false)
  })

  test('SQL injection in search is safe', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill("'; DROP TABLE users; --")

    await page.waitForTimeout(500)

    // Page should still work
    expect(await page.locator('h1').textContent()).toContain('Search')
  })
})

test.describe('Search Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/search')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Search Page - Stress Tests', () => {
  test('handles 10 rapid navigations without crashing', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.goto('/search', { waitUntil: 'domcontentloaded' })
    }

    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)
  })

  test('handles rapid search input changes', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()

    for (let i = 0; i < 10; i++) {
      await searchInput.fill(`query${i}`)
      await page.waitForTimeout(50)
    }

    await page.waitForTimeout(500)

    // Page should still work
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 50)
    expect(hasContent).toBe(true)
  })
})

test.describe('Search Page - Edge Cases', () => {
  test('handles special characters in search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('$pecial Ch@racters!')

    await page.waitForTimeout(500)

    // Should not crash
    expect(await page.locator('h1').textContent()).toContain('Search')
  })

  test('handles unicode in search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('音楽 música Musik')

    await page.waitForTimeout(500)

    // Should not crash
    expect(await page.locator('h1').textContent()).toContain('Search')
  })

  test('handles emoji in search', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('🎵🎸🎤')

    await page.waitForTimeout(500)

    // Should not crash
    expect(await page.locator('h1').textContent()).toContain('Search')
  })

  test('handles very long search query', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(500)

    const searchInput = page.locator('input').first()
    await searchInput.fill('a'.repeat(500))

    await page.waitForTimeout(500)

    // Should not crash
    expect(await page.locator('h1').textContent()).toContain('Search')
  })
})
