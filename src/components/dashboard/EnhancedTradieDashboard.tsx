import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { StatCard } from '../ui/StatCard'
import { Button } from '../ui/Button'

export function EnhancedTradieDashboard() {
  const { profile } = useAuth()

  const stats = [
    {
      title: 'Total Jobs Posted',
      value: 15,
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'blue' as const
    },
    {
      title: 'Active Jobs',
      value: 8,
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'orange' as const
    },
    {
      title: 'Completed Jobs',
      value: 7,
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green' as const
    }
  ]

  const recentJobs = [
    {
      id: 1,
      title: 'Plumbing Job in Sydney',
      status: 'Active',
      datePosted: '20 Jul 2024',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 2,
      title: 'Electrical Work in Melbourne',
      status: 'Completed',
      datePosted: '15 Jul 2024',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 3,
      title: 'Carpentry Project in Brisbane',
      status: 'Active',
      datePosted: '10 Jul 2024',
      statusColor: 'bg-blue-100 text-blue-800'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'Mark'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your jobs today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <Card className="transform transition-transform hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 p-3 bg-blue-100 rounded-full">
                      <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Post a New Job</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Find the perfect helper for your next project.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/jobs/post'}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="transform transition-transform hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 p-3 bg-green-100 rounded-full">
                      <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">View Applications</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Review candidates and manage your applicants.
                    </p>
                    <Button 
                      variant="secondary"
                      onClick={() => window.location.href = '/applications'}
                      className="w-full"
                    >
                      Review Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Job Statistics */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                  <StatCard key={index} {...stat} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Posted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {job.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${job.statusColor}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {job.datePosted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a
                    href="/jobs/post"
                    className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Post a New Job
                    </span>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </a>
                  <a
                    href="/applications"
                    className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      View Applications
                    </span>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </a>
                  <a
                    href="/profile"
                    className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Edit Profile
                    </span>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                    </svg>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-gray-900">Support</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Contact Support
                    </span>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Help Centre
                    </span>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}