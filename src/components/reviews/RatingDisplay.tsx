import React from 'react'
import type { AggregateRating } from '../../types'

interface RatingDisplayProps {
  rating: AggregateRating
  showBreakdown?: boolean
  className?: string
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ 
  rating, 
  showBreakdown = false, 
  className = '' 
}) => {
  const renderStars = (averageRating: number, size: 'sm' | 'lg' = 'sm') => {
    const starClass = size === 'lg' ? 'text-2xl' : 'text-base'
    
    return Array.from({ length: 5 }, (_, index) => {
      const filled = index + 1 <= Math.floor(averageRating)
      const halfFilled = index + 0.5 <= averageRating && !filled
      
      return (
        <span key={index} className={`${starClass} relative`}>
          {halfFilled ? (
            <span className="relative">
              <span className="text-gray-300">★</span>
              <span 
                className="text-yellow-400 absolute left-0 top-0 overflow-hidden"
                style={{ width: '50%' }}
              >
                ★
              </span>
            </span>
          ) : (
            <span className={filled ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          )}
        </span>
      )
    })
  }

  if (rating.total_reviews === 0) {
    return (
      <div className={`text-gray-500 ${className}`}>
        <div className="flex items-center space-x-1">
          {renderStars(0)}
          <span className="text-sm ml-2">No reviews yet</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {renderStars(rating.average_rating, 'lg')}
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {rating.average_rating.toFixed(1)}
        </div>
        <div className="text-sm text-gray-600">
          ({rating.total_reviews} review{rating.total_reviews !== 1 ? 's' : ''})
        </div>
      </div>

      {showBreakdown && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Rating Breakdown</h4>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = rating[`${star === 5 ? 'five' : star === 4 ? 'four' : star === 3 ? 'three' : star === 2 ? 'two' : 'one'}_star`]
            const percentage = rating.total_reviews > 0 ? (count / rating.total_reviews) * 100 : 0
            
            return (
              <div key={star} className="flex items-center space-x-2 text-sm">
                <span className="w-8 text-right">{star}</span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-600">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}