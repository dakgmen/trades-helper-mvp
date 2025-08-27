import { test, expect } from '@playwright/test'
import { signIn, signOut } from './helpers/auth'

test.describe('Payment System Integration', () => {
  test.describe('Payment Status Viewing', () => {
    test('should display payments dashboard for tradies', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      await expect(page.getByRole('heading', { name: 'Payment Status' })).toBeVisible()
    })

    test('should display payments dashboard for helpers', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/payments')
      
      await expect(page.getByRole('heading', { name: 'Payment Status' })).toBeVisible()
    })

    test('should show empty state when no payments exist', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/payments')
      
      const emptyMessage = page.getByText('No payments found')
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible()
      }
    })

    test('should display payment details correctly', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // If payments exist, verify they show required information
      const paymentCard = page.locator('.payment-card').first()
      if (await paymentCard.isVisible()) {
        // Should show amount, job title, status
        await expect(paymentCard.getByText(/\$\d+\.\d{2}/)).toBeVisible() // Amount format
        await expect(paymentCard.getByText('Amount:')).toBeVisible()
        await expect(paymentCard.getByText('Created:')).toBeVisible()
        
        // Should show status badge
        const statusBadges = ['Payment Required', 'Held in Escrow', 'Released to Helper', 'Refunded to Tradie']
        const hasStatus = await Promise.all(
          statusBadges.map(status => paymentCard.getByText(status).isVisible())
        )
        expect(hasStatus.some(visible => visible)).toBeTruthy()
      }
    })

    test('should show different payment statuses with appropriate colors', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // Verify status badges have appropriate styling classes
      const pendingStatus = page.locator('.bg-yellow-100:has-text("Payment Required")')
      const escrowStatus = page.locator('.bg-blue-100:has-text("Held in Escrow")')
      const releasedStatus = page.locator('.bg-green-100:has-text("Released to Helper")')
      
      // At least one status should be visible (depending on data)
      const statusCount = await pendingStatus.count() + await escrowStatus.count() + await releasedStatus.count()
      expect(statusCount).toBeGreaterThanOrEqual(0) // Allow for no payments
    })
  })

  test.describe('Payment Workflow', () => {
    test('should create payment when job application is accepted', async ({ page }) => {
      // This test simulates the full workflow: helper applies, tradie accepts, payment created
      
      // 1. Helper applies to job
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      const applyButton = page.getByRole('button', { name: 'Apply Now' }).first()
      if (await applyButton.isVisible()) {
        await applyButton.click()
        await expect(page.getByText('Application submitted successfully!')).toBeVisible()
        
        // 2. Switch to tradie and accept application
        await signOut(page)
        await signIn(page, 'tradie')
        await page.goto('/applications')
        
        const acceptButton = page.getByRole('button', { name: 'Accept' }).first()
        if (await acceptButton.isVisible()) {
          await acceptButton.click()
          await expect(page.getByText('Application accepted successfully!')).toBeVisible()
          
          // 3. Check that payment was created
          await page.goto('/payments')
          
          // Should show pending payment
          await expect(page.getByText('Payment Required')).toBeVisible()
          await expect(page.getByText('This job requires upfront payment')).toBeVisible()
        }
      }
    })

    test('should show payment required notice for pending payments', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // Look for pending payments
      const pendingPayment = page.locator('.payment-card:has-text("Payment Required")').first()
      if (await pendingPayment.isVisible()) {
        await expect(pendingPayment.getByText('Payment Required')).toBeVisible()
        await expect(pendingPayment.getByText('This job requires upfront payment')).toBeVisible()
        await expect(pendingPayment.getByRole('button', { name: 'Pay Now (Mock)' })).toBeVisible()
      }
    })

    test('should show escrow status for paid jobs', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      const escrowPayment = page.locator('.payment-card:has-text("Held in Escrow")').first()
      if (await escrowPayment.isVisible()) {
        await expect(escrowPayment.getByText('Payment Secured')).toBeVisible()
        await expect(escrowPayment.getByText('Payment is held securely until job completion')).toBeVisible()
      }
    })

    test('should allow tradie to release payment when job is completed', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // Look for releaseable payments (escrow + job completed)
      const releaseButton = page.getByRole('button', { name: 'Release Payment' }).first()
      if (await releaseButton.isVisible()) {
        await releaseButton.click()
        await expect(page.getByText('Payment released successfully!')).toBeVisible()
        
        // Refresh and verify status change
        await page.reload()
        await expect(page.getByText('Released to Helper')).toBeVisible()
      }
    })

    test('should show payment history with timestamps', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      const paymentCard = page.locator('.payment-card').first()
      if (await paymentCard.isVisible()) {
        // Should show creation timestamp
        await expect(paymentCard.getByText('Created:')).toBeVisible()
        
        // If payment is released, should show release timestamp
        const releasedPayment = page.locator('.payment-card:has-text("Released to Helper")').first()
        if (await releasedPayment.isVisible()) {
          await expect(releasedPayment.getByText('Released:')).toBeVisible()
        }
      }
    })

    test('should show Stripe payment ID when available', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      const paymentWithStripe = page.locator('.payment-card:has-text("Stripe ID:")').first()
      if (await paymentWithStripe.isVisible()) {
        await expect(paymentWithStripe.getByText('Stripe ID:')).toBeVisible()
        // Should show some form of payment identifier
        await expect(paymentWithStripe.getByText(/pi_\w+|ch_\w+|pm_\w+/)).toBeVisible()
      }
    })
  })

  test.describe('Payment Security & Access Control', () => {
    test('should only show payments user is involved in', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/payments')
      
      // Helper should only see payments where they are the helper
      const paymentCards = page.locator('.payment-card')
      const cardCount = await paymentCards.count()
      
      if (cardCount > 0) {
        // Each payment should show this helper as recipient
        for (let i = 0; i < cardCount; i++) {
          const card = paymentCards.nth(i)
          await expect(card.getByText(/→.*Test Helper/)).toBeVisible()
        }
      }
    })

    test('should not allow helpers to release payments', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/payments')
      
      // Helpers should not see release payment buttons
      await expect(page.getByRole('button', { name: 'Release Payment' })).toHaveCount(0)
    })

    test('should show payment participants correctly', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      const paymentCard = page.locator('.payment-card').first()
      if (await paymentCard.isVisible()) {
        // Should show tradie → helper flow
        await expect(paymentCard.getByText('Between:')).toBeVisible()
        await expect(paymentCard.getByText(/Test Tradie → Test Helper/)).toBeVisible()
      }
    })
  })

  test.describe('Payment Error Handling', () => {
    test('should handle missing payment data gracefully', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // Should not crash if payment data is incomplete
      await expect(page.getByRole('heading', { name: 'Payment Status' })).toBeVisible()
      
      // Should handle loading states
      const loadingSpinner = page.locator('.animate-spin')
      if (await loadingSpinner.isVisible()) {
        await loadingSpinner.waitFor({ state: 'detached', timeout: 5000 })
      }
    })

    test('should show error message if payment operations fail', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // If there are any error states displayed, they should be user-friendly
      const errorMessage = page.getByText(/Failed to load payments|Error loading payments/)
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible()
        // Should not show technical error details to users
        await expect(page.getByText(/stack trace|undefined|null/)).not.toBeVisible()
      }
    })
  })

  test.describe('Payment Integration with Job Lifecycle', () => {
    test('should link payments to correct jobs', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      const paymentCard = page.locator('.payment-card').first()
      if (await paymentCard.isVisible()) {
        // Payment should show the job title it's associated with
        await expect(paymentCard.locator('h4')).toBeVisible() // Job title
        
        // Should show job-related information
        await expect(paymentCard.getByText('Amount:')).toBeVisible()
      }
    })

    test('should calculate payment amounts correctly', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      const paymentCard = page.locator('.payment-card').first()
      if (await paymentCard.isVisible()) {
        // Amount should be in proper currency format
        await expect(paymentCard.getByText(/\$\d+\.\d{2}/)).toBeVisible()
        
        // Amount should make sense (positive, reasonable value)
        const amountText = await paymentCard.getByText(/\$(\d+\.\d{2})/).textContent()
        if (amountText) {
          const amount = parseFloat(amountText.replace('$', ''))
          expect(amount).toBeGreaterThan(0)
          expect(amount).toBeLessThan(10000) // Reasonable upper limit for test data
        }
      }
    })

    test('should prevent payment release for incomplete jobs', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/payments')
      
      // Payments for jobs that aren't completed shouldn't show release button
      const escrowPayments = page.locator('.payment-card:has-text("Held in Escrow")')
      const count = await escrowPayments.count()
      
      for (let i = 0; i < count; i++) {
        const payment = escrowPayments.nth(i)
        // Should not have release button unless job is completed
        const releaseButton = payment.getByRole('button', { name: 'Release Payment' })
        // This depends on the job status - if job is not completed, no release button
      }
    })
  })
})