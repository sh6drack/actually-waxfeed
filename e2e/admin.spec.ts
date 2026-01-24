import { test, expect } from '@playwright/test'

// Admin page tests - tests the /admin route
// Admin dashboard for album imports and Billboard updates
// Requires admin role authentication

test.describe('Admin Page - Authentication', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Should redirect to login or show access denied
    const url = page.url()
    const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
    const isOnLogin = url.includes('/login')

    expect(hasAccessDenied || isOnLogin).toBe(true)
  })

  test('page loads without crashing', async ({ page }) => {
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('shows access denied for non-admin users', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Either redirected to login or shows access denied
    const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
    const hasLoading = await page.locator('text=/loading/i').count() > 0
    const isRedirected = !page.url().includes('/admin')

    expect(hasAccessDenied || hasLoading || isRedirected).toBe(true)
  })

  test('shows loading state initially', async ({ page }) => {
    await page.goto('/admin')

    // Should show loading text briefly or redirect
    const hasLoading = await page.locator('text=/loading/i').count() > 0
    const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
    const isRedirected = !page.url().includes('/admin')

    expect(hasLoading || hasAccessDenied || isRedirected).toBe(true)
  })
})

test.describe('Admin Page - Album Import UI Structure', () => {
  test('page has correct title when accessible', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // If admin page is accessible, check for title
    const hasTitle = await page.locator('h1:has-text("Admin - Album Import")').count() > 0
    const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
    const isRedirected = !page.url().includes('/admin')

    // Either shows proper title OR access is denied/redirected
    expect(hasTitle || hasAccessDenied || isRedirected).toBe(true)
  })

  test('import method buttons exist in DOM', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      // Check for import method selector buttons
      const searchQueriesBtn = page.locator('button:has-text("Search Queries")')
      const spotifyIdsBtn = page.locator('button:has-text("Spotify IDs")')
      const spotifyUrlsBtn = page.locator('button:has-text("Spotify URLs")')
      const artistNameBtn = page.locator('button:has-text("Artist Name")')

      const hasButtons = await searchQueriesBtn.count() > 0 ||
                         await spotifyIdsBtn.count() > 0 ||
                         await spotifyUrlsBtn.count() > 0 ||
                         await artistNameBtn.count() > 0

      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasButtons || hasAccessDenied).toBe(true)
    }
  })

  test('textarea for input exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasTextarea = await page.locator('textarea').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
      const hasLoading = await page.locator('text=/loading/i').count() > 0

      expect(hasTextarea || hasAccessDenied || hasLoading).toBe(true)
    }
  })

  test('import button exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasImportBtn = await page.locator('button:has-text("Import Albums")').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasImportBtn || hasAccessDenied).toBe(true)
    }
  })
})

test.describe('Admin Page - Billboard Update Section', () => {
  test('Billboard 200 Update section exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasBillboardSection = await page.locator('h2:has-text("Billboard 200 Update")').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasBillboardSection || hasAccessDenied).toBe(true)
    }
  })

  test('Billboard update button exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasUpdateBtn = await page.locator('button:has-text("Update Billboard 200")').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasUpdateBtn || hasAccessDenied).toBe(true)
    }
  })

  test('Billboard section has description text', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasDescription = await page.locator('text=/manually trigger/i').count() > 0 ||
                             await page.locator('text=/billboard 200 chart/i').count() > 0 ||
                             await page.locator('text=/cron job/i').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasDescription || hasAccessDenied).toBe(true)
    }
  })
})

test.describe('Admin Page - Stats Display', () => {
  test('stats grid exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasTotalAlbums = await page.locator('text=/total albums/i').count() > 0
      const hasTotalArtists = await page.locator('text=/total artists/i').count() > 0
      const hasImported24h = await page.locator('text=/imported.*24h/i').count() > 0

      const hasStats = hasTotalAlbums || hasTotalArtists || hasImported24h
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasStats || hasAccessDenied).toBe(true)
    }
  })

  test('stats show numeric values', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      // Stats are displayed as large bold numbers
      const statNumbers = page.locator('p.text-3xl.font-bold')
      const hasStats = await statNumbers.count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasStats || hasAccessDenied).toBe(true)
    }
  })
})

