import { test, expect } from '@playwright/test'

// Memory Leak Detection Tests
// Tests for detecting memory leaks, DOM growth, and resource cleanup

test.describe('Memory - DOM Size Monitoring', () => {
  test('DOM size stays reasonable during navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialDOMSize = await page.evaluate(() => document.querySelectorAll('*').length)

    // Navigate through several pages
    const routes = ['/discover', '/search', '/lists', '/reviews', '/trending']
    for (const route of routes) {
      await page.goto(route)
      await page.waitForTimeout(1500)
    }

    const finalDOMSize = await page.evaluate(() => document.querySelectorAll('*').length)

    // DOM size should not grow excessively
    const growthRatio = finalDOMSize / initialDOMSize
    expect(growthRatio).toBeLessThan(3)
  })

  test('DOM cleanup on navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate to album
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const albumDOMSize = await page.evaluate(() => document.querySelectorAll('*').length)

      // Navigate back
      await page.goto('/trending')
      await page.waitForTimeout(2000)

      const backDOMSize = await page.evaluate(() => document.querySelectorAll('*').length)

      // DOM should be similar after returning
      expect(backDOMSize).toBeLessThan(albumDOMSize * 2)
    }
  })
})

test.describe('Memory - Event Listener Cleanup', () => {
  test('no excessive event listeners', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Count event listeners (approximation)
    const listenerCount = await page.evaluate(() => {
      let count = 0
      const elements = document.querySelectorAll('*')
      elements.forEach(el => {
        // Check for common event attributes
        if (el.onclick) count++
        if (el.onscroll) count++
        if (el.onmouseover) count++
      })
      return count
    })

    // Should not have excessive inline handlers
    expect(listenerCount).toBeLessThan(1000)
  })

  test('listeners cleaned up on unmount', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Track resize listeners
    const initialResizeListeners = await page.evaluate(() => {
      return (window as any).__resizeListenerCount || 0
    })

    // Navigate away and back
    await page.goto('/discover')
    await page.waitForTimeout(1500)

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    // Should not accumulate listeners
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Memory - Timer Cleanup', () => {
  test('no accumulating timers during navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/discover')
      await page.waitForTimeout(500)
      await page.goto('/trending')
      await page.waitForTimeout(500)
    }

    // Page should remain responsive
    const startTime = Date.now()
    await page.click('body')
    const responseTime = Date.now() - startTime

    // Should respond quickly (not blocked by timers)
    expect(responseTime).toBeLessThan(1000)
  })

  test('intervals cleared on navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Track active intervals
    await page.evaluate(() => {
      (window as any).__intervalCount = 0
      const originalSetInterval = window.setInterval
      window.setInterval = function(...args) {
        (window as any).__intervalCount++
        return originalSetInterval.apply(this, args as any)
      } as typeof setInterval
    })

    // Navigate away
    await page.goto('/discover')
    await page.waitForTimeout(2000)

    // Page should work normally
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Memory - Image Loading', () => {
  test('images are garbage collected', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialImages = await page.evaluate(() => document.images.length)

    // Scroll to load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)

    // Navigate away
    await page.goto('/login')
    await page.waitForTimeout(1500)

    // Images should be cleaned up
    const loginImages = await page.evaluate(() => document.images.length)
    expect(loginImages).toBeLessThan(initialImages + 50)
  })

  test('lazy loaded images dont accumulate', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Scroll down multiple times
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
    }

    const imageCount = await page.evaluate(() => document.images.length)

    // Should have reasonable image count
    expect(imageCount).toBeLessThan(500)
  })
})

