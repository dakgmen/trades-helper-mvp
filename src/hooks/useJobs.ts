import { useState, useEffect } from 'react'
import { jobService } from '../services/jobService'
import type { Job } from '../types'

export const useJobs = (type: 'tradie' | 'helper' = 'helper') => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async (filters?: any) => {
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
  }

  useEffect(() => {
    fetchJobs()
  }, [type])

  const createJob = async (jobData: any) => {
    try {
      const newJob = await jobService.createJob(jobData)
      setJobs(prev => [newJob, ...prev])
      return newJob
    } catch (err) {
      throw err
    }
  }

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    try {
      await jobService.updateJob(jobId, updates)
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, ...updates } : job
      ))
    } catch (err) {
      throw err
    }
  }

  const deleteJob = async (jobId: string) => {
    try {
      await jobService.deleteJob(jobId)
      setJobs(prev => prev.filter(job => job.id !== jobId))
    } catch (err) {
      throw err
    }
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