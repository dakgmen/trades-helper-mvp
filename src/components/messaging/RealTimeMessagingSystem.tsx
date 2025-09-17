import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  Send,
  Paperclip,
  Smile,
  Video,
  MoreVertical,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Phone
} from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: string[];
  read_by: string[];
  created_at: string;
  updated_at?: string;
  edited?: boolean;
  sender: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  job_id?: string;
  participants: string[];
  title: string;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
  job?: {
    title: string;
    status: string;
  };
  participants_data: Array<{
    id: string;
    full_name: string;
    avatar_url?: string;
    online_status?: boolean;
  }>;
}

interface RealTimeMessagingSystemProps {
  jobId?: string;
  conversationId?: string;
  onConversationSelect?: (conversation: Conversation) => void;
}

export const RealTimeMessagingSystem: React.FC<RealTimeMessagingSystemProps> = ({
  conversationId: initialConversationId,
  onConversationSelect
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Realtime subscriptions
  const conversationChannel = useRef<RealtimeChannel | null>(null);
  const messageChannel = useRef<RealtimeChannel | null>(null);
  const presenceChannel = useRef<RealtimeChannel | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          job:jobs(title, status),
          participants_data:conversation_participants(
            user:profiles(id, full_name, avatar_url, online_status)
          ),
          last_message:messages(
            id, content, message_type, sender_id, created_at,
            sender:profiles(full_name)
          )
        `)
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedConversations = data?.map(conv => ({
        ...conv,
        participants_data: conv.participants_data,
        unread_count: 0 // Calculate this separately
      })) || [];

      setConversations(processedConversations);

      // Calculate unread counts
      for (const conv of processedConversations) {
        const unreadCount = await getUnreadCount(conv.id);
        setConversations(prev => 
          prev.map(c => c.id === conv.id ? { ...c, unread_count: unreadCount } : c)
        );
      }

    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  const getUnreadCount = async (conversationId: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .not('sender_id', 'eq', user.id)
        .not('read_by', 'cs', `[${user.id}]`);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read_by: supabase.rpc('array_append', { 
            arr: 'read_by', 
            elem: user.id 
          })
        })
        .eq('conversation_id', conversationId)
        .not('sender_id', 'eq', user.id)
        .not('read_by', 'cs', `[${user.id}]`);

      if (error) throw error;

      // Update unread count in conversations
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
      );

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    // Conversations subscription
    conversationChannel.current = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participants.cs.[${user.id}]`
      }, (payload) => {
        handleConversationChange(payload);
      })
      .subscribe();

    // Messages subscription
    messageChannel.current = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        handleNewMessage(payload.new as Message);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        handleMessageUpdate(payload.new as Message);
      })
      .subscribe();
  }, [user]);

  const setupPresenceTracking = useCallback(() => {
    if (!user) return;

    presenceChannel.current = supabase
      .channel('online_users')
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.current?.presenceState?.() || {};
        const users = new Set<string>();

        Object.values(newState).forEach((presences: unknown) => {
          if (Array.isArray(presences)) {
            presences.forEach((presence: { user_id?: string }) => {
              if (presence?.user_id) {
                users.add(presence.user_id);
              }
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.current?.track?.({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });
  }, [user]);

  const cleanupSubscriptions = () => {
    if (conversationChannel.current) {
      supabase.removeChannel(conversationChannel.current);
    }
    if (messageChannel.current) {
      supabase.removeChannel(messageChannel.current);
    }
    if (presenceChannel.current) {
      supabase.removeChannel(presenceChannel.current);
    }
  };

  const handleConversationChange = (payload: unknown) => {
    console.log('Conversation change:', payload);
    // Refresh conversations
    fetchConversations();
  };

  const handleNewMessage = (message: Message) => {
    // Add sender info
    if (activeConversation && message.conversation_id === activeConversation.id) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // Mark as read if we're viewing the conversation
      if (message.sender_id !== user?.id) {
        markMessagesAsRead(activeConversation.id);
      }
    }
    
    // Update conversation list
    fetchConversations();
    
    // Show notification if not from current user
    if (message.sender_id !== user?.id && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`New message from ${message.sender?.full_name}`, {
          body: message.content,
          icon: '/icon-192x192.png'
        });
      }
    }
  };

  const handleMessageUpdate = (message: Message) => {
    if (activeConversation && message.conversation_id === activeConversation.id) {
      setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    }
  };

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
    onConversationSelect?.(conversation);
  }, [fetchMessages, onConversationSelect]);

  const sendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text',
          read_by: [user.id]
        })
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !activeConversation) return;

    for (const file of Array.from(files)) {
      try {
        setSending(true);
        
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName);

        // Send message with attachment
        const messageType = file.type.startsWith('image/') ? 'image' : 'file';
        
        await supabase
          .from('messages')
          .insert({
            conversation_id: activeConversation.id,
            sender_id: user.id,
            content: file.name,
            message_type: messageType,
            attachments: [urlData.publicUrl],
            read_by: [user.id]
          });

      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setSending(false);
      }
    }
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants_data.some(p => 
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.sender_id === user?.id;
    const showAvatar = !isCurrentUser && (
      index === 0 || 
      messages[index - 1]?.sender_id !== message.sender_id
    );

    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 mb-4 ${
          isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        {showAvatar && !isCurrentUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {message.sender?.full_name?.[0] || 'U'}
            </div>
          </div>
        )}
        
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          {showAvatar && !isCurrentUser && (
            <p className="text-xs text-gray-600 mb-1">
              {message.sender?.full_name}
            </p>
          )}
          
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.message_type === 'text' && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            
            {message.message_type === 'image' && message.attachments && (
              <div>
                <img
                  src={message.attachments[0]}
                  alt="Attachment"
                  className="max-w-full h-auto rounded-lg mb-2"
                />
                <p className="text-xs">{message.content}</p>
              </div>
            )}
            
            {message.message_type === 'file' && message.attachments && (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{message.content}</span>
                <a
                  href={message.attachments[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                >
                  <Download className="w-3 h-3" />
                </a>
              </div>
            )}
            
            {message.message_type === 'system' && (
              <p className="text-xs italic">{message.content}</p>
            )}
          </div>
          
          <div className={`flex items-center mt-1 space-x-1 ${
            isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.created_at)}
            </span>
            
            {isCurrentUser && (
              <div className="text-xs">
                {message.read_by.length > 1 ? (
                  <CheckCircle2 className="w-3 h-3 text-blue-500" />
                ) : (
                  <Clock className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )}
            
            {message.edited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderConversation = (conversation: Conversation) => (
    <div
      key={conversation.id}
      onClick={() => selectConversation(conversation)}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 relative">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {conversation.title[0] || 'C'}
          </div>
          {conversation.participants_data.some(p => isOnline(p.id)) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.title}
            </h3>
            <div className="flex items-center space-x-2">
              {conversation.last_message && (
                <span className="text-xs text-gray-500">
                  {formatMessageTime(conversation.last_message.created_at)}
                </span>
              )}
              {conversation.unread_count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-0">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </span>
              )}
            </div>
          </div>
          
          {conversation.job && (
            <p className="text-xs text-blue-600 mb-1">
              Job: {conversation.job.title}
            </p>
          )}
          
          {conversation.last_message && (
            <p className="text-sm text-gray-600 truncate">
              {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
              {conversation.last_message.message_type === 'text' 
                ? conversation.last_message.content
                : `Sent ${conversation.last_message.message_type}`
              }
            </p>
          )}
          
          <div className="flex items-center mt-1 space-x-2">
            {conversation.participants_data.filter(p => p.id !== user?.id).map(participant => (
              <span key={participant.id} className="text-xs text-gray-500">
                {participant.full_name}
                {isOnline(participant.id) && (
                  <span className="ml-1 text-green-500">●</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupPresenceTracking();
      setupRealtimeSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [user, fetchConversations, setupPresenceTracking, setupRealtimeSubscriptions]);

  useEffect(() => {
    if (initialConversationId) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        selectConversation(conversation);
      }
    }
  }, [conversations, initialConversationId, selectConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen max-h-screen bg-white">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(renderConversation)
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {activeConversation.title[0]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeConversation.title}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600">
                    {activeConversation.participants_data
                      .filter(p => p.id !== user?.id)
                      .map(participant => (
                        <span key={participant.id} className="flex items-center">
                          {participant.full_name}
                          {isOnline(participant.id) && (
                            <span className="ml-1 text-green-500">● Online</span>
                          )}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : (
                <div>
                  {messages.map((message, index) => renderMessage(message, index))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={sending}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMessagingSystem;