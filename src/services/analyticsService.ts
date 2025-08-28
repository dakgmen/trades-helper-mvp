import { supabase } from '../lib/supabase'
import type { SystemMetrics, FraudAlert } from '../types'

export class AnalyticsService {
  // Get comprehensive system metrics for admin dashboard
  static async getSystemMetrics(
    startDate: string,
    endDate: string
  ): Promise<{
    overview: SystemMetrics
    trends: SystemMetrics[]
    userAnalytics: {
      new_registrations_by_day: Array<{ date: string; count: number; role: string }>
      active_users_by_role: { tradies: number; helpers: number }
      churn_rate: number
    }
    jobAnalytics: {
      jobs_by_status: { [status: string]: number }
      completion_rate: number
      avg_time_to_completion_hours: number
      jobs_by_category: { [category: string]: number }
    }
    financialAnalytics: {
      total_platform_revenue: number
      avg_transaction_value: number
      payment_method_distribution: { [method: string]: number }
      refund_rate: number
    }
  }> {
    try {
      const [
        overview,
        trends,
        userAnalytics,
        jobAnalytics,
        financialAnalytics
      ] = await Promise.all([
        this.calculateOverviewMetrics(startDate, endDate),
        this.calculateTrendMetrics(startDate, endDate),
        this.calculateUserAnalytics(startDate, endDate),
        this.calculateJobAnalytics(startDate, endDate),
        this.calculateFinancialAnalytics(startDate, endDate)
      ])

      return {
        overview,
        trends,
        userAnalytics,
        jobAnalytics,
        financialAnalytics
      }
    } catch (error) {
      console.error('Error getting system metrics:', error)
      return this.getEmptyMetrics()
    }
  }

  // Calculate overview metrics for a date range
  private static async calculateOverviewMetrics(startDate: string, endDate: string): Promise<SystemMetrics> {
    try {
      // Get user counts
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, role')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Get job counts
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status, created_at, date_time')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Get payment data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Get total users (for active user calculation)
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('id, created_at')

      if (usersError || jobsError || paymentsError || allUsersError) {
        console.error('Error fetching data for overview metrics')
        return this.getEmptySystemMetrics()
      }

      // Calculate metrics
      const totalUsers = allUsers?.length || 0
      const newRegistrations = users?.length || 0
      const jobsPosted = jobs?.length || 0
      const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0
      const totalPayments = payments?.filter(p => p.status === 'released').reduce((sum, p) => sum + p.amount, 0) || 0
      const averageJobValue = completedJobs > 0 ? totalPayments / completedJobs : 0
      const platformRevenue = totalPayments * 0.05 // 5% platform fee

      // Calculate retention rate (simplified - users who created profile and completed at least one job)
      const activeUserIds = new Set(jobs?.map(j => j.tradie_id).concat(jobs?.filter(j => j.assigned_helper_id).map(j => j.assigned_helper_id!)) || [])
      const retentionRate = totalUsers > 0 ? (activeUserIds.size / totalUsers) * 100 : 0

      return {
        date: endDate,
        total_users: totalUsers,
        active_users: activeUserIds.size,
        new_registrations: newRegistrations,
        jobs_posted: jobsPosted,
        jobs_completed: completedJobs,
        total_payments: totalPayments,
        average_job_value: Math.round(averageJobValue * 100) / 100,
        platform_revenue: Math.round(platformRevenue * 100) / 100,
        user_retention_rate: Math.round(retentionRate * 10) / 10
      }
    } catch (error) {
      console.error('Error calculating overview metrics:', error)
      return this.getEmptySystemMetrics()
    }
  }

  // Calculate daily/weekly trends
  private static async calculateTrendMetrics(startDate: string, endDate: string): Promise<SystemMetrics[]> {
    try {
      const trends: SystemMetrics[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Generate daily metrics for the date range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayStart = date.toISOString().split('T')[0]
        const dayEnd = dayStart
        
        const dayMetrics = await this.calculateOverviewMetrics(dayStart, dayEnd)
        trends.push(dayMetrics)
      }

      return trends
    } catch (error) {
      console.error('Error calculating trend metrics:', error)
      return []
    }
  }

