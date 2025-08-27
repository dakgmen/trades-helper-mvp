import { test, expect } from '@playwright/test'
import { signIn, signOut } from './helpers/auth'

test.describe('Job Management', () => {
  test.describe('Job Posting (Tradie)', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page, 'tradie')
    })

    test('should create a new job posting', async ({ page }) => {
      await page.goto('/jobs/post')
      await expect(page.getByRole('heading', { name: 'Post a New Job' })).toBeVisible()
      
      // Fill job posting form
      await page.getByLabel('Job Title *').fill('Office Cleaning - Weekend')
      await page.getByLabel('Description').fill('Clean office space including vacuuming, mopping, and trash removal')
      await page.getByLabel('Location *').fill('Melbourne CBD, VIC')
      
      // Set date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateTimeString = tomorrow.toISOString().slice(0, 16)
      await page.getByLabel('Date & Time *').fill(dateTimeString)
      
      await page.getByLabel('Duration (hours) *').fill('4')
      await page.getByLabel('Pay Rate ($/hour) *').fill('30')
      
      // Verify total payment calculation
      await expect(page.getByText('Total payment: $120.00 (4 hours × $30/hour)')).toBeVisible()
      
      await page.getByRole('button', { name: 'Post Job' }).click()
      
      // Should redirect to dashboard
      await page.waitForURL('/')
      await expect(page.getByText('Welcome back')).toBeVisible()
    })

    test('should validate required job fields', async ({ page }) => {
      await page.goto('/jobs/post')
      
      // Try to submit empty form
      await page.getByRole('button', { name: 'Post Job' }).click()
      
      // HTML5 validation should prevent submission
      await expect(page.getByLabel('Job Title *')).toHaveAttribute('required')
      await expect(page.getByLabel('Location *')).toHaveAttribute('required')
      await expect(page.getByLabel('Date & Time *')).toHaveAttribute('required')
    })

    test('should validate future date requirement', async ({ page }) => {
      await page.goto('/jobs/post')
      
      // Fill form with past date
      await page.getByLabel('Job Title *').fill('Test Job')
      await page.getByLabel('Location *').fill('Sydney, NSW')
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pastDateString = yesterday.toISOString().slice(0, 16)
      await page.getByLabel('Date & Time *').fill(pastDateString)
      
      await page.getByLabel('Duration (hours) *').fill('2')
      await page.getByLabel('Pay Rate ($/hour) *').fill('25')
      
      await page.getByRole('button', { name: 'Post Job' }).click()
      
      // Should show error message
      await expect(page.getByText('Job date must be in the future')).toBeVisible()
    })

    test('should calculate total payment correctly', async ({ page }) => {
      await page.goto('/jobs/post')
      
      await page.getByLabel('Duration (hours) *').fill('6')
      await page.getByLabel('Pay Rate ($/hour) *').fill('45')
      
      await expect(page.getByText('Total payment: $270.00 (6 hours × $45/hour)')).toBeVisible()
      
      // Update values and verify recalculation
      await page.getByLabel('Duration (hours) *').fill('3')
      await expect(page.getByText('Total payment: $135.00 (3 hours × $45/hour)')).toBeVisible()
    })

    test('should validate duration and pay rate ranges', async ({ page }) => {
      await page.goto('/jobs/post')
      
      // Duration should have min/max constraints
      await expect(page.getByLabel('Duration (hours) *')).toHaveAttribute('min', '1')
      await expect(page.getByLabel('Duration (hours) *')).toHaveAttribute('max', '12')
      
      // Pay rate should have min/max constraints
      await expect(page.getByLabel('Pay Rate ($/hour) *')).toHaveAttribute('min', '20')
      await expect(page.getByLabel('Pay Rate ($/hour) *')).toHaveAttribute('max', '100')
    })

    test('should restrict job posting to tradies only', async ({ page }) => {
      await signOut(page)
      await signIn(page, 'helper')
      
      // Helper should not be able to access job posting
      await page.goto('/jobs/post')
      await page.waitForURL('/unauthorized')
      // or should redirect away from the post job page
    })
  })

  test.describe('Job Feed (Helper)', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page, 'helper')
    })

    test('should display available jobs', async ({ page }) => {
      await page.goto('/jobs')
      await expect(page.getByRole('heading', { name: 'Available Jobs' })).toBeVisible()
      
      // Should show filter controls
      await expect(page.getByLabel('Location')).toBeVisible()
      await expect(page.getByLabel('Min Pay Rate ($/hour)')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Filter Jobs' })).toBeVisible()
      
      // Should show at least the sample job from setup
      await expect(page.getByText('Test Site Cleanup Job')).toBeVisible()
    })

    test('should filter jobs by location', async ({ page }) => {
      await page.goto('/jobs')
      
      // Enter location filter
      await page.getByLabel('Location').fill('Sydney')
      await page.getByRole('button', { name: 'Filter Jobs' }).click()
      
      // Should show jobs containing Sydney
      await expect(page.getByText('Sydney')).toBeVisible()
    })

    test('should filter jobs by minimum pay rate', async ({ page }) => {
      await page.goto('/jobs')
      
      // Set high minimum pay rate
      await page.getByLabel('Min Pay Rate ($/hour)').fill('100')
      await page.getByRole('button', { name: 'Filter Jobs' }).click()
      
      // Should show "no jobs" message for unrealistic filter
      await expect(page.getByText('No jobs available matching your criteria')).toBeVisible()
      
      // Reset with realistic filter
      await page.getByLabel('Min Pay Rate ($/hour)').fill('30')
      await page.getByRole('button', { name: 'Filter Jobs' }).click()
    })

    test('should display job details correctly', async ({ page }) => {
      await page.goto('/jobs')
      
      // Find the test job and verify it displays all required information
      const jobCard = page.locator('[data-testid="job-card"]').first()
      
      await expect(jobCard.getByText('Test Site Cleanup Job')).toBeVisible()
      await expect(jobCard.getByText(/Sydney/)).toBeVisible()
      await expect(jobCard.getByText(/\$35\/hour/)).toBeVisible()
      await expect(jobCard.getByText(/6 hours/)).toBeVisible()
      await expect(jobCard.getByText(/\$210\.00 total/)).toBeVisible()
      await expect(jobCard.getByRole('button', { name: 'Apply Now' })).toBeVisible()
    })

    test('should apply to a job', async ({ page }) => {
      await page.goto('/jobs')
      
      // Apply to the first available job
      await page.getByRole('button', { name: 'Apply Now' }).first().click()
      
      // Should show success message
      await expect(page.getByText('Application submitted successfully!')).toBeVisible()
      
      // Refresh page and verify apply button is gone or changed
      await page.reload()
      // The specific job should not show apply button anymore for this user
    })

    test('should prevent duplicate applications', async ({ page }) => {
      await page.goto('/jobs')
      
      // Apply to job twice
      await page.getByRole('button', { name: 'Apply Now' }).first().click()
      await page.getByText('Application submitted successfully!').waitFor()
      
      // Try to apply again (might need to reload if UI updates)
      await page.reload()
      
      // If apply button is still visible, clicking should show duplicate message
      const applyButton = page.getByRole('button', { name: 'Apply Now' }).first()
      if (await applyButton.isVisible()) {
        await applyButton.click()
        await expect(page.getByText('You have already applied to this job')).toBeVisible()
      }
    })

    test('should show job status badges', async ({ page }) => {
      await page.goto('/jobs')
      
      // Should show status badges for jobs
      await expect(page.locator('.job-card')).toContainText(['Open', 'Assigned', 'Completed'].some(status => 
        page.getByText(status).isVisible()
      ))
    })

    test('should not show apply button for non-open jobs', async ({ page }) => {
      await page.goto('/jobs')
      
      // Jobs that are not in "open" status should not have apply buttons
      const assignedJobs = page.locator('.job-card:has-text("Assigned")')
      const completedJobs = page.locator('.job-card:has-text("Completed")')
      
      await expect(assignedJobs.getByRole('button', { name: 'Apply Now' })).toHaveCount(0)
      await expect(completedJobs.getByRole('button', { name: 'Apply Now' })).toHaveCount(0)
    })
  })

  test.describe('Job Management (Tradie Dashboard)', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page, 'tradie')
    })

    test('should show tradie-specific dashboard', async ({ page }) => {
      await page.goto('/')
      
      await expect(page.getByText('Manage your jobs and find reliable helpers')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Post New Job' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'View Applications' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible()
    })

    test('should navigate to job posting from dashboard', async ({ page }) => {
      await page.goto('/')
      
      await page.getByRole('link', { name: 'Post New Job' }).click()
      await page.waitForURL('/jobs/post')
      await expect(page.getByRole('heading', { name: 'Post a New Job' })).toBeVisible()
    })

    test('should navigate to applications from dashboard', async ({ page }) => {
      await page.goto('/')
      
      await page.getByRole('link', { name: 'View Applications' }).click()
      await page.waitForURL('/applications')
      await expect(page.getByRole('heading', { name: 'Job Applications' })).toBeVisible()
    })
  })
})