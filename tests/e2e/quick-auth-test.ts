import { test, expect } from '@playwright/test'

// Quick test without global setup
test('quick auth form check', async ({ page }) => {
  test.setTimeout(60000)
  
  console.log('Starting quick auth test...')
  
  try {
    await page.goto('http://localhost:3001/auth', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })
    
    console.log('Page loaded, checking for TradieHelper heading...')
    await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible({ timeout: 15000 })
    console.log('✓ TradieHelper heading found')
    
    console.log('Checking for login form elements...')
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })
    console.log('✓ Sign In heading found')
    
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 5000 })
    console.log('✓ Email field found')
    
    await expect(page.getByLabel('Password')).toBeVisible({ timeout: 5000 })
    console.log('✓ Password field found')
    
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 5000 })
    console.log('✓ Sign In button found')
    
    // Test form toggle
    console.log('Testing form toggle...')
    const signupToggle = page.getByRole('button', { name: "Don't have an account? Sign up" })
    await expect(signupToggle).toBeVisible({ timeout: 5000 })
    console.log('✓ Signup toggle button found')
    
    await signupToggle.click()
    console.log('Clicked signup toggle, waiting for signup form...')
    
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible({ timeout: 10000 })
    console.log('✓ Sign Up heading found')
    
    await expect(page.getByLabel('I am a')).toBeVisible({ timeout: 5000 })
    console.log('✓ Role selection found')
    
    console.log('Auth form test PASSED')
    
  } catch (error) {
    console.error('Auth test failed:', error.message)
    
    // Debug info
    const pageContent = await page.content()
    console.log('Page HTML length:', pageContent.length)
    
    // Try to get current URL
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)
    
    throw error
  }
})