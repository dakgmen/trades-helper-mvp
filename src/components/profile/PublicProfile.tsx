import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import type { UserProfile } from '../../types'

interface Review {
  id: string
  reviewer_name: string
  reviewer_avatar?: string
  rating: number
  comment: string
  created_at: string
}

interface PublicProfileData extends UserProfile {
  reviews: Review[]
  completed_jobs_count: number
  average_rating: number
  total_earnings?: number
}

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  const fetchPublicProfile = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError

      // Fetch reviews (mock data for now - implement reviews table later)
      const mockReviews: Review[] = [
        {
          id: '1',
          reviewer_name: 'Sarah Thompson',
          rating: 5,
          comment: 'Excellent work! Very professional and efficient.',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          reviewer_name: 'Michael Davis',
          rating: 4,
          comment: 'Good work, but there was a slight delay in finishing the job.',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          reviewer_name: 'Emily Carter',
          rating: 5,
          comment: 'Highly recommend! Punctual, skilled, and very friendly.',
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Calculate stats
      const completedJobsCount = 120 // Mock data
      const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length

      setProfile({
        ...profileData,
        reviews: mockReviews,
        completed_jobs_count: completedJobsCount,
        average_rating: averageRating
      })
    } catch (err) {
      console.error('Error fetching public profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPublicProfile()
    }
  }, [id, fetchPublicProfile])

  const handleContact = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    setIsContactModalOpen(true)
  }

  const renderStarRating = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const stars = []
    const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`${sizeClass} ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }
    return stars
  }

  const getRatingDistribution = (reviews: Review[]) => {
    const distribution = [0, 0, 0, 0, 0] // 1-star to 5-star counts
    reviews.forEach(review => {
      distribution[review.rating - 1]++
    })
    return distribution.map((count, index) => ({
      rating: index + 1,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0
    })).reverse() // Show 5-star first
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The profile you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const ratingDistribution = getRatingDistribution(profile.reviews)
  const joinDate = new Date(profile.created_at)
  const yearsOnPlatform = Math.max(1, new Date().getFullYear() - joinDate.getFullYear())

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="flex flex-1 justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 bg-cover bg-center mb-4 border-4 border-white shadow-lg flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name || 'Anonymous User'}
              </h1>
              <p className="text-base text-gray-600 capitalize">{profile.role}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                {profile.verified && (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.469 6.469a1 1 0 00-1.414-1.414L9 11.586l-1.768-1.768a1 1 0 10-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                    <span className="text-gray-400">•</span>
                  </>
                )}
                <span className="text-gray-600">{yearsOnPlatform} years on TradieHelper</span>
              </div>
            </div>

            {/* Contact Button */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <button
                onClick={handleContact}
                className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-blue-600 text-white text-base font-bold hover:bg-blue-700 transition-colors"
              >
                Contact {profile.full_name?.split(' ')[0] || 'User'}
              </button>
              <p className="text-xs text-gray-500 mt-3 text-center">
                For your safety, only communicate and pay through TradieHelper.
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Stats</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-gray-900 font-bold">{profile.average_rating.toFixed(1)}</p>
                    <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Jobs Completed</p>
                  <p className="text-gray-900 font-bold">{profile.completed_jobs_count}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Positive Feedback</p>
                  <p className="text-gray-900 font-bold">
                    {Math.round((profile.reviews.filter(r => r.rating >= 4).length / profile.reviews.length) * 100) || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Skills</h3>
                <div className="flex gap-3 flex-wrap">
                  {profile.skills.map((skill, index) => (
                    <div key={index} className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-blue-100 text-blue-800 px-4">
                      <p className="text-sm font-medium">{skill}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">About</h3>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Achievement Badges */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Badges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {profile.verified && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.469 6.469a1 1 0 00-1.414-1.414L9 11.586l-1.768-1.768a1 1 0 10-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Identity Verified</p>
                  </div>
                )}
                {profile.average_rating >= 4.5 && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Top Rated</p>
                  </div>
                )}
                {profile.completed_jobs_count >= 100 && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">100+ Jobs Completed</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Reviews ({profile.reviews.length})</h3>
              
              {/* Rating Overview */}
              <div className="flex flex-wrap gap-8 items-start mb-8">
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-5xl font-bold text-gray-900">{profile.average_rating.toFixed(1)}</p>
                  <div className="flex gap-0.5">
                    {renderStarRating(Math.round(profile.average_rating), 'lg')}
                  </div>
                </div>
                <div className="grid flex-1 min-w-[200px] grid-cols-[20px_1fr_40px] items-center gap-x-3 gap-y-2">
                  {ratingDistribution.map(({ rating, percentage }) => (
                    <React.Fragment key={rating}>
                      <p className="text-sm font-medium text-gray-600">{rating}</p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div 
                          className="h-full rounded-full bg-yellow-400" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 text-right">{Math.round(percentage)}%</p>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {profile.reviews.map((review, index) => (
                  <div 
                    key={review.id} 
                    className={`flex flex-col gap-4 ${index < profile.reviews.length - 1 ? 'border-b border-gray-200 pb-6' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center">
                        {review.reviewer_avatar ? (
                          <img
                            src={review.reviewer_avatar}
                            alt={review.reviewer_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {renderStarRating(review.rating)}
                    </div>
                    <p className="text-base text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Contact {profile.full_name?.split(' ')[0]}</h3>
            <p className="text-gray-600 mb-4">
              To contact this user, please post a job or send them a message through our platform.
              This helps keep everyone safe and maintains our quality standards.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/jobs/post')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post a Job
              </button>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileNavigation />
    </div>
  )
}