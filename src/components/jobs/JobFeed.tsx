import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Job } from '../../types'
import { JobCard } from './JobCard'

interface JobFeedProps {
  userRole?: 'helper' | 'tradie'
}

export const JobFeed: React.FC<JobFeedProps> = ({ userRole = 'helper' }) => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    location: '',
    minPayRate: '',
    maxDistance: '',
    skills: [] as string[]
  })

  useEffect(() => {
    fetchJobs()
    
    // Subscribe to real-time job updates
    const subscription = supabase
      .channel('jobs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        () => fetchJobs()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          profiles:tradie_id (
            full_name,
            verified
          )
        `)
        .eq('status', 'open')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      if (filters.minPayRate) {
        query = query.gte('pay_rate', parseFloat(filters.minPayRate))
      }

      const { data, error: fetchError } = await query.limit(20)

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setJobs(data || [])
      }
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleApplyToJob = async (jobId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: applyError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          helper_id: user.id
        })

      if (applyError) {
        if (applyError.code === '23505') { // Unique constraint violation
          alert('You have already applied to this job')
        } else {
          alert('Failed to apply to job')
        }
      } else {
        alert('Application submitted successfully!')
        fetchJobs() // Refresh to update application status
      }
    } catch {
      alert('Failed to apply to job')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Available Jobs</h2>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Sydney"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Pay Rate ($/hour)
              </label>
              <input
                type="number"
                value={filters.minPayRate}
                onChange={(e) => setFilters(prev => ({ ...prev, minPayRate: e.target.value }))}
                placeholder="25"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Filter Jobs
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No jobs available matching your criteria
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onApply={userRole === 'helper' ? () => handleApplyToJob(job.id) : undefined}
              showApplyButton={userRole === 'helper'}
            />
          ))}
        </div>
      )}
    </div>
  )
}