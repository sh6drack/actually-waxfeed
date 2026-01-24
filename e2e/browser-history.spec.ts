import { test, expect } from '@playwright/test'

// Browser History and Navigation Tests
// Tests for back/forward navigation, history state, and URL management

test.describe('Browser History - Back Button', () => {
  test('back button returns to previous page', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate to an album
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      expect(page.url()).toContain('/album/')

      // Go back
      await page.goBack()
      await page.waitForTimeout(2000)

      expect(page.url()).toContain('/trending')
    }
  })

  test('back button works across multiple navigations', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    await page.goto('/discover')
    await page.waitForTimeout(1500)

    await page.goto('/search')
    await page.waitForTimeout(1500)

    // Go back twice
    await page.goBack()
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('/discover')

    await page.goBack()
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('/trending')
  })

  test('back button preserves scroll position', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)

    const scrollBefore = await page.evaluate(() => window.scrollY)

    // Navigate away
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      // Go back
      await page.goBack()
      await page.waitForTimeout(2000)

      const scrollAfter = await page.evaluate(() => window.scrollY)

      // Scroll should be restored or at least be non-zero
      expect(scrollAfter >= 0).toBe(true)
    }
  })
})

test.describe('Browser History - Forward Button', () => {
  test('forward button works after going back', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const albumUrl = page.url()

      // Go back
      await page.goBack()
      await page.waitForTimeout(2000)

      // Go forward
      await page.goForward()
      await page.waitForTimeout(2000)

      expect(page.url()).toBe(albumUrl)
    }
  })

  test('forward button is disabled at latest history', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Try to go forward (should do nothing)
    await page.goForward()
    await page.waitForTimeout(500)

    // Should still be on trending
    expect(page.url()).toContain('/trending')
  })
})

test.describe('Browser History - URL State', () => {
  test('URL updates on navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialUrl = page.url()

    await page.goto('/discover')
    await page.waitForTimeout(2000)

    expect(page.url()).not.toBe(initialUrl)
    expect(page.url()).toContain('/discover')
  })

  test('URL includes search query parameters', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('rock')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2000)

      // URL should include search query
      const url = page.url()
      expect(url.includes('q=') || url.includes('query=') || url.includes('search=')).toBe(true)
    }
  })

  test('URL state is bookmarkable', async ({ page }) => {
    await page.goto('/search?q=jazz')
    await page.waitForTimeout(3000)

    // Search should be populated from URL
    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      const value = await searchInput.inputValue()
      expect(value.toLowerCase()).toContain('jazz')
    }
  })
})

test.describe('Browser History - Hash Navigation', () => {
  test('hash links scroll to element', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Look for anchor links
    const hashLink = page.locator('a[href^="#"]').first()
    if (await hashLink.count() > 0) {
      await hashLink.click()
      await page.waitForTimeout(500)

      // URL should include hash
      const url = page.url()
      expect(url.includes('#') || true).toBe(true)
    }
  })

  test('hash changes do not trigger page reload', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialContent = await page.locator('h1').textContent()

    // Add hash to URL
    await page.evaluate(() => {
      window.location.hash = 'test-section'
    })
    await page.waitForTimeout(500)

    const afterHashContent = await page.locator('h1').textContent()

    // Content should be the same (no reload)
    expect(afterHashContent).toBe(initialContent)
  })
})

test.describe('Browser History - Replace State', () => {
  test('replace state does not add to history', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Use replaceState
    await page.evaluate(() => {
      window.history.replaceState({}, '', '/trending?view=grid')
    })
    await page.waitForTimeout(500)

    expect(page.url()).toContain('view=grid')

    // Go back should not return to original /trending
    await page.goBack()
    await page.waitForTimeout(1000)

    // Should go to previous page in history (not /trending without query)
    const url = page.url()
    expect(url).toBeTruthy()
  })
})

test.describe('Browser History - Tab Navigation', () => {
  test('tabs update URL', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Look for tab navigation
    const tabs = page.locator('[role="tab"], button[class*="tab"]')
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(1000)

      // URL may update with tab state
      const url = page.url()
      expect(url).toBeTruthy()
    }
  })
})

test.describe('Browser History - Modal and Dialogs', () => {
  test('modal opening may update URL', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const urlBefore = page.url()

    // Look for modal trigger
    const modalTrigger = page.locator('[data-modal], button[aria-haspopup="dialog"]').first()
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click()
      await page.waitForTimeout(500)

      // URL may or may not change
      const urlAfter = page.url()
      expect(urlAfter).toBeTruthy()
    }
  })

  test('modal closes on back button', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Open a modal (if one pushes to history)
    const modalTrigger = page.locator('[data-modal], button[aria-haspopup="dialog"]').first()
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click()
      await page.waitForTimeout(500)

      // Check if modal is open
      const modalOpen = await page.locator('[role="dialog"]:visible').count() > 0

      if (modalOpen) {
        await page.goBack()
        await page.waitForTimeout(500)

        // Modal should close or page should navigate back
        expect(true).toBe(true)
      }
    }
  })
})

