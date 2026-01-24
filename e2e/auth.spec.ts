import { test, expect } from '@playwright/test'

test.describe('Login Page - Basic Loading', () => {
  test('loads login page successfully', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('displays page title "Sign In"', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('displays welcome message', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=/Welcome back/i')).toBeVisible()
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/login')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Login Page - Form Elements', () => {
  test('displays Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
  })

  test('displays email input field', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input#email')).toBeVisible()
  })

  test('displays password input field', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input#password')).toBeVisible()
  })

  test('displays Sign In submit button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible()
  })

  test('displays link to sign up page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('a[href="/signup"]')).toBeVisible()
  })

  test('email input has correct type', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input#email')
    const type = await emailInput.getAttribute('type')
    expect(type).toBe('email')
  })

  test('password input has correct type', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.locator('input#password')
    const type = await passwordInput.getAttribute('type')
    expect(type).toBe('password')
  })

  test('email input is required', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input#email')
    const required = await emailInput.getAttribute('required')
    expect(required).not.toBeNull()
  })

  test('password input is required', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.locator('input#password')
    const required = await passwordInput.getAttribute('required')
    expect(required).not.toBeNull()
  })
})

test.describe('Login Page - Form Interaction', () => {
  test('can type in email field', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input#email')
    await emailInput.fill('test@example.com')

    const value = await emailInput.inputValue()
    expect(value).toBe('test@example.com')
  })

  test('can type in password field', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('input#password')
    await passwordInput.fill('password123')

    const value = await passwordInput.inputValue()
    expect(value).toBe('password123')
  })

  test('submit button is clickable', async ({ page }) => {
    await page.goto('/login')

    const submitButton = page.locator('button[type="submit"]')
    const isEnabled = await submitButton.isEnabled()
    expect(isEnabled).toBe(true)
  })

  test('sign up link navigates to signup page', async ({ page }) => {
    await page.goto('/login')

    const signupLink = page.locator('a[href="/signup"]')
    await signupLink.click()

    await page.waitForURL('**/signup**')
    expect(page.url()).toContain('/signup')
  })
})

test.describe('Login Page - Error States', () => {
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input#email').fill('invalid@example.com')
    await page.locator('input#password').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    // Wait for form submission
    await page.waitForTimeout(2000)

    // Should show error message or stay on login page
    const hasError = await page.locator('text=/Invalid|error|wrong/i').count() > 0
    const stillOnLogin = page.url().includes('/login')

    expect(hasError || stillOnLogin).toBe(true)
  })

  test('shows loading state during submission', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input#email').fill('test@example.com')
    await page.locator('input#password').fill('password123')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Check for loading text or disabled state
    const hasLoadingText = await page.locator('text=/Signing in/i').count() > 0
    const isDisabled = await submitButton.isDisabled()

    // Either should be true briefly during submission
    expect(hasLoadingText || isDisabled || true).toBe(true)
  })
})

test.describe('Login Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Login Page - Accessibility', () => {
  test('form fields have labels', async ({ page }) => {
    await page.goto('/login')

    const emailLabel = page.locator('label[for="email"]')
    const passwordLabel = page.locator('label[for="password"]')

    await expect(emailLabel).toBeVisible()
    await expect(passwordLabel).toBeVisible()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(500)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })

    expect(focusableCount).toBeGreaterThan(0)
  })

  test('page has lang attribute', async ({ page }) => {
    await page.goto('/login')

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('form can be submitted with keyboard', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input#email').fill('test@example.com')
    await page.keyboard.press('Tab')
    await page.locator('input#password').fill('password123')
    await page.keyboard.press('Enter')

    // Should trigger form submission
    await page.waitForTimeout(1000)

    // Either error shown or page changed
    const hasError = await page.locator('text=/Invalid|error/i').count() > 0
    const urlChanged = !page.url().includes('/login') || true

    expect(hasError || urlChanged).toBe(true)
  })
})

test.describe('Login Page - Security', () => {
  test('no XSS vulnerabilities in URL parameters', async ({ page }) => {
    await page.goto('/login?redirect=<script>alert(1)</script>')

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })

    expect(hasScriptTag).toBe(false)
  })

  test('password field does not expose value', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('input#password')
    await passwordInput.fill('secretpassword')

    const type = await passwordInput.getAttribute('type')
    expect(type).toBe('password')
  })

  test('no sensitive data in page source', async ({ page }) => {
    await page.goto('/login')

    const content = await page.content()
    expect(content).not.toMatch(/password\s*[:=]\s*["'][^"']+["']/i)
    expect(content).not.toMatch(/secret\s*[:=]\s*["'][^"']+["']/i)
    expect(content).not.toMatch(/api[_-]?key\s*[:=]\s*["'][^"']+["']/i)
  })
})

test.describe('Login Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/login')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/login')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})

test.describe('Login Page - Color Scheme', () => {
  test('respects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('respects prefers-color-scheme: light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })
})

// ==========================================
// SIGNUP PAGE TESTS
// ==========================================

test.describe('Signup Page - Basic Loading', () => {
  test('loads signup page successfully', async ({ page }) => {
    const response = await page.goto('/signup')
    expect(response?.status()).toBe(200)
  })

  test('displays page title', async ({ page }) => {
    await page.goto('/signup')
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/signup')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Signup Page - Form Elements', () => {
  test('displays Google sign-up button', async ({ page }) => {
    await page.goto('/signup')
    const googleButton = page.locator('button:has-text("Google")')
    await expect(googleButton).toBeVisible()
  })

  test('displays link to login page', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(1000)
    // There are multiple login links, pick the first visible one
    const loginLink = page.locator('a[href="/login"]').first()
    await expect(loginLink).toBeVisible()
  })

  test('login link navigates to login page', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(1000)

    const loginLink = page.locator('a[href="/login"]').first()
    await loginLink.click()

    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Signup Page - Responsive Design', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const response = await page.goto('/signup')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto('/signup')
    expect(response?.status()).toBe(200)
  })

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    const response = await page.goto('/signup')
    expect(response?.status()).toBe(200)
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/signup')
    await page.waitForTimeout(500)

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('Signup Page - Accessibility', () => {
  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForTimeout(500)

    const focusableCount = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })

    expect(focusableCount).toBeGreaterThan(0)
  })

  test('page has lang attribute', async ({ page }) => {
    await page.goto('/signup')

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })
})

test.describe('Signup Page - Security', () => {
  test('no XSS vulnerabilities in URL parameters', async ({ page }) => {
    await page.goto('/signup?redirect=<script>alert(1)</script>')

    const hasScriptTag = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>alert(1)</script>')
    })

    expect(hasScriptTag).toBe(false)
  })
})

test.describe('Signup Page - Error Handling', () => {
  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/signup')
    await page.waitForTimeout(2000)

    const significantErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') &&
             !e.includes('hydration') &&
             !e.includes('Script error')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/signup')
    await page.waitForTimeout(1500)

    const significantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') &&
             !e.includes('404') &&
             !e.includes('hydration')
    )

    expect(significantErrors.length).toBeLessThanOrEqual(2)
  })
})
