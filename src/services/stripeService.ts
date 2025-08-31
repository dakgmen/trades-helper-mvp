import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'
import type { StripeConnectAccount, Payment, StripeKYCStatus, PaymentTransaction, StripeCardElement, StripePaymentMethod, PaymentFeeBreakdown, BankAccountDetails } from '../types'

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { success: false, error: 'Network error refunding payment' }
    }
  }

  // Create payment method
  async createPaymentMethod(cardElement: StripeCardElement): Promise<{ paymentMethod: StripePaymentMethod | null; error: string | null }> {
    if (!this.stripe) {
      await this.initialize()
    }

    if (!this.stripe) {
      return { paymentMethod: null, error: 'Stripe not initialized' }
    }

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        card: cardElement as any,
      })

      if (error) {
        return { paymentMethod: null, error: error.message || 'Failed to create payment method' }
      }

      return { paymentMethod: paymentMethod as StripePaymentMethod, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { paymentMethod: null, error: 'Failed to create payment method' }
    }
  }

  // Phase 3 Enhancements: Express Account Onboarding
  async createExpressAccount(userId: string, userData: {
    email: string
    country: string  // Should be 'AU' for Australian helpers
    business_type?: 'individual' | 'company'
  }): Promise<{ accountLink: string | null; accountId: string | null; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/create-express-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...userData }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { accountLink: null, accountId: null, error: data.error || 'Failed to create Express account' }
      }

      return { accountLink: data.accountLink, accountId: data.accountId, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { accountLink: null, accountId: null, error: 'Network error creating Express account' }
    }
  }

  // Get KYC status for Express accounts
  async getKYCStatus(stripeAccountId: string): Promise<{ status: StripeKYCStatus | null; error: string | null }> {
    try {
      const response = await fetch(`/api/stripe/kyc-status/${stripeAccountId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { status: null, error: data.error || 'Failed to get KYC status' }
      }

      return { status: data.status, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { status: null, error: 'Network error getting KYC status' }
    }
  }

  // Update local KYC status in database
  async updateKYCStatus(userId: string, kycStatus: StripeKYCStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stripe_kyc_status')
        .upsert({
          ...kycStatus,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error updating KYC status:', error)
        return false
      }

      return true
    } catch (_error) {
      console.error('Error updating KYC status:', _error)
      return false
    }
  }

  // Enhanced escrow with automatic refund scheduling
  async createEscrowWithAutoRefund(
    jobId: string, 
    amount: number, 
    autoRefundDays: number = 7
  ): Promise<{ clientSecret: string | null; paymentId: string | null; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/create-escrow-auto-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, amount, autoRefundDays }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { clientSecret: null, paymentId: null, error: data.error || 'Failed to create escrow payment' }
      }

      return { clientSecret: data.clientSecret, paymentId: data.paymentId, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { clientSecret: null, paymentId: null, error: 'Network error creating escrow payment' }
    }
  }

  // Get payment transaction details with fees
  async getPaymentTransactions(paymentId: string): Promise<{ transactions: PaymentTransaction[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false })

      if (error) {
        return { transactions: [], error: 'Failed to fetch payment transactions' }
      }

      return { transactions: data as PaymentTransaction[], error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { transactions: [], error: 'Network error fetching transactions' }
    }
  }

  // Calculate platform fees (transparent to users)
  static calculateFees(amount: number): {
    grossAmount: number
    platformFee: number
    stripeFee: number
    netAmount: number
  } {
    const platformFeePercent = 0.05 // 5% platform fee
    const stripeFeePercent = 0.029 // 2.9% + 30¢ Stripe fee
    const stripeFixedFee = 0.30

    const platformFee = Math.round(amount * platformFeePercent * 100) / 100
    const stripeFee = Math.round((amount * stripeFeePercent + stripeFixedFee) * 100) / 100
    const netAmount = Math.round((amount - platformFee - stripeFee) * 100) / 100

    return {
      grossAmount: amount,
      platformFee,
      stripeFee,
      netAmount
    }
  }

  // Create payment with fee breakdown
  async createPaymentWithFees(
    jobId: string,
    tradieId: string,
    helperId: string,
    amount: number
  ): Promise<{ payment: Payment | null; feeBreakdown: PaymentFeeBreakdown; error: string | null }> {
    try {
      const feeBreakdown = StripeService.calculateFees(amount)

      const { data: payment, error } = await supabase
        .from('payments')
        .insert([{
          job_id: jobId,
          tradie_id: tradieId,
          helper_id: helperId,
          amount: amount,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        return { payment: null, feeBreakdown, error: 'Failed to create payment record' }
      }

      // Create transaction records
      const transactions = [
        {
          payment_id: payment.id,
          type: 'charge',
          amount: feeBreakdown.grossAmount,
          platform_fee: feeBreakdown.platformFee,
          stripe_fee: feeBreakdown.stripeFee,
          net_amount: feeBreakdown.netAmount,
          created_at: new Date().toISOString()
        }
      ]

      await supabase
        .from('payment_transactions')
        .insert(transactions)

      return { payment: payment as Payment, feeBreakdown, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      const emptyFeeBreakdown: PaymentFeeBreakdown = {
        grossAmount: 0,
        platformFee: 0,
        stripeFee: 0,
        netAmount: 0
      }
      return { payment: null, feeBreakdown: emptyFeeBreakdown, error: 'Network error creating payment' }
    }
  }

  // Automatic ID verification integration placeholder
  async verifyIdentityDocument(
    userId: string,
    documentType: 'drivers_license' | 'passport' | 'national_id',
    frontImageUrl: string,
    backImageUrl?: string
  ): Promise<{ verified: boolean; confidence: number; error: string | null }> {
    try {
      // This would integrate with KYC providers like FrankieOne or SumSub for AU market
      const response = await fetch('/api/kyc/verify-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          documentType,
          frontImageUrl,
          backImageUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { verified: false, confidence: 0, error: data.error || 'Identity verification failed' }
      }

      return { verified: data.verified, confidence: data.confidence, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { verified: false, confidence: 0, error: 'Network error during identity verification' }
    }
  }

  // Bank account validation for AU helpers
  async validateAustralianBankAccount(
    accountNumber: string,
    bsb: string,
    accountHolderName: string
  ): Promise<{ valid: boolean; accountDetails?: BankAccountDetails; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/validate-au-bank-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber,
          bsb,
          accountHolderName
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { valid: false, error: data.error || 'Bank account validation failed' }
      }

      return { valid: data.valid, accountDetails: data.accountDetails, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { valid: false, error: 'Network error validating bank account' }
    }
  }
}

export const stripeService = StripeService.getInstance()