import { useState } from 'react'
// TODO: import { useEffect } from 'react' // Currently unused
// TODO: import { useAuth } from '../../context/AuthContext' // Currently unused
// TODO: import { supabase } from '../../utils/supabase' // Currently unused
// TODO: import { Button } from '../ui/Button' // Currently unused
import { useToast } from '../ui/Toast'

// TODO: Interface for future props implementation
// interface InteractiveAvailabilityCalendarProps {
//   helperId?: string
//   mode?: 'view' | 'book' | 'manage'
// }

export function InteractiveAvailabilityCalendar() {
  // TODO: helperId and mode props currently unused - using mock data
  // TODO: mode prop currently unused
  // TODO: helperId prop currently unused
  // TODO: const { user, profile } = useAuth() // Currently unused
  // TODO: const [currentDate, setCurrentDate] = useState(new Date()) // Currently unused
  const [selectedDate, setSelectedDate] = useState(5) // July 5th
  const [viewType, setViewType] = useState<'weekly' | 'monthly'>('weekly')
  const [recurrence, setRecurrence] = useState('Does not repeat')
  const [locationRadius, setLocationRadius] = useState(50)
  const { showSuccess } = useToast()
  // TODO: showError currently unused

  // Mock calendar data
  const generateCalendarDays = () => {
    // July 2024 calendar starting from July 1 (Monday)
    return [
      null, null, null, // Empty cells for alignment (July starts on Monday)
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
    ]
  }

  const timeSlots = [
    {
      id: '1',
      title: 'Available',
      time: '9:00 AM - 5:00 PM',
      location: 'All locations',
      type: 'available' as const,
      color: 'green'
    },
    {
      id: '2', 
      title: 'Booked',
      time: '1:00 PM - 3:00 PM',
      location: 'Job #1234 - Plumbing at Richmond',
      type: 'booked' as const,
      color: 'orange'
    }
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    // Navigation functionality - for demo purposes, keeping current month
    console.log(`Navigate ${direction}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800" style={{ fontFamily: "'Roboto', 'Work Sans', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between whitespace-nowrap border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M24 0L0 14V38L24 52L48 38V14L24 0ZM24 4.16L4 16.32V35.68L24 47.84L44 35.68V16.32L24 4.16ZM22 22H36V26H22V22ZM12 30H26V34H12V30Z" fill="currentColor" fillRule="evenodd"></path>
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">TradieHelper</h1>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-base font-medium text-gray-600 hover:text-blue-600" href="#">Dashboard</a>
          <a className="text-base font-medium text-gray-600 hover:text-blue-600" href="#">Jobs</a>
          <a className="text-base font-bold text-blue-600" href="#">Availability</a>
          <a className="text-base font-medium text-gray-600 hover:text-blue-600" href="#">Payments</a>
          <a className="text-base font-medium text-gray-600 hover:text-blue-600" href="#">Profile</a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
            </svg>
          </button>
          <div className="h-10 w-10 rounded-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuANrRJnv5RfkcwPABjFuewMdiQ8xYg16WXoK8DSvc5dsc9ZZbBOSpCYP9464wXxKSIOgj48CSC7fA1w-vBwxJtOKbmiA1lrbx1qUiqObc4x1ZGzZ9j9YPTgbHCFlrveyIDyYBC5Zibm2nGv3KWY_y6qS1dlvCU6EbjPvxXX2hlOax7lliWvGbAdm5_NqRBKWZtqGzEr9gKv9T9bQHs-9NMswY0GvqJG05XIVaiT_H7HGozc94xT5lHTQ62NLi_eWGsnI4kXXKbZhW23")' }}></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Availability</h2>
          <p className="text-lg text-gray-500">Set your available times for jobs and manage your schedule.</p>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-8">
              <button 
                className={`border-b-2 px-1 pb-3 text-base font-semibold ${
                  viewType === 'weekly' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setViewType('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`border-b-2 px-1 pb-3 text-base font-medium ${
                  viewType === 'monthly' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setViewType('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Calendar */}
            <div className="md:col-span-1">
              <div className="flex items-center justify-between">
                <button 
                  className="rounded-full p-2 hover:bg-gray-100"
                  onClick={() => navigateMonth('prev')}
                >
                  <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                  </svg>
                </button>
                <p className="text-lg font-semibold text-gray-900">July 2024</p>
                <button 
                  className="rounded-full p-2 hover:bg-gray-100"
                  onClick={() => navigateMonth('next')}
                >
                  <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                  </svg>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                <div className="py-2 text-sm font-medium text-gray-500">S</div>
                <div className="py-2 text-sm font-medium text-gray-500">M</div>
                <div className="py-2 text-sm font-medium text-gray-500">T</div>
                <div className="py-2 text-sm font-medium text-gray-500">W</div>
                <div className="py-2 text-sm font-medium text-gray-500">T</div>
                <div className="py-2 text-sm font-medium text-gray-500">F</div>
                <div className="py-2 text-sm font-medium text-gray-500">S</div>
                
                {generateCalendarDays().map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="flex items-center justify-center"></div>
                  }
                  return (
                    <div key={index} className="flex items-center justify-center">
                      <button 
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm hover:bg-gray-100 ${
                          day === selectedDate 
                            ? 'bg-blue-600 text-white font-semibold' 
                            : day === 30 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : ''
                        }`}
                        onClick={() => setSelectedDate(day)}
                      >
                        {day}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Side Content */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-gray-900">Friday, 5 July</h3>
              <p className="mb-6 text-gray-500">Drag to adjust times or add new slots.</p>
              
              {/* Time Slots */}
              <div className="space-y-4">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className={`group relative flex cursor-pointer items-center justify-between rounded-lg p-4 transition-shadow duration-200 hover:shadow-md ${
                    slot.type === 'available' ? 'bg-green-50' : 'bg-orange-50'
                  }`}>
                    <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-lg ${
                      slot.type === 'available' ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <p className={`font-semibold ${
                        slot.type === 'available' ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        {slot.title}
                      </p>
                      <p className={`text-lg font-bold ${
                        slot.type === 'available' ? 'text-green-900' : 'text-orange-900'
                      }`}>
                        {slot.time}
                      </p>
                      <p className={`text-sm ${
                        slot.type === 'available' ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {slot.location}
                      </p>
                    </div>
                    {slot.type === 'available' && (
                      <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-200">
                          <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.62,0L36.69,152A15.86,15.86,0,0,0,32,164v40a16,16,0,0,0,16,16H88a15.86,15.86,0,0,0,12-4.69L227.31,96a16,16,0,0,0,0-22.62ZM88,200H48V164l24-24,40,40Zm28-28L76,132l88-88,40,40Z"></path>
                          </svg>
                        </button>
                        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-200">
                          <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM192,208H64V64H192Z"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                <button 
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 py-4 text-center text-gray-500 hover:border-blue-500 hover:text-blue-600"
                  onClick={() => showSuccess('Add time slot feature coming soon!')}
                >
                  <span className="font-semibold">+ Add a new time slot</span>
                </button>
              </div>

              {/* Availability Settings */}
              <div className="mt-8">
                <h4 className="text-lg font-bold text-gray-800">Availability Settings</h4>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="recurrence">
                      Recurring Pattern
                    </label>
                    <select 
                      className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white" 
                      id="recurrence" 
                      name="recurrence"
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none'
                      }}
                    >
                      <option>Does not repeat</option>
                      <option>Repeats every Friday</option>
                      <option>Repeats daily</option>
                      <option>Custom...</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="locationRadius">
                      Location Radius
                    </label>
                    <input 
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600" 
                      id="locationRadius" 
                      max="100" 
                      min="0" 
                      name="locationRadius" 
                      type="range" 
                      value={locationRadius}
                      onChange={(e) => setLocationRadius(parseInt(e.target.value))}
                    />
                    <div className="mt-1 text-right text-sm text-gray-500">{locationRadius} km</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="mt-8 flex justify-end border-t border-gray-200 pt-6">
            <button 
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => showSuccess('Settings saved successfully!')}
            >
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}