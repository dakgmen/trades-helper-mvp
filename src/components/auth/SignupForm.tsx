import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { TermsAndConditions } from '../legal/TermsAndConditions'

interface SignupFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signUp, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'tradie' | 'helper'>('helper')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleReset = async () => {
    console.log('🔄 Clearing cached authentication state')
    setError(null)
    await signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!termsAccepted) {
      setShowTerms(true)
      return
    }

    setLoading(true)
    setError(null)

    // Add timeout protection
    const signupTimeout = setTimeout(() => {
      console.log('⏰ Signup timeout - resetting state')
      setLoading(false)
      setError('Signup timed out. Try clicking "Clear & Reset" and try again.')
    }, 15000)
    
    try {
      const { error: authError } = await signUp(email, password, role)
      clearTimeout(signupTimeout)

      if (authError) {
        setError(authError.message)
      } else {
        onSuccess?.()
      }
    } catch (error) {
      clearTimeout(signupTimeout)
      console.error('💥 Signup exception:', error)
      setError('Signup failed. Try clicking "Clear & Reset" and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTermsAccept = async () => {
    setTermsAccepted(true)
    setShowTerms(false)
    // Store consent record (you can extend this to call an API)
    const consentData = {
      termsVersion: '1.0',
      ipAddress: 'unknown', // You'd get this from API
      userAgent: navigator.userAgent,
      consentedAt: new Date().toISOString()
    }
    localStorage.setItem('termsConsent', JSON.stringify(consentData))
  }

  const handleTermsDecline = () => {
    setShowTerms(false)
    setTermsAccepted(false)
  }

  if (showTerms) {
    return (
      <TermsAndConditions
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
        isRequired={true}
      />
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            I am a
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'tradie' | 'helper')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="helper">Helper (Looking for work)</option>
            <option value="tradie">Tradie (Posting jobs)</option>
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => e.target.checked ? setShowTerms(true) : setTermsAccepted(false)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Terms and Conditions
            </button>
            {termsAccepted && (
              <span className="ml-2 text-green-600 font-medium">✓ Accepted</span>
            )}
          </label>
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          {(error || loading) && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full flex justify-center py-1 px-3 border border-red-300 rounded-md text-xs font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear & Reset
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  )
}