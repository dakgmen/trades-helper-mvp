import React, { useState } from 'react'
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface MetricCard {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
}

interface ChartData {
  label: string
  value: number
}

export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(false)

  const metrics: MetricCard[] = [
    {
      title: 'Total Jobs Posted',
      value: '1,250',
      change: 15,
      changeType: 'increase',
      icon: BriefcaseIcon
    },
    {
      title: 'Active Tradies',
      value: '850',
      change: 10,
      changeType: 'increase',
      icon: UsersIcon
    },
    {
      title: 'Helper Applications',
      value: '3,400',
      change: 20,
      changeType: 'increase',
      icon: ClockIcon
    },
    {
      title: 'Total Revenue',
      value: '$45,200',
      change: 8,
      changeType: 'increase',
      icon: CurrencyDollarIcon
    },
    {
      title: 'Completion Rate',
      value: '94.5%',
      change: 2.1,
      changeType: 'increase',
      icon: ArrowTrendingUpIcon
    },
    {
      title: 'Avg Response Time',
      value: '2.3h',
      change: -12,
      changeType: 'decrease',
      icon: ClockIcon
    }
  ]

  const jobCategoriesData: ChartData[] = [
    { label: 'Plumbing', value: 35 },
    { label: 'Electrical', value: 28 },
    { label: 'Carpentry', value: 22 },
    { label: 'Painting', value: 15 }
  ]

  const recentActivityData: ChartData[] = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 180 },
    { label: 'Apr', value: 140 },
    { label: 'May', value: 200 },
    { label: 'Jun', value: 160 }
  ]

  const handleExportData = () => {
    setLoading(true)
    // Simulate export functionality
    setTimeout(() => {
      setLoading(false)
      // In a real app, this would trigger a CSV download
      console.log('Exporting analytics data...')
    }, 2000)
  }

  const formatChange = (change: number) => {
    const isPositive = change > 0
    return (
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 mr-1" />
        )}
        <p className="font-semibold">{Math.abs(change)}% vs last month</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 shadow-sm bg-white">
        <div className="flex items-center gap-3 text-gray-900">
          <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
          </svg>
          <h2 className="text-xl font-bold tracking-tight">TradieHelper</h2>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a className="hover:text-blue-600 transition-colors" href="#">Dashboard</a>
          <a className="hover:text-blue-600 transition-colors" href="#">Jobs</a>
          <a className="hover:text-blue-600 transition-colors" href="#">Tradies</a>
          <a className="hover:text-blue-600 transition-colors" href="#">Helpers</a>
          <a className="hover:text-blue-600 transition-colors" href="#">Payments</a>
          <a className="hover:text-blue-600 transition-colors" href="#">Support</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your platform performance with real-time data and insights.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2 rounded-lg bg-white p-1 border border-gray-200">
                {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {range === '7d' ? '7 days' : range === '30d' ? '30 days' : range === '90d' ? '90 days' : '1 year'}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleExportData}
                disabled={loading}
                className="flex items-center gap-2 min-w-[84px] max-w-[480px] cursor-pointer justify-center overflow-hidden rounded-md h-10 px-4 bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="truncate">{loading ? 'Exporting...' : 'Export Data (CSV)'}</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <metric.icon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                {formatChange(metric.change)}
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Job Postings Chart */}
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Job Postings Over Time</h3>
              <div className="flex min-h-[250px] flex-1 flex-col gap-4">
                {/* Simple bar chart representation */}
                <div className="flex items-end justify-between h-40 space-x-2">
                  {recentActivityData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${(data.value / 200) * 100}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-2">{data.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Categories */}
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Job Categories</h3>
              <div className="space-y-4">
                {jobCategoriesData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{category.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${category.value}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-[3ch]">{category.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { user: 'John Smith', action: 'Posted job', type: 'Plumbing', time: '2 hours ago', status: 'Active' },
                    { user: 'Sarah Wilson', action: 'Applied to job', type: 'Electrical', time: '3 hours ago', status: 'Pending' },
                    { user: 'Mike Johnson', action: 'Completed job', type: 'Carpentry', time: '5 hours ago', status: 'Completed' },
                    { user: 'Emma Davis', action: 'Posted job', type: 'Painting', time: '6 hours ago', status: 'Active' }
                  ].map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.status === 'Active' ? 'bg-green-100 text-green-800' :
                          activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AnalyticsDashboard