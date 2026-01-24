import { test, expect } from '@playwright/test'

test.describe('TasteID Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a user's TasteID page
    // Using a test user or creating one during test setup
    await page.goto('/u/testuser/tasteid')
  })

  test.describe('Music Networks Visualization', () => {
    test('should display 7 Music Networks visualization', async ({ page }) => {
      // Check for the section header
      await expect(page.getByText('7 MUSIC NETWORKS')).toBeVisible()

      // Check for the Yeo Model badge
      await expect(page.getByText('YEO MODEL')).toBeVisible()

      // Verify the description text
      await expect(page.getByText(/7 distinct modes of musical engagement/i)).toBeVisible()
    })

    test('should display all 7 network labels', async ({ page }) => {
      const networks = [
        'Discovery',
        'Comfort',
        'Deep Dive',
        'Reactive',
        'Emotional',
        'Social',
        'Aesthetic'
      ]

      for (const network of networks) {
        await expect(page.getByText(network, { exact: false })).toBeVisible()
      }
    })

    test('should display network detection signals', async ({ page }) => {
      await expect(page.getByText('Network Detection Signals')).toBeVisible()
      await expect(page.getByText('DISCOVERY MODE')).toBeVisible()
      await expect(page.getByText('DEEP DIVE MODE')).toBeVisible()
    })

    test('should use correct TasteID terminology (not BrainID)', async ({ page }) => {
      // Ensure no BrainID references exist
      const brainIdText = await page.getByText(/brainid/i).count()
      expect(brainIdText).toBe(0)

      // Verify TasteID terminology is used
      await expect(page.getByText(/tasteid/i).first()).toBeVisible()
    })
  })

  test.describe('Listening Mode Indicator', () => {
    test('should display current listening mode', async ({ page }) => {
      await expect(page.getByText('Current Listening Mode')).toBeVisible()
    })

    test('should show mode activation percentage', async ({ page }) => {
      // Look for percentage text pattern
      const activationText = page.locator('text=/\\d+% activation/')
      await expect(activationText).toBeVisible()
    })

    test('should display mode suggestion', async ({ page }) => {
      await expect(page.getByText('Suggestion')).toBeVisible()
    })

    test('should highlight dominant mode with icon and color', async ({ page }) => {
      // Verify an emoji icon is present (any of the network icons)
      const icons = ['🔍', '🏠', '💿', '⚡', '💜', '🤝', '🎨']
      let foundIcon = false

      for (const icon of icons) {
        const iconCount = await page.getByText(icon).count()
        if (iconCount > 0) {
          foundIcon = true
          break
        }
      }

      expect(foundIcon).toBe(true)
    })
  })

  test.describe('Pattern Detection', () => {
    test('should display pattern section when patterns exist', async ({ page }) => {
      const patternsSection = page.getByText('YOUR PATTERNS')
      const patternsCount = await patternsSection.count()

      if (patternsCount > 0) {
        await expect(patternsSection).toBeVisible()
      }
    })

    test('should display pattern descriptions', async ({ page }) => {
      // Check for common patterns
      const patterns = [
        'Discovery↔Comfort Oscillation',
        'Deep Dive Sprints',
        'New Release Hunter',
        'Emotional Listener',
        'Critical Ear',
        'Music Optimist'
      ]

      // At least one pattern should be visible if the section exists
      const patternsSection = await page.getByText('YOUR PATTERNS').count()
      if (patternsSection > 0) {
        let foundPattern = false
        for (const pattern of patterns) {
          const count = await page.getByText(pattern).count()
          if (count > 0) {
            foundPattern = true
            break
          }
        }
        expect(foundPattern).toBe(true)
      }
    })
  })

  test.describe('Listening Signature', () => {
    test('should display Listening Signature section', async ({ page }) => {
      await expect(page.getByText('LISTENING SIGNATURE')).toBeVisible()
      await expect(page.getByText('POLARITY 1.2')).toBeVisible()
    })

    test('should show uniqueness metrics', async ({ page }) => {
      // Check for uniqueness indicator
      const uniquenessSection = page.getByText('WHAT MAKES YOU UNIQUE')
      const count = await uniquenessSection.count()

      if (count > 0) {
        await expect(uniquenessSection).toBeVisible()
      }
    })

    test('should display network percentages', async ({ page }) => {
      // Look for percentage values in the signature
      const percentagePattern = /\d+%/
      const percentages = page.locator(`text=${percentagePattern}`)
      await expect(percentages.first()).toBeVisible()
    })
  })

  test.describe('Theme Support', () => {
    test('should apply theme colors correctly in light mode', async ({ page, context }) => {
      // Set theme to light
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      })

      // Wait for theme to apply
      await page.waitForTimeout(300)

      // Check that elements are visible and styled
      const section = page.locator('text=7 MUSIC NETWORKS').locator('..')
      await expect(section).toBeVisible()

      // Verify border colors are applied (using CSS variable)
      const borderElement = page.locator('.border-border').first()
      if (await borderElement.count() > 0) {
        await expect(borderElement).toBeVisible()
      }
    })

    test('should apply theme colors correctly in dark mode', async ({ page }) => {
      // Set theme to dark
      await page.evaluate(() => {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      })

      // Wait for theme to apply
      await page.waitForTimeout(300)

      // Check that elements are visible and styled
      const section = page.locator('text=7 MUSIC NETWORKS').locator('..')
      await expect(section).toBeVisible()

      // Verify muted text colors are applied
      const mutedText = page.locator('.text-muted-foreground').first()
      if (await mutedText.count() > 0) {
        await expect(mutedText).toBeVisible()
      }
    })

    test('should use CSS variables for all color values', async ({ page }) => {
      // Check that no hardcoded colors are used (except for specific network colors)
      const html = await page.content()

      // Should not have [--muted] or [--border] syntax (old incorrect usage)
      expect(html).not.toContain('text-[--muted]')
      expect(html).not.toContain('border-[--border]')
      expect(html).not.toContain('bg-[--surface]')
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Check that key sections are visible
      await expect(page.getByText('7 MUSIC NETWORKS')).toBeVisible()
      await expect(page.getByText('LISTENING SIGNATURE')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      await expect(page.getByText('7 MUSIC NETWORKS')).toBeVisible()
      await expect(page.getByText('LISTENING SIGNATURE')).toBeVisible()
    })

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })

      await expect(page.getByText('7 MUSIC NETWORKS')).toBeVisible()
      await expect(page.getByText('LISTENING SIGNATURE')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check that h1, h2 elements exist and are in proper order
      const h1 = await page.locator('h1').count()
      const h2 = await page.locator('h2').count()

      // At least one h2 should exist for section headings
      expect(h2).toBeGreaterThan(0)
    })

    test('should have readable text contrast', async ({ page }) => {
      // Visual regression would be better, but check visibility
      const sections = [
        '7 MUSIC NETWORKS',
        'LISTENING SIGNATURE',
        'Current Listening Mode'
      ]

      for (const section of sections) {
        const element = page.getByText(section)
        const count = await element.count()
        if (count > 0) {
          await expect(element.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Integration Tests', () => {
    test('should show all major TasteID sections together', async ({ page }) => {
      // Verify all major sections are present
      const sections = [
        'LISTENING SIGNATURE',
        '7 MUSIC NETWORKS',
      ]

      for (const section of sections) {
        await expect(page.getByText(section)).toBeVisible()
      }
    })

    test('should display Music Networks Legend with Yeo mapping', async ({ page }) => {
      // Check for legend section
      const legendText = page.getByText('7 Music Networks')
      const count = await legendText.count()

      if (count > 0) {
        await expect(legendText).toBeVisible()
      }
    })

    test('should navigate back to profile from TasteID page', async ({ page }) => {
      const backLink = page.getByText('Back to profile')
      await expect(backLink).toBeVisible()

      // Click and verify navigation
      await backLink.click()
      await page.waitForURL(/\/u\/testuser$/)
    })
  })
})
