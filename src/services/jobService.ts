import { supabase } from '../lib/supabase'
import type { Job } from '../types'

export const jobService = {
  // Create new job
  async createJob(jobData: {
    title: string
    description?: string
    location: string
    date_time: string
    duration_hours: number
    pay_rate: number
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        tradie_id: user.id,
        ...jobData
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get jobs by tradie
  async getJobsByTradie(tradieId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetId = tradieId || user?.id
    if (!targetId) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        job_applications (
          id,
          helper_id,
          status,
          profiles:helper_id (
            full_name,
            verified
          )
        ),
        assigned_helper:assigned_helper_id (
          full_name,
          phone
        )
      `)
      .eq('tradie_id', targetId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get open jobs for helpers
  async getOpenJobs(filters?: {
    location?: string
    minPayRate?: number
    maxDistance?: number
    skills?: string[]
  }) {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        profiles:tradie_id (
          full_name,
          verified
        )
      `)
      .eq('status', 'open')
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters?.minPayRate) {
      query = query.gte('pay_rate', filters.minPayRate)
    }

    const { data, error } = await query.limit(50)
    if (error) throw error
    return data
  },

  // Update job
  async updateJob(jobId: string, updates: Partial<Job>) {
    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)

    if (error) throw error
  },

  // Delete job
  async deleteJob(jobId: string) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) throw error
  },

  // Apply to job
  async applyToJob(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        helper_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get applications by helper
  async getApplicationsByHelper() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        jobs (
          *,
          profiles:tradie_id (
            full_name,
            phone
          )
        )
      `)
      .eq('helper_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Accept job application
  async acceptApplication(applicationId: string) {
    const { data, error } = await supabase.rpc('accept_job_application', {
      application_id: applicationId
    })

    if (error) throw error
    return data
  },

  // Reject job application
  async rejectApplication(applicationId: string) {
    const { error } = await supabase
      .from('job_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId)

    if (error) throw error
  },

  // Mark job as completed
  async completeJob(jobId: string) {
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', jobId)

    if (error) throw error
  }
}