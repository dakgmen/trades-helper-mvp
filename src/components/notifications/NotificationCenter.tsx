import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

interface Notification {
  id: string
  type: 'job_alert' | 'message' | 'application_update' | 'payment' | 'review' | 'system'
  title: string
  description: string
  read: boolean
  created_at: string
  action_url?: string
  metadata?: {
    job_id?: string
    sender_id?: string
    amount?: number
    rating?: number
  }
}

type NotificationFilter = 'all' | 'unread' | 'archived'

const NotificationTypeIcons = {
  job_alert: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M20.25 14.15v4.07a2.25 2.25 0 01-2.25 2.25H5.92a2.25 2.25 0 01-2.25-2.25v-4.07a2.25 2.25 0 01.95-1.76l6.36-4.48a2.25 2.25 0 012.68 0l6.36 4.48a2.25 2.25 0 01.95 1.76z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18.75h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  message: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  application_update: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  payment: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-15c-.621 0-1.125-.504-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125h1.5M12 12.75a.75.75 0 000-1.5h-.008a.75.75 0 000 1.5h.008z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  review: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  system: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.240.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const NotificationTypeColors = {
  job_alert: 'bg-blue-100 text-blue-600',
  message: 'bg-green-100 text-green-600',
  application_update: 'bg-orange-100 text-orange-600',
  payment: 'bg-green-100 text-green-600',
  review: 'bg-yellow-100 text-yellow-500',
  system: 'bg-gray-100 text-gray-600'
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [currentFilter, setCurrentFilter] = useState<NotificationFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      setupRealtimeSubscriptions()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      // For demo purposes, we'll use mock data since we don't have a notifications table yet
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'job_alert',
          title: 'New Job Alert: Carpenter needed in Sydney',
          description: 'A new carpentry job has been posted that matches your skills and location. View the details and apply now.',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/jobs/123',
          metadata: { job_id: '123' }
        },
        {
          id: '2',
          type: 'message',
          title: 'New Message from Alex Johnson',
          description: '"Hi, I\'m interested in your quote for the backyard decking. Can we discuss it further?"',
          read: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          action_url: '/messages/456',
          metadata: { sender_id: 'alex123' }
        },
        {
          id: '3',
          type: 'application_update',
          title: 'Application Update',
          description: 'Your application for the \'Plumbing Maintenance\' job has been viewed by the client.',
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          action_url: '/applications/789'
        },
        {
          id: '4',
          type: 'payment',
          title: 'Payment Received: $550.00 AUD',
          description: 'Payment for \'Decking Repair Job\' has been successfully processed and is now in your account.',
          read: true,
          created_at: new Date(Date.now() - 90000000).toISOString(),
          metadata: { amount: 550 }
        },
        {
          id: '5',
          type: 'review',
          title: 'New 5-star Review from Sarah L.',
          description: '"Fantastic work on the electrical fittings. Professional, on time, and very tidy. Highly recommend!"',
          read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          metadata: { rating: 5 }
        }
      ]

      setNotifications(mockNotifications)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // In a real implementation, this would set up Supabase real-time subscriptions
    // for new notifications
    console.log('Setting up real-time notification subscriptions...')
  }

  const applyFilter = useCallback(() => {
    let filtered = [...notifications]
    
    switch (currentFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read)
        break
      case 'archived': {
        // For demo - show read notifications older than 7 days as "archived"
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        filtered = notifications.filter(n => n.read && new Date(n.created_at) < weekAgo)
        break
      }
      default: {
        // Show all except archived
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        filtered = notifications.filter(n => !n.read || new Date(n.created_at) >= oneWeekAgo)
        break
      }
    }

    setFilteredNotifications(filtered)
  }, [notifications, currentFilter])

  useEffect(() => {
    applyFilter()
  }, [applyFilter])

  const markAsRead = async (notificationId: string) => {
    try {
      // In real implementation, update the database
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      // In real implementation, update all notifications in database
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Navigate to the appropriate page
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60))
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInDays < 7) {
      if (diffInDays < 2) {
        return 'Yesterday'
      } else {
        return `${Math.floor(diffInDays)} days ago`
      }
    } else {
      return date.toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getDateGroupLabel = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

    if (diffInDays < 1) {
      return 'Today'
    } else if (diffInDays < 2) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return 'This Week'
    } else {
      return 'Older'
    }
  }

  const groupNotificationsByDate = () => {
    const groups: { [key: string]: Notification[] } = {}
    
    filteredNotifications.forEach(notification => {
      const group = getDateGroupLabel(notification.created_at)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(notification)
    })

    return groups
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const notificationGroups = groupNotificationsByDate()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-lg bg-white shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Mark all as read
                </button>
              )}
              <button className="flex items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-6">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'archived', label: 'Archived' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCurrentFilter(key as NotificationFilter)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  currentFilter === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {Object.keys(notificationGroups).length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a12 12 0 0 1 24 0v10z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-gray-500">
                {currentFilter === 'unread' ? "You're all caught up!" : "No notifications found."}
              </p>
            </div>
          ) : (
            Object.entries(notificationGroups).map(([groupLabel, groupNotifications]) => (
              <div key={groupLabel}>
                {/* Group Header */}
                <div className="p-3 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                    {groupLabel}
                  </h3>
                </div>

                {/* Group Notifications */}
                {groupNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600"></div>
                    )}

                    {/* Icon */}
                    <div className={`${!notification.read ? 'ml-6' : ''} flex-shrink-0 self-center`}>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${NotificationTypeColors[notification.type]}`}>
                        {NotificationTypeIcons[notification.type]}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                      <p className={`text-base font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.description}
                      </p>

                      {/* Action Buttons */}
                      {notification.type === 'job_alert' && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = notification.action_url || '/jobs'
                            }}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            View Job
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {notification.type === 'message' && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = notification.action_url || '/messages'
                            }}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 self-start text-sm text-gray-500">
                      {formatTime(notification.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}