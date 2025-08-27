import type { User, UserMetadata } from '@supabase/supabase-js'

export type UserRole = 'tradie' | 'helper' | 'admin'

export interface AuthUser extends User {
  user_metadata: UserMetadata & {
    role?: UserRole
    full_name?: string
    phone?: string
  }
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
}

export interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateProfile: (data: Partial<AuthUser['user_metadata']>) => Promise<{ error: Error | null }>
}

export interface SignUpData {
  full_name: string
  role: UserRole
  phone?: string
}