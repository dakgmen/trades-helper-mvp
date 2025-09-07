import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import { PricingPage } from './components/marketing/PricingPage'
import { AboutPage } from './components/marketing/AboutPage'
import { ContactPage } from './components/marketing/ContactPage'
import { FeaturesPage } from './components/marketing/FeaturesPage'
import { HowItWorksPage } from './components/marketing/HowItWorksPage'
import { HelpCenterPage } from './components/marketing/HelpCenterPage'
import { EmailTestComponent } from './components/testing/EmailTestComponent'
import { PaymentStatus } from './components/payments/PaymentStatus'
import { EnhancedAdminDashboard } from './components/admin/EnhancedAdminDashboard'
import { AdminDashboardOverview } from './components/admin/AdminDashboardOverview'
import { AdminUserManagement } from './components/admin/AdminUserManagement'
import { AdminJobManagement } from './components/admin/AdminJobManagement'
import { AdminPaymentManagement } from './components/admin/AdminPaymentManagement'
import { AdminDisputeManagement } from './components/admin/AdminDisputeManagement'
import { AvailabilityCalendar } from './components/availability/AvailabilityCalendar'
import { EnhancedNavigation } from './components/layout/EnhancedNavigation'
import MobileNavigation from './components/layout/MobileNavigation'
import { EnhancedTradieDashboard } from './components/dashboard/EnhancedTradieDashboard'
import { EnhancedHelperDashboard } from './components/dashboard/EnhancedHelperDashboard'
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary'
import { MyJobsPage } from './components/jobs/MyJobsPage'
import { MessagingDashboard } from './components/messages/MessagingDashboard'
import { SystemSettings } from './components/settings/SystemSettings'
import { ApplicationManagement } from './components/applications/ApplicationManagement'
import { AuthLandingPage } from './components/auth/AuthLandingPage'
import { ApplicationReview } from './components/applications/ApplicationReview'
import { RoleSelection } from './components/onboarding/RoleSelection'
import { DetailedJobView } from './components/jobs/DetailedJobView'
import { FinancialDashboard } from './components/financial/FinancialDashboard'
import { BookingConfirmation } from './components/booking/BookingConfirmation'
import { ScheduleOverview } from './components/scheduling/ScheduleOverview'
import { EnhancedMessagingDashboard } from './components/messages/EnhancedMessagingDashboard'
import { TrustAndSafetyHub } from './components/safety/TrustAndSafetyHub'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
// New High-Priority Components
import { JobManagementDashboard } from './components/jobs/JobManagementDashboard'
import { FeeBreakdownPage } from './components/payments/FeeBreakdownPage'
import { JobReviewInterface } from './components/jobs/JobReviewInterface'
import { ReviewDisplaySystem } from './components/reviews/ReviewDisplaySystem'
import { CommunicationPreferences } from './components/settings/CommunicationPreferences'
import { SupportTicketSystem } from './components/support/SupportTicketSystem'
import { FraudDetectionDashboard } from './components/security/FraudDetectionDashboard'
import { DisputeResolutionInterface } from './components/disputes/DisputeResolutionInterface'
import { EmergencyInterface } from './components/safety/EmergencyInterface'
import { JobMatchingEngine } from './components/matching/JobMatchingEngine'
import { ApplicationHistoryView } from './components/applications/ApplicationHistoryView'
import { EnhancedUserManagement } from './components/admin/EnhancedUserManagement'
// New Gap-Filling Components
import SkillsAssessmentInterface from './components/skills/SkillsAssessmentInterface'
import AdvancedJobMatchingEngine from './components/matching/AdvancedJobMatchingEngine'
import MobileJobApplication from './components/mobile/MobileJobApplication'
import PerformanceAnalyticsDashboard from './components/analytics/PerformanceAnalyticsDashboard'
import VideoCallInterface from './components/communication/VideoCallInterface'
import OfflineModeSupport from './components/offline/OfflineModeSupport'
import MultiLanguageInterface from './components/localization/MultiLanguageInterface'
import './App.css'


function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleAuthSuccess = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">TradieHelper</h1>
          <p className="mt-2 text-gray-600">Connect tradies with reliable helpers</p>
        </div>
        
        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  )
}

// Removed unused ApplicationsListWrapper - replaced with new ApplicationManagement component

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