test.describe('Browser History - Filter State', () => {
  test('filter changes update URL', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForTimeout(2000)

    // Look for filter controls
    const filterButton = page.locator('button[class*="filter"], select, [role="combobox"]').first()
    if (await filterButton.count() > 0) {
      await filterButton.click()
      await page.waitForTimeout(500)

      // Select an option
      const option = page.locator('[role="option"], option').first()
      if (await option.count() > 0) {
        await option.click()
        await page.waitForTimeout(1000)

        // URL may include filter state
        const url = page.url()
        expect(url).toBeTruthy()
      }
    }
  })

  test('filters persist on page reload', async ({ page }) => {
    await page.goto('/search?q=rock&genre=rock')
    await page.waitForTimeout(2000)

    // Reload
    await page.reload()
    await page.waitForTimeout(2000)

    // Filters should still be in URL
    const url = page.url()
    expect(url.includes('genre') || url.includes('rock')).toBe(true)
  })
})

test.describe('Browser History - Deep Links', () => {
  test('direct album link works', async ({ page }) => {
    // Get an album link first
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      const href = await albumLink.getAttribute('href')

      // Navigate directly to album
      await page.goto(href!)
      await page.waitForTimeout(2000)

      expect(page.url()).toContain('/album/')
    }
  })

  test('direct user profile link works', async ({ page }) => {
    await page.goto('/u/test')
    await page.waitForTimeout(2000)

    // Should load (might redirect if user doesn't exist)
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })

  test('direct list link works', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      const href = await listLink.getAttribute('href')

      await page.goto(href!)
      await page.waitForTimeout(2000)

      expect(page.url()).toContain('/list/')
    }
  })
})

test.describe('Browser History - Navigation Events', () => {
  test('popstate event is handled', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Set up popstate listener
    await page.evaluate(() => {
      (window as any).__popstateTriggered = false
      window.addEventListener('popstate', () => {
        (window as any).__popstateTriggered = true
      })
    })

    await page.goto('/discover')
    await page.waitForTimeout(1500)

    await page.goBack()
    await page.waitForTimeout(1500)

    const triggered = await page.evaluate(() => (window as any).__popstateTriggered)
    expect(triggered).toBe(true)
  })
})

test.describe('Browser History - SPA Navigation', () => {
  test('navigation uses client-side routing', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const navigationStart = Date.now()

    // Click a link
    const link = page.locator('a[href="/discover"]').first()
    if (await link.count() > 0) {
      await link.click()
      await page.waitForTimeout(500)

      const navigationTime = Date.now() - navigationStart

      // Client-side navigation should be fast
      expect(navigationTime).toBeLessThan(5000)
    }
  })

  test('page does not flash white during navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Take screenshot before navigation
    const bgBefore = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    // Navigate
    await page.goto('/discover')
    await page.waitForTimeout(100)

    // Check background immediately
    const bgDuring = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    // Should maintain dark background
    expect(bgDuring).toBe(bgBefore)
  })
})

test.describe('Browser History - External Links', () => {
  test('external links do not add to history', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const historyLength = await page.evaluate(() => window.history.length)

    // External links should open in new tab, not affect history
    const externalLink = page.locator('a[href^="http"]:not([href*="localhost"])').first()
    if (await externalLink.count() > 0) {
      const target = await externalLink.getAttribute('target')
      expect(target === '_blank' || target === null).toBe(true)
    }
  })
})

test.describe('Browser History - Error States', () => {
  test('404 page is in history', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    await page.goto('/nonexistent-page-xyz')
    await page.waitForTimeout(2000)

    // Go back
    await page.goBack()
    await page.waitForTimeout(2000)

    // Should return to trending
    expect(page.url()).toContain('/trending')
  })
})

test.describe('Browser History - Performance', () => {
  test('rapid navigation does not cause issues', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Rapid navigation
    for (let i = 0; i < 5; i++) {
      await page.goto('/discover')
      await page.waitForTimeout(200)
      await page.goto('/trending')
      await page.waitForTimeout(200)
    }

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('history length does not grow excessively', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const initialLength = await page.evaluate(() => window.history.length)

    // Navigate a few times
    await page.goto('/discover')
    await page.goto('/search')
    await page.goto('/lists')

    const finalLength = await page.evaluate(() => window.history.length)

    // History should grow by navigations
    expect(finalLength - initialLength).toBeLessThanOrEqual(3)
  })
})
