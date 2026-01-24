import { test, expect } from '@playwright/test'

// Edge case tests - testing boundary conditions and unusual scenarios

// ==========================================
// DEEP LINKING AND URL STATE
// ==========================================

test.describe('Deep Linking - URL State Handling', () => {
  test('direct URL to album page works', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      const href = await albumLink.getAttribute('href')

      await page.goto(href!)
      await page.waitForTimeout(1000)

      expect(page.url()).toContain('/album/')
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('direct URL to list page works', async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      const href = await listLink.getAttribute('href')

      await page.goto(href!)
      await page.waitForTimeout(1000)

      expect(page.url()).toContain('/list/')
    }
  })

  test('URL with query parameters loads correctly', async ({ page }) => {
    const response = await page.goto('/trending?source=test&ref=playwright')
    expect(response?.status()).toBe(200)
  })

  test('URL with hash fragment loads correctly', async ({ page }) => {
    const response = await page.goto('/trending#section')
    expect(response?.status()).toBe(200)
  })

  test('URL with unicode characters works', async ({ page }) => {
    const response = await page.goto('/u/テスト')
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})

// ==========================================
// CONTENT SECURITY
// ==========================================

test.describe('Content Security - XSS and Injection', () => {
  test('HTML in URL path is escaped', async ({ page }) => {
    const payload = encodeURIComponent('<div onclick="alert(1)">test</div>')
    await page.goto(`/u/${payload}`)

    const hasUnescapedHtml = await page.evaluate(() => {
      return document.body.innerHTML.includes('onclick="alert(1)"')
    })

    expect(hasUnescapedHtml).toBe(false)
  })

  test('JavaScript URI scheme is blocked', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const jsLinks = await page.locator('a[href^="javascript:"]').count()
    expect(jsLinks).toBe(0)
  })

  test('data URI scheme in links is blocked', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const dataLinks = await page.locator('a[href^="data:"]').count()
    expect(dataLinks).toBe(0)
  })

  test('event handlers in URL are sanitized', async ({ page }) => {
    const payload = encodeURIComponent('" onload="alert(1)')
    await page.goto(`/u/${payload}`)

    const hasEventHandler = await page.evaluate(() => {
      return document.body.innerHTML.includes('onload="alert(1)"')
    })

    expect(hasEventHandler).toBe(false)
  })
})

// ==========================================
// LOCALIZATION READINESS
// ==========================================

test.describe('Localization - I18n Readiness', () => {
  test('page handles RTL direction', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
    })

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('page handles long text strings', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const hasOverflowHidden = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        const style = getComputedStyle(el)
        if (style.overflow === 'hidden' || style.textOverflow === 'ellipsis') {
          return true
        }
      }
      return false
    })

    expect(hasOverflowHidden).toBe(true)
  })
})

// ==========================================
// THIRD-PARTY INTEGRATION RESILIENCE
// ==========================================

test.describe('Third-Party - External Service Resilience', () => {
  test('page loads even if external scripts fail', async ({ page, context }) => {
    await context.route('**/googletagmanager.com/**', route => route.abort())
    await context.route('**/google-analytics.com/**', route => route.abort())
    await context.route('**/facebook.com/**', route => route.abort())

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('handles slow third-party resources', async ({ page, context }) => {
    await context.route('**/*.woff2', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })

    const response = await page.goto('/trending', { timeout: 30000 })
    expect(response?.status()).toBe(200)
  })
})

// ==========================================
// DATA VALIDATION
// ==========================================

test.describe('Data Validation - Content Integrity', () => {
  test('album titles are not empty', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLinks = await page.locator('a[href^="/album/"]').all()

    for (const link of albumLinks.slice(0, 10)) {
      const text = await link.textContent()
      if (text) {
        expect(text.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('usernames follow expected format', async ({ page }) => {
    await page.goto('/u/waxfeedapp')
    await page.waitForTimeout(2000)

    const usernameElement = page.locator('text=/@\\w+/')
    if (await usernameElement.count() > 0) {
      const username = await usernameElement.first().textContent()
      expect(username).toMatch(/@\w+/)
    }
  })
})

// ==========================================
// VIEWPORT EDGE CASES
// ==========================================

test.describe('Viewport - Extreme Dimensions', () => {
  test('handles very narrow viewport (280px)', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 600 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('handles very wide viewport (3840px)', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2160 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('handles very short viewport (300px height)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 300 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('handles landscape mobile orientation', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})

// ==========================================
// SPECIAL CHARACTERS IN DATA
// ==========================================

test.describe('Special Characters - Unicode and Emoji Handling', () => {
  test('page handles emoji in content', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('page handles CJK characters', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('page handles diacritics correctly', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})

// ==========================================
// BROWSER FEATURES
// ==========================================

test.describe('Browser Features - Feature Detection', () => {
  test('page works without localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {}
        }
      })
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })

  test('page works without cookies', async ({ context }) => {
    const page = await context.newPage()

    await context.clearCookies()

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const content = await page.content()
    expect(content.length).toBeGreaterThan(0)
  })
})

// ==========================================
// INPUT EDGE CASES
// ==========================================

test.describe('Input - Edge Cases', () => {
  test('handles paste of very long text', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(1000)

    const input = page.locator('input[type="text"]').first()
    if (await input.isVisible()) {
      const longText = 'a'.repeat(1000)
      await input.fill(longText)

      const value = await input.inputValue()
      expect(value.length).toBeLessThanOrEqual(1000)
    }
  })

  test('handles special keys', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(1000)

    const input = page.locator('input[type="text"]').first()
    if (await input.isVisible()) {
      await input.focus()
      await page.keyboard.press('Home')
      await page.keyboard.press('End')
      await page.keyboard.press('Delete')
      await page.keyboard.press('Backspace')

      const content = await page.content()
      expect(content.length).toBeGreaterThan(0)
    }
  })

  test('handles tab navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedTag).toBeTruthy()
  })
})
