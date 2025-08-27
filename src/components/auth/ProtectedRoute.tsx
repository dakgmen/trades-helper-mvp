import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'tradie' | 'helper' | 'admin'
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/auth'
}) => {
  const { user, profile, loading } = useAuth()

  console.log('🛡️ ProtectedRoute: Auth state check', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    profileRole: profile?.role,
    profileFullName: profile?.full_name,
    requiredRole
  })

  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading auth state')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    console.log('🚫 ProtectedRoute: No user, redirecting to', redirectTo)
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    console.log('🚫 ProtectedRoute: Role mismatch, redirecting to /unauthorized')
    return <Navigate to="/unauthorized" replace />
  }

  console.log('✅ ProtectedRoute: Access granted')
  return <>{children}</>
}