import React, { useState } from 'react'
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  PhoneIcon, 
  DocumentTextIcon,
  FlagIcon,
  UserMinusIcon,
  CheckBadgeIcon,
  ChatBubbleLeftIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'

interface TrustAndSafetyHubProps {
  onReportUser?: (userId: string) => void
  onReportJob?: (jobId: string) => void
}

export const TrustAndSafetyHub: React.FC<TrustAndSafetyHubProps> = () => {
  const [showReportUserModal, setShowReportUserModal] = useState(false)
  const [showReportJobModal, setShowReportJobModal] = useState(false)

  const safetyGuidelines = [
    {
      icon: CheckBadgeIcon,
      title: 'Verify Identity',
      description: 'Always verify the identity of tradies or helpers before accepting a job or hiring someone.',
      color: 'text-blue-600'
    },
    {
      icon: ChatBubbleLeftIcon,
      title: 'Communicate Clearly',
      description: 'Communicate clearly and set expectations regarding the scope of work, payment terms (AUD $), and safety procedures.',
      color: 'text-blue-600'
    },
    {
      icon: FlagIcon,
      title: 'Report Suspicious Activity',
      description: 'Report any suspicious activity or safety concerns immediately through our platform.',
      color: 'text-blue-600'
    }
  ]

  const emergencyContacts = [
    {
      service: 'Emergency Services (Police, Fire, Ambulance)',
      number: '000'
    },
    {
      service: 'Police (Non-Emergency)',
      number: '131 444'
    }
  ]

  const handleReportUser = () => {
    setShowReportUserModal(true)
  }

  const handleReportJob = () => {
    setShowReportJobModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <a className="flex items-center gap-3" href="#">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path 
                    clipRule="evenodd" 
                    d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" 
                    fill="currentColor" 
                    fillRule="evenodd"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_6_535">
                    <rect fill="white" height="48" width="48" />
                  </clipPath>
                </defs>
              </svg>
              <h1 className="text-xl font-bold text-gray-800">TradieHelper</h1>
            </a>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600" href="#">Find Work</a>
            <a className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600" href="#">Post a Job</a>
            <a className="text-sm font-bold text-blue-600" href="#">Safety</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="mb-12 text-center">
              <HeartIcon className="mx-auto h-16 w-16 text-blue-600" />
              <h1 className="mt-4 text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl">
                Trust and Safety Hub
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                Your safety is our top priority. Find resources and tools to ensure a safe experience on TradieHelper.
              </p>
            </div>

            <div className="space-y-12">
              {/* Safety Guidelines */}
              <section>
                <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                  <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                  Safety Guidelines
                </h2>
                <p className="mt-2 text-base text-gray-600">
                  At TradieHelper, we are committed to providing a safe and secure environment for all users. 
                  Please review our guidelines to ensure a positive experience.
                </p>
                <div className="mt-6 space-y-4">
                  {safetyGuidelines.map((guideline, index) => (
                    <div key={index} className="flex items-start gap-4 rounded-lg bg-white p-4 shadow-sm">
                      <guideline.icon className={`h-6 w-6 ${guideline.color} flex-shrink-0 mt-1`} />
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-1">{guideline.title}</h3>
                        <p className="text-base text-gray-700">{guideline.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
                {/* Reporting Tools */}
                <section>
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                    <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                    Reporting Tools
                  </h2>
                  <p className="mt-2 text-base text-gray-600">
                    If you encounter any issues or have safety concerns, please use the following tools to report them.
                  </p>
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                    <button 
                      onClick={handleReportUser}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                    >
                      <UserMinusIcon className="h-5 w-5" />
                      <span className="truncate">Report a User</span>
                    </button>
                    <button 
                      onClick={handleReportJob}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      <FlagIcon className="h-5 w-5" />
                      <span className="truncate">Report a Job</span>
                    </button>
                  </div>
                </section>

                {/* Emergency Contacts */}
                <section>
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                    <PhoneIcon className="h-8 w-8 text-red-600" />
                    Emergency Contacts
                  </h2>
                  <p className="mt-2 text-base text-gray-600">
                    In case of an emergency, please contact the appropriate authorities immediately.
                  </p>
                  <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
                    <ul className="divide-y divide-gray-200">
                      {emergencyContacts.map((contact, index) => (
                        <li key={index} className="flex justify-between py-3">
                          <span className="text-sm text-gray-600">{contact.service}</span>
                          <span className="text-sm font-bold text-gray-800">{contact.number}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>

              {/* Additional Resources */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Insurance Information */}
                <section>
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                    <ShieldExclamationIcon className="h-8 w-8 text-green-600" />
                    Insurance Information
                  </h2>
                  <p className="mt-2 text-base text-gray-600">
                    TradieHelper provides insurance coverage for certain situations. 
                    Please review our insurance policy for details.
                  </p>
                  <div className="mt-6">
                    <a 
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300" 
                      href="#"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                      <span className="truncate">View Insurance Policy</span>
                    </a>
                  </div>
                </section>

                {/* Australian Safety Standards */}
                <section>
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                    <CheckBadgeIcon className="h-8 w-8 text-orange-600" />
                    Australian Safety Standards
                  </h2>
                  <p className="mt-2 text-base text-gray-600">
                    All tradies and helpers on our platform are expected to adhere to Australian safety standards. 
                    For more information, please visit the Safe Work Australia website.
                  </p>
                  <div className="mt-6">
                    <a 
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300" 
                      href="https://www.safeworkaustralia.gov.au" 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="truncate">Safe Work Australia</span>
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path 
                  clipRule="evenodd" 
                  d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" 
                  fill="currentColor" 
                  fillRule="evenodd"
                />
              </svg>
              <p className="text-base font-semibold text-gray-800">TradieHelper</p>
            </div>
            <p className="mt-4 text-sm text-gray-500 md:mt-0">© 2024 TradieHelper. All rights reserved.</p>
            <div className="mt-4 flex gap-4 md:mt-0">
              <a className="text-sm text-gray-500 hover:text-blue-600" href="#">Terms of Service</a>
              <a className="text-sm text-gray-500 hover:text-blue-600" href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Report User Modal */}
      {showReportUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Report a User</h3>
                <button 
                  onClick={() => setShowReportUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Report
                  </label>
                  <select className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option>Select a reason...</option>
                    <option>Inappropriate behavior</option>
                    <option>Safety concerns</option>
                    <option>Fraud or scam</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea 
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Please provide additional details about your report..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowReportUserModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowReportUserModal(false)
                      // Handle report submission
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Job Modal */}
      {showReportJobModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Report a Job</h3>
                <button 
                  onClick={() => setShowReportJobModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Report
                  </label>
                  <select className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option>Select a reason...</option>
                    <option>Inappropriate job posting</option>
                    <option>Safety concerns</option>
                    <option>Fraud or fake job</option>
                    <option>Spam</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea 
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Please provide additional details about your report..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowReportJobModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowReportJobModal(false)
                      // Handle report submission
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrustAndSafetyHub