import React from 'react'
import type { Job } from '../../types'

interface JobCardProps {
  job: Job & {
    profiles?: {
      full_name: string | null
      verified: boolean
    }
  }
  onApply?: () => void
  showApplyButton?: boolean
  showManageButton?: boolean
  onManage?: () => void
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onApply,
  showApplyButton = false,
  showManageButton = false,
  onManage
}) => {
  const jobDate = new Date(job.date_time)
  const totalPay = job.duration_hours * job.pay_rate
  const isUpcoming = jobDate > new Date()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-600">{job.profiles?.full_name || 'Anonymous'}</span>
            {job.profiles?.verified && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Verified
              </span>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </div>

        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {jobDate.toLocaleDateString()} at {jobDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {job.duration_hours} hour{job.duration_hours !== 1 ? 's' : ''}
        </div>
      </div>

      {job.description && (
        <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
      )}

      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          <span className="text-green-600">${job.pay_rate}/hour</span>
          <span className="text-sm text-gray-500 ml-2">
            (${totalPay.toFixed(2)} total)
          </span>
        </div>

        <div className="flex space-x-2">
          {showManageButton && (
            <button
              onClick={onManage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Manage
            </button>
          )}
          
          {showApplyButton && job.status === 'open' && isUpcoming && (
            <button
              onClick={onApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}