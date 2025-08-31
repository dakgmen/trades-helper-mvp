import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { StatCard } from '../ui/StatCard'
import { Button } from '../ui/Button'

interface Job {
  id: number
  title: string
  location: string
  payRate: string
  description: string
  urgent?: boolean
}

export function EnhancedHelperDashboard() {
  const { profile } = useAuth()
  const [filters, setFilters] = useState({
    jobType: 'all',
    location: 'all',
    payRate: 'any',
    urgency: 'all'
  })

  const stats = [
    {
      title: 'Total Earnings',
      value: '$2,500 AUD',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'green' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Jobs Completed',
      value: 15,
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue' as const
    },
    {
      title: 'Average Rating',
      value: '4.8',
      description: '⭐',
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      color: 'purple' as const
    }
  ]

  const availableJobs: Job[] = [
    {
      id: 1,
      title: 'Plumbing Assistant Needed',
      location: 'Sydney, NSW',
      payRate: '$35/hr',
      description: 'Assist with pipe installations and repairs.',
      urgent: true
    },
    {
      id: 2,
      title: 'Electrical Helper',
      location: 'Melbourne, VIC',
      payRate: '$30/hr',
      description: 'Help with wiring and electrical installations.'
    },
    {
      id: 3,
      title: 'Carpentry Assistant',
      location: 'Brisbane, QLD',
      payRate: '$40/hr',
      description: 'Assist with framing and finishing work.',
      urgent: true
    },
    {
      id: 4,
      title: 'Landscaping Helper',
      location: 'Perth, WA',
      payRate: '$25/hr',
      description: 'Help with garden maintenance and landscaping tasks.'
    }
  ]

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-80">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Job Type
                    </label>
                    <select
                      id="jobType"
                      value={filters.jobType}
                      onChange={(e) => handleFilterChange('jobType', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Job Types</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="carpentry">Carpentry</option>
                      <option value="landscaping">Landscaping</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <select
                      id="location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Locations</option>
                      <option value="sydney">Sydney, NSW</option>
                      <option value="melbourne">Melbourne, VIC</option>
                      <option value="brisbane">Brisbane, QLD</option>
                      <option value="perth">Perth, WA</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="payRate" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Pay Rate (per hour)
                    </label>
                    <select
                      id="payRate"
                      value={filters.payRate}
                      onChange={(e) => handleFilterChange('payRate', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="any">Any Rate</option>
                      <option value="25-35">$25 - $35</option>
                      <option value="35-45">$35 - $45</option>
                      <option value="45+">$45+</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Urgency
                    </label>
                    <select
                      id="urgency"
                      value={filters.urgency}
                      onChange={(e) => handleFilterChange('urgency', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <Button className="w-full mt-4">
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Job Discovery</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {profile?.full_name || 'Helper'} - find your next job opportunity.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>

            {/* Jobs Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Available Jobs ({availableJobs.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option>Recent</option>
                    <option>Pay Rate</option>
                    <option>Location</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <Card key={job.id} hoverable className="transition-all duration-200 hover:border-blue-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-800">{job.title}</h3>
                            {job.urgent && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-600">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {job.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>
                              <strong>Location:</strong> {job.location}
                            </span>
                            <span>
                              <strong>Pay:</strong> 
                              <span className="font-semibold text-green-600 ml-1">
                                {job.payRate}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {[1, 2, 3, '...', 10].map((page, index) => (
                    <button
                      key={index}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === 1
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}