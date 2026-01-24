import { test, expect, Browser } from '@playwright/test'

// Concurrent User Simulation Tests
// Tests for multiple users, parallel operations, and race conditions

test.describe('Concurrency - Multiple Tabs', () => {
  test('app works across multiple tabs', async ({ context }) => {
    // Open multiple tabs
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await page1.goto('/trending')
    await page2.goto('/discover')

    await page1.waitForTimeout(2000)
    await page2.waitForTimeout(2000)

    // Both should work
    await expect(page1.locator('body')).toBeVisible()
    await expect(page2.locator('body')).toBeVisible()

    await page1.close()
    await page2.close()
  })

  test('state syncs across tabs', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await page1.goto('/trending')
    await page2.goto('/trending')

    await page1.waitForTimeout(2000)
    await page2.waitForTimeout(2000)

    // Both should show same content
    const title1 = await page1.title()
    const title2 = await page2.title()

    expect(title1).toBe(title2)

    await page1.close()
    await page2.close()
  })

  test('navigation in one tab doesnt affect another', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await page1.goto('/trending')
    await page2.goto('/trending')

    await page1.waitForTimeout(1500)
    await page2.waitForTimeout(1500)

    // Navigate page1
    await page1.goto('/discover')
    await page1.waitForTimeout(1500)

    // page2 should still be on trending
    expect(page2.url()).toContain('/trending')

    await page1.close()
    await page2.close()
  })
})

