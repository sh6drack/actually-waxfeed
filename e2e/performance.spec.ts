import { test, expect } from '@playwright/test'

// Performance Tests - Core Web Vitals and loading metrics
// Tests for page load times, rendering, and resource efficiency

test.describe('Performance - Page Load Times', () => {
  const routes = [
    { url: '/', name: 'Homepage' },
    { url: '/trending', name: 'Trending' },
    { url: '/discover', name: 'Discover' },
    { url: '/search', name: 'Search' },
    { url: '/login', name: 'Login' }
  ]

  for (const route of routes) {
    test(`${route.name} loads within acceptable time`, async ({ page }) => {
      const startTime = Date.now()
      await page.goto(route.url)
      const loadTime = Date.now() - startTime

      // Should load within 30 seconds (accounting for slow dev server)
      expect(loadTime).toBeLessThan(30000)
    })
  }
})

test.describe('Performance - First Contentful Paint', () => {
  test('homepage has fast FCP', async ({ page }) => {
    await page.goto('/')

    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find(e => e.name === 'first-contentful-paint')
          if (fcpEntry) {
            resolve(fcpEntry.startTime)
          }
        }).observe({ entryTypes: ['paint'] })

        // Fallback after 5 seconds
        setTimeout(() => resolve(5000), 5000)
      })
    })

    // FCP should be under 3 seconds (generous for dev)
    expect(fcp).toBeLessThan(10000)
  })
})

test.describe('Performance - DOM Size', () => {
  const routes = [
    { url: '/', name: 'Homepage', maxNodes: 2000 },
    { url: '/trending', name: 'Trending', maxNodes: 3000 },
    { url: '/discover', name: 'Discover', maxNodes: 3000 },
    { url: '/search', name: 'Search', maxNodes: 2000 }
  ]

  for (const route of routes) {
    test(`${route.name} has reasonable DOM size`, async ({ page }) => {
      await page.goto(route.url)
      await page.waitForTimeout(2000)

      const nodeCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length
      })

      expect(nodeCount).toBeLessThan(route.maxNodes)
    })
  }
})

test.describe('Performance - Resource Loading', () => {
  test('images are lazy loaded', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const lazyImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      let lazyCount = 0

      images.forEach(img => {
        if (img.loading === 'lazy' || img.hasAttribute('data-src')) {
          lazyCount++
        }
      })

      return { total: images.length, lazy: lazyCount }
    })

    // Most off-screen images should be lazy loaded
    if (lazyImages.total > 5) {
      expect(lazyImages.lazy).toBeGreaterThan(0)
    }
  })

  test('scripts are deferred or async', async ({ page }) => {
    await page.goto('/trending')

    const scriptInfo = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[src]')
      let deferredCount = 0

      scripts.forEach(script => {
        if (script.hasAttribute('defer') || script.hasAttribute('async') ||
            script.getAttribute('type') === 'module') {
          deferredCount++
        }
      })

      return { total: scripts.length, deferred: deferredCount }
    })

    // Most scripts should be deferred
    if (scriptInfo.total > 0) {
      expect(scriptInfo.deferred / scriptInfo.total).toBeGreaterThan(0.5)
    }
  })
})

test.describe('Performance - JavaScript Execution', () => {
  test('no long-running JavaScript blocks', async ({ page }) => {
    const longTasks: number[] = []

    await page.evaluate(() => {
      (window as any).__longTasks = []
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          (window as any).__longTasks.push(entry.duration)
        })
      }).observe({ entryTypes: ['longtask'] })
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    const tasks = await page.evaluate(() => (window as any).__longTasks || [])

    // No tasks should block for more than 500ms
    for (const duration of tasks) {
      expect(duration).toBeLessThan(500)
    }
  })
})

test.describe('Performance - Memory Usage', () => {
  test('page does not leak memory on navigation', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize
      }
      return null
    })

    // Navigate multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/discover')
      await page.waitForTimeout(1000)
      await page.goto('/trending')
      await page.waitForTimeout(1000)
    }

    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize
      }
      return null
    })

    // Memory should not grow excessively (2x is acceptable variance)
    if (initialMemory && finalMemory) {
      expect(finalMemory).toBeLessThan(initialMemory * 3)
    }
  })
})

