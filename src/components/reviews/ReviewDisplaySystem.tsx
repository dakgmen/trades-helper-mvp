import React, { useState, useEffect } from 'react'
import { 
  StarIcon, 
  CheckBadgeIcon, 
  FlagIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '../../lib/supabase'

interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_type: 'tradie' | 'helper'
  rating: number
  title: string
  comment: string
  work_quality: number
  communication: number
  punctuality: number
  professionalism: number
  value_for_money: number
  would_recommend: boolean
  photos: string[]
  created_at: string
  status: 'pending' | 'published' | 'flagged'
  helpful_votes: number
  unhelpful_votes: number
  reviewer: {
    full_name: string
    avatar_url: string
  }
  job: {
    title: string
    category: string
  }
}

interface ReviewDisplaySystemProps {
  profileId?: string
  jobId?: string
  showFilters?: boolean
  maxReviews?: number
  variant?: 'compact' | 'detailed' | 'summary'
}

export const ReviewDisplaySystem: React.FC<ReviewDisplaySystemProps> = ({
  profileId,
  jobId,
  showFilters = true,
  maxReviews,
  variant = 'detailed'
}) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')

  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
    recommendationRate: 0
  })

  useEffect(() => {
    fetchReviews()
    if (profileId) fetchReviewStats()
  }, [profileId, jobId, sortBy, filterRating])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('job_reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(full_name, avatar_url),
          job:jobs(title, category)
        `)
        .eq('status', 'published')

      if (profileId) {
        query = query.eq('reviewee_id', profileId)
      }

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      if (filterRating) {
        query = query.eq('rating', filterRating)
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'highest':
          query = query.order('rating', { ascending: false })
          break
        case 'lowest':
          query = query.order('rating', { ascending: true })
          break
        case 'helpful':
          query = query.order('helpful_votes', { ascending: false })
          break
      }

      if (maxReviews) {
        query = query.limit(maxReviews)
      }

      const { data, error } = await query

      if (error) throw error

      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewStats = async () => {
    if (!profileId) return

    try {
      const { data: reviewData, error } = await supabase
        .from('job_reviews')
        .select('rating, would_recommend')
        .eq('reviewee_id', profileId)
        .eq('status', 'published')

      if (error) throw error

      if (reviewData && reviewData.length > 0) {
        const totalReviews = reviewData.length
        const averageRating = reviewData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        const recommendationRate = reviewData.filter(r => r.would_recommend).length / totalReviews * 100
        
        // Calculate rating distribution
        const distribution = [0, 0, 0, 0, 0]
        reviewData.forEach(r => {
          distribution[r.rating - 1]++
        })

        setStats({
          totalReviews,
          averageRating,
          ratingDistribution: distribution,
          recommendationRate
        })
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    }
  }

  const handleReportReview = async (reviewId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          reason: reason,
          status: 'pending'
        })

      if (error) throw error

      setShowReportModal(null)
      setReportReason('')
    } catch (error) {
      console.error('Error reporting review:', error)
    }
  }

  const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
    try {
      const review = reviews.find(r => r.id === reviewId)
      if (!review) return

      const updateData = isHelpful 
        ? { helpful_votes: review.helpful_votes + 1 }
        : { unhelpful_votes: review.unhelpful_votes + 1 }

      const { error } = await supabase
        .from('job_reviews')
        .update(updateData)
        .eq('id', reviewId)

      if (error) throw error

      // Update local state
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, ...updateData }
          : r
      ))
    } catch (error) {
      console.error('Error voting on review:', error)
    }
  }

  const StarRating: React.FC<{ rating: number; size?: 'small' | 'medium' | 'large' }> = ({ 
    rating, 
    size = 'medium' 
  }) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4',
      large: 'w-5 h-5'
    }

    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIconSolid key={star} className={`${sizeClasses[size]} text-yellow-400`} />
          ) : (
            <StarIcon key={star} className={`${sizeClasses[size]} text-gray-300`} />
          )
        ))}
      </div>
    )
  }

  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {review.reviewer.avatar_url ? (
              <img 
                src={review.reviewer.avatar_url} 
                alt={review.reviewer.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {review.reviewer.full_name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{review.reviewer.full_name}</p>
            <div className="flex items-center space-x-2">
              <StarRating rating={review.rating} />
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {review.would_recommend && (
            <CheckBadgeIcon className="w-5 h-5 text-green-500" title="Recommended" />
          )}
          <button
            onClick={() => setShowReportModal(review.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <FlagIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        {review.job?.title && (
          <p className="text-sm text-gray-500 mt-2">
            Job: {review.job.title}
          </p>
        )}
      </div>

      {variant === 'detailed' && (
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {[
              { label: 'Quality', value: review.work_quality },
              { label: 'Communication', value: review.communication },
              { label: 'Punctuality', value: review.punctuality },
              { label: 'Professional', value: review.professionalism },
              { label: 'Value', value: review.value_for_money }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-gray-600 mb-1">{item.label}</p>
                <StarRating rating={item.value} size="small" />
              </div>
            ))}
          </div>
        </div>
      )}

      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2">
            {review.photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <EyeIcon className="w-4 h-4" />
            <span>Helpful review</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleHelpfulVote(review.id, true)}
              className="flex items-center space-x-1 hover:text-green-600"
            >
              <HandThumbUpIcon className="w-4 h-4" />
              <span>{review.helpful_votes}</span>
            </button>
            <button
              onClick={() => handleHelpfulVote(review.id, false)}
              className="flex items-center space-x-1 hover:text-red-600"
            >
              <HandThumbDownIcon className="w-4 h-4" />
              <span>{review.unhelpful_votes}</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-sm">
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500 capitalize">{review.reviewer_type}</span>
        </div>
      </div>
    </div>
  )

  const ReviewSummary: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(stats.averageRating)} size="large" />
          <p className="text-gray-600 mt-2">{stats.totalReviews} reviews</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Rating Breakdown</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 w-6">{rating}</span>
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating - 1] / stats.totalReviews) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {stats.ratingDistribution[rating - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {Math.round(stats.recommendationRate)}%
          </div>
          <p className="text-gray-600">Would recommend</p>
          <CheckBadgeIcon className="w-8 h-8 text-green-500 mx-auto mt-2" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {profileId && variant !== 'compact' && <ReviewSummary />}

      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
                <option value="helpful">Most helpful</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by rating
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterRating(null)}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filterRating === null 
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(rating)}
                    className={`px-3 py-2 text-sm rounded-md border flex items-center space-x-1 ${
                      filterRating === rating
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <span>{rating}</span>
                    <StarIcon className="w-3 h-3 text-yellow-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <StarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600">
            Reviews will appear here once jobs are completed
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Report Review
            </h3>
            <div className="space-y-3 mb-4">
              {[
                'Inappropriate content',
                'Fake review',
                'Spam',
                'Harassment',
                'Other'
              ].map((reason) => (
                <label key={reason} className="flex items-center">
                  <input
                    type="radio"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="mr-2"
                  />
                  {reason}
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReportReview(showReportModal, reportReason)}
                disabled={!reportReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}