  // Calculate user analytics
  private static async calculateUserAnalytics(startDate: string, endDate: string) {
    try {
      // New registrations by day and role
      const { data: newUsers, error: usersError } = await supabase
        .from('profiles')
        .select('created_at, role')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      const registrationsByDay: Array<{ date: string; count: number; role: string }> = []
      
      if (newUsers) {
        const dailyRegistrations = new Map()
        
        newUsers.forEach(user => {
          const date = user.created_at.split('T')[0]
          const key = `${date}-${user.role}`
          
          if (!dailyRegistrations.has(key)) {
            dailyRegistrations.set(key, { date, count: 0, role: user.role })
          }
          
          dailyRegistrations.get(key).count++
        })
        
        registrationsByDay.push(...Array.from(dailyRegistrations.values()))
      }

      // Active users by role
      const { data: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('verified', true)

      const activeByRole = { tradies: 0, helpers: 0 }
      if (activeUsers) {
        activeUsers.forEach(user => {
          if (user.role === 'tradie') activeByRole.tradies++
          else if (user.role === 'helper') activeByRole.helpers++
        })
      }

      // Simple churn rate calculation (users who haven't been active in 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: recentActivity, error: activityError } = await supabase
        .from('jobs')
        .select('tradie_id, assigned_helper_id')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const activeUserIds = new Set()
      if (recentActivity) {
        recentActivity.forEach(job => {
          activeUserIds.add(job.tradie_id)
          if (job.assigned_helper_id) activeUserIds.add(job.assigned_helper_id)
        })
      }

      const totalUsers = activeUsers?.length || 0
      const churnRate = totalUsers > 0 ? ((totalUsers - activeUserIds.size) / totalUsers) * 100 : 0

      return {
        new_registrations_by_day: registrationsByDay,
        active_users_by_role: activeByRole,
        churn_rate: Math.round(churnRate * 10) / 10
      }
    } catch (error) {
      console.error('Error calculating user analytics:', error)
      return {
        new_registrations_by_day: [],
        active_users_by_role: { tradies: 0, helpers: 0 },
        churn_rate: 0
      }
    }
  }

  // Calculate job analytics
  private static async calculateJobAnalytics(startDate: string, endDate: string) {
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('status, created_at, date_time, required_skills')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (jobsError || !jobs) {
        return this.getEmptyJobAnalytics()
      }

      // Jobs by status
      const jobsByStatus: { [status: string]: number } = {}
      jobs.forEach(job => {
        jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1
      })

      // Completion rate
      const totalJobs = jobs.length
      const completedJobs = jobsByStatus.completed || 0
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

      // Average time to completion
      const completedJobsWithDates = jobs.filter(j => j.status === 'completed' && j.date_time)
      let avgCompletionTime = 0
      
      if (completedJobsWithDates.length > 0) {
        const totalHours = completedJobsWithDates.reduce((sum, job) => {
          const created = new Date(job.created_at).getTime()
          const completed = new Date(job.date_time).getTime()
          return sum + ((completed - created) / (1000 * 60 * 60))
        }, 0)
        
        avgCompletionTime = Math.round((totalHours / completedJobsWithDates.length) * 10) / 10
      }

      // Jobs by category (based on skills)
      const jobsByCategory: { [category: string]: number } = {}
      jobs.forEach(job => {
        if (job.required_skills && job.required_skills.length > 0) {
          job.required_skills.forEach((skill: string) => {
            jobsByCategory[skill] = (jobsByCategory[skill] || 0) + 1
          })
        } else {
          jobsByCategory['General'] = (jobsByCategory['General'] || 0) + 1
        }
      })

      return {
        jobs_by_status: jobsByStatus,
        completion_rate: Math.round(completionRate * 10) / 10,
        avg_time_to_completion_hours: avgCompletionTime,
        jobs_by_category: jobsByCategory
      }
    } catch (error) {
      console.error('Error calculating job analytics:', error)
      return this.getEmptyJobAnalytics()
    }
  }

