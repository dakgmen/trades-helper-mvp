import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface Job {
  id: string
  title: string
  description: string
  location: string
  date_time: string
  pay_rate: number
  duration_hours: number
  skills_required: string[]
  status: string
  urgency?: string
  tradie: {
    full_name: string
    verified: boolean
  }
}

interface JobFilters {
  jobType: string
  location: string
  radius: number
  minRate: number
  maxRate: number
  urgency: string
  skills: string
  sortBy: 'relevance' | 'date' | 'pay_rate'
}

export const AdvancedJobDiscovery: React.FC = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [filters, setFilters] = useState<JobFilters>({
    jobType: 'all',
    location: '',
    radius: 50,
    minRate: 0,
    maxRate: 0,
    urgency: 'all',
    skills: '',
    sortBy: 'relevance'
  })

  const jobTypes = ['All Types', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Landscaping', 'Cleaning']

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('jobs')
        .select(`
          *,
          tradie:tradie_id (
            full_name,
            verified
          )
        `)
        .eq('status', 'open')
        .neq('tradie_id', user?.id || '')

      // Apply search query
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Apply filters
      if (filters.jobType && filters.jobType !== 'all') {
        query = query.contains('skills_required', [filters.jobType])
      }

      if (filters.minRate > 0) {
        query = query.gte('pay_rate', filters.minRate)
      }

      if (filters.maxRate > 0) {
        query = query.lte('pay_rate', filters.maxRate)
      }

      // Sort
      switch (filters.sortBy) {
        case 'date':
          query = query.order('created_at', { ascending: false })
          break
        case 'pay_rate':
          query = query.order('pay_rate', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching jobs:', error)
      } else {
        setJobs(data || [])
      }
    } catch (err) {
      console.error('Failed to load jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, searchQuery, filters])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const applyForJob = async (jobId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          helper_id: user.id,
          status: 'pending'
        })

      if (error) {
        alert('Failed to apply for job')
        console.error(error)
      } else {
        alert('Application submitted successfully!')
        await fetchJobs() // Refresh jobs
      }
    } catch (err) {
      alert('Failed to apply for job')
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto flex h-full">
        {/* Sidebar Filters */}
        <aside className="w-80 flex-shrink-0 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Filters</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="job-type">Job Type</label>
              <select 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="job-type"
                value={filters.jobType}
                onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
              >
                {jobTypes.map(type => (
                  <option key={type} value={type === 'All Types' ? 'all' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="location">Location</label>
              <input 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="location" 
                placeholder="Enter a suburb or postcode" 
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="radius">Radius</label>
              <div className="flex items-center gap-4">
                <input 
                  className="h-2 w-full flex-1 accent-blue-600"
                  id="radius" 
                  max="100" 
                  min="0" 
                  type="range" 
                  value={filters.radius}
                  onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                />
                <span className="text-sm text-gray-700 font-medium">{filters.radius}km</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="pay-rate">Pay Rate</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min ($)" 
                  type="number"
                  value={filters.minRate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRate: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Max ($)" 
                  type="number"
                  value={filters.maxRate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRate: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="urgency">Urgency</label>
              <select 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="urgency"
                value={filters.urgency}
                onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="skills">Skills</label>
              <input 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="skills" 
                placeholder="e.g. licensed, insured" 
                value={filters.skills}
                onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
              />
            </div>

            <button 
              type="button"
              onClick={fetchJobs}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Job Discovery</h1>
            <div className="relative w-full max-w-xs">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input 
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search for jobs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing {jobs.length} jobs</p>
            <div className="flex h-9 items-center justify-center rounded-md bg-gray-100 p-1">
              {(['relevance', 'date', 'pay_rate'] as const).map((sortOption) => (
                <label key={sortOption} className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-3 has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-gray-900 text-gray-600 text-sm font-medium leading-normal">
                  <span className="truncate capitalize">{sortOption === 'pay_rate' ? 'Pay Rate' : sortOption}</span>
                  <input 
                    checked={filters.sortBy === sortOption}
                    className="invisible w-0" 
                    name="sort" 
                    type="radio" 
                    value={sortOption}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'relevance' | 'date' | 'pay_rate' }))}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map(job => (
                <div key={job.id} className={`grid grid-cols-[1fr_200px] items-start gap-6 rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                  job.urgency === 'urgent' ? 'border-orange-500' : 'border-gray-200'
                }`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                      {job.urgency === 'urgent' && (
                        <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-normal leading-normal">{job.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>${job.pay_rate} / hour</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>{job.duration_hours}h duration</span>
                      </div>
                    </div>
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex gap-2">
                        {job.skills_required.map((skill, index) => (
                          <span key={index} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Posted by:</span>
                      <span className="font-medium text-gray-900">{job.tradie.full_name}</span>
                      {job.tradie.verified && (
                        <span className="inline-flex items-center text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-1 text-xs">Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(job.date_time).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button 
                      onClick={() => applyForJob(job.id)}
                      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}