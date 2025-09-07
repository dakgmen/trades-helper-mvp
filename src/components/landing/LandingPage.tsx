import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleGetStarted = () => {
    navigate('/auth')
  }

  const handleLogin = () => {
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap bg-white px-4 sm:px-10 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <svg 
            className="h-8 w-8 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            viewBox="0 0 24 24"
          >
            <path 
              d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">TradieHelper</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate(user ? '/jobs' : '/auth')}
            className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Find Work
          </button>
          <button
            onClick={() => navigate(user ? '/jobs/post' : '/auth')}
            className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Post a Job
          </button>
          <a 
            href="#about" 
            className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            About Us
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogin}
            className="flex min-w-[90px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white text-sm font-bold leading-normal tracking-wide transition-all duration-300"
          >
            <span className="truncate">Log In</span>
          </button>
          <button
            onClick={handleGetStarted}
            className="flex min-w-[90px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold leading-normal tracking-wide transition-colors"
          >
            <span className="truncate">Sign Up</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect Tradies with
              <span className="text-blue-600 block">Reliable Helpers</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The easiest way for tradies to find skilled helpers and for workers to discover great opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate(user ? '/jobs' : '/auth')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
              className="absolute top-0 left-0 w-full h-full opacity-5"
              width="60"
              height="60"
              viewBox="0 0 60 60"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g fill="none" fillRule="evenodd">
                <g fill="#2563eb" fillOpacity="0.4">
                  <path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z" />
                </g>
              </g>
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose TradieHelper?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We make it simple and secure for tradies and helpers to connect and work together.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Professionals</h3>
                <p className="text-gray-600">
                  All users are identity-verified with background checks for your peace of mind and safety.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Secure Payments</h3>
                <p className="text-gray-600">
                  Built-in escrow system ensures helpers get paid and tradies get quality work completed.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Fast Matching</h3>
                <p className="text-gray-600">
                  Smart algorithms match the right helpers with the right jobs based on skills and location.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* For Tradies */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Tradies</h3>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Post Your Job</h4>
                      <p className="text-gray-600">Describe what you need help with, set your rate, and specify requirements.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Review Applications</h4>
                      <p className="text-gray-600">Get applications from qualified helpers and choose the best fit.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Work Together</h4>
                      <p className="text-gray-600">Collaborate on-site with your chosen helper to get the job done.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Helpers */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Helpers</h3>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Browse Jobs</h4>
                      <p className="text-gray-600">Find jobs that match your skills, location, and schedule preferences.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Apply & Connect</h4>
                      <p className="text-gray-600">Submit your application and connect with tradies who need your skills.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Get Paid</h4>
                      <p className="text-gray-600">Complete the job and receive secure payment through our platform.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of tradies and helpers who are already working together successfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Sign Up Now
              </button>
              <button
                onClick={handleLogin}
                className="bg-transparent text-white px-8 py-4 rounded-lg text-lg font-bold border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Already have an account?
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              About TradieHelper
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We understand the challenges tradies face finding reliable help and the struggles workers face 
              finding consistent, well-paid work. TradieHelper bridges this gap with a safe, efficient platform 
              that benefits everyone in the trade industry.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50,000+</div>
                <div className="text-gray-600">Jobs Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">4.9★</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg 
                  className="h-6 w-6" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-bold text-lg">TradieHelper</span>
              </div>
              <p className="text-gray-400">
                Connecting tradies with reliable helpers across Australia.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Tradies</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate(user ? '/jobs/post' : '/auth')}>Post a Job</button></li>
                <li><button onClick={() => navigate(user ? '/jobs' : '/auth')}>Browse Helpers</button></li>
                <li><button onClick={() => navigate('/pricing')}>Pricing</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Helpers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate(user ? '/jobs' : '/auth')}>Find Jobs</button></li>
                <li><button onClick={() => navigate('/how-it-works')}>How it Works</button></li>
                <li><a href="#">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Safety</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 TradieHelper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}