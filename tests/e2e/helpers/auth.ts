import { Page, expect } from '@playwright/test'

export const TEST_USERS = {
  tradie: {
    email: 'tradie.test@example.com',
    password: 'testpassword123',
    role: 'tradie' as const,
    name: 'Test Tradie'
  },
  helper: {
    email: 'helper.test@example.com', 
    password: 'testpassword123',
    role: 'helper' as const,
    name: 'Test Helper'
  },
  admin: {
    email: 'admin.test@example.com',
    password: 'testpassword123', 
    role: 'admin' as const,
    name: 'Test Admin'
  }
}

export async function signIn(page: Page, userType: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userType]
  
  await page.goto('/auth')
  await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
  
  // Fill login form
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  
  // Wait for redirect to dashboard with extended timeout
  await page.waitForURL('/', { timeout: 60000 })
  
  // Wait for authentication to complete - look for role-specific content instead of name
  if (userType === 'tradie') {
    await expect(page.getByText('Manage your jobs and find reliable helpers')).toBeVisible({ timeout: 30000 })
  } else {
    await expect(page.getByText('Find jobs that match your skills')).toBeVisible({ timeout: 30000 })
  }
  
  return user
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign Out' }).click()
  await page.waitForURL('/auth', { timeout: 30000 })
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 15000 })
}

export async function signUp(page: Page, userData: {
  email: string
  password: string
  role: 'tradie' | 'helper'
}) {
  await page.goto('/auth')
  
  // Switch to signup form
  await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
  await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible()
  
  // Fill signup form
  await page.getByLabel('Email').fill(userData.email)
  await page.getByLabel(/^I am a/).selectOption(userData.role)
  await page.getByLabel('Password', { exact: true }).fill(userData.password)
  await page.getByLabel('Confirm Password').fill(userData.password)
  await page.getByRole('button', { name: 'Create Account' }).click()
  
  // Wait for signup to complete with extended timeout
  // May redirect to profile completion or dashboard depending on implementation
  await page.waitForURL((url) => url.pathname !== '/auth', { timeout: 60000 })
  
  // Check for either profile completion or successful signup redirect
  try {
    await expect(page.getByRole('heading', { name: 'Complete Your Profile' })).toBeVisible({ timeout: 15000 })
  } catch {
    // If no profile completion page, check for dashboard content
    await expect(page.getByText(userData.role === 'tradie' ? 'Manage your jobs' : 'Find jobs')).toBeVisible({ timeout: 15000 })
  }
}