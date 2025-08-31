import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from '../../services/notificationService'

// Create mock functions for Supabase
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockUpdate = vi.fn()
const mockUpsert = vi.fn()
const mockDelete = vi.fn()

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      update: mockUpdate,
      upsert: mockUpsert,
      delete: mockDelete,
    })),
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockClear()
    
    // Reset mock chaining to handle all possible combinations
    mockInsert.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder, limit: mockLimit })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockDelete.mockReturnValue({ eq: mockEq })
    mockSingle.mockReturnValue({ eq: mockEq, single: mockSingle })
    mockLimit.mockReturnValue({ limit: mockLimit })
    
    // Reset global mocks
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
      expect(result.error).toBe('Failed to initialize notifications')
    })

    it('should fail without push manager support', async () => {
      // Mock no PushManager support by removing from window
      const originalPushManager = global.PushManager
      delete (global as Record<string, unknown>).PushManager
      delete (global as { window?: { PushManager?: unknown } }).window?.PushManager
      
      // Also ensure window object exists
      Object.defineProperty(global, 'window', {
        value: {},
        configurable: true,
      })

      const result = await notificationService.initialize()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Push notifications not supported')
      
      // Restore PushManager
      global.PushManager = originalPushManager
    })
  })

  describe('requestPermission', () => {
    it('should request permission successfully when granted', async () => {
      // Ensure Notification exists in window
      Object.defineProperty(global, 'window', {
        value: {
          Notification: {
            requestPermission: vi.fn(() => Promise.resolve('granted' as NotificationPermission))
          }
        },
        configurable: true,
      })
      
      Object.defineProperty(global, 'Notification', {
        value: {
          requestPermission: vi.fn(() => Promise.resolve('granted' as NotificationPermission))
        },
        configurable: true,
      })

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle permission denied', async () => {
      // Ensure Notification exists in window
      Object.defineProperty(global, 'window', {
        value: {
          Notification: {
            requestPermission: vi.fn(() => Promise.resolve('denied' as NotificationPermission))
          }
        },
        configurable: true,
      })
      
      Object.defineProperty(global, 'Notification', {
        value: {
          requestPermission: vi.fn(() => Promise.resolve('denied' as NotificationPermission))
        },
        configurable: true,
      })

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(false)
      expect(result.error).toBe('Notification permission denied')
    })

    it('should handle permission dismissed', async () => {
      // Ensure Notification exists in window
      Object.defineProperty(global, 'window', {
        value: {
          Notification: {
            requestPermission: vi.fn(() => Promise.resolve('default' as NotificationPermission))
          }
        },
        configurable: true,
      })
      
      Object.defineProperty(global, 'Notification', {
        value: {
          requestPermission: vi.fn(() => Promise.resolve('default' as NotificationPermission))
        },
        configurable: true,
      })

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(false)
      expect(result.error).toBe('Notification permission dismissed')
    })

    it('should fail without notification support', async () => {
      // Store original and delete Notification
      const originalNotification = global.Notification
      delete (global as Record<string, unknown>).Notification
      delete (global as { window?: { Notification?: unknown } }).window?.Notification
      
      // Ensure window exists but without Notification
      Object.defineProperty(global, 'window', {
        value: {},
        configurable: true,
      })

      const result = await notificationService.requestPermission()

      expect(result.granted).toBe(false)
      expect(result.error).toBe('Notifications not supported')
      
      // Restore Notification
      global.Notification = originalNotification
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

      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      // Mock successful database update - ensure complete chain works
      const mockEqFn = vi.fn().mockResolvedValue({ error: null })
      mockUpdate.mockImplementationOnce(() => ({
        eq: mockEqFn
      }))
      
      // Mock import.meta.env
      vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'test-vapid-key')
      
      // Mock window.atob for VAPID key conversion
      global.window = global.window || {}
      global.window.atob = vi.fn().mockReturnValue('test-decoded-vapid-key')
      
      // Set the service registration before calling subscribeToPush
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(notificationService as any).swRegistration = mockSwRegistration
      
      // Mock initialize method to return success without changing swRegistration
      const initializeSpy = vi.spyOn(notificationService, 'initialize')
      initializeSpy.mockImplementation(async () => {
        // Don't change swRegistration if it's already set
        return { success: true, error: null }
      })

      const result = await notificationService.subscribeToPush('user123')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      
      // Verify the mocks were called correctly
      expect(mockSwRegistration.pushManager.getSubscription).toHaveBeenCalled()
      expect(mockSwRegistration.pushManager.subscribe).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/subscribe', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('user123')
      }))
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEqFn).toHaveBeenCalledWith('id', 'user123')
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

      mockSingle.mockResolvedValueOnce({
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

      // Mock the complete chain for getUserNotifications - override for this test only
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            })
          })
        })
      }))

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

      // Mock the complete chain for getUserNotifications with unread filter - override for this test only
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockNotifications,
                error: null,
              })
            })
          })
        })
      }))

      const result = await notificationService.getUserNotifications('user123', 50, true)

      expect(result.error).toBeNull()
      expect(result.notifications).toEqual(mockNotifications)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
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

      // Mock the complete chain: .select('*').eq('user_id', userId).single() - override for this test only
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null,
          })
        })
      }))

      const result = await notificationService.getPreferences('user123')

      expect(result.error).toBeNull()
      expect(result.preferences).toEqual(mockPreferences)
    })

    it('should return default preferences when none found', async () => {
      // Mock the complete chain: .select('*').eq('user_id', userId).single() - override for this test only
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          })
        })
      }))

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
      mockUpsert.mockResolvedValueOnce({
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