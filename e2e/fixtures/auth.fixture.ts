import { test as base, expect, Page } from '@playwright/test'

/**
 * Authentication fixtures for WAXFEED E2E tests
 * Provides pre-configured test contexts with different auth states
 */

// Storage state file paths
const AUTHENTICATED_STATE = 'e2e/fixtures/.auth/user.json'
const ADMIN_STATE = 'e2e/fixtures/.auth/admin.json'

/**
 * Mock user data for tests
 */
export const mockUsers = {
  regular: {
    id: 'test-user-1',
    email: 'testuser@example.com',
    username: 'testuser',
    displayName: 'Test User',
  },
  admin: {
    id: 'test-admin-1',
    email: 'admin@example.com',
    username: 'admin',
    displayName: 'Admin User',
    role: 'admin',
  },
}

/**
 * Helper to mock authentication state in the browser
 */
export async function mockAuthState(page: Page, user: typeof mockUsers.regular) {
  await page.addInitScript((userData) => {
    // Mock NextAuth session
    (window as any).__NEXT_DATA__ = {
      ...(window as any).__NEXT_DATA__,
      props: {
        pageProps: {
          session: {
            user: userData,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      },
    }

    // Mock session storage
    sessionStorage.setItem('user', JSON.stringify(userData))
  }, user)
}

/**
 * Helper to clear authentication state
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.clear()
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
  })
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    // Check for session cookie or storage
    const hasSessionCookie = document.cookie.includes('next-auth.session-token')
    const hasSessionStorage = !!sessionStorage.getItem('user')
    return hasSessionCookie || hasSessionStorage
  })
}

/**
 * Helper to wait for auth redirect
 */
export async function waitForAuthRedirect(page: Page, expectedUrl: string, timeout = 5000) {
  await page.waitForURL((url) => url.pathname.includes(expectedUrl), { timeout })
}

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page
  adminPage: Page
  guestPage: Page
}>({
  // Guest page (no authentication)
  guestPage: async ({ page }, use) => {
    await clearAuthState(page)
    await use(page)
  },

  // Authenticated regular user page
  authenticatedPage: async ({ page }, use) => {
    await mockAuthState(page, mockUsers.regular)
    await use(page)
  },

  // Admin user page
  adminPage: async ({ page }, use) => {
    await mockAuthState(page, mockUsers.admin as any)
    await use(page)
  },
})

export { expect }

/**
 * Test data generators
 */
export const testData = {
  /**
   * Generate a random email for signup tests
   */
  randomEmail: () => `test-${Date.now()}@example.com`,

  /**
   * Generate a random username
   */
  randomUsername: () => `testuser_${Date.now()}`,

  /**
   * Valid password for tests
   */
  validPassword: 'TestPassword123!',

  /**
   * Invalid password for tests
   */
  invalidPassword: '123',

  /**
   * Album IDs for testing
   */
  albumIds: {
    valid: 'test-album-id',
    invalid: 'nonexistent-album-id',
  },

  /**
   * User IDs for testing
   */
  userIds: {
    valid: 'test-user-1',
    invalid: 'nonexistent-user-id',
  },
}

/**
 * Common page object helpers
 */
export const pageHelpers = {
  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(page: Page) {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
  },

  /**
   * Get all visible text on the page
   */
  async getPageText(page: Page): Promise<string> {
    return await page.evaluate(() => document.body.innerText || '')
  },

  /**
   * Check if page has specific heading
   */
  async hasHeading(page: Page, text: string): Promise<boolean> {
    const headings = page.locator('h1, h2, h3')
    const count = await headings.filter({ hasText: text }).count()
    return count > 0
  },

  /**
   * Fill login form
   */
  async fillLoginForm(page: Page, email: string, password: string) {
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
  },

  /**
   * Submit login form
   */
  async submitLoginForm(page: Page) {
    await page.click('button[type="submit"]')
  },

  /**
   * Check for error message on page
   */
  async hasErrorMessage(page: Page): Promise<boolean> {
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '[class*="error"]',
      'text=/error/i',
    ]

    for (const selector of errorSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        return true
      }
    }
    return false
  },

  /**
   * Check for success message on page
   */
  async hasSuccessMessage(page: Page): Promise<boolean> {
    const successSelectors = [
      '.success',
      '[class*="success"]',
      'text=/success/i',
    ]

    for (const selector of successSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        return true
      }
    }
    return false
  },
}
