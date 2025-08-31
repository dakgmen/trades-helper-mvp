import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'

interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  hourly_rate: number
  cover_letter: string
  created_at: string
  updated_at: string
  
  // Related data
  job: {
    id: string
    title: string
    description: string
    location: string
    skills_required: string[]
  }
  
  applicant: {
    id: string
    full_name: string
    email: string
    phone: string
    profile_image_url?: string
    bio: string
    skills: string[]
    experience_years: number
    hourly_rate: number
    rating: number
    reviews_count: number
    jobs_completed: number
    verified: boolean
  }
}

interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
}

type ViewMode = 'list' | 'detail'
type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected'

export const ApplicationReviewInterface: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { applicationId } = useParams()
  
  const [viewMode, setViewMode] = useState<ViewMode>(applicationId ? 'detail' : 'list')
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatus])

  useEffect(() => {
    if (applicationId && applications.length > 0) {
      const app = applications.find(a => a.id === applicationId)
      if (app) {
        setSelectedApplication(app)
        setViewMode('detail')
      }
    }
  }, [applicationId, applications])

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would fetch from Supabase
      // For demo purposes, using mock data
      const mockApplications: Application[] = [
        {
          id: 'app-1',
          job_id: 'job-1',
          applicant_id: 'user-1',
          status: 'pending',
          hourly_rate: 45,
          cover_letter: 'I have extensive experience in electrical work and would love to help with your project.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          job: {
            id: 'job-1',
            title: 'Electrician Needed',
            description: 'Looking for a qualified electrician to wire a new home construction project.',
            location: 'Sydney, NSW',
            skills_required: ['Electrical Wiring', 'Residential Construction']
          },
          applicant: {
            id: 'user-1',
            full_name: 'Alex Johnson',
            email: 'alex.johnson@example.com',
            phone: '0412 345 678',
            profile_image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMiBCMcsaawnJ2w3SdvfMV5fM1EBBOQAlUg5X8am-tM6OzguKGw3ovJA6PXFbidzMpnDLrAIR1-JBoe8AFiJkidE_4HF4_2TzfznjD5oRzC759A54KoodsXDWfPHxIFjt73DPUl6-gNyABUviJprEtS1lg5R4D_6WhE-mjkZdtJyxct3-MgaiOjWHEf9r3N9Q2ADnpjEUeuw5PCp4YnVvU1zffZbDrYrjccAavphLVvfPDafFX7NVgwb32lfNq1CUYL_hA5aFeGuoT',
            bio: 'Experienced electrician with 5+ years in residential construction.',
            skills: ['Electrical Wiring', 'Residential Construction', 'Project Management'],
            experience_years: 5,
            hourly_rate: 75,
            rating: 4.8,
            reviews_count: 15,
            jobs_completed: 22,
            verified: true
          }
        },
        {
          id: 'app-2',
          job_id: 'job-2',
          applicant_id: 'user-2',
          status: 'pending',
          hourly_rate: 38.50,
          cover_letter: 'I am eager to learn and assist with plumbing projects. I have basic experience and am very reliable.',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          job: {
            id: 'job-2',
            title: 'Plumbing Assistant',
            description: 'Looking for a helper to assist with various plumbing installations.',
            location: 'Melbourne, VIC',
            skills_required: ['Plumbing', 'General Labour']
          },
          applicant: {
            id: 'user-2',
            full_name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '0413 456 789',
            bio: 'Reliable helper with basic plumbing experience looking to grow skills.',
            skills: ['General Labour', 'Plumbing'],
            experience_years: 1,
            hourly_rate: 40,
            rating: 4.5,
            reviews_count: 8,
            jobs_completed: 12,
            verified: true
          }
        },
        {
          id: 'app-3',
          job_id: 'job-3',
          applicant_id: 'user-3',
          status: 'accepted',
          hourly_rate: 35,
          cover_letter: 'I have carpentry experience and am available to start immediately.',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          job: {
            id: 'job-3',
            title: 'Carpentry Helper',
            description: 'Need assistance with custom cabinet installation project.',
            location: 'Brisbane, QLD',
            skills_required: ['Carpentry', 'Cabinet Installation']
          },
          applicant: {
            id: 'user-3',
            full_name: 'Mike Wilson',
            email: 'mike.wilson@example.com',
            phone: '0414 567 890',
            bio: 'Experienced carpenter specializing in custom installations.',
            skills: ['Carpentry', 'Cabinet Installation', 'Woodworking'],
            experience_years: 3,
            hourly_rate: 42,
            rating: 4.9,
            reviews_count: 25,
            jobs_completed: 35,
            verified: true
          }
        }
      ]

      // Filter applications
      let filtered = mockApplications
      if (filterStatus !== 'all') {
        filtered = mockApplications.filter(app => app.status === filterStatus)
      }

      setApplications(filtered)

      // Calculate stats
      const statsData = {
        total: mockApplications.length,
        pending: mockApplications.filter(app => app.status === 'pending').length,
        accepted: mockApplications.filter(app => app.status === 'accepted').length,
        rejected: mockApplications.filter(app => app.status === 'rejected').length
      }
      setStats(statsData)

    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      // In real implementation, update via Supabase
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, updated_at: new Date().toISOString() }
            : app
        )
      )

      // Update selected application if it's the current one
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => 
          prev ? { ...prev, status, updated_at: new Date().toISOString() } : null
        )
      }

      // Refresh stats
      await fetchApplications()
      
    } catch (err) {
      console.error('Error updating application status:', err)
      setError('Failed to update application status')
    }
  }

  const getSkillMatchPercentage = (applicantSkills: string[], requiredSkills: string[]) => {
    const matches = applicantSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    ).length
    return Math.round((matches / requiredSkills.length) * 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else {
      return `${diffInDays} days ago`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderListView = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Manage Applications</h2>
        <p className="text-gray-500 mt-1">Review, accept, or reject job applications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Total Applications</p>
          <p className="text-gray-900 text-3xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-orange-200">
          <p className="text-orange-600 text-sm font-medium">Pending</p>
          <p className="text-gray-900 text-3xl font-bold mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
          <p className="text-green-600 text-sm font-medium">Accepted</p>
          <p className="text-gray-900 text-3xl font-bold mt-1">{stats.accepted}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
          <p className="text-red-600 text-sm font-medium">Rejected</p>
          <p className="text-gray-900 text-3xl font-bold mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex space-x-4">
            {(['all', 'pending', 'accepted', 'rejected'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filterStatus === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} 
                {status === 'pending' && stats.pending > 0 && ` (${stats.pending})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by job or name..."
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {applications.filter(app => 
            app.applicant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((application) => (
            <div key={application.id} className="p-6 flex flex-col md:flex-row items-start gap-6 hover:bg-gray-50 transition-colors">
              <div className="w-full md:w-48 h-32 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                {application.applicant.profile_image_url ? (
                  <img
                    src={application.applicant.profile_image_url}
                    alt={application.applicant.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {application.applicant.full_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{application.applicant.full_name}</p>
                    <p className="text-sm text-gray-500">
                      Applied for: <span className="font-medium text-gray-700">{application.job.title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(application.created_at)}
                    </p>
                    {application.applicant.verified && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.252.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Rate: ${application.hourly_rate.toFixed(2)}/hr AUD</p>
                  <p className="text-sm text-gray-600">
                    Rating: {application.applicant.rating}/5 ({application.applicant.reviews_count} reviews)
                  </p>
                  <p className="text-sm text-gray-600">
                    Experience: {application.applicant.experience_years} years | Jobs: {application.applicant.jobs_completed}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  {application.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'accepted')}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                    Message
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApplication(application)
                      setViewMode('detail')
                      navigate(`/applications/${application.id}`)
                    }}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDetailView = () => {
    if (!selectedApplication) return null

    const { applicant, job } = selectedApplication
    const skillMatchPercentage = getSkillMatchPercentage(applicant.skills, job.skills_required)

    return (
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
              <nav className="text-sm font-medium text-gray-500 mb-2">
                <button
                  onClick={() => {
                    setViewMode('list')
                    navigate('/applications')
                  }}
                  className="hover:text-blue-600"
                >
                  Applications
                </button>
                <span className="mx-2">/</span>
                <span className="text-gray-800">Review Application</span>
              </nav>
              <h2 className="text-3xl font-bold text-gray-900">Review Application</h2>
              <p className="mt-1 text-gray-600">
                Review the application details for {applicant.full_name}, applying for '{job.title}'.
              </p>
            </div>

            {/* Application Timeline */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Application Timeline</h3>
              <div className="relative pl-8">
                <div className="absolute left-4 top-1 bottom-1 w-0.5 bg-gray-200"></div>
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center z-10">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 002 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Application Received</p>
                    <p className="text-sm text-gray-500">{formatDate(selectedApplication.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center z-10">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Application Viewed</p>
                    <p className="text-sm text-gray-500">Now</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center z-10">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Decision</p>
                    <p className="text-sm text-gray-500">
                      {selectedApplication.status === 'pending' ? 'Pending' : 
                       selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Matching */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Skill Matching</h3>
              <div className="space-y-6">
                {job.skills_required.map((skill, index) => {
                  const hasSkill = applicant.skills.some(s => 
                    s.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(s.toLowerCase())
                  )
                  const percentage = hasSkill ? 85 - (index * 15) : 25
                  const level = percentage > 70 ? 'Expert' : percentage > 50 ? 'Proficient' : 'Beginner'
                  
                  return (
                    <div key={skill} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-800">{skill}</p>
                        <p className="text-sm font-medium text-gray-600">{level}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Overall Match: {skillMatchPercentage}%
                </p>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Cover Letter</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedApplication.cover_letter}</p>
              </div>
            </div>

            {/* Decision Buttons */}
            {selectedApplication.status === 'pending' && (
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Decision</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    Decline Application
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Accept Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Applicant Profile */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Applicant Profile</h3>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {applicant.profile_image_url ? (
                    <img
                      src={applicant.profile_image_url}
                      alt={applicant.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-gray-600">
                      {applicant.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                {applicant.verified && (
                  <span className="absolute bottom-1 right-1 block h-6 w-6 rounded-full bg-green-600 text-white flex items-center justify-center border-2 border-white">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900">{applicant.full_name}</p>
              <p className="text-gray-600">{applicant.experience_years} years experience</p>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="space-y-4">
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500">Verification Status</dt>
                  <dd className="text-sm font-semibold text-green-600 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.252.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500">Rating</dt>
                  <dd className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {applicant.rating}/5 ({applicant.reviews_count} reviews)
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500">Jobs Completed</dt>
                  <dd className="text-sm font-semibold text-gray-800">{applicant.jobs_completed}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                  <dd className="text-sm font-semibold text-gray-800">${applicant.hourly_rate.toFixed(2)} AUD</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Contact</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Message Applicant
              </button>
              <button className="w-full flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Applicant
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {viewMode === 'list' ? renderListView() : renderDetailView()}
    </div>
  )
}