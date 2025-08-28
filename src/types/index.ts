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

// Phase 2: Trust & Safety - Reviews & Ratings
export interface Review {
  id: string
  job_id: string
  reviewer_id: string  // tradie or helper
  reviewee_id: string  // tradie or helper
  rating: number      // 1-5
  comment: string | null
  reviewer_type: 'tradie' | 'helper'
  created_at: string
  updated_at: string
}

export interface AggregateRating {
  user_id: string
  total_reviews: number
  average_rating: number
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
}

// Phase 2: Dispute Resolution
export interface Dispute {
  id: string
  job_id: string
  raised_by_id: string
  against_id: string
  reason: string
  description: string
  status: 'open' | 'in_review' | 'resolved' | 'dismissed'
  admin_notes: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  resolved_by_admin_id: string | null
}

export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'dismissed'
export type DisputeReason = 'payment' | 'work_quality' | 'no_show' | 'safety' | 'communication' | 'other'

// Phase 2: Terms & Conditions
export interface TermsConsent {
  id: string
  user_id: string
  terms_version: string
  consent_given: boolean
  ip_address: string
  user_agent: string
  created_at: string
}

// Phase 3: Enhanced Stripe Connect
export interface StripeKYCStatus {
  user_id: string
  stripe_account_id: string
  requirements_due: string[]
  currently_due: string[]
  eventually_due: string[]
  past_due: string[]
  pending_verification: string[]
  disabled_reason: string | null
  charges_enabled: boolean
  payouts_enabled: boolean
  updated_at: string
}

// Phase 3: Enhanced Payments
export interface PaymentTransaction {
  id: string
  payment_id: string
  type: 'charge' | 'transfer' | 'refund' | 'fee'
  amount: number
  platform_fee: number
  stripe_fee: number
  net_amount: number
  stripe_transaction_id: string
  created_at: string
}

// Phase 4: Referral System
export interface Referral {
  id: string
  referrer_id: string
  referee_id: string
  referral_code: string
  status: 'pending' | 'completed' | 'expired'
  reward_amount: number | null
  reward_granted: boolean
  created_at: string
  completed_at: string | null
}

// Phase 4: Availability Calendar
export interface Availability {
  id: string
  helper_id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  booking_id: string | null
  recurring_pattern: 'none' | 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
}

// Phase 4: Job Categories
export interface JobCategory {
  id: string
  name: string
  description: string | null
  parent_category_id: string | null
  skills_required: string[]
  is_active: boolean
  created_at: string
}

// Phase 4: Badge System
export interface Badge {
  id: string
  name: string
  description: string
  icon_url: string | null
  criteria: Record<string, any>  // JSON criteria for earning badge
  is_active: boolean
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  criteria_met: Record<string, any>
}

// Phase 5: Support System
export interface SupportTicket {
  id: string
  user_id: string
  job_id: string | null
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: 'payment' | 'technical' | 'account' | 'safety' | 'other'
  assigned_admin_id: string | null
  admin_notes: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: 'user' | 'admin'
  message: string
  attachments: string[]
  created_at: string
}

// Phase 5: Analytics
export interface SystemMetrics {
  date: string
  total_users: number
  active_users: number
  new_registrations: number
  jobs_posted: number
  jobs_completed: number
  total_payments: number
  average_job_value: number
  platform_revenue: number
  user_retention_rate: number
}

export interface FraudAlert {
  id: string
  user_id: string
  job_id: string | null
  alert_type: 'fake_job' | 'payment_fraud' | 'identity_fraud' | 'suspicious_behavior'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  auto_detected: boolean
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive'
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

// Enhanced type unions
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type SupportTicketCategory = 'payment' | 'technical' | 'account' | 'safety' | 'other'
export type BadgeCriteria = 'jobs_completed' | 'high_rating' | 'referrals_made' | 'years_active' | 'skills_verified'
export type ReferralStatus = 'pending' | 'completed' | 'expired'
export type AvailabilityPattern = 'none' | 'daily' | 'weekly' | 'monthly'
export type FraudAlertType = 'fake_job' | 'payment_fraud' | 'identity_fraud' | 'suspicious_behavior'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'