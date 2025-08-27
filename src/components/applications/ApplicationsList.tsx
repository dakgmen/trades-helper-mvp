import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
// JobApplication type not used currently
import { useAuth } from '../../context/AuthContext'

interface ApplicationsListProps {
  jobId?: string
  viewType: 'tradie' | 'helper'
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({ jobId, viewType }) => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [jobId, viewType])

  const fetchApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            title,
            pay_rate,
            duration_hours,
            date_time,
            location
          ),
          helper:helper_id (
            full_name,
            phone,
            skills,
            verified
          )
        `)

      if (viewType === 'tradie') {
        // Show applications for tradie's jobs
        query = query
          .eq('jobs.tradie_id', user.id)
          .order('created_at', { ascending: false })
      } else {
        // Show helper's own applications
        query = query
          .eq('helper_id', user.id)
          .order('created_at', { ascending: false })
      }

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setApplications(data || [])
      }
    } catch (err) {
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Find the application and update job
      const application = applications.find(app => app.id === applicationId)
      if (application) {
        // Update job status and assign helper
        const { error: jobUpdateError } = await supabase
          .from('jobs')
          .update({ 
            status: 'assigned',
            assigned_helper_id: application.helper_id
          })
          .eq('id', application.job_id)

        if (jobUpdateError) throw jobUpdateError

        // Reject all other applications for this job
        const { error: rejectError } = await supabase
          .from('job_applications')
          .update({ status: 'rejected' })
          .eq('job_id', application.job_id)
          .neq('id', applicationId)

        if (rejectError) throw rejectError

        // Create payment escrow
        const totalAmount = application.jobs.pay_rate * application.jobs.duration_hours
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            job_id: application.job_id,
            tradie_id: user!.id,
            helper_id: application.helper_id,
            amount: totalAmount,
            status: 'pending'
          })

        if (paymentError) console.error('Payment creation failed:', paymentError)
      }

      await fetchApplications()
      alert('Application accepted successfully!')
    } catch (err) {
      alert('Failed to accept application')
      console.error(err)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)

      if (error) throw error

      await fetchApplications()
      alert('Application rejected')
    } catch (err) {
      alert('Failed to reject application')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {viewType === 'tradie' ? 'No applications received yet' : 'You haven\'t applied to any jobs yet'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {viewType === 'tradie' ? 'Job Applications' : 'My Applications'}
      </h3>
      
      {applications.map(application => (
        <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-semibold">{application.jobs.title}</h4>
              {viewType === 'tradie' && (
                <div className="text-sm text-gray-600">
                  <p><strong>Applicant:</strong> {application.helper.full_name}</p>
                  {application.helper.verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      ✓ Verified Helper
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
            <div>
              <strong>Location:</strong> {application.jobs.location}
            </div>
            <div>
              <strong>Date:</strong> {new Date(application.jobs.date_time).toLocaleDateString()}
            </div>
            <div>
              <strong>Pay:</strong> ${application.jobs.pay_rate}/hour ({application.jobs.duration_hours}h)
            </div>
          </div>

          {viewType === 'tradie' && application.helper.skills && (
            <div className="mb-4">
              <strong className="text-sm">Skills:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {application.helper.skills.map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {skill.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {viewType === 'tradie' && application.status === 'pending' && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleAcceptApplication(application.id)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectApplication(application.id)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reject
              </button>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            Applied: {new Date(application.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}