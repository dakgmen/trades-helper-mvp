import { useState, useEffect } from 'react'
// TODO: import { useAuth } from '../../context/AuthContext' // Currently unused
import { useToast } from '../ui/Toast'

interface LocalJob {
  id: string
  title: string
  description: string
  budget: number
  location: string
  category: string
  urgency: 'low' | 'medium' | 'high'
  status: string
  created_at: string
  client_id: string
  client?: {
    full_name: string
    email: string
    profile_picture?: string
  }
  skills_required: string[]
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  hourly_rate?: number
  rating?: number
  reviews_count?: number
  featured?: boolean
}

interface SearchFilters {
  keyword: string
  category: string
  location: string
  minRate: number
  maxRate: number
  jobTypes: string[]
  hourlyRate: number
}

export function AdvancedJobSearch() {
  // TODO: const { user } = useAuth() // Currently unused - using mock data
  // TODO: const [jobs, setJobs] = useState<LocalJob[]>([]) // Currently unused - mock data doesn't use this
  const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
  const [loading, setLoading] = useState(true)
  const { showSuccess } = useToast()

  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    category: '',
    location: '',
    minRate: 30,
    maxRate: 100,
    jobTypes: [],
    hourlyRate: 50
  })

  const categories = [
    'Electrical', 'Plumbing', 'Carpentry', 'Painting'
  ]

  const jobTypes = [
    'Full-time', 'Part-time', 'Contract/Temp'
  ]


  useEffect(() => {
    // Mock data for demo
    const mockJobs = [
      {
        id: '1',
        title: 'Alex Johnson - Master Electrician',
        description: 'Experienced electrician available for residential and commercial work',
        budget: 55,
        location: 'Sydney, NSW',
        category: 'Electrical',
        urgency: 'medium' as const,
        status: 'open',
        created_at: new Date().toISOString(),
        client_id: '1',
        client: {
          full_name: 'Alex Johnson',
          email: 'alex@example.com',
          profile_picture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADKkg_JeYcrmeHyp0HV0_tQGMrh0OM26TT6h4p-n32sHimdrr2JxweJVPDqj6SFT-k1ixaY_lEffgQgaiTelbsSRMa82-y0kHpL9Ae9sWNtHvyJVoQm2PnF_VMJOWrqHWEK4uDk-dadp04vyBZjBRyMQu1egqjNFAQPylL4vw84rcFt5O8RPMmMShXfsldARWPZGC5Abielc5CSlbMWXRD4ZjczculEAV14JL4YH_fqQiWZO79ZTZGWHM9zcASqgb0r7AtI9FOSUZy'
        },
        skills_required: ['Electrical', 'Safety'],
        experience_level: 'advanced' as const,
        hourly_rate: 55,
        rating: 4.9,
        reviews_count: 152,
        featured: true
      },
      {
        id: '2',
        title: 'Chris Williams - Licensed Electrician',
        description: 'Licensed electrician with 5 years experience',
        budget: 45,
        location: 'Parramatta, NSW',
        category: 'Electrical',
        urgency: 'medium' as const,
        status: 'open',
        created_at: new Date().toISOString(),
        client_id: '2',
        client: {
          full_name: 'Chris Williams',
          email: 'chris@example.com',
          profile_picture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVIkVPQQFq7-lqSOv_3fAG5BUxKw2gTuun4bv12XsPsgyLuOUuI3s3v2Fe0lqktMnMnNBgjFBMD87xWsKXik81MsXkIFOg8TVmuYwXs1tVWi5QbDDq_RwHuKIBzkf00eHd8dkKJTCN1E_Zn92Mr11tIdaS86FgiaVvpl5Mv7ckTl7gPUXy_cIgbntsFjWvrdXFS90o1YqOEdB-w20GNaffCgSIjW9LPYy-SBnv0E5s0_ylovm1lQZl_316Jp_WjM_VLjaDGBTvu71Z'
        },
        skills_required: ['Electrical'],
        experience_level: 'intermediate' as const,
        hourly_rate: 45,
        rating: 4.7,
        reviews_count: 88
      },
      {
        id: '3',
        title: 'Sarah Chen - Commercial Electrician',
        description: 'Commercial electrician specializing in office buildings',
        budget: 50,
        location: 'Bondi, NSW',
        category: 'Electrical',
        urgency: 'medium' as const,
        status: 'open',
        created_at: new Date().toISOString(),
        client_id: '3',
        client: {
          full_name: 'Sarah Chen',
          email: 'sarah@example.com',
          profile_picture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2db5a4TSj5HZb1jFuGDGeT7c402nuW-tiwZwsWcZO_lXO_4xBQG1-mUDIxSkZf_8eqqjfiKrJ1SaJptZuwNK9dnPSZ3EmF3cFXXDF70KagleErGW4fD1pM4ekSTrQqUWIK4cZNK6kImMEsc3XwlgsQCTHuZMx2rcRGZPQOegRWJjNUcjkEhIupJKpC1UVZmvv1sYN8b1XrLoCf8qQ9bjnWJTHbH8x8Hzo9F0WrW-hZjmn58IKehg8_J-vANXfT3U3sQUHzo7XVyGk'
        },
        skills_required: ['Electrical', 'Commercial'],
        experience_level: 'advanced' as const,
        hourly_rate: 50,
        rating: 4.8,
        reviews_count: 112
      }
    ]
    
    // TODO: setJobs(mockJobs) // Currently unused
    setFilteredJobs(mockJobs)
    setLoading(false)
  }, [])

  const handleFilterChange = (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      keyword: '',
      category: '',
      location: '',
      minRate: 30,
      maxRate: 100,
      jobTypes: [],
      hourlyRate: 50
    })
  }

  const handleJobTypeToggle = (jobType: string) => {
    const updatedTypes = filters.jobTypes.includes(jobType)
      ? filters.jobTypes.filter(t => t !== jobType)
      : [...filters.jobTypes, jobType]
    handleFilterChange('jobTypes', updatedTypes)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-gray-50" style={{ fontFamily: "'Work Sans', 'Noto Sans', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--neutral-border)] bg-white px-10 py-3 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-slate-800">
            <svg className="h-8 w-8 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_535)">
                <path clipRule="evenodd" d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4ZM20 32L32 20L20 32Z" fill="currentColor" fillRule="evenodd"></path>
                <path d="M20 16L28 24L20 16Z" fill="currentColor" fillOpacity="0.5"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535">
                  <rect fill="white" height="48" width="48"></rect>
                </clipPath>
              </defs>
            </svg>
            <h1 className="text-2xl font-bold tracking-tighter text-slate-900">TradieHelper</h1>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="text-sm font-medium text-slate-600 hover:text-[var(--primary-color)]" href="#">Find Jobs</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[var(--primary-color)]" href="#">Find Helpers</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[var(--primary-color)]" href="#">Post a Job</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[var(--primary-color)]" href="#">Resources</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-slate-600 hover:text-[var(--primary-color)]">Log In</button>
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-[var(--primary-color)] text-sm font-bold leading-normal tracking-wide shadow-sm transition-all hover:shadow-md text-white">
            <span>Sign Up</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-[var(--neutral-border)] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Filters</h2>
            <button 
              onClick={clearFilters}
              className="text-sm font-medium text-[var(--primary-color)] hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="keyword">Keywords</label>
              <input 
                className="form-input mt-1 block w-full rounded-md border-[var(--neutral-border)] shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                id="keyword" 
                placeholder="e.g., Electrician, Plumber" 
                type="text"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="location">Location</label>
              <input 
                className="form-input mt-1 block w-full rounded-md border-[var(--neutral-border)] shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                id="location" 
                placeholder="e.g., Sydney, NSW" 
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="trade-category">Trade Category</label>
              <select 
                className="form-select mt-1 block w-full rounded-md border-[var(--neutral-border)] shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                id="trade-category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option>All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700">Job Type</h3>
              {jobTypes.map(jobType => (
                <div key={jobType} className="flex items-center">
                  <input 
                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" 
                    id={jobType.toLowerCase().replace('/', '-')} 
                    name="job-type" 
                    type="checkbox"
                    checked={filters.jobTypes.includes(jobType)}
                    onChange={() => handleJobTypeToggle(jobType)}
                  />
                  <label className="ml-2 block text-sm text-slate-600" htmlFor={jobType.toLowerCase().replace('/', '-')}>{jobType}</label>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="hourly-rate">Hourly Rate (AUD)</label>
              <div className="mt-2 flex items-center space-x-2">
                <input 
                  className="form-input w-full rounded-md border-[var(--neutral-border)] text-sm" 
                  placeholder="$30" 
                  type="text" 
                  value={`$${filters.minRate}`}
                  readOnly
                />
                <span>-</span>
                <input 
                  className="form-input w-full rounded-md border-[var(--neutral-border)] text-sm" 
                  placeholder="$100+" 
                  type="text"
                  value={`$${filters.maxRate}+`}
                  readOnly
                />
              </div>
              <input 
                className="mt-2 h-2 w-full appearance-none rounded-lg bg-gray-200 accent-[var(--primary-color)]" 
                max="150" 
                min="30" 
                type="range" 
                value={filters.hourlyRate}
                onChange={(e) => handleFilterChange('hourlyRate', parseInt(e.target.value))}
              />
            </div>
            <button className="w-full rounded-md bg-[var(--primary-color)] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Search Results Section */}
        <section className="flex-1 p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Search Results</h2>
                <p className="text-sm text-slate-500">Showing 1-10 of 42 results for 'Electrician' in Sydney, NSW</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-md border border-[var(--neutral-border)] bg-white">
                  <button className="p-2 text-slate-500 hover:bg-gray-100 rounded-l-md">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" fillRule="evenodd"></path>
                    </svg>
                  </button>
                  <button className="border-l border-gray-200 p-2 text-slate-500 hover:bg-gray-100">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path clipRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fillRule="evenodd"></path>
                    </svg>
                  </button>
                  <button className="border-l border-gray-200 p-2 text-slate-500 hover:bg-gray-100 rounded-r-md">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </button>
                </div>
                <button className="flex items-center gap-2 rounded-md bg-[var(--secondary-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                  </svg>
                  Create Job Alert
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div 
                  key={job.id} 
                  className={`rounded-lg ${job.featured ? 'border-2 border-[var(--accent-color)]' : 'border border-[var(--neutral-border)]'} bg-white shadow-lg transition-shadow hover:shadow-xl`}
                >
                  <div className="flex items-start gap-4 p-4">
                    <img 
                      alt="Tradie profile picture" 
                      className="h-24 w-24 rounded-md object-cover" 
                      src={job.client?.profile_picture || `https://via.placeholder.com/96x96?text=${job.client?.full_name?.charAt(0) || 'T'}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        {job.featured && (
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)]">Featured</p>
                        )}
                        <span className="text-xl font-bold text-slate-800">${job.hourly_rate || job.budget}/hr</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                      <p className="text-sm text-slate-500">{job.location} | {job.experience_level === 'advanced' ? '10+' : job.experience_level === 'intermediate' ? '5' : '2'} years experience</p>
                      <div className="mt-2 flex items-center gap-1 text-sm text-yellow-500">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        <span>{job.rating || 4.8} ({job.reviews_count || 100} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <button 
                      className="w-full rounded-md bg-[var(--primary-color)] py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                      onClick={() => showSuccess('Profile contact feature coming soon!')}
                    >
                      View Profile &amp; Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center">
              <nav aria-label="Pagination" className="inline-flex -space-x-px rounded-md shadow-sm">
                <a className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50" href="#">
                  <span className="sr-only">Previous</span>
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                </a>
                <a aria-current="page" className="relative z-10 inline-flex items-center border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600" href="#">1</a>
                <a className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50" href="#">2</a>
                <a className="relative hidden items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 md:inline-flex" href="#">3</a>
                <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">...</span>
                <a className="relative hidden items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 md:inline-flex" href="#">5</a>
                <a className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50" href="#">
                  <span className="sr-only">Next</span>
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        :root {
          --primary-color: #2563EB;
          --secondary-color: #16A34A;
          --accent-color: #EA580C;
          --neutral-background: #F8FAFC;
          --neutral-text: #475569;
          --neutral-border: #E2E8F0;
        }
      `}</style>
    </div>
  )
}