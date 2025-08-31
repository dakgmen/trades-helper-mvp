import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

test.describe('Performance and Load Tests', () => {
  test.describe('Page Load Performance', () => {
    test('should load landing page within performance budget', async ({ page }) => {
      const startTime = performance.now()
      
      await page.goto('/auth')
      await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
      
      const loadTime = performance.now() - startTime
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000)
      console.log(`Landing page load time: ${loadTime}ms`)
    })

    test('should load dashboard quickly after authentication', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const startTime = performance.now()
      await page.goto('/')
      await expect(page.getByText('Welcome back')).toBeVisible()
      const loadTime = performance.now() - startTime
      
      // Authenticated pages should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
      console.log(`Dashboard load time: ${loadTime}ms`)
    })

    test('should load job feed efficiently', async ({ page }) => {
      await signIn(page, 'helper')
      
      const startTime = performance.now()
      await page.goto('/jobs')
      await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      const loadTime = performance.now() - startTime
      
      // Job feed should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
      console.log(`Job feed load time: ${loadTime}ms`)
    })

    test('should handle navigation performance', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // Measure navigation between different pages
      const navigationTimes: number[] = []
      
      const pages = ['/jobs/post', '/applications', '/payments', '/profile']
      
      for (const targetPage of pages) {
        const startTime = performance.now()
        await page.goto(targetPage)
        
        // Wait for page-specific content to load
        if (targetPage === '/jobs/post') {
          await expect(page.getByRole('heading', { name: 'Post a New Job' })).toBeVisible()
        } else if (targetPage === '/applications') {
          await expect(page.getByRole('heading', { name: 'Job Applications' })).toBeVisible()
        } else if (targetPage === '/payments') {
          await expect(page.getByRole('heading', { name: 'Payment Status' })).toBeVisible()
        } else if (targetPage === '/profile') {
          await expect(page.getByLabel('Full Name')).toBeVisible()
        }
        
        const navTime = performance.now() - startTime
        navigationTimes.push(navTime)
        console.log(`Navigation to ${targetPage}: ${navTime}ms`)
      }
      
      // Average navigation should be under 2 seconds
      const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
      expect(avgNavTime).toBeLessThan(2000)
    })
  })

  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500))
        await route.continue()
      })
      
      const startTime = performance.now()
      await page.goto('/auth')
      await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
      const loadTime = performance.now() - startTime
      
      // Should handle slow network gracefully (within 10 seconds)
      expect(loadTime).toBeLessThan(10000)
      console.log(`Slow network load time: ${loadTime}ms`)
    })

    test('should optimize API calls', async ({ page }) => {
      let apiCallCount = 0
      
      // Monitor API calls
      page.on('request', request => {
        const url = request.url()
        if (url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
          apiCallCount++
          console.log(`API call: ${request.method()} ${url}`)
        }
      })
      
      await signIn(page, 'helper')
      await page.goto('/jobs')
      await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      
      // Should not make excessive API calls
      expect(apiCallCount).toBeLessThan(10)
      console.log(`Total API calls for job feed: ${apiCallCount}`)
    })

    test('should handle concurrent users simulation', async ({ page }) => {
      // Simulate multiple concurrent operations
      const operations = []
      
      // Sign in
      operations.push(signIn(page, 'tradie'))
      
      // Navigate to different pages concurrently (after sign in)
      await operations[0] // Wait for sign in first
      
      operations.push(
        page.goto('/jobs/post'),
        page.goto('/applications'),
        page.goto('/payments')
      )
      
      const startTime = performance.now()
      await Promise.all(operations.slice(1)) // Wait for all navigations
      const concurrentTime = performance.now() - startTime
      
      // Concurrent operations should complete reasonably quickly
      expect(concurrentTime).toBeLessThan(5000)
      console.log(`Concurrent operations time: ${concurrentTime}ms`)
    })
  })

  test.describe('Resource Performance', () => {
    test('should monitor memory usage', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // Measure memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0
      })
      
      // Navigate through multiple pages
      await page.goto('/jobs/post')
      await page.goto('/applications') 
      await page.goto('/payments')
      await page.goto('/')
      
      const finalMemory = await page.evaluate(() => {
        return (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0
      })
      
      const memoryIncrease = finalMemory - initialMemory
      console.log(`Memory usage increased by: ${memoryIncrease} bytes`)
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    test('should handle large job datasets efficiently', async ({ page }) => {
      await signIn(page, 'helper')
      
      const startTime = performance.now()
      await page.goto('/jobs')
      
      // Wait for job feed to load
      await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      
      // Measure time to render job list
      const jobCards = page.locator('.bg-white.rounded-lg.shadow-md')
      const jobCount = await jobCards.count()
      
      const renderTime = performance.now() - startTime
      
      console.log(`Rendered ${jobCount} jobs in ${renderTime}ms`)
      
      // Should handle reasonable dataset sizes efficiently
      if (jobCount > 10) {
        expect(renderTime).toBeLessThan(5000)
      }
    })

    test('should optimize bundle size', async ({ page }) => {
      const resourceSizes: { [key: string]: number } = {}
      
      // Monitor resource loading
      page.on('response', response => {
        const url = response.url()
        const headers = response.headers()
        const contentLength = headers['content-length']
        
        if (contentLength && (url.includes('.js') || url.includes('.css'))) {
          resourceSizes[url] = parseInt(contentLength)
        }
      })
      
      await page.goto('/auth')
      await expect(page.getByRole('heading', { name: 'TradieHelper' })).toBeVisible()
      
      // Calculate total bundle size
      const totalSize = Object.values(resourceSizes).reduce((a, b) => a + b, 0)
      console.log(`Total bundle size: ${totalSize} bytes`)
      console.log('Resource sizes:', resourceSizes)
      
      // Total JS/CSS should be under 2MB
      expect(totalSize).toBeLessThan(2 * 1024 * 1024)
    })
  })

  test.describe('Database Performance', () => {
    test('should handle form submissions efficiently', async ({ page }) => {
      await signIn(page, 'tradie')
      await page.goto('/jobs/post')
      
      // Measure job posting performance
      const startTime = performance.now()
      
      await page.getByLabel('Job Title *').fill('Performance Test Job')
      await page.getByLabel('Location *').fill('Sydney, NSW')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.getByLabel('Date & Time *').fill(tomorrow.toISOString().slice(0, 16))
      
      await page.getByLabel('Duration (hours) *').fill('4')
      await page.getByLabel('Pay Rate ($/hour) *').fill('35')
      
      await page.getByRole('button', { name: 'Post Job' }).click()
      await page.waitForURL('/')
      
      const submissionTime = performance.now() - startTime
      console.log(`Job posting time: ${submissionTime}ms`)
      
      // Form submission should complete within 5 seconds
      expect(submissionTime).toBeLessThan(5000)
    })

    test('should handle search queries efficiently', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      const startTime = performance.now()
      
      // Test filtering
      await page.getByLabel('Location').fill('Sydney')
      await page.getByLabel('Min Pay Rate ($/hour)').fill('30')
      await page.getByRole('button', { name: 'Filter Jobs' }).click()
      
      // Wait for results
      await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      
      const filterTime = performance.now() - startTime
      console.log(`Filter operation time: ${filterTime}ms`)
      
      // Filtering should be fast
      expect(filterTime).toBeLessThan(3000)
    })

    test('should handle authentication efficiently', async ({ page }) => {
      await page.goto('/auth')
      
      const startTime = performance.now()
      
      await page.getByLabel('Email').fill('tradie.test@example.com')
      await page.getByLabel('Password').fill('testpassword123')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      await page.waitForURL('/')
      await expect(page.getByText('Welcome back')).toBeVisible()
      
      const authTime = performance.now() - startTime
      console.log(`Authentication time: ${authTime}ms`)
      
      // Authentication should complete within 3 seconds
      expect(authTime).toBeLessThan(3000)
    })
  })

  test.describe('User Experience Performance', () => {
    test('should provide responsive UI interactions', async ({ page }) => {
      await signIn(page, 'tradie')
      
      // Measure button click responsiveness
      const startTime = performance.now()
      
      await page.getByRole('link', { name: 'Post New Job' }).click()
      await page.waitForURL('/jobs/post')
      await expect(page.getByRole('heading', { name: 'Post a New Job' })).toBeVisible()
      
      const interactionTime = performance.now() - startTime
      console.log(`Button click response time: ${interactionTime}ms`)
      
      // UI should respond within 1 second
      expect(interactionTime).toBeLessThan(1000)
    })

    test('should handle form validation quickly', async ({ page }) => {
      await page.goto('/auth')
      
      const startTime = performance.now()
      
      // Trigger validation
      await page.getByLabel('Email').fill('invalid-email')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // HTML5 validation should be immediate
      const validationTime = performance.now() - startTime
      console.log(`Form validation time: ${validationTime}ms`)
      
      // Validation should be nearly instantaneous
      expect(validationTime).toBeLessThan(500)
    })

    test('should load application lists efficiently', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const startTime = performance.now()
      await page.goto('/applications')
      await expect(page.getByRole('heading', { name: 'Job Applications' })).toBeVisible()
      const loadTime = performance.now() - startTime
      
      console.log(`Applications page load time: ${loadTime}ms`)
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle payment status efficiently', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const startTime = performance.now()
      await page.goto('/payments')
      await expect(page.getByRole('heading', { name: 'Payment Status' })).toBeVisible()
      const loadTime = performance.now() - startTime
      
      console.log(`Payments page load time: ${loadTime}ms`)
      expect(loadTime).toBeLessThan(3000)
    })
  })

  test.describe('Stress Testing', () => {
    test('should handle rapid form submissions', async ({ page }) => {
      await signIn(page, 'helper')
      await page.goto('/jobs')
      
      // Find a job to apply to multiple times (should be prevented)
      const applyButton = page.getByRole('button', { name: 'Apply Now' }).first()
      
      if (await applyButton.isVisible()) {
        const startTime = performance.now()
        
        // Rapid clicks should be handled gracefully
        for (let i = 0; i < 5; i++) {
          await applyButton.click({ timeout: 1000 }).catch(() => {}) // Ignore errors
          await page.waitForTimeout(100)
        }
        
        const stressTime = performance.now() - startTime
        console.log(`Rapid submission handling time: ${stressTime}ms`)
        
        // Should handle rapid submissions without crashing
        expect(stressTime).toBeLessThan(10000)
      }
    })

    test('should handle concurrent navigations', async ({ page }) => {
      await signIn(page, 'tradie')
      
      const startTime = performance.now()
      
      // Rapid navigation changes
      const navigationPromises = [
        page.goto('/jobs/post'),
        page.goto('/applications'),
        page.goto('/payments'),
        page.goto('/')
      ]
      
      // Last navigation should win
      await Promise.allSettled(navigationPromises)
      
      const finalTime = performance.now() - startTime
      console.log(`Concurrent navigation time: ${finalTime}ms`)
      
      // Should handle concurrent navigation gracefully
      expect(finalTime).toBeLessThan(5000)
      
      // Should end up at the last requested page
      await expect(page.getByText('Welcome back')).toBeVisible()
    })

    test('should maintain performance under load simulation', async ({ page }) => {
      await signIn(page, 'helper')
      
      // Simulate heavy usage
      const operations = []
      
      for (let i = 0; i < 10; i++) {
        operations.push(
          page.goto('/jobs').then(() => 
            page.getByRole('heading', { name: 'Available Jobs' }).waitFor()
          )
        )
      }
      
      const startTime = performance.now()
      await Promise.all(operations)
      const loadTestTime = performance.now() - startTime
      
      console.log(`Load test completion time: ${loadTestTime}ms`)
      
      // Should complete load test within reasonable time
      expect(loadTestTime).toBeLessThan(15000)
    })
  })
})