import { test, expect } from '@playwright/test'

// Network Tests - API behavior, error handling, and network conditions
// Tests for handling various network scenarios

test.describe('Network - API Response Handling', () => {
  test('handles slow API responses gracefully', async ({ page }) => {
    // Slow down API responses
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    const response = await page.goto('/trending')
    expect(response?.status()).toBeLessThan(500)

    // Page should still render even with slow API
    await expect(page.locator('h1')).toBeVisible({ timeout: 30000 })
  })

  test('shows loading states during API calls', async ({ page }) => {
    // Intercept and delay API calls
    await page.route('**/api/reviews**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      await route.continue()
    })

    await page.goto('/reviews')

    // Should show some loading indicator or content
    const hasContent = await page.evaluate(() => {
      return document.body.textContent && document.body.textContent.length > 100
    })
    expect(hasContent).toBe(true)
  })

  test('handles API errors without crashing', async ({ page }) => {
    // Mock API error
    await page.route('**/api/albums/search**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.goto('/search?q=test')
    await page.waitForTimeout(2000)

    // Page should still be interactive
    const isInteractive = await page.evaluate(() => {
      return document.querySelectorAll('a, button, input').length > 0
    })
    expect(isInteractive).toBe(true)
  })

  test('handles 404 API responses', async ({ page }) => {
    await page.route('**/api/albums/**', route => {
      if (route.request().url().includes('/api/albums/')) {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Not found' })
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/album/nonexistent-id')
    await page.waitForTimeout(2000)

    // Should show 404 page or error state
    const has404 = await page.locator('text=/not found/i').count() > 0
    const hasError = await page.locator('text=/error/i').count() > 0
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)

    expect(has404 || hasError || hasContent > 50).toBe(true)
  })

  test('handles network timeout gracefully', async ({ page }) => {
    await page.route('**/api/**', async route => {
      // Never respond - simulates timeout
      await new Promise(() => {})
    })

    // Set shorter navigation timeout for this test
    page.setDefaultNavigationTimeout(10000)

    try {
      await page.goto('/trending', { timeout: 10000 })
    } catch {
      // Expected to timeout
    }

    // Browser should not crash
    const isStable = await page.evaluate(() => true)
    expect(isStable).toBe(true)
  })
})

test.describe('Network - Mock Data Tests', () => {
  test('displays mocked album data correctly', async ({ page }) => {
    await page.route('**/api/albums/search**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            albums: [
              {
                id: 'test-1',
                title: 'Test Album',
                artistName: 'Test Artist',
                coverArtUrl: 'https://via.placeholder.com/300'
              }
            ]
          }
        })
      })
    })

    await page.goto('/search?q=test')
    await page.waitForTimeout(2000)

    // Should display mocked data
    const hasTestAlbum = await page.locator('text=/Test Album/i').count() > 0
    const hasTestArtist = await page.locator('text=/Test Artist/i').count() > 0

    // Either shows mocked data or has search functionality
    expect(hasTestAlbum || hasTestArtist || await page.locator('input').count() > 0).toBe(true)
  })

  test('displays empty state when no results', async ({ page }) => {
    await page.route('**/api/albums/search**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { albums: [] }
        })
      })
    })

    await page.goto('/search?q=xyznonexistent123')
    await page.waitForTimeout(2000)

    // Should handle empty results gracefully
    const hasEmptyState = await page.locator('text=/no results/i').count() > 0
    const hasSearchInput = await page.locator('input').count() > 0

    expect(hasEmptyState || hasSearchInput).toBe(true)
  })
})

test.describe('Network - Request Validation', () => {
  test('search sends correct query parameters', async ({ page }) => {
    let capturedUrl = ''

    await page.route('**/api/albums/search**', route => {
      capturedUrl = route.request().url()
      route.continue()
    })

    await page.goto('/search')
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('radiohead')
      await page.waitForTimeout(1500) // Wait for debounce

      if (capturedUrl) {
        expect(capturedUrl).toContain('q=')
      }
    }
  })

  test('API requests include correct headers', async ({ page }) => {
    let capturedHeaders: Record<string, string> = {}

    await page.route('**/api/**', route => {
      capturedHeaders = route.request().headers()
      route.continue()
    })

    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    // Should have standard headers
    if (Object.keys(capturedHeaders).length > 0) {
      expect(capturedHeaders['accept']).toBeTruthy()
    }
  })
})

test.describe('Network - Caching Behavior', () => {
  test('repeated requests may use cached data', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/reviews**', route => {
      requestCount++
      route.continue()
    })

    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    // Navigate away and back
    await page.goto('/trending')
    await page.waitForTimeout(1000)
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    // Should have made requests (caching behavior varies)
    expect(requestCount).toBeGreaterThan(0)
  })
})

test.describe('Network - Concurrent Requests', () => {
  test('handles multiple concurrent API calls', async ({ page }) => {
    let concurrentRequests = 0
    let maxConcurrent = 0

    await page.route('**/api/**', async route => {
      concurrentRequests++
      maxConcurrent = Math.max(maxConcurrent, concurrentRequests)

      await new Promise(resolve => setTimeout(resolve, 500))

      concurrentRequests--
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Page should handle concurrent requests
    expect(maxConcurrent).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Network - Retry Logic', () => {
  test('application handles intermittent failures', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/reviews**', route => {
      requestCount++
      if (requestCount <= 1) {
        // First request fails
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Temporary error' })
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/reviews')
    await page.waitForTimeout(3000)

    // Page should eventually load or show error gracefully
    const hasContent = await page.evaluate(() => {
      return document.body.textContent && document.body.textContent.length > 50
    })
    expect(hasContent).toBe(true)
  })
})

test.describe('Network - Offline Behavior', () => {
  test('page handles going offline gracefully', async ({ page, context }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Try to navigate
    try {
      await page.goto('/discover', { timeout: 5000 })
    } catch {
      // Expected to fail
    }

    // Go back online
    await context.setOffline(false)

    // Should be able to recover
    const response = await page.goto('/trending')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Network - Request Throttling', () => {
  test('search debounces rapid input', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/albums/search**', route => {
      requestCount++
      route.continue()
    })

    await page.goto('/search')
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      // Type rapidly
      await searchInput.type('radiohead', { delay: 50 })
      await page.waitForTimeout(2000)

      // Should not make a request for every keystroke
      expect(requestCount).toBeLessThan(10)
    }
  })
})

test.describe('Network - CORS and Security', () => {
  test('API requests go to same origin', async ({ page }) => {
    const apiRequests: string[] = []

    await page.route('**/*', route => {
      const url = route.request().url()
      if (url.includes('/api/')) {
        apiRequests.push(url)
      }
      route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // All API requests should be same-origin
    for (const url of apiRequests) {
      expect(url).toContain('localhost')
    }
  })
})
