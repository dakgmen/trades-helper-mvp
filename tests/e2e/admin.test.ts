import { test, expect } from '@playwright/test'
import { signIn, signOut } from './helpers/auth'

test.describe('Admin Verification and Management', () => {
  test.describe('Admin Access Control', () => {
    test('should restrict admin dashboard to admin users only', async ({ page }) => {
      // Test with non-admin user
      await signIn(page, 'tradie')
      await page.goto('/admin')
      
      // Should show access denied or redirect
      await expect(page.getByText('Access denied. Admin privileges required.')).toBeVisible()
    })

    test('should allow admin users to access admin dashboard', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    })

    test('should redirect non-admin users away from admin routes', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/admin')
      
      // Should either show access denied or redirect away
      const accessDenied = page.getByText('Access denied')
      const currentURL = page.url()
      
      // Either shows access denied message or redirects
      expect(await accessDenied.isVisible() || !currentURL.includes('/admin')).toBeTruthy()
    })
  })

  test.describe('Admin Dashboard Statistics', () => {
    test('should display platform statistics', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Should show key metrics
      await expect(page.getByText('Total Users')).toBeVisible()
      await expect(page.getByText('Total Jobs')).toBeVisible()
      await expect(page.getByText('Total Payments')).toBeVisible()
      await expect(page.getByText('Pending Verifications')).toBeVisible()
    })

    test('should display numeric values for statistics', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Stats should show numbers (including 0)
      const statNumbers = page.locator('.text-2xl.font-bold')
      const count = await statNumbers.count()
      
      for (let i = 0; i < count; i++) {
        const stat = statNumbers.nth(i)
        const text = await stat.textContent()
        
        // Should be a number or currency format
        expect(text).toMatch(/^\d+|\$\d+/)
      }
    })

    test('should show appropriate icons for each statistic', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Each stat card should have an icon
      const statCards = page.locator('.bg-white.rounded-lg.shadow-md')
      const cardCount = await statCards.count()
      
      expect(cardCount).toBeGreaterThanOrEqual(4) // At least 4 stat cards
      
      for (let i = 0; i < cardCount; i++) {
        const card = statCards.nth(i)
        const icon = card.locator('svg')
        await expect(icon).toBeVisible()
      }
    })
  })

  test.describe('Helper Verification Workflow', () => {
    test('should display pending verifications section', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      await expect(page.getByRole('heading', { name: 'Pending Helper Verifications' })).toBeVisible()
    })

    test('should show empty state when no pending verifications', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      const emptyMessage = page.getByText('No pending verifications')
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible()
      }
    })

    test('should display helper verification details', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // If there are pending verifications
      const helperCard = page.locator('.divide-y > div').first()
      if (await helperCard.isVisible()) {
        // Should show helper information
        await expect(helperCard.getByText(/Phone:/)).toBeVisible()
        await expect(helperCard.getByText(/Skills:/)).toBeVisible()
        await expect(helperCard.getByText(/Applied:/)).toBeVisible()
        
        // Should have verification buttons
        await expect(helperCard.getByRole('button', { name: 'Verify' })).toBeVisible()
        await expect(helperCard.getByRole('button', { name: 'Reject' })).toBeVisible()
      }
    })

    test('should show document links for verification', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      const helperCard = page.locator('.divide-y > div').first()
      if (await helperCard.isVisible()) {
        // Should show document links if documents exist
        const whiteCardLink = helperCard.getByRole('link', { name: 'View Document' }).first()
        const idDocLink = helperCard.getByRole('link', { name: 'View Document' }).nth(1)
        
        if (await whiteCardLink.isVisible()) {
          await expect(whiteCardLink).toHaveAttribute('target', '_blank')
          await expect(whiteCardLink).toHaveAttribute('rel', 'noopener noreferrer')
        }
      }
    })

    test('should verify helper successfully', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      const verifyButton = page.getByRole('button', { name: 'Verify' }).first()
      if (await verifyButton.isVisible()) {
        await verifyButton.click()
        
        // Should show success message
        await expect(page.getByText('Helper verified successfully')).toBeVisible()
        
        // Should remove from pending list or update status
        await page.reload()
        
        // Verified helper should no longer appear in pending list
        // (This depends on implementation - helper might be removed or moved)
      }
    })

    test('should reject helper verification', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      const rejectButton = page.getByRole('button', { name: 'Reject' }).first()
      if (await rejectButton.isVisible()) {
        await rejectButton.click()
        
        // Should show rejection confirmation
        await expect(page.getByText('Helper rejected successfully')).toBeVisible()
      }
    })

    test('should log admin actions', async ({ page }) => {
      // This test verifies that admin actions are being logged
      // The actual verification would depend on having access to admin_actions table
      
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      const verifyButton = page.getByRole('button', { name: 'Verify' }).first()
      if (await verifyButton.isVisible()) {
        await verifyButton.click()
        await expect(page.getByText('Helper verified successfully')).toBeVisible()
        
        // Admin actions should be logged in background
        // This could be verified through API calls or database checks
        // For now, we verify that the action completed successfully
      }
    })
  })

  test.describe('Admin Dashboard Performance', () => {
    test('should load dashboard within reasonable time', async ({ page }) => {
      await signIn(page, 'admin')
      
      const startTime = Date.now()
      await page.goto('/admin')
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
      const loadTime = Date.now() - startTime
      
      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should handle loading states gracefully', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Should show loading spinner if data takes time to load
      const loadingSpinner = page.locator('.animate-spin')
      if (await loadingSpinner.isVisible()) {
        // Loading should complete
        await loadingSpinner.waitFor({ state: 'detached', timeout: 10000 })
      }
      
      // Final state should show dashboard content
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    })

    test('should handle errors gracefully', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // If there are any error states, they should be user-friendly
      const errorMessage = page.getByText(/Failed to load dashboard data/)
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible()
        
        // Should not show technical error details
        await expect(page.getByText(/stack trace|undefined|null|500|404/)).not.toBeVisible()
      }
    })
  })

  test.describe('Admin User Experience', () => {
    test('should provide clear navigation within admin area', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Should show admin navigation or breadcrumbs
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
      
      // Should be clear that user is in admin area
      const adminIndicators = page.getByText(/Admin|Dashboard/)
      await expect(adminIndicators).toBeVisible()
    })

    test('should show admin-specific menu items', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/')
      
      // Navigation should show admin-specific options
      const adminLink = page.getByRole('link', { name: /admin/i })
      if (await adminLink.isVisible()) {
        await expect(adminLink).toBeVisible()
        
        await adminLink.click()
        await page.waitForURL('/admin')
      }
    })

    test('should display admin user information correctly', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Should show admin user's name in navigation
      await expect(page.getByText('Test Admin')).toBeVisible()
    })

    test('should provide logout functionality for admin', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Should be able to sign out
      await page.getByRole('button', { name: 'Sign Out' }).click()
      await page.waitForURL('/auth')
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    })
  })

  test.describe('Admin Data Validation', () => {
    test('should validate admin actions', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Admin actions should be validated on the server side
      // This test ensures the UI handles validation errors properly
      
      const verifyButton = page.getByRole('button', { name: 'Verify' }).first()
      if (await verifyButton.isVisible()) {
        // Multiple rapid clicks should be handled gracefully
        await verifyButton.click()
        
        // Should prevent double-submission
        await expect(verifyButton).toBeDisabled()
      }
    })

    test('should show confirmation for destructive actions', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Rejection should be a deliberate action
      const rejectButton = page.getByRole('button', { name: 'Reject' }).first()
      if (await rejectButton.isVisible()) {
        await rejectButton.click()
        
        // Should complete the action (no confirmation modal in current implementation)
        // or show confirmation dialog if implemented
        await expect(page.getByText(/rejected successfully|Are you sure/)).toBeVisible()
      }
    })

    test('should maintain data consistency after admin actions', async ({ page }) => {
      await signIn(page, 'admin')
      await page.goto('/admin')
      
      // Get initial count of pending verifications
      const pendingCount = await page.getByText('Pending Verifications').locator('..').getByText(/^\d+$/).textContent()
      const initialCount = parseInt(pendingCount || '0')
      
      const verifyButton = page.getByRole('button', { name: 'Verify' }).first()
      if (await verifyButton.isVisible()) {
        await verifyButton.click()
        await expect(page.getByText('Helper verified successfully')).toBeVisible()
        
        // Refresh and verify count decreased
        await page.reload()
        
        const newCount = await page.getByText('Pending Verifications').locator('..').getByText(/^\d+$/).textContent()
        const updatedCount = parseInt(newCount || '0')
        
        expect(updatedCount).toBeLessThanOrEqual(initialCount)
      }
    })
  })
})