  // Calculate financial analytics
  private static async calculateFinancialAnalytics(startDate: string, endDate: string) {
    try {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (paymentsError || !payments) {
        return this.getEmptyFinancialAnalytics()
      }

      const releasedPayments = payments.filter(p => p.status === 'released')
      const refundedPayments = payments.filter(p => p.status === 'refunded')

      const totalRevenue = releasedPayments.reduce((sum, p) => sum + p.amount, 0)
      const platformRevenue = totalRevenue * 0.05 // 5% platform fee
      const avgTransactionValue = releasedPayments.length > 0 ? totalRevenue / releasedPayments.length : 0
      const refundRate = payments.length > 0 ? (refundedPayments.length / payments.length) * 100 : 0

      // Payment method distribution (simplified)
      const paymentMethodDist = {
        'Credit Card': payments.length * 0.8, // Simulated
        'Bank Transfer': payments.length * 0.15,
        'Other': payments.length * 0.05
      }

      return {
        total_platform_revenue: Math.round(platformRevenue * 100) / 100,
        avg_transaction_value: Math.round(avgTransactionValue * 100) / 100,
        payment_method_distribution: paymentMethodDist,
        refund_rate: Math.round(refundRate * 10) / 10
      }
    } catch (error) {
      console.error('Error calculating financial analytics:', error)
      return this.getEmptyFinancialAnalytics()
    }
  }

