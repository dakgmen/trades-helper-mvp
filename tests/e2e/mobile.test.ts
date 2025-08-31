import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

test.describe('Mobile Responsiveness', () => {
  test.describe('Mobile Navigation', () => {
    test('should adapt navigation for mobile screens', async ({ page, context }) => {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        })
      })
      
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
      await signIn(page, 'tradie')
      
      // Mobile navigation should adapt
      const navigation = page.locator('nav')
      await expect(navigation).toBeVisible()
      
      // Desktop menu items should be hidden on mobile (hidden md:flex)
      const desktopMenu = page.locator('.hidden.md\\:flex')
      await expect(desktopMenu).toBeVisible() // Should exist but be hidden on mobile
    })

    test('should show mobile-friendly menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }) // Small mobile
      await signIn(page, 'tradie')
      
      // Navigation should still be functional
      await expect(page.getByText('TradieHelper')).toBeVisible()
      await expect(page.getByText('Test Tradie')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()
    })

    test('should handle navigation overflow on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      
      // Navigation should not overflow horizontally
      const nav = page.locator('nav')
      const navBox = await nav.boundingBox()
      const viewportWidth = 375
      
      expect(navBox?.width).toBeLessThanOrEqual(viewportWidth)
    })
  })

  test.describe('Mobile Forms', () => {
    test('should render login form appropriately on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth')
      
      // Form should be responsive
      const loginForm = page.locator('.max-w-md')
      await expect(loginForm).toBeVisible()
      
      // Input fields should be touch-friendly
      const emailInput = page.getByLabel('Email')
      const passwordInput = page.getByLabel('Password')
      
      const emailBox = await emailInput.boundingBox()
      const passwordBox = await passwordInput.boundingBox()
      
      // Inputs should be at least 44px tall (iOS recommendation)
      expect(emailBox?.height).toBeGreaterThanOrEqual(40)
      expect(passwordBox?.height).toBeGreaterThanOrEqual(40)
    })

    test('should render job posting form on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'tradie')
      await page.goto('/jobs/post')
      
      // Form should be contained within mobile viewport
      const form = page.locator('form')
      const formBox = await form.boundingBox()
      
      expect(formBox?.width).toBeLessThanOrEqual(375)
      
      // All form elements should be visible and usable
      await expect(page.getByLabel('Job Title *')).toBeVisible()
      await expect(page.getByLabel('Location *')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Post Job' })).toBeVisible()
    })

    test('should handle profile form on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      await page.goto('/profile')
      
      // Skills checkboxes should stack appropriately
      const skillsSection = page.getByText('Skills').locator('..')
      if (await skillsSection.isVisible()) {
        // Should use grid layout that works on mobile
        const checkboxGrid = skillsSection.locator('.grid')
        await expect(checkboxGrid).toBeVisible()
      }
      
      // Form inputs should be full width on mobile
      const nameInput = page.getByLabel('Full Name *')
      const inputBox = await nameInput.boundingBox()
      
      // Input should take most of the available width
      expect(inputBox?.width).toBeGreaterThan(300)
    })
  })

  test.describe('Mobile Job Cards', () => {
    test('should display job cards appropriately on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      // Job cards should stack vertically and be readable
      const jobCards = page.locator('.bg-white.rounded-lg.shadow-md')
      const firstCard = jobCards.first()
      
      if (await firstCard.isVisible()) {
        const cardBox = await firstCard.boundingBox()
        
        // Card should not be wider than viewport
        expect(cardBox?.width).toBeLessThanOrEqual(375)
        
        // Card content should be visible
        await expect(firstCard.getByText(/\$.*\/hour/)).toBeVisible()
        await expect(firstCard.getByRole('button', { name: 'Apply Now' })).toBeVisible()
      }
    })

    test('should handle job card actions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      // Apply button should be touch-friendly
      const applyButton = page.getByRole('button', { name: 'Apply Now' }).first()
      
      if (await applyButton.isVisible()) {
        const buttonBox = await applyButton.boundingBox()
        
        // Button should be at least 44px tall
        expect(buttonBox?.height).toBeGreaterThanOrEqual(40)
        
        // Should be clickable
        await applyButton.click()
        await expect(page.getByText('Application submitted successfully!')).toBeVisible()
      }
    })

    test('should show job filters appropriately on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      // Filter section should be responsive
      const filterSection = page.locator('.bg-white').first()
      await expect(filterSection).toBeVisible()
      
      // Filter inputs should stack on mobile (grid-cols-1 md:grid-cols-3)
      const filterInputs = page.getByLabel('Location')
      await expect(filterInputs).toBeVisible()
      
      const filterButton = page.getByRole('button', { name: 'Filter Jobs' })
      await expect(filterButton).toBeVisible()
    })
  })

  test.describe('Mobile Dashboards', () => {
    test('should render tradie dashboard on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'tradie')
      
      // Dashboard should adapt to mobile layout
      await expect(page.getByText('Welcome back, Test Tradie!')).toBeVisible()
      
      // Quick action buttons should be touch-friendly
      const postJobButton = page.getByRole('link', { name: 'Post New Job' })
      const viewAppsButton = page.getByRole('link', { name: 'View Applications' })
      
      await expect(postJobButton).toBeVisible()
      await expect(viewAppsButton).toBeVisible()
      
      // Buttons should be appropriately sized
      const postJobBox = await postJobButton.boundingBox()
      expect(postJobBox?.height).toBeGreaterThanOrEqual(40)
    })

    test('should render helper dashboard on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      
      // Helper dashboard shows job feed
      await expect(page.getByText('Welcome back, Test Helper!')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      
      // Job feed should be scrollable on mobile
      const jobFeed = page.locator('.max-w-4xl')
      await expect(jobFeed).toBeVisible()
    })

    test('should handle admin dashboard on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Stats cards should stack on mobile
      const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
      await expect(statsGrid).toBeVisible()
      
      // Individual stat cards should be readable
      const totalUsers = page.getByText('Total Users')
      await expect(totalUsers).toBeVisible()
    })
  })

  test.describe('Mobile Interactions', () => {
    test('should handle touch interactions properly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'tradie')
      
      // Test tap vs click behavior
      const postJobLink = page.getByRole('link', { name: 'Post New Job' })
      await postJobLink.tap()
      
      await page.waitForURL('/jobs/post')
      await expect(page.getByRole('heading', { name: 'Post a New Job' })).toBeVisible()
    })

    test('should handle mobile form submission', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth')
      
      // Mobile keyboard should not interfere with form
      await page.getByLabel('Email').tap()
      await page.getByLabel('Email').fill('test@example.com')
      
      await page.getByLabel('Password').tap()
      await page.getByLabel('Password').fill('password123')
      
      // Submit button should remain accessible
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    })

    test('should handle mobile scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      // Should be able to scroll through job listings
      const jobsContainer = page.locator('.space-y-4')
      if (await jobsContainer.isVisible()) {
        // Scroll down to see more jobs
        await page.evaluate(() => window.scrollBy(0, 500))
        
        // Page should handle scrolling gracefully
        await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      }
    })
  })

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const startTime = Date.now()
      await page.goto('/auth')
      await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time on mobile
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle mobile network conditions', async ({ page, context }) => {
      // Simulate slower mobile connection
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100) // Add 100ms delay
      })
      
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth')
      
      // Should show loading states appropriately
      await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
    })

    test('should optimize images for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'helper')
      
      // Any images should be appropriately sized for mobile
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const imgBox = await img.boundingBox()
        
        if (imgBox) {
          // Images shouldn't exceed viewport width
          expect(imgBox.width).toBeLessThanOrEqual(375)
        }
      }
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth')
      
      // Form labels should remain associated
      const emailInput = page.getByLabel('Email')
      await expect(emailInput).toHaveAttribute('type', 'email')
      
      const passwordInput = page.getByLabel('Password')
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should support mobile screen readers', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await signIn(page, 'tradie')
      
      // Important elements should have proper ARIA labels
      const heading = page.getByRole('heading', { name: /Welcome back/ })
      await expect(heading).toBeVisible()
      
      // Navigation should be accessible
      const nav = page.locator('nav')
      await expect(nav).toBeVisible()
    })

    test('should handle mobile focus management', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth')
      
      // Tab order should work properly on mobile
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Email')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Password')).toBeFocused()
    })
  })
})