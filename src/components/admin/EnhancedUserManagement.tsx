import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '../../lib/supabase'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  profile: {
    full_name: string
    phone?: string
    avatar_url?: string
    role: 'tradie' | 'helper' | 'admin'
    location?: string
    skills?: string[]
    bio?: string
    rating?: number
    reviews_count: number
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
    account_status: 'active' | 'suspended' | 'banned' | 'pending_deletion'
    premium_status: boolean
    kyc_completed: boolean
    background_check_status?: 'pending' | 'approved' | 'failed'
  }
  stats: {
    jobs_posted?: number
    jobs_completed?: number
    total_earnings?: number
    total_spent?: number
    disputes_count: number
    response_rate?: number
  }
}

interface UserStats {
  total_users: number
  active_users: number
  verified_users: number
  premium_users: number
  tradies: number
  helpers: number
  new_signups_today: number
  avg_rating: number
}

export const EnhancedUserManagement: React.FC = () => {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVerification, setFilterVerification] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [showUserDetail, setShowUserDetail] = useState(false)

  const fetchData = useCallback(async () => {
    if (user && profile?.role === 'admin') {
      await fetchUsers()
      await fetchUserStats()
    }
  }, [user, profile])

  useEffect(() => {
    fetchData()
  }, [fetchData, searchTerm, filterRole, filterStatus, filterVerification, sortBy])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_stats(*)
        `)

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      }

      // Apply role filter
      if (filterRole !== 'all') {
        query = query.eq('role', filterRole)
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('account_status', filterStatus)
      }

      // Apply verification filter
      if (filterVerification !== 'all') {
        query = query.eq('verification_status', filterVerification)
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'name':
          query = query.order('full_name', { ascending: true })
          break
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        case 'last_active':
          query = query.order('last_sign_in_at', { ascending: false })
          break
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      // Transform the data to match our interface
      const transformedUsers = data?.map(item => ({
        id: item.id,
        email: item.email || 'N/A',
        created_at: item.created_at,
        last_sign_in_at: undefined,
        profile: item,
        stats: item.user_stats || {
          jobs_posted: 0,
          jobs_completed: 0,
          total_earnings: 0,
          total_spent: 0,
          disputes_count: 0,
          response_rate: 0
        }
      })) || []

      setUsers(transformedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const { data: profileStats, error } = await supabase
        .from('profiles')
        .select('role, account_status, verification_status, premium_status, rating, created_at')

      if (error) throw error

      if (profileStats) {
        const total_users = profileStats.length
        const active_users = profileStats.filter(p => p.account_status === 'active').length
        const verified_users = profileStats.filter(p => p.verification_status === 'verified').length
        const premium_users = profileStats.filter(p => p.premium_status).length
        const tradies = profileStats.filter(p => p.role === 'tradie').length
        const helpers = profileStats.filter(p => p.role === 'helper').length
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const new_signups_today = profileStats.filter(p => 
          new Date(p.created_at) >= today
        ).length

        const ratingsData = profileStats.filter(p => p.rating)
        const avg_rating = ratingsData.length > 0 
          ? ratingsData.reduce((sum, p) => sum + p.rating, 0) / ratingsData.length
          : 0

        setUserStats({
          total_users,
          active_users,
          verified_users,
          premium_users,
          tradies,
          helpers,
          new_signups_today,
          avg_rating
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      setActionLoading(userId)
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      await fetchUsers()
      await fetchUserStats()
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const updateVerificationStatus = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      setActionLoading(userId)
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      await fetchUsers()
      await fetchUserStats()
    } catch (error) {
      console.error('Error updating verification status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(userId)
      
      // First, mark for deletion in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ account_status: 'pending_deletion' })
        .eq('user_id', userId)

      if (profileError) throw profileError

      // In a real implementation, you would typically not delete users immediately
      // but mark them for deletion and have a cleanup process
      
      await fetchUsers()
      await fetchUserStats()
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'suspended': return 'text-yellow-600 bg-yellow-50'
      case 'banned': return 'text-red-600 bg-red-50'
      case 'pending_deletion': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'rejected': return 'text-red-600 bg-red-50'
      case 'unverified': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {user.profile.avatar_url ? (
              <img 
                src={user.profile.avatar_url} 
                alt={user.profile.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-600">
                {user.profile.full_name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span>{user.profile.full_name}</span>
              {user.profile.verification_status === 'verified' && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
              )}
              {user.profile.premium_status && (
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
              )}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.profile.account_status)}`}>
                {user.profile.account_status}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                {user.profile.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedUser(user)
              setShowUserDetail(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-500"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              console.log('Edit user:', user.id)
            }}
            className="p-2 text-gray-400 hover:text-green-500"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => deleteUser(user.id)}
            disabled={actionLoading === user.id}
            className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-1 text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>
            {user.last_sign_in_at 
              ? `Active ${new Date(user.last_sign_in_at).toLocaleDateString()}`
              : 'Never signed in'
            }
          </span>
        </div>
        {user.profile.location && (
          <div className="flex items-center space-x-1 text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span>{user.profile.location}</span>
          </div>
        )}
        {user.profile.rating && (
          <div className="flex items-center space-x-1 text-gray-600">
            <StarIconSolid className="w-4 h-4 text-yellow-400" />
            <span>{user.profile.rating.toFixed(1)} ({user.profile.reviews_count})</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-lg font-semibold text-gray-900">
            {user.stats.jobs_completed || 0}
          </p>
          <p className="text-xs text-gray-600">Jobs</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-lg font-semibold text-gray-900">
            ${(user.stats.total_earnings || user.stats.total_spent || 0).toFixed(0)}
          </p>
          <p className="text-xs text-gray-600">
            {user.profile.role === 'tradie' ? 'Paid' : 'Earned'}
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-lg font-semibold text-gray-900">
            {user.stats.disputes_count || 0}
          </p>
          <p className="text-xs text-gray-600">Disputes</p>
        </div>
      </div>

      {/* Verification Status */}
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getVerificationColor(user.profile.verification_status)}`}>
          {user.profile.verification_status.charAt(0).toUpperCase() + user.profile.verification_status.slice(1)}
        </span>
        
        <div className="flex space-x-2">
          {user.profile.account_status === 'active' && (
            <button
              onClick={() => updateUserStatus(user.id, 'suspended')}
              disabled={actionLoading === user.id}
              className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Suspend
            </button>
          )}
          
          {user.profile.account_status === 'suspended' && (
            <button
              onClick={() => updateUserStatus(user.id, 'active')}
              disabled={actionLoading === user.id}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Activate
            </button>
          )}
          
          {user.profile.verification_status === 'pending' && (
            <>
              <button
                onClick={() => updateVerificationStatus(user.id, 'verified')}
                disabled={actionLoading === user.id}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Verify
              </button>
              <button
                onClick={() => updateVerificationStatus(user.id, 'rejected')}
                disabled={actionLoading === user.id}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const UserDetailModal: React.FC = () => {
    if (!selectedUser) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  User Profile: {selectedUser.profile.full_name}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedUser.profile.account_status)}`}>
                    {selectedUser.profile.account_status}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                    {selectedUser.profile.role}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getVerificationColor(selectedUser.profile.verification_status)}`}>
                    {selectedUser.profile.verification_status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowUserDetail(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      {selectedUser.profile.avatar_url ? (
                        <img 
                          src={selectedUser.profile.avatar_url} 
                          alt={selectedUser.profile.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-medium text-gray-600">
                          {selectedUser.profile.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedUser.profile.full_name}</h4>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      {selectedUser.profile.phone && (
                        <p className="text-gray-600">{selectedUser.profile.phone}</p>
                      )}
                    </div>
                  </div>

                  {selectedUser.profile.bio && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                      <p className="text-gray-700">{selectedUser.profile.bio}</p>
                    </div>
                  )}

                  {selectedUser.profile.skills && selectedUser.profile.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.profile.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Joined:</span>
                      <p className="text-gray-700">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Last Active:</span>
                      <p className="text-gray-700">
                        {selectedUser.last_sign_in_at 
                          ? new Date(selectedUser.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Premium:</span>
                      <p className="text-gray-700">{selectedUser.profile.premium_status ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">KYC:</span>
                      <p className="text-gray-700">{selectedUser.profile.kyc_completed ? 'Completed' : 'Pending'}</p>
                    </div>
                  </div>

                  {selectedUser.profile.rating && (
                    <div>
                      <span className="font-medium text-gray-900">Rating:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`w-5 h-5 ${i < selectedUser.profile.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-700">
                          {selectedUser.profile.rating.toFixed(1)} ({selectedUser.profile.reviews_count} reviews)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.jobs_completed || 0}</p>
                    <p className="text-sm text-gray-600">Jobs Completed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ${(selectedUser.stats.total_earnings || selectedUser.stats.total_spent || 0).toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedUser.profile.role === 'tradie' ? 'Total Paid' : 'Total Earned'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.disputes_count || 0}</p>
                    <p className="text-sm text-gray-600">Disputes</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedUser.stats.response_rate ? `${selectedUser.stats.response_rate}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Response Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                onClick={() => setShowUserDetail(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  console.log('Edit user:', selectedUser.id)
                  setShowUserDetail(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit User
              </button>
            </div>
          </div>
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
            <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600">Only administrators can access user management.</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage users, verify accounts, and monitor platform activity
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{userStats.total_users}</p>
                  <p className="text-gray-600">Total Users</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckBadgeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{userStats.verified_users}</p>
                  <p className="text-gray-600">Verified Users</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <StarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{userStats.premium_users}</p>
                  <p className="text-gray-600">Premium Users</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{userStats.new_signups_today}</p>
                  <p className="text-gray-600">New Today</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="tradie">Tradies</option>
                  <option value="helper">Helpers</option>
                  <option value="admin">Admins</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
                
                <select
                  value={filterVerification}
                  onChange={(e) => setFilterVerification(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="unverified">Unverified</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="rating">Highest Rated</option>
                  <option value="last_active">Recently Active</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">No users match your current search and filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}

        {/* Load More */}
        {users.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Load More Users
            </button>
          </div>
        )}
      </main>

      {showUserDetail && <UserDetailModal />}
      <MobileNavigation />
    </div>
  )
}