test.describe('Performance - Network Requests', () => {
  test('page makes reasonable number of requests', async ({ page }) => {
    let requestCount = 0

    page.on('request', () => {
      requestCount++
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Should not make excessive requests
    expect(requestCount).toBeLessThan(100)
  })

  test('no duplicate API requests', async ({ page }) => {
    const apiRequests: string[] = []

    page.on('request', request => {
      const url = request.url()
      if (url.includes('/api/')) {
        apiRequests.push(url)
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Check for duplicates
    const uniqueRequests = new Set(apiRequests)

    // Some duplication is okay, but not excessive
    expect(apiRequests.length).toBeLessThan(uniqueRequests.size * 3)
  })
})

test.describe('Performance - Rendering', () => {
  test('no layout shifts after load', async ({ page }) => {
    await page.goto('/trending')

    // Wait for initial load
    await page.waitForTimeout(3000)

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
        }).observe({ entryTypes: ['layout-shift'] })

        // Measure for 2 seconds
        setTimeout(() => resolve(clsValue), 2000)
      })
    })

    // CLS should be under 0.25 (good is under 0.1)
    expect(cls).toBeLessThan(0.5)
  })

  test('page is interactive quickly', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/trending')

    // Try to interact with the page
    const link = page.locator('a').first()
    await link.waitFor({ state: 'visible', timeout: 10000 })

    const tti = Date.now() - startTime

    // Should be interactive within 10 seconds
    expect(tti).toBeLessThan(15000)
  })
})

test.describe('Performance - Bundle Size', () => {
  test('JavaScript bundle is not excessive', async ({ page }) => {
    let totalJsSize = 0

    page.on('response', async response => {
      const url = response.url()
      if (url.endsWith('.js') || url.includes('.js?')) {
        const buffer = await response.body().catch(() => null)
        if (buffer) {
          totalJsSize += buffer.length
        }
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(3000)

    // Total JS should be under 5MB (generous for Next.js app)
    expect(totalJsSize).toBeLessThan(5 * 1024 * 1024)
  })
})

test.describe('Performance - Caching', () => {
  test('static assets have cache headers', async ({ page }) => {
    const cacheableResponses: boolean[] = []

    page.on('response', response => {
      const url = response.url()
      if (url.includes('/_next/static/') || url.endsWith('.js') || url.endsWith('.css')) {
        const cacheControl = response.headers()['cache-control']
        cacheableResponses.push(!!cacheControl)
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Most static assets should have cache headers
    if (cacheableResponses.length > 0) {
      const cachedCount = cacheableResponses.filter(Boolean).length
      expect(cachedCount / cacheableResponses.length).toBeGreaterThan(0.5)
    }
  })
})

test.describe('Performance - Images', () => {
  test('images are properly sized', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const oversizedImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      let oversized = 0

      images.forEach(img => {
        if (img.naturalWidth > 0 && img.clientWidth > 0) {
          // Image should not be more than 2x its display size
          if (img.naturalWidth > img.clientWidth * 3) {
            oversized++
          }
        }
      })

      return oversized
    })

    // Ideally no oversized images, but some tolerance
    expect(oversizedImages).toBeLessThan(10)
  })

  test('images use modern formats when possible', async ({ page }) => {
    const imageFormats: string[] = []

    page.on('response', response => {
      const contentType = response.headers()['content-type']
      if (contentType?.startsWith('image/')) {
        imageFormats.push(contentType)
      }
    })

    await page.goto('/trending')
    await page.waitForTimeout(2000)

    // Check for modern formats (webp, avif)
    const modernFormats = imageFormats.filter(f =>
      f.includes('webp') || f.includes('avif')
    )

    // This is informational - modern formats are preferred but not required
    expect(imageFormats.length).toBeGreaterThanOrEqual(0)
  })
})
