import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

interface DashboardStats {
  totalUsers: number
  activeJobs: number
  revenue: number
  newUsersGrowth: number
  jobsPostedGrowth: number
  jobsCompletedGrowth: number
}

interface DisputeData {
  id: string
  user: string
  job: string
  status: 'Open' | 'Resolved'
  date: string
}

export function AdminDashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1234,
    activeJobs: 567,
    revenue: 89012,
    newUsersGrowth: 15,
    jobsPostedGrowth: 10,
    jobsCompletedGrowth: 12
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // TODO: const [userGrowthData, setUserGrowthData] = useState<Array<{month: string, value: number}>>([]) // Currently unused
  // TODO: const [jobActivityData, setJobActivityData] = useState<Array<{month: string, value: number}>>([]) // Currently unused
  const [recentDisputes] = useState<DisputeData[]>([
    { id: '1', user: 'Sarah Johnson', job: 'Plumbing Repair', status: 'Open', date: '2024-07-26' },
    { id: '2', user: 'Michael Brown', job: 'Electrical Installation', status: 'Resolved', date: '2024-07-20' },
    { id: '3', user: 'Emily Davis', job: 'Gardening Service', status: 'Open', date: '2024-07-15' }
  ])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      if (usersError) throw usersError

      // Fetch active jobs
      const { count: activeJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .in('status', ['open', 'assigned', 'in_progress'])

      if (jobsError) throw jobsError

      // Fetch revenue (this would typically come from payments table)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')

      if (paymentsError) throw paymentsError

      const revenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

      // Calculate growth rates (simplified - in production you'd compare with previous period)
      const newUsersGrowth = 15 // Mock data
      const jobsPostedGrowth = 10 // Mock data  
      const jobsCompletedGrowth = 12 // Mock data

      setStats({
        totalUsers: totalUsers || 0,
        activeJobs: activeJobs || 0,
        revenue,
        newUsersGrowth,
        jobsPostedGrowth,
        jobsCompletedGrowth
      })

      // TODO: Mock chart data - in production, fetch real time-series data
      // setUserGrowthData([
      //   { month: 'Jan', value: 65 },
      //   { month: 'Feb', value: 28 },
      //   { month: 'Mar', value: 50 },
      //   { month: 'Apr', value: 81 },
      //   { month: 'May', value: 43 },
      //   { month: 'Jun', value: 88 },
      //   { month: 'Jul', value: 35 }
      // ])

      // setJobActivityData([
      //   { month: 'Jan', value: 45 },
      //   { month: 'Feb', value: 85 },
      //   { month: 'Mar', value: 25 },
      //   { month: 'Apr', value: 70 },
      //   { month: 'May', value: 55 },
      //   { month: 'Jun', value: 40 },
      //   { month: 'Jul', value: 90 }
      // ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-standard p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-standard p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">TradieHelper</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <a className="flex items-center gap-3 px-4 py-2 rounded-md bg-blue-50 text-[var(--primary-color)]" href="/admin/overview">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM104,144a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32,0a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
            </svg>
            <span className="text-sm font-medium">Overview</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600" href="/admin/users">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
            </svg>
            <span className="text-sm font-medium">Users</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600" href="/admin/jobs">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z"></path>
            </svg>
            <span className="text-sm font-medium">Jobs</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600" href="/admin/payments">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-40,0a32,32,0,0,1,0-64h8v64Zm40,80H136V136h16a32,32,0,0,1,0,64Z"></path>
            </svg>
            <span className="text-sm font-medium">Payments</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600" href="/admin/disputes">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.62,75.82,119.34,91,124.38a15.44,15.44,0,0,0,10,0c15.2-5.05,91-34.77,91-124.39V56A16,16,0,0,0,208,40Zm0,74.79c0,78.42-66.34,104.62-80,109.18-13.53-4.5-80-30.68-80-109.18V56l160,0ZM120,136V96a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm-4,36a12,12,0,1,1,12,12A12,12,0,0,1,116,172Z"></path>
            </svg>
            <span className="text-sm font-medium">Disputes</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600" href="#">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
            </svg>
            <span className="text-sm font-medium">Support</span>
          </a>
        </nav>
        <div className="px-4 py-4 border-t border-gray-200">
          <a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600" href="/">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
            </svg>
            <span className="text-sm font-medium">Back to TradieHelper</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Overview</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeJobs}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Revenue (AUD)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.revenue.toLocaleString()}</p>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">User Growth</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">New Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">+{stats.newUsersGrowth}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Last 30 Days <span className="text-[var(--secondary-color)] font-medium">+{stats.newUsersGrowth}%</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 h-60">
                <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 472 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#paint0_linear_1131_5935_new)"></path>
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="var(--primary-color)" strokeLinecap="round" strokeWidth="2"></path>
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1131_5935_new" x1="236" x2="236" y1="1" y2="149">
                      <stop stopColor="var(--primary-color)" stopOpacity="0.1"></stop>
                      <stop offset="1" stopColor="var(--primary-color)" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Job Activity Charts */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Job Activity</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
                <p className="text-sm font-medium text-gray-500">Jobs Posted</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">+{stats.jobsPostedGrowth}%</p>
                <p className="text-sm text-gray-500 mt-1">Last 30 Days <span className="text-[var(--secondary-color)] font-medium">+{stats.jobsPostedGrowth}%</span></p>
                <div className="mt-6 grid grid-flow-col gap-4 items-end justify-items-center h-48 px-3">
                  <div className="bg-blue-100 w-full rounded-t-md" style={{height: '50%'}}></div>
                  <div className="bg-blue-100 w-full rounded-t-md" style={{height: '10%'}}></div>
                  <div className="bg-blue-100 w-full rounded-t-md" style={{height: '70%'}}></div>
                  <div className="bg-[var(--primary-color)] w-full rounded-t-md" style={{height: '90%'}}></div>
                  <div className="bg-blue-100 w-full rounded-t-md" style={{height: '30%'}}></div>
                  <div className="bg-blue-100 w-full rounded-t-md" style={{height: '30%'}}></div>
                  <div className="bg-blue-100 w-full rounded-t-md" style={{height: '60%'}}></div>
                </div>
                <div className="grid grid-flow-col gap-4 justify-items-center mt-2 px-3">
                  <p className="text-xs text-gray-500 font-medium">Jan</p>
                  <p className="text-xs text-gray-500 font-medium">Feb</p>
                  <p className="text-xs text-gray-500 font-medium">Mar</p>
                  <p className="text-xs text-gray-500 font-medium">Apr</p>
                  <p className="text-xs text-gray-500 font-medium">May</p>
                  <p className="text-xs text-gray-500 font-medium">Jun</p>
                  <p className="text-xs text-gray-500 font-medium">Jul</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">&nbsp;</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
                <p className="text-sm font-medium text-gray-500">Jobs Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">+{stats.jobsCompletedGrowth}%</p>
                <p className="text-sm text-gray-500 mt-1">Last 30 Days <span className="text-[var(--secondary-color)] font-medium">+{stats.jobsCompletedGrowth}%</span></p>
                <div className="mt-6 grid grid-flow-col gap-4 items-end justify-items-center h-48 px-3">
                  <div className="bg-green-100 w-full rounded-t-md" style={{height: '40%'}}></div>
                  <div className="bg-[var(--secondary-color)] w-full rounded-t-md" style={{height: '100%'}}></div>
                  <div className="bg-green-100 w-full rounded-t-md" style={{height: '30%'}}></div>
                  <div className="bg-green-100 w-full rounded-t-md" style={{height: '20%'}}></div>
                  <div className="bg-green-100 w-full rounded-t-md" style={{height: '10%'}}></div>
                  <div className="bg-green-100 w-full rounded-t-md" style={{height: '10%'}}></div>
                  <div className="bg-green-100 w-full rounded-t-md" style={{height: '90%'}}></div>
                </div>
                <div className="grid grid-flow-col gap-4 justify-items-center mt-2 px-3">
                  <p className="text-xs text-gray-500 font-medium">Jan</p>
                  <p className="text-xs text-gray-500 font-medium">Feb</p>
                  <p className="text-xs text-gray-500 font-medium">Mar</p>
                  <p className="text-xs text-gray-500 font-medium">Apr</p>
                  <p className="text-xs text-gray-500 font-medium">May</p>
                  <p className="text-xs text-gray-500 font-medium">Jun</p>
                  <p className="text-xs text-gray-500 font-medium">Jul</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Disputes Table */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">Recent Disputes</h2>
            <div className="mt-4 overflow-x-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3" scope="col">User</th>
                      <th className="px-6 py-3" scope="col">Job</th>
                      <th className="px-6 py-3" scope="col">Status</th>
                      <th className="px-6 py-3" scope="col">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDisputes.map((dispute, index) => (
                      <tr key={dispute.id} className={index === recentDisputes.length - 1 ? "bg-white" : "bg-white border-b"}>
                        <td className="px-6 py-4 font-medium text-gray-900">{dispute.user}</td>
                        <td className="px-6 py-4">{dispute.job}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dispute.status === 'Open' 
                              ? 'bg-orange-100 text-[var(--accent-color)]'
                              : 'bg-green-100 text-[var(--secondary-color)]'
                          }`}>
                            {dispute.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{dispute.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}