import React, { useState } from 'react'

interface JobDetails {
  id: string
  title: string
  description: string
  salary: string
  location: string
  jobType: string
  startDate: string
  postedDate: string
  companyName: string
  companyRating: number
  companyJobsPosted: number
  companyImage: string
  companyDescription: string
  responsibilities: string[]
  requirements: string[]
  timeline: Array<{
    title: string
    description: string
  }>
}

interface DetailedJobViewProps {
  jobId: string
  onApply: (jobId: string) => void
  onSave: (jobId: string) => void
}

// Mock data for demonstration
const mockJob: JobDetails = {
  id: 'job-123',
  title: 'General Labourer - Immediate Start',
  description: 'We are urgently seeking a reliable and hardworking General Labourer to join our friendly team for a construction project in Richmond, VIC. This is a fantastic opportunity for someone with a strong work ethic who is keen to get started straight away. You\'ll be assisting various tradespeople, keeping the site clean and safe, and performing a range of manual tasks.',
  salary: '$35 - $45 AUD per hour',
  location: 'Richmond, VIC 3121',
  jobType: 'Full-time',
  startDate: 'Immediate',
  postedDate: '2 days ago',
  companyName: 'Richmond Construction',
  companyRating: 4.8,
  companyJobsPosted: 15,
  companyImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=64&h=64&fit=crop',
  companyDescription: 'We are a reputable building company with projects across Melbourne. We value safety, quality, and teamwork.',
  responsibilities: [
    'Assisting tradespeople with their tasks (carpenters, electricians, etc.).',
    'Loading and unloading materials and equipment.',
    'Site clean-up and maintenance.',
    'Operating basic hand and power tools.',
    'Adhering to all site safety protocols.'
  ],
  requirements: [
    'Valid White Card (essential).',
    'Previous experience in a similar role on a construction site.',
    'Physical fitness and ability to perform manual labour.',
    'Strong understanding of workplace health and safety.',
    'A reliable and punctual attitude.',
    'Own basic PPE (steel-cap boots, hard hat, high-vis clothing).'
  ],
  timeline: [
    { title: 'Application Review', description: 'We review applications as they come in.' },
    { title: 'Phone Screening', description: 'Suitable candidates contacted within 2 business days.' },
    { title: 'Offer', description: 'Successful applicants can expect a quick offer.' }
  ]
}

export const DetailedJobView: React.FC<DetailedJobViewProps> = ({
  jobId,
  onApply,
  onSave
}) => {
  // TODO: const { profile } = useAuth() // Currently unused
  const [job] = useState<JobDetails>(mockJob)
  const [isApplying, setIsApplying] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await onApply(jobId)
    } catch (error) {
      console.error('Error applying to job:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const handleSave = async () => {
    try {
      await onSave(jobId)
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden bg-gray-50"
         style={{
           fontFamily: '"Work Sans", "Noto Sans", sans-serif',
           '--primary-color': '#2563EB',
           '--secondary-color': '#16A34A',
           '--accent-color': '#EA580C'
         } as React.CSSProperties}>
      
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-10 py-4 shadow-sm">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 text-gray-800">
              <svg className="h-8 w-8 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48"></rect></clipPath>
                </defs>
              </svg>
              <h1 className="text-2xl font-bold tracking-tight">TradieHelper</h1>
            </div>
            <nav className="flex items-center gap-8">
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium transition-colors" href="#">Find Work</a>
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium transition-colors" href="#">Post a Job</a>
              <a className="text-gray-600 hover:text-[var(--primary-color)] text-base font-medium transition-colors" href="#">About Us</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-sm font-bold leading-normal tracking-[0.015em] transition-colors">
              <span className="truncate">Log In</span>
            </button>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[var(--primary-color)] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors">
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Column - Job Details */}
              <div className="col-span-8">
                <div className="bg-white p-8 rounded-lg shadow-md">
                  {/* Breadcrumb and Title */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <a className="hover:text-[var(--primary-color)]" href="#">Jobs</a>
                      <span>/</span>
                      <span className="font-medium text-gray-700">{job.title}</span>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-800">{job.title}</h2>
                    <p className="text-gray-500 mt-2">
                      Posted {job.postedDate} · {job.jobType} · <span className="font-semibold text-[var(--secondary-color)]">{job.salary}</span>
                    </p>
                  </div>

                  {/* Job Description */}
                  <div className="prose max-w-none text-gray-600">
                    <p>{job.description}</p>

                    <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Key Responsibilities</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index}>{responsibility}</li>
                      ))}
                    </ul>

                    <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Required Skills & Certifications</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {job.requirements.map((requirement, index) => (
                        <li key={index}>{requirement}</li>
                      ))}
                    </ul>

                    <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Job Timeline</h3>
                    <div className="relative border-l-2 border-[var(--primary-color)] pl-8 space-y-8">
                      {job.timeline.map((step, index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-[42px] top-1.5 h-4 w-4 bg-[var(--primary-color)] rounded-full"></div>
                          <h4 className="font-semibold text-gray-700">{step.title}</h4>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="col-span-4">
                <div className="space-y-6">
                  {/* Action Buttons */}
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <button 
                      onClick={handleApply}
                      disabled={isApplying}
                      className="w-full h-12 px-6 bg-[var(--primary-color)] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-lg disabled:opacity-50"
                    >
                      {isApplying ? 'Applying...' : 'Apply Now'}
                    </button>
                    <button 
                      onClick={handleSave}
                      className={`w-full h-12 px-6 mt-3 ${isSaved ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-700'} font-bold rounded-lg hover:bg-gray-300 transition-colors`}
                    >
                      {isSaved ? 'Job Saved' : 'Save Job'}
                    </button>
                  </div>

                  {/* Job Overview */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">Job Overview</h3>
                    <ul className="space-y-4 text-gray-600">
                      <li className="flex items-start">
                        <svg className="h-6 w-6 mr-3 text-[var(--primary-color)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <div><strong className="font-semibold text-gray-700 block">Job Type:</strong> {job.jobType}</div>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 mr-3 text-[var(--primary-color)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <div><strong className="font-semibold text-gray-700 block">Location:</strong> {job.location}</div>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 mr-3 text-[var(--primary-color)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <div><strong className="font-semibold text-gray-700 block">Salary:</strong> {job.salary}</div>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 mr-3 text-[var(--primary-color)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <div><strong className="font-semibold text-gray-700 block">Start Date:</strong> {job.startDate}</div>
                      </li>
                    </ul>
                  </div>

                  {/* About the Tradie */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">About the Tradie</h3>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-full bg-gray-200 bg-cover bg-center" 
                        style={{backgroundImage: `url(${job.companyImage})`}}
                      ></div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">{job.companyName}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <svg className="h-4 w-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path>
                          </svg>
                          <span>{job.companyRating} ({job.companyJobsPosted} Jobs Posted)</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">{job.companyDescription}</p>
                  </div>

                  {/* Location */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Location</h3>
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-200">
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DetailedJobView