import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '../../lib/supabase'

interface MatchingJob {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  location: string
  latitude?: number
  longitude?: number
  budget_min: number
  budget_max: number
  duration_hours: number
  skill_level: 'beginner' | 'intermediate' | 'expert'
  start_date: string
  end_date?: string
  requirements: string[]
  tools_required: string[]
  created_at: string
  match_score: number
  distance_km?: number
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  tradie: {
    id: string
    full_name: string
    avatar_url?: string
    rating: number
    reviews_count: number
    verified: boolean
  }
  applications_count: number
  is_saved: boolean
  is_applied: boolean
}

interface MatchingPreferences {
  categories: string[]
  max_distance_km: number
  min_budget: number
  max_budget: number
  skill_levels: string[]
  urgency_preference: string[]
  availability_days: string[]
  preferred_duration: string
  tools_owned: string[]
  certifications: string[]
}

interface MatchingCriteria {
  location_weight: number
  budget_weight: number
  skills_weight: number
  rating_weight: number
  urgency_weight: number
  availability_weight: number
}

export const JobMatchingEngine: React.FC = () => {
  const { user, profile } = useAuth()
  const [matchedJobs, setMatchedJobs] = useState<MatchingJob[]>([])
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    categories: [],
    max_distance_km: 25,
    min_budget: 50,
    max_budget: 500,
    skill_levels: ['beginner', 'intermediate'],
    urgency_preference: ['medium', 'high'],
    availability_days: [],
    preferred_duration: '4-8_hours',
    tools_owned: [],
    certifications: []
  })
  const [matchingCriteria, setMatchingCriteria] = useState<MatchingCriteria>({
    location_weight: 0.25,
    budget_weight: 0.25,
    skills_weight: 0.20,
    rating_weight: 0.15,
    urgency_weight: 0.10,
    availability_weight: 0.05
  })
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [selectedJob, setSelectedJob] = useState<MatchingJob | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterUrgency, setFilterUrgency] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'match_score' | 'distance' | 'budget' | 'created_at'>('match_score')

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const loadPreferences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('job_matching_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setPreferences(data.preferences)
        setMatchingCriteria(data.matching_criteria || matchingCriteria)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }, [user?.id, matchingCriteria])

  const savePreferences = async () => {
    try {
      const { error } = await supabase
        .from('job_matching_preferences')
        .upsert({
          user_id: user?.id,
          preferences,
          matching_criteria: matchingCriteria,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      await fetchMatchedJobs()
      setShowPreferences(false)
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const calculateMatchScore = (job: MatchingJob): MatchingJob => {
    let score = 0
    const factors: Record<string, number> = {}

    // Location score (0-100)
    if (currentLocation && job.latitude && job.longitude) {
      const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        job.latitude, job.longitude
      )
      factors.location = Math.max(0, 100 - (distance / preferences.max_distance_km * 100))
      job.distance_km = distance
    } else {
      factors.location = 50 // Default score if location unavailable
    }

    // Budget score (0-100)
    const budgetRange = job.budget_max - job.budget_min
    const preferenceRange = preferences.max_budget - preferences.min_budget
    factors.budget = Math.min(100, (budgetRange / preferenceRange) * 100)

    // Skills score (0-100)
    const skillMatch = preferences.skill_levels.includes(job.skill_level) ? 100 : 0
    factors.skills = skillMatch

    // Urgency score (0-100)
    const urgencyMatch = preferences.urgency_preference.includes(job.urgency) ? 100 : 50
    factors.urgency = urgencyMatch

    // Rating score (tradie rating, 0-100)
    factors.rating = (job.tradie?.rating || 3) * 20 // Convert 5-star to 100

    // Availability score (simplified, 0-100)
    factors.availability = 70 // Default availability score

    // Calculate weighted score
    score = Object.entries(matchingCriteria).reduce((total, [key, weight]) => {
      const factorKey = key.replace('_weight', '')
      return total + (factors[factorKey] || 0) * weight
    }, 0)

    return {
      ...job,
      match_score: Math.round(score),
      applications_count: (job as MatchingJob & {applications?: Array<unknown>}).applications?.length || 0,
      is_saved: (job as MatchingJob & {saved_jobs?: Array<{user_id: string}>}).saved_jobs?.some((s: {user_id: string}) => s.user_id === user?.id) || false,
      is_applied: false
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const fetchMatchedJobs = useCallback(async () => {
    try {
      setRefreshing(true)
      
      // In a real implementation, this would use a sophisticated matching algorithm
      // For now, we'll simulate matching based on basic criteria
      let query = supabase
        .from('jobs')
        .select(`
          *,
          tradie:profiles!tradie_id(id, full_name, avatar_url),
          applications:job_applications(count),
          saved_jobs:saved_jobs(user_id)
        `)
        .eq('status', 'open')

      // Apply category filter
      if (preferences.categories.length > 0) {
        query = query.in('category', preferences.categories)
      }

      // Apply budget filter
      query = query
        .gte('budget_min', preferences.min_budget)
        .lte('budget_max', preferences.max_budget)

      const { data: jobs, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Calculate match scores and process jobs
      const processedJobs = jobs?.map(job => calculateMatchScore(job)) || []
      
      // Sort by match score by default
      const sortedJobs = processedJobs.sort((a, b) => b.match_score - a.match_score)
      
      setMatchedJobs(sortedJobs)
    } catch (error) {
      console.error('Error fetching matched jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [preferences, calculateMatchScore])

  useEffect(() => {
    if (user && profile?.role === 'helper') {
      getCurrentLocation()
      loadPreferences()
      fetchMatchedJobs()
    }
  }, [user, profile, loadPreferences, fetchMatchedJobs])


  const saveJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: user?.id,
          job_id: jobId
        })

      if (error) throw error

      setMatchedJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, is_saved: true } : job
      ))
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  const unsaveJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user?.id)
        .eq('job_id', jobId)

      if (error) throw error

      setMatchedJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, is_saved: false } : job
      ))
    } catch (error) {
      console.error('Error unsaving job:', error)
    }
  }

  const applyToJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          helper_id: user?.id,
          status: 'pending',
          applied_at: new Date().toISOString()
        })

      if (error) throw error

      setMatchedJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, is_applied: true } : job
      ))
    } catch (error) {
      console.error('Error applying to job:', error)
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const JobCard: React.FC<{ job: MatchingJob }> = ({ job }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getMatchScoreColor(job.match_score)}`}>
              {job.match_score}% Match
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{job.description}</p>
          
          {/* Tradie Info */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              {job.tradie.avatar_url ? (
                <img 
                  src={job.tradie.avatar_url} 
                  alt={job.tradie.full_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-600">
                  {job.tradie.full_name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">{job.tradie.full_name}</span>
            {job.tradie.verified && (
              <CheckCircleIcon className="w-4 h-4 text-blue-500" />
            )}
            <div className="flex items-center space-x-1">
              <StarIconSolid className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-600">
                {job.tradie.rating?.toFixed(1)} ({job.tradie.reviews_count})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => job.is_saved ? unsaveJob(job.id) : saveJob(job.id)}
            className="p-2 text-gray-400 hover:text-red-500"
          >
            {job.is_saved ? (
              <HeartIconSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setSelectedJob(job)}
            className="p-2 text-gray-400 hover:text-blue-500"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            ${job.budget_min} - ${job.budget_max} AUD
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {job.duration_hours}h duration
          </span>
        </div>
        {job.distance_km !== undefined && (
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {job.distance_km.toFixed(1)}km away
            </span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            Starts {new Date(job.start_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(job.urgency)}`}>
          {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)} Priority
        </span>
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {job.skill_level}
        </span>
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {job.category}
        </span>
        {job.applications_count > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            {job.applications_count} applicant{job.applications_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setSelectedJob(job)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Details
        </button>
        <div className="flex space-x-2">
          {job.is_applied ? (
            <span className="px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
              Applied
            </span>
          ) : (
            <button
              onClick={() => applyToJob(job.id)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const PreferencesModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Matching Preferences</h2>
            <button
              onClick={() => setShowPreferences(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-8">
            {/* Basic Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Distance (km)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={preferences.max_distance_km}
                    onChange={(e) => setPreferences(prev => ({ ...prev, max_distance_km: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">{preferences.max_distance_km}km</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range (AUD)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={preferences.min_budget}
                      onChange={(e) => setPreferences(prev => ({ ...prev, min_budget: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      min="0"
                      value={preferences.max_budget}
                      onChange={(e) => setPreferences(prev => ({ ...prev, max_budget: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Landscaping', 'Cleaning'].map((category) => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferences.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences(prev => ({ ...prev, categories: [...prev.categories, category] }))
                          } else {
                            setPreferences(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Matching Criteria Weights */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Matching Priorities</h3>
              <p className="text-sm text-gray-600 mb-4">
                Adjust how important each factor is when matching jobs to you
              </p>
              
              <div className="space-y-4">
                {Object.entries(matchingCriteria).map(([key, weight]) => {
                  const label = key.replace('_weight', '').replace('_', ' ')
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {label}
                        </label>
                        <span className="text-sm text-gray-600">{Math.round(weight * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={weight}
                        onChange={(e) => setMatchingCriteria(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (profile?.role !== 'helper') {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <WrenchScrewdriverIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Helper Access Only</h2>
            <p className="text-gray-600">Job matching is only available for helper accounts.</p>
          </div>
        </div>
      </div>
    )
  }

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
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
                <SparklesIcon className="w-8 h-8 text-blue-600" />
                <span>Smart Job Matching</span>
              </h1>
              <p className="text-gray-600">
                AI-powered job recommendations tailored to your skills, location, and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchMatchedJobs}
                disabled={refreshing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Matches'}
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2 inline" />
                Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="landscaping">Landscaping</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
            
            <div>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match_score' | 'distance' | 'budget' | 'created_at')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="match_score">Best Match</option>
                <option value="distance">Closest</option>
                <option value="budget">Highest Budget</option>
                <option value="created_at">Most Recent</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              {matchedJobs.length} matched jobs found
            </div>
          </div>
        </div>

        {/* Matched Jobs */}
        {matchedJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matching Jobs Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your preferences or check back later for new opportunities
            </p>
            <button
              onClick={() => setShowPreferences(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Preferences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matchedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Load More */}
        {matchedJobs.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Load More Matches
            </button>
          </div>
        )}
      </main>

      {showPreferences && <PreferencesModal />}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getMatchScoreColor(selectedJob.match_score)}`}>
                    {selectedJob.match_score}% Match
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(selectedJob.urgency)}`}>
                    {selectedJob.urgency.charAt(0).toUpperCase() + selectedJob.urgency.slice(1)} Priority
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedJob.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Budget</h4>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedJob.budget_min} - ${selectedJob.budget_max} AUD
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Duration</h4>
                  <p className="text-gray-700">{selectedJob.duration_hours} hours</p>
                </div>
              </div>

              {selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => selectedJob.is_saved ? unsaveJob(selectedJob.id) : saveJob(selectedJob.id)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {selectedJob.is_saved ? 'Unsave' : 'Save Job'}
                </button>
                <button
                  onClick={() => {
                    applyToJob(selectedJob.id)
                    setSelectedJob(null)
                  }}
                  disabled={selectedJob.is_applied}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {selectedJob.is_applied ? 'Already Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNavigation />
    </div>
  )
}