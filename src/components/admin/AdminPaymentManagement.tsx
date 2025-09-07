import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
// TODO: import { StatCard } from '../ui/StatCard' // Currently unused
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

interface Payment {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
  job_id: string
  payer_id: string
  payee_id: string
  stripe_payment_intent_id?: string
  fee_amount: number
  payer?: {
    full_name: string
    email: string
  }
  payee?: {
    full_name: string
    email: string
  }
  job?: {
    title: string
  }
}

interface PaymentStats {
  totalRevenue: number
  pendingPayments: number
  averageTransaction: number
  revenueGrowth: number
  pendingGrowth: number
  averageGrowth: number
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'failed' | 'refunded'

export function AdminPaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    averageTransaction: 0,
    revenueGrowth: 0,
    pendingGrowth: 0,
    averageGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  // TODO: const [searchTerm, setSearchTerm] = useState('') // Currently unused - filtering not implemented
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedPayment] = useState<Payment | null>(null) // setSelectedPayment currently unused
  const [showPaymentModal, setShowPaymentModal] = useState(false) // Currently unused
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { /* showSuccess, */ showError } = useToast() // showSuccess currently unused

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payer:profiles!payer_id(full_name, email),
          payee:profiles!payee_id(full_name, email),
          job:jobs!job_id(title)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPayments(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      showError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [showError])

  const calculateStats = (paymentsData: Payment[]) => {
    const completed = paymentsData.filter(p => p.status === 'completed')
    const pending = paymentsData.filter(p => p.status === 'pending')
    
    const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0)
    const averageTransaction = completed.length > 0 ? totalRevenue / completed.length : 0

    // Mock growth percentages - in production, compare with previous period
    setStats({
      totalRevenue,
      pendingPayments: pendingAmount,
      averageTransaction,
      revenueGrowth: 10,
      pendingGrowth: -5,
      averageGrowth: 2
    })
  }

  const filterPayments = useCallback(() => {
    let filtered = payments

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // TODO: Filter by search term
    // if (searchTerm) {
    //   const term = searchTerm.toLowerCase()
    //   filtered = filtered.filter(payment => 
    //     payment.id.toLowerCase().includes(term) ||
    //     payment.payer?.full_name?.toLowerCase().includes(term) ||
    //     payment.payer?.email.toLowerCase().includes(term) ||
    //     payment.payee?.full_name?.toLowerCase().includes(term) ||
    //     payment.payee?.email.toLowerCase().includes(term) ||
    //     payment.job?.title?.toLowerCase().includes(term)
    //   )
    // }

    setFilteredPayments(filtered)
    setCurrentPage(1)
  }, [payments, statusFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    filterPayments()
  }, [filterPayments])

  // TODO: Function currently unused - payment details modal functionality not implemented
  // const openPaymentDetails = (payment: Payment) => {
  //   setSelectedPayment(payment)
  //   setShowPaymentModal(true)
  // }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const exportData = () => {
    const csvContent = [
      ['Transaction ID', 'Date', 'Payer', 'Payee', 'Amount', 'Fee', 'Status', 'Job'].join(','),
      ...filteredPayments.map(p => [
        p.id,
        formatDate(p.created_at),
        p.payer?.full_name || 'Unknown',
        p.payee?.full_name || 'Unknown',
        p.amount,
        p.fee_amount,
        p.status,
        p.job?.title || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="flex min-h-screen text-neutral-800" style={{ fontFamily: 'Work Sans, sans-serif' }}>
        <aside className="w-64 flex-shrink-0 bg-neutral-900 text-white flex flex-col">
          <div className="flex items-center justify-center p-6 border-b border-neutral-700">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
            <h1 className="text-xl font-bold ml-3">TradieHelper</h1>
          </div>
          <div className="animate-pulse p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="animate-pulse p-8 bg-neutral-100">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-lg border"></div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen text-neutral-800" style={{ fontFamily: 'Work Sans, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-neutral-900 text-white flex flex-col">
        <div className="flex items-center justify-center p-6 border-b border-neutral-700">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_6_535)">
              <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
            </g>
            <defs>
              <clipPath id="clip0_6_535">
                <rect fill="white" height="48" width="48"></rect>
              </clipPath>
            </defs>
          </svg>
          <h1 className="text-xl font-bold ml-3">TradieHelper</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a className="flex items-center px-4 py-2 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-md" href="/admin">
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Dashboard
          </a>
          <a className="flex items-center px-4 py-2 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-md" href="/admin/jobs">
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Jobs
          </a>
          <a className="flex items-center px-4 py-2 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-md" href="/admin/users">
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a4 4 0 110-5.292" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Users
          </a>
          <a className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md" href="/admin/payments">
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Payments
          </a>
          <a className="flex items-center px-4 py-2 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-md" href="/admin/disputes">
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Support
          </a>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-end h-16 px-6">
            <button className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            <div className="ml-4 h-10 w-10 bg-center bg-no-repeat aspect-square bg-cover rounded-full" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAzumI-BodvLw_hlyKlAj7du47zGOr1CxZGi6kpMztm16-0nSzgT-ij7_qIOC0pZc8RjLTNdxXeUOYULgPJ5ZaH-QOEfAWtKkxuEKEPHnr2mo14QwHABN46GirBy6-XLDXwTGV2vFmGZYtGXXktZZMc55-P7vKMPsHcFQOZOjww62TRH9RlYCGL9Bnyf2T6bH4ct6cPfV7XvcIOGSd2Et_9tPAB19mPUtLzxlgU_6kfJ5MGVP1EaQSkJzny1mLPHrRFPMTQY100IlRT")' }}></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 p-8">
          <div className="container mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900">Payments Overview</h2>
              <p className="text-neutral-600 mt-1">Manage all financial transactions, including payment history, pending payments, and fee breakdowns.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-neutral-200">
                <p className="text-neutral-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <p className="ml-1 text-sm font-semibold">+{stats.revenueGrowth}% from last month</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-neutral-200">
                <p className="text-neutral-600 font-medium">Pending Payments</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{formatCurrency(stats.pendingPayments)}</p>
                <div className="flex items-center mt-2 text-orange-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <p className="ml-1 text-sm font-semibold">{stats.pendingGrowth}% from last month</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-neutral-200">
                <p className="text-neutral-600 font-medium">Average Transaction</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{formatCurrency(stats.averageTransaction)}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <p className="ml-1 text-sm font-semibold">+{stats.averageGrowth}% from last month</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
              <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-neutral-900">Payment History</h3>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setStatusFilter(statusFilter === 'all' ? 'pending' : 'all')}
                    className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    Filter
                  </button>
                  <button 
                    onClick={exportData}
                    className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"></path>
                    </svg>
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-neutral-600">
                  <thead className="text-xs text-neutral-700 uppercase bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3" scope="col">Transaction ID</th>
                      <th className="px-6 py-3" scope="col">Date (AEST)</th>
                      <th className="px-6 py-3" scope="col">User</th>
                      <th className="px-6 py-3" scope="col">Amount (AUD)</th>
                      <th className="px-6 py-3 text-center" scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment, index) => (
                      <tr key={payment.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-neutral-50 border-b'}>
                        <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap">
                          {payment.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">{formatDate(payment.created_at)}</td>
                        <td className="px-6 py-4">{payment.payer?.full_name || 'Unknown User'}</td>
                        <td className="px-6 py-4">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {formatStatus(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paginatedPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-neutral-500">
                          No payments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-neutral-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
                </span>
                <div className="flex items-center space-x-1">
                  <a 
                    className="px-3 py-1 rounded-md text-neutral-600 hover:bg-neutral-100 cursor-pointer" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                  {[...Array(Math.min(3, totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <a
                        key={pageNum}
                        className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </a>
                    )
                  })}
                  {totalPages > 3 && (
                    <>
                      <span className="px-3 py-1">...</span>
                      <a 
                        className="px-3 py-1 rounded-md text-neutral-600 hover:bg-neutral-100 cursor-pointer" 
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </a>
                    </>
                  )}
                  <a 
                    className="px-3 py-1 rounded-md text-neutral-600 hover:bg-neutral-100 cursor-pointer" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Payment Details Modal */}
        {selectedPayment && (
          <Modal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            title="Payment Details"
            size="lg"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Transaction Info</h4>
                  <div className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedPayment.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">{formatCurrency(selectedPayment.amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Platform Fee</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(selectedPayment.fee_amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                          {formatStatus(selectedPayment.status)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.created_at)}</dd>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Parties Involved</h4>
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payer</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedPayment.payer?.full_name || 'Unknown User'}
                        <br />
                        <span className="text-gray-500">{selectedPayment.payer?.email}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payee</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedPayment.payee?.full_name || 'Unknown User'}
                        <br />
                        <span className="text-gray-500">{selectedPayment.payee?.email}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Related Job</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedPayment.job?.title || 'No job linked'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayment.stripe_payment_intent_id && (
                <div className="pt-4 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-500">Stripe Payment Intent</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                    {selectedPayment.stripe_payment_intent_id}
                  </dd>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}