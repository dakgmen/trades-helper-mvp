import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ProfileForm } from './components/profile/ProfileForm'
import { JobPostForm } from './components/jobs/JobPostForm'
import { JobFeed } from './components/jobs/JobFeed'
import { ApplicationsList } from './components/applications/ApplicationsList'
import { PaymentStatus } from './components/payments/PaymentStatus'
import { AdminDashboard } from './components/admin/AdminDashboard'
import './App.css'

function Navigation() {
  const { user, profile, signOut } = useAuth()

  if (!user) return null

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">TradieHelper</h1>
            <div className="hidden md:flex space-x-4">
              {profile?.role === 'tradie' && (
                <>
                  <a href="/jobs/my" className="text-gray-700 hover:text-blue-600">My Jobs</a>
                  <a href="/jobs/post" className="text-gray-700 hover:text-blue-600">Post Job</a>
                  <a href="/applications" className="text-gray-700 hover:text-blue-600">Applications</a>
                </>
              )}
              {profile?.role === 'helper' && (
                <>
                  <a href="/jobs" className="text-gray-700 hover:text-blue-600">Find Jobs</a>
                  <a href="/applications" className="text-gray-700 hover:text-blue-600">My Applications</a>
                </>
              )}
              <a href="/payments" className="text-gray-700 hover:text-blue-600">Payments</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {profile?.full_name || user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

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

function Dashboard() {
  const { profile } = useAuth()

  if (!profile?.full_name) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
        <ProfileForm onSuccess={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile.full_name}!
        </h2>
        <p className="text-gray-600 mt-2">
          {profile.role === 'tradie' 
            ? 'Manage your jobs and find reliable helpers' 
            : 'Find jobs that match your skills'}
        </p>
      </div>

      {profile.role === 'tradie' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/jobs/post"
                className="block p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                Post New Job
              </a>
              <a
                href="/applications"
                className="block p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
              >
                View Applications
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <ApplicationsList viewType="tradie" />
          </div>
        </div>
      ) : (
        <div>
          <JobFeed userRole="helper" />
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>
                    <Navigation />
                    <Dashboard />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>
                    <Navigation />
                    <div className="max-w-4xl mx-auto p-6">
                      <ProfileForm />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/post"
              element={
                <ProtectedRoute requiredRole="tradie">
                  <div>
                    <Navigation />
                    <div className="max-w-4xl mx-auto p-6">
                      <JobPostForm onSuccess={() => window.location.href = '/'} />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <div>
                    <Navigation />
                    <JobFeed />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <div>
                    <Navigation />
                    <div className="max-w-6xl mx-auto p-6">
                      <ApplicationsListWrapper />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <div>
                    <Navigation />
                    <div className="max-w-6xl mx-auto p-6">
                      <PaymentStatus />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <Navigation />
                    <AdminDashboard />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App