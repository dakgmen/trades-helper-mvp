import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import type { Job, UserProfile } from '../../types'

interface JobDetailProps {
  job?: Job & {
    profiles?: UserProfile
  }
}

export const JobDetail: React.FC<JobDetailProps> = ({ job: propJob }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [job, setJob] = useState<(Job & { profiles?: UserProfile }) | null>(propJob || null)
  const [loading, setLoading] = useState(!propJob)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobDetails = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:tradie_id (
            id,
            full_name,
            verified,
            avatar_url,
            skills
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setJob(data)
    } catch (err) {
      console.error('Error fetching job details:', err)
      setError('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }, [id])

  const checkApplicationStatus = useCallback(async () => {
    if (!id || !user) return

    try {
      const { data } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', id)
        .eq('helper_id', user.id)
        .single()

      setHasApplied(!!data)
    } catch {
      // No application found - this is expected
    }
  }, [id, user])

  useEffect(() => {
    if (!propJob && id) {
      fetchJobDetails()
    }
    if (id && user) {
      checkApplicationStatus()
    }
  }, [id, user, propJob, fetchJobDetails, checkApplicationStatus])

  const handleApply = async () => {
    if (!job || !user || hasApplied) return

    try {
      setApplying(true)
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          helper_id: user.id,
          status: 'pending'
        })

      if (error) throw error

      setHasApplied(true)
      alert('Application submitted successfully!')
    } catch (err) {
      console.error('Error applying to job:', err)
      alert('Failed to submit application. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const handleSaveJob = () => {
    // TODO: Implement save job functionality
    alert('Save job functionality coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The job you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const jobDate = new Date(job.date_time)
  const isExpired = jobDate < new Date()
  const canApply = profile?.role === 'helper' && job.status === 'open' && !isExpired && !hasApplied

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                {/* Breadcrumb */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Link to="/jobs" className="hover:text-blue-600">Jobs</Link>
                    <span>/</span>
                    <span className="font-medium text-gray-700">{job.title}</span>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-800">{job.title}</h1>
                  <div className="text-gray-500 mt-2">
                    Posted {new Date(job.created_at).toLocaleDateString()} · 
                    {job.duration_hours > 1 ? ` ${job.duration_hours} hours` : ' 1 hour'} · 
                    <span className="font-semibold text-green-600"> ${job.pay_rate} AUD per hour</span>
                  </div>
                </div>

                {/* Job Description */}
                <div className="prose max-w-none text-gray-600">
                  <p className="text-lg leading-relaxed">{job.description || 'No description provided.'}</p>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <>
                      <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Required Skills</h3>
                      <div className="flex flex-wrap gap-2 not-prose">
                        {job.required_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Job Timeline</h3>
                  <div className="relative border-l-2 border-blue-600 pl-8 space-y-8 not-prose">
                    <div className="relative">
                      <div className="absolute -left-[42px] top-1.5 h-4 w-4 bg-blue-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-700">Application Review</h4>
                      <p className="text-sm text-gray-500">Applications are reviewed as they come in.</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[42px] top-1.5 h-4 w-4 bg-blue-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-700">Selection</h4>
                      <p className="text-sm text-gray-500">Suitable candidates will be contacted within 2 business days.</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[42px] top-1.5 h-4 w-4 bg-blue-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-700">Job Start</h4>
                      <p className="text-sm text-gray-500">{jobDate.toLocaleDateString()} at {jobDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="space-y-6">
                {/* Apply/Action Section */}
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  {canApply ? (
                    <>
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="w-full h-12 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applying ? 'Applying...' : 'Apply Now'}
                      </button>
                      <button
                        onClick={handleSaveJob}
                        className="w-full h-12 px-6 mt-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Save Job
                      </button>
                    </>
                  ) : hasApplied ? (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                      <p className="font-semibold">Application Submitted</p>
                      <p className="text-sm mt-1">You'll hear back from the tradie soon!</p>
                    </div>
                  ) : job.status !== 'open' ? (
                    <div className="bg-gray-100 text-gray-600 p-4 rounded-lg">
                      <p className="font-semibold">Job No Longer Available</p>
                      <p className="text-sm mt-1">This job has been filled or closed.</p>
                    </div>
                  ) : isExpired ? (
                    <div className="bg-orange-100 text-orange-800 p-4 rounded-lg">
                      <p className="font-semibold">Job Expired</p>
                      <p className="text-sm mt-1">This job opportunity has passed.</p>
                    </div>
                  ) : profile?.role !== 'helper' ? (
                    <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
                      <p className="font-semibold">Helper Account Required</p>
                      <p className="text-sm mt-1">Only helpers can apply to jobs.</p>
                    </div>
                  ) : null}
                </div>

                {/* Job Overview */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">Job Overview</h3>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <div>
                        <strong className="font-semibold text-gray-700 block">Duration:</strong>
                        {job.duration_hours} {job.duration_hours === 1 ? 'hour' : 'hours'}
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <div>
                        <strong className="font-semibold text-gray-700 block">Location:</strong>
                        {job.location}
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <div>
                        <strong className="font-semibold text-gray-700 block">Pay Rate:</strong>
                        ${job.pay_rate} AUD per hour
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <div>
                        <strong className="font-semibold text-gray-700 block">Start Date:</strong>
                        {jobDate.toLocaleDateString()}
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <div>
                        <strong className="font-semibold text-gray-700 block">Urgency:</strong>
                        <span className={`capitalize ${job.urgency === 'high' ? 'text-red-600' : job.urgency === 'medium' ? 'text-orange-600' : 'text-green-600'}`}>
                          {job.urgency}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* About the Tradie */}
                {job.profiles && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">About the Tradie</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 bg-cover bg-center flex items-center justify-center">
                        {job.profiles.avatar_url ? (
                          <img
                            src={job.profiles.avatar_url}
                            alt={job.profiles.full_name || 'Tradie'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">
                          {job.profiles.full_name || 'Anonymous Tradie'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          {job.profiles.verified && (
                            <>
                              <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.469 6.469a1 1 0 00-1.414-1.414L9 11.586l-1.768-1.768a1 1 0 10-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Verified</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {job.profiles.skills && job.profiles.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.profiles.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.profiles.skills.length > 3 && (
                            <span className="text-sm text-gray-500">
                              +{job.profiles.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNavigation />
    </div>
  )
}