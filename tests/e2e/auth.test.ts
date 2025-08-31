import { test, expect } from '@playwright/test'
import { signIn, signOut, signUp } from './helpers/auth'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from auth page
    await page.goto('/auth')
  })

  test('should display login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should switch between login and signup forms', async ({ page }) => {
    // Switch to signup
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible()
    await expect(page.getByLabel(/^I am a/)).toBeVisible()
    
    // Switch back to login
    await page.getByRole('button', { name: 'Already have an account? Sign in' }).click()
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  })

  test('should validate login form', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // HTML5 validation should prevent submission
    await expect(page.getByLabel('Email')).toHaveAttribute('required')
    await expect(page.getByLabel('Password')).toHaveAttribute('required')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for error message with extended timeout
    await expect(page.getByText(/Invalid login credentials|Invalid email or password/i)).toBeVisible({ timeout: 30000 })
  })

  test('should login tradie successfully', async ({ page }) => {
    await signIn(page, 'tradie')
    
    // Check dashboard content for tradie
    await expect(page.getByText('Manage your jobs and find reliable helpers')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Post New Job' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View Applications' })).toBeVisible()
  })

  test('should login helper successfully', async ({ page }) => {
    await signIn(page, 'helper')
    
    // Check dashboard content for helper
    await expect(page.getByText('Find jobs that match your skills')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    await signIn(page, 'tradie')
    await signOut(page)
    
    // Should be back at login page
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  })

  test('should validate signup form', async ({ page }) => {
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    // Test password mismatch
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm Password').fill('differentpassword')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('should validate password length', async ({ page }) => {
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('123')
    await page.getByLabel('Confirm Password').fill('123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Password must be at least 6 characters long')).toBeVisible()
  })

  test('should create helper account and redirect to profile', async ({ page }) => {
    const newUser = {
      email: `helper-${Date.now()}@test.com`,
      password: 'testpassword123',
      role: 'helper' as const
    }

    await signUp(page, newUser)
    await expect(page.getByRole('heading', { name: 'Complete Your Profile' })).toBeVisible()
  })

  test('should create tradie account and redirect to profile', async ({ page }) => {
    const newUser = {
      email: `tradie-${Date.now()}@test.com`,
      password: 'testpassword123',
      role: 'tradie' as const
    }

    await signUp(page, newUser)
    await expect(page.getByRole('heading', { name: 'Complete Your Profile' })).toBeVisible()
  })

  test('should redirect unauthenticated users to auth page', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/auth', { timeout: 30000 })
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 15000 })
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    await signIn(page, 'tradie')
    
    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' })
    
    // Should still be authenticated - check for role-specific content
    await expect(page.getByText('Manage your jobs and find reliable helpers')).toBeVisible({ timeout: 30000 })
  })
})