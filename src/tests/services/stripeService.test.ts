import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmCardPayment: vi.fn(),
    createPaymentMethod: vi.fn(),
  })),
}))

// Import after mocking
const { stripeService } = await import('../../services/stripeService')

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as any).mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createConnectAccount', () => {
    it('should create a connect account successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ url: 'https://connect.stripe.com/test' }),
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await stripeService.createConnectAccount('user123')

      expect(result.error).toBeNull()
      expect(result.url).toBe('https://connect.stripe.com/test')
      expect(global.fetch).toHaveBeenCalledWith('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user123' }),
      })
    })

    it('should handle API error', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid user' }),
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await stripeService.createConnectAccount('invalid-user')

      expect(result.url).toBeNull()
      expect(result.error).toBe('Invalid user')
    })

    it('should handle network error', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await stripeService.createConnectAccount('user123')

      expect(result.url).toBeNull()
      expect(result.error).toBe('Network error creating Connect account')
    })
  })

  describe('getConnectAccountStatus', () => {
    it('should get account status successfully', async () => {
      const mockAccount = {
        id: '1',
        user_id: 'user123',
        stripe_account_id: 'acct_123',
        account_status: 'active',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ account: mockAccount }),
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await stripeService.getConnectAccountStatus('user123')

      expect(result.error).toBeNull()
      expect(result.account).toEqual(mockAccount)
    })
  })

  describe('createEscrowPayment', () => {
    it('should create escrow payment successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ clientSecret: 'pi_test_123' }),
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await stripeService.createEscrowPayment('job123', 10000)

      expect(result.error).toBeNull()
      expect(result.clientSecret).toBe('pi_test_123')
    })
  })

  describe('releaseEscrowPayment', () => {
    it('should release escrow payment successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await stripeService.releaseEscrowPayment('payment123')

      expect(result.error).toBeNull()
      expect(result.success).toBe(true)
    })
  })

  describe('refundEscrowPayment', () => {
    it('should refund escrow payment successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await stripeService.refundEscrowPayment('payment123', 'Job cancelled')

      expect(result.error).toBeNull()
      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/stripe/refund-escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'payment123', reason: 'Job cancelled' }),
      })
    })
  })
})