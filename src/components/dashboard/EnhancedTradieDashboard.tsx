import { useAuth } from '../../context/AuthContext'
// TODO: import { EnhancedNavigation } from '../layout/EnhancedNavigation' // Currently unused
import MobileNavigation from '../layout/MobileNavigation'

export function EnhancedTradieDashboard() {
  const { profile } = useAuth()

  // TODO: Removed duplicate recentJobs array definition
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
    <>
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gray-50 text-gray-800" 
           style={{
             '--color-primary': '#2563EB',
             '--color-secondary': '#16A34A', 
             '--color-accent': '#EA580C',
             '--color-neutral-background': '#f8fafc',
             '--color-neutral-text': '#334155',
             '--color-neutral-border': '#e2e8f0',
             fontFamily: '"Work Sans", "Noto Sans", sans-serif'
           } as React.CSSProperties}>
        
        <div className="flex h-full grow flex-col">
          {/* Header */}
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--color-neutral-border)] bg-white px-6 py-4 md:px-10">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <h1 className="text-xl font-bold text-gray-900">TradieHelper</h1>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <a className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)]" href="/dashboard">Dashboard</a>
              <a className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)]" href="/jobs">Jobs</a>
              <a className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)]" href="/applications">Applications</a>
              <a className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)]" href="/profile">Profile</a>
            </nav>
            <div className="flex items-center gap-4">
              <button className="relative flex cursor-pointer items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
                <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                </svg>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
              </button>
              <div className="h-10 w-10 rounded-full border-2 border-[var(--color-primary)] bg-cover bg-center bg-no-repeat" 
                   style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBWP0ezYsDzK72wXjz93v8kGSolxsLyvt5OLIvOWErUDkntQbKq5wm_b2g588lUiVUF8uUNQHsVzb7OXQGGKcy5W_fckvjZsBMnwEptSraPhXX55NdqSuMuR3PM6HZ42HMbGIg-03Blc-IGmLKqORSI1hhdIWVNq0B4srKZ1vLinA6KWFNgyIsr3iuIingnCtdlTZ5EQxV8S1UKLREdYTntBBd0CcOvy3E9Mnsj7seRqkzg9x7A8NtCoj3fZc3wFIdhCvll2iTGnD4j")'}}></div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 bg-[var(--color-neutral-background)] p-4 md:p-8 lg:p-10">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {/* Welcome Section */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name || 'Mark'}!</h2>
                  <p className="text-md text-[var(--color-neutral-text)]">Here's what's happening with your jobs today.</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex transform flex-col items-center justify-center rounded-lg bg-[var(--color-primary)] p-8 text-white shadow-lg transition-transform hover:scale-105">
                    <svg className="mb-4 h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <h3 className="text-xl font-bold">Post a New Job</h3>
                    <p className="mt-1 text-center text-sm text-blue-100">Find the perfect helper for your next project.</p>
                    <button 
                      onClick={() => window.location.href = '/jobs/post'}
                      className="mt-6 rounded-full bg-white px-6 py-2 font-semibold text-[var(--color-primary)] transition hover:bg-blue-50"
                    >
                      Get Started
                    </button>
                  </div>

                  <div className="flex transform flex-col items-center justify-center rounded-lg border border-[var(--color-neutral-border)] bg-white p-8 shadow-lg transition-transform hover:scale-105">
                    <svg className="mb-4 h-12 w-12 text-[var(--color-secondary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900">View Applications</h3>
                    <p className="mt-1 text-center text-sm text-[var(--color-neutral-text)]">Review candidates and manage your applicants.</p>
                    <button 
                      onClick={() => window.location.href = '/applications'}
                      className="mt-6 rounded-full bg-[var(--color-secondary)] px-6 py-2 font-semibold text-white transition hover:bg-green-700"
                    >
                      Review Now
                    </button>
                  </div>
                </div>

                {/* Job Statistics */}
                <div className="mt-10">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Job Statistics</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[var(--color-neutral-text)]">Total Jobs Posted</p>
                      <p className="text-3xl font-bold text-gray-900">15</p>
                    </div>
                    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[var(--color-neutral-text)]">Active Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">8</p>
                    </div>
                    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-white p-5 shadow-sm">
                      <p className="text-sm font-medium text-[var(--color-neutral-text)]">Completed Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">7</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-10">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Recent Activity</h3>
                  <div className="overflow-x-auto rounded-lg border border-[var(--color-neutral-border)] bg-white shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Job Title</th>
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Date Posted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-neutral-border)]">
                        {recentJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${job.statusColor}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-neutral-text)]">{job.datePosted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-8">
                <div className="rounded-lg border border-[var(--color-neutral-border)] bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h3>
                  <ul className="space-y-3">
                    <li>
                      <a className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100" href="/jobs/post">
                        <span className="font-medium text-[var(--color-neutral-text)] group-hover:text-[var(--color-primary)]">Post a New Job</span>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </a>
                    </li>
                    <li>
                      <a className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100" href="/applications">
                        <span className="font-medium text-[var(--color-neutral-text)] group-hover:text-[var(--color-primary)]">View Applications</span>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </a>
                    </li>
                    <li>
                      <a className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100" href="/profile">
                        <span className="font-medium text-[var(--color-neutral-text)] group-hover:text-[var(--color-primary)]">Edit Profile</span>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-[var(--color-neutral-border)] bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Support</h3>
                  <ul className="space-y-3">
                    <li>
                      <a className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100" href="#contact">
                        <span className="font-medium text-[var(--color-neutral-text)] group-hover:text-[var(--color-primary)]">Contact Support</span>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </a>
                    </li>
                    <li>
                      <a className="group flex items-center justify-between rounded-md p-3 hover:bg-gray-100" href="/help">
                        <span className="font-medium text-[var(--color-neutral-text)] group-hover:text-[var(--color-primary)]">Help Centre</span>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </a>
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
      <MobileNavigation />
    </>
  )
}