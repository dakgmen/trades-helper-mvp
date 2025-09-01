// Live Email Testing Script with Real SendPulse Credentials
import EmailService from '../services/EmailService.js'
import EmailNotificationService from '../services/EmailNotificationService.js'

console.log('🚀 Starting Live Email Functionality Tests...')
console.log('📧 Using real SendPulse credentials')

// Test configuration
const testConfig = {
  testEmail: 'claude.test.email@gmail.com', // Safe test email
  sendDelay: 2000 // 2 second delay between sends to avoid rate limits
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function runLiveEmailTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }

  const addResult = (testName, success, error = null) => {
    results.total++
    if (success) {
      results.passed++
      console.log(`✅ ${testName} - PASSED`)
    } else {
      results.failed++
      console.log(`❌ ${testName} - FAILED`, error ? `(${error})` : '')
      if (error) results.errors.push({ test: testName, error })
    }
  }

  console.log('\n📋 Test 1: Contact Form Email')
  try {
    const contactResult = await EmailService.sendContactFormEmail({
      fullName: 'Claude AI Test User',
      email: testConfig.testEmail,
      subject: '🧪 Live Email Test - Contact Form',
      message: 'This is a test message from the TradieHelper email system using live SendPulse credentials. Testing contact form functionality.'
    })
    addResult('Contact Form Email', contactResult)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('Contact Form Email', false, error.message)
  }

  console.log('\n🎉 Test 2: Welcome Email (Helper)')
  try {
    const welcomeResult = await EmailService.sendWelcomeEmail(
      testConfig.testEmail,
      'Claude Test Helper',
      'helper'
    )
    addResult('Welcome Email (Helper)', welcomeResult)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('Welcome Email (Helper)', false, error.message)
  }

  console.log('\n🔧 Test 3: Welcome Email (Tradie)')
  try {
    const tradieWelcomeResult = await EmailService.sendWelcomeEmail(
      testConfig.testEmail,
      'Claude Test Tradie',
      'tradie'
    )
    addResult('Welcome Email (Tradie)', tradieWelcomeResult)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('Welcome Email (Tradie)', false, error.message)
  }

  console.log('\n💼 Test 4: Job Application Notification')
  try {
    const jobAppResult = await EmailService.sendJobNotificationEmail(
      testConfig.testEmail,
      'Claude Test Tradie',
      'Live Test Plumbing Job',
      'Claude Test Helper',
      'new_application'
    )
    addResult('Job Application Notification', jobAppResult)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('Job Application Notification', false, error.message)
  }

  console.log('\n✅ Test 5: Job Assignment Notification')
  try {
    const jobAssignResult = await EmailService.sendJobNotificationEmail(
      testConfig.testEmail,
      'Claude Test Helper',
      'Live Test Plumbing Job',
      'Claude Test Tradie Company',
      'job_assigned'
    )
    addResult('Job Assignment Notification', jobAssignResult)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('Job Assignment Notification', false, error.message)
  }

  console.log('\n🎊 Test 6: Job Completion Notification')
  try {
    const jobCompleteResult = await EmailService.sendJobNotificationEmail(
      testConfig.testEmail,
      'Claude Test Helper',
      'Live Test Plumbing Job',
      'Claude Test Tradie Company',
      'job_completed'
    )
    addResult('Job Completion Notification', jobCompleteResult)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('Job Completion Notification', false, error.message)
  }

  console.log('\n🔔 Test 7: EmailNotificationService Integration')
  try {
    await EmailNotificationService.notifyJobApplication(
      {
        id: 'live-test-app-1',
        job_id: 'live-test-job-1',
        helper_id: 'live-test-helper-1',
        tradie_id: 'live-test-tradie-1',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'live-test-job-1',
        title: 'Live Test Integration Job',
        description: 'Testing EmailNotificationService integration',
        location: 'Sydney Test Location',
        rate: 75,
        rate_type: 'hourly',
        tradie_id: 'live-test-tradie-1',
        status: 'open'
      },
      {
        id: 'live-test-helper-1',
        email: testConfig.testEmail,
        full_name: 'Claude Integration Test Helper',
        role: 'helper'
      },
      {
        id: 'live-test-tradie-1',
        email: testConfig.testEmail,
        full_name: 'Claude Integration Test Tradie',
        role: 'tradie'
      }
    )
    addResult('EmailNotificationService Integration', true)
    await delay(testConfig.sendDelay)
  } catch (error) {
    addResult('EmailNotificationService Integration', false, error.message)
  }

  console.log('\n🚀 Test 8: Batch Notification Processing')
  try {
    const batchNotifications = [
      {
        type: 'assignment',
        application: {
          id: 'batch-test-app-1',
          job_id: 'batch-test-job-1',
          helper_id: 'batch-test-helper-1',
          tradie_id: 'batch-test-tradie-1',
          status: 'accepted',
          created_at: new Date().toISOString()
        },
        job: {
          id: 'batch-test-job-1',
          title: 'Batch Test Job',
          description: 'Testing batch processing',
          location: 'Melbourne Test Location',
          rate: 60,
          rate_type: 'hourly',
          tradie_id: 'batch-test-tradie-1',
          status: 'assigned'
        },
        helperProfile: {
          id: 'batch-test-helper-1',
          email: testConfig.testEmail,
          full_name: 'Batch Test Helper',
          role: 'helper'
        },
        tradieProfile: {
          id: 'batch-test-tradie-1',
          email: testConfig.testEmail,
          full_name: 'Batch Test Tradie',
          role: 'tradie'
        }
      }
    ]

    await EmailNotificationService.sendBatchNotifications(batchNotifications)
    addResult('Batch Notification Processing', true)
  } catch (error) {
    addResult('Batch Notification Processing', false, error.message)
  }

  // Final Results Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 LIVE EMAIL TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  console.log(`📧 Total Tests: ${results.total}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`)

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach(({ test, error }, index) => {
      console.log(`   ${index + 1}. ${test}: ${error}`)
    })
  }

  console.log('\n🎯 FINAL STATUS:', results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED')

  if (results.passed > 0) {
    console.log(`\n📮 Check your email (${testConfig.testEmail}) for test messages!`)
    console.log('📝 Look for emails with subjects containing "Live Email Test" or "Live Test"')
  }

  return {
    success: results.failed === 0,
    totalTests: results.total,
    passedTests: results.passed,
    failedTests: results.failed,
    successRate: (results.passed / results.total) * 100
  }
}

// Export for use in other contexts
if (typeof window !== 'undefined') {
  // Browser environment
  window.runLiveEmailTests = runLiveEmailTests
} else {
  // Node.js environment
  runLiveEmailTests().then(results => {
    console.log('\n🏁 Test execution completed')
    process.exit(results.success ? 0 : 1)
  }).catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })
}

export { runLiveEmailTests }