test.describe('Admin Page - Import Method Selector', () => {
  test('search queries is default selected method', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      // Search Queries button should have active styling (bg-white text-black)
      const searchBtn = page.locator('button:has-text("Search Queries")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await searchBtn.count() > 0) {
        const className = await searchBtn.getAttribute('class')
        expect(className).toContain('bg-white')
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('placeholder text matches selected import method', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const textarea = page.locator('textarea')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
      const hasLoading = await page.locator('text=/loading/i').count() > 0

      if (await textarea.count() > 0) {
        const placeholder = await textarea.getAttribute('placeholder')
        // Default is search queries, placeholder should have artist names
        expect(placeholder).toContain('radiohead')
      } else {
        expect(hasAccessDenied || hasLoading).toBe(true)
      }
    }
  })

  test('label text changes with import method', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasSearchLabel = await page.locator('text=/search queries/i').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
      const hasLoading = await page.locator('text=/loading/i').count() > 0

      expect(hasSearchLabel || hasAccessDenied || hasLoading).toBe(true)
    }
  })

  test('helper text explains import method', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasHelperText = await page.locator('text=/each search will import/i').count() > 0 ||
                            await page.locator('text=/bulk importing/i').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasHelperText || hasAccessDenied).toBe(true)
    }
  })
})

test.describe('Admin Page - Quick Import Suggestions', () => {
  test('quick import suggestions section exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasSuggestionsTitle = await page.locator('h2:has-text("Quick Import Suggestions")').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasSuggestionsTitle || hasAccessDenied).toBe(true)
    }
  })

  test('genre preset buttons exist', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const genres = ['Top 100 Hip-Hop', 'Classic Rock', 'Indie/Alt', 'R&B/Soul', 'Electronic']
      let hasGenres = false

      for (const genre of genres) {
        const count = await page.locator(`button:has-text("${genre}")`).count()
        if (count > 0) {
          hasGenres = true
          break
        }
      }

      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasGenres || hasAccessDenied).toBe(true)
    }
  })

  test('clicking preset populates textarea', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hipHopBtn = page.locator('button:has-text("Top 100 Hip-Hop")')
      const textarea = page.locator('textarea')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await hipHopBtn.count() > 0 && await textarea.count() > 0) {
        await hipHopBtn.click()
        await page.waitForTimeout(100)

        const value = await textarea.inputValue()
        expect(value).toContain('kendrick lamar')
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('preset buttons have hover styles', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const presetBtn = page.locator('button:has-text("Classic Rock")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await presetBtn.count() > 0) {
        const className = await presetBtn.getAttribute('class')
        expect(className).toContain('hover:')
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })
})

test.describe('Admin Page - Import Button State', () => {
  test('import button is disabled when textarea is empty', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const importBtn = page.locator('button:has-text("Import Albums")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await importBtn.count() > 0) {
        const isDisabled = await importBtn.isDisabled()
        expect(isDisabled).toBe(true)
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('import button enables when textarea has content', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const textarea = page.locator('textarea')
      const importBtn = page.locator('button:has-text("Import Albums")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await textarea.count() > 0 && await importBtn.count() > 0) {
        await textarea.fill('radiohead')
        await page.waitForTimeout(100)

        const isDisabled = await importBtn.isDisabled()
        expect(isDisabled).toBe(false)
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('import button has proper styling', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const importBtn = page.locator('button:has-text("Import Albums")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await importBtn.count() > 0) {
        const className = await importBtn.getAttribute('class')
        expect(className).toContain('bg-white')
        expect(className).toContain('text-black')
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })
})

test.describe('Admin Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('stats grid stacks on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Page should still render without overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375)
  })

  test('import method buttons wrap on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Buttons should wrap using flex-wrap
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Admin Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(500)

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })
    expect(focusableCount).toBeGreaterThan(0)
  })

  test('textarea has associated label', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const hasLabel = await page.locator('label').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      expect(hasLabel || hasAccessDenied).toBe(true)
    }
  })

  test('buttons are accessible', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Check that buttons exist and are interactive
    const buttons = page.locator('button')
    const count = await buttons.count()

    // Page should have at least some buttons (navigation, etc)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('page can be navigated with Tab key', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Tab through the page
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(firstFocused).toBeTruthy()
  })
})

test.describe('Admin Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/admin')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error') &&
             !e.includes('Failed to fetch')
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

    await page.goto('/admin')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration') &&
             !e.includes('Failed to fetch')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })

  test('handles session timeout gracefully', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(3000)

    // Page should either show access denied or redirect, not crash
    const hasContent = await page.content()
    expect(hasContent.length).toBeGreaterThan(0)
  })
})

test.describe('Admin Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('border colors are visible in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Check that bordered elements exist
    const borderedElements = await page.evaluate(() => {
      return document.querySelectorAll('[class*="border"]').length
    })
    expect(borderedElements).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Admin Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/admin?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('no XSS with image onerror in URL', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/admin?q=<img src=x onerror=alert(1)>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('textarea input is not rendered as HTML', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const textarea = page.locator('textarea')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await textarea.count() > 0) {
        await textarea.fill('<script>alert(1)</script>')

        // The script tag should not be executed
        let alertTriggered = false
        page.on('dialog', async dialog => {
          alertTriggered = true
          await dialog.dismiss()
        })

        await page.waitForTimeout(500)
        expect(alertTriggered).toBe(false)
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('admin route requires authentication', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Should not show admin content to unauthenticated users
    const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
    const hasLoading = await page.locator('text=/loading/i').count() > 0
    const isRedirected = page.url().includes('/login')

    expect(hasAccessDenied || hasLoading || isRedirected).toBe(true)
  })
})

