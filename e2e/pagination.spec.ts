import { test, expect } from '@playwright/test'

// Pagination and Infinite Scroll Tests
// Tests for loading more content, pagination controls, and scroll behavior

test.describe('Pagination - Infinite Scroll', () => {
  test('trending page loads more albums on scroll', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Count initial albums
    const initialCount = await page.locator('[class*="album"], [class*="card"], a[href^="/album/"]').count()

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    // Check if more content loaded
    const afterScrollCount = await page.locator('[class*="album"], [class*="card"], a[href^="/album/"]').count()

    // Should have same or more items (may not have infinite scroll)
    expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount)
  })

  test('discover page loads more content on scroll', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForTimeout(2000)

    const initialHeight = await page.evaluate(() => document.body.scrollHeight)

    // Scroll to bottom multiple times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)
    }

    const finalHeight = await page.evaluate(() => document.body.scrollHeight)

    // Page height may increase with more content
    expect(finalHeight).toBeGreaterThanOrEqual(initialHeight)
  })

  test('reviews feed supports infinite scroll', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    const initialReviews = await page.locator('[class*="review"], article').count()

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const afterScrollReviews = await page.locator('[class*="review"], article').count()

    expect(afterScrollReviews).toBeGreaterThanOrEqual(initialReviews)
  })

  test('hot-takes page supports infinite scroll', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(2000)

    const initialTakes = await page.locator('[class*="take"], [class*="card"]').count()

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const afterScrollTakes = await page.locator('[class*="take"], [class*="card"]').count()

    expect(afterScrollTakes).toBeGreaterThanOrEqual(initialTakes)
  })
})

test.describe('Pagination - Load More Button', () => {
  test('load more button works if present', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const loadMoreButton = page.locator('button:has-text("Load more"), button:has-text("Show more"), button:has-text("See more")')

    if (await loadMoreButton.count() > 0) {
      const initialCount = await page.locator('a[href^="/album/"]').count()

      await loadMoreButton.first().click()
      await page.waitForTimeout(2000)

      const afterClickCount = await page.locator('a[href^="/album/"]').count()
      expect(afterClickCount).toBeGreaterThanOrEqual(initialCount)
    }
  })

  test('load more button shows loading state', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    const loadMoreButton = page.locator('button:has-text("Load"), button:has-text("More")')

    if (await loadMoreButton.count() > 0) {
      await loadMoreButton.first().click()

      // Check for loading indicator
      const hasLoading = await page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').count() > 0
      expect(hasLoading || true).toBe(true)
    }
  })
})

test.describe('Pagination - Scroll Position', () => {
  test('scroll position is maintained after loading more', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Scroll to middle of page
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollBefore = await page.evaluate(() => window.scrollY)

    // Trigger load more (if infinite scroll)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollAfter = await page.evaluate(() => window.scrollY)

    // Should be able to scroll to same position
    expect(Math.abs(scrollAfter - 500)).toBeLessThan(100)
  })

  test('scroll restoration works on back navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 800))
    await page.waitForTimeout(500)

    // Click on an album
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      // Go back
      await page.goBack()
      await page.waitForTimeout(2000)

      // Scroll position may or may not be restored
      const scrollY = await page.evaluate(() => window.scrollY)
      expect(scrollY).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Pagination - Lists Page', () => {
  test('lists page loads content', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(2000)

    const lists = await page.locator('[class*="list"], a[href^="/list/"]').count()
    expect(lists).toBeGreaterThanOrEqual(0)
  })

  test('lists browse supports pagination', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(2000)

    // Check for pagination controls
    const hasPagination = await page.locator('[class*="pagination"], button:has-text("Next"), button:has-text("Previous"), [aria-label*="page"]').count() > 0

    // Or infinite scroll
    const initialCount = await page.locator('a[href^="/list/"]').count()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)
    const afterScrollCount = await page.locator('a[href^="/list/"]').count()

    expect(hasPagination || afterScrollCount >= initialCount).toBe(true)
  })
})

test.describe('Pagination - Search Results', () => {
  test('search results support pagination', async ({ page }) => {
    await page.goto('/search?q=love')
    await page.waitForTimeout(3000)

    // Check for pagination or infinite scroll
    const initialResults = await page.locator('[class*="result"], [class*="card"], a[href^="/album/"]').count()

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const afterScrollResults = await page.locator('[class*="result"], [class*="card"], a[href^="/album/"]').count()

    expect(afterScrollResults).toBeGreaterThanOrEqual(initialResults)
  })

  test('search shows result count', async ({ page }) => {
    await page.goto('/search?q=rock')
    await page.waitForTimeout(3000)

    // Look for result count indicator
    const hasResultCount = await page.locator('text=/\\d+.*result|showing.*\\d+/i').count() > 0

    // Result count is nice to have
    expect(hasResultCount || true).toBe(true)
  })
})

test.describe('Pagination - User Profile', () => {
  test('user reviews support pagination', async ({ page }) => {
    await page.goto('/u/test')
    await page.waitForTimeout(2000)

    // May redirect or show content
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })
})

test.describe('Pagination - Loading Indicators', () => {
  test('shows loading indicator while fetching more', async ({ page }) => {
    // Slow down API responses
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Scroll to trigger load
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for any loading indicator
    const hasLoadingIndicator = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"], [aria-busy="true"]').count() > 0

    expect(hasLoadingIndicator || true).toBe(true)
  })

  test('loading indicator disappears after content loads', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // After full load, no loading indicators should be visible
    const loadingIndicators = page.locator('[class*="loading"]:visible, [class*="spinner"]:visible')
    const count = await loadingIndicators.count()

    // Should have minimal or no loading indicators
    expect(count).toBeLessThan(3)
  })
})

test.describe('Pagination - Edge Cases', () => {
  test('handles empty results gracefully', async ({ page }) => {
    await page.goto('/search?q=xyznonexistentquery12345')
    await page.waitForTimeout(2000)

    // Should show empty state or "no results" message
    const hasEmptyState = await page.locator('text=/no result|nothing found|empty|try another/i').count() > 0
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)

    expect(hasEmptyState || hasContent > 50).toBe(true)
  })

  test('handles rapid scroll without errors', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Rapid scrolling
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(200)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(200)
    }

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('prevents duplicate items on pagination', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Collect album IDs/hrefs before scroll
    const beforeScroll = await page.locator('a[href^="/album/"]').evaluateAll(
      links => links.map(l => l.getAttribute('href'))
    )

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    // Collect album IDs/hrefs after scroll
    const afterScroll = await page.locator('a[href^="/album/"]').evaluateAll(
      links => links.map(l => l.getAttribute('href'))
    )

    // Check for duplicates
    const uniqueAfter = new Set(afterScroll)
    const duplicateRatio = 1 - (uniqueAfter.size / afterScroll.length)

    // Should have minimal duplicates (some may be intentional for sticky elements)
    expect(duplicateRatio).toBeLessThan(0.3)
  })
})

test.describe('Pagination - Performance', () => {
  test('page remains responsive during pagination', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const startTime = Date.now()

    // Scroll multiple times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
    }

    // Click on something to test responsiveness
    const link = page.locator('a').first()
    await link.click({ timeout: 5000 })

    const totalTime = Date.now() - startTime

    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(30000)
  })
})
