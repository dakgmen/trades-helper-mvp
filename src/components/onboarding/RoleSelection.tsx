import React from 'react'
import { useNavigate } from 'react-router-dom'

interface RoleSelectionProps {
  onRoleSelect: (role: 'tradie' | 'helper') => void
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  const navigate = useNavigate()

  const handleRoleSelect = (role: 'tradie' | 'helper') => {
    onRoleSelect(role)
    navigate(`/onboarding/${role}`)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50 text-gray-800">
      <header className="w-full px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.43L19.57 8.5L12 12.57L4.43 8.5L12 4.43ZM4 9.87L11 13.92V19.97L4 15.9V9.87Z"></path>
            </svg>
            <span className="text-2xl font-bold tracking-tight">TradieHelper</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors" href="#">About Us</a>
            <a className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors" href="#">Contact</a>
            <a className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors" href="#">Help</a>
          </div>
          <div className="flex items-center gap-4">
            <a className="px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" href="/auth">Log In</a>
            <a className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" href="/auth">Sign Up</a>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-12 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4">
              Welcome to <span className="text-blue-600">TradieHelper</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-12">
              Australia's leading platform for matching skilled tradies with reliable helpers. <br/>Let's get you started.
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">Tell us who you are</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div 
                className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => handleRoleSelect('tradie')}
              >
                <div className="mb-6">
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">I'm a Tradie</h3>
                <p className="text-gray-600 mb-6 text-center">Find your next project or hire a skilled helper to get the job done.</p>
                <button className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300">
                  Start as a Tradie
                </button>
              </div>

              <div 
                className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => handleRoleSelect('helper')}
              >
                <div className="mb-6">
                  <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">I'm a Helper</h3>
                <p className="text-gray-600 mb-6 text-center">Discover job opportunities and get to work with experienced tradies.</p>
                <button className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300">
                  Start as a Helper
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}