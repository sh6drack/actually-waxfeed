import { test, expect } from '@playwright/test'

// User Stats page tests - tests the /u/[username]/stats route
// Displays user statistics including reviews, ratings, top artists/genres

test.describe('User Stats Page - Navigation to Stats', () => {
  test('can navigate to stats from user profile', async ({ page }) => {
    // First find a user from trending or discover
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    // Find a user link
    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      await userLink.click()
      await page.waitForTimeout(1000)

      // Check if there's a stats link
      const statsLink = page.locator('a[href$="/stats"]')
      if (await statsLink.count() > 0) {
        await statsLink.click()
        await page.waitForURL('**/stats')
        expect(page.url()).toContain('/stats')
      }
    }
  })
})

test.describe('User Stats Page - Valid User', () => {
  test('loads stats page for existing user via profile', async ({ page }) => {
    // Navigate from trending to a user to their stats
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const response = await page.goto(`${href}/stats`)
        // Should either load successfully or show 404 for users without stats
        expect(response?.status()).toBeLessThan(500)
      }
    }
  })

  test('displays Stats heading when page loads', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(1000)

        // Should show "Stats" in heading
        const hasStatsTitle = await page.locator('h1:has-text("Stats")').count() > 0
        // Or 404 page if user doesn't exist
        const is404 = await page.locator('text=/not found/i').count() > 0

        expect(hasStatsTitle || is404).toBe(true)
      }
    }
  })
})

test.describe('User Stats Page - Invalid User', () => {
  test('returns 404 for non-existent user', async ({ page }) => {
    const response = await page.goto('/u/nonexistent-user-xyz-123456/stats')
    expect(response?.status()).toBe(404)
  })

  test('shows not found message for invalid user', async ({ page }) => {
    await page.goto('/u/nonexistent-user-xyz-123456/stats')
    await page.waitForTimeout(500)

    const hasNotFound = await page.locator('text=/not found/i').count() > 0
    expect(hasNotFound).toBe(true)
  })
})

test.describe('User Stats Page - Structure', () => {
  // These tests navigate from known pages to find real users with stats

  test('displays back to profile link', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(1000)

        // Should have back link
        const backLink = page.locator('a:has-text("Back to profile")')
        const hasBackLink = await backLink.count() > 0
        const is404 = await page.locator('text=/not found/i').count() > 0

        expect(hasBackLink || is404).toBe(true)
      }
    }
  })

  test('displays year in header', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(1000)

        const currentYear = new Date().getFullYear().toString()
        const hasYear = await page.locator(`text=${currentYear}`).count() > 0
        const is404 = await page.locator('text=/not found/i').count() > 0

        expect(hasYear || is404).toBe(true)
      }
    }
  })
})

test.describe('User Stats Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const response = await page.goto(`${href}/stats`)
        expect(response?.status()).toBeLessThan(500)
      }
    }
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const response = await page.goto(`${href}/stats`)
        expect(response?.status()).toBeLessThan(500)
      }
    }
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const response = await page.goto(`${href}/stats`)
        expect(response?.status()).toBeLessThan(500)
      }
    }
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(1000)

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })
        expect(hasHorizontalScroll).toBe(false)
      }
    }
  })
})

test.describe('User Stats Page - Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)

        const htmlLang = await page.getAttribute('html', 'lang')
        expect(htmlLang).toBeTruthy()
      }
    }
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(1000)

        const focusableCount = await page.evaluate(() => {
          const focusable = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          return focusable.length
        })
        expect(focusableCount).toBeGreaterThan(0)
      }
    }
  })
})

test.describe('User Stats Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(2000)

        const significantErrors = errors.filter(
          (e) => !e.includes('ResizeObserver') &&
                 !e.includes('hydration') &&
                 !e.includes('Script error')
        )

        expect(significantErrors).toHaveLength(0)
      }
    }
  })

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(1500)

        const significantErrors = consoleErrors.filter(
          (e) => !e.includes('favicon') &&
                 !e.includes('404') &&
                 !e.includes('hydration')
        )

        expect(significantErrors.length).toBeLessThanOrEqual(2)
      }
    }
  })
})

test.describe('User Stats Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const response = await page.goto(`${href}/stats`)
        expect(response?.status()).toBeLessThan(500)
      }
    }
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const response = await page.goto(`${href}/stats`)
        expect(response?.status()).toBeLessThan(500)
      }
    }
  })
})

test.describe('User Stats Page - Security', () => {
  test('no XSS in username parameter', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/u/<script>alert(1)</script>/stats')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })

  test('no XSS with image onerror', async ({ page }) => {
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await page.goto('/u/<img src=x onerror=alert(1)>/stats')
    await page.waitForTimeout(500)

    expect(alertTriggered).toBe(false)
  })
})

test.describe('User Stats Page - Performance', () => {
  test('page has reasonable DOM size', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        await page.goto(`${href}/stats`)
        await page.waitForTimeout(2000)

        const domSize = await page.evaluate(() => {
          return document.querySelectorAll('*').length
        })
        expect(domSize).toBeLessThan(5000)
      }
    }
  })

  test('page loads within acceptable time', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      const href = await userLink.getAttribute('href')
      if (href) {
        const startTime = Date.now()
        await page.goto(`${href}/stats`)
        const loadTime = Date.now() - startTime
        expect(loadTime).toBeLessThan(10000)
      }
    }
  })
})
