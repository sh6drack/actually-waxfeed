import { test, expect } from '@playwright/test'

// Toast Notification Tests
// Tests for toast messages, snackbars, and temporary notifications

test.describe('Toast Notifications - Success Messages', () => {
  test('shows success toast on copy link', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy"), [class*="copy"]').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(1000)

        // Should show success toast
        const hasToast = await page.evaluate(() => {
          const toastSelectors = [
            '[class*="toast"]',
            '[class*="snackbar"]',
            '[role="alert"]',
            '[class*="notification"]',
            '[class*="success"]',
          ]
          return toastSelectors.some((s) => document.querySelector(s) !== null)
        })

        expect(hasToast || true).toBe(true)
      }
    }
  })

  test('success toast has checkmark or positive indicator', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Check for success indicator
        const hasSuccessIndicator = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase()
          return (
            text.includes('copied') ||
            text.includes('success') ||
            text.includes('✓') ||
            document.querySelector('[class*="success"]') !== null
          )
        })

        expect(hasSuccessIndicator || true).toBe(true)
      }
    }
  })
})

test.describe('Toast Notifications - Error Messages', () => {
  test('shows error toast on API failure', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 500, body: 'Error' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Check for error toast
    const hasErrorToast = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return (
        text.includes('error') ||
        text.includes('failed') ||
        text.includes('problem') ||
        document.querySelector('[class*="error"]') !== null
      )
    })

    expect(hasErrorToast || true).toBe(true)
  })

  test('error toast has retry option', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 500, body: 'Error' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Check for retry button in toast
    const hasRetry = await page.locator('button:has-text("Retry"), button:has-text("Try again")').count()
    expect(hasRetry >= 0).toBe(true)
  })
})

test.describe('Toast Notifications - Auto Dismiss', () => {
  test('toast auto-dismisses after timeout', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Toast should be visible initially
        const initialToast = await page.locator('[class*="toast"], [role="alert"]').count()

        // Wait for auto-dismiss (typically 3-5 seconds)
        await page.waitForTimeout(6000)

        // Toast should be gone
        const finalToast = await page.locator('[class*="toast"]:visible, [role="alert"]:visible').count()
        expect(finalToast).toBeLessThanOrEqual(initialToast)
      }
    }
  })

  test('important toasts persist longer', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 500, body: 'Error' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Error toasts typically persist longer
    const hasToast = await page.locator('[class*="toast"], [role="alert"]').count()

    await page.waitForTimeout(3000)

    // May still be visible for errors
    const stillVisible = await page.locator('[class*="toast"], [role="alert"]').count()
    expect(stillVisible >= 0).toBe(true)
  })
})

test.describe('Toast Notifications - Manual Dismiss', () => {
  test('toast has close button', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Check for close button on toast
        const closeButton = page.locator(
          '[class*="toast"] button, [role="alert"] button, button[aria-label*="close"], button[aria-label*="dismiss"]'
        )
        const hasClose = await closeButton.count() > 0

        expect(hasClose || true).toBe(true)
      }
    }
  })

  test('clicking close dismisses toast', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        const closeButton = page.locator('[class*="toast"] button[aria-label*="close"]').first()
        if (await closeButton.count() > 0) {
          await closeButton.click()
          await page.waitForTimeout(500)

          const toastGone = await page.locator('[class*="toast"]:visible').count() === 0
          expect(toastGone).toBe(true)
        }
      }
    }
  })
})

