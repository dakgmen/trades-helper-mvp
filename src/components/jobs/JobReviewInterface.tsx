import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import { 
  StarIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  CameraIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '../../lib/supabase'

interface JobReview {
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
}

interface Job {
  id: string
  title: string
  description: string
  status: 'completed' | 'cancelled'
  tradie_id: string
  helper_id: string
  completion_date: string
  amount: number
}

export const JobReviewInterface: React.FC = () => {
  const { user, profile } = useAuth()
  const [pendingReviews, setPendingReviews] = useState<Job[]>([])
  const [completedReviews, setCompletedReviews] = useState<JobReview[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    work_quality: 5,
    communication: 5,
    punctuality: 5,
    professionalism: 5,
    value_for_money: 5,
    would_recommend: true,
    photos: [] as string[]
  })

  const fetchData = useCallback(async () => {
    if (user) {
      await fetchPendingReviews()
      await fetchCompletedReviews()
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_reviews!left(id)
        `)
        .eq('status', 'completed')
        .or(`tradie_id.eq.${user?.id},helper_id.eq.${user?.id}`)
        .is('job_reviews.id', null)

      if (error) throw error

      setPendingReviews(jobs || [])
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedReviews = async () => {
    try {
      const { data: reviews, error } = await supabase
        .from('job_reviews')
        .select(`
          *,
          jobs(title, tradie_id, helper_id),
          reviewer:profiles!reviewer_id(full_name, avatar_url),
          reviewee:profiles!reviewee_id(full_name, avatar_url)
        `)
        .eq('reviewer_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCompletedReviews(reviews || [])
    } catch (error) {
      console.error('Error fetching completed reviews:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedJob || !user) return

    try {
      setSubmitting(true)

      const revieweeId = profile?.role === 'tradie' ? selectedJob.helper_id : selectedJob.tradie_id
      const reviewerType = profile?.role

      const { error } = await supabase
        .from('job_reviews')
        .insert({
          job_id: selectedJob.id,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          reviewer_type: reviewerType,
          ...reviewForm,
          status: 'published'
        })

      if (error) throw error

      setShowReviewForm(false)
      setSelectedJob(null)
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
        work_quality: 5,
        communication: 5,
        punctuality: 5,
        professionalism: 5,
        value_for_money: 5,
        would_recommend: true,
        photos: []
      })

      await fetchPendingReviews()
      await fetchCompletedReviews()
      
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating: React.FC<{ 
    value: number; 
    onChange: (value: number) => void;
    readonly?: boolean;
    size?: 'small' | 'medium' | 'large';
  }> = ({ value, onChange, readonly = false, size = 'medium' }) => {
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-6 h-6',
      large: 'w-8 h-8'
    }

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            {star <= value ? (
              <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
            )}
          </button>
        ))}
      </div>
    )
  }

  const ReviewForm: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
              <p className="text-gray-600">{selectedJob?.title}</p>
            </div>
            <button
              onClick={() => setShowReviewForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              <div className="flex items-center space-x-3">
                <StarRating 
                  value={reviewForm.rating}
                  onChange={(value) => setReviewForm(prev => ({ ...prev, rating: value }))}
                  size="large"
                />
                <span className="text-sm text-gray-600">
                  {reviewForm.rating === 1 && "Poor"}
                  {reviewForm.rating === 2 && "Fair"}
                  {reviewForm.rating === 3 && "Good"}
                  {reviewForm.rating === 4 && "Very Good"}
                  {reviewForm.rating === 5 && "Excellent"}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Summarize your experience..."
                maxLength={100}
              />
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'work_quality', label: 'Work Quality' },
                { key: 'communication', label: 'Communication' },
                { key: 'punctuality', label: 'Punctuality' },
                { key: 'professionalism', label: 'Professionalism' },
                { key: 'value_for_money', label: 'Value for Money' }
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {item.label}
                  </label>
                  <StarRating
                    value={reviewForm[item.key as keyof typeof reviewForm] as number}
                    onChange={(value) => setReviewForm(prev => ({ ...prev, [item.key]: value }))}
                  />
                </div>
              ))}
            </div>

            {/* Would Recommend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you recommend this {profile?.role === 'tradie' ? 'helper' : 'tradie'}?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={reviewForm.would_recommend}
                    onChange={() => setReviewForm(prev => ({ ...prev, would_recommend: true }))}
                    className="mr-2"
                  />
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-1" />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!reviewForm.would_recommend}
                    onChange={() => setReviewForm(prev => ({ ...prev, would_recommend: false }))}
                    className="mr-2"
                  />
                  <XCircleIcon className="w-5 h-5 text-red-500 mr-1" />
                  No
                </label>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Review *
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Share your experience in detail..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {reviewForm.comment.length}/500 characters
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Upload photos of the completed work
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB each (max 3 photos)
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewForm.title.trim() || !reviewForm.comment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job Reviews
          </h1>
          <p className="text-gray-600">
            Review completed jobs and manage your review history
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{pendingReviews.length}</p>
                <p className="text-gray-600">Pending Reviews</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{completedReviews.length}</p>
                <p className="text-gray-600">Reviews Written</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {completedReviews.length > 0 ? 
                    (completedReviews.reduce((sum, r) => sum + r.rating, 0) / completedReviews.length).toFixed(1)
                    : '0.0'
                  }
                </p>
                <p className="text-gray-600">Average Rating Given</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Reviews */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Reviews ({pendingReviews.length})
            </h2>
            
            {pendingReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <StarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Pending Reviews
                </h3>
                <p className="text-gray-600">
                  Complete more jobs to leave reviews
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Completed on {new Date(job.completion_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Review Pending
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900">
                        ${job.amount.toFixed(2)} AUD
                      </p>
                      <button
                        onClick={() => {
                          setSelectedJob(job)
                          setShowReviewForm(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Write Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Reviews */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Reviews ({completedReviews.length})
            </h2>
            
            {completedReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-600">
                  Your completed reviews will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {completedReviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {review.title}
                        </h3>
                        <StarRating value={review.rating} onChange={() => {}} readonly size="small" />
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {review.comment}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Would recommend: {review.would_recommend ? 'Yes' : 'No'}
                      </span>
                      <div className="flex items-center space-x-1">
                        {review.would_recommend ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showReviewForm && <ReviewForm />}
      <MobileNavigation />
    </div>
  )
}