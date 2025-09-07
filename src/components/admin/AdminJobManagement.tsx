import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { Modal, ConfirmModal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

interface Job {
  id: string
  title: string
  description: string
  category: string
  location: string
  budget: number
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'pending_approval'
  created_at: string
  tradie_id: string
  assigned_helper_id?: string
  applications_count?: number
  tradie?: {
    full_name: string
    email: string
  }
  helper?: {
    full_name: string
    email: string
  }
}

type FilterTab = 'all' | 'active' | 'completed' | 'draft'

export function AdminJobManagement() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'suspend' | 'delete'>('approve')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const { showSuccess, showError } = useToast()

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          tradie:profiles!tradie_id(full_name, email),
          helper:profiles!assigned_helper_id(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get application counts for each job
      const jobsWithCounts = await Promise.all(
        (data || []).map(async (job) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact' })
            .eq('job_id', job.id)
          
          return { ...job, applications_count: count || 0 }
        })
      )

      setJobs(jobsWithCounts)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      showError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [showError])

  const filterJobs = useCallback(() => {
    let filtered = jobs

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(job => job.status === 'open' || job.status === 'assigned' || job.status === 'in_progress')
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(job => job.status === 'completed')
    } else if (activeTab === 'draft') {
      filtered = filtered.filter(job => job.status === 'pending_approval')
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.id.toLowerCase().includes(term) ||
        job.category.toLowerCase().includes(term)
      )
    }

    setFilteredJobs(filtered)
    setCurrentPage(1)
  }, [jobs, activeTab, searchTerm])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    filterJobs()
  }, [filterJobs])

  const handleJobAction = async (job: Job, action: 'approve' | 'suspend' | 'delete') => {
    setSelectedJob(job)
    setActionType(action)
    setShowConfirmModal(true)
  }

  const confirmAction = async () => {
    if (!selectedJob) return

    try {
      const updateData: Partial<Pick<Job, 'status'>> = {}
      
      switch (actionType) {
        case 'approve':
          updateData.status = 'open'
          break
        case 'suspend':
          updateData.status = 'cancelled'
          break
        case 'delete': {
          const { error: deleteError } = await supabase
            .from('jobs')
            .delete()
            .eq('id', selectedJob.id)
          
          if (deleteError) throw deleteError
          showSuccess('Job deleted successfully')
          break
        }
      }

      if (actionType !== 'delete') {
        const { error } = await supabase
          .from('jobs')
          .update(updateData)
          .eq('id', selectedJob.id)

        if (error) throw error
        showSuccess(`Job ${actionType}d successfully`)
      }

      await fetchJobs()
      setShowConfirmModal(false)
      setSelectedJob(null)

    } catch (error) {
      console.error(`Error ${actionType}ing job:`, error)
      showError(`Failed to ${actionType} job`)
    }
  }

  const openJobDetails = (job: Job) => {
    setSelectedJob(job)
    setShowJobModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-600'
      case 'assigned': return 'bg-green-100 text-green-600'  
      case 'in_progress': return 'bg-green-100 text-green-600'
      case 'completed': return 'bg-neutral-200 text-neutral-600'
      case 'cancelled': return 'bg-neutral-200 text-neutral-600'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-600'
      default: return 'bg-neutral-200 text-neutral-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'open': return 'Active'
      case 'assigned': return 'Active'
      case 'in_progress': return 'Active'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Completed'
      case 'pending_approval': return 'Pending Approval'
      default: return status.replace('_', ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }

  const tabs = [
    { key: 'all', label: 'All Jobs' },
    { key: 'active', label: 'Active Jobs' },
    { key: 'completed', label: 'Completed Jobs' },
    { key: 'draft', label: 'Drafts' },
  ]

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="relative flex min-h-screen">
        <aside className="fixed top-0 left-0 z-20 h-full w-64 bg-neutral-900 text-neutral-100 flex flex-col">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
            <div className="size-8 text-blue-600">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold">TradieHelper</h2>
          </div>
          <div className="animate-pulse p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
        </aside>
        <div className="ml-64 flex-1">
          <div className="animate-pulse p-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen" style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}>
      {/* Sidebar Navigation */}
      <aside className="fixed top-0 left-0 z-20 h-full w-64 bg-neutral-900 text-neutral-100 flex flex-col transition-transform duration-300 ease-in-out">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <div className="size-8 text-blue-600">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold">TradieHelper</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-800" href="/admin">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.75 3v18h16.5V3H3.75Zm4.5 0v18m8.25-18v18M3.75 12h16.5M3.75 6h16.5m-16.5 12h16.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Dashboard
          </a>
          <a className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium bg-blue-600 text-white" href="/admin/jobs">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.429 9.75L21 12m0 0l-6.429 2.25M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Jobs
          </a>
          <a className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-800" href="/admin/users">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-3.74-2.72a3 3 0 0 0-4.682 2.72 9.094 9.094 0 0 0 3.742.479m-3.742-.479a3 3 0 0 0-4.682-2.72M12 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-3.74-2.72a3 3 0 0 0-4.682 2.72 9.094 9.094 0 0 0 3.742.479M12 18.72a3 3 0 0 0 4.682 2.72m-8.424-2.72a3 3 0 0 0-4.682 2.72M12 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Users
          </a>
          <a className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-800" href="/admin/payments">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m-6 2.25h6M12 15.75h4.5m-4.5 2.25h4.5m-4.5 2.25h4.5M3.75 15.75h.75v3.75h-.75V15.75Zm13.5 0h.75v3.75h-.75V15.75Z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Payments
          </a>
          <a className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-800" href="/admin/disputes">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18.25 3l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            Support
          </a>
        </nav>
      </aside>

      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-neutral-300 px-10 py-3 bg-white">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-neutral-800">Jobs</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center justify-center rounded-full size-10 bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
              <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCq2GhBOgl-J2Ofos1-XM3Hdqbc-FIm4nWIM4JmM7xSlmxWDHH3L_Izr4vv8qFNzRrCx7pOCRme8FqiP687XNihe9KtjlkTgwgPm4RpVDHQkL3HNOQcZuOoH3WrAJniwwwX3wVFV5EKcxWaPBCKaDh6MxW0Zq9HJ1v0rJRAd7WXJKWSXdakA1FnFcDBQ1f8Dexv08lM6-e8JcB8ARQSKxGWK4pzNp_QsqLsRTvEVMArVI9xf9hztH3faKBLKJuUvPpd4e6rcXTp7nv4")' }}></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-neutral-500 mb-6">Manage all job listings, including viewing details, editing status, and managing applications.</p>
            
            {/* Search and Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg bg-white text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="Search jobs by ID, title, or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center justify-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" fillRule="evenodd"></path>
                </svg>
                <span>Add New Job</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-300 mb-6">
              <nav className="flex gap-8 -mb-px">
                {tabs.map(tab => (
                  <a
                    key={tab.key}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveTab(tab.key as FilterTab)
                    }}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm ${
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {tab.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {paginatedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-neutral-500">
                      {searchTerm ? `No jobs found matching "${searchTerm}"` : 'No jobs found'}
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left text-neutral-500">
                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                      <tr>
                        <th className="px-6 py-3" scope="col">Job ID</th>
                        <th className="px-6 py-3" scope="col">Title</th>
                        <th className="px-6 py-3" scope="col">Location</th>
                        <th className="px-6 py-3" scope="col">Posted Date</th>
                        <th className="px-6 py-3" scope="col">Status</th>
                        <th className="px-6 py-3 text-center" scope="col">Applications</th>
                        <th className="px-6 py-3 text-right" scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJobs.map((job) => (
                        <tr key={job.id} className="bg-white border-b hover:bg-neutral-50">
                          <th className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap" scope="row">
                            #{job.id.slice(0, 5)}
                          </th>
                          <td className="px-6 py-4">{job.title}</td>
                          <td className="px-6 py-4">{job.location}</td>
                          <td className="px-6 py-4">{formatDate(job.created_at)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                              {formatStatus(job.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">{job.applications_count}</td>
                          <td className="px-6 py-4 text-right">
                            <a 
                              className="font-medium text-blue-600 hover:underline cursor-pointer" 
                              onClick={() => openJobDetails(job)}
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Pagination */}
              <nav aria-label="Table navigation" className="flex items-center justify-between p-4">
                <span className="text-sm font-normal text-neutral-500">
                  Showing <span className="font-semibold text-neutral-900">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredJobs.length)}</span> of <span className="font-semibold text-neutral-900">{filteredJobs.length}</span>
                </span>
                <ul className="inline-flex -space-x-px text-sm h-8">
                  <li>
                    <a 
                      className="flex items-center justify-center px-3 h-8 ml-0 leading-tight text-neutral-500 bg-white border border-neutral-300 rounded-l-lg hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </a>
                  </li>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <li key={pageNum}>
                        <a 
                          className={`flex items-center justify-center px-3 h-8 leading-tight border border-neutral-300 cursor-pointer ${
                            currentPage === pageNum
                              ? 'text-blue-600 bg-blue-50 border-blue-600 hover:bg-blue-100 hover:text-blue-600'
                              : 'text-neutral-500 bg-white hover:bg-neutral-100 hover:text-neutral-700'
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </a>
                      </li>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <li>
                        <span className="flex items-center justify-center px-3 h-8 leading-tight text-neutral-500 bg-white border border-neutral-300">...</span>
                      </li>
                      <li>
                        <a 
                          className="flex items-center justify-center px-3 h-8 leading-tight text-neutral-500 bg-white border border-neutral-300 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer" 
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </a>
                      </li>
                    </>
                  )}
                  <li>
                    <a 
                      className="flex items-center justify-center px-3 h-8 leading-tight text-neutral-500 bg-white border border-neutral-300 rounded-r-lg hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-5">
          <p className="text-neutral-500 text-sm">© 2024 TradieHelper. All rights reserved.</p>
        </footer>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={showJobModal}
          onClose={() => setShowJobModal(false)}
          title="Job Details"
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedJob.title}</h3>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">#{selectedJob.id.slice(0, 8)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedJob.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedJob.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900">${selectedJob.budget}</dd>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedJob.status)}`}>
                        {formatStatus(selectedJob.status)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Posted By</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedJob.tradie?.full_name || 'Unknown'}
                      <br />
                      <span className="text-gray-500">{selectedJob.tradie?.email}</span>
                    </dd>
                  </div>
                  {selectedJob.helper && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Assigned Helper</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedJob.helper.full_name}
                        <br />
                        <span className="text-gray-500">{selectedJob.helper.email}</span>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Applications</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedJob.applications_count} received</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Posted Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedJob.created_at)}</dd>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Description</dt>
              <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md">
                {selectedJob.description || 'No description provided'}
              </dd>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowJobModal(false)}>
                Close
              </Button>
              {selectedJob.status === 'pending_approval' && (
                <Button 
                  variant="success" 
                  onClick={() => {
                    setShowJobModal(false)
                    handleJobAction(selectedJob, 'approve')
                  }}
                >
                  Approve Job
                </Button>
              )}
              {(selectedJob.status === 'open' || selectedJob.status === 'assigned') && (
                <Button 
                  variant="danger" 
                  onClick={() => {
                    setShowJobModal(false)
                    handleJobAction(selectedJob, 'suspend')
                  }}
                >
                  Suspend Job
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Job`}
        message={`Are you sure you want to ${actionType} "${selectedJob?.title}"?`}
        confirmText={actionType.charAt(0).toUpperCase() + actionType.slice(1)}
        variant={actionType === 'delete' ? 'danger' : 'primary'}
      />
    </div>
  )
}