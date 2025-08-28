import { supabase } from '../lib/supabase'
import type { Review, AggregateRating } from '../types'

export class ReviewService {
  // Create a new review after job completion
  static async createReview(reviewData: {
    job_id: string
    reviewer_id: string
    reviewee_id: string
    rating: number
    comment?: string
    reviewer_type: 'tradie' | 'helper'
  }): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          ...reviewData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating review:', error)
        return null
      }

      // Update aggregate rating after creating review
      await this.updateAggregateRating(reviewData.reviewee_id)
      
      return data as Review
    } catch (error) {
      console.error('Error creating review:', error)
      return null
    }
  }

  // Get reviews for a specific user (as reviewee)
  static async getReviewsForUser(userId: string, limit = 10, offset = 0): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(id, full_name),
          job:jobs!job_id(title, date_time)
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching reviews:', error)
        return []
      }

      return data as Review[]
    } catch (error) {
      console.error('Error fetching reviews:', error)
      return []
    }
  }

  // Get reviews by a specific user (as reviewer)
  static async getReviewsByUser(userId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewee:profiles!reviewee_id(id, full_name),
          job:jobs!job_id(title, date_time)
        `)
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews by user:', error)
        return []
      }

      return data as Review[]
    } catch (error) {
      console.error('Error fetching reviews by user:', error)
      return []
    }
  }

  // Check if user can review this job
  static async canReviewJob(jobId: string, userId: string): Promise<boolean> {
    try {
      // Check if job is completed
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('status, tradie_id, assigned_helper_id')
        .eq('id', jobId)
        .single()

      if (jobError || !job || job.status !== 'completed') {
        return false
      }

      // Check if user is either tradie or assigned helper
      const isParticipant = job.tradie_id === userId || job.assigned_helper_id === userId
      if (!isParticipant) {
        return false
      }

      // Check if user has already reviewed this job
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('job_id', jobId)
        .eq('reviewer_id', userId)
        .single()

      if (reviewError && reviewError.code !== 'PGRST116') {
        console.error('Error checking existing review:', reviewError)
        return false
      }

      return !existingReview
    } catch (error) {
      console.error('Error checking review eligibility:', error)
      return false
    }
  }

  // Update aggregate rating for a user
  private static async updateAggregateRating(userId: string): Promise<void> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId)

      if (error) {
        console.error('Error fetching reviews for aggregate:', error)
        return
      }

      if (!reviews || reviews.length === 0) {
        return
      }

      const totalReviews = reviews.length
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / totalReviews

      const ratingCounts = {
        five_star: reviews.filter(r => r.rating === 5).length,
        four_star: reviews.filter(r => r.rating === 4).length,
        three_star: reviews.filter(r => r.rating === 3).length,
        two_star: reviews.filter(r => r.rating === 2).length,
        one_star: reviews.filter(r => r.rating === 1).length,
      }

      const aggregateData = {
        user_id: userId,
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        ...ratingCounts,
        updated_at: new Date().toISOString()
      }

      // Upsert aggregate rating
      const { error: upsertError } = await supabase
        .from('aggregate_ratings')
        .upsert(aggregateData, { onConflict: 'user_id' })

      if (upsertError) {
        console.error('Error updating aggregate rating:', upsertError)
      }
    } catch (error) {
      console.error('Error updating aggregate rating:', error)
    }
  }

  // Get aggregate rating for a user
  static async getAggregateRating(userId: string): Promise<AggregateRating | null> {
    try {
      const { data, error } = await supabase
        .from('aggregate_ratings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rating found
          return {
            user_id: userId,
            total_reviews: 0,
            average_rating: 0,
            five_star: 0,
            four_star: 0,
            three_star: 0,
            two_star: 0,
            one_star: 0
          }
        }
        console.error('Error fetching aggregate rating:', error)
        return null
      }

      return data as AggregateRating
    } catch (error) {
      console.error('Error fetching aggregate rating:', error)
      return null
    }
  }

  // Delete a review (admin only)
  static async deleteReview(reviewId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) {
        console.error('Error deleting review:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting review:', error)
      return false
    }
  }

  // Get recent reviews for admin dashboard
  static async getRecentReviews(limit = 20): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(id, full_name, role),
          reviewee:profiles!reviewee_id(id, full_name, role),
          job:jobs!job_id(title, date_time)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent reviews:', error)
        return []
      }

      return data as Review[]
    } catch (error) {
      console.error('Error fetching recent reviews:', error)
      return []
    }
  }
}