export interface UserProfile {
  id: string
  role: 'tradie' | 'helper' | 'admin'
  full_name: string | null
  phone: string | null
  bio: string | null
  skills: string[] | null
  white_card_url: string | null
  id_document_url: string | null
  verified: boolean
  latitude: number | null
  longitude: number | null
  location_address: string | null
  stripe_account_id: string | null
  push_token: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  tradie_id: string
  title: string
  description: string | null
  location: string
  latitude: number
  longitude: number
  date_time: string
  duration_hours: number
  pay_rate: number
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_helper_id: string | null
  required_skills: string[] | null
  urgency: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export interface JobApplication {
  id: string
  job_id: string
  helper_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  job_id: string
  tradie_id: string
  helper_id: string
  amount: number
  status: 'pending' | 'escrow' | 'released' | 'refunded'
  stripe_payment_id: string | null
  stripe_transfer_id: string | null
  escrow_hold_id: string | null
  created_at: string
  updated_at: string
  released_at: string | null
  refunded_at: string | null
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

// File upload interfaces
export interface FileUpload {
  id: string
  user_id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  category: 'profile_image' | 'white_card' | 'id_document' | 'job_image' | 'other'
  created_at: string
}

// Notification interfaces
export interface NotificationPreferences {
  push_enabled: boolean
  email_enabled: boolean
  job_notifications: boolean
  application_notifications: boolean
  payment_notifications: boolean
  message_notifications: boolean
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'job' | 'application' | 'payment' | 'message' | 'system'
  read: boolean
  data?: Record<string, any>
  created_at: string
}

// Geolocation interfaces
export interface LocationData {
  latitude: number
  longitude: number
  address?: string
  accuracy?: number
}

export interface JobMatch {
  job: Job
  distance: number
  score: number
  matching_skills: string[]
}

// Stripe Connect interfaces
export interface StripeConnectAccount {
  id: string
  user_id: string
  stripe_account_id: string
  account_status: 'pending' | 'active' | 'restricted' | 'rejected'
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  created_at: string
  updated_at: string
}

export type UserRole = 'tradie' | 'helper' | 'admin'
export type JobStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type PaymentStatus = 'pending' | 'escrow' | 'released' | 'refunded'
export type JobUrgency = 'low' | 'medium' | 'high'
export type FileCategory = 'profile_image' | 'white_card' | 'id_document' | 'job_image' | 'other'
export type NotificationType = 'job' | 'application' | 'payment' | 'message' | 'system'