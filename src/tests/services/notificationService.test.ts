import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from '../../services/notificationService'

// Mock navigator
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve({
      pushManager: {
        getSubscription: vi.fn(),
        subscribe: vi.fn(),
      },
    })),
  },
  configurable: true,
})

Object.defineProperty(global, 'Notification', {
  value: {
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    permission: 'default',
  },
  configurable: true,
})

Object.defineProperty(global, 'PushManager', {
  value: {},
  configurable: true,
})

// Mock fetch
global.fetch = vi.fn()

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    upsert: vi.fn(),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
}

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}))

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
    Notification.permission = 'default'
  })

  describe('initialize', () => {
    it('should initialize successfully with service worker support', async () => {
      const result = await notificationService.initialize()

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('should fail without service worker support', async () => {
      // Mock no service worker support
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      })

      const result = await notificationService.initialize()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Service workers not supported')
    })

    it('should fail without push manager support', async () => {
      // Mock no PushManager support
      Object.defineProperty(global, 'PushManager', {
        value: undefined,
        configurable: true,
      })

      const result = await notificationService.initialize()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Push notifications not supported')
    })
  })

  describe('requestPermission', () => {
    it('should request permission successfully when granted', async () => {
      Notification.requestPermission = vi.fn(() => Promise.resolve('granted'))

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle permission denied', async () => {
      Notification.requestPermission = vi.fn(() => Promise.resolve('denied'))

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(false)
      expect(result.error).toBe('Notification permission denied')
    })

    it('should handle permission dismissed', async () => {
      Notification.requestPermission = vi.fn(() => Promise.resolve('default'))

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(false)
      expect(result.error).toBe('Notification permission dismissed')
    })

    it('should fail without notification support', async () => {
      Object.defineProperty(global, 'Notification', {
        value: undefined,
        configurable: true,
      })

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(false)
      expect(result.error).toBe('Notifications not supported')
    })
  })

  describe('subscribeToPush', () => {
    it('should subscribe to push notifications successfully', async () => {
      const mockSubscription = {
        toJSON: () => ({ endpoint: 'https://test.com', keys: { p256dh: 'test', auth: 'test' } }),
      }

      const mockSwRegistration = {
        pushManager: {
          getSubscription: vi.fn(() => Promise.resolve(null)),
          subscribe: vi.fn(() => Promise.resolve(mockSubscription)),
        },
      }

      navigator.serviceWorker.register = vi.fn(() => Promise.resolve(mockSwRegistration as any))

      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      // Mock successful database update
      const mockFrom = mockSupabase.from()
      const mockUpdate = mockFrom.update()
      const mockEq = mockUpdate.eq()
      mockEq.mockResolvedValueOnce({
        error: null,
      })

      const result = await notificationService.subscribeToPush('user123')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const mockNotification = {
        id: '1',
        user_id: 'user123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'job',
        read: false,
        data: {},
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockFrom = mockSupabase.from()
      const mockInsert = mockFrom.insert()
      const mockSelect = mockInsert.select()
      mockSelect.single.mockResolvedValueOnce({
        data: mockNotification,
        error: null,
      })

      const result = await notificationService.createNotification(
        'user123',
        'Test Notification',
        'Test message',
        'job'
      )

      expect(result.error).toBeNull()
      expect(result.notification).toEqual(mockNotification)
    })
  })

  describe('getUserNotifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [
        {
          id: '1',
          user_id: 'user123',
          title: 'Test Notification',
          message: 'Test message',
          type: 'job',
          read: false,
          data: {},
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq = mockSelect.eq()
      const mockOrder = mockEq.order()
      const mockLimit = mockOrder.limit()
      mockLimit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      })

      const result = await notificationService.getUserNotifications('user123')

      expect(result.error).toBeNull()
      expect(result.notifications).toEqual(mockNotifications)
    })

    it('should filter unread notifications', async () => {
      const mockNotifications = [
        {
          id: '1',
          user_id: 'user123',
          title: 'Test Notification',
          message: 'Test message',
          type: 'job',
          read: false,
          data: {},
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq1 = mockSelect.eq()
      const mockEq2 = mockEq1.eq()
      const mockOrder = mockEq2.order()
      const mockLimit = mockOrder.limit()
      mockLimit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      })

      const result = await notificationService.getUserNotifications('user123', 50, true)

      expect(result.error).toBeNull()
      expect(result.notifications).toEqual(mockNotifications)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const mockFrom = mockSupabase.from()
      const mockUpdate = mockFrom.update()
      const mockEq = mockUpdate.eq()
      mockEq.mockResolvedValueOnce({
        error: null,
      })

      const result = await notificationService.markAsRead('notification123')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('getPreferences', () => {
    it('should get notification preferences successfully', async () => {
      const mockPreferences = {
        push_enabled: true,
        email_enabled: true,
        job_notifications: true,
        application_notifications: true,
        payment_notifications: true,
        message_notifications: true,
      }

      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq = mockSelect.eq()
      mockEq.single.mockResolvedValueOnce({
        data: mockPreferences,
        error: null,
      })

      const result = await notificationService.getPreferences('user123')

      expect(result.error).toBeNull()
      expect(result.preferences).toEqual(mockPreferences)
    })

    it('should return default preferences when none found', async () => {
      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq = mockSelect.eq()
      mockEq.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await notificationService.getPreferences('user123')

      expect(result.error).toBeNull()
      expect(result.preferences).toEqual({
        push_enabled: true,
        email_enabled: true,
        job_notifications: true,
        application_notifications: true,
        payment_notifications: true,
        message_notifications: true,
      })
    })
  })

  describe('updatePreferences', () => {
    it('should update notification preferences successfully', async () => {
      const mockFrom = mockSupabase.from()
      mockFrom.upsert.mockResolvedValueOnce({
        error: null,
      })

      const result = await notificationService.updatePreferences('user123', {
        push_enabled: false,
        job_notifications: false,
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })
  })
})