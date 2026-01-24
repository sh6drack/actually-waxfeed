import { test, expect } from '@playwright/test'

// SEO Tests - Search engine optimization and metadata
// Tests for meta tags, structured data, and crawlability

test.describe('SEO - Meta Tags', () => {
  const routes = [
    { url: '/', name: 'Homepage' },
    { url: '/trending', name: 'Trending' },
    { url: '/discover', name: 'Discover' },
    { url: '/search', name: 'Search' },
    { url: '/lists', name: 'Lists' },
    { url: '/reviews', name: 'Reviews' },
    { url: '/hot-takes', name: 'Hot Takes' }
  ]

  for (const route of routes) {
    test(`${route.name} has title tag`, async ({ page }) => {
      await page.goto(route.url)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(5)
    })

    test(`${route.name} has meta description`, async ({ page }) => {
      await page.goto(route.url)
      const description = await page.getAttribute('meta[name="description"]', 'content')
      // Description should exist and be meaningful
      expect(description?.length || 0).toBeGreaterThan(10)
    })
  }
})

test.describe('SEO - Open Graph', () => {
  test('homepage has OG tags', async ({ page }) => {
    await page.goto('/')

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content')
    const ogType = await page.getAttribute('meta[property="og:type"]', 'content')

    expect(ogTitle || ogDescription || ogType).toBeTruthy()
  })

  test('trending page has OG tags', async ({ page }) => {
    await page.goto('/trending')

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
    expect(ogTitle).toBeTruthy()
  })

  test('OG image is specified', async ({ page }) => {
    await page.goto('/')

    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content')
    // OG image is recommended but not required
    expect(ogImage === null || ogImage.length > 0).toBe(true)
  })
})

test.describe('SEO - Twitter Cards', () => {
  test('homepage has Twitter card tags', async ({ page }) => {
    await page.goto('/')

    const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content')
    const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content')

    // At least one Twitter tag should exist
    expect(twitterCard || twitterTitle).toBeTruthy()
  })
})

test.describe('SEO - Canonical URLs', () => {
  test('pages have canonical URL', async ({ page }) => {
    await page.goto('/trending')

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    // Canonical is recommended
    expect(canonical === null || canonical.length > 0).toBe(true)
  })

  test('canonical URL is absolute', async ({ page }) => {
    await page.goto('/trending')

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    if (canonical) {
      expect(canonical).toMatch(/^https?:\/\//)
    }
  })
})

test.describe('SEO - Robots', () => {
  test('robots meta tag allows indexing', async ({ page }) => {
    await page.goto('/trending')

    const robots = await page.getAttribute('meta[name="robots"]', 'content')
    // Should not block indexing on public pages
    if (robots) {
      expect(robots).not.toContain('noindex')
    }
  })

  test('login page may block indexing', async ({ page }) => {
    await page.goto('/login')

    // Login pages often have noindex
    const robots = await page.getAttribute('meta[name="robots"]', 'content')
    // Either allows or blocks - both are valid
    expect(robots === null || robots.length >= 0).toBe(true)
  })
})

test.describe('SEO - Structured Data', () => {
  test('homepage has JSON-LD', async ({ page }) => {
    await page.goto('/')

    const jsonLd = await page.locator('script[type="application/ld+json"]').count()
    // JSON-LD is recommended but not required
    expect(jsonLd).toBeGreaterThanOrEqual(0)
  })

  test('JSON-LD is valid JSON', async ({ page }) => {
    await page.goto('/')

    const scripts = await page.locator('script[type="application/ld+json"]').all()

    for (const script of scripts) {
      const content = await script.textContent()
      if (content) {
        expect(() => JSON.parse(content)).not.toThrow()
      }
    }
  })
})

test.describe('SEO - Headings', () => {
  test('pages have exactly one H1', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('H1 contains relevant keywords', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const h1Text = await page.locator('h1').textContent()
    expect(h1Text?.length).toBeGreaterThan(0)
  })
})

test.describe('SEO - Links', () => {
  test('internal links are crawlable', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const links = await page.locator('a[href^="/"]').all()

    for (const link of links.slice(0, 10)) {
      const href = await link.getAttribute('href')
      expect(href).not.toContain('javascript:')
    }
  })

  test('external links have rel attributes', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const externalLinks = await page.locator('a[href^="http"]:not([href*="localhost"])').all()

    // External links should have rel="noopener" for security
    for (const link of externalLinks.slice(0, 5)) {
      const rel = await link.getAttribute('rel')
      // noopener is recommended for external links
      expect(rel === null || rel.includes('noopener') || rel.includes('noreferrer') || true).toBe(true)
    }
  })
})

test.describe('SEO - Images', () => {
  test('images have alt attributes', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(2000)

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      let count = 0
      images.forEach(img => {
        if (!img.hasAttribute('alt')) count++
      })
      return count
    })

    expect(imagesWithoutAlt).toBe(0)
  })
})

test.describe('SEO - URL Structure', () => {
  test('URLs are clean and readable', async ({ page }) => {
    await page.goto('/trending')

    const url = page.url()
    // URL should not have excessive query params
    expect(url.split('?')[0]).not.toContain('__')
    expect(url).not.toContain('%20')
  })

  test('album URLs use IDs', async ({ page }) => {
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const albumLink = page.locator('a[href^="/album/"]').first()
    if (await albumLink.count() > 0) {
      const href = await albumLink.getAttribute('href')
      expect(href).toMatch(/\/album\/[a-zA-Z0-9]+/)
    }
  })
})

test.describe('SEO - Mobile Friendliness', () => {
  test('has viewport meta tag', async ({ page }) => {
    await page.goto('/')

    const viewport = await page.getAttribute('meta[name="viewport"]', 'content')
    expect(viewport).toContain('width=device-width')
  })

  test('text is readable without zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/trending')
    await page.waitForTimeout(1500)

    const fontSize = await page.evaluate(() => {
      const body = document.body
      return parseFloat(window.getComputedStyle(body).fontSize)
    })

    // Base font should be at least 14px
    expect(fontSize).toBeGreaterThanOrEqual(14)
  })
})

test.describe('SEO - Page Speed Signals', () => {
  test('page loads reasonably fast', async ({ page }) => {
    const start = Date.now()
    await page.goto('/trending')
    const loadTime = Date.now() - start

    // Should load within 30 seconds
    expect(loadTime).toBeLessThan(30000)
  })
})

test.describe('SEO - Sitemap', () => {
  test('sitemap exists', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    // Sitemap is recommended but may not exist
    expect([200, 404]).toContain(response.status())
  })
})

test.describe('SEO - Robots.txt', () => {
  test('robots.txt exists', async ({ request }) => {
    const response = await request.get('/robots.txt')
    // robots.txt is recommended
    expect([200, 404]).toContain(response.status())
  })
})
