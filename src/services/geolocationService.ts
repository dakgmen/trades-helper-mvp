import { supabase } from '../lib/supabase'
import type { LocationData, JobMatch, Job, UserProfile } from '../types'

export class GeolocationService {
  private static instance: GeolocationService
  private watchId: number | null = null
  private currentLocation: LocationData | null = null

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService()
    }
    return GeolocationService.instance
  }

  // Get current position
  async getCurrentPosition(options?: PositionOptions): Promise<{ location: LocationData | null; error: string | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ location: null, error: 'Geolocation not supported' })
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options,
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          this.currentLocation = location
          resolve({ location, error: null })
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          resolve({ location: null, error: errorMessage })
        },
        defaultOptions
      )
    })
  }

  // Watch position changes
  watchPosition(
    callback: (location: LocationData) => void,
    errorCallback?: (error: string) => void,
    options?: PositionOptions
  ): { success: boolean; error: string | null } {
    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation not supported' }
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
      ...options,
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          this.currentLocation = location
          callback(location)
        },
        (error) => {
          let errorMessage = 'Failed to watch location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          errorCallback?.(errorMessage)
        },
        defaultOptions
      )

      return { success: true, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { success: false, error: 'Failed to start watching location' }
    }
  }

  // Stop watching position
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  // Update user location in database
  async updateUserLocation(
    userId: string,
    location: LocationData,
    address?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_address: address,
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { success: false, error: 'Failed to update user location' }
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c // Distance in kilometers
  }

  // Find nearby jobs for a helper
  async findNearbyJobs(
    helperLocation: LocationData,
    maxDistance: number = 50, // km
    helperSkills: string[] = [],
    limit: number = 20
  ): Promise<{ matches: JobMatch[]; error: string | null }> {
    try {
      // Get open jobs with location data
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles!jobs_tradie_id_fkey (
            id,
            full_name,
            verified
          )
        `)
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(limit * 2) // Get more to filter by distance

      if (error) {
        return { matches: [], error: error.message }
      }

      if (!jobs) {
        return { matches: [], error: null }
      }

      // Calculate matches with distance and scoring
      const matches: JobMatch[] = []

      for (const job of jobs) {
        const distance = this.calculateDistance(
          helperLocation.latitude,
          helperLocation.longitude,
          job.latitude,
          job.longitude
        )

        // Skip if too far
        if (distance > maxDistance) continue

        // Calculate match score
        const score = this.calculateJobMatchScore(job, distance, helperSkills)
        
        matches.push({
          job,
          distance,
          score,
          matching_skills: this.getMatchingSkills(job.required_skills || [], helperSkills),
        })
      }

      // Sort by score (highest first) and limit results
      matches.sort((a, b) => b.score - a.score)
      
      return { matches: matches.slice(0, limit), error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { matches: [], error: 'Failed to find nearby jobs' }
    }
  }

  // Find nearby helpers for a job
  async findNearbyHelpers(
    jobLocation: LocationData,
    maxDistance: number = 50, // km
    requiredSkills: string[] = [],
    limit: number = 20
  ): Promise<{ helpers: (UserProfile & { distance: number; score: number })[]; error: string | null }> {
    try {
      // Get helpers with location data
      const { data: helpers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'helper')
        .eq('verified', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(limit * 2) // Get more to filter by distance

      if (error) {
        return { helpers: [], error: error.message }
      }

      if (!helpers) {
        return { helpers: [], error: null }
      }

      // Calculate matches with distance and scoring
      const matches: (UserProfile & { distance: number; score: number })[] = []

      for (const helper of helpers) {
        const distance = this.calculateDistance(
          jobLocation.latitude,
          jobLocation.longitude,
          helper.latitude!,
          helper.longitude!
        )

        // Skip if too far
        if (distance > maxDistance) continue

        // Calculate match score
        const score = this.calculateHelperMatchScore(helper, distance, requiredSkills)
        
        matches.push({
          ...helper,
          distance,
          score,
        })
      }

      // Sort by score (highest first) and limit results
      matches.sort((a, b) => b.score - a.score)
      
      return { helpers: matches.slice(0, limit), error: null }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { helpers: [], error: 'Failed to find nearby helpers' }
    }
  }

  // Reverse geocoding - get address from coordinates
  async reverseGeocode(latitude: number, longitude: number): Promise<{ address: string | null; error: string | null }> {
    try {
      // Using a simple approach - in production, you'd use a proper geocoding service
      const response = await fetch(
        `https://api.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      )

      if (!response.ok) {
        return { address: null, error: 'Geocoding service unavailable' }
      }

      const data = await response.json()
      
      if (data && data.display_name) {
        return { address: data.display_name, error: null }
      }

      return { address: null, error: 'Address not found' }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return { address: null, error: 'Failed to reverse geocode' }
    }
  }

  // Get current cached location
  getCurrentLocation(): LocationData | null {
    return this.currentLocation
  }

  // Calculate job match score
  private calculateJobMatchScore(job: Job, distance: number, helperSkills: string[]): number {
    let score = 0

    // Distance score (max 40 points) - closer is better
    const distanceScore = Math.max(0, 40 - distance)
    score += distanceScore

    // Skills match score (max 30 points)
    const requiredSkills = job.required_skills || []
    const matchingSkills = this.getMatchingSkills(requiredSkills, helperSkills)
    const skillsScore = requiredSkills.length > 0 
      ? (matchingSkills.length / requiredSkills.length) * 30 
      : 15 // Default score if no specific skills required

    score += skillsScore

    // Pay rate score (max 20 points) - higher pay gets more points
    const payScore = Math.min(20, (job.pay_rate / 50) * 20)
    score += payScore

    // Urgency score (max 10 points)
    const urgencyScore = job.urgency === 'high' ? 10 : job.urgency === 'medium' ? 5 : 2
    score += urgencyScore

    return Math.round(score)
  }

  // Calculate helper match score
  private calculateHelperMatchScore(helper: UserProfile, distance: number, requiredSkills: string[]): number {
    let score = 0

    // Distance score (max 40 points)
    const distanceScore = Math.max(0, 40 - distance)
    score += distanceScore

    // Skills match score (max 40 points)
    const helperSkills = helper.skills || []
    const matchingSkills = this.getMatchingSkills(requiredSkills, helperSkills)
    const skillsScore = requiredSkills.length > 0 
      ? (matchingSkills.length / requiredSkills.length) * 40 
      : 20 // Default score if no specific skills required

    score += skillsScore

    // Verification bonus (max 20 points)
    const verificationScore = helper.verified ? 20 : 5
    score += verificationScore

    return Math.round(score)
  }

  // Get matching skills between two arrays
  private getMatchingSkills(requiredSkills: string[], availableSkills: string[]): string[] {
    return requiredSkills.filter(skill => 
      availableSkills.some(available => 
        available.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(available.toLowerCase())
      )
    )
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const geolocationService = GeolocationService.getInstance()