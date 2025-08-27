import { loadStripe, Stripe } from '@stripe/stripe-js'
import type { StripeConnectAccount, Payment } from '../types'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export class StripeService {
  private static instance: StripeService
  private stripe: Stripe | null = null

  private constructor() {}

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService()
    }
    return StripeService.instance
  }

  async initialize(): Promise<void> {
    if (!this.stripe) {
      this.stripe = await getStripe()
    }
  }

  // Create Stripe Connect account
  async createConnectAccount(userId: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { url: null, error: data.error || 'Failed to create Connect account' }
      }

      return { url: data.url, error: null }
    } catch (error) {
      return { url: null, error: 'Network error creating Connect account' }
    }
  }

  // Get Connect account status
  async getConnectAccountStatus(userId: string): Promise<{ account: StripeConnectAccount | null; error: string | null }> {
    try {
      const response = await fetch(`/api/stripe/connect-account/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { account: null, error: data.error || 'Failed to get account status' }
      }

      return { account: data.account, error: null }
    } catch (error) {
      return { account: null, error: 'Network error getting account status' }
    }
  }

  // Create payment intent for escrow
  async createEscrowPayment(jobId: string, amount: number): Promise<{ clientSecret: string | null; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/create-escrow-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { clientSecret: null, error: data.error || 'Failed to create payment intent' }
      }

      return { clientSecret: data.clientSecret, error: null }
    } catch (error) {
      return { clientSecret: null, error: 'Network error creating payment intent' }
    }
  }

  // Confirm payment
  async confirmPayment(clientSecret: string, paymentMethodId: string): Promise<{ success: boolean; error: string | null }> {
    if (!this.stripe) {
      await this.initialize()
    }

    if (!this.stripe) {
      return { success: false, error: 'Stripe not initialized' }
    }

    try {
      const { error } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
      })

      if (error) {
        return { success: false, error: error.message || 'Payment confirmation failed' }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Payment confirmation failed' }
    }
  }

  // Release escrow payment
  async releaseEscrowPayment(paymentId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/release-escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to release escrow payment' }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Network error releasing payment' }
    }
  }

  // Refund escrow payment
  async refundEscrowPayment(paymentId: string, reason?: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/refund-escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId, reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to refund payment' }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Network error refunding payment' }
    }
  }

  // Create payment method
  async createPaymentMethod(cardElement: any): Promise<{ paymentMethod: any | null; error: string | null }> {
    if (!this.stripe) {
      await this.initialize()
    }

    if (!this.stripe) {
      return { paymentMethod: null, error: 'Stripe not initialized' }
    }

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) {
        return { paymentMethod: null, error: error.message || 'Failed to create payment method' }
      }

      return { paymentMethod, error: null }
    } catch (error) {
      return { paymentMethod: null, error: 'Failed to create payment method' }
    }
  }
}

export const stripeService = StripeService.getInstance()