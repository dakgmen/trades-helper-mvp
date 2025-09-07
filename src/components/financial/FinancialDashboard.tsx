import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'

interface Payment {
  id: string
  amount: number
  fee_amount: number
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  job_title: string
  client_name: string
  due_date?: string
}

interface EarningsData {
  totalEarnings: number
  pendingPayments: number
  averageJobEarnings: number
  totalFees: number
  monthlyGrowth: number
  pendingGrowth: number
  averageGrowth: number
}

export function FinancialDashboard() {
  const { user } = useAuth()
  // TODO: const profile = useAuth().profile // Currently unused
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingPayments: 0,
    averageJobEarnings: 0,
    totalFees: 0,
    monthlyGrowth: 0,
    pendingGrowth: 0,
    averageGrowth: 0
  })
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { showSuccess, showError } = useToast()

  const fetchFinancialData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch payment history
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          job:jobs!job_id(
            title,
            client:profiles!client_id(full_name)
          )
        `)
        .eq('payee_id', user.id)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      const processedPayments = (payments || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        fee_amount: payment.fee_amount || 0,
        status: payment.status,
        created_at: payment.created_at,
        job_title: payment.job?.title || 'Direct Payment',
        client_name: payment.job?.client?.full_name || 'Unknown Client',
        due_date: payment.due_date
      }))

      const completedPayments = processedPayments.filter(p => p.status === 'completed')
      const pendingPaymentsList = processedPayments.filter(p => p.status === 'pending')

      // Calculate earnings data
      const totalEarnings = completedPayments.reduce((sum, p) => sum + p.amount, 0)
      const totalPending = pendingPaymentsList.reduce((sum, p) => sum + p.amount, 0)
      const totalFees = completedPayments.reduce((sum, p) => sum + p.fee_amount, 0)
      const averageEarnings = completedPayments.length > 0 ? totalEarnings / completedPayments.length : 0

      setEarnings({
        totalEarnings,
        pendingPayments: totalPending,
        averageJobEarnings: averageEarnings,
        totalFees,
        monthlyGrowth: 10, // Mock data
        pendingGrowth: -5, // Mock data
        averageGrowth: 2 // Mock data
      })

      setPaymentHistory(completedPayments.slice(0, 10))
      setPendingPayments(pendingPaymentsList)

    } catch (error) {
      console.error('Error fetching financial data:', error)
      showError('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }, [user, showError])

  useEffect(() => {
    if (user) {
      fetchFinancialData()
    }
  }, [user, fetchFinancialData])

  const exportData = async () => {
    try {
      setExporting(true)
      
      // Create CSV content
      const csvContent = [
        ['Date', 'Job', 'Client', 'Amount', 'Fee', 'Net Amount', 'Status'],
        ...paymentHistory.map(payment => [
          new Date(payment.created_at).toLocaleDateString('en-AU'),
          payment.job_title,
          payment.client_name,
          `$${payment.amount}`,
          `$${payment.fee_amount}`,
          `$${payment.amount - payment.fee_amount}`,
          payment.status
        ])
      ].map(row => row.join(',')).join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Financial data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      showError('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const generateTaxReport = async () => {
    try {
      setExporting(true)
      
      // Generate tax report data
      const taxData = {
        totalIncome: earnings.totalEarnings,
        totalFees: earnings.totalFees,
        netIncome: earnings.totalEarnings - earnings.totalFees,
        period: `January - ${new Date().toLocaleDateString('en-AU', { month: 'long' })} ${new Date().getFullYear()}`,
        payments: paymentHistory.length
      }

      // Create tax report content
      const reportContent = `
TAX REPORT - TRADIEHELPER
========================

Period: ${taxData.period}
Generated: ${new Date().toLocaleDateString('en-AU')}

INCOME SUMMARY
--------------
Total Gross Income: $${taxData.totalIncome.toFixed(2)} AUD
Platform Fees: $${taxData.totalFees.toFixed(2)} AUD
Net Income: $${taxData.netIncome.toFixed(2)} AUD
Number of Jobs: ${taxData.payments}

MONTHLY BREAKDOWN
-----------------
${paymentHistory.map(payment => 
  `${new Date(payment.created_at).toLocaleDateString('en-AU')}: $${payment.amount.toFixed(2)} (Fee: $${payment.fee_amount.toFixed(2)})`
).join('\n')}

Note: Please consult with a qualified tax professional for proper tax advice.
This report is for informational purposes only.
      `.trim()

      // Download report
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess('Tax report generated successfully!')
    } catch (error) {
      console.error('Error generating tax report:', error)
      showError('Failed to generate tax report')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <EnhancedNavigation />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600">Manage your earnings, payments, and fees effectively.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportData}
                variant="outline"
                loading={exporting}
                disabled={exporting}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Data
              </Button>
              <Button
                onClick={generateTaxReport}
                variant="primary"
                loading={exporting}
                disabled={exporting}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V6H8l-2-2z" clipRule="evenodd" />
                </svg>
                Tax Report
              </Button>
            </div>
          </div>

          {/* Earnings Overview Cards */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="card-standard p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(earnings.totalEarnings)}
              </p>
              <p className="text-green-600 text-sm font-medium flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{earnings.monthlyGrowth}% from last month
              </p>
            </div>

            <div className="card-standard p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(earnings.pendingPayments)}
              </p>
              <p className="text-orange-600 text-sm font-medium flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {earnings.pendingGrowth}% from last month
              </p>
            </div>

            <div className="card-standard p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Average Job Earnings</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(earnings.averageJobEarnings)}
              </p>
              <p className="text-green-600 text-sm font-medium flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{earnings.averageGrowth}% from last month
              </p>
            </div>
          </div>

          {/* Payment History Table */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
          <div className="card-standard overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString('en-AU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.job_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payment.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="badge badge-green">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Payments Table */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Payments</h2>
          <div className="card-standard overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString('en-AU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.job_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payment.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        {payment.due_date ? new Date(payment.due_date).toLocaleDateString('en-AU') : 'TBD'}
                      </td>
                    </tr>
                  ))}
                  {pendingPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No pending payments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Breakdown Charts */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fee Breakdown</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Total Fees Chart */}
            <div className="card-standard p-6">
              <div className="mb-4">
                <p className="text-base font-medium text-gray-900">Total Fees Paid</p>
                <p className="text-gray-600 text-sm">This Month</p>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-4">
                {formatCurrency(earnings.totalFees)}
              </p>
              <div className="h-48 flex items-end gap-4">
                {[40, 50, 40, 80, 100].map((height, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                    <div 
                      className="bg-blue-600 w-full rounded-t-sm"
                      style={{ height: `${height}%` }}
                    ></div>
                    <p className="text-xs text-gray-600">
                      {new Date().toLocaleDateString('en-AU', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Distribution by Job Type */}
            <div className="card-standard p-6">
              <div className="mb-4">
                <p className="text-base font-medium text-gray-900">Fee Distribution by Job Type</p>
                <p className="text-gray-600 text-sm">This Month</p>
              </div>
              <div className="h-48 flex items-end gap-4">
                {[
                  { name: 'Plumbing', height: 20 },
                  { name: 'Electrical', height: 70 },
                  { name: 'Gardening', height: 80 },
                  { name: 'Painting', height: 90 },
                  { name: 'Carpentry', height: 70 }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                    <div 
                      className="bg-green-600 w-full rounded-t-sm"
                      style={{ height: `${item.height}%` }}
                    ></div>
                    <p className="text-xs text-center text-gray-600">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileNavigation />
    </div>
  )
}