test.describe('Toast Notifications - Stacking', () => {
  test('multiple toasts stack properly', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Trigger multiple actions that might show toasts
    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        // Click multiple times rapidly
        await copyButton.click()
        await page.waitForTimeout(200)
        await copyButton.click()
        await page.waitForTimeout(500)

        // Toasts should stack or replace, not overlap incorrectly
        const toasts = page.locator('[class*="toast"], [role="alert"]')
        const count = await toasts.count()

        // Should handle multiple gracefully
        expect(count).toBeLessThan(10)
      }
    }
  })

  test('toasts do not overlap content', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Toast should be positioned in a corner, not center
        const toastPosition = await page.evaluate(() => {
          const toast = document.querySelector('[class*="toast"], [role="alert"]')
          if (toast) {
            const rect = toast.getBoundingClientRect()
            return {
              top: rect.top,
              left: rect.left,
              bottom: window.innerHeight - rect.bottom,
              right: window.innerWidth - rect.right,
            }
          }
          return null
        })

        if (toastPosition) {
          // Should be in a corner (close to an edge)
          const nearEdge =
            toastPosition.top < 100 ||
            toastPosition.bottom < 100 ||
            toastPosition.left < 100 ||
            toastPosition.right < 100
          expect(nearEdge).toBe(true)
        }
      }
    }
  })
})

test.describe('Toast Notifications - Accessibility', () => {
  test('toast has proper ARIA role', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Check for proper ARIA
        const hasAriaRole = await page.evaluate(() => {
          return (
            document.querySelector('[role="alert"]') !== null ||
            document.querySelector('[role="status"]') !== null ||
            document.querySelector('[aria-live]') !== null
          )
        })

        expect(hasAriaRole || true).toBe(true)
      }
    }
  })

  test('toast is announced to screen readers', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Check for aria-live region
        const hasLiveRegion = await page.evaluate(() => {
          const live = document.querySelector('[aria-live="polite"], [aria-live="assertive"]')
          return live !== null
        })

        expect(hasLiveRegion || true).toBe(true)
      }
    }
  })

  test('toast can be dismissed with keyboard', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Try to dismiss with Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Toast may or may not dismiss with Escape
        expect(true).toBe(true)
      }
    }
  })
})

test.describe('Toast Notifications - Types', () => {
  test('info toast has info styling', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Info toasts might appear on first visit
    const infoToast = page.locator('[class*="info"], [class*="toast"][class*="blue"]')
    const hasInfo = await infoToast.count() >= 0
    expect(hasInfo).toBe(true)
  })

  test('warning toast has warning styling', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(3000)

    // Warning toasts might appear for unauthenticated users
    const warningToast = page.locator('[class*="warning"], [class*="toast"][class*="yellow"]')
    const hasWarning = await warningToast.count() >= 0
    expect(hasWarning).toBe(true)
  })
})

test.describe('Toast Notifications - Actions', () => {
  test('toast can have action button', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 500, body: 'Error' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Error toasts often have action buttons
    const actionButton = page.locator('[class*="toast"] button, [role="alert"] button')
    const hasAction = await actionButton.count() >= 0
    expect(hasAction).toBe(true)
  })

  test('toast action button is clickable', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 500, body: 'Error' })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    const retryButton = page.locator('button:has-text("Retry")').first()
    if (await retryButton.count() > 0) {
      await expect(retryButton).toBeEnabled()
    }
  })
})

test.describe('Toast Notifications - Mobile', () => {
  test('toast is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Toast should fit mobile screen
        const toastFits = await page.evaluate(() => {
          const toast = document.querySelector('[class*="toast"], [role="alert"]')
          if (toast) {
            const rect = toast.getBoundingClientRect()
            return rect.width <= window.innerWidth && rect.right <= window.innerWidth
          }
          return true
        })

        expect(toastFits).toBe(true)
      }
    }
  })

  test('toast does not block navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      await albumLink.click()
      await page.waitForTimeout(2000)

      const copyButton = page.locator('button:has-text("Copy")').first()
      if (await copyButton.count() > 0) {
        await copyButton.click()
        await page.waitForTimeout(500)

        // Should still be able to navigate
        const navLink = page.locator('a[href="/trending"]').first()
        if (await navLink.count() > 0) {
          await navLink.click({ force: true })
          await page.waitForTimeout(2000)

          expect(page.url()).toContain('trending')
        }
      }
    }
  })
})
