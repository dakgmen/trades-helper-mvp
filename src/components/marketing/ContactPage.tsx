import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmailService from '../../services/EmailService'

export const ContactPage: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    
    try {
      const success = await EmailService.sendContactFormEmail(formData)
      
      if (success) {
        setSubmitStatus('success')
        setFormData({
          fullName: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error sending contact form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 relative flex size-full min-h-screen flex-col overflow-x-hidden group/design-root" style={{fontFamily: '"Work Sans", "Noto Sans", sans-serif'}}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between whitespace-nowrap px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_535)">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535">
                  <rect fill="white" height="48" width="48"></rect>
                </clipPath>
              </defs>
            </svg>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">TradieHelper</h1>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => navigate('/jobs')} className="text-base font-medium text-gray-500 hover:text-blue-600">Find a Tradie</button>
            <button onClick={() => navigate('/jobs/create')} className="text-base font-medium text-gray-500 hover:text-blue-600">Post a Job</button>
            <button onClick={() => navigate('/pricing')} className="text-base font-medium text-gray-500 hover:text-blue-600">Pricing</button>
            <button onClick={() => navigate('/help')} className="text-base font-medium text-gray-500 hover:text-blue-600">Resources</button>
          </nav>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/signin')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide transition-colors hover:bg-blue-700"
            >
              <span className="truncate">Log In</span>
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-gray-200 text-gray-800 text-sm font-bold leading-normal tracking-wide transition-colors hover:bg-gray-300"
            >
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Left Column - Contact Form */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Get in Touch</h2>
                <p className="mt-4 text-lg text-gray-500">
                  We're here to help! Reach out to us with any questions or concerns. Our team is dedicated to providing prompt and helpful support.
                </p>
              </div>
              <div className="rounded-lg bg-white p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800">Contact Form</h3>
                <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-500" htmlFor="fullName">Your Name</label>
                    <div className="mt-1">
                      <input 
                        autoComplete="name" 
                        className="block w-full rounded-md border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm" 
                        id="fullName" 
                        name="fullName" 
                        placeholder="e.g. John Smith" 
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500" htmlFor="email">Your Email</label>
                    <div className="mt-1">
                      <input 
                        autoComplete="email" 
                        className="block w-full rounded-md border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm" 
                        id="email" 
                        name="email" 
                        placeholder="you@example.com" 
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-500" htmlFor="subject">Subject</label>
                    <div className="mt-1">
                      <input 
                        className="block w-full rounded-md border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm" 
                        id="subject" 
                        name="subject" 
                        placeholder="How can we help?" 
                        type="text"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-500" htmlFor="message">Message</label>
                    <div className="mt-1">
                      <textarea 
                        className="block w-full rounded-md border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm" 
                        id="message" 
                        name="message" 
                        placeholder="Enter your message here..." 
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <button 
                      className={`flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 text-base font-bold leading-normal tracking-wide transition-colors ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                  
                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="sm:col-span-2">
                      <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Message sent successfully!</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>Thank you for your message! We'll get back to you within 24-48 hours.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <div className="sm:col-span-2">
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error sending message</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>There was an error sending your message. Please try again or contact us directly at support@tradiehelper.com.au</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column - Contact Details */}
            <div className="space-y-8">
              <div className="rounded-lg bg-white p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800">Contact Details</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <svg className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.096 1.096c-1.026-.52-2.146-1.32-3.23-2.404s-1.885-2.204-2.404-3.23l1.096-1.096c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">Phone</h4>
                      <p className="text-gray-500">1300 123 456 (Australia Wide)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <svg className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">Email</h4>
                      <p className="text-gray-500">support@tradiehelper.com.au</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <svg className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">Support Hours</h4>
                      <p className="text-gray-500">Monday - Friday: 9am - 5pm (AEST)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <svg className="h-6 w-6 flex-shrink-0 text-orange-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-orange-600">Emergency Contact</h4>
                      <p className="text-gray-500">For urgent matters, call 0400 987 654</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-green-600">Quick Links</h4>
                      <button onClick={() => navigate('/help')} className="text-green-600 hover:underline">FAQs</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800">Our Offices</h3>
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800">Sydney</h4>
                    <p className="text-gray-500">123 Main Street, Sydney NSW 2000</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Melbourne</h4>
                    <p className="text-gray-500">456 Collins Street, Melbourne VIC 3000</p>
                  </div>
                </div>
                <div className="mt-6 aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg">
                  <div className="h-48 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC8KBorM75Szs3ca2h3FPfy5lz_snEEMkguILbYJJ0qnKdkcaqnu0MM7rjS_VmAsNOlaqjDQ5Oq7ph4K0HvaAJqrkoweTgavQHHalJgOFqDwA28zcWksHRO6SsV8AOPSM0t8ZhU6TktQoGviz7sjQOrQ5ZZJfGYuUdlUiFk_YPSvze7xGMYStvlrQXNHKOSjJazgAuScK6zXs9dQoL4px2FwO31CGgVt6jcBO22JSBvHLr_Fwbq65aOZAAteXg93xmomZ0Sv67hpQBU")'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Response Time Section */}
          <div className="mt-16 rounded-lg bg-blue-50 p-8 text-center">
            <h3 className="text-xl font-bold text-blue-600">Response Time Expectation</h3>
            <p className="mt-2 text-gray-500">We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, please use the emergency contact number provided above.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
              <button onClick={() => navigate('/about')} className="text-base text-gray-500 hover:text-blue-600">About Us</button>
              <button onClick={() => navigate('/terms')} className="text-base text-gray-500 hover:text-blue-600">Terms of Service</button>
              <button onClick={() => navigate('/privacy')} className="text-base text-gray-500 hover:text-blue-600">Privacy Policy</button>
              <span className="text-base text-blue-600 font-medium">Contact Us</span>
            </nav>
            <p className="text-base text-gray-400">© 2024 TradieHelper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}