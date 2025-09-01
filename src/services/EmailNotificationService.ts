import EmailService from './EmailService'

interface JobApplication {
  id: string
  job_id: string
  helper_id: string
  tradie_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  message?: string
  created_at: string
}

interface Job {
  id: string
  title: string
  description: string
  location: string
  rate: number
  rate_type: 'hourly' | 'daily' | 'fixed'
  tradie_id: string
  status: 'open' | 'assigned' | 'completed'
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  role: 'tradie' | 'helper'
}

export class EmailNotificationService {
  private static instance: EmailNotificationService

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService()
    }
    return EmailNotificationService.instance
  }

  /**
   * Send notification when a helper applies for a job
   */
  public async notifyJobApplication(
    _application: JobApplication,
    job: Job,
    helperProfile: UserProfile,
    tradieProfile: UserProfile
  ): Promise<void> {
    try {
      // Notify the tradie about the new application
      await EmailService.sendJobNotificationEmail(
        tradieProfile.email,
        tradieProfile.full_name || tradieProfile.company_name || 'Tradie',
        job.title,
        helperProfile.full_name || 'Helper',
        'new_application'
      )

      console.log(`✅ Job application notification sent to tradie: ${tradieProfile.email}`)
    } catch (error) {
      console.error('❌ Failed to send job application notification:', error)
    }
  }

  /**
   * Send notification when a job application is accepted/assigned
   */
  public async notifyJobAssignment(
    _application: JobApplication,
    job: Job,
    helperProfile: UserProfile,
    tradieProfile: UserProfile
  ): Promise<void> {
    try {
      // Notify the helper that they've been assigned the job
      await EmailService.sendJobNotificationEmail(
        helperProfile.email,
        helperProfile.full_name || 'Helper',
        job.title,
        tradieProfile.full_name || tradieProfile.company_name || 'Tradie',
        'job_assigned'
      )

      console.log(`✅ Job assignment notification sent to helper: ${helperProfile.email}`)
    } catch (error) {
      console.error('❌ Failed to send job assignment notification:', error)
    }
  }

  /**
   * Send notification when a job is marked as completed
   */
  public async notifyJobCompletion(
    _application: JobApplication,
    job: Job,
    helperProfile: UserProfile,
    tradieProfile: UserProfile
  ): Promise<void> {
    try {
      // Notify the helper about job completion and payment processing
      await EmailService.sendJobNotificationEmail(
        helperProfile.email,
        helperProfile.full_name || 'Helper',
        job.title,
        tradieProfile.full_name || tradieProfile.company_name || 'Tradie',
        'job_completed'
      )

      console.log(`✅ Job completion notification sent to helper: ${helperProfile.email}`)
    } catch (error) {
      console.error('❌ Failed to send job completion notification:', error)
    }
  }

  /**
   * Send batch notifications for multiple events
   */
  public async sendBatchNotifications(notifications: Array<{
    type: 'application' | 'assignment' | 'completion'
    application: JobApplication
    job: Job
    helperProfile: UserProfile
    tradieProfile: UserProfile
  }>): Promise<void> {
    const promises = notifications.map(async ({ type, application, job, helperProfile, tradieProfile }) => {
      switch (type) {
        case 'application':
          return this.notifyJobApplication(application, job, helperProfile, tradieProfile)
        case 'assignment':
          return this.notifyJobAssignment(application, job, helperProfile, tradieProfile)
        case 'completion':
          return this.notifyJobCompletion(application, job, helperProfile, tradieProfile)
        default:
          console.warn(`Unknown notification type: ${type}`)
      }
    })

    try {
      await Promise.allSettled(promises)
      console.log(`✅ Batch notifications completed (${notifications.length} notifications)`)
    } catch (error) {
      console.error('❌ Error in batch notification processing:', error)
    }
  }

  /**
   * Send reminder notifications for pending applications
   */
  public async sendApplicationReminders(
    pendingApplications: Array<{
      application: JobApplication
      job: Job
      helperProfile: UserProfile
      tradieProfile: UserProfile
      daysPending: number
    }>
  ): Promise<void> {
    const reminders = pendingApplications.filter(({ daysPending }) => daysPending >= 2)

    for (const { job, tradieProfile, daysPending } of reminders) {
      try {
        // Send simplified reminder using contact form template
        await EmailService.sendContactFormEmail({
          fullName: 'TradieHelper System',
          email: 'noreply@tradiehelper.com',
          subject: `Reminder: Pending application for "${job.title}"`,
          message: `You have a pending job application for "${job.title}" that has been waiting for ${daysPending} days. Please review and respond to maintain good service levels.`
        })
      } catch (error) {
        console.error(`❌ Failed to send reminder to ${tradieProfile.email}:`, error)
      }
    }

    console.log(`✅ Application reminders sent (${reminders.length} reminders)`)
  }

  /**
   * Send welcome email when user completes profile
   */
  public async sendProfileCompletionEmail(
    userEmail: string,
    userName: string,
    userRole: 'tradie' | 'helper'
  ): Promise<void> {
    try {
      await EmailService.sendWelcomeEmail(userEmail, userName, userRole)
      console.log(`✅ Profile completion email sent to: ${userEmail}`)
    } catch (error) {
      console.error('❌ Failed to send profile completion email:', error)
    }
  }

  /**
   * Send payment-related notifications
   */
  public async notifyPaymentUpdate(
    recipientEmail: string,
    recipientName: string,
    jobTitle: string,
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed',
    amount: number,
    currency: string = 'AUD'
  ): Promise<void> {
    try {
      const subject = `Payment ${paymentStatus}: ${jobTitle}`
      const message = `Your payment of ${currency}$${amount.toFixed(2)} for "${jobTitle}" is now ${paymentStatus}.`

      await EmailService.sendContactFormEmail({
        fullName: 'TradieHelper Payments',
        email: 'payments@tradiehelper.com',
        subject,
        message: `Payment notification for ${recipientName}: ${message}`
      })

      console.log(`✅ Payment notification sent to: ${recipientEmail}`)
    } catch (error) {
      console.error('❌ Failed to send payment notification:', error)
    }
  }
}

export default EmailNotificationService.getInstance()