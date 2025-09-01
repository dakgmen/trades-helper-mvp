import React from 'react'
import { useNavigate } from 'react-router-dom'

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
  </svg>
)

const ArrowIcon = () => (
  <svg className="h-6 w-6 transform transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
  </svg>
)

export const PricingPage: React.FC = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/signup')
  }

  const handlePostNow = () => {
    navigate('/jobs/create')
  }

  return (
    <div className="bg-gray-50 text-gray-800" style={{fontFamily: '"Work Sans", "Noto Sans", sans-serif'}}>
      <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          {/* Header */}
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-gray-900">
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
              <h2 className="text-2xl font-bold tracking-tighter">TradieHelper</h2>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button onClick={() => navigate('/jobs')} className="text-gray-600 hover:text-blue-600 transition-colors">Find a Tradie</button>
              <button onClick={() => navigate('/jobs/create')} className="text-gray-600 hover:text-blue-600 transition-colors">Find a Helper</button>
              <span className="text-blue-600 font-semibold">Pricing</span>
              <button onClick={() => navigate('/contact')} className="text-gray-600 hover:text-blue-600 transition-colors">Contact</button>
            </nav>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/jobs/create')}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition-all"
              >
                <span className="truncate">Post a Job</span>
              </button>
              <button 
                onClick={() => navigate('/signin')}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-gray-100 text-gray-700 text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-all"
              >
                <span className="truncate">Log In</span>
              </button>
            </div>
          </header>

          <main className="flex-1">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-white">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-extrabold tracking-tighter text-gray-900">Transparent Pricing for TradieHelper</h1>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">At TradieHelper, we believe in clear and upfront pricing. No hidden fees, just straightforward costs to help you connect with the best tradies and helpers in Australia. All prices in AUD.</p>
              </div>
            </section>

            {/* Service Fee Breakdown */}
            <section className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold tracking-tighter text-center text-gray-900 mb-4">Service Fee Breakdown</h2>
                <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">Our fees are designed to be fair and transparent, ensuring both tradies and helpers get a great deal while allowing us to maintain and improve the platform for everyone.</p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">For Helpers</h3>
                    <p className="text-gray-600 mb-4">This commission covers platform maintenance, secure payments, and dedicated support.</p>
                    <div className="flex items-baseline mb-4">
                      <span className="text-5xl font-extrabold text-blue-600">8-12%</span>
                    </div>
                    <p className="text-gray-500 text-sm">Commission rate varies based on job type and complexity.</p>
                  </div>
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">For Tradies</h3>
                    <p className="text-gray-600 mb-4">This fee helps us maintain a high-quality pool of helpers and provide you with top-notch platform support.</p>
                    <div className="flex items-baseline mb-4">
                      <span className="text-5xl font-extrabold text-blue-600">5-8%</span>
                    </div>
                    <p className="text-gray-500 text-sm">Platform fee varies based on job type and complexity.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Premium Features */}
            <section className="py-20 px-4 bg-white">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold tracking-tighter text-center text-gray-900 mb-4">Premium Features</h2>
                <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">Unlock additional features to supercharge your experience on TradieHelper and get ahead of the competition.</p>
                <div className="grid lg:grid-cols-2 gap-8 items-stretch">
                  <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-bold text-gray-900">Featured Profile</h3>
                      <p className="text-gray-600 mt-1">Get noticed with a prominent profile.</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-gray-900">$29</span>
                      <span className="text-lg font-semibold text-gray-500">/month</span>
                    </div>
                    <ul className="flex flex-col gap-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <CheckIcon />
                        <span>Increased visibility in search results</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon />
                        <span>Priority placement on job boards</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon />
                        <span>Enhanced profile customisation</span>
                      </li>
                    </ul>
                    <button 
                      onClick={handleGetStarted}
                      className="mt-auto w-full flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-5 bg-blue-600 text-white text-base font-bold shadow-md hover:bg-blue-700 transition-all"
                    >
                      <span className="truncate">Get Started</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-8 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-bold text-gray-900">Priority Job Listing</h3>
                      <p className="text-gray-600 mt-1">Make your job posting stand out.</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-gray-900">$19</span>
                      <span className="text-lg font-semibold text-gray-500">/listing</span>
                    </div>
                    <ul className="flex flex-col gap-3 text-gray-600">
                      <li className="flex items-center gap-3">
                        <CheckIcon />
                        <span>Top placement in search results</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon />
                        <span>Highlighted job listing to attract more views</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckIcon />
                        <span>Direct contact with interested helpers</span>
                      </li>
                    </ul>
                    <button 
                      onClick={handlePostNow}
                      className="mt-auto w-full flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-5 bg-gray-800 text-white text-base font-bold shadow-md hover:bg-gray-900 transition-all"
                    >
                      <span className="truncate">Post Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Compare */}
            <section className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold tracking-tighter text-center text-gray-900 mb-12">How We Compare</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900">Helper Earnings</h3>
                    <p className="text-gray-600 mb-4">Earn more with our lower commission rates.</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-extrabold text-gray-900">$1,800</span>
                      <span className="text-lg font-semibold text-green-600">+12.5% vs others</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-base font-medium text-blue-600">TradieHelper</span>
                          <span className="text-sm font-medium text-blue-600">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-blue-500 h-4 rounded-full" style={{width: '92%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-base font-medium text-gray-500">Other Platforms</span>
                          <span className="text-sm font-medium text-gray-500">80%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-gray-400 h-4 rounded-full" style={{width: '80%'}}></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">*Based on an average job value of $2,000 AUD.</p>
                  </div>
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900">Tradie Costs</h3>
                    <p className="text-gray-600 mb-4">Save money with our competitive platform fees.</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-extrabold text-gray-900">$140</span>
                      <span className="text-lg font-semibold text-orange-600">-30% vs others</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-base font-medium text-blue-600">TradieHelper</span>
                          <span className="text-sm font-medium text-blue-600">7%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-blue-500 h-4 rounded-full" style={{width: '35%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-base font-medium text-gray-500">Other Platforms</span>
                          <span className="text-sm font-medium text-gray-500">10%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-gray-400 h-4 rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">*Based on an average job value of $2,000 AUD.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4 bg-white">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold tracking-tighter text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <details className="group rounded-lg border border-gray-200 p-6 bg-gray-50 transition-all duration-300 hover:border-blue-300">
                    <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-gray-800">
                      Are there any hidden fees?
                      <ArrowIcon />
                    </summary>
                    <p className="text-gray-600 mt-4">No, we are committed to transparent pricing. All fees are clearly outlined on this page and at the point of transaction. What you see is what you get.</p>
                  </details>
                  <details className="group rounded-lg border border-gray-200 p-6 bg-gray-50 transition-all duration-300 hover:border-blue-300">
                    <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-gray-800">
                      How does payment work?
                      <ArrowIcon />
                    </summary>
                    <p className="text-gray-600 mt-4">Payments are processed securely through our platform. Tradies fund the job, and helpers receive their payment automatically once the job is marked as complete, minus the platform commission.</p>
                  </details>
                  <details className="group rounded-lg border border-gray-200 p-6 bg-gray-50 transition-all duration-300 hover:border-blue-300">
                    <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-gray-800">
                      What currency are the prices in?
                      <ArrowIcon />
                    </summary>
                    <p className="text-gray-600 mt-4">All prices displayed on TradieHelper are in Australian Dollars (AUD).</p>
                  </details>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-4">
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl font-bold tracking-tighter text-gray-900 mb-4">Guaranteed No Hidden Fees</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">We pride ourselves on our integrity and transparency. The price you see is the price you pay. Period.</p>
                <div className="grid sm:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-5xl font-extrabold text-blue-600">10,000+</h3>
                    <p className="text-gray-600 mt-2 font-semibold">Jobs Completed</p>
                  </div>
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-5xl font-extrabold text-blue-600">5,000+</h3>
                    <p className="text-gray-600 mt-2 font-semibold">Verified Helpers</p>
                  </div>
                  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-5xl font-extrabold text-blue-600">3,000+</h3>
                    <p className="text-gray-600 mt-2 font-semibold">Trusted Tradies</p>
                  </div>
                </div>
                <div className="mt-16">
                  <button 
                    onClick={handleGetStarted}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-16 px-8 bg-blue-600 text-white text-xl font-bold shadow-lg hover:bg-blue-700 transition-all mx-auto"
                  >
                    <span className="truncate">Get Started Now</span>
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white">
            <div className="max-w-6xl mx-auto px-5 py-10">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_6_535_footer)">
                      <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_6_535_footer">
                        <rect fill="white" height="48" width="48"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                  <h2 className="text-2xl font-bold tracking-tighter">TradieHelper</h2>
                </div>
                <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <button onClick={() => navigate('/about')} className="text-gray-300 hover:text-white transition-colors">About Us</button>
                  <button onClick={() => navigate('/contact')} className="text-gray-300 hover:text-white transition-colors">Contact</button>
                  <button onClick={() => navigate('/terms')} className="text-gray-300 hover:text-white transition-colors">Terms of Service</button>
                  <button onClick={() => navigate('/privacy')} className="text-gray-300 hover:text-white transition-colors">Privacy Policy</button>
                </nav>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
                <p>© 2024 TradieHelper. All rights reserved. Built in Australia.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}