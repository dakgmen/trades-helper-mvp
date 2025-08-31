import React, { createContext, useContext, useEffect, useState } from 'react'
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
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 AuthContext: Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ AuthContext: No profile found, creating default profile')
          
          // Create default profile immediately without setTimeout
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                role: 'tradie',
              })
              .select()
              .single()
              
            if (createError) {
              console.error('❌ AuthContext: Failed to create profile:', createError)
              // Set fallback profile to prevent infinite loops
              setProfile({ 
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
            } else {
              console.log('✅ AuthContext: Profile created successfully')
              setProfile(newProfile)
            }
          } catch (createError) {
            console.error('💥 AuthContext: Profile creation failed:', createError)
            // Set fallback profile to prevent infinite loops
            setProfile({ 
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
          }
        } else {
          console.error('❌ AuthContext: Profile fetch error:', error)
        }
        return
      }

      if (data) {
        console.log('✅ AuthContext: Profile loaded successfully')
        setProfile(data)
      } else {
        console.log('⚠️ AuthContext: No profile data returned')
      }
    } catch (error) {
      console.error('💥 AuthContext: Profile fetch exception:', error)
    }
  }

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

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}