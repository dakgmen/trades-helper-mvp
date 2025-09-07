import React, { useState, useEffect, useCallback } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface Job {
  id: string
  title: string
  description: string
  category: string
  location: string
  budget_min: number
  budget_max: number
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  applications_count: number
  tradie_id: string
}

interface JobStats {
  activeJobs: number
  totalApplications: number
  completedJobs: number
}

export const JobManagementDashboard: React.FC = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<JobStats>({
    activeJobs: 0,
    totalApplications: 0,
    completedJobs: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active')

  const fetchData = useCallback(async () => {
    if (user) {
      await fetchJobs()
      await fetchStats()
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchJobs = async () => {
    if (!user) return

    try {
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select(`
          *,
          applications!inner(count)
        `)
        .eq('tradie_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }

      // Process jobs with application counts
      const processedJobs = jobsData?.map(job => ({
        ...job,
        applications_count: job.applications?.length || 0
      })) || []

      setJobs(processedJobs)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user) return

    try {
      // Get job counts
      const { data: activeJobsData } = await supabase
        .from('jobs')
        .select('id')
        .eq('tradie_id', user.id)
        .in('status', ['open', 'in_progress'])

      const { data: completedJobsData } = await supabase
        .from('jobs')
        .select('id')
        .eq('tradie_id', user.id)
        .eq('status', 'completed')

      // Get total applications count
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, job:job_id(tradie_id)')
        .eq('job.tradie_id', user.id)

      setStats({
        activeJobs: activeJobsData?.length || 0,
        completedJobs: completedJobsData?.length || 0,
        totalApplications: applicationsData?.length || 0
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleEditJob = (jobId: string) => {
    window.location.href = `/jobs/edit/${jobId}`
  }

  const handleViewDetails = (jobId: string) => {
    window.location.href = `/jobs/detail/${jobId}`
  }

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('tradie_id', user!.id)

      if (error) {
        console.error('Error cancelling job:', error)
        alert('Failed to cancel job. Please try again.')
        return
      }

      // Refresh jobs and stats
      fetchJobs()
      fetchStats()
    } catch (error) {
      console.error('Failed to cancel job:', error)
      alert('Failed to cancel job. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { bg: 'bg-green-100', text: 'text-green-800', label: 'Open' },
      in_progress: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'In Progress' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-orange-600" />
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const activeJobs = jobs.filter(job => ['open', 'in_progress'].includes(job.status))
  const pastJobs = jobs.filter(job => ['completed', 'cancelled'].includes(job.status))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 bg-white px-10 py-3">
        <div className="flex items-center gap-4 text-gray-800">
          <div className="h-8 w-8 text-blue-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-gray-900 text-xl font-bold leading-tight tracking-[-0.015em]">TradieHelper</h1>
        </div>
        <nav className="flex items-center gap-6">
          <a className="text-gray-600 hover:text-blue-600 text-sm font-medium leading-normal" href="/dashboard">Dashboard</a>
          <a className="text-blue-600 text-sm font-medium leading-normal" href="/jobs/manage">Jobs</a>
          <a className="text-gray-600 hover:text-blue-600 text-sm font-medium leading-normal" href="/applications">Applications</a>
          <a className="text-gray-600 hover:text-blue-600 text-sm font-medium leading-normal" href="/messages">Messages</a>
        </nav>
        <div className="flex flex-1 justify-end gap-4 items-center">
          <button className="flex items-center justify-center rounded-full h-10 w-10 bg-gray-100 hover:bg-gray-200 text-gray-600">
            <BellIcon className="h-5 w-5" />
          </button>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 bg-gray-300" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-10 flex flex-1 justify-center py-8">
        <div className="flex flex-col w-full max-w-6xl">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-gray-900 text-3xl font-bold leading-tight">Job Management Dashboard</h1>
              <p className="text-gray-500 text-base font-normal leading-normal">
                Manage your active and past job postings, review applications, and update job details.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/jobs/post'}
              className="flex items-center justify-center gap-2 rounded-md h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Post a New Job
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mb-8">
            <h2 className="text-gray-800 text-xl font-bold leading-tight tracking-[-0.015em] mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-orange-600" />
                  <p className="text-gray-600 text-base font-medium leading-normal">Active Jobs</p>
                </div>
                <p className="text-gray-900 tracking-tight text-4xl font-bold leading-tight">{stats.activeJobs}</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <EyeIcon className="h-5 w-5 text-blue-600" />
                  <p className="text-gray-600 text-base font-medium leading-normal">Total Applications</p>
                </div>
                <p className="text-gray-900 tracking-tight text-4xl font-bold leading-tight">{stats.totalApplications}</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <p className="text-gray-600 text-base font-medium leading-normal">Jobs Completed</p>
                </div>
                <p className="text-gray-900 tracking-tight text-4xl font-bold leading-tight">{stats.completedJobs}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'active'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Active Jobs ({activeJobs.length})
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'past'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Past Jobs ({pastJobs.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-gray-800 text-xl font-bold leading-tight tracking-[-0.015em]">
                  {activeTab === 'active' ? 'Active Jobs' : 'Past Jobs'}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(activeTab === 'active' ? activeJobs : pastJobs).map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(job.status)}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {job.applications_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${job.budget_min} - ${job.budget_max}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(job.id)}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View
                            </button>
                            {activeTab === 'active' && (
                              <>
                                <button
                                  onClick={() => handleEditJob(job.id)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCancelJob(job.id)}
                                  className="text-red-600 hover:text-red-700 flex items-center gap-1"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(activeTab === 'active' ? activeJobs : pastJobs).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No {activeTab === 'active' ? 'active' : 'past'} jobs found
                      </h3>
                      <p className="text-sm">
                        {activeTab === 'active' 
                          ? "You don't have any active jobs. Post your first job to get started!"
                          : "You don't have any completed or cancelled jobs yet."
                        }
                      </p>
                      {activeTab === 'active' && (
                        <button 
                          onClick={() => window.location.href = '/jobs/post'}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Post a Job
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default JobManagementDashboard