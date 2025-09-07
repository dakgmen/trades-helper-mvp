import React, { useState } from 'react'

interface SkillMatch {
  skill: string
  level: 'Expert' | 'Proficient' | 'Intermediate' | 'Beginner'
  percentage: number
}

interface ApplicationReviewData {
  id: string
  applicantName: string
  jobTitle: string
  appliedDate: string
  viewedDate?: string
  verificationStatus: 'verified' | 'pending' | 'unverified'
  rating: number
  reviewCount: number
  jobsCompleted: number
  hourlyRate: number
  experience: string
  profileImage: string
  skillMatches: SkillMatch[]
}

interface ApplicationReviewProps {
  application?: ApplicationReviewData
  onAccept: (applicationId: string) => void
  onDecline: (applicationId: string) => void
  onMessage: (applicationId: string) => void
  onCall: (applicationId: string) => void
}

// Mock data for demonstration
const mockApplication: ApplicationReviewData = {
  id: 'app-123',
  applicantName: 'Alex Johnson',
  jobTitle: 'Wiring a New Home',
  appliedDate: '2 days ago',
  viewedDate: '1 day ago',
  verificationStatus: 'verified',
  rating: 4.8,
  reviewCount: 15,
  jobsCompleted: 22,
  hourlyRate: 75.00,
  experience: '5 years experience',
  profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=face',
  skillMatches: [
    { skill: 'Electrical Wiring', level: 'Expert', percentage: 85 },
    { skill: 'Residential Construction', level: 'Proficient', percentage: 70 },
    { skill: 'Project Management', level: 'Intermediate', percentage: 50 }
  ]
}

export const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  application = mockApplication,
  onAccept,
  onDecline,
  onMessage,
  onCall
}) => {
  // TODO: Add authentication when useAuth hook is available
  // const { user, profile } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      await onAccept(application.id)
    } catch (error) {
      console.error('Error accepting application:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    setIsProcessing(true)
    try {
      await onDecline(application.id)
    } catch (error) {
      console.error('Error declining application:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getSkillLevelColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden"
         style={{
           fontFamily: '"Work Sans", "Noto Sans", sans-serif',
           '--primary-color': '#2563eb',
           '--secondary-color': '#16a34a',
           '--accent-color': '#ea580c'
         } as React.CSSProperties}>
      
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-10 py-3 shadow-sm">
          <div className="flex items-center gap-4 text-gray-800">
            <svg className="h-8 w-8 text-[var(--primary-color)]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 8.89l-1.44-1.44-7.56 7.56-7.56-7.56L4 8.89l9 9z M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
            </svg>
            <h1 className="text-gray-800 text-2xl font-bold leading-tight tracking-[-0.015em]">TradieHelper</h1>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <nav className="flex items-center gap-9">
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium leading-normal" href="#">Find Tradies</a>
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium leading-normal" href="#">Post a Job</a>
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium leading-normal" href="#">Pricing</a>
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium leading-normal" href="#">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium leading-normal" href="#">Log In</a>
              <button className="flex min-w-[100px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[var(--primary-color)] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors duration-300">
                <span className="truncate">Sign Up</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-10 py-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                {/* Breadcrumb and Title */}
                <div className="mb-6">
                  <nav className="text-sm font-medium text-gray-500">
                    <a className="hover:text-[var(--primary-color)]" href="#">Applications</a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-800">Review Application</span>
                  </nav>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">Review Application</h2>
                  <p className="mt-1 text-gray-600">
                    Review the application details for {application.applicantName}, a qualified electrician applying for the '{application.jobTitle}' job.
                  </p>
                </div>

                {/* Application Timeline */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Application Timeline</h3>
                  <div className="relative pl-8">
                    <div className="absolute left-4 top-1 bottom-1 w-0.5 bg-gray-200"></div>
                    
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--secondary-color)] text-white flex items-center justify-center z-10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Application Received</p>
                        <p className="text-sm text-gray-500">{application.appliedDate}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--secondary-color)] text-white flex items-center justify-center z-10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Application Viewed</p>
                        <p className="text-sm text-gray-500">{application.viewedDate || 'Not viewed yet'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center z-10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0V7a1 1 0 011-1h4a1 1 0 011 1v0M8 7H4a1 1 0 00-1 1v0a1 1 0 001 1h4m0-2v10m0 0V7m0 10H4a1 1 0 00-1 1v0a1 1 0 001 1h4m4-12v10m0 0V7m0 10h4a1 1 0 001-1v0a1 1 0 00-1-1h-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Interview Scheduled</p>
                        <p className="text-sm text-gray-500">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skill Matching */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Skill Matching</h3>
                  <div className="space-y-6">
                    {application.skillMatches.map((skill, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800">{skill.skill}</p>
                          <p className={`text-sm font-medium ${getSkillLevelColor(skill.percentage)}`}>
                            {skill.level}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-[var(--primary-color)] h-2.5 rounded-full" 
                            style={{ width: `${skill.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Buttons */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Decision</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleDecline}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors duration-300 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" />
                      </svg>
                      <span className="truncate">Decline Application</span>
                    </button>
                    <button 
                      onClick={handleAccept}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-[var(--secondary-color)] text-white font-bold hover:bg-green-700 transition-colors duration-300 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="truncate">Accept Application</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Applicant Profile */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Applicant Profile</h3>
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div 
                      className="w-32 h-32 rounded-full bg-center bg-cover bg-gray-200" 
                      style={{ backgroundImage: `url(${application.profileImage})` }}
                    ></div>
                    {application.verificationStatus === 'verified' && (
                      <span className="absolute bottom-1 right-1 block h-6 w-6 rounded-full bg-[var(--secondary-color)] text-white flex items-center justify-center border-2 border-white">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">{application.applicantName}</p>
                  <p className="text-gray-600">Electrician | {application.experience}</p>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <dl className="space-y-4">
                    <div className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-500">Verification Status</dt>
                      <dd className="text-sm font-semibold text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {application.verificationStatus.charAt(0).toUpperCase() + application.verificationStatus.slice(1)}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-500">Rating</dt>
                      <dd className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {application.rating}/5 ({application.reviewCount} reviews)
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-500">Jobs Completed</dt>
                      <dd className="text-sm font-semibold text-gray-800">{application.jobsCompleted}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                      <dd className="text-sm font-semibold text-gray-800">${application.hourlyRate.toFixed(2)} AUD</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact</h3>
                <div className="space-y-4">
                  <button 
                    onClick={() => onMessage(application.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">Message Applicant</span>
                  </button>
                  <button 
                    onClick={() => onCall(application.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="truncate">Call Applicant</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ApplicationReview