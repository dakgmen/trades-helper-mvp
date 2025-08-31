import { supabase } from '../lib/supabase'
import type { Dispute, DisputeStatus, DisputeReason } from '../types'

export class DisputeService {
  // Raise a new dispute
  static async createDispute(disputeData: {
    job_id: string
    raised_by_id: string
    against_id: string
    reason: DisputeReason
    description: string
  }): Promise<Dispute | null> {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .insert([{
          ...disputeData,
          status: 'open' as DisputeStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating dispute:', error)
        return null
      }

      // Send notification to admin
      await this.notifyAdminOfNewDispute(data.id)
      
      return data as Dispute
    } catch (error) {
      console.error('Error creating dispute:', error)
      return null
    }
  }

  // Get disputes for a specific job
  static async getDisputesForJob(jobId: string): Promise<Dispute[]> {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          raised_by:profiles!raised_by_id(id, full_name, role),
          against:profiles!against_id(id, full_name, role),
          job:jobs!job_id(title, date_time),
          resolved_by_admin:profiles!resolved_by_admin_id(id, full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching disputes for job:', error)
        return []
      }

      return data as Dispute[]
    } catch (error) {
      console.error('Error fetching disputes for job:', error)
      return []
    }
  }

  // Get disputes involving a specific user
  static async getDisputesForUser(userId: string): Promise<Dispute[]> {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          raised_by:profiles!raised_by_id(id, full_name, role),
          against:profiles!against_id(id, full_name, role),
          job:jobs!job_id(title, date_time),
          resolved_by_admin:profiles!resolved_by_admin_id(id, full_name)
        `)
        .or(`raised_by_id.eq.${userId},against_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching disputes for user:', error)
        return []
      }

