import React, { useState, useEffect, useCallback } from 'react'
import { AvailabilityService } from '../../services/availabilityService'
import type { Availability, AvailabilityPattern } from '../../types'

interface AvailabilityCalendarProps {
  helperId: string
  editable?: boolean
  onSlotSelect?: (slot: Availability) => void
  className?: string
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  helperId,
  editable = false,
  onSlotSelect,
  className = ''
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [availability, setAvailability] = useState<{ [date: string]: Availability[] }>({})
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const loadAvailability = useCallback(async () => {
    setLoading(true)
    try {
      const weekStart = getWeekStart(currentWeek)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      const schedule = await AvailabilityService.getWeeklySchedule(helperId, weekStartStr)
      setAvailability(schedule)
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }, [currentWeek, helperId])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  const getWeekDates = (weekStart: Date): Date[] => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const isSlotAvailable = (slot: Availability): boolean => {
    return slot.is_available && !slot.booking_id
  }

  const handleSlotClick = (slot: Availability) => {
    if (onSlotSelect && isSlotAvailable(slot)) {
      onSlotSelect(slot)
    }
  }

  const handleAddAvailability = (date: string) => {
    setSelectedDate(date)
    setShowAddForm(true)
  }

  const weekStart = getWeekStart(currentWeek)
  const weekDates = getWeekDates(weekStart)

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {editable ? 'Manage Availability' : 'Available Times'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {weekDays.map((day, index) => {
              const date = weekDates[index]
              const dateStr = date.toISOString().split('T')[0]
              const daySlots = availability[dateStr] || []
              
              return (
                <div key={day} className="text-center">
                  <div className="font-medium text-gray-900 mb-1">{day}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1 min-h-[200px]">
                    {daySlots.length === 0 ? (
                      <div className="text-xs text-gray-400 py-2">
                        {editable ? (
                          <button
                            onClick={() => handleAddAvailability(dateStr)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            + Add time
                          </button>
                        ) : (
                          'No availability'
                        )}
                      </div>
                    ) : (
                      daySlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          onClick={() => handleSlotClick(slot)}
                          className={`
                            text-xs p-2 rounded border text-center cursor-pointer transition-colors
                            ${isSlotAvailable(slot)
                              ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                            }
                          `}
                        >
                          <div className="font-medium">
                            {formatTime(slot.start_time)}
                          </div>
                          <div className="text-xs">
                            to {formatTime(slot.end_time)}
                          </div>
                          {slot.booking_id && (
                            <div className="text-xs text-red-600 mt-1">
                              Booked
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    
                    {editable && daySlots.length > 0 && (
                      <button
                        onClick={() => handleAddAvailability(dateStr)}
                        className="text-xs text-blue-600 hover:text-blue-700 py-1"
                      >
                        + Add more
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Availability Form Modal */}
      {showAddForm && selectedDate && (
        <AddAvailabilityForm
          date={selectedDate}
          helperId={helperId}
          onSuccess={() => {
            setShowAddForm(false)
            setSelectedDate(null)
            loadAvailability()
          }}
          onCancel={() => {
            setShowAddForm(false)
            setSelectedDate(null)
          }}
        />
      )}
    </div>
  )
}

// Add Availability Form Component
interface AddAvailabilityFormProps {
  date: string
  helperId: string
  onSuccess: () => void
  onCancel: () => void
}

const AddAvailabilityForm: React.FC<AddAvailabilityFormProps> = ({
  date,
  helperId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '17:00',
    recurring_pattern: 'none' as AvailabilityPattern
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await AvailabilityService.setAvailability({
        helper_id: helperId,
        date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_available: true,
        recurring_pattern: formData.recurring_pattern
      })

      onSuccess()
    } catch (error) {
      console.error('Error adding availability:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Add Availability</h3>
        <p className="text-sm text-gray-600 mb-4">
          Date: {new Date(date).toLocaleDateString()}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repeat
            </label>
            <select
              value={formData.recurring_pattern}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                recurring_pattern: e.target.value as AvailabilityPattern 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No repeat</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Availability'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}