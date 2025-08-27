import { test, expect } from '@playwright/test'

test('inspect login form elements and text', async ({ page }) => {
  test.setTimeout(30000)
  
  await page.goto('/auth')
  await page.waitForLoadState('domcontentloaded')
  
  console.log('=== INSPECTING LOGIN FORM ===')
  
  // Get all text content from the page
  const allText = await page.locator('body').allTextContents()
  console.log('All page text:', allText)
  
  // Look for specific form elements
  const buttons = await page.locator('button').allTextContents()
  console.log('All buttons:', buttons)
  
  const links = await page.locator('a').allTextContents()
  console.log('All links:', links)
  
  // Look for clickable text elements
  const clickableTexts = await page.locator('text="Create account", text="Sign up", text="Don\'t have an account", text="Register"').all()
  console.log('Found clickable text elements:', clickableTexts.length)
  
  for (let i = 0; i < clickableTexts.length; i++) {
    const text = await clickableTexts[i].textContent()
    const tagName = await clickableTexts[i].evaluate(el => el.tagName)
    console.log(`Element ${i}: "${text}" (${tagName})`)
  }
  
  // Look for spans, divs with relevant text
  const spans = await page.locator('span').allTextContents()
  console.log('All spans:', spans)
  
  const paragraphs = await page.locator('p').allTextContents()  
  console.log('All paragraphs:', paragraphs)
  
  // Take a screenshot to see the form
  await page.screenshot({ path: 'form-inspection.png', fullPage: true })
  console.log('Screenshot saved as form-inspection.png')
})