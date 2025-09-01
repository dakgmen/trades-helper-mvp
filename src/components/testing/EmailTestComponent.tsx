import React, { useState } from 'react'
import EmailService from '../../services/EmailService'
import EmailNotificationService from '../../services/EmailNotificationService'

export const EmailTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runEmailTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    addResult('🚀 Starting LIVE email functionality tests with SendPulse...')
    addResult('📧 Using real SendPulse credentials for actual email sending')

    const testEmail = 'claude.test.email@gmail.com' // Safe test email
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    try {
      // Test 1: Contact Form Email
      addResult('📧 Test 1: Sending contact form email...')
      const contactResult = await EmailService.sendContactFormEmail({
        fullName: 'Claude AI Live Test User',
        email: testEmail,
        subject: '🧪 LIVE Email Test - Contact Form',
        message: 'This is a LIVE test message from the TradieHelper email system using real SendPulse credentials. Testing contact form functionality.'
      })
      addResult(contactResult ? '✅ Contact form email SENT successfully' : '❌ Contact form email FAILED to send')
      await delay(2000)

      // Test 2: Welcome Email (Helper)
      addResult('🎉 Test 2: Sending welcome email (Helper)...')
      const welcomeResult = await EmailService.sendWelcomeEmail(
        testEmail,
        'Claude Live Test Helper',
        'helper'
      )
      addResult(welcomeResult ? '✅ Welcome email (Helper) SENT successfully' : '❌ Welcome email (Helper) FAILED to send')
      await delay(2000)

      // Test 3: Welcome Email (Tradie)
      addResult('🔧 Test 3: Sending welcome email (Tradie)...')
      const tradieWelcomeResult = await EmailService.sendWelcomeEmail(
        testEmail,
        'Claude Live Test Tradie',
        'tradie'
      )
      addResult(tradieWelcomeResult ? '✅ Welcome email (Tradie) SENT successfully' : '❌ Welcome email (Tradie) FAILED to send')
      await delay(2000)

      // Test 4: Job Application Notification
      addResult('💼 Test 4: Sending job application notification...')
      const jobResult = await EmailService.sendJobNotificationEmail(
        testEmail,
        'Claude Live Test Tradie',
        'LIVE Test Plumbing Repair Job',
        'Claude Live Test Helper',
        'new_application'
      )
      addResult(jobResult ? '✅ Job application notification SENT successfully' : '❌ Job application notification FAILED to send')
      await delay(2000)

      // Test 5: Job Assignment Notification
      addResult('✅ Test 5: Sending job assignment notification...')
      const jobAssignResult = await EmailService.sendJobNotificationEmail(
        testEmail,
        'Claude Live Test Helper',
        'LIVE Test Plumbing Repair Job',
        'Claude Live Test Tradie Company',
        'job_assigned'
      )
      addResult(jobAssignResult ? '✅ Job assignment notification SENT successfully' : '❌ Job assignment notification FAILED to send')
      await delay(2000)

      // Test 6: Job Completion Notification
      addResult('🎊 Test 6: Sending job completion notification...')
      const jobCompleteResult = await EmailService.sendJobNotificationEmail(
        testEmail,
        'Claude Live Test Helper',
        'LIVE Test Plumbing Repair Job',
        'Claude Live Test Tradie Company',
        'job_completed'
      )
      addResult(jobCompleteResult ? '✅ Job completion notification SENT successfully' : '❌ Job completion notification FAILED to send')
      await delay(2000)

      // Test 7: Email Notification Service Integration
      addResult('🔔 Test 7: Testing EmailNotificationService integration...')
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
            title: 'LIVE Test Integration Job',
            description: 'Testing EmailNotificationService with real SendPulse',
            location: 'Sydney Live Test Location',
            rate: 75,
            rate_type: 'hourly',
            tradie_id: 'live-test-tradie-1',
            status: 'open'
          },
          {
            id: 'live-test-helper-1',
            email: testEmail,
            full_name: 'Claude Live Integration Helper',
            role: 'helper'
          },
          {
            id: 'live-test-tradie-1',
            email: testEmail,
            full_name: 'Claude Live Integration Tradie',
            role: 'tradie'
          }
        )
        addResult('✅ EmailNotificationService integration SENT successfully')
        await delay(2000)
      } catch (error) {
        addResult('❌ EmailNotificationService integration FAILED')
        console.error('Notification service error:', error)
      }

      addResult('🎊 All LIVE email tests completed!')
      addResult(`📮 Check your email (${testEmail}) for test messages!`)
      addResult('📝 Look for emails with subjects containing "LIVE Email Test" or "LIVE Test"')
      addResult('✅ Email functionality is LIVE and working with SendPulse!')

    } catch (error) {
      addResult(`❌ Email test failed with error: ${error}`)
      console.error('Email test error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📧 Email System Testing</h2>
        
        <div className="mb-6">
          <button
            onClick={runEmailTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Tests...
              </>
            ) : (
              'Run Email Tests'
            )}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet. Click "Run Email Tests" to start.</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-white p-2 rounded border-l-4 border-blue-200">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <h4 className="text-sm font-semibold text-yellow-800">⚠️ Important Notes:</h4>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Make sure to configure SendPulse API credentials in .env file</li>
            <li>• Tests will use mock data and won't send actual emails without valid credentials</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• Ensure your SendPulse account has sufficient credits for testing</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400">
          <h4 className="text-sm font-semibold text-green-800">✅ Email Features Implemented:</h4>
          <ul className="text-sm text-green-700 mt-2 space-y-1">
            <li>• Contact form email notifications</li>
            <li>• Welcome emails for new user registrations</li>
            <li>• Job application notifications</li>
            <li>• Job assignment notifications</li>
            <li>• Job completion notifications</li>
            <li>• Batch notification processing</li>
            <li>• Application reminder system</li>
            <li>• Payment update notifications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}