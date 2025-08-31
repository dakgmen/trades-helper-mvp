import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geolocationService } from '../../services/geolocationService'

// Mock navigator.geolocation
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  configurable: true,
})

// Mock fetch for reverse geocoding
global.fetch = vi.fn()

// Create mock functions for Supabase
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockNot = vi.fn()
const mockLimit = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      not: mockNot,
      limit: mockLimit,
      update: mockUpdate,
    })),
  },
}))

describe('GeolocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockClear()
    
    // Reset mock chaining
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq, not: mockNot, limit: mockLimit })
    mockNot.mockReturnValue({ not: mockNot, eq: mockEq, limit: mockLimit })
    mockLimit.mockReturnValue({ limit: mockLimit })
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  describe('getCurrentPosition', () => {
    beforeEach(() => {
      // Reset navigator.geolocation mock before each test
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn(),
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
        configurable: true,
      })
    })

    it('should get current position successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      }

      navigator.geolocation.getCurrentPosition = vi.fn((success) => {
        success(mockPosition)
      })

      const result = await geolocationService.getCurrentPosition()

      expect(result.error).toBeNull()
      expect(result.location).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      })
    })

    it('should handle geolocation not supported', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      })

      const result = await geolocationService.getCurrentPosition()

      expect(result.location).toBeNull()
      expect(result.error).toBe('Geolocation not supported')
    })

    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      navigator.geolocation.getCurrentPosition = vi.fn((_success, error) => {
        error(mockError)
      })

      const result = await geolocationService.getCurrentPosition()

      expect(result.location).toBeNull()
      expect(result.error).toBe('Location permission denied')
    })

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      navigator.geolocation.getCurrentPosition = vi.fn((_success, error) => {
        error(mockError)
      })

      const result = await geolocationService.getCurrentPosition()

      expect(result.location).toBeNull()
      expect(result.error).toBe('Location unavailable')
    })

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      navigator.geolocation.getCurrentPosition = vi.fn((_success, error) => {
        error(mockError)
      })

      const result = await geolocationService.getCurrentPosition()

      expect(result.location).toBeNull()
      expect(result.error).toBe('Location request timed out')
    })
  })

  describe('watchPosition', () => {
    beforeEach(() => {
      // Reset navigator.geolocation mock before each test
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn(),
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
        configurable: true,
      })
    })

    it('should watch position successfully', () => {
      const mockCallback = vi.fn()
      navigator.geolocation.watchPosition = vi.fn(() => 123)

      const result = geolocationService.watchPosition(mockCallback)

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(navigator.geolocation.watchPosition).toHaveBeenCalled()
    })

    it('should handle geolocation not supported', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      })

      const mockCallback = vi.fn()
      const result = geolocationService.watchPosition(mockCallback)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Geolocation not supported')
    })
  })

  describe('stopWatching', () => {
    beforeEach(() => {
      // Reset navigator.geolocation mock before each test
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn(),
          watchPosition: vi.fn(() => 123),
          clearWatch: vi.fn(),
        },
        configurable: true,
      })
    })

    it('should stop watching position', () => {
      // First start watching
      geolocationService.watchPosition(vi.fn())

      // Then stop watching
      geolocationService.stopWatching()

      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(123)
    })
  })

  describe('updateUserLocation', () => {
    it('should update user location successfully', async () => {
      const mockLocation = { latitude: 40.7128, longitude: -74.0060 }

      mockEq.mockResolvedValueOnce({
        error: null,
      })

      const result = await geolocationService.updateUserLocation('user123', mockLocation, 'New York, NY')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between New York and Los Angeles (approximately 3944 km)
      const distance = geolocationService.calculateDistance(
        40.7128, -74.0060, // New York
        34.0522, -118.2437 // Los Angeles
      )

      // Allow for some variation in calculation
      expect(distance).toBeGreaterThan(3900)
      expect(distance).toBeLessThan(4000)
    })

    it('should calculate distance of 0 for same location', () => {
      const distance = geolocationService.calculateDistance(
        40.7128, -74.0060,
        40.7128, -74.0060
      )

      expect(distance).toBe(0)
    })
  })

  describe('findNearbyJobs', () => {
    it('should find nearby jobs successfully', async () => {
      const mockJobs = [
        {
          id: '1',
          tradie_id: 'tradie123',
          title: 'Test Job 1',
          description: 'Test description',
          location: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          date_time: '2024-01-01T10:00:00Z',
          duration_hours: 4,
          pay_rate: 25,
          status: 'open',
          assigned_helper_id: null,
          required_skills: ['plumbing'],
          urgency: 'medium',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          profiles: {
            id: 'tradie123',
            full_name: 'Test Tradie',
            verified: true,
          },
        },
        {
          id: '2',
          tradie_id: 'tradie456',
          title: 'Test Job 2',
          description: 'Test description 2',
          location: 'Brooklyn, NY',
          latitude: 40.6782,
          longitude: -73.9442,
          date_time: '2024-01-01T14:00:00Z',
          duration_hours: 2,
          pay_rate: 30,
          status: 'open',
          assigned_helper_id: null,
          required_skills: ['electrical'],
          urgency: 'high',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          profiles: {
            id: 'tradie456',
            full_name: 'Test Tradie 2',
            verified: true,
          },
        },
      ]

      mockLimit.mockResolvedValueOnce({
        data: mockJobs,
        error: null,
      })

      const helperLocation = { latitude: 40.7589, longitude: -73.9851 } // Times Square
      const result = await geolocationService.findNearbyJobs(helperLocation, 50, ['plumbing', 'electrical'])

      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(2)
      // Jobs should be sorted by score/distance, so order may vary
      expect(result.matches[0].job.id).toBeDefined()
      expect(result.matches[0].distance).toBeGreaterThan(0)
      expect(result.matches[0].score).toBeGreaterThan(0)
    })

    it('should handle database error', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      const helperLocation = { latitude: 40.7589, longitude: -73.9851 }
      const result = await geolocationService.findNearbyJobs(helperLocation)

      expect(result.matches).toEqual([])
      expect(result.error).toBe('Database error')
    })
  })

  describe('findNearbyHelpers', () => {
    it('should find nearby helpers successfully', async () => {
      const mockHelpers = [
        {
          id: 'helper123',
          role: 'helper',
          full_name: 'Test Helper 1',
          phone: '+1234567890',
          bio: 'Experienced helper',
          skills: ['plumbing', 'electrical'],
          white_card_url: null,
          id_document_url: null,
          verified: true,
          latitude: 40.7589,
          longitude: -73.9851,
          location_address: 'Times Square, NY',
          stripe_account_id: null,
          push_token: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockLimit.mockResolvedValueOnce({
        data: mockHelpers,
        error: null,
      })

      const jobLocation = { latitude: 40.7128, longitude: -74.0060 }
      const result = await geolocationService.findNearbyHelpers(jobLocation, 50, ['plumbing'])

      expect(result.error).toBeNull()
      expect(result.helpers).toHaveLength(1)
      expect(result.helpers[0].distance).toBeGreaterThan(0)
      expect(result.helpers[0].score).toBeGreaterThan(0)
    })
  })

  describe('reverseGeocode', () => {
    it('should reverse geocode successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          display_name: 'New York, NY, USA',
        }),
      }

      ;// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await geolocationService.reverseGeocode(40.7128, -74.0060)

      expect(result.error).toBeNull()
      expect(result.address).toBe('New York, NY, USA')
    })

    it('should handle geocoding service unavailable', async () => {
      ;// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      const result = await geolocationService.reverseGeocode(40.7128, -74.0060)

      expect(result.address).toBeNull()
      expect(result.error).toBe('Geocoding service unavailable')
    })

    it('should handle network error', async () => {
      ;// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await geolocationService.reverseGeocode(40.7128, -74.0060)

      expect(result.address).toBeNull()
      expect(result.error).toBe('Failed to reverse geocode')
    })
  })
})