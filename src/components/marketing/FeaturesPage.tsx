import React from 'react'
import { useNavigate } from 'react-router-dom'

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-100 relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: '"Work Sans", "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 shadow-sm">
          <div className="flex items-center gap-3 text-slate-800">
            <div className="size-8 text-blue-600">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_535">
                    <rect fill="white" height="48" width="48"></rect>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-slate-800 text-xl font-bold tracking-tighter">TradieHelper</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <nav className="flex items-center gap-8">
              <button onClick={() => navigate('/jobs')} className="text-slate-600 hover:text-blue-600 text-sm font-medium">Find Tradies</button>
              <button onClick={() => navigate('/jobs/create')} className="text-slate-600 hover:text-blue-600 text-sm font-medium">Find Work</button>
              <button onClick={() => navigate('/pricing')} className="text-slate-600 hover:text-blue-600 text-sm font-medium">Pricing</button>
              <button onClick={() => navigate('/contact')} className="text-slate-600 hover:text-blue-600 text-sm font-medium">Safety</button>
            </nav>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/jobs/create')}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                <span className="truncate">Post a Job</span>
              </button>
              <button 
                onClick={() => navigate('/signin')}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-slate-100 text-slate-800 text-sm font-bold shadow-sm hover:bg-slate-200 transition-colors"
              >
                <span className="truncate">Log In</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative flex min-h-[520px] items-center justify-center bg-cover bg-center py-20 text-white" style={{backgroundImage: 'linear-gradient(rgba(37, 99, 235, 0.6) 0%, rgba(20, 50, 120, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBP_DaU-vSvPsq742b2k6grpEH2sRx15cQiOFsqlShM78MzVc00praee-U0fF7O9jRcBEAvXdyGsS6CaOu0dwBorhURsPVy95kjEHoh5zIwXx3hDe_6Y7VwwH32tpt5Nik3F0nGIUvB_24eEPNvZx8aQ1mXOVbegy8inP2QerLfk44xXqsdoGMhLhdXOG5bWtm7yTJsohHA_gcPJoQOwsuoRqG6cDe18QZxrzZ_W7HdiHX8SxcfsjQuoSKZ1gv1DXd4W3VAiacM52Mj")'}}>
            <div className="container mx-auto px-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">TradieHelper: Your Trusted Platform for Quality Trades</h1>
              <p className="mt-4 max-w-3xl mx-auto text-base md:text-lg font-light">
                Connecting Australian tradies and helpers with verified jobs and secure payments. Find the right people for your project, or discover your next work opportunity.
              </p>
              <button 
                onClick={() => navigate('/signup')}
                className="mt-8 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-orange-600 text-white text-base font-bold shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-105 mx-auto"
              >
                <span className="truncate">Get Started</span>
              </button>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">Built for Australian Tradies and Helpers</h2>
                <p className="mt-4 max-w-3xl mx-auto text-gray-600">
                  TradieHelper offers a comprehensive suite of features designed to streamline your work and ensure a safe, reliable experience.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Verified Profiles */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                  <img alt="Verified Profiles" className="w-full h-48 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDulTQuEhvytwqxjDF_DGz2CNPpBm2zGnH-8dzQYloeLwpB99WXDY5kmcUHFyXVbBQ8CWb4qG17tbdGehZp3iGF2R-s-mN7i6EnSBICeIKDPyvNx-Yc5oVhob0ltl1KtDNk89J_iW1-LyYiw6I8db8Cudm7_BxzsBCIGPMWsEegBiEmc97XXP2rtOWxHLc9PIcZBcNuMj-zYYgvgU7z3WFwo1XkMsI55SqrfUeyoQfBu68xwHS9gfIzcpx15hgRrZwD8-nL_a0lxpkG"/>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800">Verified Profiles</h3>
                    <p className="mt-2 text-gray-600 text-sm">
                      All tradies and helpers undergo a thorough verification process, ensuring you're working with trusted professionals.
                    </p>
                  </div>
                </div>

                {/* Secure Payments */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                  <img alt="Secure Payments" className="w-full h-48 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4RHfQITQZHQRS3MasrcY3oyvg_2sLOLRppFNNHO1G7cP9tUUFpPwj7Zd1v8aXTG9eep_HxU8EsMjfFYWCH98mDzUHlLIP7o22z-CiHPIPxuvsLV9gov-kyNj44Vbp0TfD8PbOrv1lr6HYZgkKGZtUw46bfarpLGiTyr-7PHhG1y_c0V1UYZ-MKPDfehsup4QsZdFaxqCFjttVJiX2Wip6-vqsHEuKeSUmqdczXUR_H05zcYv_ZmviD2_JL2MMi6W_reaxs1NSteCV"/>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800">Secure Payments (AUD)</h3>
                    <p className="mt-2 text-gray-600 text-sm">
                      Our secure payment system protects both tradies and clients, ensuring timely and hassle-free transactions in AUD.
                    </p>
                  </div>
                </div>

                {/* Smart Job Matching */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                  <img alt="Smart Job Matching" className="w-full h-48 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbOFjBRo-o5ZUx1zzeS_oeNe70ajg6nBHYZYcTKLhqraUz5rnANRx56cwuBqdTocdBTFGzz5Gsabf2Lq1GIUrYW4Dp2jUGMduVyvMDJGPiGdpHA4ucFF9bv5NGvnO_Df4_xv7UOiI9bUE9IzjUKucn4_tECClT5utzFF0s-R3mRIafyblmSm8foU7UI19cMHRYVNTH9gUm6biOJ9G0KrEDRlaSICGqCG7J7RH7Svusfk8EArPT2WepcgdZnnHCx2ja0gb3uPQOOU0D"/>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800">Smart Job Matching</h3>
                    <p className="mt-2 text-gray-600 text-sm">
                      Our algorithm matches you with the best jobs or tradies based on your skills, location (AEST/AEDT), and availability.
                    </p>
                  </div>
                </div>

                {/* Mobile App */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                  <img alt="Mobile App" className="w-full h-48 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeJH3PI5Bchf0Sefiz9IjLwI2FnfVuvMKY0urEpzjGuViQXeInrWZ-DuRZ7riBdlkbRaVNzlexwpe5UuuiPNKZNMhEgDSmU2P1zdSJJv0ZKAmbxy5ImJ1X0bv8SGxbRknduRg43QqnYS6cekYM1cYaL6zHqO-RMBeZcJ1NCk7uQH5cGl6wp_Ck7jHC7tdPh1UWPjpQQ9N_HWbKWIULTsOByhjq0o_WiBYR3BHyDx1dSAphnCiSVUlOtV3IpsFKFwTmfL2d1SOJNya9"/>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800">Mobile App</h3>
                    <p className="mt-2 text-gray-600 text-sm">
                      Manage your jobs, communicate, and stay updated on the go with our user-friendly mobile app.
                    </p>
                  </div>
                </div>

                {/* Safety Compliance */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                  <img alt="Safety Compliance" className="w-full h-48 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAM0lt8rqVPEQrHtGC9K23RE60iI9-lsJlJ8YfJFgLUDQHkPC_zOtPRYaTlzdrdRgAGcTkbXldwzyNWLGUjiOgqshrqFmUpKhlWnJ_Hj6K1jwaITVjwtXKGiTQWFqlev1Wd0NU8U0lRnwhIEdBSnTxSJdl2RcZaSOYAnCcMtXGYRcYKGVJB9iLSaG_v59dYBztP6j-J4-a-ORMgSVD1Gk8-rbbw81FLDAZ0nqq_hkLClBTq5i4y2jYyWx0Q0kt49yxfkG1cA4mpB5yN"/>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800">Safety Compliance</h3>
                    <p className="mt-2 text-gray-600 text-sm">
                      Access tools and resources to help you comply with Australian safety standards and 'Safe Work' regulations.
                    </p>
                  </div>
                </div>

                {/* And more */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex items-center justify-center p-6 text-center">
                  <div>
                    <div className="text-green-600 mx-auto w-16 h-16 mb-4">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">And much more...</h3>
                    <p className="mt-2 text-gray-600 text-sm">
                      We're constantly adding new features to make your life easier.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">How It Works</h2>
              </div>
              <div className="relative">
                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-200 hidden md:block"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                  <div className="flex items-center gap-6 md:justify-end">
                    <div className="text-right">
                      <h3 className="text-xl font-bold text-slate-800">1. Post Your Job</h3>
                      <p className="mt-2 text-gray-600">Describe your project, 'what needs doing', and the skills required. It's quick and free.</p>
                    </div>
                    <div className="flex-shrink-0 size-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                      <svg fill="currentColor" height="28px" viewBox="0 0 256 256" width="28px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M227.32,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.32,73.37ZM136,75.31,152.69,92,68,176.69,51.31,160ZM48,208V179.31L76.69,208Zm48-3.31L79.32,188,164,103.31,180.69,120Zm96-96L147.32,64l24-24L216,84.69Z"></path>
                      </svg>
                    </div>
                  </div>
                  <div></div>
                  <div></div>
                  <div className="flex items-center gap-6 md:justify-start">
                    <div className="flex-shrink-0 size-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                      <svg fill="currentColor" height="28px" viewBox="0 0 256 256" width="28px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">2. Find the Right Tradie/Helper</h3>
                      <p className="mt-2 text-gray-600">Browse profiles, read reviews, and connect with suitable candidates. We'll help you find the perfect match.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 md:justify-end">
                    <div className="text-right">
                      <h3 className="text-xl font-bold text-slate-800">3. Get the Job Done</h3>
                      <p className="mt-2 text-gray-600">Manage your project, communicate, and make secure payments all through the platform. Job's a good 'un!</p>
                    </div>
                    <div className="flex-shrink-0 size-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                      <svg fill="currentColor" height="28px" viewBox="0 0 256 256" width="28px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM208,208V48H48V208H208Z"></path>
                      </svg>
                    </div>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose TradieHelper */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">Why Choose TradieHelper?</h2>
                <p className="mt-4 max-w-3xl mx-auto text-gray-600">
                  TradieHelper offers a unique blend of security, efficiency, and local support, making it the top choice for Australian tradies and clients.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <div className="text-green-600 mx-auto w-16 h-16 mb-4">
                    <svg fill="currentColor" height="64px" viewBox="0 0 256 256" width="64px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.53,15.53,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Zm0,74.79c0,78.42-66.35,104.62-80,109.18-13.53-4.51-80-30.69-80-109.18V56H208ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.68l50.34-50.34a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Safety First</h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    We prioritise your safety with verified profiles, secure payments, and resources to ensure compliance with Australian standards.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <div className="text-green-600 mx-auto w-16 h-16 mb-4">
                    <svg fill="currentColor" height="64px" viewBox="0 0 256 256" width="64px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-40,0a32,32,0,0,1,0-64h8v64Zm40,80H136V136h16a32,32,0,0,1,0,64Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Fair Pricing</h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Our transparent pricing ensures fair rates for both tradies and clients, with no hidden fees. All in AUD, of course.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <div className="text-green-600 mx-auto w-16 h-16 mb-4">
                    <svg fill="currentColor" height="64px" viewBox="0 0 256 256" width="64px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Community Support</h3>
                  <p className="mt-2 text-gray-600 text-sm">
                    Join a thriving community of Aussie tradies and clients, with access to support and resources to help you succeed.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">Ready to Get Started?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-gray-600">
                Join TradieHelper today and experience the difference. Find quality tradies, or discover your next work opportunity. It's 'too easy'!
              </p>
              <button 
                onClick={() => navigate('/signup')}
                className="mt-8 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-orange-600 text-white text-base font-bold shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-105 mx-auto"
              >
                <span className="truncate">Sign Up for Free</span>
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-slate-800 text-slate-400">
          <div className="container mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h3 className="text-lg font-bold text-white">TradieHelper</h3>
                <p className="text-sm mt-1">© 2024 TradieHelper. All rights reserved.</p>
              </div>
              <div className="flex gap-6 mb-6 md:mb-0">
                <button onClick={() => navigate('/terms')} className="hover:text-white">Terms of Service</button>
                <button onClick={() => navigate('/privacy')} className="hover:text-white">Privacy Policy</button>
                <button onClick={() => navigate('/contact')} className="hover:text-white">Contact Us</button>
              </div>
              <div className="flex gap-4">
                <a className="hover:text-white" href="#" aria-label="Twitter">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                  </svg>
                </a>
                <a className="hover:text-white" href="#" aria-label="Facebook">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path>
                  </svg>
                </a>
                <a className="hover:text-white" href="#" aria-label="Instagram">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}