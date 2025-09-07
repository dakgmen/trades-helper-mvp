import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ScaleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface Dispute {
  id: string
  job_id: string
  complainant_id: string
  respondent_id: string
  dispute_type: 'payment' | 'quality' | 'completion' | 'safety' | 'behavior' | 'other'
  status: 'open' | 'investigating' | 'mediation' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  amount_disputed?: number
  evidence_urls: string[]
  created_at: string
  updated_at: string
  resolved_at?: string
  resolution_type?: 'complainant_favor' | 'respondent_favor' | 'compromise' | 'no_fault'
  resolution_notes?: string
  mediator_id?: string
  job: {
    title: string
    description: string
    amount: number
    status: string
  }
  complainant: {
    full_name: string
    email: string
    avatar_url?: string
  }
  respondent: {
    full_name: string
    email: string
    avatar_url?: string
  }
  mediator?: {
    full_name: string
    email: string
  }
}

interface DisputeMessage {
  id: string
  dispute_id: string
  sender_id: string
  message: string
  message_type: 'text' | 'evidence' | 'system' | 'resolution'
  attachments: string[]
  is_private: boolean
  created_at: string
  sender: {
    full_name: string
    avatar_url?: string
  }
}

interface DisputeProposal {
  id: string
  dispute_id: string
  proposed_by: string
  proposal_type: 'payment_adjustment' | 'refund' | 'redo_work' | 'compromise' | 'other'
  amount?: number
  description: string
  status: 'pending' | 'accepted' | 'rejected' | 'modified'
  created_at: string
  responses: Array<{
    user_id: string
    response: 'accept' | 'reject' | 'modify'
    notes?: string
    created_at: string
  }>
}

