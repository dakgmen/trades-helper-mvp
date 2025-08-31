import React, { useState } from 'react'
import { DisputeService } from '../../services/disputeService'
import type { DisputeReason } from '../../types'

interface DisputeFormProps {
  jobId: string
  againstUserId: string
  onSuccess: () => void
  onCancel: () => void
}

export const DisputeForm: React.FC<DisputeFormProps> = ({
  jobId,
  againstUserId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    reason: '' as DisputeReason,
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reasonOptions: { value: DisputeReason; label: string; description: string }[] = [
    {
      value: 'payment',
      label: 'Payment Issue',
      description: 'Issues with payment processing, amount, or timeline'
    },
    {
      value: 'work_quality',
      label: 'Work Quality',
      description: 'Work was not completed to expected standards'
    },
    {
      value: 'no_show',
      label: 'No Show',
      description: 'Person did not show up for the scheduled work'
    },
    {
      value: 'safety',
      label: 'Safety Concern',
      description: 'Safety rules or regulations were not followed'
    },
    {
      value: 'communication',
      label: 'Communication',
      description: 'Poor or lack of communication during the job'
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Other issues not covered by the above categories'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reason || !formData.description.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get current user ID from auth context (simplified)
      const userId = 'current-user-id' // This would come from auth context
      
      const dispute = await DisputeService.createDispute({
        job_id: jobId,
        raised_by_id: userId,
        against_id: againstUserId,
        reason: formData.reason,
        description: formData.description
      })

      if (dispute) {
        onSuccess()
      } else {
        setError('Failed to create dispute. Please try again.')
      }
    } catch {
      setError('An error occurred while creating the dispute.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Raise a Dispute</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Disputes should only be raised for legitimate issues. 
              False or frivolous disputes may result in account restrictions.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Reason for Dispute *
          </label>
          <div className="space-y-3">
            {reasonOptions.map((option) => (
              <div key={option.value} className="flex items-start">
                <input
                  type="radio"
                  id={option.value}
                  name="reason"
                  value={option.value}
                  checked={formData.reason === option.value}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reason: e.target.value as DisputeReason 
                  }))}
                  className="mt-1 mr-3 text-blue-600"
                  required
                />
                <label htmlFor={option.value} className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide a detailed explanation of the issue, including dates, specific incidents, and any relevant context..."
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum 50 characters. Be specific and factual.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || formData.description.length < 50}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </div>
      </form>
    </div>
  )
}