import { test, expect } from '@playwright/test'

test('debug application loading', async ({ page }) => {
  test.setTimeout(30000)
  
  console.log('Navigating to application...')
  await page.goto('/')
  
  console.log('Waiting for page to load...')
  await page.waitForLoadState('domcontentloaded')
  
  console.log('Getting page title...')
  const title = await page.title()
  console.log('Page title:', title)
  
  console.log('Getting page content...')
  const bodyText = await page.locator('body').textContent()
  console.log('Body content (first 200 chars):', bodyText?.substring(0, 200))
  
  console.log('Checking for specific elements...')
  const rootDiv = await page.locator('#root').isVisible()
  console.log('Root div visible:', rootDiv)
  
  if (rootDiv) {
    const rootContent = await page.locator('#root').textContent()
    console.log('Root content (first 200 chars):', rootContent?.substring(0, 200))
  }
  
  // Check console errors
  console.log('Checking for JavaScript errors...')
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  // Wait a moment for any async content
  await page.waitForTimeout(2000)
  
  if (errors.length > 0) {
    console.log('JavaScript errors found:', errors)
  } else {
    console.log('No JavaScript errors found')
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true })
  console.log('Screenshot saved as debug-screenshot.png')
})