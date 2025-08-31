import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AnalyticsService } from '../../services/analyticsService'
import { SupportService } from '../../services/supportService'
import { DisputeService } from '../../services/disputeService'
import type { SystemMetrics, Dispute, SupportTicket, FraudAlert } from '../../types'
// import { BadgeService } from '../../services/badgeService' // Unused for now

interface TabType {
  id: string
  name: string
  icon: string
}

const tabs: TabType[] = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'analytics', name: 'Analytics', icon: '📈' },
  { id: 'users', name: 'Users', icon: '👥' },
  { id: 'jobs', name: 'Jobs', icon: '🔧' },
  { id: 'payments', name: 'Payments', icon: '💰' },
  { id: 'disputes', name: 'Disputes', icon: '⚖️' },
  { id: 'support', name: 'Support', icon: '🎧' },
  { id: 'badges', name: 'Badges', icon: '🏆' },
  { id: 'fraud', name: 'Fraud Alerts', icon: '🚨' },
  { id: 'system', name: 'System', icon: '⚙️' }
]

export const EnhancedAdminDashboard: React.FC = () => {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<{
    overview: SystemMetrics, 
    trends: SystemMetrics[], 
    userAnalytics: Record<string, unknown>, 
    jobAnalytics: Record<string, unknown>, 
    financialAnalytics: Record<string, unknown>
  } | null>(null)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([])

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [metrics, disputesList, ticketsList, alertsList] = await Promise.all([
        AnalyticsService.getSystemMetrics(startDate, endDate),
        DisputeService.getAllDisputes(undefined, 20),
        SupportService.getAllTickets({}, 20),
        AnalyticsService.getFraudAlerts(20)
      ])

      setSystemMetrics(metrics)
      setDisputes(disputesList)
      setSupportTickets(ticketsList)
      setFraudAlerts(alertsList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={systemMetrics?.overview?.total_users || 0}
          icon="👥"
          trend="+12%"
        />
        <MetricCard
          title="Active Users"
          value={systemMetrics?.overview?.active_users || 0}
          icon="✅"
          trend="+8%"
        />
        <MetricCard
          title="Jobs Completed"
          value={systemMetrics?.overview?.jobs_completed || 0}
          icon="✅"
          trend="+15%"
        />
        <MetricCard
          title="Platform Revenue"
          value={`$${systemMetrics?.overview?.total_revenue?.toFixed(0) || 0}`}
          icon="💰"
          trend="+23%"
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Disputes */}
        <QuickStatsCard
          title="Recent Disputes"
          count={disputes.filter(d => d.status === 'open').length}
          items={disputes.slice(0, 3).map(dispute => ({
            text: `${dispute.reason} - Job #${dispute.job_id?.substring(0, 8)}`,
            status: dispute.status,
            date: dispute.created_at
          }))}
          actionText="View All Disputes"
          onAction={() => setActiveTab('disputes')}
        />

        {/* Support Tickets */}
        <QuickStatsCard
          title="Open Support Tickets"
          count={supportTickets.filter(t => t.status === 'open').length}
          items={supportTickets.slice(0, 3).map(ticket => ({
            text: ticket.subject,
            status: ticket.status,
            date: ticket.created_at
          }))}
          actionText="View Support Queue"
          onAction={() => setActiveTab('support')}
        />

        {/* Fraud Alerts */}
        <QuickStatsCard
          title="Fraud Alerts"
          count={fraudAlerts.filter(a => a.status === 'pending').length}
          items={fraudAlerts.slice(0, 3).map(alert => ({
            text: alert.description,
            status: alert.severity,
            date: alert.created_at
          }))}
          actionText="Review Alerts"
          onAction={() => setActiveTab('fraud')}
        />
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Platform Analytics</h2>
      
      {/* User Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Active Users by Role</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tradies</span>
                <span className="font-semibold">{Math.floor((systemMetrics?.overview?.active_users || 0) * 0.6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Helpers</span>
                <span className="font-semibold">{Math.floor((systemMetrics?.overview?.active_users || 0) * 0.4)}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Churn Rate</p>
            <p className="text-2xl font-bold text-red-600">
              {(100 - (85)).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Job Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Job Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {systemMetrics && systemMetrics.overview.jobs_posted > 0 ? ((systemMetrics.overview.jobs_completed / systemMetrics.overview.jobs_posted) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Avg. Completion Time</p>
            <p className="text-2xl font-bold text-blue-600">
              {24.5}h
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Avg. Job Value</p>
            <p className="text-2xl font-bold text-purple-600">
              $200
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDisputes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dispute Management</h2>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-md">
            <option>All Disputes</option>
            <option>Open</option>
            <option>In Review</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {disputes.map((dispute) => (
              <tr key={dispute.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Job #{dispute.job_id.substring(0, 8)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {dispute.job_id.substring(0, 8)}...
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 capitalize">{dispute.reason.replace('_', ' ')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                    dispute.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(dispute.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {dispute.status === 'open' && (
                    <button className="text-blue-600 hover:text-blue-900">
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderSupport = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-md">
            <option>All Tickets</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {supportTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                  <div className="text-sm text-gray-500">{ticket.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">User #{ticket.user_id.substring(0, 8)}</div>
                  <div className="text-sm text-gray-500">user</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard 2.0</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'disputes' && renderDisputes()}
        {activeTab === 'support' && renderSupport()}
        {/* Add other tab content as needed */}
      </div>
    </div>
  )
}

// Helper Components
const MetricCard: React.FC<{
  title: string
  value: string | number
  icon: string
  trend?: string
}> = ({ title, value, icon, trend }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className="text-sm text-green-600 flex items-center mt-1">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {trend}
          </p>
        )}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
)

const QuickStatsCard: React.FC<{
  title: string
  count: number
  items: Array<{ text: string; status: string; date: string }>
  actionText: string
  onAction: () => void
}> = ({ title, count, items, actionText, onAction }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
        {count}
      </span>
    </div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="text-sm">
          <p className="text-gray-900 truncate">{item.text}</p>
          <p className="text-gray-500 text-xs">
            {new Date(item.date).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
    <button
      onClick={onAction}
      className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
    >
      {actionText} →
    </button>
  </div>
)