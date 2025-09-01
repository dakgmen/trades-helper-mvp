import React from 'react'
import { useNavigate } from 'react-router-dom'

export const AboutPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: '"Work Sans", "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-10 py-3">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="size-8">
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
            <h2 className="text-gray-900 text-2xl font-bold leading-tight tracking-[-0.015em]">TradieHelper</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <button onClick={() => navigate('/jobs')} className="text-gray-900 text-base font-medium leading-normal hover:text-blue-600">Find Tradies</button>
              <button onClick={() => navigate('/jobs/create')} className="text-gray-900 text-base font-medium leading-normal hover:text-blue-600">Find Work</button>
              <span className="text-blue-600 text-base font-bold leading-normal">About Us</span>
              <button onClick={() => navigate('/contact')} className="text-gray-900 text-base font-medium leading-normal hover:text-blue-600">Contact</button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/jobs/create')}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700"
              >
                <span className="truncate">Post a Job</span>
              </button>
              <button 
                onClick={() => navigate('/signin')}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300"
              >
                <span className="truncate">Log In</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-40 flex flex-1 justify-center py-10">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-lg">
              <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-center p-8" style={{backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrK0YnPrPmKJmP6zREsyJLk0eCewpOkOet4bU4jvSHbaaZ4BrCP4U_E14_jjHXFB4gzG-lNDniL1A2UwmHXYXKr9pQwnseBExou1RbADAXvt5Qf6UwU9bk5u9XWeC8F35IBrWj5Rr79dn1VvP4-yhC4vGwuMuDaKgAzuLfXuG3XY3Qw5aUETJEjA4BsjDyTJL3ZlTnlynVgXSb_5f8oUHB59HlgcpCk3KhJyg_-Jgipa23sgMzy7vJvmUyXzsjVL3WCAza1q1ONWpK")'}}>
                <div className="flex flex-col gap-4 text-center max-w-3xl">
                  <h1 className="text-white text-5xl font-black leading-tight tracking-[-0.033em]">Connecting Australian Tradies with Opportunities</h1>
                  <h2 className="text-gray-200 text-lg font-normal leading-normal">
                    TradieHelper is the leading platform for connecting skilled tradespeople with construction projects across Australia. Our mission is to empower tradies and
                    helpers to find fulfilling work and help businesses find the right talent.
                  </h2>
                </div>
                <button 
                  onClick={() => navigate('/signup')}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-blue-600 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-blue-700"
                >
                  <span className="truncate">Get Started</span>
                </button>
              </div>
            </div>

            {/* Mission Section */}
            <div className="py-16 text-center">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] mb-4">Our Mission</h2>
              <p className="text-gray-600 text-lg font-normal leading-normal max-w-4xl mx-auto">
                To be the premier platform in Australia for connecting skilled tradespeople with construction projects, fostering a thriving community of professionals and
                driving efficiency in the industry.
              </p>
            </div>

            {/* Founder's Story */}
            <div className="py-16 bg-gray-50 rounded-lg">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] text-center mb-12">Founder's Story</h2>
              <div className="flex items-center justify-center gap-12 px-8">
                <div className="w-full h-80 bg-center bg-no-repeat bg-cover rounded-lg flex-1 shadow-lg" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDyOdJ8zRSeWewJxcCnhqdA-Sm7Nazp1wsTm0poPXlrTXA0yZmHUlnqZMFGIvQxW3CidAnwr9B5oos62JWc6wiGAhi7XiUettY9vtYPapqcCMkmmloZRgo2WqqsyhQOvRkcE716BUEbUsXkHJiCXHs4oVSsUASiILToYGkVO01_SIxunFVzeEcdhk-aItykrrU2U8gcoiBbacxl49TuaWEiZKBU6v-co5veJPErJ44vhzrq3_ij4LkkGqv4RxlSF2MWBHYF9S8ZiXj8")'}}></div>
                <div className="flex flex-col gap-4 flex-[1.5]">
                  <p className="text-blue-600 text-lg font-semibold leading-normal">Meet Alex</p>
                  <p className="text-gray-900 text-3xl font-bold leading-tight">From Site to Startup: Building TradieHelper</p>
                  <p className="text-gray-600 text-base font-normal leading-relaxed">
                    Alex, a seasoned builder with over 15 years of experience in the Australian construction industry, founded TradieHelper to address the challenges of finding
                    reliable tradespeople and quality work. His vision was to create a platform that simplifies the process, ensuring fair opportunities and fostering a strong
                    community.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="py-16 text-center">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] mb-12">Our Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
                <div className="flex flex-col gap-4 items-center text-center">
                  <div className="w-40 h-40 bg-center bg-no-repeat aspect-square bg-cover rounded-full shadow-md" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAEwkTML6Kvrc9Y35YtnGgN5dXoOPhEhR0DwtrndvQ1iDPSqLwQK8_mRs83BsNAGYjTTGUmbG0kc70XpG_2BT6J58G9DOAuI54k2g281YbxLpS3uu0b5tqR9-8SWXlT0mn09olF_Dfwv_IddsdQAXsJ2Ja1t7JW9CLP-UD5NopCEkxomHkXeAtT_BlobW88gGAkw5mHcLhoPy2KWf1irq7aJLtbHOCDDWdIFHakYEjOsNigiaa8_EB4E0-oUbW1kfp7J0v9Eeit0khh")'}}></div>
                  <p className="text-gray-900 text-xl font-bold leading-normal">Sarah Chen</p>
                  <p className="text-blue-600 text-base font-medium leading-normal">Head of Operations</p>
                </div>
                <div className="flex flex-col gap-4 items-center text-center">
                  <div className="w-40 h-40 bg-center bg-no-repeat aspect-square bg-cover rounded-full shadow-md" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBWs4zdKLW6QTwxIB3vfSpDd4uwJ6oOWfcysw1YAotK1I3krgwup9UmyRy06QLDlE-AEPGHf6Yy6yRAxwJR_aCWRp9SLYZq5pi3vp1d1kI8H7ymfmzZMszaITDJxdtz9oWWZx7SXCK51Czg8YyZ6x7TJCKoVgfYKsWmE36THdiwV1rroFzfMKlDkjCFTy4GQhKQgrzBjqyCWLkJLwk5C8uJ5ZciDVpQni7oTfGYcWyL4xMWARf3hloVc4MfkocOZSFApzinCeCSM9AZ")'}}></div>
                  <p className="text-gray-900 text-xl font-bold leading-normal">Mark Riley</p>
                  <p className="text-blue-600 text-base font-medium leading-normal">Lead Developer</p>
                </div>
                <div className="flex flex-col gap-4 items-center text-center">
                  <div className="w-40 h-40 bg-center bg-no-repeat aspect-square bg-cover rounded-full shadow-md" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAbldmTKrWdVSgMWom8x8jHvuVNdOOezDBr47XW8bh0gH80b5mHtbBfDo8K3R4EHKg-ndeKLYphDqUGA263ctEv9dq68RmKRogvfEfZhNIWtpD82qkZfeYNjxyo73iaQao-maGv1SCLqFdQcl3NfM8bi_rS7fZuV4fi77EJaVrltAG8LaAcnqhy_55TBx0aHkYyD9lE_67XW0i8go04aBXt6JjH9AD_6vjxWfPyRuvacvUcvQFWDvx3mkjWupdzD9R3RBpFP7as7-P7")'}}></div>
                  <p className="text-gray-900 text-xl font-bold leading-normal">Emily Jones</p>
                  <p className="text-blue-600 text-base font-medium leading-normal">Community Manager</p>
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div className="py-16 text-center">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] mb-12">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="text-blue-600 p-3 bg-blue-100 rounded-full">
                    <svg fill="currentColor" height="32px" viewBox="0 0 256 256" width="32px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M119.76,217.94A8,8,0,0,1,112,224a8.13,8.13,0,0,1-2-.24l-32-8a8,8,0,0,1-2.5-1.11l-24-16a8,8,0,1,1,8.88-13.31l22.84,15.23,30.66,7.67A8,8,0,0,1,119.76,217.94Zm132.69-96.46a15.89,15.89,0,0,1-8,9.25l-23.68,11.84-55.08,55.09a8,8,0,0,1-7.6,2.1l-64-16a8.06,8.06,0,0,1-2.71-1.25L35.86,142.87,11.58,130.73a16,16,0,0,1-7.16-21.46L29.27,59.58h0a16,16,0,0,1,21.46-7.16l22.06,11,53-15.14a8,8,0,0,1,4.4,0l53,15.14,22.06-11a16,16,0,0,1,21.46,7.16l24.85,49.69A15.9,15.9,0,0,1,252.45,121.48Zm-46.18,12.94L179.06,80H147.24L104,122c12.66,8.09,32.51,10.32,50.32-7.63a8,8,0,0,1,10.68-.61l34.41,27.57Zm-187.54-18,17.69,8.85L61.27,75.58,43.58,66.73ZM188,152.66l-27.71-22.19c-19.54,16-44.35,18.11-64.91,5a16,16,0,0,1-2.72-24.82.6.6,0,0,1,.08-.08L137.6,67.06,128,64.32,77.58,78.73,50.21,133.46l49.2,35.15,58.14,14.53Zm49.24-36.24L212.42,66.73l-17.69,8.85,24.85,49.69Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold leading-tight">Integrity</h3>
                  <p className="text-gray-600 text-base font-normal leading-relaxed">We operate with honesty and transparency, ensuring fair practices for all users.</p>
                </div>
                <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="text-green-600 p-3 bg-green-100 rounded-full">
                    <svg fill="currentColor" height="32px" viewBox="0 0 256 256" width="32px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold leading-tight">Community</h3>
                  <p className="text-gray-600 text-base font-normal leading-relaxed">We foster a supportive community where tradies and businesses can connect and thrive.</p>
                </div>
                <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="text-orange-600 p-3 bg-orange-100 rounded-full">
                    <svg fill="currentColor" height="32px" viewBox="0 0 256 256" width="32px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-gray-900 text-xl font-bold leading-tight">Efficiency</h3>
                  <p className="text-gray-600 text-base font-normal leading-relaxed">We streamline the job matching process, saving time and resources for everyone.</p>
                </div>
              </div>
            </div>

            {/* Growth Timeline */}
            <div className="py-16 bg-gray-50 rounded-lg">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] text-center mb-12">Company Growth Timeline</h2>
              <div className="relative px-4">
                <div className="absolute h-full border-l-2 border-gray-200 left-1/2 -translate-x-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16">
                  <div className="flex md:justify-end md:pr-8">
                    <div className="relative w-full max-w-sm">
                      <div className="absolute top-1/2 -translate-y-1/2 md:right-0 md:translate-x-[calc(100%+15px)] bg-blue-600 text-white rounded-full p-3 shadow-md">
                        <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                          <path d="M103.77,185.94C103.38,187.49,93.63,224,40,224a8,8,0,0,1-8-8c0-53.63,36.51-63.38,38.06-63.77a8,8,0,0,1,3.88,15.53c-.9.25-22.42,6.54-25.56,39.86C81.7,204.48,88,183,88.26,182a8,8,0,0,1,15.51,4Zm93-67.4L192,123.31v58.33A15.91,15.91,0,0,1,187.32,193L153,227.3A15.91,15.91,0,0,1,141.7,232a16.11,16.11,0,0,1-5.1-.83,15.94,15.94,0,0,1-10.78-12.92l-5.37-38.49L76.24,135.55l-38.47-5.37A16,16,0,0,1,28.7,103L63,68.68A15.91,15.91,0,0,1,74.36,64h58.33l4.77-4.77c26.68-26.67,58.83-27.82,71.41-27.07a16,16,0,0,1,15,15C224.6,59.71,223.45,91.86,196.78,118.54ZM40,114.34l37.15,5.18L116.69,80H74.36ZM91.32,128,128,164.68l57.45-57.45a76.46,76.46,0,0,0,22.42-59.16,76.65,76.65,0,0,0-59.11,22.47ZM176,139.31l-39.53,39.53L141.67,216,176,181.64Z"></path>
                        </svg>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md md:text-right">
                        <p className="text-gray-900 text-xl font-bold leading-normal">Launched TradieHelper</p>
                        <p className="text-gray-500 text-base font-medium leading-normal">2021</p>
                      </div>
                    </div>
                  </div>
                  <div></div>
                  <div></div>
                  <div className="flex md:justify-start md:pl-8">
                    <div className="relative w-full max-w-sm">
                      <div className="absolute top-1/2 -translate-y-1/2 md:left-0 md:-translate-x-[calc(100%+15px)] bg-green-600 text-white rounded-full p-3 shadow-md">
                        <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                          <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                        </svg>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <p className="text-gray-900 text-xl font-bold leading-normal">Reached 10,000 Registered Users</p>
                        <p className="text-gray-500 text-base font-medium leading-normal">2022</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:justify-end md:pr-8">
                    <div className="relative w-full max-w-sm">
                      <div className="absolute top-1/2 -translate-y-1/2 md:right-0 md:translate-x-[calc(100%+15px)] bg-orange-600 text-white rounded-full p-3 shadow-md">
                        <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>
                        </svg>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md md:text-right">
                        <p className="text-gray-900 text-xl font-bold leading-normal">Expanded Services Nationwide</p>
                        <p className="text-gray-500 text-base font-medium leading-normal">2023</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="py-16 text-center">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] mb-12">Key Statistics</h2>
              <div className="flex flex-wrap gap-8 justify-center p-4">
                <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg p-6 bg-blue-50">
                  <p className="text-blue-800 text-lg font-medium leading-normal">Registered Tradies</p>
                  <p className="text-blue-900 tracking-tight text-5xl font-bold leading-tight">25,000+</p>
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg p-6 bg-green-50">
                  <p className="text-green-800 text-lg font-medium leading-normal">Jobs Posted</p>
                  <p className="text-green-900 tracking-tight text-5xl font-bold leading-tight">50,000+</p>
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg p-6 bg-orange-50">
                  <p className="text-orange-800 text-lg font-medium leading-normal">Projects Completed</p>
                  <p className="text-orange-900 tracking-tight text-5xl font-bold leading-tight">10,000+</p>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="py-16 text-center bg-gray-50 rounded-lg">
              <h2 className="text-gray-900 text-4xl font-bold leading-tight tracking-[-0.015em] mb-4">Contact Us</h2>
              <p className="text-gray-600 text-lg font-normal leading-normal max-w-2xl mx-auto mb-8">Have questions or need assistance? Reach out to our team. We're here to help.</p>
              <div className="flex justify-center">
                <div className="flex gap-4 flex-wrap px-4 py-3 max-w-lg justify-center">
                  <button 
                    onClick={() => navigate('/contact')}
                    className="flex min-w-[160px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-blue-600 text-white text-base font-bold leading-normal tracking-[0.015em] grow transition-colors hover:bg-blue-700"
                  >
                    <span className="truncate">Contact Support</span>
                  </button>
                  <button 
                    onClick={() => navigate('/contact')}
                    className="flex min-w-[160px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-white text-gray-800 border border-gray-300 text-base font-bold leading-normal tracking-[0.015em] grow transition-colors hover:bg-gray-100"
                  >
                    <span className="truncate">Media Enquiries</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white">
          <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="size-8 text-blue-500">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_6_535)">
                        <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                      </g>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">TradieHelper</h2>
                </div>
                <p className="mt-4 text-gray-400">© 2024 TradieHelper. All rights reserved.</p>
              </div>
              <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
                <div>
                  <h3 className="text-lg font-semibold">Company</h3>
                  <ul className="mt-4 space-y-2">
                    <li><button onClick={() => navigate('/about')} className="text-gray-400 hover:text-white">About Us</button></li>
                    <li><button onClick={() => navigate('/careers')} className="text-gray-400 hover:text-white">Careers</button></li>
                    <li><button onClick={() => navigate('/press')} className="text-gray-400 hover:text-white">Press</button></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Support</h3>
                  <ul className="mt-4 space-y-2">
                    <li><button onClick={() => navigate('/help')} className="text-gray-400 hover:text-white">Help Centre</button></li>
                    <li><button onClick={() => navigate('/terms')} className="text-gray-400 hover:text-white">Terms of Service</button></li>
                    <li><button onClick={() => navigate('/privacy')} className="text-gray-400 hover:text-white">Privacy Policy</button></li>
                  </ul>
                </div>
              </div>
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold">Follow Us</h3>
                <div className="flex mt-4 space-x-4">
                  <a className="text-gray-400 hover:text-white" href="#" aria-label="Facebook">
                    <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                  <a className="text-gray-400 hover:text-white" href="#" aria-label="Twitter">
                    <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  <a className="text-gray-400 hover:text-white" href="#" aria-label="Instagram">
                    <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 2.525c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.147 2 12.315 2zm-1.002 3.705a1.18 1.18 0 10-2.36 0 1.18 1.18 0 002.36 0zm-2.47 3.396a4.116 4.116 0 118.232 0 4.116 4.116 0 01-8.232 0z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}