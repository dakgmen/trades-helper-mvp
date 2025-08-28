import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { AnalyticsService } from '../../services/analyticsService'
import { SupportService } from '../../services/supportService'
import { DisputeService } from '../../services/disputeService'
import { BadgeService } from '../../services/badgeService'

interface DashboardStats {
  totalUsers: number
  totalJobs: number
  totalPayments: number
  pendingVerifications: number
}

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalPayments: 0,
    pendingVerifications: 0
  })
  const [pendingHelpers, setPendingHelpers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch stats in parallel
      const [usersRes, jobsRes, paymentsRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'released'),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'helper')
          .eq('verified', false)
          .not('white_card_url', 'is', null)
          .not('id_document_url', 'is', null)
      ])

      // Calculate total payments
      const totalPayments = paymentsRes.data?.reduce((sum, p) => sum + p.amount, 0) || 0

      setStats({
        totalUsers: usersRes.count || 0,
        totalJobs: jobsRes.count || 0,
        totalPayments: totalPayments,
        pendingVerifications: pendingRes.data?.length || 0
      })

      setPendingHelpers(pendingRes.data || [])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyHelper = async (helperId: string, verified: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verified })
        .eq('id', helperId)

      if (updateError) throw updateError

      // Log admin action
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: profile!.id,
          target_profile: helperId,
          action: verified ? 'verify_helper' : 'reject_verification',
          notes: verified ? 'Helper verified by admin' : 'Verification rejected by admin'
        })

      if (logError) console.error('Failed to log admin action:', logError)

      await fetchDashboardData()
      alert(`Helper ${verified ? 'verified' : 'rejected'} successfully`)
    } catch (err) {
      alert(`Failed to ${verified ? 'verify' : 'reject'} helper`)
      console.error(err)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Admin privileges required.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalPayments.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Pending Helper Verifications</h2>
        </div>
        
        {pendingHelpers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending verifications
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingHelpers.map(helper => (
              <div key={helper.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{helper.full_name}</h3>
                    <p className="text-sm text-gray-600">Phone: {helper.phone}</p>
                    <p className="text-sm text-gray-600">
                      Skills: {helper.skills?.join(', ') || 'None specified'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Applied: {new Date(helper.created_at).toLocaleDateString()}
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      {helper.white_card_url && (
                        <div>
                          <span className="text-sm font-medium">White Card:</span>
                          <a 
                            href={helper.white_card_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-500 text-sm"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                      {helper.id_document_url && (
                        <div>
                          <span className="text-sm font-medium">ID Document:</span>
                          <a 
                            href={helper.id_document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-500 text-sm"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleVerifyHelper(helper.id, true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleVerifyHelper(helper.id, false)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}