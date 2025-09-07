import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  created_at: string
  is_read: boolean
  sender?: {
    full_name: string
    avatar_url?: string
    role: string
  }
}

interface Conversation {
  participant_id: string
  participant_name: string
  participant_avatar?: string
  participant_status: 'online' | 'offline' | 'away'
  last_message: string
  last_message_time: string
  unread_count: number
  messages: Message[]
}

export function MessagingDashboard() {
  const { user } = useAuth()
  // TODO: const profile = useAuth().profile // Currently unused
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showPriorityOnly, setShowPriorityOnly] = useState(false)
  const { showSuccess, showError } = useToast()

  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch all messages where user is sender or recipient
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url, role)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by conversation partners
      const conversationsMap = new Map<string, Conversation>()
      
      for (const message of messages || []) {
        const partnerId = message.sender_id === user.id ? message.recipient_id : message.sender_id
        const partnerName = message.sender_id === user.id ? 'You' : message.sender?.full_name || 'Unknown'
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            participant_id: partnerId,
            participant_name: partnerName,
            participant_avatar: message.sender?.avatar_url,
            participant_status: Math.random() > 0.5 ? 'online' : 'offline', // Mock status
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: 0,
            messages: []
          })
        }

        const conversation = conversationsMap.get(partnerId)!
        conversation.messages.push(message)
        
        // Count unread messages from this partner
        if (!message.is_read && message.sender_id !== user.id) {
          conversation.unread_count++
        }
      }

      const conversationsList = Array.from(conversationsMap.values())
      setConversations(conversationsList)
      
      // Select first conversation if none selected
      if (!selectedConversation && conversationsList.length > 0) {
        setSelectedConversation(conversationsList[0])
      }

    } catch (error) {
      console.error('Error fetching conversations:', error)
      showError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [user, showError, selectedConversation])

  useEffect(() => {
    if (user) {
      fetchConversations()
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => {
            fetchConversations()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user, fetchConversations])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    try {
      setSending(true)
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation.participant_id,
          message: newMessage.trim(),
          is_read: false
        })

      if (error) throw error

      setNewMessage('')
      showSuccess('Message sent!')
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      showError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', conversationId)
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      fetchConversations()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (showUnreadOnly && conv.unread_count === 0) return false
    if (showPriorityOnly && conv.unread_count < 2) return false
    if (searchTerm && !conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-96 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                className="block w-full rounded-md border-0 bg-white py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Search messages"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-4">Filters</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                />
                <label className="ml-3 text-sm font-medium text-gray-900">Unread</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  checked={showPriorityOnly}
                  onChange={(e) => setShowPriorityOnly(e.target.checked)}
                />
                <label className="ml-3 text-sm font-medium text-gray-900">Priority</label>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="px-4 pt-4 pb-2 text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Conversations
            </h3>
            <nav className="flex flex-col">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.participant_id}
                  onClick={() => {
                    setSelectedConversation(conversation)
                    markAsRead(conversation.participant_id)
                  }}
                  className={`flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-100 ${
                    selectedConversation?.participant_id === conversation.participant_id
                      ? 'bg-blue-100 border-l-4 border-blue-600'
                      : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      {conversation.participant_avatar ? (
                        <img 
                          src={conversation.participant_avatar} 
                          alt="" 
                          className="h-12 w-12 rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {conversation.participant_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                      conversation.participant_status === 'online' ? 'bg-green-500' : 
                      conversation.participant_status === 'away' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.participant_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_time)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message}
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
            </nav>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedConversation.participant_name}
                  </h2>
                  <p className={`text-sm font-medium ${
                    selectedConversation.participant_status === 'online' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {selectedConversation.participant_status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
                <div className="space-y-6">
                  {selectedConversation.messages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.sender_id !== user?.id && (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {selectedConversation.participant_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex flex-col gap-1 ${
                          message.sender_id === user?.id ? 'items-end' : 'items-start'
                        }`}>
                          <div className={`rounded-lg px-4 py-3 max-w-md shadow-sm ${
                            message.sender_id === user?.id
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white rounded-tl-none'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {message.sender_id === user?.id ? 'You' : selectedConversation.participant_name}, {formatTime(message.created_at)}
                          </p>
                        </div>

                        {message.sender_id === user?.id && (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">You</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="relative">
                  <textarea
                    className="block w-full resize-none rounded-full border-0 bg-gray-100 py-3 pl-5 pr-28 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Write a message..."
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full h-8 w-8 text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full h-8 w-8 text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.75.75 0 01-1.06 0 3.5 3.5 0 00-4.95 0 .75.75 0 01-1.06-1.06 5 5 0 017.07 0 .75.75 0 010 1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      loading={sending}
                      className="ml-2 rounded-full p-2"
                      size="sm"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}