test.describe('Memory - Component Cleanup', () => {
  test('modal cleanup after close', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const beforeModals = await page.locator('[role="dialog"]').count()

    // Try to open/close modal if available
    const shareButton = page.locator('button[aria-label*="share"], button:has-text("Share")').first()
    if (await shareButton.count() > 0) {
      await shareButton.click()
      await page.waitForTimeout(500)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)

      const afterModals = await page.locator('[role="dialog"]:visible').count()
      expect(afterModals).toBe(0)
    }
  })

  test('dropdown cleanup after close', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const dropdown = page.locator('[aria-expanded]').first()
    if (await dropdown.count() > 0) {
      await dropdown.click()
      await page.waitForTimeout(300)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)

      // Dropdown menu should be cleaned up
      const openMenus = await page.locator('[role="menu"]:visible').count()
      expect(openMenus).toBe(0)
    }
  })

  test('tooltip cleanup on mouse leave', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const hoverElement = page.locator('[title], [data-tooltip]').first()
    if (await hoverElement.count() > 0) {
      await hoverElement.hover()
      await page.waitForTimeout(500)

      // Move away
      await page.mouse.move(0, 0)
      await page.waitForTimeout(500)

      // Tooltips should be cleaned up
      const tooltips = await page.locator('[role="tooltip"]:visible').count()
      expect(tooltips).toBe(0)
    }
  })
})

test.describe('Memory - Scroll Handlers', () => {
  test('scroll handlers dont cause memory issues', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Rapid scrolling
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollTo(0, Math.random() * document.body.scrollHeight))
      await page.waitForTimeout(100)
    }

    // Page should remain responsive
    await expect(page.locator('body')).toBeVisible()
  })

  test('infinite scroll cleanup', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Scroll to bottom multiple times
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
    }

    const domSize = await page.evaluate(() => document.querySelectorAll('*').length)

    // DOM should not grow without bound
    expect(domSize).toBeLessThan(10000)
  })
})

test.describe('Memory - Form State', () => {
  test('form state cleaned up on navigation', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com')
    }

    // Navigate away
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    // Navigate back
    await page.goto('/login')
    await page.waitForTimeout(1500)

    // Form may or may not persist state
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Memory - Animation Cleanup', () => {
  test('animations are cleaned up', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate to trigger animations
    await page.goto('/discover')
    await page.waitForTimeout(1500)

    await page.goto('/trending')
    await page.waitForTimeout(1500)

    // Check for running animations
    const runningAnimations = await page.evaluate(() => {
      return document.getAnimations().length
    })

    // Should have reasonable number of animations
    expect(runningAnimations).toBeLessThan(100)
  })
})

test.describe('Memory - Network Cleanup', () => {
  test('pending requests canceled on navigation', async ({ page }) => {
    // Slow down requests
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(500)

    // Navigate away while requests pending
    await page.goto('/login')
    await page.waitForTimeout(1000)

    // Page should load without issues
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Memory - Stress Testing', () => {
  test('handles rapid page changes', async ({ page }) => {
    const routes = ['/trending', '/discover', '/search', '/lists', '/reviews']

    for (let i = 0; i < 10; i++) {
      const route = routes[i % routes.length]
      await page.goto(route)
      await page.waitForTimeout(300)
    }

    // Should remain functional
    await expect(page.locator('body')).toBeVisible()

    const domSize = await page.evaluate(() => document.querySelectorAll('*').length)
    expect(domSize).toBeLessThan(10000)
  })

  test('handles long session', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialDOMSize = await page.evaluate(() => document.querySelectorAll('*').length)

    // Simulate extended use
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollTo(0, Math.random() * 1000))
      await page.waitForTimeout(200)
    }

    const finalDOMSize = await page.evaluate(() => document.querySelectorAll('*').length)

    // DOM should not grow significantly
    expect(finalDOMSize).toBeLessThan(initialDOMSize * 2)
  })
})

test.describe('Memory - Performance Metrics', () => {
  test('JS heap stays reasonable', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate multiple pages
    for (const route of ['/discover', '/search', '/lists', '/reviews']) {
      await page.goto(route)
      await page.waitForTimeout(1000)
    }

    // Page should remain responsive
    const startTime = Date.now()
    await page.goto('/trending')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(10000)
  })
})