export const DisputeResolutionInterface: React.FC = () => {
  const { user, profile } = useAuth()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [disputeMessages, setDisputeMessages] = useState<DisputeMessage[]>([])
  const [proposals, setProposals] = useState<DisputeProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [showProposalForm, setShowProposalForm] = useState(false)
  
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  
  const [newMessage, setNewMessage] = useState('')
  const [messageAttachments, setMessageAttachments] = useState<string[]>([])
  
  const [newProposal, setNewProposal] = useState({
    type: 'payment_adjustment' as DisputeProposal['proposal_type'],
    amount: 0,
    description: ''
  })


  const fetchData = useCallback(() => {
    if (user) {
      fetchDisputes()
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData, filterStatus, filterType])

  useEffect(() => {
    if (selectedDispute) {
      fetchDisputeMessages(selectedDispute.id)
      fetchProposals(selectedDispute.id)
    }
  }, [selectedDispute])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('disputes')
        .select(`
          *,
          job:jobs(title, description, amount, status),
          complainant:profiles!complainant_id(full_name, email, avatar_url),
          respondent:profiles!respondent_id(full_name, email, avatar_url),
          mediator:profiles!mediator_id(full_name, email)
        `)

      // Filter by user involvement unless admin
      if (profile?.role !== 'admin') {
        query = query.or(`complainant_id.eq.${user?.id},respondent_id.eq.${user?.id}`)
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        query = query.eq('dispute_type', filterType)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setDisputes(data || [])
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDisputeMessages = async (disputeId: string) => {
    try {
      setMessagesLoading(true)
      
      const { data, error } = await supabase
        .from('dispute_messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url)
        `)
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setDisputeMessages(data || [])
    } catch (error) {
      console.error('Error fetching dispute messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const fetchProposals = async (disputeId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispute_proposals')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProposals(data || [])
    } catch (error) {
      console.error('Error fetching proposals:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('dispute_messages')
        .insert({
          dispute_id: selectedDispute.id,
          sender_id: user?.id,
          message: newMessage,
          message_type: 'text',
          attachments: messageAttachments,
          is_private: false
        })

      if (error) throw error

      setNewMessage('')
      setMessageAttachments([])
      await fetchDisputeMessages(selectedDispute.id)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const submitProposal = async () => {
    if (!selectedDispute) return

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('dispute_proposals')
        .insert({
          dispute_id: selectedDispute.id,
          proposed_by: user?.id,
          proposal_type: newProposal.type,
          amount: newProposal.amount || null,
          description: newProposal.description,
          status: 'pending'
        })

      if (error) throw error

      setShowProposalForm(false)
      setNewProposal({
        type: 'payment_adjustment',
        amount: 0,
        description: ''
      })
      
      await fetchProposals(selectedDispute.id)
    } catch (error) {
      console.error('Error submitting proposal:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const respondToProposal = async (proposalId: string, response: 'accept' | 'reject', notes?: string) => {
    try {
      const { error } = await supabase
        .from('dispute_proposal_responses')
        .insert({
          proposal_id: proposalId,
          user_id: user?.id,
          response,
          notes
        })

      if (error) throw error

      await fetchProposals(selectedDispute?.id || '')
    } catch (error) {
      console.error('Error responding to proposal:', error)
    }
  }

  const updateDisputeStatus = async (disputeId: string, status: Dispute['status']) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'resolved' && { resolved_at: new Date().toISOString() })
        })
        .eq('id', disputeId)

      if (error) throw error

      await fetchDisputes()
      if (selectedDispute?.id === disputeId) {
        setSelectedDispute(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error('Error updating dispute status:', error)
    }
  }


  const getDisputeTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return BanknotesIcon
      case 'quality': return ExclamationTriangleIcon
      case 'completion': return CheckCircleIcon
      case 'safety': return ExclamationTriangleIcon
      case 'behavior': return ChatBubbleLeftRightIcon
      default: return DocumentTextIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'investigating': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'mediation': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200'
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const DisputeDetail: React.FC = () => {
    if (!selectedDispute) return null

    const IconComponent = getDisputeTypeIcon(selectedDispute.dispute_type)
    const isParticipant = selectedDispute.complainant_id === user?.id || selectedDispute.respondent_id === user?.id
    const canTakeActions = isParticipant || profile?.role === 'admin'

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <IconComponent className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedDispute.title}</h2>
                <p className="text-sm text-gray-600">
                  Dispute #{selectedDispute.id.slice(-8)} • {selectedDispute.job.title}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(selectedDispute.status)}`}>
              {selectedDispute.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Complainant</p>
              <p className="font-medium">{selectedDispute.complainant.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Respondent</p>
              <p className="font-medium">{selectedDispute.respondent.full_name}</p>
            </div>
            {selectedDispute.amount_disputed && (
              <div>
                <p className="text-sm text-gray-600">Disputed Amount</p>
                <p className="font-medium text-red-600">${selectedDispute.amount_disputed.toFixed(2)} AUD</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Job Value</p>
              <p className="font-medium">${selectedDispute.job.amount.toFixed(2)} AUD</p>
            </div>
          </div>

          {/* Actions for participants */}
          {canTakeActions && selectedDispute.status === 'open' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowProposalForm(true)}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Make Proposal
              </button>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => updateDisputeStatus(selectedDispute.id, 'resolved')}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          )}
        </div>

        {/* Proposals */}
        {proposals.length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">Resolution Proposals</h3>
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {proposal.proposal_type.replace('_', ' ')}
                        {proposal.amount && ` - $${proposal.amount.toFixed(2)} AUD`}
                      </p>
                      <p className="text-sm text-gray-600">{proposal.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                  
                  {proposal.status === 'pending' && proposal.proposed_by !== user?.id && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => respondToProposal(proposal.id, 'accept')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToProposal(proposal.id, 'reject')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Original dispute description */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-orange-600">
                  {selectedDispute.complainant.full_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{selectedDispute.complainant.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(selectedDispute.created_at).toLocaleString()}
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Original Complaint
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.description}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            disputeMessages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {message.sender.avatar_url ? (
                    <img 
                      src={message.sender.avatar_url} 
                      alt={message.sender.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {message.sender.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{message.sender.full_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                    {message.message_type === 'system' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        System
                      </span>
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.message_type === 'system' 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-100'
                  }`}>
                    <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        {canTakeActions && selectedDispute.status !== 'closed' && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Add a message to the dispute discussion..."
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
        )}
      </div>
    )
  }

  const ProposalForm: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Resolution Proposal</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Type
            </label>
            <select
              value={newProposal.type}
              onChange={(e) => setNewProposal(prev => ({ ...prev, type: e.target.value as DisputeProposal['proposal_type'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="payment_adjustment">Payment Adjustment</option>
              <option value="refund">Refund</option>
              <option value="redo_work">Redo Work</option>
              <option value="compromise">Compromise</option>
              <option value="other">Other</option>
            </select>
          </div>

          {(newProposal.type === 'payment_adjustment' || newProposal.type === 'refund') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (AUD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newProposal.amount}
                onChange={(e) => setNewProposal(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newProposal.description}
              onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Explain your proposal in detail..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowProposalForm(false)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submitProposal}
            disabled={submitting || !newProposal.description.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </div>
      </div>
    </div>
  )

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dispute Resolution Center
          </h1>
          <p className="text-gray-600">
            Resolve disputes fairly and efficiently through mediation and negotiation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Disputes List */}
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
                    <option value="investigating">Investigating</option>
                    <option value="mediation">Mediation</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="payment">Payment</option>
                    <option value="quality">Quality</option>
                    <option value="completion">Completion</option>
                    <option value="safety">Safety</option>
                    <option value="behavior">Behavior</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Disputes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Your Disputes ({disputes.length})</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {disputes.length === 0 ? (
                  <div className="p-8 text-center">
                    <ScaleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Disputes Found
                    </h3>
                    <p className="text-gray-600">
                      No disputes match your current filters
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {disputes.map((dispute) => {
                      const IconComponent = getDisputeTypeIcon(dispute.dispute_type)
                      const isComplainant = dispute.complainant_id === user?.id
                      
                      return (
                        <div
                          key={dispute.id}
                          onClick={() => setSelectedDispute(dispute)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedDispute?.id === dispute.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <IconComponent className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{dispute.title}</h3>
                                <p className="text-sm text-gray-600">{dispute.job.title}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(dispute.status)}`}>
                              {dispute.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isComplainant ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {isComplainant ? 'You filed' : 'Filed against you'}
                              </span>
                              {dispute.amount_disputed && (
                                <span className="text-red-600 font-medium">
                                  ${dispute.amount_disputed.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500">
                              {new Date(dispute.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dispute Detail */}
          <div>
            {selectedDispute ? (
              <DisputeDetail />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center">
                  <ScaleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a dispute to view details
                  </h3>
                  <p className="text-gray-600">
                    Choose a dispute from the list to view the conversation and make proposals
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showProposalForm && <ProposalForm />}
      <MobileNavigation />
    </div>
  )
}