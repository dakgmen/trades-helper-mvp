import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Add timeout configuration for better reliability
    timeout: 30000, // 30 second timeout
  },
  db: {
    // Add database timeout configuration  
    timeout: 20000, // 20 second timeout for database operations
  },
  global: {
    headers: {
      'x-client': 'tradie-helper-app',
    },
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'tradie' | 'helper'
          full_name: string | null
          phone: string | null
          bio: string | null
          skills: string[] | null
          white_card_url: string | null
          id_document_url: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'tradie' | 'helper'
          full_name?: string | null
          phone?: string | null
          bio?: string | null
          skills?: string[] | null
          white_card_url?: string | null
          id_document_url?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'tradie' | 'helper'
          full_name?: string | null
          phone?: string | null
          bio?: string | null
          skills?: string[] | null
          white_card_url?: string | null
          id_document_url?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          tradie_id: string
          title: string
          description: string | null
          location: string
          date_time: string
          duration_hours: number
          pay_rate: number
          status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          assigned_helper_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tradie_id: string
          title: string
          description?: string | null
          location: string
          date_time: string
          duration_hours: number
          pay_rate: number
          status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          assigned_helper_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tradie_id?: string
          title?: string
          description?: string | null
          location?: string
          date_time?: string
          duration_hours?: number
          pay_rate?: number
          status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          assigned_helper_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          job_id: string
          helper_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          helper_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          helper_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          job_id: string
          tradie_id: string
          helper_id: string
          amount: number
          status: 'pending' | 'escrow' | 'released' | 'refunded'
          stripe_payment_id: string | null
          created_at: string
          updated_at: string
          released_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          tradie_id: string
          helper_id: string
          amount: number
          status?: 'pending' | 'escrow' | 'released' | 'refunded'
          stripe_payment_id?: string | null
          created_at?: string
          updated_at?: string
          released_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          tradie_id?: string
          helper_id?: string
          amount?: number
          status?: 'pending' | 'escrow' | 'released' | 'refunded'
          stripe_payment_id?: string | null
          created_at?: string
          updated_at?: string
          released_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          job_id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}