import sendpulse from 'sendpulse-api'

// EmailTemplate interface removed as it's not used

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailOptions {
  from: {
    name: string
    email: string
  }
  to: EmailRecipient[]
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private static instance: EmailService
  private isInitialized = false
  private isBrowser = typeof window !== 'undefined'

  private constructor() {
    // Don't initialize immediately - do it lazily when needed
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Skip initialization in browser environment
    if (this.isBrowser) {
      console.warn('EmailService: SendPulse API not supported in browser environment')
      return
    }

    try {
      const apiUserId = import.meta.env.VITE_SENDPULSE_API_USER_ID || process.env.SENDPULSE_API_USER_ID
      const apiSecret = import.meta.env.VITE_SENDPULSE_API_SECRET || process.env.SENDPULSE_API_SECRET
      const tokenStorage = import.meta.env.VITE_SENDPULSE_TOKEN_STORAGE || process.env.SENDPULSE_TOKEN_STORAGE || '/tmp/'

      if (!apiUserId || !apiSecret) {
        console.error('SendPulse API credentials not configured')
        return
      }

      return new Promise((resolve, reject) => {
        sendpulse.init(apiUserId, apiSecret, tokenStorage, (token: unknown) => {
          if (token && typeof token === 'object' && token !== null && 'access_token' in token) {
            this.isInitialized = true
            console.log('SendPulse API initialized successfully')
            resolve()
          } else {
            console.error('Failed to initialize SendPulse API')
            reject(new Error('Failed to initialize SendPulse API'))
          }
        })
      })
    } catch (error) {
      console.error('Error initializing SendPulse:', error)
      throw error
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    // In browser environment, just log and return false
    if (this.isBrowser) {
      console.warn('EmailService: Email sending not supported in browser environment. Email would be sent:', options)
      return false
    }

    try {
      await this.initialize()
      
      if (!this.isInitialized) {
        console.error('EmailService not initialized')
        return false
      }

      return new Promise((resolve) => {
        const emailData = {
          html: options.html,
          text: options.text || this.stripHtml(options.html),
          subject: options.subject,
          from: options.from,
          to: options.to
        }

        sendpulse.smtpSendMail((data: unknown) => {
          if (data && typeof data === 'object' && data !== null && 'result' in data && (data as { result: boolean }).result === true) {
            console.log('Email sent successfully:', data)
            resolve(true)
          } else {
            console.error('Failed to send email:', data)
            resolve(false)
          }
        }, emailData)
      })
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  public static async sendContactFormEmail(formData: {
    fullName: string
    email: string
    subject: string
    message: string
  }): Promise<boolean> {
    const instance = EmailService.getInstance()
    await instance.initialize()
    const emailOptions: EmailOptions = {
      from: {
        name: 'TradieHelper Contact Form',
        email: 'noreply@tradiehelper.com'
      },
      to: [
        {
          email: 'admin@tradiehelper.com',
          name: 'TradieHelper Admin'
        }
      ],
      subject: `Contact Form: ${formData.subject}`,
      html: instance.getContactFormTemplate(formData)
    }

    return instance.sendEmail(emailOptions)
  }

  public static async sendWelcomeEmail(userEmail: string, userName: string, userRole: 'tradie' | 'helper'): Promise<boolean> {
    const instance = EmailService.getInstance()
    await instance.initialize()
    const emailOptions: EmailOptions = {
      from: {
        name: 'TradieHelper Team',
        email: 'welcome@tradiehelper.com'
      },
      to: [
        {
          email: userEmail,
          name: userName
        }
      ],
      subject: `Welcome to TradieHelper, ${userName}!`,
      html: instance.getWelcomeTemplate(userName, userRole)
    }

    return instance.sendEmail(emailOptions)
  }

  public static async sendJobNotificationEmail(
    recipientEmail: string,
    recipientName: string,
    jobTitle: string,
    tradieCompany: string,
    notificationType: 'new_application' | 'job_assigned' | 'job_completed'
  ): Promise<boolean> {
    const instance = EmailService.getInstance()
    await instance.initialize()
    const emailOptions: EmailOptions = {
      from: {
        name: 'TradieHelper Notifications',
        email: 'notifications@tradiehelper.com'
      },
      to: [
        {
          email: recipientEmail,
          name: recipientName
        }
      ],
      subject: instance.getJobNotificationSubject(notificationType, jobTitle),
      html: instance.getJobNotificationTemplate(recipientName, jobTitle, tradieCompany, notificationType)
    }

    return instance.sendEmail(emailOptions)
  }

  private getContactFormTemplate(formData: {
    fullName: string
    email: string
    subject: string
    message: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contact Form Submission</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0;">New Contact Form Submission</h2>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0;">Contact Details</h3>
          <p><strong>Name:</strong> ${formData.fullName}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Subject:</strong> ${formData.subject}</p>
          
          <h3 style="color: #374151;">Message</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
            ${formData.message.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚡ Action Required:</strong> Please respond to this contact form submission within 24-48 hours.
          </p>
        </div>
      </body>
      </html>
    `
  }

  private getWelcomeTemplate(userName: string, userRole: 'tradie' | 'helper'): string {
    const roleSpecificContent = userRole === 'tradie' 
      ? {
          title: 'Welcome to TradieHelper - Start Finding Reliable Helpers!',
          mainMessage: 'You can now post jobs and find skilled helpers for your trade work.',
          actionText: 'Post Your First Job',
          actionUrl: '/jobs/post'
        }
      : {
          title: 'Welcome to TradieHelper - Start Finding Trade Work!',
          mainMessage: 'You can now browse available jobs and apply to work with local tradies.',
          actionText: 'Browse Available Jobs',
          actionUrl: '/jobs'
        }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${roleSpecificContent.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔧 TradieHelper</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Connecting Tradies with Reliable Helpers</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #374151; margin: 0 0 20px 0;">Welcome, ${userName}! 🎉</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              ${roleSpecificContent.mainMessage}
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${roleSpecificContent.actionUrl}" 
                 style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                ${roleSpecificContent.actionText}
              </a>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">Getting Started Tips:</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px;">
                ${userRole === 'tradie' 
                  ? `<li>Complete your company profile with photos and credentials</li>
                     <li>Post detailed job descriptions with clear requirements</li>
                     <li>Set competitive rates to attract quality helpers</li>`
                  : `<li>Complete your profile with skills and experience</li>
                     <li>Upload photos of your previous work</li>
                     <li>Apply to jobs that match your expertise</li>`
                }
              </ul>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
              Need help? Contact us at <a href="mailto:support@tradiehelper.com" style="color: #3b82f6;">support@tradiehelper.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getJobNotificationTemplate(
    recipientName: string,
    jobTitle: string,
    tradieCompany: string,
    notificationType: 'new_application' | 'job_assigned' | 'job_completed'
  ): string {
    const notificationContent = {
      'new_application': {
        title: '📋 New Job Application Received',
        message: `You've received a new application for your job posting "${jobTitle}".`,
        action: 'Review Application',
        actionUrl: '/applications'
      },
      'job_assigned': {
        title: '🎉 Job Assignment Confirmed',
        message: `Congratulations! You've been assigned to work on "${jobTitle}" with ${tradieCompany}.`,
        action: 'View Job Details',
        actionUrl: '/jobs'
      },
      'job_completed': {
        title: '✅ Job Completed Successfully',
        message: `The job "${jobTitle}" has been marked as completed. Payment will be processed within 24-48 hours.`,
        action: 'View Payment Status',
        actionUrl: '/payments'
      }
    }

    const content = notificationContent[notificationType]

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${content.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">${content.title}</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${recipientName},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ${content.message}
          </p>
          
          <div style="margin: 25px 0;">
            <a href="${content.actionUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              ${content.action}
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The TradieHelper Team
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getJobNotificationSubject(notificationType: 'new_application' | 'job_assigned' | 'job_completed', jobTitle: string): string {
    switch (notificationType) {
      case 'new_application':
        return `New application for "${jobTitle}"`
      case 'job_assigned':
        return `Job assigned: "${jobTitle}"`
      case 'job_completed':
        return `Job completed: "${jobTitle}"`
      default:
        return 'TradieHelper Notification'
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }
}

// Export the class, not an instance to prevent immediate initialization
export default EmailService