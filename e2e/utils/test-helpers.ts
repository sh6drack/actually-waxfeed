import { Page, expect } from '@playwright/test'

/**
 * Common test helper functions for WAXFEED E2E tests
 */

/**
 * Wait for page to be fully loaded with content
 */
export async function waitForPageReady(page: Page, timeout = 5000) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(Math.min(timeout, 2000))
}

/**
 * Check if page has no horizontal overflow (useful for mobile tests)
 */
export async function checkNoHorizontalOverflow(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth
  })
}

/**
 * Get count of focusable elements (for accessibility tests)
 */
export async function getFocusableElementCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const focusable = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    return focusable.length
  })
}

/**
 * Get DOM size (for performance tests)
 */
export async function getDOMSize(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return document.querySelectorAll('*').length
  })
}

/**
 * Check if alert dialog was triggered (for XSS tests)
 */
export function setupXSSDetection(page: Page): { wasTriggered: () => boolean } {
  let alertTriggered = false

  page.on('dialog', async dialog => {
    alertTriggered = true
    await dialog.dismiss()
  })

  return {
    wasTriggered: () => alertTriggered
  }
}

/**
 * Collect JavaScript errors during test (for error handling tests)
 */
export function collectPageErrors(page: Page): {
  getErrors: () => string[]
  getSignificantErrors: () => string[]
} {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return {
    getErrors: () => errors,
    getSignificantErrors: () => errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error') &&
             !e.includes('Failed to fetch') &&
             !e.includes('WebGL')
    )
  }
}

/**
 * Collect console errors during test
 */
export function collectConsoleErrors(page: Page): {
  getErrors: () => string[]
  getSignificantErrors: () => string[]
} {
  const errors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  return {
    getErrors: () => errors,
    getSignificantErrors: () => errors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration') &&
             !e.includes('Failed to fetch')
    )
  }
}

/**
 * Common viewport sizes for responsive tests
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
}

/**
 * Standard test assertions for common patterns
 */
export const assertions = {
  /**
   * Assert page loads without server errors
   */
  async pageLoadsSuccessfully(page: Page, url: string) {
    const response = await page.goto(url)
    expect(response?.status()).toBeLessThan(500)
  },

  /**
   * Assert page has lang attribute
   */
  async hasLangAttribute(page: Page) {
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  },

  /**
   * Assert page has one h1 element
   */
  async hasSingleH1(page: Page) {
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  },

  /**
   * Assert page has no horizontal overflow on current viewport
   */
  async noHorizontalOverflow(page: Page) {
    const hasOverflow = await checkNoHorizontalOverflow(page)
    expect(hasOverflow).toBe(true)
  },

  /**
   * Assert page has focusable elements (keyboard accessibility)
   */
  async hasFocusableElements(page: Page) {
    const count = await getFocusableElementCount(page)
    expect(count).toBeGreaterThan(0)
  },

  /**
   * Assert page DOM is reasonably sized
   */
  async reasonableDOMSize(page: Page, maxSize = 5000) {
    const size = await getDOMSize(page)
    expect(size).toBeLessThan(maxSize)
  },

  /**
   * Assert no XSS vulnerability with URL parameter
   */
  async noXSSInUrl(page: Page, baseUrl: string, param = 'ref') {
    const xss = setupXSSDetection(page)
    await page.goto(`${baseUrl}?${param}=<script>alert(1)</script>`)
    await page.waitForTimeout(500)
    expect(xss.wasTriggered()).toBe(false)
  }
}

/**
 * Navigation helpers for finding dynamic content
 */
export const navigation = {
  /**
   * Find a user link from trending or discover page
   */
  async findUserLink(page: Page): Promise<string | null> {
    await page.goto('/trending')
    await waitForPageReady(page)

    const userLink = page.locator('a[href^="/u/"]').first()
    if (await userLink.count() > 0) {
      return await userLink.getAttribute('href')
    }
    return null
  },

  /**
   * Find an album link from trending or discover page
   */
  async findAlbumLink(page: Page): Promise<string | null> {
    await page.goto('/trending')
    await waitForPageReady(page)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      return await albumLink.getAttribute('href')
    }
    return null
  },

  /**
   * Find a review link from trending or reviews page
   */
  async findReviewLink(page: Page): Promise<string | null> {
    await page.goto('/reviews')
    await waitForPageReady(page)

    const reviewLink = page.locator('a[href^="/review/"]').first()
    if (await reviewLink.count() > 0) {
      return await reviewLink.getAttribute('href')
    }
    return null
  },

  /**
   * Find a list link from lists browse page
   */
  async findListLink(page: Page): Promise<string | null> {
    await page.goto('/lists')
    await waitForPageReady(page)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      return await listLink.getAttribute('href')
    }
    return null
  }
}
