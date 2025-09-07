import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

interface Dispute {
  id: string
  reason: string
  status: 'open' | 'under_review' | 'resolved' | 'closed'
  created_at: string
  resolved_at?: string
  resolution_notes?: string
  payment_id: string
  disputer_id: string
  respondent_id: string
  job_id: string
  job?: {
    title: string
  }
  disputer?: {
    full_name: string
    email: string
  }
  respondent?: {
    full_name: string
    email: string
  }
  payment?: {
    amount: number
  }
}

type FilterStatus = 'all' | 'open' | 'under_review' | 'resolved' | 'closed'

export function AdminDisputeManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { showSuccess, showError } = useToast()

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payment_disputes')
        .select(`
          *,
          job:jobs!job_id(title),
          disputer:profiles!disputer_id(full_name, email),
          respondent:profiles!respondent_id(full_name, email),
          payment:payments!payment_id(amount)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDisputes(data || [])
    } catch (error) {
      console.error('Error fetching disputes:', error)
      showError('Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }, [showError])

  const filterDisputes = useCallback(() => {
    let filtered = disputes

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(dispute => dispute.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(dispute => 
        dispute.id.toLowerCase().includes(term) ||
        dispute.job?.title?.toLowerCase().includes(term) ||
        dispute.disputer?.full_name?.toLowerCase().includes(term) ||
        dispute.respondent?.full_name?.toLowerCase().includes(term) ||
        dispute.reason.toLowerCase().includes(term)
      )
    }

    setFilteredDisputes(filtered)
    setCurrentPage(1)
  }, [disputes, searchTerm, statusFilter])

  useEffect(() => {
    fetchDisputes()
  }, [fetchDisputes])

  useEffect(() => {
    filterDisputes()
  }, [filterDisputes])

  const openDisputeDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setShowDisputeModal(true)
  }

  const openResolveModal = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setResolutionNotes('')
    setShowResolveModal(true)
  }

  const updateDisputeStatus = async (disputeId: string, status: string, notes?: string) => {
    try {
      const updateData: { status: string; updated_at: string; resolved_at?: string; resolution_notes?: string } = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
        if (notes) updateData.resolution_notes = notes
      }

      const { error } = await supabase
        .from('payment_disputes')
        .update(updateData)
        .eq('id', disputeId)

      if (error) throw error

      showSuccess(`Dispute ${status} successfully`)
      await fetchDisputes()
      setShowResolveModal(false)
      setShowDisputeModal(false)
    } catch (error) {
      console.error('Error updating dispute:', error)
      showError('Failed to update dispute')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  // Removed unused tabs variable

  // Pagination
  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDisputes = filteredDisputes.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 text-gray-800" style={{ fontFamily: 'Work Sans, sans-serif' }}>
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <img alt="TradieHelper Logo" className="h-10 w-10 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQc7tJSOIJ2hvg50SZOGXVHTjg4Or8IVo_z0SYEf4VYdwLpJR_gKxlaajQs4OdjhPPxm0SOhDxAvX-UkyUYFa2dKn-8B4aX9PwFf1Aq0We_NlV3JB4qmnerBfwXh6sohWetviZIH4v2gOLaQH_rz0cSUy2A7MRYSv81gLaM_Vh_bRZFOvXduGGLF8iTp8_SbA-FgRhv165Ml_fvUV0di7wXQCK4NoSWBn1NSbQLta8rD3HVYaxI1VrUCw3RC1G5t68KVMiZHs_fyKd"/>
            <h1 className="text-xl font-bold text-gray-900">TradieHelper</h1>
          </div>
          <div className="animate-pulse p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </aside>
        <main className="ml-64 flex-1 p-8">
          <div className="animate-pulse max-w-7xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white rounded-xl border"></div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-xl border"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800" style={{ fontFamily: 'Work Sans, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <img alt="TradieHelper Logo" className="h-10 w-10 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQc7tJSOIJ2hvg50SZOGXVHTjg4Or8IVo_z0SYEf4VYdwLpJR_gKxlaajQs4OdjhPPxm0SOhDxAvX-UkyUYFa2dKn-8B4aX9PwFf1Aq0We_NlV3JB4qmnerBfwXh6sohWetviZIH4v2gOLaQH_rz0cSUy2A7MRYSv81gLaM_Vh_bRZFOvXduGGLF8iTp8_SbA-FgRhv165Ml_fvUV0di7wXQCK4NoSWBn1NSbQLta8rD3HVYaxI1VrUCw3RC1G5t68KVMiZHs_fyKd"/>
          <h1 className="text-xl font-bold text-gray-900">TradieHelper</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" href="/admin">
            <svg className="w-5 h-5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" href="/admin/jobs">
            <svg className="w-5 h-5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <rect height="14" rx="2" ry="2" width="20" x="2" y="7"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span>Jobs</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" href="/admin/users">
            <svg className="w-5 h-5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Users</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" href="/admin/payments">
            <svg className="w-5 h-5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <rect height="12" rx="2" width="20" x="2" y="6"></rect>
              <path d="M2 12h20"></path>
            </svg>
            <span>Payments</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-semibold" href="/admin/disputes">
            <svg className="w-5 h-5" fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="m12 2-8 4v5c0 6 8 10 8 10s8-4 8-10V6l-8-4zM9.5 13.5 7 11l1.5-1.5L9.5 11l3.5-3.5L14.5 9l-5 5z"></path>
            </svg>
            <span>Disputes</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" href="/admin/settings">
            <svg className="w-5 h-5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Settings</span>
          </a>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-200">
          <a className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" href="#">
            <svg className="w-5 h-5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
            <span>Help & Support</span>
          </a>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Disputes</h1>
            <p className="text-lg text-gray-500 mt-1">Manage and resolve disputes between users on the TradieHelper platform.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-medium text-gray-500">Open Disputes</h3>
              <p className="text-4xl font-bold text-orange-600 mt-2">{disputes.filter(d => d.status === 'open').length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-medium text-gray-500">Resolved This Month</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">{disputes.filter(d => d.status === 'resolved').length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-medium text-gray-500">Avg. Resolution Time</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">3 Days</p>
            </div>
          </div>

          {/* Dispute Queue */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Dispute Queue</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" fillRule="evenodd"></path>
                  </svg>
                  <input
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Search disputes..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'all' ? 'open' : 'all')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 18v-2h18v2"></path>
                    <path d="M3 12v-2h18v2"></path>
                    <path d="M3 6V4h18v2"></path>
                  </svg>
                  Filter
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {paginatedDisputes.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'No disputes have been reported yet.'
                    }
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3" scope="col">Dispute ID</th>
                      <th className="px-6 py-3" scope="col">Job Title</th>
                      <th className="px-6 py-3" scope="col">Parties Involved</th>
                      <th className="px-6 py-3" scope="col">Status</th>
                      <th className="px-6 py-3" scope="col">Date Opened (AEST)</th>
                      <th className="px-6 py-3 text-right" scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDisputes.map((dispute) => (
                      <tr key={dispute.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          #D-{dispute.id.slice(0, 5)}
                        </td>
                        <td className="px-6 py-4">{dispute.job?.title || 'Unknown Job'}</td>
                        <td className="px-6 py-4">
                          {dispute.disputer?.full_name?.split(' ')[0] || 'Unknown'} {dispute.disputer?.full_name?.split(' ')[1]?.[0] || ''}. vs {dispute.respondent?.full_name?.split(' ')[0] || 'Unknown'} {dispute.respondent?.full_name?.split(' ')[1]?.[0] || ''}.
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dispute.status === 'open' 
                              ? 'bg-orange-100 text-orange-800'
                              : dispute.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : dispute.status === 'under_review'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {dispute.status === 'open' ? 'Open' : 
                             dispute.status === 'resolved' ? 'Resolved' :
                             dispute.status === 'under_review' ? 'Under Review' : formatStatus(dispute.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(dispute.created_at).toLocaleDateString('en-AU', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a 
                            className="font-medium text-blue-600 hover:underline cursor-pointer"
                            onClick={() => openDisputeDetails(dispute)}
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredDisputes.length)}</span> of <span className="font-semibold">{filteredDisputes.length}</span> Disputes
              </span>
              <div className="inline-flex mt-2 xs:mt-0">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-800 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-800 bg-white rounded-r-lg border-t border-b border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <Modal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          title="Dispute Details"
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Dispute Information</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dispute ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">#D-{selectedDispute.id.slice(0, 6)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDispute.status)}`}>
                        {formatStatus(selectedDispute.status)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Related Job</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedDispute.job?.title || 'Unknown Job'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Payment Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedDispute.payment ? formatCurrency(selectedDispute.payment.amount) : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date Opened</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedDispute.created_at)}</dd>
                  </div>
                  {selectedDispute.resolved_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date Resolved</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedDispute.resolved_at)}</dd>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Parties Involved</h4>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Disputer (Complainant)</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedDispute.disputer?.full_name || 'Unknown User'}
                      <br />
                      <span className="text-gray-500">{selectedDispute.disputer?.email}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Respondent</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedDispute.respondent?.full_name || 'Unknown User'}
                      <br />
                      <span className="text-gray-500">{selectedDispute.respondent?.email}</span>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Dispute Reason</dt>
              <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md">
                {selectedDispute.reason}
              </dd>
            </div>

            {selectedDispute.resolution_notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Resolution Notes</dt>
                <dd className="text-sm text-gray-900 bg-green-50 p-4 rounded-md">
                  {selectedDispute.resolution_notes}
                </dd>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowDisputeModal(false)}>
                Close
              </Button>
              {selectedDispute.status === 'open' && (
                <Button 
                  variant="warning" 
                  onClick={() => {
                    setShowDisputeModal(false)
                    updateDisputeStatus(selectedDispute.id, 'under_review')
                  }}
                >
                  Start Review
                </Button>
              )}
              {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
                <Button 
                  variant="success" 
                  onClick={() => {
                    setShowDisputeModal(false)
                    openResolveModal(selectedDispute)
                  }}
                >
                  Resolve Dispute
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Resolve Dispute Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Dispute"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide resolution notes for dispute #{selectedDispute?.id.slice(0, 6)}
            </p>
            <label htmlFor="resolutionNotes" className="form-label">
              Resolution Notes *
            </label>
            <textarea
              id="resolutionNotes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="form-field"
              rows={4}
              placeholder="Describe how this dispute was resolved and any actions taken..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={() => selectedDispute && updateDisputeStatus(selectedDispute.id, 'resolved', resolutionNotes)}
              disabled={!resolutionNotes.trim()}
            >
              Resolve Dispute
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}