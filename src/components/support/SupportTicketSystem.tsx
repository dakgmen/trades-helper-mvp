import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  TicketIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface SupportTicket {
  id: string
  user_id: string
  title: string
  description: string
  category: 'technical' | 'billing' | 'safety' | 'dispute' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  attachments: string[]
  created_at: string
  updated_at: string
  assigned_agent?: string
  resolution_notes?: string
  rating?: number
  user: {
    full_name: string
    email: string
  }
}

interface TicketMessage {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_staff_reply: boolean
  attachments: string[]
  created_at: string
  user: {
    full_name: string
    avatar_url?: string
  }
}

export const SupportTicketSystem: React.FC = () => {
  const { user, profile } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority'],
    attachments: [] as string[]
  })

  const [newMessage, setNewMessage] = useState('')
  const [messageAttachments, setMessageAttachments] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      fetchTickets()
    }
  }, [user, filterStatus, filterCategory])

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id)
    }
  }, [selectedTicket])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)

      // Apply user filter for non-admin users
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user?.id)
      }

      // Apply filters
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      setMessagesLoading(true)
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setTicketMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const createTicket = async () => {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open',
          attachments: newTicket.attachments
        })
        .select()
        .single()

      if (error) throw error

      setShowCreateForm(false)
      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        attachments: []
      })
      
      await fetchTickets()
    } catch (error) {
      console.error('Error creating ticket:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: newMessage,
          is_staff_reply: profile?.role === 'admin',
          attachments: messageAttachments
        })

      if (error) throw error

      // Update ticket status if needed
      if (selectedTicket.status === 'resolved') {
        await supabase
          .from('support_tickets')
          .update({ status: 'open', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id)
      }

      setNewMessage('')
      setMessageAttachments([])
      await fetchTicketMessages(selectedTicket.id)
      await fetchTickets()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'resolved' && { assigned_agent: user?.id })
        })
        .eq('id', ticketId)

      if (error) throw error

      await fetchTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const rateResolution = async (ticketId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ rating })
        .eq('id', ticketId)

      if (error) throw error

      await fetchTickets()
    } catch (error) {
      console.error('Error rating ticket:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200'
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const CreateTicketForm: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Support Ticket</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of your issue..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as 'technical' | 'billing' | 'safety' | 'dispute' | 'general' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="safety">Safety Concern</option>
                  <option value="dispute">Job Dispute</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Please provide detailed information about your issue..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Upload screenshots or relevant files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB each (max 5 files)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createTicket}
              disabled={submitting || !newTicket.title.trim() || !newTicket.description.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const TicketDetail: React.FC = () => {
    if (!selectedTicket) return null

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedTicket.title}</h2>
              <p className="text-sm text-gray-600">
                Ticket #{selectedTicket.id.slice(-8)} • Created {new Date(selectedTicket.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(selectedTicket.status)}`}>
              {selectedTicket.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
              {selectedTicket.priority.toUpperCase()} PRIORITY
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {selectedTicket.category.toUpperCase()}
            </span>
          </div>

          {profile?.role === 'admin' && (
            <div className="flex space-x-2 mt-4">
              {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateTicketStatus(selectedTicket.id, status as 'open' | 'in_progress' | 'resolved' | 'closed')}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    selectedTicket.status === status
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Original ticket description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {selectedTicket.user.full_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{selectedTicket.user.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            ticketMessages.map((message) => (
              <div key={message.id} className={`flex space-x-3 ${message.is_staff_reply ? 'justify-end' : ''}`}>
                <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.is_staff_reply ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.user.avatar_url ? (
                      <img 
                        src={message.user.avatar_url} 
                        alt={message.user.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {message.user.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.is_staff_reply 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-medium ${message.is_staff_reply ? 'text-blue-100' : 'text-gray-700'}`}>
                        {message.user.full_name}
                        {message.is_staff_reply && ' (Support)'}
                      </span>
                      <span className={`text-xs ${message.is_staff_reply ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              disabled={submitting || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-end"
            >
              Send
            </button>
          </div>
        </div>

        {/* Rating (for resolved tickets) */}
        {selectedTicket.status === 'resolved' && profile?.role !== 'admin' && !selectedTicket.rating && (
          <div className="border-t border-gray-200 p-4 bg-green-50">
            <p className="text-sm text-green-800 mb-2">How would you rate the support resolution?</p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => rateResolution(selectedTicket.id, rating)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {rating}★
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Support Center
            </h1>
            <p className="text-gray-600">
              Get help with your account, billing, technical issues, and more
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Ticket</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Tickets List */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="safety">Safety</option>
                    <option value="dispute">Dispute</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Your Tickets ({tickets.length})</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <TicketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Support Tickets
                    </h3>
                    <p className="text-gray-600">
                      Create a ticket to get help with any issues
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedTicket?.id === ticket.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 truncate pr-2">
                            {ticket.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-3">
                            <span className={`px-1 py-0.5 text-xs rounded ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className="text-gray-500 capitalize">{ticket.category}</span>
                          </div>
                          <span className="text-gray-500">
                            {new Date(ticket.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="lg:block">
            {selectedTicket ? (
              <TicketDetail />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a ticket to view details
                  </h3>
                  <p className="text-gray-600">
                    Choose a support ticket from the list to view the conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateForm && <CreateTicketForm />}
      <MobileNavigation />
    </div>
  )
}