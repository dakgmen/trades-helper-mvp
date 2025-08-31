import { supabase } from '../lib/supabase'
import type { Availability, AvailabilityPattern, AvailableHelperWithDistance } from '../types'

export class AvailabilityService {
  // Set availability for a helper
  static async setAvailability(availabilityData: {
    helper_id: string
    date: string
    start_time: string
    end_time: string
    is_available: boolean
    recurring_pattern?: AvailabilityPattern
  }): Promise<Availability | null> {
    try {
      const { data, error } = await supabase
        .from('availability')
        .upsert({
          ...availabilityData,
          recurring_pattern: availabilityData.recurring_pattern || 'none',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'helper_id,date,start_time'
        })
        .select()
        .single()

      if (error) {
        console.error('Error setting availability:', error)
        return null
      }

      // If recurring pattern is set, create future availability slots
      if (availabilityData.recurring_pattern && availabilityData.recurring_pattern !== 'none') {
        await this.createRecurringAvailability(availabilityData)
      }

      return data as Availability
    } catch (error) {
      console.error('Error setting availability:', error)
      return null
    }
  }

  // Get availability for a helper within date range
  static async getHelperAvailability(
    helperId: string,
    startDate: string,
    endDate: string
  ): Promise<Availability[]> {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('helper_id', helperId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching helper availability:', error)
        return []
      }

      return data as Availability[]
    } catch (error) {
      console.error('Error fetching helper availability:', error)
      return []
    }
  }

  // Get available helpers for a specific date and time
  static async getAvailableHelpers(
    date: string,
    startTime: string,
    endTime: string,
    latitude?: number,
    longitude?: number,
    radiusKm: number = 50
  ): Promise<AvailableHelperWithDistance[]> {
    try {
      const query = supabase
        .from('availability')
        .select(`
          *,
          helper:profiles!helper_id(id, full_name, phone, skills, latitude, longitude, verified)
        `)
        .eq('date', date)
        .eq('is_available', true)
        .is('booking_id', null)
        .lte('start_time', startTime)
        .gte('end_time', endTime)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching available helpers:', error)
        return []
      }

      let results = data || []

      // Filter by location if coordinates provided
      if (latitude && longitude) {
        results = results.filter(item => {
          if (!item.helper?.latitude || !item.helper?.longitude) {
            return false
          }

          const distance = this.calculateDistance(
            latitude,
            longitude,
            item.helper.latitude,
            item.helper.longitude
          )

          return distance <= radiusKm
        })
      }

      // Group by helper and calculate distances
      const helperMap = new Map()
      
      results.forEach(item => {
        const helperId = item.helper.id
        let distance = undefined

        if (latitude && longitude && item.helper?.latitude && item.helper?.longitude) {
          distance = this.calculateDistance(
            latitude,
            longitude,
            item.helper.latitude,
            item.helper.longitude
          )
        }

        if (!helperMap.has(helperId)) {
          helperMap.set(helperId, {
            helper: item.helper,
            availability: [],
            distance
          })
        }

        helperMap.get(helperId).availability.push(item)
      })

      // Convert to array and sort by distance if available
      const availableHelpers = Array.from(helperMap.values())

      if (latitude && longitude) {
        availableHelpers.sort((a, b) => {
          if (a.distance === undefined) return 1
          if (b.distance === undefined) return -1
          return a.distance - b.distance
        })
      }

      return availableHelpers
    } catch (error) {
      console.error('Error fetching available helpers:', error)
      return []
    }
  }

  // Book availability slot
  static async bookAvailabilitySlot(
    availabilityId: string,
    bookingId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('availability')
        .update({
          booking_id: bookingId,
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', availabilityId)
        .is('booking_id', null) // Ensure it's not already booked

      if (error) {
        console.error('Error booking availability slot:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error booking availability slot:', error)
      return false
    }
  }

  // Release availability slot (when job is cancelled or completed)
  static async releaseAvailabilitySlot(bookingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('availability')
        .update({
          booking_id: null,
          is_available: true,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)

      if (error) {
        console.error('Error releasing availability slot:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error releasing availability slot:', error)
      return false
    }
  }

  // Create bulk availability (for setting weekly schedules)
  static async setBulkAvailability(
    helperId: string,
    availabilitySlots: Array<{
      date: string
      start_time: string
      end_time: string
      is_available: boolean
    }>
  ): Promise<{ success: boolean; created: number; errors: number }> {
    try {
      const results = {
        success: true,
        created: 0,
        errors: 0
      }

      const bulkData = availabilitySlots.map(slot => ({
        helper_id: helperId,
        ...slot,
        recurring_pattern: 'none' as AvailabilityPattern,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('availability')
        .upsert(bulkData, {
          onConflict: 'helper_id,date,start_time'
        })
        .select()

      if (error) {
        console.error('Error setting bulk availability:', error)
        results.success = false
        results.errors = availabilitySlots.length
      } else {
        results.created = data?.length || 0
      }

      return results
    } catch (error) {
      console.error('Error setting bulk availability:', error)
      return {
        success: false,
        created: 0,
        errors: availabilitySlots.length
      }
    }
  }

  // Get helper's schedule summary for a week
  static async getWeeklySchedule(
    helperId: string,
    weekStartDate: string
  ): Promise<{
    [key: string]: Availability[]
  }> {
    try {
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + 6)

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('helper_id', helperId)
        .gte('date', weekStartDate)
        .lte('date', weekEndDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching weekly schedule:', error)
        return {}
      }

      // Group by date
      const schedule: { [key: string]: Availability[] } = {};
      
      (data || []).forEach((availability: Availability) => {
        const date = availability.date
        if (!schedule[date]) {
          schedule[date] = []
        }
        schedule[date].push(availability)
      })

      return schedule
    } catch (error) {
      console.error('Error fetching weekly schedule:', error)
      return {}
    }
  }

  // Delete availability
  static async deleteAvailability(availabilityId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', availabilityId)
        .is('booking_id', null) // Only delete if not booked

      if (error) {
        console.error('Error deleting availability:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting availability:', error)
      return false
    }
  }

  // Private helper methods
  private static async createRecurringAvailability(availabilityData: {
    helper_id: string
    date: string
    start_time: string
    end_time: string
    is_available: boolean
    recurring_pattern?: AvailabilityPattern
  }): Promise<void> {
    try {
      const startDate = new Date(availabilityData.date)
      const slots: Array<Omit<Availability, 'id' | 'booking_id'>> = []
      
      let daysToAdd = 0
      let occurrences = 0
      const maxOccurrences = 52 // Create up to 52 weeks ahead

      switch (availabilityData.recurring_pattern) {
        case 'daily':
          daysToAdd = 1
          break
        case 'weekly':
          daysToAdd = 7
          break
        case 'monthly':
          daysToAdd = 30
          break
        default:
          return
      }

      while (occurrences < maxOccurrences) {
        const nextDate = new Date(startDate)
        nextDate.setDate(nextDate.getDate() + (daysToAdd * (occurrences + 1)))
        
        // Don't create slots more than 6 months in the future
        const sixMonthsFromNow = new Date()
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
        
        if (nextDate > sixMonthsFromNow) {
          break
        }

        slots.push({
          helper_id: availabilityData.helper_id,
          date: nextDate.toISOString().split('T')[0],
          start_time: availabilityData.start_time,
          end_time: availabilityData.end_time,
          is_available: availabilityData.is_available,
          recurring_pattern: 'none' as AvailabilityPattern,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        occurrences++
      }

      if (slots.length > 0) {
        await supabase
          .from('availability')
          .upsert(slots, {
            onConflict: 'helper_id,date,start_time'
          })
      }
    } catch (error) {
      console.error('Error creating recurring availability:', error)
    }
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in kilometers
    
    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}