import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface ProfileFormData {
  full_name: string
  phone: string
  location: string
  bio: string
  skills: string[]
  experience_years: number
  hourly_rate: number
  availability: string[]
  profile_image_url?: string
  license_number?: string
  abn?: string
  insurance_details?: string
}

interface MultiStepProfileFormProps {
  role: 'tradie' | 'helper'
  onSuccess?: () => void
}

export const MultiStepProfileForm: React.FC<MultiStepProfileFormProps> = ({ role, onSuccess }) => {
  const { user, updateProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    experience_years: 0,
    hourly_rate: 35,
    availability: [],
    profile_image_url: '',
    license_number: '',
    abn: '',
    insurance_details: ''
  })

  const availableSkills = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 
    'Landscaping', 'Cleaning', 'Handyman', 'General Labour',
    'Roofing', 'Tiling', 'Demolition', 'Concreting'
  ]

  const availabilityOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ]

  const totalSteps = role === 'tradie' ? 4 : 3

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleAvailabilityToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day) 
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
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
      const profileData = {
        user_id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        skills: formData.skills,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate,
        availability: formData.availability,
        role: role,
        verified: false,
        updated_at: new Date().toISOString()
      }

      if (role === 'tradie') {
        Object.assign(profileData, {
          license_number: formData.license_number,
          abn: formData.abn,
          insurance_details: formData.insurance_details
        })
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) {
        setError(profileError.message)
      } else {
        updateProfile?.(profileData)
        onSuccess?.()
      }
    } catch {
      setError('Failed to create profile')
    }
    
    setLoading(false)
  }

  const getStepTitle = (step: number) => {
    if (role === 'tradie') {
      switch (step) {
        case 1: return 'Personal Info'
        case 2: return 'Skills & Experience'
        case 3: return 'Business Details'
        case 4: return 'Availability & Rates'
        default: return 'Personal Info'
      }
    } else {
      switch (step) {
        case 1: return 'Personal Info'
        case 2: return 'Skills & Experience'
        case 3: return 'Availability & Rates'
        default: return 'Personal Info'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between whitespace-nowrap px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.43L19.57 8.5L12 12.57L4.43 8.5L12 4.43ZM4 9.87L11 13.92V19.97L4 15.9V9.87Z"></path>
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">TradieHelper</h1>
          </div>
          <div className="text-sm font-medium text-gray-600">
            Setting up your {role} profile
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Complete Your Profile</h2>
            <p className="mt-2 text-gray-600">Help others get to know you better</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-center">
              <div className="flex items-center">
                {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm ${
                        currentStep >= step 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      <span className="ml-2 text-sm font-medium hidden sm:inline">{getStepTitle(step)}</span>
                    </div>
                    {index < totalSteps - 1 && <div className="w-12 h-1 bg-gray-300 mx-3"></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="04XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sydney, NSW"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About You</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell others about your experience, work style, and what makes you great to work with..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Skills & Experience</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                          formData.skills.includes(skill)
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <select
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Less than 1 year</option>
                    <option value={1}>1 year</option>
                    <option value={2}>2 years</option>
                    <option value={3}>3 years</option>
                    <option value={5}>5+ years</option>
                    <option value={10}>10+ years</option>
                    <option value={15}>15+ years</option>
                  </select>
                </div>
              </div>
            )}

            {role === 'tradie' && currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Business Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ABN (Optional)</label>
                  <input
                    type="text"
                    value={formData.abn}
                    onChange={(e) => setFormData(prev => ({ ...prev, abn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12 345 678 901"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your professional license number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Details (Optional)</label>
                  <textarea
                    value={formData.insurance_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, insurance_details: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Public liability insurance details, policy number, etc."
                  />
                </div>
              </div>
            )}

            {currentStep === totalSteps && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Availability & Rates</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availabilityOptions.map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.availability.includes(day)}
                          onChange={() => handleAvailabilityToggle(day)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (AUD)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="35.00"
                      min="20"
                      max="150"
                      step="0.50"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This will be your default rate. You can adjust it for specific jobs.</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t">
              <button 
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {currentStep < totalSteps ? (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}