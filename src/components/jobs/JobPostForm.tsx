import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface JobPostFormProps {
  onSuccess?: (jobId: string) => void
}

export const JobPostForm: React.FC<JobPostFormProps> = ({ onSuccess }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date_time: '',
    duration_hours: 4,
    pay_rate: 35
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    // Validate future date
    const selectedDate = new Date(formData.date_time)
    if (selectedDate <= new Date()) {
      setError('Job date must be in the future')
      setLoading(false)
      return
    }

    try {
      const { data, error: jobError } = await supabase
        .from('jobs')
        .insert({
          tradie_id: user.id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date_time: formData.date_time,
          duration_hours: formData.duration_hours,
          pay_rate: formData.pay_rate
        })
        .select()
        .single()

      if (jobError) {
        setError(jobError.message)
      } else {
        onSuccess?.(data.id)
      }
    } catch {
      setError('Failed to create job')
    }
    
    setLoading(false)
  }

  const totalPay = formData.duration_hours * formData.pay_rate

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            placeholder="e.g., Site cleanup - morning shift"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Describe the work involved, requirements, and any special instructions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
            placeholder="123 Example St, Sydney NSW"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.date_time}
              onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (hours) *
            </label>
            <input
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) }))}
              required
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pay Rate ($/hour) *
          </label>
          <input
            type="number"
            value={formData.pay_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, pay_rate: parseFloat(e.target.value) }))}
            required
            min="20"
            max="100"
            step="0.50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-1">
            Total payment: ${totalPay.toFixed(2)} ({formData.duration_hours} hours × ${formData.pay_rate}/hour)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Posting Job...' : 'Post Job'}
        </button>
      </form>
    </div>
  )
}