import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface ProfileFormData {
  full_name: string
  email: string
  phone: string
  location: string
  abn?: string
  primary_trade: string
  additional_skills: string[]
  white_card_file?: File
  photo_id_file?: File
}

interface DocumentUploadStatus {
  white_card?: {
    file: File | null
    uploaded: boolean
    url?: string
  }
  photo_id?: {
    file: File | null
    uploaded: boolean
    url?: string
  }
}

interface MultiStepProfileFormProps {
  onSuccess?: () => void
}

export const MultiStepProfileForm: React.FC<MultiStepProfileFormProps> = ({ onSuccess }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const whiteCardInputRef = useRef<HTMLInputElement>(null)
  const photoIdInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: user?.email || '',
    phone: '',
    location: 'New South Wales',
    abn: '',
    primary_trade: '',
    additional_skills: []
  })

  const [documentStatus, setDocumentStatus] = useState<DocumentUploadStatus>({
    white_card: { file: null, uploaded: false },
    photo_id: { file: null, uploaded: false }
  })

  const primaryTrades = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 
    'Landscaping', 'Bricklaying', 'Tiling'
  ]

  const additionalSkillsOptions = [
    'Demolition', 'First Aid Certified', 'Forklift Licence', 'Welding'
  ]

  const stateOptions = [
    'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
    'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'
  ]

  const totalSteps = 4

  const handleAdditionalSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      additional_skills: prev.additional_skills.includes(skill) 
        ? prev.additional_skills.filter(s => s !== skill)
        : [...prev.additional_skills, skill]
    }))
  }

  const handleFileUpload = (type: 'white_card' | 'photo_id', file: File) => {
    setDocumentStatus(prev => ({
      ...prev,
      [type]: {
        file,
        uploaded: false,
        url: URL.createObjectURL(file)
      }
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
      // Upload documents first if they exist
      let whiteCardUrl = ''
      let photoIdUrl = ''

      if (documentStatus.white_card?.file) {
        const whiteCardFile = documentStatus.white_card.file
        const { data: whiteCardData, error: whiteCardError } = await supabase.storage
          .from('documents')
          .upload(`white-cards/${user.id}/${whiteCardFile.name}`, whiteCardFile)
        
        if (whiteCardError) throw whiteCardError
        whiteCardUrl = whiteCardData.path
      }

      if (documentStatus.photo_id?.file) {
        const photoIdFile = documentStatus.photo_id.file
        const { data: photoIdData, error: photoIdError } = await supabase.storage
          .from('documents')
          .upload(`photo-ids/${user.id}/${photoIdFile.name}`, photoIdFile)
        
        if (photoIdError) throw photoIdError
        photoIdUrl = photoIdData.path
      }

      const profileData = {
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        abn: formData.abn,
        primary_trade: formData.primary_trade,
        additional_skills: formData.additional_skills,
        white_card_url: whiteCardUrl,
        photo_id_url: photoIdUrl,
        role: 'tradie',
        verified: false,
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) {
        setError(profileError.message)
      } else {
        onSuccess?.()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile'
      setError(errorMessage)
    }
    
    setLoading(false)
  }

  // TODO: getStepTitle function currently unused
  // const getStepTitle = (step: number) => { ... }

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden" style={{ backgroundColor: 'var(--neutral-bg, #F8FAFC)' }}>
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid px-10 py-4 bg-white" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>
          <div className="flex items-center gap-3 text-slate-800">
            <svg className="h-8 w-8" style={{ color: 'var(--primary-color, #2563EB)' }} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L1 9l4 1.5V17h2v-7h2v7h2v-7h2v7h2v-5.5L23 9z"></path>
              <path d="M12 4.44L19.36 9h-2.72l-5.64-3.38L8.36 9H5.64z"></path>
            </svg>
            <h1 className="text-slate-800 text-xl font-bold">TradieHelper</h1>
          </div>
          <div className="flex flex-1 justify-end items-center gap-6">
            <nav className="flex items-center gap-6">
              <a className="text-slate-600 hover:text-[var(--primary-color)] text-sm font-medium transition-colors" href="#">Find Work</a>
              <a className="text-slate-600 hover:text-[var(--primary-color)] text-sm font-medium transition-colors" href="#">Post a Job</a>
              <a className="text-slate-600 hover:text-[var(--primary-color)] text-sm font-medium transition-colors" href="#">About Us</a>
            </nav>
            <div className="h-6 w-px" style={{ backgroundColor: 'var(--neutral-border, #E2E8F0)' }}></div>
            <div className="flex gap-3">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-white text-slate-700 border hover:bg-slate-50 text-sm font-bold transition-colors" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>
                <span className="truncate">Log In</span>
              </button>
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 text-white hover:bg-blue-700 text-sm font-bold transition-colors" style={{ backgroundColor: 'var(--primary-color, #2563EB)' }}>
                <span className="truncate">Sign Up</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 justify-center py-10 lg:py-16">
          <div className="w-full max-w-4xl px-4">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-slate-800 text-lg font-semibold">Profile Completion</h2>
                  <p className="text-sm font-medium" style={{ color: 'var(--neutral-text, #475569)' }}>Step {currentStep} of {totalSteps}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-300" 
                    style={{ 
                      backgroundColor: 'var(--primary-color, #2563EB)',
                      width: `${(currentStep / totalSteps) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-10">
                {currentStep === 1 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <label className="flex flex-col gap-2">
                        <p className="text-slate-700 text-sm font-medium">Full Name</p>
                        <input 
                          className="form-input w-full rounded-md border-[var(--neutral-border)] focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] transition" 
                          placeholder="e.g. John Smith" 
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <p className="text-slate-700 text-sm font-medium">Email Address</p>
                        <input 
                          className="form-input w-full rounded-md border-[var(--neutral-border)] focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] transition" 
                          placeholder="you@example.com" 
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <p className="text-slate-700 text-sm font-medium">Phone Number</p>
                        <input 
                          className="form-input w-full rounded-md border-[var(--neutral-border)] focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] transition" 
                          placeholder="e.g. 0412 345 678" 
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <p className="text-slate-700 text-sm font-medium">Location (State)</p>
                        <select 
                          className="form-select w-full rounded-md border-[var(--neutral-border)] focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] transition text-slate-700"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        >
                          {stateOptions.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-2">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-700 text-sm font-medium">ABN (Australian Business Number)</p>
                          <span className="text-slate-400 cursor-help text-base" title="An ABN is required for all business in Australia.">ℹ️</span>
                        </div>
                        <input 
                          className="form-input w-full md:w-1/2 rounded-md border-[var(--neutral-border)] focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] transition" 
                          placeholder="e.g. 53 004 085 616" 
                          type="text"
                          value={formData.abn}
                          onChange={(e) => setFormData(prev => ({ ...prev, abn: e.target.value }))}
                        />
                      </label>
                    </div>
                  </section>
                )}

                {currentStep === 2 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>Upload Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>
                        <span className="text-5xl" style={{ color: 'var(--accent-color, #EA580C)' }}>🎫</span>
                        <h4 className="text-slate-800 text-base font-semibold">Upload White Card</h4>
                        <p className="text-sm max-w-xs" style={{ color: 'var(--neutral-text, #475569)' }}>A construction induction card is required for site work.</p>
                        <input
                          ref={whiteCardInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('white_card', e.target.files[0])}
                        />
                        <button 
                          onClick={() => whiteCardInputRef.current?.click()}
                          className="flex items-center gap-2 min-w-[120px] justify-center rounded-md h-10 px-4 text-sm font-bold transition-colors"
                          style={{ 
                            backgroundColor: 'var(--accent-color, #EA580C)10',
                            color: 'var(--accent-color, #EA580C)'
                          }}
                        >
                          <span>📎</span>
                          <span className="truncate">Browse Files</span>
                        </button>
                        {documentStatus.white_card?.file && (
                          <p className="text-sm text-green-600">✓ {documentStatus.white_card.file.name}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>
                        <span className="text-5xl" style={{ color: 'var(--secondary-color, #16A34A)' }}>🆔</span>
                        <h4 className="text-slate-800 text-base font-semibold">Upload Photo ID</h4>
                        <p className="text-sm max-w-xs" style={{ color: 'var(--neutral-text, #475569)' }}>e.g., Driver's Licence or Passport for verification.</p>
                        <input
                          ref={photoIdInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('photo_id', e.target.files[0])}
                        />
                        <button 
                          onClick={() => photoIdInputRef.current?.click()}
                          className="flex items-center gap-2 min-w-[120px] justify-center rounded-md h-10 px-4 text-sm font-bold transition-colors"
                          style={{ 
                            backgroundColor: 'var(--secondary-color, #16A34A)10',
                            color: 'var(--secondary-color, #16A34A)'
                          }}
                        >
                          <span>📎</span>
                          <span className="truncate">Browse Files</span>
                        </button>
                        {documentStatus.photo_id?.file && (
                          <p className="text-sm text-green-600">✓ {documentStatus.photo_id.file.name}</p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {currentStep === 3 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>Skills & Trade</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <label className="flex flex-col gap-2">
                        <p className="text-slate-700 text-sm font-medium">Primary Trade</p>
                        <select 
                          className="form-select w-full rounded-md border-[var(--neutral-border)] focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:border-[var(--primary-color)] transition text-slate-700"
                          value={formData.primary_trade}
                          onChange={(e) => setFormData(prev => ({ ...prev, primary_trade: e.target.value }))}
                        >
                          <option value="" disabled>Select your trade...</option>
                          {primaryTrades.map(trade => (
                            <option key={trade} value={trade}>{trade}</option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-col gap-2">
                        <p className="text-slate-700 text-sm font-medium">Additional Skills (Optional)</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {additionalSkillsOptions.map(skill => {
                            const isSelected = formData.additional_skills.includes(skill)
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleAdditionalSkillToggle(skill)}
                                className={`flex h-8 shrink-0 items-center justify-center gap-x-1.5 rounded-full px-3 transition-colors ${
                                  isSelected 
                                    ? 'text-[var(--primary-color)] px-3'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                                style={isSelected ? { backgroundColor: 'var(--primary-color, #2563EB)10' } : {}}
                              >
                                <p className="text-sm font-medium">{skill}</p>
                                {isSelected && <span>✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {currentStep === 4 && (
                  <section>
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>Profile Preview</h3>
                    <div className="space-y-6">
                      <div className="bg-slate-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">Your Profile Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Name</p>
                            <p className="text-slate-800">{formData.full_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Email</p>
                            <p className="text-slate-800">{formData.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Phone</p>
                            <p className="text-slate-800">{formData.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Location</p>
                            <p className="text-slate-800">{formData.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Primary Trade</p>
                            <p className="text-slate-800">{formData.primary_trade || 'Not selected'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Additional Skills</p>
                            <p className="text-slate-800">{formData.additional_skills.length > 0 ? formData.additional_skills.join(', ') : 'None selected'}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-600">White Card</p>
                            <p className="text-slate-800">{documentStatus.white_card?.file ? '✓ Uploaded' : '❌ Not uploaded'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Photo ID</p>
                            <p className="text-slate-800">{documentStatus.photo_id?.file ? '✓ Uploaded' : '❌ Not uploaded'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          ✨ <strong>Ready to submit!</strong> Your profile will be reviewed within 24-48 hours. 
                          You'll receive a notification once it's approved and you can start applying for jobs.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

              <div className="flex justify-end pt-6 border-t" style={{ borderColor: 'var(--neutral-border, #E2E8F0)' }}>
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="mr-4 flex min-w-[120px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-6 bg-slate-100 text-slate-700 hover:bg-slate-200 text-base font-bold transition-colors"
                    >
                      <span>←</span>
                      <span className="truncate ml-2">Back</span>
                    </button>
                  )}
                  {currentStep < totalSteps ? (
                    <button 
                      onClick={handleNext}
                      className="flex min-w-[120px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-6 text-white hover:bg-blue-700 text-base font-bold transition-colors"
                      style={{ backgroundColor: 'var(--primary-color, #2563EB)' }}
                    >
                      <span className="truncate">Next Step</span>
                      <span className="ml-2">→</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex min-w-[120px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-6 text-white hover:bg-green-700 text-base font-bold transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'var(--secondary-color, #16A34A)' }}
                    >
                      <span className="truncate">{loading ? 'Creating Profile...' : 'Complete Profile'}</span>
                      <span className="ml-2">✓</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}