  // Fraud detection and alerts
  static async getFraudAlerts(limit = 20): Promise<FraudAlert[]> {
    try {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select(`
          *,
          user:profiles!user_id(id, full_name, role),
          job:jobs!job_id(title, date_time)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching fraud alerts:', error)
        return []
      }

      return data as FraudAlert[]
    } catch (error) {
      console.error('Error fetching fraud alerts:', error)
      return []
    }
  }

  // Create fraud alert
  static async createFraudAlert(alertData: {
    user_id: string
    job_id?: string
    alert_type: 'fake_job' | 'payment_fraud' | 'identity_fraud' | 'suspicious_behavior'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    auto_detected: boolean
  }): Promise<FraudAlert | null> {
    try {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .insert([{
          ...alertData,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating fraud alert:', error)
        return null
      }

      // Notify admins for high/critical alerts
      if (alertData.severity === 'high' || alertData.severity === 'critical') {
        await this.notifyAdminsOfFraudAlert(data.id, alertData.severity)
      }

      return data as FraudAlert
    } catch (error) {
      console.error('Error creating fraud alert:', error)
      return null
    }
  }

  // Run automated fraud detection
  static async runFraudDetection(): Promise<{ alertsGenerated: number; errors: number }> {
    try {
      let alertsGenerated = 0
      let errors = 0

      // Detect suspicious job patterns
      const suspiciousJobs = await this.detectSuspiciousJobs()
      for (const job of suspiciousJobs) {
        const alert = await this.createFraudAlert({
          user_id: job.tradie_id,
          job_id: job.id,
          alert_type: 'fake_job',
          severity: 'medium',
          description: `Suspicious job pattern detected: ${job.reason}`,
          auto_detected: true
        })
        
        if (alert) alertsGenerated++
        else errors++
      }

      // Detect suspicious payment patterns
      const suspiciousPayments = await this.detectSuspiciousPayments()
      for (const payment of suspiciousPayments) {
        const alert = await this.createFraudAlert({
          user_id: payment.tradie_id,
          job_id: payment.job_id,
          alert_type: 'payment_fraud',
          severity: 'high',
          description: `Suspicious payment pattern detected: ${payment.reason}`,
          auto_detected: true
        })
        
        if (alert) alertsGenerated++
        else errors++
      }

      return { alertsGenerated, errors }
    } catch (error) {
      console.error('Error running fraud detection:', error)
      return { alertsGenerated: 0, errors: 1 }
    }
  }

  // Private helper methods
  private static async detectSuspiciousJobs(): Promise<Array<{ id: string; tradie_id: string; reason: string }>> {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, tradie_id, title, pay_rate, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (error || !jobs) return []

      const suspicious: Array<{ id: string; tradie_id: string; reason: string }> = []

      // Group by tradie
      const jobsByTradie = new Map<string, any[]>()
      jobs.forEach(job => {
        if (!jobsByTradie.has(job.tradie_id)) {
          jobsByTradie.set(job.tradie_id, [])
        }
        jobsByTradie.get(job.tradie_id)!.push(job)
      })

      // Check for suspicious patterns
      jobsByTradie.forEach((tradieJobs, tradieId) => {
        // Too many jobs posted in short time
        if (tradieJobs.length > 10) {
          tradieJobs.forEach(job => {
            suspicious.push({
              id: job.id,
              tradie_id: tradieId,
              reason: 'More than 10 jobs posted in 24 hours'
            })
          })
        }

        // Suspiciously high pay rates
        const avgPayRate = tradieJobs.reduce((sum, j) => sum + j.pay_rate, 0) / tradieJobs.length
        if (avgPayRate > 100) { // More than $100/hour average
          tradieJobs.filter(j => j.pay_rate > 150).forEach(job => {
            suspicious.push({
              id: job.id,
              tradie_id: tradieId,
              reason: `Unusually high pay rate: $${job.pay_rate}/hour`
            })
          })
        }
      })

      return suspicious
    } catch (error) {
      console.error('Error detecting suspicious jobs:', error)
      return []
    }
  }

  private static async detectSuspiciousPayments(): Promise<Array<{ 
    job_id: string; 
    tradie_id: string; 
    reason: string 
  }>> {
    // This would implement payment fraud detection logic
    // For now, return empty array as it requires integration with Stripe webhooks
    return []
  }

  private static async notifyAdminsOfFraudAlert(alertId: string, severity: string): Promise<void> {
    try {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (error || !admins?.length) return

      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: `${severity.toUpperCase()} Fraud Alert`,
        message: 'A new fraud alert requires immediate attention',
        type: 'system',
        data: { fraud_alert_id: alertId, severity },
        created_at: new Date().toISOString()
      }))

      await supabase.from('notifications').insert(notifications)
    } catch (error) {
      console.error('Error notifying admins of fraud alert:', error)
    }
  }

  // Helper methods for empty states
  private static getEmptyMetrics() {
    return {
      overview: this.getEmptySystemMetrics(),
      trends: [],
      userAnalytics: {
        new_registrations_by_day: [],
        active_users_by_role: { tradies: 0, helpers: 0 },
        churn_rate: 0
      },
      jobAnalytics: this.getEmptyJobAnalytics(),
      financialAnalytics: this.getEmptyFinancialAnalytics()
    }
  }

  private static getEmptySystemMetrics(): SystemMetrics {
    return {
      date: new Date().toISOString().split('T')[0],
      total_users: 0,
      active_users: 0,
      new_registrations: 0,
      jobs_posted: 0,
      jobs_completed: 0,
      total_payments: 0,
      average_job_value: 0,
      platform_revenue: 0,
      user_retention_rate: 0
    }
  }

  private static getEmptyJobAnalytics() {
    return {
      jobs_by_status: {},
      completion_rate: 0,
      avg_time_to_completion_hours: 0,
      jobs_by_category: {}
    }
  }

  private static getEmptyFinancialAnalytics() {
    return {
      total_platform_revenue: 0,
      avg_transaction_value: 0,
      payment_method_distribution: {},
      refund_rate: 0
    }
  }
}