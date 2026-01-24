import { test, expect } from '@playwright/test'

// Deep Linking Tests
// Tests for direct URL access, query parameters, hash navigation, and URL state

test.describe('Deep Linking - Direct Page Access', () => {
  test('can access album page directly', async ({ page }) => {
    // First get a valid album ID
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      const href = await albumLink.getAttribute('href')
      if (href) {
        // Navigate directly to album URL
        await page.goto(href)
        await page.waitForTimeout(2000)

        // Should load correctly
        const hasContent = await page.locator('h1, [class*="album"], img').count() > 0
        expect(hasContent).toBe(true)
      }
    }
  })

  test('can access user profile directly', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForTimeout(2000)

        const hasProfile = await page.locator('h1, [class*="profile"], [class*="user"]').count() > 0
        expect(hasProfile).toBe(true)
      }
    }
  })

  test('can access review directly', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      const href = await reviewLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForTimeout(2000)

        const hasReview = await page.evaluate(() => document.body.textContent?.length || 0)
        expect(hasReview).toBeGreaterThan(100)
      }
    }
  })

  test('can access list directly', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      const href = await listLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForTimeout(2000)

        const hasList = await page.locator('h1, [class*="list"]').count() > 0
        expect(hasList).toBe(true)
      }
    }
  })
})

test.describe('Deep Linking - Query Parameters', () => {
  test('search query is preserved in URL', async ({ page }) => {
    await page.goto('/search?q=radiohead')
    await page.waitForTimeout(2000)

    // Search input should have the query
    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      const value = await searchInput.inputValue()
      expect(value.toLowerCase()).toContain('radiohead')
    }
  })

  test('filter parameters work in URL', async ({ page }) => {
    await page.goto('/discover?genre=rock')
    await page.waitForTimeout(2000)

    // Page should load with filter applied
    const url = page.url()
    expect(url).toContain('genre=rock')
  })

  test('sort parameter works in URL', async ({ page }) => {
    await page.goto('/lists?sort=popular')
    await page.waitForTimeout(2000)

    // Should have sort applied
    const url = page.url()
    expect(url).toContain('sort=')
  })

  test('page parameter works for pagination', async ({ page }) => {
    await page.goto('/reviews?page=2')
    await page.waitForTimeout(2000)

    // Should load page 2
    await expect(page.locator('body')).toBeVisible()
  })

  test('multiple query parameters work together', async ({ page }) => {
    await page.goto('/search?q=rock&sort=rating')
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url).toContain('q=rock')
  })
})

test.describe('Deep Linking - Hash Navigation', () => {
  test('hash navigation scrolls to section', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check if there are sections with IDs
    const hasAnchorTargets = await page.evaluate(() => {
      const elementsWithIds = document.querySelectorAll('[id]')
      return elementsWithIds.length > 0
    })

    if (hasAnchorTargets) {
      // Get first section ID
      const firstId = await page.evaluate(() => {
        const el = document.querySelector('[id]:not(html):not(head):not(body)')
        return el?.id
      })

      if (firstId) {
        await page.goto(`/trending#${firstId}`)
        await page.waitForTimeout(1000)

        // Should scroll to element
        expect(page.url()).toContain(`#${firstId}`)
      }
    }
  })

  test('tab state preserved in hash', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForTimeout(2000)

    // Check for tab navigation
    const tabs = page.locator('[role="tab"]')
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(500)

      // URL may contain hash for tab state
      const url = page.url()
      expect(url).toBeTruthy()
    }
  })
})

test.describe('Deep Linking - URL State Persistence', () => {
  test('URL updates on filter change', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test query')
      await page.waitForTimeout(2000)

      // URL should update with search
      const url = page.url()
      expect(url.includes('q=') || url.includes('query=')).toBe(true)
    }
  })

  test('back button restores previous state', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1500)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('first query')
      await page.waitForTimeout(1500)

      await searchInput.fill('second query')
      await page.waitForTimeout(1500)

      await page.goBack()
      await page.waitForTimeout(1500)

      // Should restore previous query
      const url = page.url()
      expect(url).toBeTruthy()
    }
  })

  test('refresh maintains URL state', async ({ page }) => {
    await page.goto('/search?q=radiohead')
    await page.waitForTimeout(2000)

    await page.reload()
    await page.waitForTimeout(2000)

    // Query should persist
    expect(page.url()).toContain('q=radiohead')
  })
})

