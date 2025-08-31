import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface JobFormData {
  title: string
  description: string
  location: string
  jobDate: string
  startTime: string
  duration: string
  skills: string[]
  payType: 'hourly' | 'fixed'
  hourlyRate: number
  fixedPrice: number
}

interface MultiStepJobPostFormProps {
  onSuccess?: (jobId: string) => void
}

export const MultiStepJobPostForm: React.FC<MultiStepJobPostFormProps> = ({ onSuccess }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    location: '',
    jobDate: '',
    startTime: '09:00',
    duration: 'full-day',
    skills: [],
    payType: 'hourly',
    hourlyRate: 35,
    fixedPrice: 280
  })

  const availableSkills = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 
    'Landscaping', 'Cleaning', 'Handyman', 'General Labour'
  ]

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: jobError } = await supabase
        .from('jobs')
        .insert({
          tradie_id: user.id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date_time: `${formData.jobDate}T${formData.startTime}`,
          duration_hours: formData.duration === 'full-day' ? 8 : 4,
          pay_rate: formData.payType === 'hourly' ? formData.hourlyRate : formData.fixedPrice / 8,
          skills_required: formData.skills,
          pay_type: formData.payType
        })
        .select()
        .single()

      if (jobError) {
        setError(jobError.message)
      } else {
        onSuccess?.(data.id)
      }
    } catch {
      setError('Failed to create job')
    }
    
    setLoading(false)
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Job Details'
      case 2: return 'Location'
      case 3: return 'Skills & Date'
      case 4: return 'Payment'
      default: return 'Job Details'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between whitespace-nowrap px-6 py-4">
          <div className="flex items-center gap-3 text-blue-600">
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 0L0 12V36L24 48L48 36V12L24 0ZM24 4.5L42 14.25V33.75L24 43.5L6 33.75V14.25L24 4.5ZM21 21H27V33H21V21ZM21 15H27V18H21V15Z" fillRule="evenodd"></path>
            </svg>
            <h2 className="text-2xl font-bold tracking-tighter">TradieHelper</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors" href="#">Find Work</a>
            <a className="text-base font-medium text-blue-600 border-b-2 border-blue-600" href="#">Post a Job</a>
            <a className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors" href="#">About Us</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-gray-900">Post a Job</h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">Follow the steps below to find the perfect helper for your job. It's quick and easy!</p>
          </header>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center text-blue-600">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-lg ${
                        currentStep >= step 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      <span className="ml-3 font-semibold hidden sm:inline">{getStepTitle(step)}</span>
                    </div>
                    {index < 3 && <div className="w-16 sm:w-24 h-1 bg-gray-300 mx-2"></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="space-y-8">
            {currentStep === 1 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold tracking-tight text-gray-800 mb-6">Step 1: Job Details</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-base font-medium leading-normal text-gray-700 pb-2" htmlFor="job-title">Job Title</label>
                    <input 
                      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base font-normal leading-normal text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                      id="job-title" 
                      placeholder="e.g., Experienced Carpenter for deck construction" 
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium leading-normal text-gray-700 pb-2" htmlFor="job-description">Job Description</label>
                    <textarea 
                      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base font-normal leading-normal text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50 min-h-40"
                      id="job-description" 
                      placeholder="Describe the job in detail. Include tasks, required experience, and any specific materials or tools needed."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold tracking-tight text-gray-800 mb-6">Step 2: Location</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium leading-normal text-gray-700 pb-2" htmlFor="job-address">Job Address</label>
                    <input 
                      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base font-normal leading-normal text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                      id="job-address" 
                      placeholder="Enter the full job address" 
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <p className="text-sm text-gray-500 mt-2">Start typing and select an address from the suggestions.</p>
                  </div>
                  <div className="aspect-h-9 aspect-w-16 rounded-lg overflow-hidden border border-gray-200">
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Interactive Map Preview</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold tracking-tight text-gray-800 mb-6">Step 3: Skills & Schedule</h3>
                <div className="space-y-8">
                  <div>
                    <label className="block text-base font-medium leading-normal text-gray-700 pb-2">Required Skills</label>
                    <div className="flex flex-wrap gap-3">
                      {availableSkills.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`flex items-center gap-x-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                            formData.skills.includes(skill)
                              ? 'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-600'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  <hr className="border-gray-200"/>
                  <div>
                    <label className="block text-base font-medium leading-normal text-gray-700 pb-2">Date & Time</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium leading-normal text-gray-700 pb-2" htmlFor="job-date">Job Date</label>
                        <input 
                          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base font-normal leading-normal text-gray-800 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                          id="job-date" 
                          type="date" 
                          value={formData.jobDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, jobDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium leading-normal text-gray-700 pb-2" htmlFor="start-time">Start Time</label>
                        <input 
                          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base font-normal leading-normal text-gray-800 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                          id="start-time" 
                          type="time" 
                          value={formData.startTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium leading-normal text-gray-700 pb-2" htmlFor="duration">Estimated Duration</label>
                        <select 
                          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base font-normal leading-normal text-gray-800 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        >
                          <option value="half-day">Half Day (up to 4 hours)</option>
                          <option value="full-day">Full Day (approx. 8 hours)</option>
                          <option value="multiple-days">Multiple Days</option>
                          <option value="ongoing">Ongoing</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold tracking-tight text-gray-800 mb-6">Step 4: Payment Details</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-base font-medium leading-normal text-gray-700 pb-2">Pay Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payType: 'hourly' }))}
                        className={`text-center p-4 rounded-lg border-2 font-bold transition-all ${
                          formData.payType === 'hourly'
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-lg">Hourly Rate</span>
                        <span className="text-sm font-normal">Pay per hour</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payType: 'fixed' }))}
                        className={`text-center p-4 rounded-lg border-2 font-bold transition-all ${
                          formData.payType === 'fixed'
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-lg">Fixed Price</span>
                        <span className="text-sm font-normal">One-off payment</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    {formData.payType === 'hourly' ? (
                      <>
                        <label className="block text-base font-medium leading-normal text-gray-700 pb-2" htmlFor="hourly-rate">Hourly Rate (AUD)</label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500 text-lg">$</span>
                          </div>
                          <input 
                            className="w-full rounded-lg border border-gray-200 bg-white p-3 pl-10 text-lg font-normal leading-normal text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                            id="hourly-rate" 
                            placeholder="35.00" 
                            step="0.5" 
                            type="number"
                            value={formData.hourlyRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Enter the rate per hour. Platform fees may apply.</p>
                      </>
                    ) : (
                      <>
                        <label className="block text-base font-medium leading-normal text-gray-700 pb-2" htmlFor="fixed-price">Fixed Price (AUD)</label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500 text-lg">$</span>
                          </div>
                          <input 
                            className="w-full rounded-lg border border-gray-200 bg-white p-3 pl-10 text-lg font-normal leading-normal text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                            id="fixed-price" 
                            placeholder="280.00" 
                            step="5" 
                            type="number"
                            value={formData.fixedPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, fixedPrice: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Enter the total job price. Platform fees may apply.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4">
              <button 
                onClick={handleBack}
                disabled={currentStep === 1}
                className="w-full sm:w-auto flex items-center justify-center rounded-lg h-12 px-8 bg-gray-200 text-gray-700 text-base font-bold tracking-wide hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {currentStep < 4 ? (
                <button 
                  onClick={handleNext}
                  className="w-full sm:w-auto flex items-center justify-center rounded-lg h-12 px-8 bg-blue-600 text-white text-base font-bold tracking-wide hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Continue to Next Step
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center rounded-lg h-12 px-8 bg-blue-600 text-white text-base font-bold tracking-wide hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? 'Posting Job...' : 'Post Job'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}