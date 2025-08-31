import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ProfileForm } from './components/profile/ProfileForm'
import { JobPostForm } from './components/jobs/JobPostForm'
import { JobFeed } from './components/jobs/JobFeed'
import { JobDetail } from './components/jobs/JobDetail'
import { PublicProfile } from './components/profile/PublicProfile'
import { LandingPage } from './components/landing/LandingPage'
import { ApplicationsList } from './components/applications/ApplicationsList'
import { PaymentStatus } from './components/payments/PaymentStatus'
import { EnhancedAdminDashboard } from './components/admin/EnhancedAdminDashboard'
import { AvailabilityCalendar } from './components/availability/AvailabilityCalendar'
import { EnhancedNavigation } from './components/layout/EnhancedNavigation'
import MobileNavigation from './components/layout/MobileNavigation'
import { EnhancedTradieDashboard } from './components/dashboard/EnhancedTradieDashboard'
import { EnhancedHelperDashboard } from './components/dashboard/EnhancedHelperDashboard'
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary'
import './App.css'


function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">TradieHelper</h1>
          <p className="mt-2 text-gray-600">Connect tradies with reliable helpers</p>
        </div>
        
        {isLogin ? (
          <LoginForm
            onSuccess={() => window.location.reload()}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
            onSuccess={() => window.location.reload()}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  )
}

function ApplicationsListWrapper() {
  const { profile } = useAuth()
  return <ApplicationsList viewType={profile?.role === 'tradie' ? 'tradie' : 'helper'} />
}

function AvailabilityWrapper() {
  const { user } = useAuth()
  return (
    <div>
      <EnhancedNavigation />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">My Availability</h2>
        <AvailabilityCalendar helperId={user?.id || ''} editable={true} />
      </div>
    </div>
  )
}

function Dashboard() {
  const { profile } = useAuth()

  if (!profile?.full_name) {
    return (
      <div>
        <EnhancedNavigation />
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
          <ProfileForm onSuccess={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  if (profile.role === 'tradie') {
    return <EnhancedTradieDashboard />
  }

  if (profile.role === 'helper') {
    return <EnhancedHelperDashboard />
  }

  // Default fallback for other roles
  return (
    <div>
      <EnhancedNavigation />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name}!
          </h2>
          <p className="text-gray-600 mt-2">
            Your dashboard is loading...
          </p>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Landing Page */}
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Authentication */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Job Detail - Public access */}
            <Route path="/jobs/:id" element={<JobDetail />} />
            
            {/* Public Profile - Public access */}
            <Route path="/users/:id" element={<PublicProfile />} />
            <Route path="/tradies/:id" element={<PublicProfile />} />
            <Route path="/helpers/:id" element={<PublicProfile />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                  <MobileNavigation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-4xl mx-auto mobile-container">
                      <ProfileForm />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/post"
              element={
                <ProtectedRoute requiredRole="tradie">
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-4xl mx-auto mobile-container">
                      <JobPostForm onSuccess={() => window.location.href = '/'} />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <div className="mobile-container">
                      <JobFeed />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-6xl mx-auto mobile-container">
                      <ApplicationsListWrapper />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-6xl mx-auto mobile-container">
                      <PaymentStatus />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <ProtectedRoute requiredRole="helper">
                  <AvailabilityWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <EnhancedNavigation />
                    <EnhancedAdminDashboard />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  </GlobalErrorBoundary>
  )
}

export default App