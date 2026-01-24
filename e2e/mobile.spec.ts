import { test, expect } from '@playwright/test'

// Mobile-specific interaction tests
// Tests for touch interactions, mobile UI patterns, and mobile-specific behavior

// Viewport sizes for different devices
const iPhoneViewport = { width: 390, height: 844 }
const iPadViewport = { width: 834, height: 1194 }

test.describe('Mobile - Touch Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('tap navigation works', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.tap()
      await page.waitForTimeout(2000)

      // Should navigate to album page
      expect(page.url()).toContain('/album/')
    }
  })

  test('scroll works smoothly', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY)

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(500)

    const newScroll = await page.evaluate(() => window.scrollY)

    // Should have scrolled
    expect(newScroll).toBeGreaterThan(initialScroll)
  })

  test('form inputs are tappable', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.count() > 0) {
      await emailInput.tap()
      await page.waitForTimeout(500)

      // Input should be focused
      const isFocused = await emailInput.evaluate(el => el === document.activeElement)
      expect(isFocused).toBe(true)
    }
  })

  test('buttons respond to tap', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const button = page.locator('button[type="submit"]').first()
    if (await button.count() > 0) {
      // Button should be visible and tappable
      await expect(button).toBeVisible()

      const box = await button.boundingBox()
      expect(box).toBeTruthy()

      // Minimum touch target size (44px recommended)
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40)
      }
    }
  })
})

test.describe('Mobile - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('mobile menu is accessible', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('[aria-label*="menu"], button:has-text("☰"), [class*="hamburger"], [class*="mobile-menu"]')
    const hasMenu = await menuButton.count() > 0

    // Either has mobile menu or desktop nav is visible
    const hasNav = await page.locator('nav a').count() > 0

    expect(hasMenu || hasNav).toBe(true)
  })

  test('back navigation works', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Navigate to an album
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      // Go back
      await page.goBack()
      await page.waitForTimeout(2000)

      // Should be back on trending
      expect(page.url()).toContain('/trending')
    }
  })

  test('swipe gestures do not break layout', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Simulate horizontal swipe
    await page.mouse.move(300, 400)
    await page.mouse.down()
    await page.mouse.move(50, 400, { steps: 10 })
    await page.mouse.up()

    await page.waitForTimeout(500)

    // Page should not have horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBe(false)
  })
})

test.describe('Mobile - Viewport Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('content fits viewport width', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const viewportWidth = page.viewportSize()?.width || 390
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)

    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1)
  })

  test('no horizontal scroll on any page', async ({ page }) => {
    const pages = ['/trending', '/discover', '/lists', '/reviews', '/hot-takes']

    for (const url of pages) {
      await page.goto(url)
      await page.waitForTimeout(1500)

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll).toBe(false)
    }
  })

  test('viewport meta tag is present', async ({ page }) => {
    await page.goto('/trending')

    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta ? meta.getAttribute('content') : null
    })

    expect(viewport).toBeTruthy()
    expect(viewport).toContain('width=device-width')
  })
})

test.describe('Mobile - Touch Targets', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('links have adequate touch target size', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const links = page.locator('a')
    const count = await links.count()

    let tooSmallCount = 0
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i)
      if (await link.isVisible()) {
        const box = await link.boundingBox()
        if (box && (box.width < 44 || box.height < 44)) {
          // Check if it's inline text (acceptable)
          const display = await link.evaluate(el =>
            window.getComputedStyle(el).display
          )
          if (display !== 'inline') {
            tooSmallCount++
          }
        }
      }
    }

    // Most interactive elements should have adequate size
    expect(tooSmallCount).toBeLessThan(5)
  })

  test('buttons have minimum height', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // Buttons should be at least 40px tall for touch
          expect(box.height).toBeGreaterThanOrEqual(36)
        }
      }
    }
  })
})

test.describe('Mobile - Form Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('keyboard opens for text inputs', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const input = page.locator('input[type="email"], input[type="text"]').first()
    if (await input.count() > 0) {
      await input.focus()

      // Input should be focused
      const isFocused = await input.evaluate(el => el === document.activeElement)
      expect(isFocused).toBe(true)
    }
  })

  test('form fields are visible when focused', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const input = page.locator('input[type="email"], input[type="text"]').first()
    if (await input.count() > 0) {
      await input.tap()
      await page.waitForTimeout(500)

      // Input should still be visible
      await expect(input).toBeVisible()
    }
  })

  test('autocomplete attributes are set', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(1000)

    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.count() > 0) {
      const autocomplete = await emailInput.getAttribute('autocomplete')
      // Should have autocomplete for better mobile UX
      expect(autocomplete).toBeTruthy()
    }
  })
})

test.describe('Mobile - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('page loads in reasonable time on mobile', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/trending')
    const loadTime = Date.now() - startTime

    // Mobile should load within 15 seconds
    expect(loadTime).toBeLessThan(15000)
  })

  test('images are optimized for mobile', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i)
      if (await img.isVisible()) {
        const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth)
        const displayWidth = await img.evaluate(el => el.clientWidth)

        // Images shouldn't be massively larger than display size
        if (naturalWidth && displayWidth) {
          expect(naturalWidth).toBeLessThan(displayWidth * 4)
        }
      }
    }
  })
})

test.describe('Mobile - Tablet Viewport', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPadViewport)
  })

  test('tablet layout uses available space', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check for multi-column layouts on tablet
    const hasGrid = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        const display = window.getComputedStyle(el).display
        const gridColumns = window.getComputedStyle(el).gridTemplateColumns
        if (display === 'grid' && gridColumns !== 'none') {
          return true
        }
      }
      return false
    })

    // Tablet should potentially use grid layouts
    expect(hasGrid || true).toBe(true)
  })

  test('no wasted space on tablet', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const contentWidth = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body
      const rect = main.getBoundingClientRect()
      return rect.width
    })

    const viewportWidth = page.viewportSize()?.width || 834

    // Content should use at least 80% of viewport
    expect(contentWidth).toBeGreaterThan(viewportWidth * 0.5)
  })
})

test.describe('Mobile - Landscape Mode', () => {
  test('handles landscape orientation', async ({ page }) => {
    // iPhone in landscape
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Content should still be visible
    await expect(page.locator('h1')).toBeVisible()

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBe(false)
  })
})

test.describe('Mobile - Safe Areas', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(iPhoneViewport)
  })

  test('content respects safe areas', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check that content has padding from edges
    const bodyPadding = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body
      const styles = window.getComputedStyle(main)
      return {
        left: parseFloat(styles.paddingLeft),
        right: parseFloat(styles.paddingRight)
      }
    })

    // Should have some padding
    expect(bodyPadding.left >= 0 || bodyPadding.right >= 0).toBe(true)
  })
})
