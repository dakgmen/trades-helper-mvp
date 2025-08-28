import { supabase } from '../lib/supabase'
import type { Referral, ReferralStatus } from '../types'

export class ReferralService {
  // Generate a unique referral code
  private static generateReferralCode(username: string): string {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 8)
    const prefix = username.substring(0, 3).toUpperCase()
    return `${prefix}${timestamp}${randomStr}`.toUpperCase()
  }

  // Create referral code for user
  static async createReferralCode(userId: string): Promise<{ code: string | null; error: string | null }> {
    try {
      // Get user profile to generate code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return { code: null, error: 'User profile not found' }
      }

      // Check if user already has a referral code
      const { data: existingReferral, error: existingError } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', userId)
        .eq('status', 'pending')
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing referral:', existingError)
      }

      if (existingReferral) {
        return { code: existingReferral.referral_code, error: null }
      }

      // Generate new referral code
      const referralCode = this.generateReferralCode(profile.full_name || 'USER')

      // Store referral code (without referee yet)
      const { error: insertError } = await supabase
        .from('referrals')
        .insert([{
          referrer_id: userId,
          referral_code: referralCode,
          status: 'pending' as ReferralStatus,
          reward_granted: false,
          created_at: new Date().toISOString()
        }])

      if (insertError) {
        console.error('Error creating referral code:', insertError)
        return { code: null, error: 'Failed to create referral code' }
      }

      return { code: referralCode, error: null }
    } catch (error) {
      console.error('Error creating referral code:', error)
      return { code: null, error: 'Network error creating referral code' }
    }
  }

  // Apply referral code during signup
  static async applyReferralCode(
    referralCode: string,
    refereeId: string
  ): Promise<{ success: boolean; reward: number | null; error: string | null }> {
    try {
      // Find the referral by code
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single()

      if (referralError || !referral) {
        return { success: false, reward: null, error: 'Invalid or expired referral code' }
      }

      // Check that referrer and referee are different
      if (referral.referrer_id === refereeId) {
        return { success: false, reward: null, error: 'Cannot use your own referral code' }
      }

      // Get referrer and referee profiles to determine reward
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', [referral.referrer_id, refereeId])

      if (profilesError || !profiles || profiles.length !== 2) {
        return { success: false, reward: null, error: 'Error fetching user profiles' }
      }

      const referrer = profiles.find(p => p.id === referral.referrer_id)
      const referee = profiles.find(p => p.id === refereeId)

      if (!referrer || !referee) {
        return { success: false, reward: null, error: 'User profiles not found' }
      }

      // Calculate reward based on user types
      const reward = this.calculateReferralReward(referrer.role, referee.role)

      // Update referral with referee information
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          referee_id: refereeId,
          reward_amount: reward,
          completed_at: new Date().toISOString(),
          status: 'completed' as ReferralStatus
        })
        .eq('id', referral.id)

      if (updateError) {
        console.error('Error updating referral:', updateError)
        return { success: false, reward: null, error: 'Failed to apply referral code' }
      }

      return { success: true, reward, error: null }
    } catch (error) {
      console.error('Error applying referral code:', error)
      return { success: false, reward: null, error: 'Network error applying referral code' }
    }
  }

  // Calculate referral reward based on user types
  private static calculateReferralReward(referrerRole: string, refereeRole: string): number {
    // Reward structure:
    // Tradie refers Tradie: $20 credit each
    // Helper refers Helper: Priority access to jobs (no monetary reward)
    // Tradie refers Helper: $10 credit for tradie
    // Helper refers Tradie: $15 credit for helper

    if (referrerRole === 'tradie' && refereeRole === 'tradie') {
      return 20.00
    } else if (referrerRole === 'tradie' && refereeRole === 'helper') {
      return 10.00
    } else if (referrerRole === 'helper' && refereeRole === 'tradie') {
      return 15.00
    } else if (referrerRole === 'helper' && refereeRole === 'helper') {
      return 0.00 // Priority access instead of money
    }
    
    return 0.00
  }

  // Grant referral reward (called after referee completes first job)
  static async grantReferralReward(referralId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get referral details
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .eq('status', 'completed')
        .eq('reward_granted', false)
        .single()

      if (referralError || !referral) {
        return { success: false, error: 'Referral not found or reward already granted' }
      }

      if (!referral.reward_amount || referral.reward_amount === 0) {
        // No monetary reward (helper to helper referrals get priority access)
        const { error: updateError } = await supabase
          .from('referrals')
          .update({ reward_granted: true })
          .eq('id', referralId)

        if (updateError) {
          console.error('Error updating referral reward status:', updateError)
          return { success: false, error: 'Failed to update reward status' }
        }

        return { success: true, error: null }
      }

      // Add credit to referrer's account
      const { error: creditError } = await supabase.rpc('add_user_credit', {
        user_id: referral.referrer_id,
        credit_amount: referral.reward_amount,
        description: `Referral reward for inviting ${referral.referee_id}`
      })

      if (creditError) {
        console.error('Error adding referral credit:', creditError)
        return { success: false, error: 'Failed to add referral credit' }
      }

      // Mark reward as granted
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ reward_granted: true })
        .eq('id', referralId)

      if (updateError) {
        console.error('Error updating referral reward status:', updateError)
        return { success: false, error: 'Failed to update reward status' }
      }

      // Send notification to referrer
      await this.notifyReferralReward(referral.referrer_id, referral.reward_amount)

      return { success: true, error: null }
    } catch (error) {
      console.error('Error granting referral reward:', error)
      return { success: false, error: 'Network error granting referral reward' }
    }
  }

  // Get referrals for a user (as referrer)
  static async getReferralsByUser(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:profiles!referee_id(id, full_name, role)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching referrals:', error)
        return []
      }

      return data as Referral[]
    } catch (error) {
      console.error('Error fetching referrals:', error)
      return []
    }
  }

  // Get referral statistics for user
  static async getReferralStats(userId: string): Promise<{
    total_referrals: number
    completed_referrals: number
    pending_referrals: number
    total_rewards: number
    granted_rewards: number
  }> {
    try {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('status, reward_amount, reward_granted')
        .eq('referrer_id', userId)

      if (error) {
        console.error('Error fetching referral stats:', error)
        return {
          total_referrals: 0,
          completed_referrals: 0,
          pending_referrals: 0,
          total_rewards: 0,
          granted_rewards: 0
        }
      }

      const stats = {
        total_referrals: referrals.length,
        completed_referrals: referrals.filter(r => r.status === 'completed').length,
        pending_referrals: referrals.filter(r => r.status === 'pending').length,
        total_rewards: referrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0),
        granted_rewards: referrals
          .filter(r => r.reward_granted)
          .reduce((sum, r) => sum + (r.reward_amount || 0), 0)
      }

      return stats
    } catch (error) {
      console.error('Error calculating referral stats:', error)
      return {
        total_referrals: 0,
        completed_referrals: 0,
        pending_referrals: 0,
        total_rewards: 0,
        granted_rewards: 0
      }
    }
  }

  // Check if user was referred and trigger reward if first job completed
  static async checkAndTriggerReferralReward(userId: string): Promise<void> {
    try {
      // Check if user was referred
      const { data: referral, error } = await supabase
        .from('referrals')
        .select('id, status, reward_granted')
        .eq('referee_id', userId)
        .eq('status', 'completed')
        .eq('reward_granted', false)
        .single()

      if (error || !referral) {
        return // No referral or already rewarded
      }

      // Check if user has completed their first job
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .or(`tradie_id.eq.${userId},assigned_helper_id.eq.${userId}`)
        .eq('status', 'completed')
        .limit(1)

      if (jobsError || !jobs?.length) {
        return // No completed jobs yet
      }

      // Grant referral reward
      await this.grantReferralReward(referral.id)
    } catch (error) {
      console.error('Error checking referral reward:', error)
    }
  }

  // Private helper to notify referrer of reward
  private static async notifyReferralReward(referrerId: string, rewardAmount: number): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert([{
          user_id: referrerId,
          title: 'Referral Reward Earned!',
          message: `You've earned $${rewardAmount} for your successful referral!`,
          type: 'system',
          data: { reward_amount: rewardAmount },
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.error('Error sending referral reward notification:', error)
    }
  }
}