      return data as Dispute[]
    } catch (error) {
      console.error('Error fetching disputes for user:', error)
      return []
    }
  }

  // Get all disputes (admin only)
  static async getAllDisputes(
    status?: DisputeStatus,
    limit = 50,
    offset = 0
  ): Promise<Dispute[]> {
    try {
      let query = supabase
        .from('disputes')
        .select(`
          *,
          raised_by:profiles!raised_by_id(id, full_name, role),
          against:profiles!against_id(id, full_name, role),
          job:jobs!job_id(title, date_time, status),
          resolved_by_admin:profiles!resolved_by_admin_id(id, full_name)
        `)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching all disputes:', error)
        return []
      }

      return data as Dispute[]
    } catch (error) {
      console.error('Error fetching all disputes:', error)
      return []
    }
  }

  // Update dispute status (admin only)
  static async updateDisputeStatus(
    disputeId: string,
    status: DisputeStatus,
    adminId: string,
    adminNotes?: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      const updateData: Partial<{ status: string; admin_notes: string; resolution: string; updated_at: string; resolved_at: string; resolved_by_admin_id: string }> = {
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      }

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by_admin_id = adminId
        updateData.resolution = resolution
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId)

      if (error) {
        console.error('Error updating dispute status:', error)
        return false
      }

      // Send notification to involved parties
      await this.notifyPartiesOfDisputeUpdate(disputeId, status)

      return true
    } catch (error) {
      console.error('Error updating dispute status:', error)
      return false
    }
  }

  // Check if user can raise dispute for this job
  static async canRaiseDispute(jobId: string, userId: string): Promise<boolean> {
    try {
      // Check if job exists and user is involved
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('status, tradie_id, assigned_helper_id')
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        return false
      }

      // User must be either tradie or assigned helper
      const isParticipant = job.tradie_id === userId || job.assigned_helper_id === userId
      if (!isParticipant) {
        return false
      }

      // Job should be assigned, in_progress, or completed to raise dispute
      const validStatuses = ['assigned', 'in_progress', 'completed']
      if (!validStatuses.includes(job.status)) {
        return false
      }

      // Check if there's already an open dispute for this job
      const { data: existingDispute, error: disputeError } = await supabase
        .from('disputes')
        .select('id')
        .eq('job_id', jobId)
        .in('status', ['open', 'in_review'])
        .single()

      if (disputeError && disputeError.code !== 'PGRST116') {
        console.error('Error checking existing dispute:', disputeError)
        return false
      }

      return !existingDispute
    } catch (error) {
      console.error('Error checking dispute eligibility:', error)
      return false
    }
  }

  // Get dispute statistics (admin dashboard)
  static async getDisputeStatistics(): Promise<{
    total: number
    open: number
    in_review: number
    resolved: number
    dismissed: number
    avg_resolution_time_hours: number
  }> {
    try {
      const { data: disputes, error } = await supabase
        .from('disputes')
        .select('status, created_at, resolved_at')

      if (error) {
        console.error('Error fetching dispute statistics:', error)
        return {
          total: 0,
          open: 0,
          in_review: 0,
          resolved: 0,
          dismissed: 0,
          avg_resolution_time_hours: 0
        }
      }

      const stats = {
        total: disputes.length,
        open: disputes.filter(d => d.status === 'open').length,
        in_review: disputes.filter(d => d.status === 'in_review').length,
        resolved: disputes.filter(d => d.status === 'resolved').length,
        dismissed: disputes.filter(d => d.status === 'dismissed').length,
        avg_resolution_time_hours: 0
      }

      // Calculate average resolution time
      const resolvedDisputes = disputes.filter(d => 
        (d.status === 'resolved' || d.status === 'dismissed') && d.resolved_at
      )

      if (resolvedDisputes.length > 0) {
        const totalHours = resolvedDisputes.reduce((sum, dispute) => {
          const created = new Date(dispute.created_at).getTime()
          const resolved = new Date(dispute.resolved_at!).getTime()
          return sum + ((resolved - created) / (1000 * 60 * 60))
        }, 0)

        stats.avg_resolution_time_hours = Math.round(totalHours / resolvedDisputes.length)
      }

      return stats
    } catch (error) {
      console.error('Error calculating dispute statistics:', error)
      return {
        total: 0,
        open: 0,
        in_review: 0,
        resolved: 0,
        dismissed: 0,
        avg_resolution_time_hours: 0
      }
    }
  }

  // Private helper methods
  private static async notifyAdminOfNewDispute(disputeId: string): Promise<void> {
    try {
      // Get admin users
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (error || !admins?.length) {
        return
      }

      // Create notifications for all admins
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: 'New Dispute Raised',
        message: 'A new dispute has been raised and requires admin review',
        type: 'system',
        data: { dispute_id: disputeId },
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('notifications')
        .insert(notifications)
    } catch (error) {
      console.error('Error notifying admin of new dispute:', error)
    }
  }

  private static async notifyPartiesOfDisputeUpdate(
    disputeId: string, 
    status: DisputeStatus
  ): Promise<void> {
    try {
      // Get dispute details
      const { data: dispute, error } = await supabase
        .from('disputes')
        .select('raised_by_id, against_id')
        .eq('id', disputeId)
        .single()

      if (error || !dispute) {
        return
      }

      const statusMessages = {
        open: 'Your dispute is now open and under review',
        in_review: 'Your dispute is being reviewed by our team',
        resolved: 'Your dispute has been resolved',
        dismissed: 'Your dispute has been dismissed'
      }

      const notifications = [
        {
          user_id: dispute.raised_by_id,
          title: 'Dispute Update',
          message: statusMessages[status],
          type: 'system',
          data: { dispute_id: disputeId },
          created_at: new Date().toISOString()
        },
        {
          user_id: dispute.against_id,
          title: 'Dispute Update',
          message: statusMessages[status],
          type: 'system',
          data: { dispute_id: disputeId },
          created_at: new Date().toISOString()
        }
      ]

      await supabase
        .from('notifications')
        .insert(notifications)
    } catch (error) {
      console.error('Error notifying parties of dispute update:', error)
    }
  }
}