function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If user is authenticated, show dashboard
  if (user) {
    return (
      <div>
        <Dashboard />
        <MobileNavigation />
      </div>
    )
  }

  // If not authenticated, show landing page
  return <LandingPage />
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Home Page - Shows Landing Page or Dashboard based on auth state */}
            <Route path="/" element={<HomePage />} />
            
            {/* Public Landing Page */}
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Public Marketing Pages */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/test-email" element={<EmailTestComponent />} />
            
            {/* Authentication */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/signin" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/auth-landing" element={<AuthLandingPage onSuccess={() => window.location.href = '/dashboard'} />} />
            <Route path="/onboarding" element={<RoleSelection onRoleSelect={(role) => console.log('Selected role:', role)} />} />
            
            {/* Job Detail - Public access */}
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/detail/:id" element={
              <DetailedJobView
                jobId=""
                onApply={(jobId) => console.log('Apply to job:', jobId)}
                onSave={(jobId) => console.log('Save job:', jobId)}
              />
            } />
            
            {/* Public Profile - Public access */}
            <Route path="/users/:id" element={<PublicProfile />} />
            <Route path="/tradies/:id" element={<PublicProfile />} />
            <Route path="/helpers/:id" element={<PublicProfile />} />
            
            {/* Dashboard Route - Protected */}
            <Route
              path="/dashboard"
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
                      <JobPostForm onSuccess={() => window.location.href = '/dashboard'} />
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
                  <ApplicationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/review/:id"
              element={
                <ProtectedRoute>
                  <ApplicationReview
                    onAccept={(id) => console.log('Accept application:', id)}
                    onDecline={(id) => console.log('Decline application:', id)}
                    onMessage={(id) => console.log('Message applicant:', id)}
                    onCall={(id) => console.log('Call applicant:', id)}
                  />
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
              path="/financial"
              element={
                <ProtectedRoute>
                  <FinancialDashboard />
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
            <Route
              path="/admin/overview"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-7xl mx-auto mobile-container">
                      <AdminDashboardOverview />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-7xl mx-auto mobile-container">
                      <AdminUserManagement />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-7xl mx-auto mobile-container">
                      <AdminJobManagement />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-7xl mx-auto mobile-container">
                      <AdminPaymentManagement />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-7xl mx-auto mobile-container">
                      <AdminDisputeManagement />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/my"
              element={
                <ProtectedRoute>
                  <MyJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-6xl mx-auto mobile-container">
                      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                      <div className="text-center py-12 text-gray-500">
                        Enhanced notification center coming soon...
                      </div>
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/confirmation/:id"
              element={
                <ProtectedRoute>
                  <BookingConfirmation 
                    booking={{
                      id: 'sample-booking',
                      tradieName: 'Alex Johnson',
                      tradieId: 'sample-tradie',
                      service: 'Plumbing Repair',
                      dateTime: '15 July 2024, 2:00 PM - 4:00 PM (AEST)',
                      location: '123 Main Street, Sydney, NSW',
                      estimatedCost: '$150 - $200 AUD',
                      tradiePhone: '0412 345 678',
                      tradieEmail: 'alex.johnson@email.com',
                      tradieRating: 4.8,
                      tradieReviews: 120
                    }}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <ScheduleOverview />
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/enhanced"
              element={
                <ProtectedRoute>
                  <EnhancedMessagingDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/safety" element={<TrustAndSafetyHub />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* New High-Priority Routes */}
            <Route
              path="/jobs/manage"
              element={
                <ProtectedRoute requiredRole="tradie">
                  <JobManagementDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/fees"
              element={
                <ProtectedRoute>
                  <FeeBreakdownPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/reviews"
              element={
                <ProtectedRoute>
                  <JobReviewInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews/:profileId?"
              element={
                <ProtectedRoute>
                  <div>
                    <EnhancedNavigation />
                    <div className="max-w-6xl mx-auto mobile-container">
                      <ReviewDisplaySystem />
                    </div>
                    <MobileNavigation />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/communication"
              element={
                <ProtectedRoute>
                  <CommunicationPreferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <SupportTicketSystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security"
              element={
                <ProtectedRoute requiredRole="admin">
                  <FraudDetectionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disputes"
              element={
                <ProtectedRoute>
                  <DisputeResolutionInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency"
              element={
                <ProtectedRoute>
                  <EmergencyInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/matching"
              element={
                <ProtectedRoute requiredRole="helper">
                  <JobMatchingEngine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/history"
              element={
                <ProtectedRoute>
                  <ApplicationHistoryView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EnhancedUserManagement />
                </ProtectedRoute>
              }
            />

            {/* New Gap-Filling Routes */}
            <Route
              path="/skills/assessment"
              element={
                <ProtectedRoute>
                  <SkillsAssessmentInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/matching/advanced"
              element={
                <ProtectedRoute requiredRole="helper">
                  <AdvancedJobMatchingEngine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mobile/application/:jobId"
              element={
                <ProtectedRoute>
                  <MobileJobApplication 
                    onBack={() => window.history.back()}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/performance"
              element={
                <ProtectedRoute>
                  <PerformanceAnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication/video/:jobId/:participantId"
              element={
                <ProtectedRoute>
                  <VideoCallInterface 
                    jobId=""
                    participantId=""
                    onCallEnd={() => window.history.back()}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offline/sync"
              element={
                <ProtectedRoute>
                  <OfflineModeSupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/language"
              element={
                <ProtectedRoute>
                  <MultiLanguageInterface />
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