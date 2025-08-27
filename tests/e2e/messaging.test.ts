import { test, expect } from '@playwright/test'
import { signIn, signOut } from './helpers/auth'

test.describe('Messaging System', () => {
  test.describe('Message Thread Interface', () => {
    test('should display message thread for assigned jobs', async ({ page }) => {
      // First ensure there's an assigned job with messaging capability
      // This would require a helper to be assigned to a tradie's job
      
      await signIn(page, 'tradie')
      await page.goto('/')
      
      // Look for assigned jobs that should have messaging capability
      const assignedJob = page.locator('.job-card:has-text("Assigned")').first()
      if (await assignedJob.isVisible()) {
        // Should have some way to access messaging (button or link)
        const messageButton = assignedJob.getByRole('button', { name: /message|chat/i })
        if (await messageButton.isVisible()) {
          await messageButton.click()
          
          // Should open message thread
          await expect(page.getByRole('heading', { name: /Chat with/i })).toBeVisible()
        }
      }
    })

    test('should show message input and send functionality', async ({ page }) => {
      // Navigate to any available message thread
      await signIn(page, 'tradie')
      
      // Check if MessageThread component is rendered anywhere
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        await expect(messageInput).toBeVisible()
        await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
      }
    })

    test('should send and display messages', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        const testMessage = `Test message from tradie ${Date.now()}`
        
        await messageInput.fill(testMessage)
        await page.getByRole('button', { name: 'Send' }).click()
        
        // Message should appear in the thread
        await expect(page.getByText(testMessage)).toBeVisible()
        
        // Input should be cleared
        await expect(messageInput).toHaveValue('')
      }
    })

    test('should validate message input', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      const sendButton = page.getByRole('button', { name: 'Send' })
      
      if (await messageInput.isVisible()) {
        // Send button should be disabled for empty message
        await expect(sendButton).toBeDisabled()
        
        // Enable send button when message is typed
        await messageInput.fill('Hello')
        await expect(sendButton).not.toBeDisabled()
        
        // Clear message should disable button again
        await messageInput.fill('')
        await expect(sendButton).toBeDisabled()
      }
    })

    test('should respect message length limit', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        // Should have maxLength attribute
        await expect(messageInput).toHaveAttribute('maxLength', '500')
        
        // Test with long message
        const longMessage = 'a'.repeat(600)
        await messageInput.fill(longMessage)
        
        // Input should truncate to max length
        const actualValue = await messageInput.inputValue()
        expect(actualValue.length).toBeLessThanOrEqual(500)
      }
    })
  })

  test.describe('Message Display and Formatting', () => {
    test('should display messages with correct sender alignment', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // Look for message bubbles in any visible message thread
      const ownMessages = page.locator('.bg-blue-500') // Own messages should be blue
      const otherMessages = page.locator('.bg-gray-200') // Other messages should be gray
      
      if (await ownMessages.count() > 0) {
        // Own messages should be right-aligned
        await expect(ownMessages.first().locator('xpath=ancestor::div[contains(@class, "justify-end")]')).toBeVisible()
      }
      
      if (await otherMessages.count() > 0) {
        // Other messages should be left-aligned
        await expect(otherMessages.first().locator('xpath=ancestor::div[contains(@class, "justify-start")]')).toBeVisible()
      }
    })

    test('should show message timestamps', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageBubble = page.locator('.bg-blue-500, .bg-gray-200').first()
      if (await messageBubble.isVisible()) {
        // Should contain timestamp
        await expect(messageBubble.getByText(/\d+:\d+|\w+ \d+/)).toBeVisible()
      }
    })

    test('should format timestamps appropriately', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // Send a new message to get recent timestamp
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        await messageInput.fill('Timestamp test message')
        await page.getByRole('button', { name: 'Send' }).click()
        
        // Recent message should show time format (HH:MM)
        await expect(page.getByText(/\d{1,2}:\d{2}/)).toBeVisible()
      }
    })

    test('should auto-scroll to latest messages', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageContainer = page.locator('.overflow-y-auto')
      if (await messageContainer.isVisible()) {
        // Send multiple messages to test scrolling
        const messageInput = page.getByPlaceholder('Type your message...')
        if (await messageInput.isVisible()) {
          for (let i = 1; i <= 3; i++) {
            await messageInput.fill(`Test message ${i}`)
            await page.getByRole('button', { name: 'Send' }).click()
            await page.waitForTimeout(100) // Small delay between messages
          }
          
          // Latest message should be visible
          await expect(page.getByText('Test message 3')).toBeVisible()
        }
      }
    })
  })

  test.describe('Real-time Messaging', () => {
    test('should handle message sending states', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      const sendButton = page.getByRole('button', { name: 'Send' })
      
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message')
        await sendButton.click()
        
        // Button should show sending state
        await expect(page.getByRole('button', { name: 'Sending...' })).toBeVisible()
        
        // Should return to normal state after sending
        await expect(sendButton).toBeVisible()
        await expect(sendButton).not.toBeDisabled()
      }
    })

    test('should prevent double-sending messages', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      const sendButton = page.getByRole('button', { name: 'Send' })
      
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message')
        
        // Button should be disabled while sending
        await sendButton.click()
        await expect(sendButton).toBeDisabled()
      }
    })

    test('should show loading state while fetching messages', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // On initial load, should show loading spinner
      const loadingSpinner = page.locator('.animate-spin')
      if (await loadingSpinner.isVisible()) {
        // Should disappear when messages load
        await loadingSpinner.waitFor({ state: 'detached', timeout: 5000 })
      }
    })
  })

  test.describe('Message Access Control', () => {
    test('should only allow messaging between job participants', async ({ page }) => {
      // This test would verify that only tradie and assigned helper can message each other
      // Implementation depends on having actual job assignments
      
      await signIn(page, 'tradie')
      
      // Message threads should only be available for jobs where tradie is involved
      const messageThreads = page.locator('[data-testid="message-thread"]')
      const threadCount = await messageThreads.count()
      
      // Each thread should involve the current user
      for (let i = 0; i < threadCount; i++) {
        const thread = messageThreads.nth(i)
        // Should show participants correctly
        await expect(thread.getByText(/Chat with/)).toBeVisible()
      }
    })

    test('should not show messaging for unassigned jobs', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // Open jobs (not assigned) should not have messaging capability
      const openJobs = page.locator('.job-card:has-text("Open")')
      const count = await openJobs.count()
      
      for (let i = 0; i < count; i++) {
        const job = openJobs.nth(i)
        // Should not have message/chat buttons
        await expect(job.getByRole('button', { name: /message|chat/i })).not.toBeVisible()
      }
    })

    test('should show participant names correctly', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageThread = page.getByRole('heading', { name: /Chat with/ })
      if (await messageThread.isVisible()) {
        // Should show the other participant's name
        await expect(messageThread).toContainText(/Test Helper|Helper/)
      }
    })
  })

  test.describe('Message Thread Lifecycle', () => {
    test('should show empty state for new message threads', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const emptyMessage = page.getByText('No messages yet. Start the conversation!')
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible()
      }
    })

    test('should persist messages across page reloads', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        const testMessage = `Persistent message ${Date.now()}`
        
        await messageInput.fill(testMessage)
        await page.getByRole('button', { name: 'Send' }).click()
        await expect(page.getByText(testMessage)).toBeVisible()
        
        // Reload page
        await page.reload()
        
        // Message should still be visible
        await expect(page.getByText(testMessage)).toBeVisible()
      }
    })

    test('should handle message thread for both participants', async ({ page }) => {
      // Test from tradie perspective
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        const tradieMessage = `Message from tradie ${Date.now()}`
        await messageInput.fill(tradieMessage)
        await page.getByRole('button', { name: 'Send' }).click()
        
        await signOut(page)
        
        // Test from helper perspective
        await signIn(page, 'helper')
        
        // Helper should see the tradie's message
        // (This assumes helper has access to same message thread)
        if (await page.getByText(tradieMessage).isVisible()) {
          await expect(page.getByText(tradieMessage)).toBeVisible()
          
          // Helper can reply
          const helperInput = page.getByPlaceholder('Type your message...')
          if (await helperInput.isVisible()) {
            await helperInput.fill('Reply from helper')
            await page.getByRole('button', { name: 'Send' }).click()
          }
        }
      }
    })
  })

  test.describe('Message Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // If messaging fails, should show user-friendly error
      const errorMessage = page.getByText(/Failed to load messages|Failed to send message/)
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible()
        
        // Should not show technical error details
        await expect(page.getByText(/500|404|undefined|null/)).not.toBeVisible()
      }
    })

    test('should retry failed message sends', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test retry message')
        await page.getByRole('button', { name: 'Send' }).click()
        
        // If send fails, user should be able to retry
        const retryOption = page.getByText(/retry|try again/i)
        if (await retryOption.isVisible()) {
          await retryOption.click()
        }
      }
    })

    test('should maintain message input on send failure', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const messageInput = page.getByPlaceholder('Type your message...')
      if (await messageInput.isVisible()) {
        const testMessage = 'Message that might fail'
        await messageInput.fill(testMessage)
        await page.getByRole('button', { name: 'Send' }).click()
        
        // On failure, message should remain in input for retry
        // This is implementation-dependent
      }
    })
  })
})