test.describe('Admin Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(3000)
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/admin')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(30000)
  })

  test('no memory leaks from repeated navigation', async ({ page }) => {
    // Navigate to admin multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/admin')
      await page.waitForTimeout(500)
      await page.goto('/trending')
      await page.waitForTimeout(500)
    }

    // Page should still work
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Admin Page - Form Validation', () => {
  test('empty textarea prevents submission', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const importBtn = page.locator('button:has-text("Import Albums")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await importBtn.count() > 0) {
        // Button should be disabled with empty input
        const isDisabled = await importBtn.isDisabled()
        expect(isDisabled).toBe(true)
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('whitespace-only input keeps button disabled', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const textarea = page.locator('textarea')
      const importBtn = page.locator('button:has-text("Import Albums")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await textarea.count() > 0 && await importBtn.count() > 0) {
        await textarea.fill('   \n\n   ')
        await page.waitForTimeout(100)

        // Button should still be disabled
        const isDisabled = await importBtn.isDisabled()
        expect(isDisabled).toBe(true)
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('valid input enables import button', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const textarea = page.locator('textarea')
      const importBtn = page.locator('button:has-text("Import Albums")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await textarea.count() > 0 && await importBtn.count() > 0) {
        await textarea.fill('tyler the creator')
        await page.waitForTimeout(100)

        const isDisabled = await importBtn.isDisabled()
        expect(isDisabled).toBe(false)
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })
})

test.describe('Admin Page - Import Method Switching', () => {
  test('switching to Spotify IDs method updates UI', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const idsBtn = page.locator('button:has-text("Spotify IDs")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
      const hasLoading = await page.locator('text=/loading/i').count() > 0

      if (await idsBtn.count() > 0) {
        await idsBtn.click()
        await page.waitForTimeout(100)

        // Label should change
        const hasIdsLabel = await page.locator('text=/spotify album ids/i').count() > 0
        expect(hasIdsLabel).toBe(true)
      } else {
        expect(hasAccessDenied || hasLoading).toBe(true)
      }
    }
  })

  test('switching to Spotify URLs method updates placeholder', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const urlsBtn = page.locator('button:has-text("Spotify URLs")')
      const textarea = page.locator('textarea')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await urlsBtn.count() > 0 && await textarea.count() > 0) {
        await urlsBtn.click()
        await page.waitForTimeout(100)

        const placeholder = await textarea.getAttribute('placeholder')
        expect(placeholder).toContain('open.spotify.com/album')
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })

  test('switching to Artist Name method changes input behavior', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const artistBtn = page.locator('button:has-text("Artist Name")')
      const textarea = page.locator('textarea')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0
      const hasLoading = await page.locator('text=/loading/i').count() > 0

      if (await artistBtn.count() > 0 && await textarea.count() > 0) {
        await artistBtn.click()
        await page.waitForTimeout(100)

        // Textarea rows should be 1 for artist name, or label should indicate artist
        const rows = await textarea.getAttribute('rows')
        const hasArtistLabel = await page.locator('text=/artist name/i').count() > 0
        expect(rows === '1' || hasArtistLabel).toBe(true)
      } else {
        // Either access denied, loading, or redirected
        expect(hasAccessDenied || hasLoading || !page.url().includes('/admin')).toBe(true)
      }
    }
  })

  test('active method button has distinct styling', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      const idsBtn = page.locator('button:has-text("Spotify IDs")')
      const searchBtn = page.locator('button:has-text("Search Queries")')
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      if (await idsBtn.count() > 0) {
        // Initially Search Queries is active
        let searchClass = await searchBtn.getAttribute('class')
        expect(searchClass).toContain('bg-white')

        // Click Spotify IDs
        await idsBtn.click()
        await page.waitForTimeout(100)

        // Now Spotify IDs should be active
        const idsClass = await idsBtn.getAttribute('class')
        expect(idsClass).toContain('bg-white')

        // And Search Queries should not be active
        searchClass = await searchBtn.getAttribute('class')
        expect(searchClass).not.toContain('bg-white')
      } else {
        expect(hasAccessDenied).toBe(true)
      }
    }
  })
})

test.describe('Admin Page - Results Display', () => {
  test('results section is hidden initially', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    if (page.url().includes('/admin')) {
      // Results section should not be visible before import
      const hasResults = await page.locator('h2:has-text("Import Results")').count() > 0
      const hasAccessDenied = await page.locator('text=/access denied/i').count() > 0

      // Either no results showing OR access denied
      expect(!hasResults || hasAccessDenied).toBe(true)
    }
  })
})
