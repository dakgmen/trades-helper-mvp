import { test, expect } from '@playwright/test'

test.describe('Server Connection', () => {
  test('should connect to development server', async ({ page }) => {
    // Set a shorter timeout for this test
    test.setTimeout(15000)
    
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 })
      
      // Check if page loaded successfully
      const title = await page.title()
      console.log('Page title:', title)
      
      // Should have some content
      const bodyText = await page.locator('body').textContent()
      expect(bodyText?.length).toBeGreaterThan(0)
      
    } catch (error) {
      console.log('Connection test failed:', error)
      throw error
    }
  })
  
  test('should load static assets', async ({ page }) => {
    test.setTimeout(10000)
    
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })
})