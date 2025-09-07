import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/solid'

interface JobSchedule {
  id: string
  title: string
  location: string
  startTime: string
  endTime: string
  estimatedCost: string
  color: 'blue' | 'green' | 'orange' | 'purple'
  conflictWarning?: string
}

interface ScheduleOverviewProps {
  jobs?: JobSchedule[]
  currentWeek?: string
  onViewDetails?: (jobId: string) => void
  onOptimizeRoute?: () => void
  onIntegrateCalendar?: () => void
}

export const ScheduleOverview: React.FC<ScheduleOverviewProps> = ({
  jobs = [],
  currentWeek = "Week of July 15 - July 21, 2024",
  onViewDetails,
  onOptimizeRoute,
  onIntegrateCalendar
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')

  const defaultJobs: JobSchedule[] = [
    {
      id: '1',
      title: 'Plumbing Repair',
      location: '123 Main Street, Sydney NSW',
      startTime: '8:00 AM',
      endTime: '10:00 AM',
      estimatedCost: '$250 AUD',
      color: 'blue'
    },
    {
      id: '2',
      title: 'Electrical Installation',
      location: '456 Oak Avenue, Melbourne VIC',
      startTime: '11:00 AM',
      endTime: '1:00 PM',
      estimatedCost: '$400 AUD',
      color: 'green',
      conflictWarning: 'Travel time overlaps with next job start.'
    },
    {
      id: '3',
      title: 'Carpentry Work',
      location: '789 Pine Road, Brisbane QLD',
      startTime: '2:00 PM',
      endTime: '4:00 PM',
      estimatedCost: '$320 AUD',
      color: 'orange'
    }
  ]

  const displayJobs = jobs.length > 0 ? jobs : defaultJobs

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 border-blue-500 text-blue-700'
      case 'green':
        return 'bg-green-100 border-green-500 text-green-700'
      case 'orange':
        return 'bg-orange-100 border-orange-500 text-orange-700'
      case 'purple':
        return 'bg-purple-100 border-purple-500 text-purple-700'
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700'
    }
  }

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ]

  const handleViewDetails = (jobId: string) => {
    onViewDetails?.(jobId)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 bg-white">
        <div className="flex items-center gap-4 text-gray-900">
          <div className="h-8 w-8 text-blue-600">
            <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L1 9.77V22h22V9.77L12 2zm0 3.5l8 6.22V20H4v-8.28l8-6.22zM11 14h2v5h-2v-5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TradieHelper</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-10 py-8 lg:px-20 xl:px-40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Header with View Toggle */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Schedule Overview</h2>
                <p className="text-gray-500 mt-1">View your upcoming jobs and manage your schedule effectively.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white p-1 border border-gray-200">
                <button 
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    viewMode === 'day' 
                      ? 'text-white bg-blue-600 shadow' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Day
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    viewMode === 'week' 
                      ? 'text-white bg-blue-600 shadow' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    viewMode === 'month' 
                      ? 'text-white bg-blue-600 shadow' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Schedule View */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{currentWeek}</h3>
                <div className="flex items-center gap-2">
                  <button className="flex items-center justify-center rounded-full h-8 w-8 text-gray-500 hover:bg-gray-100 transition-colors">
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button className="text-sm font-medium text-gray-600 hover:text-blue-600">Today</button>
                  <button className="flex items-center justify-center rounded-full h-8 w-8 text-gray-500 hover:bg-gray-100 transition-colors">
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[auto,1fr] gap-x-4">
                {/* Time Labels */}
                <div className="text-xs text-gray-500 space-y-12 pt-3">
                  {timeSlots.map((time, index) => (
                    <div key={index}>{time}</div>
                  ))}
                </div>

                {/* Schedule Timeline */}
                <div className="relative border-l border-gray-200 min-h-[600px]">
                  {displayJobs.map((job, index) => (
                    <div key={job.id}>
                      {/* Job Block */}
                      <div 
                        className={`absolute left-4 right-0 p-4 rounded-lg border-l-4 ${getColorClasses(job.color)}`}
                        style={{
                          top: `${8 + index * 30}%`,
                          height: '18%'
                        }}
                      >
                        <h4 className="font-bold">{job.title}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {job.location}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {job.startTime} - {job.endTime}
                        </p>
                      </div>

                      {/* Travel Time (if not last job) */}
                      {index < displayJobs.length - 1 && (
                        <div 
                          className="absolute left-4 right-0 bg-gray-100 p-2 rounded-lg"
                          style={{
                            top: `${28 + index * 30}%`,
                            height: '8%'
                          }}
                        >
                          <p className="text-xs text-center text-gray-500 flex items-center justify-center h-full gap-2">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Travel to next job (approx. 30 min)
                          </p>
                        </div>
                      )}

                      {/* Conflict Warning */}
                      {job.conflictWarning && (
                        <>
                          <div 
                            className="absolute left-[-8px] h-3 w-3 bg-orange-600 rounded-full border-2 border-white flex items-center justify-center"
                            style={{ top: `${32 + index * 30}%` }}
                          >
                            <ExclamationTriangleIcon className="h-2 w-2 text-white" />
                          </div>
                          <div 
                            className="absolute left-6 bg-orange-600 text-white text-xs px-2 py-1 rounded-full shadow-lg"
                            style={{ top: `${31.5 + index * 30}%` }}
                          >
                            {job.conflictWarning}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Mini Calendar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold text-gray-900">July 2024</p>
                <div className="flex items-center gap-1">
                  <button className="flex items-center justify-center rounded-full h-7 w-7 text-gray-400 hover:bg-gray-100 transition-colors">
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button className="flex items-center justify-center rounded-full h-7 w-7 text-gray-400 hover:bg-gray-100 transition-colors">
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-sm">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-gray-500 font-medium pb-2">{day}</div>
                ))}
                {/* Calendar dates would be dynamically generated */}
                <div className="text-gray-400">30</div>
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} className={i + 1 === 15 ? 'bg-blue-600 text-white rounded-full' : ''}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                {displayJobs.map((job) => (
                  <div key={job.id} className={`p-4 rounded-lg border ${getColorClasses(job.color)}`}>
                    <h4 className="font-bold text-gray-800">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.startTime} - {job.endTime}</p>
                    <p className="text-sm text-gray-500">Quote: {job.estimatedCost}</p>
                    <button 
                      onClick={() => handleViewDetails(job.id)}
                      className="text-xs font-bold text-blue-600 hover:underline mt-2"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling Tools */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Scheduling Tools</h3>
              <div className="space-y-3">
                <button 
                  onClick={onOptimizeRoute}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-700">Optimise Travel Route</p>
                    <p className="text-sm text-gray-500">Find the most efficient path between jobs.</p>
                  </div>
                </button>
                <button 
                  onClick={onIntegrateCalendar}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <CalendarIcon className="h-6 w-6 text-gray-500" />
                  <div>
                    <p className="font-semibold text-gray-700">Integrate Calendar</p>
                    <p className="text-sm text-gray-500">Sync with Google Calendar, Outlook, etc.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ScheduleOverview