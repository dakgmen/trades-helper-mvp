import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { JobCard } from './JobCard'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import type { Job } from '../../types'

export function MyJobsPage() {
  const { user, profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchMyJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from('jobs').select('*')

      if (profile?.role === 'tradie') {
        // Tradie sees jobs they posted
        query = query.eq('tradie_id', user?.id)
      } else if (profile?.role === 'helper') {
        // Helper sees jobs they're assigned to
        query = query.eq('assigned_helper_id', user?.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setJobs((data || []) as Job[])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role])

  useEffect(() => {
    if (user) {
      fetchMyJobs()
    }
  }, [user, fetchMyJobs])

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true
    return job.status === activeTab
  })

  const getJobCounts = () => {
    const counts = {
      all: jobs.length,
      open: jobs.filter(j => j.status === 'open').length,
      assigned: jobs.filter(j => j.status === 'assigned').length,
      in_progress: jobs.filter(j => j.status === 'in_progress').length,
      completed: jobs.filter(j => j.status === 'completed').length,
    }
    return counts
  }

  const counts = getJobCounts()

  if (loading) {
    return (
      <div>
        <EnhancedNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
        <MobileNavigation />
      </div>
    )
  }

  return (
    <div>
      <EnhancedNavigation />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {profile?.role === 'tradie' ? 'My Posted Jobs' : 'My Assigned Jobs'}
          </h1>
          <p className="text-gray-600">
            {profile?.role === 'tradie' 
              ? 'Manage and track all jobs you\'ve posted' 
              : 'View and manage jobs you\'re working on'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'open', label: 'Open', count: counts.open },
              { key: 'assigned', label: 'Assigned', count: counts.assigned },
              { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
              { key: 'completed', label: 'Completed', count: counts.completed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'all' 
                ? profile?.role === 'tradie' 
                  ? "You haven't posted any jobs yet."
                  : "You haven't been assigned to any jobs yet."
                : `No ${activeTab.replace('_', ' ')} jobs found.`
              }
            </p>
            {profile?.role === 'tradie' && (
              <button
                onClick={() => window.location.href = '/jobs/post'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showManageButton={true}
                onManage={() => fetchMyJobs()}
              />
            ))}
          </div>
        )}
      </div>
      <MobileNavigation />
    </div>
  )
}