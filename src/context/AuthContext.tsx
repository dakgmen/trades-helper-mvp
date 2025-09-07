import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, role: 'tradie' | 'helper') => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  clearAuthState: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchAttempts, setFetchAttempts] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    // Circuit breaker: prevent excessive retry attempts
    const attempts = fetchAttempts.get(userId) || 0
    if (attempts >= 3) {
      console.warn('⚡ AuthContext: Max fetch attempts reached for user:', userId, 'using fallback profile')
      setProfile(getFallbackProfile(userId))
      return
    }

    try {
      console.log('👤 AuthContext: Fetching profile for user:', userId, 'attempt:', attempts + 1)
      setFetchAttempts(new Map(fetchAttempts.set(userId, attempts + 1)))
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // 10 second timeout
      })
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const result = await Promise.race([profilePromise, timeoutPromise])
      const { data, error } = result as { data: UserProfile | null, error: Error | null }

      if (error) {
        if ('code' in error && error.code === 'PGRST116') {
          console.log('⚠️ AuthContext: No profile found, creating default profile')
          
          // Create default profile with timeout protection
          try {
            const createPromise = supabase
              .from('profiles')
              .insert({
                id: userId,
                role: 'tradie',
              })
              .select()
              .single()
              
            const createTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
            })
              
            const result = await Promise.race([createPromise, createTimeoutPromise])
            const { data: newProfile, error: createError } = result as { data: UserProfile | null, error: Error | null }
            
            if (createError) {
              console.error('❌ AuthContext: Failed to create profile:', createError)
              // Set fallback profile to prevent infinite loops
              setProfile(getFallbackProfile(userId))
            } else {
              console.log('✅ AuthContext: Profile created successfully')
              setProfile(newProfile)
            }
          } catch (createError) {
            console.error('💥 AuthContext: Profile creation failed:', createError)
            // Set fallback profile to prevent infinite loops
            setProfile(getFallbackProfile(userId))
          }
        } else {
          console.error('❌ AuthContext: Profile fetch error:', error)
          // Set fallback profile for other errors too
          setProfile(getFallbackProfile(userId))
        }
        return
      }

      if (data) {
        console.log('✅ AuthContext: Profile loaded successfully')
        setProfile(data)
        // Reset fetch attempts on success
        setFetchAttempts(new Map(fetchAttempts.set(userId, 0)))
      } else {
        console.log('⚠️ AuthContext: No profile data returned, using fallback')
        setProfile(getFallbackProfile(userId))
      }
    } catch (error) {
      console.error('💥 AuthContext: Profile fetch exception:', error)
      // Always set a fallback profile to prevent the app from getting stuck
      setProfile(getFallbackProfile(userId))
    }
  }, [fetchAttempts])

  // Helper function to create a fallback profile
  const getFallbackProfile = (userId: string): UserProfile => ({
    id: userId,
    role: 'tradie',
    full_name: null,
    phone: null,
    bio: null,
    skills: null,
    white_card_url: null,
    id_document_url: null,
    avatar_url: null,
    verified: false,
    latitude: null,
    longitude: null,
    location_address: null,
    stripe_account_id: null,
    push_token: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  const signUp = async (email: string, password: string, role: 'tradie' | 'helper') => {
    try {
      setLoading(true)
      console.log('📝 AuthContext: Starting signUp for', email, 'as', role)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('🚫 AuthContext: SignUp error:', error.message)
        return { error }
      }

      console.log('✅ AuthContext: User created:', data.user?.email)

      if (data.user) {
        console.log('👤 AuthContext: Creating profile for user:', data.user.id)
        // Create profile after successful signup
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role,
          })
          .select()

        if (profileError) {
          console.error('❌ AuthContext: Profile creation error:', profileError)
        } else {
          console.log('✅ AuthContext: Profile created successfully:', profileData)
        }
      }

      return { error: null }
    } catch (error) {
      console.error('💥 AuthContext: SignUp exception:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔍 AuthContext: Starting signIn for', email)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('🚫 AuthContext: SignIn error:', error.message)
      } else {
        console.log('✅ AuthContext: SignIn successful')
      }
      
      return { error }
    } catch (error) {
      console.error('💥 AuthContext: SignIn exception:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { error: new Error(error.message) }
      }

      // Refetch profile to update local state
      await fetchProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const clearAuthState = async () => {
    console.log('🔄 AuthContext: Clearing all authentication state')
    try {
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)
      setFetchAttempts(new Map())
      
      // Clear browser storage
      localStorage.clear()
      sessionStorage.clear()
      
      console.log('✅ AuthContext: Authentication state cleared successfully')
    } catch (error) {
      console.error('❌ AuthContext: Failed to clear auth state:', error)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    clearAuthState,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}