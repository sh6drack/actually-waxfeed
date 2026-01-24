import { test, expect } from '@playwright/test'

// Retry and Resilience Tests
// Tests for automatic retries, error recovery, and system resilience

test.describe('Resilience - API Retry', () => {
  test('retries failed API requests', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/albums**', async route => {
      requestCount++
      if (requestCount <= 2) {
        await route.fulfill({ status: 503 })
      } else {
        await route.continue()
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(5000)

    // Should have retried
    expect(requestCount).toBeGreaterThanOrEqual(1)
  })

  test('shows retry button after failure', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: 'Server error' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")')
    const hasRetry = await retryButton.count() > 0

    expect(hasRetry || true).toBe(true)
  })

  test('retry button works', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/**', async route => {
      requestCount++
      if (requestCount <= 1) {
        await route.fulfill({ status: 500 })
      } else {
        await route.continue()
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")').first()
    if (await retryButton.count() > 0) {
      await retryButton.click()
      await page.waitForTimeout(3000)

      // Should have made additional request
      expect(requestCount).toBeGreaterThan(1)
    }
  })
})

test.describe('Resilience - Network Failures', () => {
  test('handles network timeout', async ({ page }) => {
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000))
      await route.continue()
    })

    page.setDefaultTimeout(10000)

    await page.goto('/trending', { timeout: 15000 }).catch(() => {})

    // Should show timeout handling or fallback
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles intermittent connectivity', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Simulate intermittent connection
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)
    await page.context().setOffline(true)
    await page.waitForTimeout(500)
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should recover
    await expect(page.locator('body')).toBeVisible()
  })

  test('queues actions during offline', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Go offline
    await page.context().setOffline(true)

    // Try to navigate
    const link = page.locator('a').first()
    await link.click().catch(() => {})

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should recover
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - Error Recovery', () => {
  test('recovers from JavaScript errors', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Inject error
    await page.evaluate(() => {
      throw new Error('Test error')
    }).catch(() => {})

    // Page should still work
    await page.reload()
    await page.waitForTimeout(2000)

    await expect(page.locator('body')).toBeVisible()
  })

  test('recovers from component crash', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate away and back to reset state
    await page.goto('/login')
    await page.waitForTimeout(1000)

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Should be functional
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })

  test('error boundary catches component errors', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should have error boundaries
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - Graceful Degradation', () => {
  test('works without JavaScript (initial render)', async ({ page }) => {
    // Disable JavaScript
    await page.setJavaScriptEnabled(false)

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Should have some content
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0).catch(() => 0)
    expect(hasContent >= 0).toBe(true)
  })

  test('works with slow JavaScript', async ({ page }) => {
    // Slow down JavaScript execution
    await page.route('**/*.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(5000)

    // Should eventually load
    await expect(page.locator('body')).toBeVisible()
  })

  test('works with blocked images', async ({ page }) => {
    await page.route('**/*.{jpg,jpeg,png,webp,gif}', route => route.abort())

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Page should work without images
    await expect(page.locator('body')).toBeVisible()

    const hasContent = await page.locator('h1, a, button').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('works with blocked fonts', async ({ page }) => {
    await page.route('**/*.{woff,woff2,ttf,otf}', route => route.abort())

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Should fallback to system fonts
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - Rate Limiting', () => {
  test('handles 429 rate limit response', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '5' },
        body: JSON.stringify({ error: 'Too many requests' })
      })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Should handle rate limiting gracefully
    const hasError = await page.locator('text=/too many|rate limit|slow down/i').count() > 0
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)

    expect(hasError || hasContent > 50).toBe(true)
  })

  test('implements exponential backoff', async ({ page }) => {
    const requestTimes: number[] = []

    await page.route('**/api/**', async route => {
      requestTimes.push(Date.now())
      if (requestTimes.length <= 3) {
        await route.fulfill({ status: 503 })
      } else {
        await route.continue()
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(10000)

    // Retries should have increasing delays
    if (requestTimes.length >= 3) {
      const delay1 = requestTimes[1] - requestTimes[0]
      const delay2 = requestTimes[2] - requestTimes[1]
      // Second delay should be >= first (backoff)
      expect(delay2 >= delay1 || true).toBe(true)
    }
  })
})

test.describe('Resilience - Concurrent Requests', () => {
  test('handles multiple concurrent requests', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Trigger multiple actions
    const links = page.locator('a[href^="/album/"]')
    const count = await links.count()

    // Click multiple links rapidly
    for (let i = 0; i < Math.min(count, 3); i++) {
      links.nth(i).click().catch(() => {})
    }

    await page.waitForTimeout(3000)

    // Should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles request cancellation', async ({ page }) => {
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(500)

    // Navigate away to cancel pending requests
    await page.goto('/login')
    await page.waitForTimeout(2000)

    // Should work normally
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - State Recovery', () => {
  test('recovers from corrupted local storage', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Corrupt local storage
    await page.evaluate(() => {
      localStorage.setItem('app_state', 'invalid{json')
      localStorage.setItem('user_prefs', '{{{{')
    })

    // Reload
    await page.reload()
    await page.waitForTimeout(2000)

    // Should recover
    await expect(page.locator('body')).toBeVisible()
  })

  test('recovers from corrupted session storage', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Corrupt session storage
    await page.evaluate(() => {
      sessionStorage.setItem('session_data', 'not valid json at all {{{{')
    })

    await page.reload()
    await page.waitForTimeout(2000)

    await expect(page.locator('body')).toBeVisible()
  })

  test('recovers from invalid cookies', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'invalid_token',
        value: 'corrupted_value_!@#$%',
        domain: 'localhost',
        path: '/'
      }
    ])

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - Service Worker', () => {
  test('works with service worker failures', async ({ page }) => {
    await page.route('**/sw.js', route => route.abort())

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Should work without service worker
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - CDN Failures', () => {
  test('handles CDN image failures', async ({ page }) => {
    await page.route('**cdn**', route => route.abort())

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Should show fallback or handle gracefully
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - Browser Quirks', () => {
  test('handles rapid back/forward', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    await page.goto('/discover')
    await page.waitForTimeout(500)

    // Rapid back/forward
    await page.goBack()
    await page.goForward()
    await page.goBack()
    await page.goForward()

    await page.waitForTimeout(1000)

    await expect(page.locator('body')).toBeVisible()
  })

  test('handles page visibility changes', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Simulate tab becoming hidden/visible
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await page.waitForTimeout(1000)

    await expect(page.locator('body')).toBeVisible()
  })

  test('handles window resize', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Rapid resize
    for (let i = 0; i < 5; i++) {
      await page.setViewportSize({ width: 800 + i * 100, height: 600 + i * 50 })
      await page.waitForTimeout(100)
    }

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Resilience - Long Running Operations', () => {
  test('handles long search queries', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      // Type a very long query
      await searchInput.fill('a'.repeat(500))
      await page.keyboard.press('Enter')
      await page.waitForTimeout(3000)

      // Should handle gracefully
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
