import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface AuthLandingPageProps {
  onSuccess?: () => void
}

export const AuthLandingPage: React.FC<AuthLandingPageProps> = ({ onSuccess }) => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔐 Login attempt started for:', email)
    
    try {
      const { error: authError } = await signIn(email, password)

      if (authError) {
        console.error('❌ Login failed:', authError.message)
        setError(authError.message)
      } else {
        console.log('✅ Login successful')
        onSuccess?.()
      }
    } catch (error) {
      console.error('💥 Login exception:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden" 
         style={{
           fontFamily: '"Work Sans", "Noto Sans", sans-serif',
           '--primary-color': '#2563EB',
           '--secondary-color': '#16A34A',
           '--accent-color': '#EA580C',
           '--neutral-text': '#374151',
           '--neutral-bg': '#F9FAFB'
         } as React.CSSProperties}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap bg-white px-4 sm:px-10 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-[var(--primary-color)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">TradieHelper</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-base font-medium text-gray-600 hover:text-[var(--primary-color)] transition-colors" href="#">Find Work</a>
            <a className="text-base font-medium text-gray-600 hover:text-[var(--primary-color)] transition-colors" href="#">Post a Job</a>
            <a className="text-base font-medium text-gray-600 hover:text-[var(--primary-color)] transition-colors" href="#">About Us</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="flex min-w-[90px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-white text-[var(--primary-color)] border border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white text-sm font-bold leading-normal tracking-wide transition-all duration-300">
              <span className="truncate">Log In</span>
            </button>
            <button className="flex min-w-[90px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-[var(--primary-color)] text-white hover:bg-blue-700 text-sm font-bold leading-normal tracking-wide transition-colors">
              <span className="truncate">Sign Up</span>
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dbeafe' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: 'var(--neutral-bg)'
              }}>
          <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
            <div>
              <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
              <p className="mt-2 text-center text-base text-gray-600">Connect tradies with reliable helpers</p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <input name="remember" type="hidden" value={rememberMe.toString()} />
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label className="sr-only" htmlFor="email-address">Email address</label>
                  <input 
                    autoComplete="email" 
                    className="relative block w-full appearance-none rounded-t-md border border-gray-300 px-3 py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm" 
                    id="email-address" 
                    name="email" 
                    placeholder="Email address" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="password">Password</label>
                  <input 
                    autoComplete="current-password" 
                    className="relative block w-full appearance-none rounded-b-md border border-gray-300 px-3 py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm" 
                    id="password" 
                    name="password" 
                    placeholder="Password" 
                    required 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" 
                    id="remember-me" 
                    name="remember-me" 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="ml-2 block text-sm text-gray-900" htmlFor="remember-me"> Remember me </label>
                </div>
                <div className="text-sm">
                  <a className="font-medium text-[var(--primary-color)] hover:text-blue-700" href="#"> Forgot your password? </a>
                </div>
              </div>
              
              <div>
                <button 
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-[var(--primary-color)] py-3 px-4 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 transition-colors disabled:opacity-50" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
              </div>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?
              <a className="font-medium text-[var(--primary-color)] hover:text-blue-700" href="#"> Sign up for free </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AuthLandingPage