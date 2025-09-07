import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { useToast } from '../ui/Toast'

interface PaymentFormData {
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  saveCard: boolean
  paymentMethod: 'card' | 'paypal' | 'bank'
}

interface SecurePaymentFlowProps {
  jobId?: string
  amount?: number
  onPaymentComplete?: (paymentId: string) => void
  onCancel?: () => void
}

export function SecurePaymentFlow({ 
  jobId, 
  amount, 
  onPaymentComplete
}: SecurePaymentFlowProps) {
  const { user } = useAuth()
  // TODO: const profile = useAuth().profile // Currently unused
  const [loading, setLoading] = useState(false)
  // TODO: const [job, setJob] = useState<Job | null>(null) // Currently unused
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({})
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    saveCard: false,
    paymentMethod: 'card'
  })
  const { showSuccess, showError } = useToast()

  // Fixed amounts for demo (TODO: Could use amount prop instead)
  const paymentAmount = amount || 250.00
  const platformFee = (amount || 250.00) * 0.05
  // TODO: const totalAmount = paymentAmount + platformFee // Currently unused

  // TODO: useEffect for fetchJobDetails removed since job state is unused
  // useEffect(() => { if (jobId) { fetchJobDetails() } }, [jobId])

  // TODO: fetchJobDetails function removed since job state is unused
  // const fetchJobDetails = async () => { ... }

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {}

    if (!formData.cardNumber.replace(/\s/g, '')) {
      newErrors.cardNumber = 'Card number is required'
    } else if (formData.cardNumber.replace(/\s/g, '').length < 15) {
      newErrors.cardNumber = 'Invalid card number'
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required'
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid format (MM/YY)'
    }

    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required'
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV'
    }

    if (!formData.nameOnCard.trim()) {
      newErrors.nameOnCard = 'Name on card is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '')
    }
    return v
  }

  const handleInputChange = (field: keyof PaymentFormData, value: string | boolean) => {
    if (field === 'cardNumber' && typeof value === 'string') {
      value = formatCardNumber(value)
    } else if (field === 'expiryDate' && typeof value === 'string') {
      value = formatExpiryDate(value)
    } else if (field === 'cvv' && typeof value === 'string') {
      value = value.replace(/[^0-9]/g, '').substring(0, 4)
    }

    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const processPayment = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // In a real implementation, you would:
      // 1. Create Stripe payment intent
      // 2. Process the payment securely
      // 3. Store payment record in database

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          amount: paymentAmount,
          fee_amount: platformFee,
          status: 'completed',
          job_id: jobId,
          payer_id: user?.id,
          payee_id: null, // TODO: Need to get tradie_id from jobId or prop
          stripe_payment_intent_id: `pi_mock_${Date.now()}`
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update job status if this was a job payment
      if (jobId) {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ status: 'assigned' })
          .eq('id', jobId)

        if (jobError) throw jobError
      }

      showSuccess('Payment processed successfully!')
      onPaymentComplete?.(paymentData.id)

    } catch (error) {
      console.error('Payment error:', error)
      showError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Removed unused formatCurrency function

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-gray-50" 
      style={{ 
        fontFamily: "'Work Sans','Noto Sans',sans-serif",
        '--color-primary': '#2563EB',
        '--color-secondary': '#16A34A', 
        '--color-accent': '#EA580C',
        '--color-neutral-100': '#F3F4F6',
        '--color-neutral-200': '#E5E7EB',
        '--color-neutral-500': '#6B7280',
        '--color-neutral-800': '#1F2937',
        '--color-neutral-900': '#111827'
      } as React.CSSProperties
    }>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto flex items-center justify-between whitespace-nowrap px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_535)">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48"></rect></clipPath>
              </defs>
            </svg>
            <h1 className="text-2xl font-bold text-[var(--color-neutral-900)]">TradieHelper</h1>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a className="hover:text-[var(--color-primary)]" href="#">Find Work</a>
            <a className="hover:text-[var(--color-primary)]" href="#">Find Tradies</a>
            <a className="hover:text-[var(--color-primary)]" href="#">Pricing</a>
            <a className="hover:text-[var(--color-primary)]" href="#">Help</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex min-w-[90px] items-center justify-center rounded-lg h-10 px-4 text-sm font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100">
              <span className="truncate">Log In</span>
            </button>
            <button className="flex min-w-[90px] items-center justify-center rounded-lg h-10 px-4 bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-blue-700">
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="bg-white p-8 shadow-lg rounded-xl">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-[var(--color-neutral-900)]">Secure Payment</h2>
              <p className="mt-2 text-sm text-[var(--color-neutral-500)]">
                We use escrow to protect your payment until the job is marked as complete. This ensures peace of mind for everyone.
              </p>
            </div>

            {/* Order Summary */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">Order Summary</h3>
              <div className="mt-4 space-y-4 rounded-lg border border-[var(--color-neutral-200)] bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <p className="text-[var(--color-neutral-500)]">Job Total</p>
                  <p className="font-medium text-[var(--color-neutral-800)]">$250.00 AUD</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-[var(--color-neutral-500)]">TradieHelper Fee (5%)</p>
                  <p className="font-medium text-[var(--color-neutral-800)]">$12.50 AUD</p>
                </div>
                <div className="flex justify-between border-t border-[var(--color-neutral-200)] pt-4 text-base font-bold">
                  <p className="text-[var(--color-neutral-800)]">Total Amount Due</p>
                  <p className="text-[var(--color-primary)]">$262.50 AUD</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">Payment Method</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-neutral-200)] p-4 text-sm font-medium text-[var(--color-neutral-800)] ring-2 ring-transparent has-[:checked]:ring-[var(--color-primary)] has-[:checked]:border-[var(--color-primary)]">
                  Credit Card
                  <input 
                    checked={formData.paymentMethod === 'card'} 
                    className="sr-only" 
                    name="payment-method" 
                    type="radio" 
                    value="card"
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-neutral-200)] p-4 text-sm font-medium text-[var(--color-neutral-800)] ring-2 ring-transparent has-[:checked]:ring-[var(--color-primary)] has-[:checked]:border-[var(--color-primary)]">
                  PayPal
                  <input 
                    checked={formData.paymentMethod === 'paypal'} 
                    className="sr-only" 
                    name="payment-method" 
                    type="radio" 
                    value="paypal"
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-neutral-200)] p-4 text-sm font-medium text-[var(--color-neutral-800)] ring-2 ring-transparent has-[:checked]:ring-[var(--color-primary)] has-[:checked]:border-[var(--color-primary)]">
                  Bank Transfer
                  <input 
                    checked={formData.paymentMethod === 'bank'} 
                    className="sr-only" 
                    name="payment-method" 
                    type="radio" 
                    value="bank"
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* Payment Form */}
            <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); processPayment() }}>
              <div className="space-y-4 rounded-md">
                <div>
                  <label className="sr-only" htmlFor="card-number">Card Number</label>
                  <input 
                    className="form-input relative block w-full appearance-none rounded-md border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-3 py-3 text-sm placeholder-[var(--color-neutral-500)] focus:z-10 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_2px_var(--color-primary)]" 
                    id="card-number" 
                    name="card-number" 
                    placeholder="Card Number" 
                    required 
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    maxLength={19}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="sr-only" htmlFor="expiry-date">Expiry Date (MM/YY)</label>
                    <input 
                      className="form-input relative block w-full appearance-none rounded-md border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-3 py-3 text-sm placeholder-[var(--color-neutral-500)] focus:z-10 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_2px_var(--color-primary)]" 
                      id="expiry-date" 
                      name="expiry-date" 
                      placeholder="Expiry Date (MM/YY)" 
                      required 
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      maxLength={5}
                    />
                    {errors.expiryDate && (
                      <p className="mt-1 text-xs text-red-600">{errors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="cvv">CVV</label>
                    <input 
                      className="form-input relative block w-full appearance-none rounded-md border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-3 py-3 text-sm placeholder-[var(--color-neutral-500)] focus:z-10 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_2px_var(--color-primary)]" 
                      id="cvv" 
                      name="cvv" 
                      placeholder="CVV" 
                      required 
                      type="text"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      maxLength={4}
                    />
                    {errors.cvv && (
                      <p className="mt-1 text-xs text-red-600">{errors.cvv}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="sr-only" htmlFor="name-on-card">Name on Card</label>
                  <input 
                    className="form-input relative block w-full appearance-none rounded-md border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-3 py-3 text-sm placeholder-[var(--color-neutral-500)] focus:z-10 focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_2px_var(--color-primary)]" 
                    id="name-on-card" 
                    name="name-on-card" 
                    placeholder="Name on Card" 
                    required 
                    type="text"
                    value={formData.nameOnCard}
                    onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                  />
                  {errors.nameOnCard && (
                    <p className="mt-1 text-xs text-red-600">{errors.nameOnCard}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <input 
                  className="h-4 w-4 rounded border-[var(--color-neutral-200)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" 
                  id="save-card" 
                  name="save-card" 
                  type="checkbox"
                  checked={formData.saveCard}
                  onChange={(e) => handleInputChange('saveCard', e.target.checked)}
                />
                <label className="ml-2 block text-sm text-[var(--color-neutral-800)]" htmlFor="save-card">
                  Save this card for future payments
                </label>
              </div>
              <div>
                <button 
                  className="group relative flex w-full justify-center rounded-lg border border-transparent bg-[var(--color-primary)] py-3 px-4 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Pay $262.50 AUD'}
                </button>
              </div>
            </form>

            {/* Security Information */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[var(--color-secondary)]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path>
                </svg>
                <span className="text-xs text-gray-500">SSL Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[var(--color-secondary)]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3z"></path>
                </svg>
                <span className="text-xs text-gray-500">PCI Compliant</span>
              </div>
              <img alt="Stripe logo" className="h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmD5RM1RYmPrCBECmnxhlxjkNcsk_dMg534pjw6pOSiMPtgzKe3A2XgQCci5E_RdzjmZoQkq4YRBjxGdwCNYxCK8rH6flCUcpcW1Ep-B4qTbpclzKmZDeWhZJ06ZkgbQ83wO5BPrGvW3R6EtCEMBKr2wwzLtbC27Mw_EG5AfIWyuCGvxVHNHp43ubXxSk1eZMVTTZZLpMz_aFvOPbFyHVlYQaK4aRcWsvswFBdOJaWRVa_iNW1LehGekCp98wCWzSI1h2JuUKRJqn3"/>
            </div>
            <p className="mt-4 text-center text-xs text-[var(--color-neutral-500)]">
              Your payment is processed securely. By clicking "Pay", you agree to our{' '}
              <a className="font-medium text-[var(--color-primary)] hover:underline" href="#">Terms of Service</a>
              . We do not store your full card details on our servers.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}