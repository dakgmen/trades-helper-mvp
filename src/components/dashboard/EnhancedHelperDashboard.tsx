import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import MobileNavigation from '../layout/MobileNavigation'

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

  // TODO: Stats array currently unused - stats are hard-coded in JSX
  // const stats = [...] // Commented out to remove unused variable

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
    <>
      <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden" 
           style={{
             '--primary-blue': '#2563EB',
             '--secondary-green': '#16A34A', 
             '--accent-orange': '#EA580C',
             '--neutral-gray-100': '#F3F4F6',
             '--neutral-gray-200': '#E5E7EB',
             '--neutral-gray-500': '#6B7280',
             '--neutral-gray-700': '#374151',
             '--neutral-gray-800': '#1F2937',
             '--neutral-gray-900': '#111827',
             '--select-button-svg': 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(107, 114, 128)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e")',
             fontFamily: '"Work Sans", "Noto Sans", sans-serif'
           } as React.CSSProperties}>
        
        <div className="layout-container flex h-full grow flex-col">
          {/* Header */}
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--neutral-gray-200)] bg-white px-10 py-3">
            <div className="flex items-center gap-4 text-[var(--neutral-gray-900)]">
              <div className="size-8 text-[var(--primary-blue)]">
                <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.93,11.23l-9-7a1,1,0,0,0-1.06,0l-9,7a1,1,0,0,0,1.06,1.74L6,12.2V19a1,1,0,0,0,1,1h3a1,1,0,0,0,1-1V16h4v3a1,1,0,0,0,1,1h3a1,1,0,0,0,1-1V12.2l1.07.77a1,1,0,0,0,1.06-1.74ZM18,18H16V15a1,1,0,0,0-1-1H9a1,1,0,0,0-1,1v3H8V11.38l4-2.89,4,2.89V18Z"></path>
                  <path d="M22.5,9.51,13,2.24a1.5,1.5,0,0,0-2,0L1.5,9.51a1.5,1.5,0,0,0,2,2.48L5,11.28V19a2,2,0,0,0,2,2H17a2,2,0,0,0,2-2V11.28l1.5.71a1.5,1.5,0,0,0,2-2.48ZM18,19H14V16a2,2,0,0,0-4,0v3H6V10.66l6-4.33,6,4.33V19Z"></path>
                </svg>
              </div>
              <h1 className="text-[var(--neutral-gray-900)] text-xl font-bold leading-tight tracking-tight">TradieHelper</h1>
            </div>
            <div className="flex flex-1 justify-end gap-6">
              <nav className="flex items-center gap-8">
                <a className="text-sm font-semibold leading-normal text-[var(--primary-blue)]" href="/jobs">Find Work</a>
                <a className="text-[var(--neutral-gray-700)] hover:text-[var(--primary-blue)] text-sm font-medium leading-normal" href="/jobs/my">My Jobs</a>
                <a className="text-[var(--neutral-gray-700)] hover:text-[var(--primary-blue)] text-sm font-medium leading-normal" href="/messages">Messages</a>
              </nav>
              <div className="flex items-center gap-4">
                <button className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--neutral-gray-100)] text-[var(--neutral-gray-700)] hover:bg-[var(--neutral-gray-200)]">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                  </svg>
                  <div className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--accent-orange)] text-xs text-white"></div>
                </button>
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" 
                     style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCkXRgnxBIENzowVcpijWouzHSv0HRyxliNSh3-vaUQJuCMdt9-EVwGxoHa3jLGtIatBqfzmVn3K4Dd39IRoozIGgfqhrEnGmHHfA72kUEUget3AmZXC_GvV_tjRezwHqAzAzAPtemEmdAzlbK7CN_5GSstho9yOzlSiY5RCL1s5DnDq3CmkwiuAYxr4CQOjPU77RlUCU_OAVmtn7buAjPx6SQi63j99aNmQMCAb7HEwZRRq31xuz4BCwlWX4CoJUqLAeOdlMASKpB_")'}}></div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex flex-1 justify-center gap-8 p-8">
            {/* Filters Sidebar */}
            <aside className="flex h-fit w-80 flex-col rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-[var(--neutral-gray-900)] text-lg font-bold leading-tight tracking-tight mb-4">Filters</h2>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--neutral-gray-700)]">Job Type</span>
                  <select 
                    value={filters.jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md text-[var(--neutral-gray-700)] focus:outline-0 focus:ring-2 focus:ring-[var(--primary-blue)] border border-[var(--neutral-gray-200)] bg-white focus:border-[var(--primary-blue)] h-12 bg-[image:--select-button-svg] placeholder:text-[var(--neutral-gray-500)] px-3 text-sm font-normal leading-normal"
                  >
                    <option value="all">All Job Types</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="landscaping">Landscaping</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--neutral-gray-700)]">Location</span>
                  <select 
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md text-[var(--neutral-gray-700)] focus:outline-0 focus:ring-2 focus:ring-[var(--primary-blue)] border border-[var(--neutral-gray-200)] bg-white focus:border-[var(--primary-blue)] h-12 bg-[image:--select-button-svg] placeholder:text-[var(--neutral-gray-500)] px-3 text-sm font-normal leading-normal"
                  >
                    <option value="all">All Locations</option>
                    <option value="sydney">Sydney, NSW</option>
                    <option value="melbourne">Melbourne, VIC</option>
                    <option value="brisbane">Brisbane, QLD</option>
                    <option value="perth">Perth, WA</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--neutral-gray-700)]">Pay Rate (per hour)</span>
                  <select 
                    value={filters.payRate}
                    onChange={(e) => handleFilterChange('payRate', e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md text-[var(--neutral-gray-700)] focus:outline-0 focus:ring-2 focus:ring-[var(--primary-blue)] border border-[var(--neutral-gray-200)] bg-white focus:border-[var(--primary-blue)] h-12 bg-[image:--select-button-svg] placeholder:text-[var(--neutral-gray-500)] px-3 text-sm font-normal leading-normal"
                  >
                    <option value="any">Any Rate</option>
                    <option value="25-35">$25 - $35</option>
                    <option value="35-45">$35 - $45</option>
                    <option value="45+">$45+</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[var(--neutral-gray-700)]">Urgency</span>
                  <select 
                    value={filters.urgency}
                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md text-[var(--neutral-gray-700)] focus:outline-0 focus:ring-2 focus:ring-[var(--primary-blue)] border border-[var(--neutral-gray-200)] bg-white focus:border-[var(--primary-blue)] h-12 bg-[image:--select-button-svg] placeholder:text-[var(--neutral-gray-500)] px-3 text-sm font-normal leading-normal"
                  >
                    <option value="all">All</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-4 bg-[var(--primary-blue)] text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 mt-2">
                  <span className="truncate">Apply Filters</span>
                </button>
              </div>
            </aside>

            {/* Main Job Discovery */}
            <div className="flex flex-1 flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-[var(--neutral-gray-900)] text-3xl font-bold leading-tight">Job Discovery</h1>
                <p className="text-[var(--neutral-gray-500)]">Welcome back, {profile?.full_name || 'Helper'} - find your next job opportunity.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-lg bg-white p-5 shadow-sm border border-[var(--neutral-gray-200)]">
                  <p className="text-[var(--neutral-gray-500)] text-sm font-medium">Total Earnings</p>
                  <p className="text-[var(--secondary-green)] text-3xl font-bold">$2,500<span className="text-lg font-semibold"> AUD</span></p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg bg-white p-5 shadow-sm border border-[var(--neutral-gray-200)]">
                  <p className="text-[var(--neutral-gray-500)] text-sm font-medium">Jobs Completed</p>
                  <p className="text-[var(--neutral-gray-800)] text-3xl font-bold">15</p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg bg-white p-5 shadow-sm border border-[var(--neutral-gray-200)]">
                  <p className="text-[var(--neutral-gray-500)] text-sm font-medium">Average Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-[var(--neutral-gray-800)] text-3xl font-bold">4.8</p>
                    <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Available Jobs */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[var(--neutral-gray-900)] text-xl font-bold leading-tight tracking-tight">Available Jobs (128)</h3>
                <div className="flex flex-col gap-4">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm border border-[var(--neutral-gray-200)]">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-bold text-[var(--neutral-gray-800)]">{job.title}</p>
                          {job.urgent && (
                            <span className="urgent-tag" style={{
                              color: 'var(--accent-orange)',
                              backgroundColor: '#FEF3C7',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>Urgent</span>
                          )}
                        </div>
                        <p className="text-[var(--neutral-gray-500)] text-sm">
                          {job.description} <br/> 
                          <strong>Location:</strong> {job.location} | <strong>Pay:</strong> 
                          <span className="font-semibold text-[var(--secondary-green)]"> {job.payRate}</span>
                        </p>
                      </div>
                      <button className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-[var(--primary-blue)] text-white text-sm font-semibold leading-normal hover:bg-blue-700">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center p-4">
                <nav aria-label="Pagination" className="flex items-center gap-2">
                  <a className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--neutral-gray-500)] hover:bg-[var(--neutral-gray-100)]" href="#">
                    <span className="sr-only">Previous</span>
                    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                  <a className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary-blue)] text-sm font-bold text-white" href="#">1</a>
                  <a className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-[var(--neutral-gray-700)] hover:bg-[var(--neutral-gray-100)]" href="#">2</a>
                  <a className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-[var(--neutral-gray-700)] hover:bg-[var(--neutral-gray-100)]" href="#">3</a>
                  <span className="flex h-9 w-9 items-center justify-center text-sm font-medium text-[var(--neutral-gray-700)]">...</span>
                  <a className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-[var(--neutral-gray-700)] hover:bg-[var(--neutral-gray-100)]" href="#">10</a>
                  <a className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--neutral-gray-500)] hover:bg-[var(--neutral-gray-100)]" href="#">
                    <span className="sr-only">Next</span>
                    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </main>
        </div>
      </div>
      <MobileNavigation />
    </>
  )
}