import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

interface Application {
  id: string
  job_id: string
  helper_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  proposed_rate?: number
  cover_message: string
  availability: string
  estimated_hours?: number
  created_at: string
  updated_at: string
  job?: {
    title: string
    budget: number
    location: string
    urgency: string
    client_id: string
    client?: {
      full_name: string
    }
  }
  helper?: {
    full_name: string
    email: string
    phone?: string
    rating?: number
    completed_jobs?: number
  }
}

interface ApplicationFormData {
  cover_message: string
  proposed_rate: number
  availability: string
  estimated_hours: number
}

export function ApplicationManagement() {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [statusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { showSuccess, showError } = useToast()

  const [formData, setFormData] = useState<ApplicationFormData>({
    cover_message: '',
    proposed_rate: 0,
    availability: '',
    estimated_hours: 0
  })

  const APPLICATIONS_PER_PAGE = 10

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs!job_id(
            title,
            budget,
            location,
            urgency,
            client_id,
            client:profiles!client_id(full_name)
          ),
          helper:profiles!helper_id(
            full_name,
            email,
            phone,
            rating,
            completed_jobs
          )
        `)
        .order('created_at', { ascending: false })

      // Filter based on user role
      if (profile?.role === 'helper') {
        query = query.eq('helper_id', user?.id)
      } else if (profile?.role === 'tradie') {
        // Get applications for jobs owned by this tradie
        const { data: clientJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('client_id', user?.id)
        
        if (clientJobs && clientJobs.length > 0) {
          const jobIds = clientJobs.map(job => job.id)
          query = query.in('job_id', jobIds)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      showError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role, showError])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const applyFilters = useCallback(() => {
    let filtered = [...applications]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(app =>
        app.job?.title.toLowerCase().includes(search) ||
        app.helper?.full_name.toLowerCase().includes(search) ||
        app.cover_message.toLowerCase().includes(search)
      )
    }

    // Pagination
    const startIndex = (currentPage - 1) * APPLICATIONS_PER_PAGE
    const paginatedApplications = filtered.slice(startIndex, startIndex + APPLICATIONS_PER_PAGE)
    setFilteredApplications(paginatedApplications)
    setTotalPages(Math.ceil(filtered.length / APPLICATIONS_PER_PAGE))
  }, [applications, statusFilter, searchTerm, currentPage])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const submitApplication = async () => {
    if (!selectedJobId || !formData.cover_message || !formData.availability) {
      showError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: selectedJobId,
          helper_id: user?.id,
          cover_message: formData.cover_message,
          proposed_rate: formData.proposed_rate || null,
          availability: formData.availability,
          estimated_hours: formData.estimated_hours || null,
          status: 'pending'
        })

      if (error) throw error

      setFormData({
        cover_message: '',
        proposed_rate: 0,
        availability: '',
        estimated_hours: 0
      })
      setSelectedJobId('')
      setShowApplicationForm(false)
      showSuccess('Application submitted successfully!')
      fetchApplications()
    } catch (error) {
      console.error('Error submitting application:', error)
      showError('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error

      // If accepting an application, update the job status and assign helper
      if (status === 'accepted') {
        const application = applications.find(app => app.id === applicationId)
        if (application) {
          await supabase
            .from('jobs')
            .update({
              status: 'assigned',
              assigned_helper_id: application.helper_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', application.job_id)

          // Reject other pending applications for this job
          await supabase
            .from('job_applications')
            .update({ status: 'rejected' })
            .eq('job_id', application.job_id)
            .eq('status', 'pending')
            .neq('id', applicationId)
        }
      }

      showSuccess(`Application ${status} successfully!`)
      fetchApplications()
    } catch (error) {
      console.error('Error updating application:', error)
      showError(`Failed to ${status} application`)
    }
  }

  // withdrawApplication function removed as it's not used in current implementation

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-yellow'
      case 'accepted': return 'badge-green'
      case 'rejected': return 'badge-red'
      case 'withdrawn': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
         style={{
           '--primary-color': '#2563eb',
           '--secondary-color': '#16a34a',
           '--accent-color': '#ea580c',
           fontFamily: '"Work Sans", sans-serif'
         } as React.CSSProperties}>
      
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 shadow-sm">
          <div className="flex items-center gap-3 text-gray-800">
            <svg className="h-8 w-8 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_535)">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48"></rect></clipPath>
              </defs>
            </svg>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">TradieHelper</h1>
          </div>
          <nav className="flex flex-1 justify-center items-center gap-8">
            <a className="text-gray-600 hover:text-[var(--primary-color)] text-sm font-medium leading-normal transition-colors" href="/dashboard">Dashboard</a>
            <a className="text-gray-600 hover:text-[var(--primary-color)] text-sm font-medium leading-normal transition-colors" href="/jobs">Jobs</a>
            <a className="text-[var(--primary-color)] text-sm font-semibold leading-normal" href="/applications">Applications</a>
            <a className="text-gray-600 hover:text-[var(--primary-color)] text-sm font-medium leading-normal transition-colors" href="/messages">Messages</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white shadow-md" 
                 style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxH0R9acUZdKJryKm8dFNCgqUcXVM5CYVpySE1IfXXv0IuUs5mKCBHV1tDQuWTOleoVN1UW20eZHFDgeqv-9Ty-K5Dv0lFb1lt7n1BfahgcWzi7IRliVG_r4Pv5jWDHYLrthsfy1BbdnqUOHchQcjtqxp_J8qaj-VHbXOGn-HCmNeTan6nDSr0rnwWAdO3VHVd1HGolV9p8RMKuT-EJkt-eE8d0_DmbbuGyzj9_JsY6Dv50g1TJ0gv2Blh_JHwwwIxzFrgRfNqbXhe")'}}></div>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Manage Applications</h2>
              <p className="text-gray-500 mt-1">Review, accept, or reject job applications.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <p className="text-gray-500 text-sm font-medium">Total Applications</p>
                <p className="text-gray-900 text-3xl font-bold mt-1">{applications.length}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-orange-200">
                <p className="text-orange-600 text-sm font-medium">Pending</p>
                <p className="text-gray-900 text-3xl font-bold mt-1">{applications.filter(app => app.status === 'pending').length}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
                <p className="text-green-600 text-sm font-medium">Accepted</p>
                <p className="text-gray-900 text-3xl font-bold mt-1">{applications.filter(app => app.status === 'accepted').length}</p>
              </div>
            </div>


            {/* Applications List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Pending Applications ({applications.filter(app => app.status === 'pending').length})
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input 
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]" 
                      placeholder="Filter by job..." 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredApplications.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1 1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                    <p className="text-gray-600">
                      {profile?.role === 'helper' 
                        ? 'You haven\'t submitted any job applications yet'
                        : 'No applications have been submitted for your jobs yet'
                      }
                    </p>
                  </div>
                ) : (
                  filteredApplications.map((application) => (
                    <div key={application.id} className="p-6 flex flex-col md:flex-row items-start gap-6 hover:bg-gray-50 transition-colors">
                      <div className="w-full md:w-48 h-32 bg-center bg-no-repeat bg-cover rounded-md flex-shrink-0 bg-gray-200" 
                           style={{backgroundImage: `url(https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=128&fit=crop&crop=face)`}}>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{application.helper?.full_name || 'Unknown Helper'}</p>
                            <p className="text-sm text-gray-500">Applied for: <span className="font-medium text-gray-700">{application.job?.title}</span></p>
                            <p className="text-xs text-gray-400 mt-1">Applied · {formatDate(application.created_at)}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            application.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Rate: ${application.proposed_rate || 45}/hr AUD</p>
                        <div className="mt-4 flex items-center gap-3">
                          {profile?.role === 'tradie' && application.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                className="px-4 py-2 text-sm font-medium text-white bg-[var(--secondary-color)] rounded-md hover:bg-green-700 transition-colors">
                                Accept
                              </button>
                              <button 
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-color)] rounded-md hover:bg-red-700 transition-colors">
                                Reject
                              </button>
                            </>
                          )}
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                            Message
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedApplication(application)
                              setShowApplicationModal(true)
                            }}
                            className="text-sm font-medium text-[var(--primary-color)] hover:underline">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-center">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" fillRule="evenodd"></path>
                      </svg>
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={page === currentPage 
                            ? "px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--primary-color)]" 
                            : "px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="px-4 py-2 text-sm font-medium text-gray-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Application Form Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Application</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter job ID..."
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="form-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Message *
                    </label>
                    <textarea
                      placeholder="Explain why you're the right person for this job..."
                      value={formData.cover_message}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_message: e.target.value }))}
                      rows={4}
                      className="form-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Hourly Rate (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.proposed_rate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposed_rate: parseFloat(e.target.value) || 0 }))}
                      className="form-field w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Weekdays 9am-5pm"
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                      className="form-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.estimated_hours || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                      className="form-field w-full"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={submitApplication}
                    variant="primary"
                    loading={submitting}
                    disabled={submitting || !selectedJobId || !formData.cover_message || !formData.availability}
                    className="flex-1"
                  >
                    Submit Application
                  </Button>
                  <Button
                    onClick={() => setShowApplicationForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Details Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedApplication.job?.title}
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <span className={`badge ${getStatusColor(selectedApplication.status)}`}>
                        {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                      </span>
                      <span className="badge badge-gray">{selectedApplication.job?.location}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cover Message</h4>
                    <p className="text-gray-700">{selectedApplication.cover_message}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Applied:</span> {formatDate(selectedApplication.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span> {formatDate(selectedApplication.updated_at)}
                        </div>
                        <div>
                          <span className="font-medium">Availability:</span> {selectedApplication.availability}
                        </div>
                        {selectedApplication.proposed_rate && (
                          <div>
                            <span className="font-medium">Proposed Rate:</span> {formatCurrency(selectedApplication.proposed_rate)}/hr
                          </div>
                        )}
                        {selectedApplication.estimated_hours && (
                          <div>
                            <span className="font-medium">Estimated Hours:</span> {selectedApplication.estimated_hours}h
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Budget:</span> {formatCurrency(selectedApplication.job?.budget || 0)}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {selectedApplication.job?.location}
                        </div>
                        <div>
                          <span className="font-medium">Urgency:</span> {selectedApplication.job?.urgency}
                        </div>
                        {profile?.role === 'helper' && selectedApplication.job?.client && (
                          <div>
                            <span className="font-medium">Client:</span> {selectedApplication.job.client.full_name}
                          </div>
                        )}
                        {profile?.role === 'tradie' && selectedApplication.helper && (
                          <div>
                            <span className="font-medium">Helper:</span> {selectedApplication.helper.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setShowApplicationModal(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}