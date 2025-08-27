import { test, expect } from '@playwright/test'

test.describe('Basic Application Functionality', () => {
  test('should load the application and show landing page', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to auth page or show landing page
    await expect(page).toHaveURL(/\/(auth)?$/)
    
    // Should show application title
    await expect(page.getByText('TradieHelper')).toBeVisible()
  })
  
  test('should load auth page with login form', async ({ page }) => {
    await page.goto('/auth')
    
    // Should show the auth page
    await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
    await expect(page.getByText('Connect tradies with reliable helpers')).toBeVisible()
    
    // Should show login form elements
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
  
  test('should show form validation on empty submission', async ({ page }) => {
    await page.goto('/auth')
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show HTML5 validation or prevent submission
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toBeFocused()
  })
  
  test('should toggle between login and signup forms', async ({ page }) => {
    await page.goto('/auth')
    
    // Should start with login form
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    
    // Click to switch to signup
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    // Should show signup form
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
    await expect(page.getByLabel('I am a')).toBeVisible()
    await expect(page.getByLabel('Confirm Password')).toBeVisible()
    
    // Should be able to switch back
    await page.getByRole('button', { name: 'Already have an account? Sign in' }).click()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
  
  test('should handle responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')
    
    // Should show mobile-optimized layout
    await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    
    // Form should fit in mobile viewport
    const form = page.locator('form')
    if (await form.isVisible()) {
      const formBox = await form.boundingBox()
      expect(formBox?.width).toBeLessThanOrEqual(375)
    }
  })
  
  test('should load required assets and styles', async ({ page }) => {
    await page.goto('/auth')
    
    // Wait for page to load completely
    await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
    
    // Check that CSS is loaded (form should be styled)
    const emailInput = page.getByLabel('Email')
    const styles = await emailInput.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        padding: computed.padding,
        borderRadius: computed.borderRadius,
        borderWidth: computed.borderWidth
      }
    })
    
    // Should have some styling (not default browser styles)
    expect(styles.padding).not.toBe('0px')
  })
})