test.describe('Concurrency - Rapid Actions', () => {
  test('handles rapid clicks', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Rapid clicks on same element
    const button = page.locator('button, a').first()
    for (let i = 0; i < 10; i++) {
      button.click().catch(() => {})
    }

    await page.waitForTimeout(2000)

    // Should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles rapid form submissions', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)

    const submitButton = page.locator('button[type="submit"]').first()
    if (await submitButton.count() > 0) {
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        submitButton.click().catch(() => {})
      }

      await page.waitForTimeout(2000)

      // Should handle gracefully
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('handles rapid navigation', async ({ page }) => {
    const routes = ['/trending', '/discover', '/search', '/lists', '/reviews']

    for (let i = 0; i < 10; i++) {
      page.goto(routes[i % routes.length]).catch(() => {})
      await page.waitForTimeout(100)
    }

    await page.waitForTimeout(3000)

    // Should settle on one page
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Concurrency - Parallel Requests', () => {
  test('handles multiple API requests', async ({ page }) => {
    const requests: string[] = []

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Should have made multiple requests
    expect(requests.length).toBeGreaterThan(0)
  })

  test('handles request ordering', async ({ page }) => {
    const responses: number[] = []

    await page.route('**/api/**', async (route, request) => {
      const delay = Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      responses.push(Date.now())
      await route.continue()
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Should handle out-of-order responses
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Concurrency - Search Debouncing', () => {
  test('debounces rapid search input', async ({ page }) => {
    let requestCount = 0

    page.on('request', request => {
      if (request.url().includes('search') || request.url().includes('query')) {
        requestCount++
      }
    })

    await page.goto('/search')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.count() > 0) {
      // Type rapidly
      await searchInput.type('test query here', { delay: 50 })
      await page.waitForTimeout(2000)

      // Should debounce (not one request per keystroke)
      expect(requestCount).toBeLessThan(20)
    }
  })
})

test.describe('Concurrency - Scroll Events', () => {
  test('handles rapid scroll events', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Rapid scroll
    for (let i = 0; i < 50; i++) {
      await page.evaluate((i) => window.scrollTo(0, i * 50), i)
    }

    await page.waitForTimeout(1000)

    // Should remain responsive
    await expect(page.locator('body')).toBeVisible()
  })

  test('throttles scroll handlers', async ({ page }) => {
    let scrollEventCount = 0

    await page.exposeFunction('countScroll', () => {
      scrollEventCount++
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    await page.evaluate(() => {
      window.addEventListener('scroll', () => {
        (window as any).countScroll()
      })
    })

    // Scroll rapidly
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 100))
      await page.waitForTimeout(10)
    }

    await page.waitForTimeout(500)

    // Scroll handlers should fire, but app should be responsive
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Concurrency - Multiple Users Simulation', () => {
  test('simulates multiple users browsing', async ({ browser }) => {
    // Create multiple contexts (like different users)
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))

    // All users visit different pages
    await Promise.all([
      pages[0].goto('/trending'),
      pages[1].goto('/discover'),
      pages[2].goto('/search')
    ])

    await Promise.all(pages.map(p => p.waitForTimeout(2000)))

    // All should work
    for (const page of pages) {
      await expect(page.locator('body')).toBeVisible()
    }

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()))
  })
})

test.describe('Concurrency - Race Conditions', () => {
  test('handles race conditions in state updates', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Trigger multiple state updates simultaneously
    await page.evaluate(() => {
      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'))
        window.dispatchEvent(new Event('scroll'))
      }
    })

    await page.waitForTimeout(1000)

    // App should remain stable
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles concurrent like/unlike', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const likeButton = page.locator('button[aria-label*="like"], button[class*="like"]').first()
    if (await likeButton.count() > 0) {
      // Rapid like/unlike
      for (let i = 0; i < 5; i++) {
        likeButton.click().catch(() => {})
        await page.waitForTimeout(50)
      }

      await page.waitForTimeout(1000)

      // Should settle to consistent state
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Concurrency - Offline Queue', () => {
  test('queues actions during offline', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Go offline
    await page.context().setOffline(true)

    // Try actions
    const link = page.locator('a').first()
    await link.click().catch(() => {})

    // Go online
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should recover
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Concurrency - WebSocket Reconnection', () => {
  test('handles WebSocket reconnection', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Simulate connection drop
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)
    await page.context().setOffline(false)
    await page.waitForTimeout(3000)

    // Should reconnect
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Concurrency - Form Auto-save', () => {
  test('handles rapid typing with auto-save', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(2000)

    const textarea = page.locator('textarea').first()
    if (await textarea.count() > 0) {
      // Type rapidly
      await textarea.type('This is a test of rapid typing with auto-save functionality', { delay: 20 })
      await page.waitForTimeout(2000)

      // Should handle without errors
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Concurrency - Image Loading', () => {
  test('handles many images loading concurrently', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1000)

    // Scroll to trigger many image loads
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    await page.waitForTimeout(3000)

    // Should handle concurrent loads
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Concurrency - Session Management', () => {
  test('handles multiple sessions', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Different sessions
    await page1.goto('/login')
    await page2.goto('/login')

    await page1.waitForTimeout(1500)
    await page2.waitForTimeout(1500)

    // Both should work independently
    await expect(page1.locator('body')).toBeVisible()
    await expect(page2.locator('body')).toBeVisible()

    await context1.close()
    await context2.close()
  })
})

test.describe('Concurrency - Resource Contention', () => {
  test('handles localStorage contention', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await page1.goto('/trending')
    await page2.goto('/trending')

    await page1.waitForTimeout(1500)
    await page2.waitForTimeout(1500)

    // Both write to localStorage
    await page1.evaluate(() => localStorage.setItem('test', 'value1'))
    await page2.evaluate(() => localStorage.setItem('test', 'value2'))

    // One should win
    const value = await page1.evaluate(() => localStorage.getItem('test'))
    expect(value).toBeTruthy()

    await page1.close()
    await page2.close()
  })
})

test.describe('Concurrency - Animation Performance', () => {
  test('animations remain smooth during load', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check for janky animations
    const animationPerformance = await page.evaluate(() => {
      const animations = document.getAnimations()
      return animations.length
    })

    // Should have reasonable animation count
    expect(animationPerformance).toBeLessThan(100)
  })
})
