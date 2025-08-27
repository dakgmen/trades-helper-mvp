import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

test.describe('Profile Management', () => {
  test('should complete tradie profile', async ({ page }) => {
    // Create new tradie account
    await page.goto('/auth')
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    const email = `tradie-profile-${Date.now()}@test.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/^I am a/).selectOption('tradie')
    await page.getByLabel('Password', { exact: true }).fill('testpassword123')
    await page.getByLabel('Confirm Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show profile completion form
    await expect(page.getByRole('heading', { name: 'Complete Your Profile' })).toBeVisible()
    
    // Fill profile form
    await page.getByLabel('Full Name *').fill('John Tradie')
    await page.getByLabel('Phone Number *').fill('+61412345678')
    await page.getByLabel('Bio').fill('Experienced contractor with 10 years in construction')
    await page.getByRole('button', { name: 'Save Profile' }).click()
    
    // Should redirect to dashboard
    await expect(page.getByText('Welcome back, John Tradie!')).toBeVisible()
    await expect(page.getByText('Manage your jobs and find reliable helpers')).toBeVisible()
  })

  test('should complete helper profile with skills', async ({ page }) => {
    // Create new helper account
    await page.goto('/auth')
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    const email = `helper-profile-${Date.now()}@test.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/^I am a/).selectOption('helper')
    await page.getByLabel('Password', { exact: true }).fill('testpassword123')
    await page.getByLabel('Confirm Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Fill helper profile with skills
    await page.getByLabel('Full Name *').fill('Jane Helper')
    await page.getByLabel('Phone Number *').fill('+61423456789')
    await page.getByLabel('Bio').fill('Reliable helper with experience in site cleanup and material handling')
    
    // Select skills
    await page.getByRole('checkbox', { name: /site prep/ }).check()
    await page.getByRole('checkbox', { name: /material handling/ }).check()
    await page.getByRole('checkbox', { name: /cleaning/ }).check()
    
    await page.getByRole('button', { name: 'Save Profile' }).click()
    
    // Should redirect to dashboard
    await expect(page.getByText('Welcome back, Jane Helper!')).toBeVisible()
    await expect(page.getByText('Find jobs that match your skills')).toBeVisible()
  })

  test('should validate required profile fields', async ({ page }) => {
    await signIn(page, 'tradie')
    
    // Go to profile page (if not already on profile completion)
    if (!await page.getByRole('heading', { name: 'Complete Your Profile' }).isVisible()) {
      await page.goto('/profile')
    }
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Save Profile' }).click()
    
    // Should show HTML5 validation for required fields
    await expect(page.getByLabel('Full Name *')).toHaveAttribute('required')
    await expect(page.getByLabel('Phone Number *')).toHaveAttribute('required')
  })

  test('should update existing profile', async ({ page }) => {
    await signIn(page, 'tradie')
    
    // Navigate to profile page
    await page.goto('/profile')
    
    // Update profile information
    await page.getByLabel('Full Name *').fill('Updated Tradie Name')
    await page.getByLabel('Bio').fill('Updated bio with more experience details')
    await page.getByRole('button', { name: 'Save Profile' }).click()
    
    // Should show success (reload page to verify changes persist)
    await page.reload()
    await expect(page.getByDisplayValue('Updated Tradie Name')).toBeVisible()
    await expect(page.getByDisplayValue('Updated bio with more experience details')).toBeVisible()
  })

  test('should show different fields for tradie vs helper', async ({ page }) => {
    // Test tradie profile (no skills section)
    await signIn(page, 'tradie')
    await page.goto('/profile')
    
    await expect(page.getByLabel('Full Name *')).toBeVisible()
    await expect(page.getByLabel('Phone Number *')).toBeVisible()
    await expect(page.getByLabel('Bio')).toBeVisible()
    
    // Should not show skills for tradie
    await expect(page.getByText('Skills')).not.toBeVisible()
    
    await signOut(page)
    
    // Test helper profile (with skills section)
    await signIn(page, 'helper')
    await page.goto('/profile')
    
    await expect(page.getByLabel('Full Name *')).toBeVisible()
    await expect(page.getByLabel('Phone Number *')).toBeVisible()
    await expect(page.getByLabel('Bio')).toBeVisible()
    
    // Should show skills for helper
    await expect(page.getByText('Skills')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /site prep/ })).toBeVisible()
  })

  test('should validate phone number format', async ({ page }) => {
    await signIn(page, 'tradie')
    await page.goto('/profile')
    
    // Test invalid phone number
    await page.getByLabel('Phone Number *').fill('invalid-phone')
    await page.getByLabel('Full Name *').fill('Test Name')
    await page.getByRole('button', { name: 'Save Profile' }).click()
    
    // Should maintain tel input type validation
    await expect(page.getByLabel('Phone Number *')).toHaveAttribute('type', 'tel')
  })

  test('should persist skill selections for helpers', async ({ page }) => {
    await signIn(page, 'helper')
    await page.goto('/profile')
    
    // Select some skills
    await page.getByRole('checkbox', { name: /demolition/ }).check()
    await page.getByRole('checkbox', { name: /painting prep/ }).check()
    
    await page.getByRole('button', { name: 'Save Profile' }).click()
    
    // Reload and verify selections persist
    await page.reload()
    await expect(page.getByRole('checkbox', { name: /demolition/ })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: /painting prep/ })).toBeChecked()
  })
})