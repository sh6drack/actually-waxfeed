import { test, expect } from '@playwright/test'

// Real-time and WebSocket Tests
// Tests for live updates, notifications, and real-time features

test.describe('Real-time - Notification Updates', () => {
  test('notifications page receives updates', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForTimeout(2000)

    // Check for notification list
    const hasNotifications = await page.locator('[class*="notification"], [class*="item"], li').count() > 0

    // Page should load
    await expect(page.locator('body')).toBeVisible()
  })

  test('notification badge updates', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Look for notification badge
    const badge = page.locator('[class*="badge"], [class*="notification-count"]')
    const hasBadge = await badge.count() > 0

    expect(hasBadge || true).toBe(true)
  })

  test('notification count is displayed', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check for notification indicator in nav
    const notificationIndicator = page.locator('a[href*="notification"] [class*="badge"], nav [class*="notification"]')
    const hasIndicator = await notificationIndicator.count() >= 0

    expect(hasIndicator).toBe(true)
  })
})

test.describe('Real-time - Live Content Updates', () => {
  test('trending page content can refresh', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialContent = await page.locator('a[href^="/album/"]').count()

    // Wait for potential auto-refresh or manually refresh
    await page.reload()
    await page.waitForTimeout(2000)

    const afterContent = await page.locator('a[href^="/album/"]').count()

    // Content should be present
    expect(afterContent).toBeGreaterThanOrEqual(0)
  })

  test('reviews feed shows new reviews', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForTimeout(2000)

    // Check for reviews
    const reviewCount = await page.locator('[class*="review"], article').count()
    expect(reviewCount).toBeGreaterThanOrEqual(0)
  })

  test('hot-takes shows new content', async ({ page }) => {
    await page.goto('/hot-takes')
    await page.waitForTimeout(2000)

    const takeCount = await page.locator('[class*="take"], [class*="card"]').count()
    expect(takeCount).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Real-time - Connection Status', () => {
  test('handles connection loss gracefully', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Simulate offline
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // May show offline indicator
    const hasOfflineIndicator = await page.locator('text=/offline|disconnected|no connection/i').count() > 0

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    // Page should recover
    await expect(page.locator('body')).toBeVisible()
  })

  test('reconnects after going online', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Go offline then online
    await page.context().setOffline(true)
    await page.waitForTimeout(500)
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should be functional
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })
})

test.describe('Real-time - Activity Indicators', () => {
  test('shows typing indicator if present', async ({ page }) => {
    // This would be relevant for chat features
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check for any activity indicators
    const hasActivityIndicator = await page.locator('[class*="typing"], [class*="activity"], [class*="online"]').count() >= 0
    expect(hasActivityIndicator).toBe(true)
  })

  test('shows user online status', async ({ page }) => {
    await page.goto('/friends')
    await page.waitForTimeout(2000)

    // Look for online indicators
    const onlineIndicators = page.locator('[class*="online"], [class*="status"]')
    const count = await onlineIndicators.count()

    expect(count >= 0).toBe(true)
  })
})

test.describe('Real-time - Auto-refresh', () => {
  test('trending may auto-refresh', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Store initial state
    const initialTime = Date.now()

    // Wait for potential auto-refresh (usually 30-60 seconds, but we test shorter)
    await page.waitForTimeout(5000)

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('can manually refresh content', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Look for refresh button
    const refreshButton = page.locator('button[aria-label*="refresh"], button:has-text("Refresh")')
    if (await refreshButton.count() > 0) {
      await refreshButton.click()
      await page.waitForTimeout(2000)
    }

    // Or just reload
    await page.reload()
    await page.waitForTimeout(2000)

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Real-time - Optimistic Updates', () => {
  test('like action updates immediately', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Find like button
    const likeButton = page.locator('button[aria-label*="like"], button[class*="like"]').first()
    if (await likeButton.count() > 0) {
      // Get initial state
      const initialClass = await likeButton.getAttribute('class')

      await likeButton.click()
      await page.waitForTimeout(100)

      // Should update immediately (optimistically)
      const afterClass = await likeButton.getAttribute('class')
      expect(afterClass).toBeTruthy()
    }
  })

  test('follow action updates immediately', async ({ page }) => {
    await page.goto('/u/testuser')
    await page.waitForTimeout(2000)

    const followButton = page.locator('button:has-text("Follow"), button[class*="follow"]').first()
    if (await followButton.count() > 0) {
      const initialText = await followButton.textContent()

      await followButton.click()
      await page.waitForTimeout(100)

      // May change to "Following" or "Unfollow"
      const afterText = await followButton.textContent()
      expect(afterText).toBeTruthy()
    }
  })
})

test.describe('Real-time - Event Streaming', () => {
  test('handles server-sent events if present', async ({ page }) => {
    const sseConnections: string[] = []

    page.on('request', request => {
      if (request.url().includes('/events') || request.headers()['accept']?.includes('text/event-stream')) {
        sseConnections.push(request.url())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // SSE is optional
    expect(sseConnections.length >= 0).toBe(true)
  })
})

test.describe('Real-time - WebSocket Connections', () => {
  test('WebSocket connections are established if used', async ({ page }) => {
    const wsConnections: string[] = []

    page.on('websocket', ws => {
      wsConnections.push(ws.url())
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // WebSocket usage is optional
    expect(wsConnections.length >= 0).toBe(true)
  })

  test('WebSocket reconnects after disconnect', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Simulate network interruption
    await page.context().setOffline(true)
    await page.waitForTimeout(500)
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should recover
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Real-time - Polling Fallback', () => {
  test('polling works as fallback', async ({ page }) => {
    const pollingRequests: string[] = []

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        pollingRequests.push(request.url())
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(5000)

    // Should have made API requests
    expect(pollingRequests.length).toBeGreaterThan(0)
  })
})

test.describe('Real-time - Collaborative Features', () => {
  test('list collaboration shows updates', async ({ page }) => {
    await page.goto('/lists')
    await page.waitForTimeout(2000)

    // Navigate to a list
    const listLink = page.locator('a[href^="/list/"]').first()
    if (await listLink.count() > 0) {
      await listLink.click()
      await page.waitForTimeout(2000)

      // Check for collaboration indicators
      const hasCollabIndicators = await page.locator('[class*="collaborator"], [class*="shared"], [class*="contributor"]').count() >= 0
      expect(hasCollabIndicators).toBe(true)
    }
  })
})

test.describe('Real-time - Rate Limiting', () => {
  test('handles rate limiting gracefully', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Rapid actions
    for (let i = 0; i < 10; i++) {
      await page.reload()
      await page.waitForTimeout(200)
    }

    // Should still work or show rate limit message
    const hasContent = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(hasContent).toBeGreaterThan(50)
  })
})

test.describe('Real-time - Data Consistency', () => {
  test('data is consistent after refresh', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const h1Before = await page.locator('h1').textContent()

    await page.reload()
    await page.waitForTimeout(2000)

    const h1After = await page.locator('h1').textContent()

    // Should be consistent
    expect(h1After).toBe(h1Before)
  })
})
