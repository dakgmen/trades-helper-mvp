import React, { useState } from 'react'
// TODO: import { useEffect, useCallback } from 'react' // Currently unused
// TODO: import { useAuth } from '../../context/AuthContext' // Currently unused
// TODO: import { supabase } from '../../utils/supabase' // Currently unused
// TODO: import { useToast } from '../ui/Toast' // Currently unused

// TODO: Payment interface currently unused - all functionality uses mock data
// interface Payment {
//   id: string
//   amount: number
//   fee_amount: number
//   status: 'pending' | 'completed' | 'failed' | 'refunded'
//   created_at: string
//   job_id: string
//   payer_id: string
//   payee_id: string
//   stripe_payment_intent_id?: string
//   job?: {
//     title: string
//   }
//   payer?: {
//     full_name: string
//     email: string
//   }
//   payee?: {
//     full_name: string
//     email: string
//   }
// }

// TODO: FilterStatus type currently unused (mock data doesn't use this filtering)
// type FilterStatus = 'all' | 'completed' | 'pending' | 'failed' | 'refunded'
// TODO: TransactionType type currently unused (mock data doesn't use this filtering) 
// type TransactionType = 'all' | 'income' | 'expenses'

export function PaymentHistory() {
  // TODO: const { user } = useAuth() // Currently unused - using mock data
  // TODO: const profile = useAuth().profile // Currently unused
  // TODO: const [payments, setPayments] = useState<Payment[]>([]) // Currently unused - using mockPayments instead
  // TODO: const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]) // Currently unused - using mockPayments instead
  // TODO: const [loading, setLoading] = useState(true) // Currently unused - using mockPayments instead
  const [searchTerm, setSearchTerm] = useState('')
  // TODO: const [statusFilter, setStatusFilter] = useState<FilterStatus>('all') // Currently unused - using mockPayments instead  
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'income' | 'expenses'>('all')
  // TODO: const { showError } = useToast() // Currently unused - using mock data

  // TODO: fetchPayments function currently unused - using mock data instead
  // const fetchPayments = useCallback(async () => {
  //   if (!user) return
  //   try {
  //     setLoading(true)
  //     const { data, error } = await supabase
  //       .from('payments')
  //       .select(/* SQL query */)
  //       .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
  //       .order('created_at', { ascending: false })
  //     if (error) throw error
  //     setPayments(data || [])
  //   } catch (error) {
  //     console.error('Error fetching payments:', error)
  //     showError('Failed to load payment history')
  //   } finally {
  //     setLoading(false)
  //   }
  // }, [user, showError])

  // TODO: useEffect for fetchPayments currently unused
  // useEffect(() => {
  //   if (user) {
  //     fetchPayments()
  //   }
  // }, [user, fetchPayments])

  // TODO: filterPayments function currently unused (using mock data)\n  // const filterPayments = () => { ... }

  // Mock data for demo
  const mockPayments = [
    {
      id: '1',
      date: '15 Jul 2024',
      description: 'Job: Plumbing repair at 123 Main St',
      amount: 250.00,
      status: 'completed',
      type: 'income'
    },
    {
      id: '2', 
      date: '10 Jul 2024',
      description: 'Materials: Pipes and fittings',
      amount: -75.50,
      status: 'completed',
      type: 'expense'
    },
    {
      id: '3',
      date: '05 Jul 2024', 
      description: 'Job: Electrical installation at 456 Oak Ave',
      amount: 400.00,
      status: 'pending',
      type: 'income'
    },
    {
      id: '4',
      date: '01 Jul 2024',
      description: 'Subscription fee',
      amount: -29.99,
      status: 'completed',
      type: 'expense'
    },
    {
      id: '5',
      date: '25 Jun 2024',
      description: 'Job: Carpentry work at 789 Pine Rd', 
      amount: 300.00,
      status: 'completed',
      type: 'income'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Removed unused formatCurrency function

  // TODO: Helper functions currently unused (using mock data instead of real payments)
  // const formatDate = (dateString: string) => { ... }
  // const formatStatus = (status: string) => { ... }
  // const getTransactionType = (payment: Payment) => { ... }
  // const getOtherParty = (payment: Payment) => { ... }

  const exportData = () => {
    console.log('Exporting payment data...')
    // In a real implementation, this would generate and download CSV
  }

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden bg-neutral-100" 
      style={{ 
        fontFamily: "'Work Sans', sans-serif",
        '--tw-color-primary': '#2563EB',
        '--tw-color-secondary': '#16A34A',
        '--tw-color-accent': '#EA580C',
        '--tw-color-neutral-100': '#F3F4F6',
        '--tw-color-neutral-200': '#E5E7EB',
        '--tw-color-neutral-400': '#9CA3AF',
        '--tw-color-neutral-600': '#4B5563',
        '--tw-color-neutral-800': '#1F2937'
      } as React.CSSProperties
    }>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-neutral-200 bg-white px-10 py-3">
          <div className="flex items-center gap-4 text-neutral-800">
            <a className="flex items-center gap-3" href="#">
              <svg className="text-primary" fill="none" height="32" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M2 7L12 12L22 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M12 12V22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <h2 className="text-neutral-800 text-xl font-bold leading-tight tracking-[-0.015em]">TradieHelper</h2>
            </a>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-neutral-600 hover:text-primary text-sm font-medium leading-normal" href="#">Dashboard</a>
            <a className="text-neutral-600 hover:text-primary text-sm font-medium leading-normal" href="#">Jobs</a>
            <a className="text-primary text-sm font-bold leading-normal" href="#">Payments</a>
            <a className="text-neutral-600 hover:text-primary text-sm font-medium leading-normal" href="#">Messages</a>
          </nav>
          <div className="flex flex-1 justify-end items-center gap-4">
            <button className="flex items-center justify-center rounded-full h-10 w-10 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-primary">
              <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAbs5gDmdRkSGfs2-X4TSCRd-AvFkjo2Uu2N-HeZH2lDURcRzVXEsSjAHAlumlTHUM7NN8fhgSRJelZ4_A5hb-Fhhr2o973boz7M1fJQ1r9fw-16U3POeZQwZtJZJTXkYPE6KX4_hyDh3UQUTDAjhdVzdarOWrG2C9w8bYqK9OT415v9HCB1QPOk-bwULSk6Oo7nJ_VPAfOrMGTJ1HF41uccSsSGNeQWyxJyU0zTO5s2w0SkL18YcrT9DwMtho7DqOZstLfoXlLn6AX")'}}></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 xl:px-40 flex flex-1 justify-center py-8">
          <div className="layout-content-container flex flex-col w-full max-w-6xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-neutral-800 text-3xl font-bold leading-tight">Payment History</h1>
                <p className="text-neutral-600 text-base font-normal leading-normal">View and manage all your transactions (AEST)</p>
              </div>
              <button 
                className="btn-primary flex items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-bold bg-primary text-white hover:bg-blue-700"
                onClick={exportData}
              >
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-82.34-4.66a8,8,0,0,0,11.32,0l48-48a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L66.34,80.02a8,8,0,0,0-11.32,11.32Z"></path>
                </svg>
                <span>Export CSV</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative md:col-span-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-neutral-400" fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                    </svg>
                  </div>
                  <input 
                    className="form-input block w-full rounded-md border-neutral-200 bg-neutral-100 pl-10 pr-4 py-2 text-neutral-800 placeholder:text-neutral-400 focus:border-primary focus:ring-primary sm:text-sm" 
                    placeholder="Search by description, job ID, or amount..." 
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-start md:justify-end gap-2">
                  <button 
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-md px-4 text-sm font-medium ${
                      transactionTypeFilter === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                    onClick={() => setTransactionTypeFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-md px-4 text-sm font-medium ${
                      transactionTypeFilter === 'income' ? 'bg-primary text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                    onClick={() => setTransactionTypeFilter('income')}
                  >
                    Income
                  </button>
                  <button 
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-md px-4 text-sm font-medium ${
                      transactionTypeFilter === 'expenses' ? 'bg-primary text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                    onClick={() => setTransactionTypeFilter('expenses')}
                  >
                    Expenses
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider" scope="col">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider" scope="col">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider" scope="col">Amount (AUD)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider" scope="col">Status</th>
                      <th className="relative px-6 py-3" scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {mockPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{payment.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{payment.description}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${payment.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {payment.amount > 0 ? '+' : ''} ${Math.abs(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a className="text-primary hover:text-blue-700" href="#">View Details</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-secondary">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-neutral-600">15 Jul 2024, 10:30 AM AEST</p>
                    <h3 className="text-lg font-bold text-neutral-800 mt-1">Job Payment Received</h3>
                    <p className="text-sm text-neutral-600">From: John Citizen (Helper)</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">+ $250.00</p>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-end gap-3">
                  <button className="btn-accent flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-bold bg-accent text-white hover:bg-orange-700">
                    Dispute
                  </button>
                  <button className="btn-primary flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-bold bg-primary text-white hover:bg-blue-700">
                    Download Receipt
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-neutral-600">10 Jul 2024, 02:15 PM AEST</p>
                    <h3 className="text-lg font-bold text-neutral-800 mt-1">Material Purchase</h3>
                    <p className="text-sm text-neutral-600">Vendor: Bunnings Warehouse</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">- $75.50</p>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-end gap-3">
                  <button className="btn-accent flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-bold bg-accent text-white hover:bg-orange-700">
                    Dispute
                  </button>
                  <button className="btn-primary flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-bold bg-primary text-white hover:bg-blue-700">
                    Download Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <a className="text-base text-neutral-600 hover:text-primary" href="#">Terms of Service</a>
              <a className="text-base text-neutral-600 hover:text-primary" href="#">Privacy Policy</a>
              <a className="text-base text-neutral-600 hover:text-primary" href="#">Contact Us</a>
              <a className="text-base text-neutral-600 hover:text-primary" href="#">Help Centre</a>
            </nav>
            <p className="mt-6 text-center text-base text-neutral-400">© 2024 TradieHelper. All rights reserved. ABN 12 345 678 901.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}