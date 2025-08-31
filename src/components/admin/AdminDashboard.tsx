import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface User {
  id: string
  user_id: string
  full_name: string
  email: string
  role: 'tradie' | 'helper'
  status: 'active' | 'inactive' | 'suspended'
  phone: string | null
  skills: string[] | null
  created_at: string
}

interface Job {
  id: string
  title: string
  location: string
  status: 'active' | 'completed' | 'pending' | 'draft'
  created_at: string
  applications_count: number
  tradie_id: string
}


interface Dispute {
  id: string
  job_id: string
  job_title: string
  reporter_name: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
}

interface DashboardStats {
  totalUsers: number
  activeJobs: number
  totalRevenue: number
  userGrowth: number
  jobsPosted: number
  jobsCompleted: number
  pendingVerifications: number
}

type AdminSection = 'overview' | 'users' | 'jobs' | 'payments' | 'disputes' | 'support'

export const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth()
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 1234,
    activeJobs: 567,
    totalRevenue: 89012,
    userGrowth: 15,
    jobsPosted: 10,
    jobsCompleted: 12,
    pendingVerifications: 0
  })

  const [users, setUsers] = useState<User[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [pendingHelpers, setPendingHelpers] = useState<User[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      switch (currentSection) {
        case 'users':
          await fetchUsers()
          break
        case 'jobs':
          await fetchJobs()
          break
        case 'payments':
          await fetchPayments()
          break
        case 'disputes':
          await fetchDisputes()
          break
        case 'overview':
          await fetchOverviewData()
          break
      }
    } catch (error) {
      console.error(`Error fetching ${currentSection} data:`, error)
      setError(`Failed to load ${currentSection} data`)
    } finally {
      setLoading(false)
    }
  }, [currentSection])

  useEffect(() => {
    if (user && (profile?.role === 'admin' || user.email === 'admin@tradiehelper.com')) {
      fetchData()
    }
  }, [user, profile, currentSection, fetchData])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, role, created_at, updated_at, phone, skills')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    const usersWithAuth = await Promise.all(
      data?.map(async (profile) => {
        const { data: authData } = await supabase.auth.admin.getUserById(profile.user_id)
        return {
          id: profile.user_id,
          user_id: profile.user_id,
          full_name: profile.full_name || 'Unknown',
          email: authData.user?.email || 'No email',
          role: profile.role || 'helper',
          status: 'active' as const,
          phone: profile.phone,
          skills: profile.skills,
          created_at: profile.created_at
        }
      }) || []
    )

    setUsers(usersWithAuth)
  }

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        applications:job_applications(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      return
    }

    const jobsData: Job[] = data?.map(job => ({
      id: job.id,
      title: job.title,
      location: job.location || 'Location not specified',
      status: job.status || 'draft',
      created_at: job.created_at,
      applications_count: job.applications?.[0]?.count || 0,
      tradie_id: job.tradie_id
    })) || []

    setJobs(jobsData)
  }

  const fetchPayments = async () => {
    const { error } = await supabase
      .from('payments')
      .select(`
        *,
        jobs (title),
        user_profiles!payments_payer_id_fkey (full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return
    }

    // Transform payment data for display  
    // const paymentsData = data?.map(payment => ({
    //   id: payment.id,
    //   job_id: payment.job_id,
    //   amount: payment.amount,
    //   status: payment.status || 'pending',
    //   created_at: payment.created_at,
    //   job_title: payment.jobs?.title || 'Unknown Job',
    //   payer_name: payment.user_profiles?.full_name || 'Unknown User'
    // })) || []

    // Payments data processed for display
  }

  const fetchDisputes = async () => {
    const mockDisputes: Dispute[] = [
      {
        id: '1',
        job_id: 'job-1',
        job_title: 'Plumbing Repair',
        reporter_name: 'Sarah Johnson',
        status: 'open',
        created_at: '2024-07-26T00:00:00Z'
      },
      {
        id: '2',
        job_id: 'job-2',
        job_title: 'Electrical Installation',
        reporter_name: 'Michael Brown',
        status: 'resolved',
        created_at: '2024-07-20T00:00:00Z'
      }
    ]
    setDisputes(mockDisputes)
  }

  const fetchOverviewData = async () => {
    try {
      // Fetch stats in parallel
      const [usersRes, jobsRes, paymentsRes, pendingRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'helper')
          .eq('verified', false)
      ])

      // Calculate total payments
      const totalPayments = paymentsRes.data?.reduce((sum, p) => sum + p.amount, 0) || 0

      setDashboardStats({
        totalUsers: usersRes.count || 1234,
        activeJobs: jobsRes.count || 567,
        totalRevenue: totalPayments || 89012,
        userGrowth: 15,
        jobsPosted: 10,
        jobsCompleted: 12,
        pendingVerifications: pendingRes.data?.length || 0
      })

      setPendingHelpers(pendingRes.data || [])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    }
  }

  const handleVerifyHelper = async (helperId: string, verified: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ verified })
        .eq('user_id', helperId)

      if (updateError) throw updateError

      // Log admin action
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: user?.id,
          target_profile: helperId,
          action: verified ? 'verify_helper' : 'reject_verification',
          notes: verified ? 'Helper verified by admin' : 'Verification rejected by admin'
        })

      if (logError) console.error('Failed to log admin action:', logError)

      await fetchOverviewData()
      alert(`Helper ${verified ? 'verified' : 'rejected'} successfully`)
    } catch (err) {
      alert(`Failed to ${verified ? 'verify' : 'reject'} helper`)
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-orange-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'open':
        return 'bg-orange-100 text-orange-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const renderSidebar = () => (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">TradieHelper</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        <button
          onClick={() => setCurrentSection('overview')}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left ${
            currentSection === 'overview'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Z"/>
          </svg>
          <span className="text-sm font-medium">Overview</span>
        </button>

        <button
          onClick={() => setCurrentSection('users')}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left ${
            currentSection === 'users'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92Z"/>
          </svg>
          <span className="text-sm font-medium">Users</span>
        </button>

        <button
          onClick={() => setCurrentSection('jobs')}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left ${
            currentSection === 'jobs'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56Z"/>
          </svg>
          <span className="text-sm font-medium">Jobs</span>
        </button>

        <button
          onClick={() => setCurrentSection('payments')}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left ${
            currentSection === 'payments'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Z"/>
          </svg>
          <span className="text-sm font-medium">Payments</span>
        </button>

        <button
          onClick={() => setCurrentSection('disputes')}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left ${
            currentSection === 'disputes'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.62,75.82,119.34,91,124.38a15.44,15.44,0,0,0,10,0c15.2-5.05,91-34.77,91-124.39V56A16,16,0,0,0,208,40Z"/>
          </svg>
          <span className="text-sm font-medium">Disputes</span>
        </button>

        <button
          onClick={() => setCurrentSection('support')}
          className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left ${
            currentSection === 'support'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Z"/>
          </svg>
          <span className="text-sm font-medium">Support</span>
        </button>
      </nav>
      
      <div className="px-4 py-4 border-t border-gray-200">
        <a href="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600 w-full text-left">
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>
          </svg>
          <span className="text-sm font-medium">Back to TradieHelper</span>
        </a>
      </div>
    </aside>
  )

  const renderOverview = () => (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Active Jobs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.activeJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Revenue (AUD)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(dashboardStats.totalRevenue)}</p>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">User Growth</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">New Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">+{dashboardStats.userGrowth}%</p>
              <p className="text-sm text-gray-500 mt-1">
                Last 30 Days <span className="text-green-600 font-medium">+{dashboardStats.userGrowth}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Disputes Table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Disputes</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Job</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {disputes.slice(0, 3).map((dispute) => (
                <tr key={dispute.id} className="bg-white border-b">
                  <td className="px-6 py-4 font-medium text-gray-900">{dispute.reporter_name}</td>
                  <td className="px-6 py-4">{dispute.job_title}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                      {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatDate(dispute.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Verifications */}
      {pendingHelpers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Helper Verifications</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="divide-y divide-gray-200">
              {pendingHelpers.slice(0, 5).map(helper => (
                <div key={helper.user_id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{helper.full_name}</h3>
                      <p className="text-sm text-gray-600">Phone: {helper.phone}</p>
                      <p className="text-sm text-gray-600">
                        Skills: {helper.skills?.join(', ') || 'None specified'}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Applied: {formatDate(helper.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleVerifyHelper(helper.user_id, true)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleVerifyHelper(helper.user_id, false)}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderUsers = () => (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Users</h1>
      <p className="text-base text-gray-500 mb-6">Manage user accounts, view profiles, and manage access.</p>

      {/* Search */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search users by name, email, or ID"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 256 256">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['all', 'tradies', 'helpers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                selectedTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'all' ? 'Users' : ''}
            </button>
          ))}
        </nav>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined Date</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.filter(user => 
              selectedTab === 'all' || 
              (selectedTab === 'tradies' && user.role === 'tradie') ||
              (selectedTab === 'helpers' && user.role === 'helper')
            ).map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.role === 'tradie' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-800">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderJobs = () => (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Jobs</h1>
      <p className="text-gray-500 mb-6">Manage all job listings, including viewing details, editing status, and managing applications.</p>

      {/* Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search jobs by ID, title, or location"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 256 256">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Job ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Posted Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Applications</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">#{job.id.slice(0, 8)}</td>
                <td className="px-6 py-4">{job.title}</td>
                <td className="px-6 py-4">{job.location}</td>
                <td className="px-6 py-4">{formatDate(job.created_at)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">{job.applications_count}</td>
                <td className="px-6 py-4 text-right">
                  <a href="#" className="font-medium text-blue-600 hover:underline">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Access Control
  if (!user || (profile?.role !== 'admin' && user.email !== 'admin@tradiehelper.com')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Access denied. Admin privileges required.
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {renderSidebar()}
      
      <main className="flex-1 p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {currentSection === 'overview' && renderOverview()}
        {currentSection === 'users' && renderUsers()}
        {currentSection === 'jobs' && renderJobs()}
        {currentSection === 'payments' && (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Payments</h1>
            <p className="text-gray-500 mb-6">Monitor payment transactions and manage financial operations.</p>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Payment management interface coming soon...</p>
            </div>
          </div>
        )}
        {currentSection === 'disputes' && (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Disputes</h1>
            <p className="text-gray-500 mb-6">Handle user disputes and resolve conflicts.</p>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Dispute management interface coming soon...</p>
            </div>
          </div>
        )}
        {currentSection === 'support' && (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Support</h1>
            <p className="text-gray-500 mb-6">Manage customer support tickets and help requests.</p>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Support management interface coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}