import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { stripeService } from '../../services/stripeService'

interface OnboardingData {
  businessName: string
  abn: string
  businessAddress: string
  bankAccountNumber: string
  bsb: string
  accountHolderName: string
  documentType: 'drivers_license' | 'passport' | 'national_id'
  frontImageUrl: string
  backImageUrl?: string
}

export const StripeConnectOnboarding: React.FC = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<OnboardingData>({
    businessName: '',
    abn: '',
    businessAddress: '',
    bankAccountNumber: '',
    bsb: '',
    accountHolderName: '',
    documentType: 'drivers_license',
    frontImageUrl: '',
    backImageUrl: ''
  })

  const totalSteps = 4

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
      // Step 1: Create Express account
      const { accountLink, error: accountError } = await stripeService.createExpressAccount(
        user.id,
        {
          email: user.email || '',
          country: 'AU',
          business_type: 'individual'
        }
      )

      if (accountError) {
        setError(accountError)
        return
      }

      // Step 2: Validate bank account
      if (formData.bankAccountNumber && formData.bsb) {
        const { valid, error: bankError } = await stripeService.validateAustralianBankAccount(
          formData.bankAccountNumber,
          formData.bsb,
          formData.accountHolderName
        )

        if (bankError) {
          setError(bankError)
          return
        }

        if (!valid) {
          setError('Invalid bank account details')
          return
        }
      }

      // Step 3: Verify identity documents if provided
      if (formData.frontImageUrl) {
        const { verified, error: verificationError } = await stripeService.verifyIdentityDocument(
          user.id,
          formData.documentType,
          formData.frontImageUrl,
          formData.backImageUrl
        )

        if (verificationError) {
          setError(verificationError)
          return
        }

        if (!verified) {
          setError('Identity verification failed. Please check your documents.')
          return
        }
      }

      // Redirect to Stripe onboarding if account link is available
      if (accountLink) {
        window.location.href = accountLink
      } else {
        setError('Failed to create onboarding link')
      }
    } catch {
      setError('Onboarding failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Business Verification'
      case 2: return 'Bank Account Setup'
      case 3: return 'Identity Verification'
      case 4: return 'Review & Complete'
      default: return 'Business Verification'
    }
  }

  const calculateProgress = () => {
    return (currentStep / totalSteps) * 100
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto flex items-center justify-between whitespace-nowrap px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.293 8.293L12 12.586L7.707 8.293L6.293 9.707L12 15.414L17.707 9.707L16.293 8.293Z" transform="rotate(90 12 12)"></path>
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
            </svg>
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">TradieHelper</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6m14-6a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="text-sm font-medium text-gray-600">AEST</span>
            </div>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white shadow-md bg-gray-300"></div>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 justify-center py-10 lg:py-16">
        <div className="w-full max-w-xl px-4">
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-blue-600">Step {currentStep} of {totalSteps}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div 
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">{getStepTitle(currentStep)}</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <>
                <h2 className="mb-1 text-3xl font-bold tracking-tight text-gray-800">Verify your business details</h2>
                <p className="mb-6 text-base text-gray-500">
                  To comply with financial regulations and ensure security, we need to verify your business information with Stripe, our payments partner.
                </p>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-800" htmlFor="business-name">Business Name</label>
                    <div className="mt-2">
                      <input 
                        className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        id="business-name" 
                        name="business-name" 
                        placeholder="Enter your registered business name" 
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-800" htmlFor="abn">ABN (Australian Business Number)</label>
                    <div className="mt-2">
                      <input 
                        className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        id="abn" 
                        name="abn" 
                        placeholder="e.g. 12 345 678 901" 
                        type="text"
                        value={formData.abn}
                        onChange={(e) => setFormData(prev => ({ ...prev, abn: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-800" htmlFor="business-address">Registered Business Address</label>
                    <div className="mt-2">
                      <input 
                        className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        id="business-address" 
                        name="business-address" 
                        placeholder="e.g. 123 Smith Street, Sydney NSW 2000" 
                        type="text"
                        value={formData.businessAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </form>
              </>
            )}

            {currentStep === 2 && (
              <>
                <h2 className="mb-1 text-3xl font-bold tracking-tight text-gray-800">Bank Account Details</h2>
                <p className="mb-6 text-base text-gray-500">
                  Add your Australian bank account to receive payments securely and efficiently.
                </p>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-800" htmlFor="account-holder">Account Holder Name</label>
                    <div className="mt-2">
                      <input 
                        className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        id="account-holder" 
                        placeholder="Full name as it appears on your account" 
                        type="text"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-800" htmlFor="bsb">BSB</label>
                      <div className="mt-2">
                        <input 
                          className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          id="bsb" 
                          placeholder="123-456" 
                          type="text"
                          maxLength={7}
                          value={formData.bsb}
                          onChange={(e) => setFormData(prev => ({ ...prev, bsb: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-800" htmlFor="account-number">Account Number</label>
                      <div className="mt-2">
                        <input 
                          className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          id="account-number" 
                          placeholder="123456789" 
                          type="text"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}

            {currentStep === 3 && (
              <>
                <h2 className="mb-1 text-3xl font-bold tracking-tight text-gray-800">Identity Verification</h2>
                <p className="mb-6 text-base text-gray-500">
                  Upload a government-issued ID to verify your identity. This is required for payment processing.
                </p>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-800">Document Type</label>
                    <div className="mt-2">
                      <select 
                        className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        value={formData.documentType}
                        onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as 'drivers_license' | 'passport' | 'national_id' }))}
                      >
                        <option value="drivers_license">Driver's License</option>
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID Card</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-gray-800">Front of Document</label>
                    <div className="mt-2">
                      <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-4.69 4.69a.75.75 0 01-1.061 0l-1.42-1.42a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                          </svg>
                          <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label htmlFor="front-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                              <span>Upload a file</span>
                              <input id="front-upload" name="front-upload" type="file" className="sr-only" accept="image/*" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {formData.documentType !== 'passport' && (
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-800">Back of Document (Optional)</label>
                      <div className="mt-2">
                        <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-4.69 4.69a.75.75 0 01-1.061 0l-1.42-1.42a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                            </svg>
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                              <label htmlFor="back-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                                <span>Upload a file</span>
                                <input id="back-upload" name="back-upload" type="file" className="sr-only" accept="image/*" />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}

            {currentStep === 4 && (
              <>
                <h2 className="mb-1 text-3xl font-bold tracking-tight text-gray-800">Review & Complete</h2>
                <p className="mb-6 text-base text-gray-500">
                  Please review your information before completing the setup.
                </p>
                <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Business Details</h3>
                    <p className="text-sm text-gray-600">Business Name: {formData.businessName}</p>
                    <p className="text-sm text-gray-600">ABN: {formData.abn}</p>
                    <p className="text-sm text-gray-600">Address: {formData.businessAddress}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Bank Account</h3>
                    <p className="text-sm text-gray-600">Account Holder: {formData.accountHolderName}</p>
                    <p className="text-sm text-gray-600">BSB: {formData.bsb}</p>
                    <p className="text-sm text-gray-600">Account Number: ****{formData.bankAccountNumber.slice(-4)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Identity Verification</h3>
                    <p className="text-sm text-gray-600">Document Type: {formData.documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-sm text-gray-600">Status: {formData.frontImageUrl ? 'Document uploaded' : 'Pending upload'}</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" fillRule="evenodd"></path>
                </svg>
                <span>Securely powered by <span className="font-semibold">Stripe</span></span>
              </div>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button 
                    onClick={handleBack}
                    className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button 
                    onClick={handleNext}
                    className="flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Continue
                    <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" fillRule="evenodd"></path>
                    </svg>
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Complete Setup'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500">
            TradieHelper AU Pty Ltd, ABN 98 765 432 109 |{' '}
            <a className="font-medium text-blue-600 hover:underline" href="#">Terms of Service</a> |{' '}
            <a className="font-medium text-blue-600 hover:underline" href="#">Privacy Policy</a>
          </p>
        </div>
      </main>
    </div>
  )
}