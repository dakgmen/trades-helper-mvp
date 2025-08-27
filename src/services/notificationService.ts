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
}

export const notificationService = NotificationService.getInstance()