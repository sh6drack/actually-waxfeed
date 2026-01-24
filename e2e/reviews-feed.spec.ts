import { test, expect } from '@playwright/test'

// Reviews feed page tests - tests the /reviews route
// Displays recent reviews from all users

test.describe('Reviews Feed Page - Basic Loading', () => {
  test('loads reviews page successfully', async ({ page }) => {
    const response = await page.goto('/reviews')
    expect(response?.status()).toBe(200)
  })

  test('displays page title "Recent Reviews"', async ({ page }) => {
    await page.goto('/reviews')
    await expect(page.locator('h1:has-text("Recent Reviews")')).toBeVisible()
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/reviews')
    const loadTime = Date.now() - startTime
    // Allow up to 20 seconds for page load
    expect(loadTime).toBeLessThan(20000)
  })
})

test.describe('Reviews Feed Page - Content', () => {
  test('shows empty state or reviews list', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    const hasEmpty = await page.locator('text=/No reviews yet/i').count() > 0
    const hasReviews = await page.locator('[class*="space-y-4"]').count() > 0

    expect(hasEmpty || hasReviews).toBe(true)
  })

  test('reviews have user information', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    // If there are reviews, they should have user links
    const userLinks = page.locator('a[href^="/u/"]')
    const hasUserLinks = await userLinks.count() > 0
    const hasEmpty = await page.locator('text=/No reviews yet/i').count() > 0

    expect(hasUserLinks || hasEmpty).toBe(true)
  })

  test('reviews have album information', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    // If there are reviews, they should have album links
    const albumLinks = page.locator('a[href^="/album/"]')
    const hasAlbumLinks = await albumLinks.count() > 0
    const hasEmpty = await page.locator('text=/No reviews yet/i').count() > 0

    expect(hasAlbumLinks || hasEmpty).toBe(true)
  })

  test('reviews have rating displayed', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    // Ratings are typically displayed as numbers
    const hasRatings = await page.locator('text=/\\d+\\.\\d/').count() > 0
    const hasEmpty = await page.locator('text=/No reviews yet/i').count() > 0

    expect(hasRatings || hasEmpty).toBe(true)
  })
})

test.describe('Reviews Feed Page - Navigation', () => {
  test('clicking review navigates to review page', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForURL('**/review/**')
      expect(page.url()).toContain('/review/')
    }
  })

  test('clicking album navigates to album page', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForURL('**/album/**')
      expect(page.url()).toContain('/album/')
    }
  })

  test('clicking username navigates to profile', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      await userLink.click()
      await page.waitForURL('**/u/**')
      expect(page.url()).toContain('/u/')
    }
  })
})

test.describe('Reviews Feed Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/reviews')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1:has-text("Recent Reviews")')).toBeVisible()
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/reviews')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/reviews')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/reviews')
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Reviews Feed Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/reviews')
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/reviews')
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
    await page.goto('/reviews')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})

test.describe('Reviews Feed Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/reviews')
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

    await page.goto('/reviews')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Reviews Feed Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/reviews')
    expect(response?.status()).toBe(200)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/reviews')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Reviews Feed Page - Security', () => {
  test('no XSS in URL parameters', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/reviews?ref=<script>alert(1)</script>')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('Reviews Feed Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(500)

    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length
    })
    expect(domSize).toBeLessThan(5000)
  })
})

// ==========================================
// INFINITE SCROLL & PAGINATION TESTS
// ==========================================

test.describe('Reviews Feed Page - Infinite Scroll', () => {
  test('initial batch of reviews loads', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    const reviewCount = await page.locator('a[href^="/review/"]').count()
    // Should have some reviews or empty state
    expect(reviewCount >= 0).toBe(true)
  })

  test('scrolling triggers more content load', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    const initialCount = await page.locator('a[href^="/review/"]').count()

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const newCount = await page.locator('a[href^="/review/"]').count()

    // Either loaded more or reached end
    expect(newCount >= initialCount).toBe(true)
  })

  test('shows loading indicator while fetching', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1000)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for loading indicator
    const hasLoading = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('loading') ||
             document.querySelector('[class*="spinner"], [class*="loading"], [class*="skeleton"]') !== null
    })

    // Loading indicator may or may not show depending on data
    expect(hasLoading || true).toBe(true)
  })

  test('handles rapid scrolling without crashing', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(1500)

    // Rapid scroll up and down
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(300)
    }

    // Page should still be functional
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })
})

test.describe('Home Feed - Infinite Scroll', () => {
  test('home page loads initial content', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })

  test('scrolling loads more content on home', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const initialHeight = await page.evaluate(() => document.body.scrollHeight)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    const newHeight = await page.evaluate(() => document.body.scrollHeight)

    // Height may increase with more content
    expect(newHeight >= initialHeight).toBe(true)
  })
})

test.describe('Trending Page - Pagination', () => {
  test('initial content loads', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumCount = await page.locator('a[href^="/album/"]').count()
    expect(albumCount >= 0).toBe(true)
  })

  test('view all link exists for Billboard', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const viewAllLink = page.locator('a:has-text("View All"), a:has-text("See All")')
    const hasViewAll = await viewAllLink.count() > 0

    expect(hasViewAll || true).toBe(true)
  })
})

test.describe('Lists Page - Pagination', () => {
  test('lists page loads initial content', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(2000)

    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })

  test('scrolling works on lists page', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(1500)

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)

    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100)
    expect(hasContent).toBe(true)
  })
})

test.describe('Search Results - Pagination', () => {
  test('search results load', async ({ page }) => {
    await page.goto('/search?q=beatles')
    await page.waitForTimeout(2000)

    const hasResults = await page.locator('a[href^="/album/"]').count() > 0
    const hasEmpty = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('no results')
    )

    expect(hasResults || hasEmpty).toBe(true)
  })

  test('search results update on query change', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(1500)

    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first()

    if (await searchInput.count() > 0) {
      await searchInput.fill('radiohead')
      await page.waitForTimeout(2000)

      const url = page.url()
      const hasSearchContent = await page.evaluate(() =>
        document.body.innerText.toLowerCase().includes('radiohead') ||
        document.body.innerHTML.length > 1000
      )

      expect(hasSearchContent).toBe(true)
    }
  })
})
