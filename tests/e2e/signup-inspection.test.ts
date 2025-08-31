import { test } from '@playwright/test'

test('inspect signup form after toggle', async ({ page }) => {
  test.setTimeout(30000)
  
  await page.goto('/auth')
  await page.waitForLoadState('domcontentloaded')
  
  console.log('=== INITIAL LOGIN FORM ===')
  let allText = await page.locator('body').textContent()
  console.log('Initial form text:', allText)
  
  // Click to switch to signup using correct selector
  console.log('=== CLICKING SIGNUP TOGGLE ===')
  await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
  
  // Wait for form to change
  await page.waitForTimeout(1000)
  
  console.log('=== AFTER SIGNUP TOGGLE ===')
  allText = await page.locator('body').textContent()
  console.log('Signup form text:', allText)
  
  // Get all buttons
  const buttons = await page.locator('button').allTextContents()
  console.log('All buttons after toggle:', buttons)
  
  // Look for specific signup form elements
  const hasSignUpButton = await page.getByRole('button', { name: 'Sign Up' }).isVisible()
  console.log('Sign Up button visible:', hasSignUpButton)
  
  const hasFullNameField = await page.getByLabel('Full Name').isVisible()
  console.log('Full Name field visible:', hasFullNameField)
  
  const hasRoleText = await page.getByText('I am a:').isVisible()
  console.log('Role selection visible:', hasRoleText)
  
  // Check for switch back text
  const switchBackElements = await page.locator('text*="Already have an account"').all()
  console.log('Switch back elements found:', switchBackElements.length)
  
  for (let i = 0; i < switchBackElements.length; i++) {
    const text = await switchBackElements[i].textContent()
    const tagName = await switchBackElements[i].evaluate(el => el.tagName)
    console.log(`Switch back element ${i}: "${text}" (${tagName})`)
  }
  
  // Take screenshot
  await page.screenshot({ path: 'signup-form-inspection.png', fullPage: true })
  console.log('Screenshot saved as signup-form-inspection.png')
})