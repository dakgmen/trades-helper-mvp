import React from 'react'
import type { Review } from '../../types'

interface ReviewCardProps {
  review: Review
  showJobDetails?: boolean
  className?: string
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  showJobDetails = false, 
  className = '' 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {review.reviewer?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {review.reviewer?.full_name || 'Anonymous User'}
            </h4>
            <p className="text-sm text-gray-500">
              {review.reviewer_type === 'tradie' ? 'Tradie' : 'Helper'} • {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {renderStars(review.rating)}
          <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
        </div>
      </div>

      {showJobDetails && review.job && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Job:</span> {review.job.title}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(review.job.date_time).toLocaleDateString()}
          </p>
        </div>
      )}

      {review.comment && (
        <div className="mt-3">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      )}
    </div>
  )
}