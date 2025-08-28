import { supabase } from '../lib/supabase'
import type { SupportTicket, SupportMessage, SupportTicketStatus, SupportTicketPriority, SupportTicketCategory } from '../types'

export class SupportService {
  // Create a new support ticket
  static async createTicket(ticketData: {
    user_id: string
    job_id?: string
    subject: string
    description: string
    priority: SupportTicketPriority
    category: SupportTicketCategory
    attachments?: string[]
  }): Promise<SupportTicket | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{
          ...ticketData,
          status: 'open' as SupportTicketStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating support ticket:', error)
        return null
      }

      // If there are attachments, create initial message
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        await this.addMessage(data.id, ticketData.user_id, 'user', ticketData.description, ticketData.attachments)
      }

      // Notify admins of new ticket
      await this.notifyAdminsOfNewTicket(data.id, ticketData.priority)

      return data as SupportTicket
    } catch (error) {
      console.error('Error creating support ticket:', error)
      return null
    }
  }

  // Get tickets for a user
  static async getUserTickets(userId: string, status?: SupportTicketStatus): Promise<SupportTicket[]> {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          assigned_admin:profiles!assigned_admin_id(id, full_name),
          job:jobs!job_id(title, date_time)
        `)
        .eq('user_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user tickets:', error)
        return []
      }

      return data as SupportTicket[]
    } catch (error) {
      console.error('Error fetching user tickets:', error)
      return []
    }
  }

  // Get all tickets (admin view)
  static async getAllTickets(
    filters?: {
      status?: SupportTicketStatus
      priority?: SupportTicketPriority
      category?: SupportTicketCategory
      assigned_admin_id?: string
    },
    limit = 50,
    offset = 0
  ): Promise<SupportTicket[]> {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!user_id(id, full_name, role),
          assigned_admin:profiles!assigned_admin_id(id, full_name),
          job:jobs!job_id(title, date_time)
        `)

      if (filters) {
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.priority) query = query.eq('priority', filters.priority)
        if (filters.category) query = query.eq('category', filters.category)
        if (filters.assigned_admin_id) query = query.eq('assigned_admin_id', filters.assigned_admin_id)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching all tickets:', error)
        return []
      }

      return data as SupportTicket[]
    } catch (error) {
      console.error('Error fetching all tickets:', error)
      return []
    }
  }

  // Get a specific ticket with messages
  static async getTicketWithMessages(ticketId: string): Promise<{
    ticket: SupportTicket | null
    messages: SupportMessage[]
  }> {
    try {
      // Get ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!user_id(id, full_name, role),
          assigned_admin:profiles!assigned_admin_id(id, full_name),
          job:jobs!job_id(title, date_time)
        `)
        .eq('id', ticketId)
        .single()

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError)
        return { ticket: null, messages: [] }
      }

      // Get messages for this ticket
      const { data: messages, error: messagesError } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, role)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error fetching ticket messages:', messagesError)
        return { ticket: ticket as SupportTicket, messages: [] }
      }

      return {
        ticket: ticket as SupportTicket,
        messages: messages as SupportMessage[]
      }
    } catch (error) {
      console.error('Error fetching ticket with messages:', error)
      return { ticket: null, messages: [] }
    }
  }

  // Add a message to a ticket
  static async addMessage(
    ticketId: string,
    senderId: string,
    senderType: 'user' | 'admin',
    message: string,
    attachments: string[] = []
  ): Promise<SupportMessage | null> {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: ticketId,
          sender_id: senderId,
          sender_type: senderType,
          message,
          attachments,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding message:', error)
        return null
      }

      // Update ticket's updated_at timestamp
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      // Notify relevant parties
      await this.notifyMessageAdded(ticketId, senderId, senderType)

      return data as SupportMessage
    } catch (error) {
      console.error('Error adding message:', error)
      return null
    }
  }

  // Update ticket status (admin only)
  static async updateTicketStatus(
    ticketId: string,
    status: SupportTicketStatus,
    adminId: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolution = resolution
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)

      if (error) {
        console.error('Error updating ticket status:', error)
        return false
      }

      // If resolving, add a system message
      if (status === 'resolved' && resolution) {
        await this.addMessage(ticketId, adminId, 'admin', `Ticket resolved: ${resolution}`)
      }

      // Notify user of status change
      await this.notifyTicketStatusChange(ticketId, status)

      return true
    } catch (error) {
      console.error('Error updating ticket status:', error)
      return false
    }
  }

  // Assign ticket to admin
  static async assignTicket(ticketId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_admin_id: adminId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)

      if (error) {
        console.error('Error assigning ticket:', error)
        return false
      }

      // Add assignment message
      await this.addMessage(ticketId, adminId, 'admin', 'I have been assigned to handle this ticket.')

      return true
    } catch (error) {
      console.error('Error assigning ticket:', error)
      return false
    }
  }

  // Get ticket statistics (admin dashboard)
  static async getTicketStatistics(): Promise<{
    total: number
    open: number
    in_progress: number
    resolved: number
    closed: number
    by_priority: { [key: string]: number }
    by_category: { [key: string]: number }
    avg_resolution_time_hours: number
    response_time_stats: {
      avg_first_response_hours: number
      avg_resolution_hours: number
    }
  }> {
    try {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('status, priority, category, created_at, resolved_at')

      if (error) {
        console.error('Error fetching ticket statistics:', error)
        return this.getEmptyStats()
      }

      const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        by_priority: {} as { [key: string]: number },
        by_category: {} as { [key: string]: number },
        avg_resolution_time_hours: 0,
        response_time_stats: {
          avg_first_response_hours: 0,
          avg_resolution_hours: 0
        }
      }

      // Count by priority
      tickets.forEach(ticket => {
        stats.by_priority[ticket.priority] = (stats.by_priority[ticket.priority] || 0) + 1
        stats.by_category[ticket.category] = (stats.by_category[ticket.category] || 0) + 1
      })

      // Calculate resolution times
      const resolvedTickets = tickets.filter(t => 
        (t.status === 'resolved' || t.status === 'closed') && t.resolved_at
      )

      if (resolvedTickets.length > 0) {
        const totalHours = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at).getTime()
          const resolved = new Date(ticket.resolved_at!).getTime()
          return sum + ((resolved - created) / (1000 * 60 * 60))
        }, 0)

        stats.avg_resolution_time_hours = Math.round(totalHours / resolvedTickets.length * 10) / 10
        stats.response_time_stats.avg_resolution_hours = stats.avg_resolution_time_hours
      }

      return stats
    } catch (error) {
      console.error('Error calculating ticket statistics:', error)
      return this.getEmptyStats()
    }
  }

  // Search tickets
  static async searchTickets(
    query: string,
    filters?: {
      status?: SupportTicketStatus
      category?: SupportTicketCategory
    }
  ): Promise<SupportTicket[]> {
    try {
      let supabaseQuery = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!user_id(id, full_name, role),
          assigned_admin:profiles!assigned_admin_id(id, full_name),
          job:jobs!job_id(title, date_time)
        `)
        .or(`subject.ilike.%${query}%,description.ilike.%${query}%`)

      if (filters?.status) {
        supabaseQuery = supabaseQuery.eq('status', filters.status)
      }

      if (filters?.category) {
        supabaseQuery = supabaseQuery.eq('category', filters.category)
      }

      const { data, error } = await supabaseQuery
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error searching tickets:', error)
        return []
      }

      return data as SupportTicket[]
    } catch (error) {
      console.error('Error searching tickets:', error)
      return []
    }
  }

  // Private helper methods
  private static getEmptyStats() {
    return {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      by_priority: {},
      by_category: {},
      avg_resolution_time_hours: 0,
      response_time_stats: {
        avg_first_response_hours: 0,
        avg_resolution_hours: 0
      }
    }
  }

  private static async notifyAdminsOfNewTicket(ticketId: string, priority: SupportTicketPriority): Promise<void> {
    try {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (error || !admins?.length) {
        return
      }

      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: `New Support Ticket (${priority.toUpperCase()})`,
        message: 'A new support ticket has been created and needs attention',
        type: 'system',
        data: { ticket_id: ticketId, priority },
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('notifications')
        .insert(notifications)
    } catch (error) {
      console.error('Error notifying admins of new ticket:', error)
    }
  }

  private static async notifyMessageAdded(
    ticketId: string,
    senderId: string,
    senderType: 'user' | 'admin'
  ): Promise<void> {
    try {
      // Get ticket details to find who to notify
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .select('user_id, assigned_admin_id')
        .eq('id', ticketId)
        .single()

      if (error || !ticket) {
        return
      }

      let notifyUserId: string | null = null

      if (senderType === 'user' && ticket.assigned_admin_id) {
        // User sent message, notify assigned admin
        notifyUserId = ticket.assigned_admin_id
      } else if (senderType === 'admin' && ticket.user_id !== senderId) {
        // Admin sent message, notify ticket owner
        notifyUserId = ticket.user_id
      }

      if (notifyUserId) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: notifyUserId,
            title: 'New Support Message',
            message: 'You have received a new message on your support ticket',
            type: 'system',
            data: { ticket_id: ticketId },
            created_at: new Date().toISOString()
          }])
      }
    } catch (error) {
      console.error('Error notifying message added:', error)
    }
  }

  private static async notifyTicketStatusChange(ticketId: string, status: SupportTicketStatus): Promise<void> {
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .select('user_id, subject')
        .eq('id', ticketId)
        .single()

      if (error || !ticket) {
        return
      }

      const statusMessages = {
        open: 'Your support ticket is now open',
        in_progress: 'Your support ticket is being worked on',
        resolved: 'Your support ticket has been resolved',
        closed: 'Your support ticket has been closed'
      }

      await supabase
        .from('notifications')
        .insert([{
          user_id: ticket.user_id,
          title: 'Support Ticket Update',
          message: statusMessages[status],
          type: 'system',
          data: { ticket_id: ticketId, status },
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.error('Error notifying ticket status change:', error)
    }
  }
}