import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Payment } from '../../types'

// Extended Payment type with joined data
type PaymentWithDetails = Payment & {
  jobs: { title: string; status: string }
  tradie: { full_name: string }
  helper: { full_name: string }
}
import { useAuth } from '../../context/AuthContext'

interface PaymentStatusProps {
  jobId?: string
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ jobId }) => {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('payments')
        .select(`
          *,
          jobs (
            id,
            title,
            status
          ),
          tradie:tradie_id (
            full_name
          ),
          helper:helper_id (
            full_name
          )
        `)
        .or(`tradie_id.eq.${user.id},helper_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setPayments(data || [])
      }
    } catch {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [user, jobId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleReleasePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (error) throw error

      await fetchPayments()
      alert('Payment released successfully!')
    } catch (err) {
      alert('Failed to release payment')
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'escrow': return 'bg-blue-100 text-blue-800'
      case 'released': return 'bg-green-100 text-green-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Payment Required'
      case 'escrow': return 'Held in Escrow'
      case 'released': return 'Released to Helper'
      case 'refunded': return 'Refunded to Tradie'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No payments found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Status</h3>
      
      {payments.map(payment => {
        const isTradie = payment.tradie_id === user?.id
        const canRelease = isTradie && payment.status === 'escrow' && payment.jobs.status === 'completed'
        
        return (
          <div key={payment.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold">{payment.jobs.title}</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Amount:</strong> ${payment.amount.toFixed(2)}</p>
                  <p><strong>Between:</strong> {payment.tradie.full_name} → {payment.helper.full_name}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                {getStatusText(payment.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div>
                <strong>Created:</strong> {new Date(payment.created_at).toLocaleString()}
              </div>
              {payment.released_at && (
                <div>
                  <strong>Released:</strong> {new Date(payment.released_at).toLocaleString()}
                </div>
              )}
              {payment.stripe_payment_id && (
                <div>
                  <strong>Stripe ID:</strong> {payment.stripe_payment_id}
                </div>
              )}
            </div>

            {payment.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Payment Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This job requires upfront payment to secure the booking.</p>
                    </div>
                    <div className="mt-4">
                      <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                        Pay Now (Mock)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {payment.status === 'escrow' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Payment Secured
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Payment is held securely until job completion.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {canRelease && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleReleasePayment(payment.id)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Release Payment
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}