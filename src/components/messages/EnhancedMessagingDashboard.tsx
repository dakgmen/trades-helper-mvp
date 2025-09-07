import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { MessageThread } from './MessageThread'
import { useRealTimeMessaging } from '../../hooks/useRealTimeMessaging'
import type { Message } from '../../types'

interface Conversation {
  id: string
  job_id: string
  participant_id: string
  participant_name: string
  participant_avatar?: string
  job_title: string
  last_message: string
  last_message_time: string
  unread_count: number
  status: 'online' | 'offline' | 'away'
}

interface NotificationSound {
  play: () => void
}

export const EnhancedMessagingDashboard: React.FC = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showPriorityOnly, setShowPriorityOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notificationSound] = useState<NotificationSound | null>(() => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      return { play: () => audio.play().catch(() => {}) }
    } catch {
      return null
    }
  })

  const handleMessageReceived = useCallback((message: Message) => {
    // Play notification sound
    notificationSound?.play()

    // Update conversations with new message
    setConversations(prev => {
      const key = `${message.job_id}-${message.sender_id}`
      return prev.map(conv => {
        if (conv.id === key) {
          return {
            ...conv,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: conv.unread_count + 1
          }
        }
        return conv
      })
    })

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const senderName = conversations.find(c => c.participant_id === message.sender_id)?.participant_name || 'Someone'
      new Notification(`New message from ${senderName}`, {
        body: message.content.substring(0, 100),
        icon: '/logo.png',
        tag: `message-${message.id}`
      })
    }
  }, [conversations, notificationSound])

  const handleUserStatusChange = useCallback((userId: string, status: 'online' | 'offline' | 'away') => {
    setConversations(prev => 
      prev.map(conv => 
        conv.participant_id === userId 
          ? { ...conv, status }
          : conv
      )
    )
  }, [])

  const { isConnected, typingUsers, sendTypingIndicator, updateUserStatus } = useRealTimeMessaging({
    userId: user?.id || '',
    onMessageReceived: handleMessageReceived,
    onUserStatusChange: handleUserStatusChange
  })

  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch messages with participant details
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (full_name),
          receiver:receiver_id (full_name),
          jobs (title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return
      }

      // Group messages by job and participant
      const conversationMap = new Map<string, Conversation>()

      messages?.forEach((message: Message & { sender: { full_name: string }, receiver: { full_name: string } }) => {
        const isReceiver = message.receiver_id === user.id
        const participantId = isReceiver ? message.sender_id : message.receiver_id
        const participantName = isReceiver ? message.sender.full_name : message.receiver.full_name
        const key = `${message.job_id}-${participantId}`

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            id: key,
            job_id: message.job_id,
            participant_id: participantId,
            participant_name: participantName,
            job_title: message.jobs?.title || 'Unknown Job',
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            status: 'offline' as const
          })
        }

        // Update unread count
        if (isReceiver && !message.read_at) {
          const conv = conversationMap.get(key)!
          conv.unread_count += 1
        }
      })

      setConversations(Array.from(conversationMap.values()))
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Handle page visibility changes for user status
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserStatus('away')
      } else {
        updateUserStatus('online')
      }
    }

    const handleBeforeUnload = () => {
      updateUserStatus('offline')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [updateUserStatus])

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  const filteredConversations = conversations.filter(conv => {
    if (showUnreadOnly && conv.unread_count === 0) return false
    if (showPriorityOnly && conv.unread_count < 3) return false // Priority = 3+ unread
    if (searchTerm && !conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !conv.job_title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const markAsRead = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) return

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('job_id', conversation.job_id)
        .eq('sender_id', conversation.participant_id)
        .eq('receiver_id', user!.id)
        .is('read_at', null)

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const isTyping = (conversationId: string, participantId: string) => {
    const key = `${conversationId.split('-')[0]}-${participantId}`
    return typingUsers[key] || false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" 
         style={{
           '--color-primary': '#2563EB',
           '--color-secondary': '#16A34A', 
           '--color-accent': '#EA580C',
           '--color-neutral-text': '#374151',
           '--color-neutral-background': '#F3F4F6',
           '--checkbox-tick-svg': 'url("data:image/svg+xml,%3csvg viewBox=%270 0 16 16%27 fill=%27rgb(255,255,255)%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath d=%27M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%27/%3e%3c/svg%3e")',
           fontFamily: '"Work Sans", "Noto Sans", sans-serif'
         } as React.CSSProperties}>
      
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-orange-500 text-white px-4 py-2 text-sm text-center">
          <span className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Reconnecting to chat...
          </span>
        </div>
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-96 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg aria-hidden="true" className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" fillRule="evenodd"></path>
                </svg>
              </div>
              <input 
                className="block w-full rounded-md border-0 bg-white py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Search messages" 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Filters</h3>
            <div className="mt-4 space-y-3">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input 
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 custom-checkbox"
                    id="unread" 
                    name="unread" 
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    style={{'--checkbox-tick-svg': 'var(--checkbox-tick-svg)'} as React.CSSProperties}
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label className="font-medium text-gray-900" htmlFor="unread">Unread</label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input 
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 custom-checkbox"
                    id="priority" 
                    name="priority" 
                    type="checkbox"
                    checked={showPriorityOnly}
                    onChange={(e) => setShowPriorityOnly(e.target.checked)}
                    style={{'--checkbox-tick-svg': 'var(--checkbox-tick-svg)'} as React.CSSProperties}
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label className="font-medium text-gray-900" htmlFor="priority">Priority</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <h3 className="px-4 pt-4 pb-2 text-xs font-semibold uppercase text-gray-500 tracking-wider">Conversations</h3>
            <nav className="flex flex-col">
              {filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation)
                    if (conversation.unread_count > 0) {
                      markAsRead(conversation.id)
                    }
                  }}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-100 transition-colors text-left w-full ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-blue-100 border-l-4 border-blue-600' 
                      : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {conversation.participant_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                      conversation.status === 'online' 
                        ? 'bg-green-500' 
                        : conversation.status === 'away' 
                        ? 'bg-orange-500' 
                        : 'bg-gray-400'
                    }`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-900 truncate">{conversation.participant_name}</p>
                      <p className="text-xs text-gray-500">{formatTime(conversation.last_message_time)}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">{conversation.job_title}</p>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {isTyping(conversation.id, conversation.participant_id) ? (
                          <span className="text-blue-600 italic">Typing...</span>
                        ) : (
                          conversation.last_message
                        )}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-xs font-medium text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {filteredConversations.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No conversations found</p>
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedConversation.participant_name}</h2>
                  <p className="text-sm text-gray-600">{selectedConversation.job_title}</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      selectedConversation.status === 'online' 
                        ? 'bg-green-500' 
                        : selectedConversation.status === 'away'
                        ? 'bg-orange-500'
                        : 'bg-gray-400'
                    }`}></div>
                    <p className={`text-sm font-medium ${
                      selectedConversation.status === 'online' 
                        ? 'text-green-600' 
                        : selectedConversation.status === 'away'
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}>
                      {selectedConversation.status.charAt(0).toUpperCase() + selectedConversation.status.slice(1)}
                    </p>
                    {isTyping(selectedConversation.id, selectedConversation.participant_id) && (
                      <p className="text-sm text-blue-600 italic">Typing...</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </div>
              </header>

              <MessageThread
                jobId={selectedConversation.job_id}
                recipientId={selectedConversation.participant_id}
                recipientName={selectedConversation.participant_name}
                onTyping={(isTyping) => sendTypingIndicator(selectedConversation.job_id, isTyping)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="mt-1 text-gray-500">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}