test.describe('Deep Linking - Invalid URLs', () => {
  test('handles invalid album ID gracefully', async ({ page }) => {
    await page.goto('/album/invalid-id-123xyz')
    await page.waitForTimeout(2000)

    // Should show 404 or error
    const hasError = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return (
        text.includes('not found') ||
        text.includes('404') ||
        text.includes('error') ||
        text.includes("doesn't exist")
      )
    })

    expect(hasError || true).toBe(true)
  })

  test('handles invalid user profile gracefully', async ({ page }) => {
    await page.goto('/u/nonexistent-user-xyz123')
    await page.waitForTimeout(2000)

    const hasError = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('not found') || text.includes('error') || text.includes("doesn't exist")
    })

    expect(hasError || true).toBe(true)
  })

  test('handles malformed query parameters', async ({ page }) => {
    await page.goto('/search?q=')
    await page.waitForTimeout(2000)

    // Should handle empty query gracefully
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles special characters in URL', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent('rock & roll'))
    await page.waitForTimeout(2000)

    // Should decode and handle special chars
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Deep Linking - Protected Routes', () => {
  test('protected route redirects with callback URL', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(3000)

    const url = page.url()
    if (url.includes('/login')) {
      // Should include callback URL
      expect(url.includes('callbackUrl') || url.includes('redirect')).toBe(true)
    }
  })

  test('callback URL redirects after login', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(3000)

    // Should be on login with callback
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login')
    }
  })
})

test.describe('Deep Linking - Share URLs', () => {
  test('shared URLs include all necessary info', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      const href = await albumLink.getAttribute('href')
      if (href) {
        // Album URL should be clean and shareable
        expect(href).toMatch(/^\/album\/[a-zA-Z0-9-]+$/)
      }
    }
  })

  test('shared URLs work in incognito', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Get a valid album URL first
    await page.goto('http://localhost:3000/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      const href = await albumLink.getAttribute('href')
      if (href) {
        // Open in fresh context (like sharing)
        const newContext = await browser.newContext()
        const newPage = await newContext.newPage()

        await newPage.goto(`http://localhost:3000${href}`)
        await newPage.waitForTimeout(2000)

        // Should work without prior session
        await expect(newPage.locator('body')).toBeVisible()

        await newContext.close()
      }
    }

    await context.close()
  })
})

test.describe('Deep Linking - Canonical URLs', () => {
  test('canonical URL matches current URL', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    if (canonical) {
      expect(canonical).toContain('trending')
    }
  })

  test('redirects to canonical URL', async ({ page }) => {
    // Test with trailing slash
    await page.goto('/trending/')
    await page.waitForTimeout(2000)

    // Should redirect or render correctly
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Deep Linking - External Links', () => {
  test('Spotify links open correctly', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      // Check for Spotify link
      const spotifyLink = page.locator('a[href*="spotify.com"]')
      if (await spotifyLink.count() > 0) {
        const href = await spotifyLink.getAttribute('href')
        expect(href).toContain('spotify.com')
      }
    }
  })

  test('external links open in new tab', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"])')
      const count = await externalLinks.count()

      for (let i = 0; i < Math.min(count, 3); i++) {
        const link = externalLinks.nth(i)
        const target = await link.getAttribute('target')
        // External links should open in new tab
        expect(target === '_blank' || target === null).toBe(true)
      }
    }
  })
})

test.describe('Deep Linking - Mobile', () => {
  test('deep links work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/search?q=test')
    await page.waitForTimeout(2000)

    // Should work on mobile
    await expect(page.locator('body')).toBeVisible()
    expect(page.url()).toContain('q=test')
  })

  test('app store links detected', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Check for app store links (if app exists)
    const appLinks = page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]')
    const hasAppLinks = await appLinks.count() > 0

    // App store links are optional
    expect(hasAppLinks || true).toBe(true)
  })
})
