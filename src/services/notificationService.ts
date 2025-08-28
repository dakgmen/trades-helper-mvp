import { supabase } from '../lib/supabase'
import type { Notification, NotificationPreferences, NotificationType } from '../types'

export class NotificationService {
  private static instance: NotificationService
  private swRegistration: ServiceWorkerRegistration | null = null

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Initialize push notifications
  async initialize(): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        return { success: false, error: 'Service workers not supported' }
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        return { success: false, error: 'Push notifications not supported' }
      }

      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to initialize notifications' }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<{ granted: boolean; error: string | null }> {
    try {
      if (!('Notification' in window)) {
        return { granted: false, error: 'Notifications not supported' }
      }

      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        return { granted: true, error: null }
      } else if (permission === 'denied') {
        return { granted: false, error: 'Notification permission denied' }
      } else {
        return { granted: false, error: 'Notification permission dismissed' }
      }
    } catch (error) {
      return { granted: false, error: 'Failed to request notification permission' }
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!this.swRegistration) {
        await this.initialize()
      }

      if (!this.swRegistration) {
        return { success: false, error: 'Service worker not registered' }
      }

      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription()

      if (!subscription) {
        // Create new subscription
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
          ),
        })
      }

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      })

      if (!response.ok) {
        return { success: false, error: 'Failed to save subscription' }
      }

      // Save push token to user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ push_token: JSON.stringify(subscription.toJSON()) })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to subscribe to push notifications' }
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!this.swRegistration) {
        return { success: false, error: 'Service worker not registered' }
      }

      const subscription = await this.swRegistration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove from server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      // Remove push token from profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to unsubscribe from push notifications' }
    }
  }

  // Send local notification
  showLocalNotification(title: string, options: NotificationOptions = {}): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options,
      })
    }
  }

  // Create notification in database
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, any>
  ): Promise<{ notification: Notification | null; error: string | null }> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data: data || {},
          read: false,
        })
        .select()
        .single()

      if (error) {
        return { notification: null, error: error.message }
      }

      return { notification, error: null }
    } catch (error) {
      return { notification: null, error: 'Failed to create notification' }
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; error: string | null }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { notifications: [], error: error.message }
      }

      return { notifications: data || [], error: null }
    } catch (error) {
      return { notifications: [], error: 'Failed to fetch notifications' }
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to mark notification as read' }
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to mark all notifications as read' }
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to delete notification' }
    }
  }

  // Get notification preferences
  async getPreferences(userId: string): Promise<{ preferences: NotificationPreferences | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { preferences: null, error: error.message }
      }

      // Return default preferences if none found
      const defaultPreferences: NotificationPreferences = {
        push_enabled: true,
        email_enabled: true,
        job_notifications: true,
        application_notifications: true,
        payment_notifications: true,
        message_notifications: true,
      }

      return { preferences: data || defaultPreferences, error: null }
    } catch (error) {
      return { preferences: null, error: 'Failed to get notification preferences' }
    }
  }

  // Update notification preferences
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to update notification preferences' }
    }
  }

  // Helper function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  // Enhanced notification sending with multi-channel support
  async sendMultiChannelNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    options?: {
      data?: Record<string, any>
      channels?: ('push' | 'email' | 'sms')[]
      priority?: 'low' | 'normal' | 'high' | 'critical'
      actions?: Array<{ action: string; title: string; url?: string }>
    }
  ): Promise<{ success: boolean; channels: { [key: string]: boolean } }> {
    try {
      // Create notification record
      const { notification, error: createError } = await this.createNotification(userId, title, message, type, options?.data)
      
      if (createError || !notification) {
        return { success: false, channels: {} }
      }

      // Get user preferences
      const { preferences, error: prefError } = await this.getPreferences(userId)
      if (prefError || !preferences) {
        return { success: false, channels: {} }
      }

      const channels = options?.channels || ['push'] // Default to push only
      const results: { [key: string]: boolean } = {}

      // Check if user wants this type of notification
      const typeEnabled = this.isNotificationTypeEnabled(type, preferences)
      if (!typeEnabled) {
        return { success: true, channels: { skipped: true } }
      }

      // Send through requested channels
      for (const channel of channels) {
        switch (channel) {
          case 'push':
            if (preferences.push_enabled) {
              // Use existing push notification method
              this.showLocalNotification(title, { body: message, data: options?.data })
              results.push = true
            } else {
              results.push = false
            }
            break
            
          case 'email':
            if (preferences.email_enabled) {
              results.email = await this.sendEmailNotification(userId, title, message, options)
            } else {
              results.email = false
            }
            break
            
          case 'sms':
            if (options?.priority === 'critical' || options?.priority === 'high') {
              results.sms = await this.sendSMSNotification(userId, title, message)
            } else {
              results.sms = false
            }
            break
        }
      }

      return { success: true, channels: results }
    } catch (error) {
      return { success: false, channels: {} }
    }
  }

  // Send email notification
  private async sendEmailNotification(
    userId: string,
    title: string,
    message: string,
    options?: {
      data?: Record<string, any>
      priority?: 'low' | 'normal' | 'high' | 'critical'
      actions?: Array<{ action: string; title: string; url?: string }>
    }
  ): Promise<boolean> {
    try {
      // Get user's profile for name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile for email:', profileError)
        return false
      }

      // Get user's email from auth (would need to be passed or stored)
      // For now, we'll send via API endpoint that handles auth lookup
      const emailData = {
        userId,
        subject: title,
        html: this.generateEmailHTML(title, message, profile?.full_name, options),
        priority: options?.priority || 'normal'
      }

      // Send email via API endpoint
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  // Send SMS notification (for critical alerts only)
  private async sendSMSNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<boolean> {
    try {
      // Get user's phone number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single()

      if (profileError || !profile?.phone) {
        console.log('No phone number found for user:', userId)
        return false
      }

      // Prepare SMS data
      const smsData = {
        to: profile.phone,
        message: `TradieHelper: ${title} - ${message}`,
        userId
      }

      // Send SMS via API endpoint (would integrate with Twilio, etc.)
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsData),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending SMS notification:', error)
      return false
    }
  }

  // Bulk send notifications (for admin announcements)
  async sendBulkNotification(
    userFilters: {
      roles?: ('tradie' | 'helper' | 'admin')[]
      verified?: boolean
      active_since?: string
    },
    title: string,
    message: string,
    type: NotificationType,
    options?: {
      channels?: ('push' | 'email')[]
      priority?: 'low' | 'normal' | 'high'
    }
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get users based on filters
      let query = supabase.from('profiles').select('id')

      if (userFilters.roles) {
        query = query.in('role', userFilters.roles)
      }

      if (userFilters.verified !== undefined) {
        query = query.eq('verified', userFilters.verified)
      }

      if (userFilters.active_since) {
        query = query.gte('created_at', userFilters.active_since)
      }

      const { data: users, error } = await query

      if (error || !users) {
        return { sent: 0, failed: 1 }
      }

      let sent = 0
      let failed = 0

      // Send notifications in batches to avoid rate limits
      const batchSize = 50
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize)
        
        const promises = batch.map(user => 
          this.sendMultiChannelNotification(user.id, title, message, type, options)
        )

        const results = await Promise.allSettled(promises)
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            sent++
          } else {
            failed++
          }
        })
      }

      return { sent, failed }
    } catch (error) {
      console.error('Error sending bulk notifications:', error)
      return { sent: 0, failed: 1 }
    }
  }

  // Get notification statistics (for admin dashboard)
  async getNotificationStatistics(): Promise<{
    total_sent: number
    push_sent: number
    email_sent: number
    sms_sent: number
    read_rate: number
    avg_time_to_read_minutes: number
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('created_at, read, type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (error || !notifications) {
        return {
          total_sent: 0,
          push_sent: 0,
          email_sent: 0,
          sms_sent: 0,
          read_rate: 0,
          avg_time_to_read_minutes: 0
        }
      }

      const totalSent = notifications.length
      const readNotifications = notifications.filter(n => n.read)
      const readRate = totalSent > 0 ? (readNotifications.length / totalSent) * 100 : 0

      return {
        total_sent: totalSent,
        push_sent: totalSent, // Simplified - all are push for now
        email_sent: 0, // Would track from email service
        sms_sent: 0, // Would track from SMS service
        read_rate: Math.round(readRate * 10) / 10,
        avg_time_to_read_minutes: 0 // Would calculate from read timestamps
      }
    } catch (error) {
      console.error('Error getting notification statistics:', error)
      return {
        total_sent: 0,
        push_sent: 0,
        email_sent: 0,
        sms_sent: 0,
        read_rate: 0,
        avg_time_to_read_minutes: 0
      }
    }
  }

  // Private helper methods
  private isNotificationTypeEnabled(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'job':
        return preferences.job_notifications
      case 'application':
        return preferences.application_notifications
      case 'payment':
        return preferences.payment_notifications
      case 'message':
        return preferences.message_notifications
      case 'system':
        return true // System notifications always enabled
      default:
        return true
    }
  }

  private generateEmailHTML(
    title: string,
    message: string,
    userName?: string,
    options?: {
      actions?: Array<{ action: string; title: string; url?: string }>
    }
  ): string {
    const actionsHTML = options?.actions?.map(action => 
      `<a href="${action.url || '#'}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 8px 8px 8px 0;">${action.title}</a>`
    ).join('') || ''

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h2 style="color: #1e40af; margin: 0 0 16px 0;">${title}</h2>
          ${userName ? `<p style="color: #64748b; margin: 0 0 16px 0;">Hi ${userName},</p>` : ''}
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">${message}</p>
          ${actionsHTML}
        </div>
        <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This email was sent by TradieHelper. If you no longer wish to receive these emails, you can update your preferences in the app.
          </p>
        </div>
      </div>
    `
  }
}

export const notificationService = NotificationService.getInstance()