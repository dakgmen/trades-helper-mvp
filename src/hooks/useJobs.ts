import { useState, useEffect, useCallback } from 'react'
import { jobService } from '../services/jobService'
import type { Job, JobFilters } from '../types'

export const useJobs = (type: 'tradie' | 'helper' = 'helper') => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async (filters?: JobFilters) => {
    try {
      setLoading(true)
      setError(null)

      let data
      if (type === 'tradie') {
        data = await jobService.getJobsByTradie()
      } else {
        data = await jobService.getOpenJobs(filters)
      }

      setJobs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const createJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => {
    // Transform jobData to match jobService.createJob parameter expectations
    const transformedJobData = {
      title: jobData.title,
      description: jobData.description || undefined, // Convert null to undefined
      location: jobData.location,
      date_time: jobData.date_time,
      duration_hours: jobData.duration_hours,
      pay_rate: jobData.pay_rate
    }
    const newJob = await jobService.createJob(transformedJobData)
    setJobs(prev => [newJob, ...prev])
    return newJob
  }

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    await jobService.updateJob(jobId, updates)
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ))
  }

  const deleteJob = async (jobId: string) => {
    await jobService.deleteJob(jobId)
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    refetch: fetchJobs
  }
}