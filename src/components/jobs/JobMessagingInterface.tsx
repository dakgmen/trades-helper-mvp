import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

interface Message {
  id: string
  job_id: string
  sender_id: string
  recipient_id: string
  message: string
  message_type: 'text' | 'image' | 'file' | 'system'
  attachment_url?: string
  attachment_name?: string
  is_read: boolean
  created_at: string
  sender?: {
    full_name: string
    avatar_url?: string
    role: string
  }
}

interface Job {
  id: string
  title: string
  status: string
  client_id: string
  tradie_id?: string
  assigned_helper_id?: string
  client?: {
    full_name: string
    avatar_url?: string
  }
  tradie?: {
    full_name: string
    avatar_url?: string
  }
  helper?: {
    full_name: string
    avatar_url?: string
  }
}

interface Participant {
  id: string
  full_name: string
  role: string
  avatar_url?: string
  last_seen?: string
}

interface JobMessagingInterfaceProps {
  jobId: string
}

export function JobMessagingInterface({ jobId }: JobMessagingInterfaceProps) {
  const { user } = useAuth()
  // TODO: const profile = useAuth().profile // Currently unused
  const [job, setJob] = useState<Job | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  // TODO: const [showAttachments, setShowAttachments] = useState(false) // Currently unused
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showSuccess, showError } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchJobDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          client:profiles!client_id(full_name, avatar_url),
          tradie:profiles!tradie_id(full_name, avatar_url),
          helper:profiles!assigned_helper_id(full_name, avatar_url)
        `)
        .eq('id', jobId)
        .single()

      if (error) throw error
      setJob(data)

      // Set up participants
      const participants: Participant[] = []
      
      if (data.client) {
        participants.push({
          id: data.client_id,
          full_name: data.client.full_name,
          role: 'client',
          avatar_url: data.client.avatar_url
        })
      }
      
      if (data.tradie_id && data.tradie) {
        participants.push({
          id: data.tradie_id,
          full_name: data.tradie.full_name,
          role: 'tradie',
          avatar_url: data.tradie.avatar_url
        })
      }
      
      if (data.assigned_helper_id && data.helper) {
        participants.push({
          id: data.assigned_helper_id,
          full_name: data.helper.full_name,
          role: 'helper',
          avatar_url: data.helper.avatar_url
        })
      }

      setParticipants(participants)
    } catch (error) {
      console.error('Error fetching job details:', error)
      showError('Failed to load job details')
    }
  }, [jobId, showError])

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('job_messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url, role)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessageIds = data
          .filter(msg => !msg.is_read && msg.sender_id !== user?.id)
          .map(msg => msg.id)

        if (unreadMessageIds.length > 0) {
          await supabase
            .from('job_messages')
            .update({ is_read: true })
            .in('id', unreadMessageIds)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      showError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [jobId, user?.id, showError])

  useEffect(() => {
    fetchJobDetails()
    fetchMessages()
  }, [fetchJobDetails, fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() && !attachmentFile) return
    if (!user) return

    try {
      setSending(true)
      let attachmentUrl = null
      let attachmentName = null

      // Upload attachment if present
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `job-attachments/${jobId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, attachmentFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath)

        attachmentUrl = publicUrl
        attachmentName = attachmentFile.name
      }

      // Determine recipients
      const recipients = selectedRecipient === 'all' 
        ? participants.filter(p => p.id !== user.id).map(p => p.id)
        : [selectedRecipient]

      // Send message to each recipient
      for (const recipientId of recipients) {
        const { error } = await supabase
          .from('job_messages')
          .insert({
            job_id: jobId,
            sender_id: user.id,
            recipient_id: recipientId,
            message: newMessage.trim(),
            message_type: attachmentFile ? (attachmentFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
            is_read: false
          })

        if (error) throw error
      }

      setNewMessage('')
      setAttachmentFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      showSuccess('Message sent successfully!')
      fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      showError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB')
        return
      }
      setAttachmentFile(file)
    }
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'client': return 'bg-blue-500'
      case 'tradie': return 'bg-green-500'
      case 'helper': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const isMyMessage = (message: Message) => {
    return message.sender_id === user?.id
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600">The job you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card-standard p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-gray-600">Job Communication</p>
            </div>
            <div className="flex items-center space-x-2">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getRoleColor(participant.role)}`}></div>
                  <span className="text-sm text-gray-600">{participant.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="card-standard flex flex-col h-96 lg:h-[500px]">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
                <p className="text-gray-600">Start the conversation by sending a message below</p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isMyMessage(message) ? 'order-2' : 'order-1'}`}>
                    {!isMyMessage(message) && (
                      <div className="flex items-center mb-1">
                        <div className={`w-2 h-2 rounded-full ${getRoleColor(message.sender?.role || 'user')} mr-2`}></div>
                        <span className="text-xs font-medium text-gray-600">
                          {message.sender?.full_name}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isMyMessage(message)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {message.message && (
                        <p className="text-sm">{message.message}</p>
                      )}
                      
                      {message.attachment_url && (
                        <div className="mt-2">
                          {message.message_type === 'image' ? (
                            <img
                              src={message.attachment_url}
                              alt="Attachment"
                              className="max-w-full h-auto rounded"
                              loading="lazy"
                            />
                          ) : (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 ${
                                isMyMessage(message) ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs underline">{message.attachment_name}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${isMyMessage(message) ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.created_at)}
                      {isMyMessage(message) && (
                        <span className="ml-2">
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            {/* Recipient Selection */}
            {participants.length > 1 && (
              <div className="mb-3">
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="form-field text-sm"
                >
                  <option value="all">Send to all participants</option>
                  {participants
                    .filter(p => p.id !== user?.id)
                    .map(participant => (
                      <option key={participant.id} value={participant.id}>
                        Send to {participant.full_name} ({participant.role})
                      </option>
                    ))
                  }
                </select>
              </div>
            )}

            {/* Attachment Preview */}
            {attachmentFile && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{attachmentFile.name}</span>
                </div>
                <button
                  onClick={removeAttachment}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Message Input and Actions */}
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={2}
                  className="form-field resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
              </div>

              <div className="flex space-x-2">
                {/* File Attachment */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="p-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                </Button>

                {/* Send Message */}
                <Button
                  onClick={sendMessage}
                  variant="primary"
                  size="sm"
                  loading={sending}
                  disabled={sending || (!newMessage.trim() && !attachmentFile)}
                  className="px-6"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}