import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '../../lib/supabase'

interface ApplicationHistory {
  id: string
  job_id: string
  helper_id: string
  tradie_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed' | 'cancelled'
  applied_at: string
  updated_at: string
  response_message?: string
  completion_date?: string
  rating?: number
  review?: string
  payment_status?: 'pending' | 'completed' | 'refunded'
  job: {
    title: string
    description: string
    category: string
    location: string
    budget_min: number
    budget_max: number
    duration_hours: number
    start_date: string
    status: string
  }
  tradie: {
    id: string
    full_name: string
    avatar_url?: string
    rating?: number
    reviews_count: number
  }
  helper?: {
    id: string
    full_name: string
    avatar_url?: string
    rating?: number
    reviews_count: number
  }
}

interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  completed: number
  success_rate: number
  avg_response_time: number
}

export const ApplicationHistoryView: React.FC = () => {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState<ApplicationHistory[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationHistory | null>(null)
  
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const fetchData = useCallback(async () => {
    if (user) {
      await fetchApplicationHistory()
      await fetchApplicationStats()
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData, filterStatus, filterPeriod, sortBy])

  const fetchApplicationHistory = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(
            title, description, category, location, 
            budget_min, budget_max, duration_hours, 
            start_date, status
          )
        `)

      // Filter by user role
      if (profile?.role === 'helper') {
        query = query.eq('helper_id', user?.id)
      } else if (profile?.role === 'tradie') {
        query = query.eq('jobs.tradie_id', user?.id)
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      // Apply period filter
      if (filterPeriod !== 'all') {
        const now = new Date()
        let dateThreshold: Date

        switch (filterPeriod) {
          case 'week':
            dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'quarter':
            dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            dateThreshold = new Date(0)
        }

        query = query.gte('applied_at', dateThreshold.toISOString())
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('applied_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('applied_at', { ascending: true })
          break
        case 'status':
          query = query.order('status', { ascending: true })
          break
        case 'budget':
          query = query.order('job.budget_max', { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching application history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('status, applied_at, updated_at')
        .eq(profile?.role === 'helper' ? 'helper_id' : 'tradie_id', user?.id)

      if (error) throw error

      if (data && data.length > 0) {
        const total = data.length
        const pending = data.filter(a => a.status === 'pending').length
        const accepted = data.filter(a => a.status === 'accepted').length
        const rejected = data.filter(a => a.status === 'rejected').length
        const completed = data.filter(a => a.status === 'completed').length
        
        const success_rate = total > 0 ? (accepted + completed) / total * 100 : 0

        // Calculate average response time (simplified)
        const responseTimes = data
          .filter(a => a.status !== 'pending' && a.applied_at && a.updated_at)
          .map(a => new Date(a.updated_at).getTime() - new Date(a.applied_at).getTime())
        
        const avg_response_time = responseTimes.length > 0 
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60 * 60)
          : 0

        setStats({
          total,
          pending,
          accepted,
          rejected,
          completed,
          success_rate,
          avg_response_time
        })
      }
    } catch (error) {
      console.error('Error fetching application stats:', error)
    }
  }

  const withdrawApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error

      await fetchApplicationHistory()
      await fetchApplicationStats()
    } catch (error) {
      console.error('Error withdrawing application:', error)
    }
  }

  const reapplyToJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          helper_id: user?.id,
          status: 'pending',
          applied_at: new Date().toISOString()
        })

      if (error) throw error

      await fetchApplicationHistory()
      await fetchApplicationStats()
    } catch (error) {
      console.error('Error reapplying to job:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'accepted':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'withdrawn':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'completed':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'cancelled':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return ClockIcon
      case 'accepted':
        return CheckCircleIcon
      case 'rejected':
        return XCircleIcon
      case 'withdrawn':
        return ArrowPathIcon
      case 'completed':
        return CheckCircleIcon
      case 'cancelled':
        return ExclamationTriangleIcon
      default:
        return DocumentTextIcon
    }
  }

  const ApplicationCard: React.FC<{ application: ApplicationHistory }> = ({ application }) => {
    const StatusIcon = getStatusIcon(application.status)
    const isHelper = profile?.role === 'helper'
    const otherUser = isHelper ? application.tradie : application.helper

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {application.job.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {application.job.description}
            </p>
            
            {/* Other User Info */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                {otherUser?.avatar_url ? (
                  <img 
                    src={otherUser.avatar_url} 
                    alt={otherUser.full_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {otherUser?.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {isHelper ? 'Tradie: ' : 'Helper: '}{otherUser?.full_name}
              </span>
              {otherUser?.rating && (
                <div className="flex items-center space-x-1">
                  <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {otherUser.rating.toFixed(1)} ({otherUser.reviews_count})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="ml-4">
            <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getStatusColor(application.status)}`}>
              <StatusIcon className="w-4 h-4 inline mr-1" />
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <div className="flex items-center space-x-1 text-gray-600">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span>${application.job.budget_min} - ${application.job.budget_max}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>{application.job.duration_hours}h</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span>{application.job.location}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{new Date(application.job.start_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Application Timeline */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Applied: {new Date(application.applied_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(application.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Response Message */}
        {application.response_message && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Response:</h4>
            <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
              {application.response_message}
            </p>
          </div>
        )}

        {/* Rating & Review (for completed jobs) */}
        {application.status === 'completed' && application.rating && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-green-800">Job Completed</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`w-4 h-4 ${i < application.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            {application.review && (
              <p className="text-sm text-green-700">{application.review}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedApplication(application)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View Details</span>
          </button>
          
          <div className="flex space-x-2">
            {application.status === 'pending' && isHelper && (
              <button
                onClick={() => withdrawApplication(application.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Withdraw
              </button>
            )}
            
            {application.status === 'rejected' && isHelper && application.job.status === 'open' && (
              <button
                onClick={() => reapplyToJob(application.job_id)}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
              >
                Reapply
              </button>
            )}
            
            {application.status === 'accepted' && (
              <button className="px-3 py-1 text-sm text-green-600 border border-green-300 rounded">
                <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-1" />
                Message
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ApplicationDetailModal: React.FC = () => {
    if (!selectedApplication) return null

    const StatusIcon = getStatusIcon(selectedApplication.status)
    const isHelper = profile?.role === 'helper'
    const otherUser = isHelper ? selectedApplication.tradie : selectedApplication.helper

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedApplication.job.title}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getStatusColor(selectedApplication.status)}`}>
                    <StatusIcon className="w-4 h-4 inline mr-1" />
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {selectedApplication.job.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Job Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-gray-700">{selectedApplication.job.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Budget:</span>
                      <p className="text-lg font-semibold text-green-600">
                        ${selectedApplication.job.budget_min} - ${selectedApplication.job.budget_max} AUD
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Duration:</span>
                      <p className="text-gray-700">{selectedApplication.job.duration_hours} hours</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Location:</span>
                      <p className="text-gray-700">{selectedApplication.job.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Start Date:</span>
                      <p className="text-gray-700">
                        {new Date(selectedApplication.job.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other User Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {isHelper ? 'Tradie Information' : 'Helper Information'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {otherUser?.avatar_url ? (
                        <img 
                          src={otherUser.avatar_url} 
                          alt={otherUser.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-gray-600">
                          {otherUser?.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{otherUser?.full_name}</h4>
                      {otherUser?.rating && (
                        <div className="flex items-center space-x-1">
                          <StarIconSolid className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {otherUser.rating.toFixed(1)} ({otherUser.reviews_count} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Timeline */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Application Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Application Submitted</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedApplication.applied_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {selectedApplication.status !== 'pending' && (
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(selectedApplication.status)}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Application {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedApplication.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.completion_date && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Job Completed</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedApplication.completion_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Response Message */}
              {selectedApplication.response_message && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Response Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedApplication.response_message}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                
                {selectedApplication.status === 'accepted' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
                    Send Message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application History
              </h1>
              <p className="text-gray-600">
                Track all your {profile?.role === 'helper' ? 'job applications' : 'received applications'} in one place
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-gray-600">Total Applications</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.success_rate.toFixed(1)}%</p>
                  <p className="text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  <p className="text-gray-600">Pending</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <StarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.avg_response_time.toFixed(1)}h</p>
                  <p className="text-gray-600">Avg Response</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="status">Status</option>
                  <option value="budget">Highest Budget</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-600 mb-6">
              {profile?.role === 'helper' 
                ? "You haven't applied to any jobs yet. Start browsing available jobs to find opportunities that match your skills."
                : "You haven't received any applications yet. Create job postings to start receiving applications from helpers."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}

        {/* Load More */}
        {applications.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Load More Applications
            </button>
          </div>
        )}
      </main>

      {selectedApplication && <ApplicationDetailModal />}
      <MobileNavigation />
    </div>
  )
}