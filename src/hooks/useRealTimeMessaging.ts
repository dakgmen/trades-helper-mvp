import { useEffect, useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../types'

interface UseRealTimeMessagingProps {
  userId: string
  onMessageReceived?: (message: Message) => void
  onUserStatusChange?: (userId: string, status: 'online' | 'offline' | 'away') => void
}

export const useRealTimeMessaging = ({
  userId,
  onMessageReceived,
  onUserStatusChange
}: UseRealTimeMessagingProps) => {
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})

  // Subscribe to new messages
  useEffect(() => {
    if (!userId) return

    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          onMessageReceived?.(newMessage)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(messagesSubscription)
    }
  }, [userId, onMessageReceived])

  // Subscribe to user presence
  useEffect(() => {
    if (!userId) return

    const presenceChannel = supabase.channel('user-presence')
    
    const presenceSubscription = presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        Object.keys(state).forEach(userId => {
          const presence = state[userId]?.[0]
          if (presence) {
            const status = (presence as {status?: string}).status
            const validStatus: "online" | "offline" | "away" = 
              status === 'online' || status === 'offline' || status === 'away' 
                ? status 
                : 'offline'
            onUserStatusChange?.(userId, validStatus)
          }
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0]
        if (presence) {
          onUserStatusChange?.(key, presence.status)
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        onUserStatusChange?.(key, 'offline')
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            status: 'online',
            last_seen: new Date().toISOString()
          })
        }
      })

    return () => {
      presenceChannel.untrack()
      supabase.removeChannel(presenceSubscription)
    }
  }, [userId, onUserStatusChange])

  // Subscribe to typing indicators
  useEffect(() => {
    if (!userId) return

    const typingChannel = supabase.channel('typing-indicators')
    
    const typingSubscription = typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, is_typing, job_id } = payload
        if (user_id !== userId) {
          setTypingUsers(prev => ({
            ...prev,
            [`${job_id}-${user_id}`]: is_typing
          }))

          // Clear typing indicator after 3 seconds
          if (is_typing) {
            setTimeout(() => {
              setTypingUsers(prev => ({
                ...prev,
                [`${job_id}-${user_id}`]: false
              }))
            }, 3000)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(typingSubscription)
    }
  }, [userId])

  const sendTypingIndicator = useCallback((jobId: string, isTyping: boolean) => {
    supabase.channel('typing-indicators').send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        job_id: jobId,
        is_typing: isTyping
      }
    })
  }, [userId])

  const updateUserStatus = useCallback(async (status: 'online' | 'offline' | 'away') => {
    const channel = supabase.channel('user-presence')
    await channel.track({
      user_id: userId,
      status,
      last_seen: new Date().toISOString()
    })
  }, [userId])

  return {
    isConnected,
    typingUsers,
    sendTypingIndicator,
    updateUserStatus
  }
}