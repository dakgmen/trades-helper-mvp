import { supabase } from '../lib/supabase'
import type { Badge, UserBadge, UserStatistics, BadgeRequirementsResult, LeaderboardUser } from '../types'

export class BadgeService {
  // Get all available badges
  static async getAllBadges(): Promise<Badge[]> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching badges:', error)
        return []
      }

      return data as Badge[]
    } catch (error) {
      console.error('Error fetching badges:', error)
      return []
    }
  }

  // Get badges earned by a user
  static async getUserBadges(userId: string): Promise<Array<UserBadge & { badge: Badge }>> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('Error fetching user badges:', error)
        return []
      }

      return data as Array<UserBadge & { badge: Badge }>
    } catch (error) {
      console.error('Error fetching user badges:', error)
      return []
    }
  }

  // Check and award badges for a user based on their activity
  static async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    try {
      // Get user's current statistics
      const stats = await this.getUserStatistics(userId)
      
      // Get all available badges
      const badges = await this.getAllBadges()
      
      // Get badges already earned by user
      const userBadges = await this.getUserBadges(userId)
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge.id))
      
      const newlyEarnedBadges: UserBadge[] = []

      for (const badge of badges) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) {
          continue
        }

        // Check if user meets criteria for this badge
        const meetsReq = await this.checkBadgeRequirements(badge, stats)
        
        if (meetsReq.eligible) {
          const userBadge = await this.awardBadge(userId, badge.id, meetsReq.criteriaData)
          if (userBadge) {
            newlyEarnedBadges.push(userBadge)
          }
        }
      }

      return newlyEarnedBadges
    } catch (error) {
      console.error('Error checking and awarding badges:', error)
      return []
    }
  }

  // Award a specific badge to a user
  static async awardBadge(
    userId: string,
    badgeId: string,
    criteriaData: Record<string, string | number | boolean>
  ): Promise<UserBadge | null> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .insert([{
          user_id: userId,
          badge_id: badgeId,
          criteria_met: criteriaData,
          earned_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error awarding badge:', error)
        return null
      }

      // Send notification to user
      await this.notifyBadgeEarned(userId, badgeId)

      return data as UserBadge
    } catch (error) {
      console.error('Error awarding badge:', error)
      return null
    }
  }

  // Get user statistics for badge calculations
  private static async getUserStatistics(userId: string): Promise<{
    totalJobsCompleted: number
    totalJobsAsTradie: number
    totalJobsAsHelper: number
    averageRating: number
    totalReviews: number
    yearsActive: number
    referralsMade: number
    totalEarnings: number
    skillsVerified: string[]
    consecutiveFiveStarRatings: number
  }> {
    try {
      // Get profile creation date for years active
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('created_at, skills, verified')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile for stats:', profileError)
      }

      // Get job statistics
      const { data: jobs } = await supabase
        .from('jobs')
        .select('tradie_id, assigned_helper_id, status, date_time')
        .or(`tradie_id.eq.${userId},assigned_helper_id.eq.${userId}`)
        .eq('status', 'completed')

      // Get rating statistics
      const { data: aggregateRating } = await supabase
        .from('aggregate_ratings')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get referral count
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId)
        .eq('status', 'completed')

      // Get payment statistics
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .or(`tradie_id.eq.${userId},helper_id.eq.${userId}`)
        .eq('status', 'released')

      // Get recent reviews for consecutive ratings
      const { data: recentReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate statistics
      const totalJobsCompleted = jobs?.length || 0
      const totalJobsAsTradie = jobs?.filter(j => j.tradie_id === userId).length || 0
      const totalJobsAsHelper = jobs?.filter(j => j.assigned_helper_id === userId).length || 0
      
      const averageRating = aggregateRating?.average_rating || 0
      const totalReviews = aggregateRating?.total_reviews || 0
      
      const yearsActive = profile?.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 0
      
      const referralsMade = referrals?.length || 0
      
      const totalEarnings = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      
      const skillsVerified = profile?.verified ? (profile.skills || []) : []
      
      // Calculate consecutive five star ratings
      let consecutiveFiveStarRatings = 0
      if (recentReviews) {
        for (const review of recentReviews) {
          if (review.rating === 5) {
            consecutiveFiveStarRatings++
          } else {
            break
          }
        }
      }

      return {
        totalJobsCompleted,
        totalJobsAsTradie,
        totalJobsAsHelper,
        averageRating,
        totalReviews,
        yearsActive,
        referralsMade,
        totalEarnings,
        skillsVerified,
        consecutiveFiveStarRatings
      }
    } catch (error) {
      console.error('Error calculating user statistics:', error)
      return {
        totalJobsCompleted: 0,
        totalJobsAsTradie: 0,
        totalJobsAsHelper: 0,
        averageRating: 0,
        totalReviews: 0,
        yearsActive: 0,
        referralsMade: 0,
        totalEarnings: 0,
        skillsVerified: [],
        consecutiveFiveStarRatings: 0
      }
    }
  }

  // Check if user meets requirements for a specific badge
  private static async checkBadgeRequirements(
    badge: Badge,
    stats: UserStatistics
  ): Promise<BadgeRequirementsResult> {
    try {
      const criteria = badge.criteria
      let eligible = true
      const criteriaData: Record<string, string | number | boolean> = {}

      // First Job Completed
      if (criteria.first_job && stats.totalJobsCompleted < 1) {
        eligible = false
      }

      // Job completion thresholds
      if (criteria.jobs_completed && typeof criteria.jobs_completed === 'number' && stats.totalJobsCompleted < criteria.jobs_completed) {
        eligible = false
      }

      // Rating requirements
      if (criteria.min_rating && typeof criteria.min_rating === 'number' && stats.averageRating < criteria.min_rating) {
        eligible = false
      }

      if (criteria.min_reviews && typeof criteria.min_reviews === 'number' && stats.totalReviews < criteria.min_reviews) {
        eligible = false
      }

      // Consecutive five star ratings
      if (criteria.consecutive_five_stars && typeof criteria.consecutive_five_stars === 'number' && stats.consecutiveFiveStarRatings < criteria.consecutive_five_stars) {
        eligible = false
      }

      // Years active
      if (criteria.years_active && typeof criteria.years_active === 'number' && stats.yearsActive < criteria.years_active) {
        eligible = false
      }

      // Referral requirements
      if (criteria.referrals_made && typeof criteria.referrals_made === 'number' && stats.referralsMade < criteria.referrals_made) {
        eligible = false
      }

      // Skills verification
      if (criteria.skills_verified && typeof criteria.skills_verified === 'number' && stats.skillsVerified.length < criteria.skills_verified) {
        eligible = false
      }

      // Earnings threshold
      if (criteria.min_earnings && typeof criteria.min_earnings === 'number' && stats.totalEarnings < criteria.min_earnings) {
        eligible = false
      }

      // Role-specific requirements
      if (criteria.tradie_jobs && typeof criteria.tradie_jobs === 'number' && stats.totalJobsAsTradie < criteria.tradie_jobs) {
        eligible = false
      }

      if (criteria.helper_jobs && typeof criteria.helper_jobs === 'number' && stats.totalJobsAsHelper < criteria.helper_jobs) {
        eligible = false
      }

      // Store relevant stats in criteria data as string
      criteriaData.stats_at_earning = JSON.stringify({
        totalJobsCompleted: stats.totalJobsCompleted,
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        yearsActive: stats.yearsActive,
        referralsMade: stats.referralsMade,
        totalEarnings: stats.totalEarnings,
        earned_at: new Date().toISOString()
      })

      return { eligible, criteriaData }
    } catch (error) {
      console.error('Error checking badge requirements:', error)
      return { eligible: false, criteriaData: {} }
    }
  }

  // Create default badges for the system
  static async createDefaultBadges(): Promise<boolean> {
    try {
      const defaultBadges: Omit<Badge, 'id' | 'created_at'>[] = [
        {
          name: "First Timer",
          description: "Complete your first job",
          icon_url: "/badges/first-timer.svg",
          criteria: { first_job: true },
          is_active: true
        },
        {
          name: "Reliable Helper",
          description: "Complete 5 jobs successfully",
          icon_url: "/badges/reliable-helper.svg",
          criteria: { jobs_completed: 5 },
          is_active: true
        },
        {
          name: "Job Master",
          description: "Complete 25 jobs successfully",
          icon_url: "/badges/job-master.svg",
          criteria: { jobs_completed: 25 },
          is_active: true
        },
        {
          name: "Century Club",
          description: "Complete 100 jobs successfully",
          icon_url: "/badges/century-club.svg",
          criteria: { jobs_completed: 100 },
          is_active: true
        },
        {
          name: "Five Star Professional",
          description: "Maintain a 5.0 rating with 10+ reviews",
          icon_url: "/badges/five-star.svg",
          criteria: { min_rating: 5.0, min_reviews: 10 },
          is_active: true
        },
        {
          name: "Top Rated",
          description: "Maintain a 4.8+ rating with 25+ reviews",
          icon_url: "/badges/top-rated.svg",
          criteria: { min_rating: 4.8, min_reviews: 25 },
          is_active: true
        },
        {
          name: "Perfect Streak",
          description: "Receive 5 consecutive 5-star ratings",
          icon_url: "/badges/perfect-streak.svg",
          criteria: { consecutive_five_stars: 5 },
          is_active: true
        },
        {
          name: "Referral Champion",
          description: "Successfully refer 5 new users",
          icon_url: "/badges/referral-champion.svg",
          criteria: { referrals_made: 5 },
          is_active: true
        },
        {
          name: "Veteran",
          description: "Active for 2+ years",
          icon_url: "/badges/veteran.svg",
          criteria: { years_active: 2 },
          is_active: true
        },
        {
          name: "High Earner",
          description: "Earn $1000+ through the platform",
          icon_url: "/badges/high-earner.svg",
          criteria: { min_earnings: 1000 },
          is_active: true
        },
        {
          name: "Skilled Tradie",
          description: "Complete 50 jobs as a tradie",
          icon_url: "/badges/skilled-tradie.svg",
          criteria: { tradie_jobs: 50 },
          is_active: true
        },
        {
          name: "Super Helper",
          description: "Complete 75 jobs as a helper",
          icon_url: "/badges/super-helper.svg",
          criteria: { helper_jobs: 75 },
          is_active: true
        }
      ]

      const badgesToInsert = defaultBadges.map(badge => ({
        ...badge,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('badges')
        .upsert(badgesToInsert, { onConflict: 'name' })

      if (error) {
        console.error('Error creating default badges:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating default badges:', error)
      return false
    }
  }

  // Get badge leaderboard
  static async getBadgeLeaderboard(limit = 50): Promise<LeaderboardUser[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          user_id,
          profiles!user_id(id, full_name, role),
          badge:badges(*)
        `)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('Error fetching badge leaderboard:', error)
        return []
      }

      // Group by user and count badges
      const userBadgeMap = new Map()
      
      data.forEach((item: { user_id: string; profiles: { id: string; full_name: string; role: string }[]; badge: Badge[]; earned_at?: string }) => {
        const userId = item.user_id
        
        if (!userBadgeMap.has(userId)) {
          userBadgeMap.set(userId, {
            user: item.profiles[0],
            badge_count: 0,
            latest_badge: null,
            latest_earned_at: null
          })
        }

        const userEntry = userBadgeMap.get(userId)
        userEntry.badge_count++
        
        if (!userEntry.latest_earned_at || (item.earned_at && item.earned_at > userEntry.latest_earned_at)) {
          userEntry.latest_badge = item.badge[0]
          userEntry.latest_earned_at = item.earned_at
        }
      })

      // Convert to array and sort by badge count
      const leaderboard = Array.from(userBadgeMap.values())
        .sort((a, b) => b.badge_count - a.badge_count)
        .slice(0, limit)

      return leaderboard
    } catch (error) {
      console.error('Error fetching badge leaderboard:', error)
      return []
    }
  }

  // Private helper to notify user of new badge
  private static async notifyBadgeEarned(userId: string, badgeId: string): Promise<void> {
    try {
      const { data: badge, error } = await supabase
        .from('badges')
        .select('name, description')
        .eq('id', badgeId)
        .single()

      if (error || !badge) {
        return
      }

      await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: `New Badge Earned: ${badge.name}!`,
          message: badge.description,
          type: 'system',
          data: { badge_id: badgeId },
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.error('Error sending badge notification:', error)
    }
  }
}