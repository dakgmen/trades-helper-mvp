import { test } from '@playwright/test'

test('debug app routing', async ({ page }) => {
  test.setTimeout(30000)
  
  // Set up console logging
  page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`))
  page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`))
  
  console.log('Testing root path...')
  await page.goto('/')
  await page.waitForTimeout(2000)
  
  const rootContent = await page.locator('body').textContent()
  console.log('Root path body content:', rootContent?.substring(0, 100))
  
  console.log('Testing /auth path...')
  await page.goto('/auth')
  await page.waitForTimeout(2000)
  
  const authContent = await page.locator('body').textContent()
  console.log('Auth path body content:', authContent?.substring(0, 100))
  
  // Check if we can find our app elements
  console.log('Looking for TradieHelper elements...')
  const tradieElement = page.getByText('TradieHelper')
  const isVisible = await tradieElement.isVisible()
  console.log('TradieHelper text visible:', isVisible)
  
  if (isVisible) {
    console.log('✓ App is rendering correctly!')
  } else {
    console.log('✗ App is not rendering TradieHelper content')
    
    // Check what's actually in the page
    const allText = await page.locator('body').allTextContents()
    console.log('All page text:', allText)
    
    // Check if React components are loading
    const reactError = await page.locator('text=Error').isVisible()
    console.log('React error visible:', reactError)
  }
})