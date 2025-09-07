import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FlagIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface FraudAlert {
  id: string
  user_id: string
  alert_type: 'payment' | 'profile' | 'behavior' | 'device' | 'location'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  details: Record<string, unknown>
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  created_at: string
  resolved_at?: string
  resolver_id?: string
  resolution_notes?: string
  user: {
    full_name: string
    email: string
    phone?: string
  }
}

interface FraudMetrics {
  totalAlerts: number
  activeAlerts: number
  criticalAlerts: number
  resolvedToday: number
  falsePositiveRate: number
  averageResolutionTime: number
  alertsByType: Record<string, number>
  alertsByRiskLevel: Record<string, number>
  trendsData: Array<{
    date: string
    alerts: number
    resolved: number
  }>
}


export const FraudDetectionDashboard: React.FC = () => {
  const { user, profile } = useAuth()
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'metrics' | 'rules'>('alerts')
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAlerts()
      fetchMetrics()
    }
  }, [user, profile, filterRiskLevel, filterType, filterStatus])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('fraud_alerts')
        .select(`
          *,
          user:profiles!user_id(full_name, email, phone)
        `)

      if (filterRiskLevel !== 'all') {
        query = query.eq('risk_level', filterRiskLevel)
      }

      if (filterType !== 'all') {
        query = query.eq('alert_type', filterType)
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setAlerts(data || [])
    } catch (error) {
      console.error('Error fetching fraud alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      // Fetch various metrics from different tables
      const [alertsResult, trendsResult] = await Promise.all([
        supabase
          .from('fraud_alerts')
          .select('alert_type, risk_level, status, created_at, resolved_at'),
        
        supabase
          .from('fraud_alerts')
          .select('created_at, resolved_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ])

      if (alertsResult.error) throw alertsResult.error
      if (trendsResult.error) throw trendsResult.error

      const alertsData = alertsResult.data || []

      // Calculate metrics
      const totalAlerts = alertsData.length
      const activeAlerts = alertsData.filter(a => a.status === 'active').length
      const criticalAlerts = alertsData.filter(a => a.risk_level === 'critical').length
      const resolvedToday = alertsData.filter(a => 
        a.resolved_at && new Date(a.resolved_at).toDateString() === new Date().toDateString()
      ).length

      const falsePositives = alertsData.filter(a => a.status === 'false_positive').length
      const falsePositiveRate = totalAlerts > 0 ? (falsePositives / totalAlerts) * 100 : 0

      // Calculate average resolution time
      const resolvedAlerts = alertsData.filter(a => a.resolved_at)
      const avgResolutionTime = resolvedAlerts.length > 0 
        ? resolvedAlerts.reduce((sum, alert) => {
            const created = new Date(alert.created_at).getTime()
            const resolved = new Date(alert.resolved_at!).getTime()
            return sum + (resolved - created)
          }, 0) / resolvedAlerts.length / (1000 * 60 * 60) // Convert to hours
        : 0

      // Group by type and risk level
      const alertsByType = alertsData.reduce((acc, alert) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const alertsByRiskLevel = alertsData.reduce((acc, alert) => {
        acc[alert.risk_level] = (acc[alert.risk_level] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setMetrics({
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        resolvedToday,
        falsePositiveRate,
        averageResolutionTime: avgResolutionTime,
        alertsByType,
        alertsByRiskLevel,
        trendsData: [] // Simplified for now
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }


  const updateAlertStatus = async (alertId: string, status: FraudAlert['status'], notes?: string) => {
    try {
      const updateData: Partial<FraudAlert> = {
        status,
        resolver_id: user?.id
      }

      if (status === 'resolved' || status === 'false_positive') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolution_notes = notes
      }

      const { error } = await supabase
        .from('fraud_alerts')
        .update(updateData)
        .eq('id', alertId)

      if (error) throw error

      await fetchAlerts()
      await fetchMetrics()
      
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(prev => prev ? { ...prev, status, resolution_notes: notes } : null)
      }
    } catch (error) {
      console.error('Error updating alert status:', error)
    }
  }


  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return BanknotesIcon
      case 'profile': return UserIcon
      case 'behavior': return EyeIcon
      case 'device': return DevicePhoneMobileIcon
      case 'location': return MapPinIcon
      default: return FlagIcon
    }
  }

  const AlertDetail: React.FC = () => {
    if (!selectedAlert) return null

    const IconComponent = getAlertTypeIcon(selectedAlert.alert_type)

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getRiskLevelColor(selectedAlert.risk_level)}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedAlert.title}</h2>
              <p className="text-sm text-gray-600">
                Alert #{selectedAlert.id.slice(-8)} • {new Date(selectedAlert.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getRiskLevelColor(selectedAlert.risk_level)}`}>
            {selectedAlert.risk_level.toUpperCase()}
          </span>
        </div>

        <div className="space-y-6">
          {/* User Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{selectedAlert.user.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedAlert.user.email}</p>
              </div>
              {selectedAlert.user.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedAlert.user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-medium font-mono text-sm">{selectedAlert.user_id}</p>
              </div>
            </div>
          </div>

          {/* Alert Description */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Alert Description</h3>
            <p className="text-gray-700">{selectedAlert.description}</p>
          </div>

          {/* Technical Details */}
          {Object.keys(selectedAlert.details).length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Technical Details</h3>
              <div className="bg-gray-50 rounded p-3 font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(selectedAlert.details, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Actions */}
          {selectedAlert.status === 'active' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateAlertStatus(selectedAlert.id, 'investigating')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Start Investigation
                </button>
                <button
                  onClick={() => updateAlertStatus(selectedAlert.id, 'resolved', 'Manual review completed - legitimate activity')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateAlertStatus(selectedAlert.id, 'false_positive', 'False positive - system error')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  False Positive
                </button>
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          {selectedAlert.resolution_notes && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Resolution Notes</h3>
              <p className="text-gray-700">{selectedAlert.resolution_notes}</p>
              {selectedAlert.resolved_at && (
                <p className="text-sm text-gray-500 mt-2">
                  Resolved on {new Date(selectedAlert.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldExclamationIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can access the fraud detection dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fraud Detection Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor, investigate, and resolve security threats and fraudulent activities
          </p>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeAlerts}</p>
                  <p className="text-gray-600">Active Alerts</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShieldExclamationIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{metrics.criticalAlerts}</p>
                  <p className="text-gray-600">Critical Risk</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckBadgeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{metrics.resolvedToday}</p>
                  <p className="text-gray-600">Resolved Today</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageResolutionTime.toFixed(1)}h</p>
                  <p className="text-gray-600">Avg Resolution</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'alerts', label: 'Fraud Alerts', icon: FlagIcon },
                { id: 'metrics', label: 'Analytics', icon: ChartBarIcon },
                { id: 'rules', label: 'Security Rules', icon: ShieldExclamationIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'alerts' | 'metrics' | 'rules')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'alerts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Filters & Alerts List */}
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                  
                  <select
                    value={filterRiskLevel}
                    onChange={(e) => setFilterRiskLevel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="payment">Payment</option>
                    <option value="profile">Profile</option>
                    <option value="behavior">Behavior</option>
                    <option value="device">Device</option>
                    <option value="location">Location</option>
                  </select>
                </div>
              </div>

              {/* Alerts List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Fraud Alerts ({alerts.length})</h2>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
                    <p className="text-gray-600">No fraud alerts match your current filters.</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {alerts.map((alert) => {
                        const IconComponent = getAlertTypeIcon(alert.alert_type)
                        
                        return (
                          <div
                            key={alert.id}
                            onClick={() => setSelectedAlert(alert)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 ${
                              selectedAlert?.id === alert.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getRiskLevelColor(alert.risk_level)}`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-gray-900 truncate">{alert.title}</h3>
                                  <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getRiskLevelColor(alert.risk_level)}`}>
                                    {alert.risk_level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{alert.user.full_name}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span className="capitalize">{alert.alert_type}</span>
                                  <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alert Detail */}
            <div>
              {selectedAlert ? (
                <AlertDetail />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an alert</h3>
                    <p className="text-gray-600">Choose a fraud alert to view details and take action</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <MobileNavigation />
    </div>
  )
}