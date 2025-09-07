import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { Modal, ConfirmModal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

interface User {
  id: string
  email: string
  full_name: string
  role: 'tradie' | 'helper' | 'admin'
  status: 'active' | 'suspended' | 'pending'
  created_at: string
  avatar_url?: string
  phone?: string
  location?: string
}

type FilterTab = 'all' | 'tradie' | 'helper' | 'admin'

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  // TODO: const [filteredUsers, setFilteredUsers] = useState<User[]>([]) // Currently unused
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'delete'>('suspend')
  const { showSuccess, showError } = useToast()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [showError])

  const getFilteredUsers = useCallback(() => {
    let filtered = users

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [users, activeTab, searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])


  const handleUserAction = async (user: User, action: 'suspend' | 'activate' | 'delete') => {
    setSelectedUser(user)
    setActionType(action)
    setShowConfirmModal(true)
  }

  const confirmAction = async () => {
    if (!selectedUser) return

    try {
      const updateData: Partial<Pick<User, 'status'>> = {}
      
      switch (actionType) {
        case 'suspend':
          updateData.status = 'suspended'
          break
        case 'activate':
          updateData.status = 'active'
          break
        case 'delete': {
          // In production, you might soft-delete or archive instead
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', selectedUser.id)
          
          if (deleteError) throw deleteError
          showSuccess('User deleted successfully')
          break
        }
      }

      if (actionType !== 'delete') {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', selectedUser.id)

        if (error) throw error
        showSuccess(`User ${actionType}d successfully`)
      }

      await fetchUsers()
      setShowConfirmModal(false)
      setSelectedUser(null)

    } catch (error) {
      console.error(`Error ${actionType}ing user:`, error)
      showError(`Failed to ${actionType} user`)
    }
  }

  // Removed unused openUserDetails function

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tradie': return 'bg-blue-100 text-blue-800'
      case 'helper': return 'bg-orange-100 text-orange-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Removed unused tabs variable

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen group/design-root">
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col bg-white p-4 border-r border-gray-200">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="size-8 text-[var(--primary-600)]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_535)">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535">
                  <rect fill="white" height="48" width="48"></rect>
                </clipPath>
              </defs>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">TradieHelper</h2>
        </div>
        <nav className="mt-8 flex-1">
          <ul className="space-y-2">
            <li>
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900" href="/admin/overview">
                <svg className="opacity-75" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M224,96a8,8,0,0,1-8,8H128v96a8,8,0,0,1-16,0V104H40a8,8,0,0,1-7.37-4.89,8,8,0,0,1,1.74-8.74l88-88a8,8,0,0,1,11.26,0l88,88A8,8,0,0,1,224,96Z"></path>
                </svg>
                Dashboard
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900" href="/admin/jobs">
                <svg className="opacity-75" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M224,80H176V56a24,24,0,0,0-24-24H104A24,24,0,0,0,80,56V80H32a8,8,0,0,0-8,8v96a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A8,8,0,0,0,224,80ZM96,56a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8V80H96Z"></path>
                </svg>
                Jobs
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold bg-[var(--primary-50)] text-[var(--primary-700)]" href="/admin/users">
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,0,0,6.9,12H224a8,8,0,0,0,6.92-12ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96ZM213.39,208H42.61A47.79,47.79,0,0,1,87.41,163.5a88,88,0,1,1,81.18,0A47.79,47.79,0,0,1,213.39,208Z"></path>
                </svg>
                Users
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900" href="/admin/payments">
                <svg className="opacity-75" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M224,40H32A16,16,0,0,0,16,56V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V56A16,16,0,0,0,224,40ZM96,160H64a8,8,0,0,1,0-16H96a8,8,0,0,1,0,16Zm0-32H64a8,8,0,0,1,0-16H96a8,8,0,0,1,0,16Zm80,32H144a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16Zm0-32H144a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16Z"></path>
                </svg>
                Payments
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900" href="#">
                <svg className="opacity-75" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM128,216a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,16,0v40A8,8,0,0,1,144,176ZM112,88a12,12,0,1,1,12,12A12,12,0,0,1,112,88Z"></path>
                </svg>
                Support
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-end border-b border-solid border-gray-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)]">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
              </svg>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBgIPjTrmfqd_CsUB8Mv56r-LCRYBdY5_jlQIGXvigVVCECDWtnbfhVm53crzCVMADfaW-fO_7x5gDux2IuvcWDHLVay1XATbf9xhf6XBAzn-PrEIVFiV64pIF4udzGwZyvL0YxGq15uHUlroE_b4vVYlbUOmybWyoCj8CzI_8Ud0eLECXpM0HGYjTFD1xp8C5fATR3P7Ti_hGYtiBecKi6hTkQ97bP4ZdbPumDidmxLEPBa2BtQNKGaWhKBzCmL16D49Xk_q79S7oP")'}}></div>
          </div>
        </header>

        <div className="flex-1 p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
              <p className="mt-1 text-base text-gray-500">Manage user accounts, view profiles, edit information, and manage access.</p>
            </div>
            
            <div className="mb-6 flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="text-gray-400" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input 
                  className="form-input w-full rounded-md border-gray-300 bg-white pl-10 pr-4 py-2 text-sm placeholder:text-gray-400 focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]" 
                  placeholder="Search users by name, email, or ID" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav aria-label="Tabs" className="-mb-px flex space-x-8">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold ${
                    activeTab === 'all' 
                      ? 'border-[var(--primary-600)] text-[var(--primary-600)]' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                > 
                  All Users 
                </button>
                <button 
                  onClick={() => setActiveTab('tradie')}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === 'tradie' 
                      ? 'border-[var(--primary-600)] text-[var(--primary-600)]' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                > 
                  Tradies 
                </button>
                <button 
                  onClick={() => setActiveTab('helper')}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === 'helper' 
                      ? 'border-[var(--primary-600)] text-[var(--primary-600)]' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                > 
                  Helpers 
                </button>
              </nav>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white mt-6">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" scope="col">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" scope="col">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" scope="col">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" scope="col">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" scope="col">Joined Date</th>
                    <th className="relative px-6 py-3" scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {getFilteredUsers().map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.avatar_url ? (
                              <img alt="" className="h-10 w-10 rounded-full" src={user.avatar_url} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                                {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'No name provided'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">#{user.id.slice(0, 8)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button 
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserModal(true)
                          }}
                          className="text-[var(--primary-600)] hover:text-[var(--primary-800)]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing
                <span className="font-medium"> 1</span>
                to
                <span className="font-medium"> 4</span>
                of
                <span className="font-medium"> 10</span>
                results
              </p>
              <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <a className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" href="#">
                  <span className="sr-only">Previous</span>
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" fillRule="evenodd"></path>
                  </svg>
                </a>
                <a aria-current="page" className="relative z-10 inline-flex items-center bg-[var(--primary-600)] px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-600)]" href="#">1</a>
                <a className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" href="#">2</a>
                <a className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" href="#">
                  <span className="sr-only">Next</span>
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" fillRule="evenodd"></path>
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </div>

        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-gray-500">© 2024 TradieHelper. All rights reserved.</p>
              <div className="flex items-center space-x-6">
                <a className="text-sm text-gray-500 hover:text-gray-900" href="#">Privacy Policy</a>
                <a className="text-sm text-gray-500 hover:text-gray-900" href="#">Terms of Service</a>
                <a className="text-sm text-gray-500 hover:text-gray-900" href="#">Contact Us</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="User Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-medium">
                {selectedUser.full_name?.charAt(0)?.toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedUser.full_name || 'No name provided'}
                </h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900">#{selectedUser.id.slice(0, 8)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedUser.location || 'Not provided'}</dd>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                Close
              </Button>
              {selectedUser.status === 'active' ? (
                <Button 
                  variant="danger" 
                  onClick={() => {
                    setShowUserModal(false)
                    handleUserAction(selectedUser, 'suspend')
                  }}
                >
                  Suspend User
                </Button>
              ) : (
                <Button 
                  variant="success" 
                  onClick={() => {
                    setShowUserModal(false)
                    handleUserAction(selectedUser, 'activate')
                  }}
                >
                  Activate User
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} User`}
        message={`Are you sure you want to ${actionType} ${selectedUser?.full_name || selectedUser?.email}?`}
        confirmText={actionType.charAt(0).toUpperCase() + actionType.slice(1)}
        variant={actionType === 'delete' ? 'danger' : 'primary'}
      />
    </div>
  )
}