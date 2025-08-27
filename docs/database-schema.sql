-- Tradie Helper Database Schema
-- Two-sided marketplace connecting tradies with helpers
-- Built for Supabase with PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types for better data integrity
CREATE TYPE user_role AS ENUM ('tradie', 'helper', 'admin');
CREATE TYPE job_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE payment_status AS ENUM ('pending', 'escrow', 'released', 'refunded', 'disputed');
CREATE TYPE admin_action_type AS ENUM ('verify_user', 'reject_verification', 'resolve_dispute', 'refund_payment', 'ban_user', 'unban_user');

-- ============================================================================
-- PROFILES TABLE - Core user profiles with role-based data
-- ============================================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  skills TEXT[], -- Array of skill tags like ['site-prep', 'material-handling']
  avatar_url TEXT,
  -- Verification documents (stored in Supabase Storage)
  white_card_url TEXT,
  id_document_url TEXT,
  -- Verification status
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  -- Location data for job matching
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_point GEOMETRY(POINT, 4326), -- PostGIS point for spatial queries
  -- Profile metrics
  jobs_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  -- Status and timestamps
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JOBS TABLE - Job postings from tradies
-- ============================================================================
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tradie_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Job details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Location and scheduling
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_point GEOMETRY(POINT, 4326), -- PostGIS point for spatial queries
  date_time TIMESTAMPTZ NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL CHECK (duration_hours > 0),
  
  -- Payment
  pay_rate DECIMAL(8, 2) NOT NULL CHECK (pay_rate > 0),
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (pay_rate * duration_hours) STORED,
  
  -- Job lifecycle
  status job_status DEFAULT 'open',
  assigned_helper_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  requirements TEXT[],
  tools_provided BOOLEAN DEFAULT FALSE,
  transport_provided BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_time CHECK (date_time > NOW()),
  CONSTRAINT valid_assignment CHECK (
    (status = 'assigned' AND assigned_helper_id IS NOT NULL) OR
    (status != 'assigned')
  ),
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed')
  )
);

-- ============================================================================
-- JOB_APPLICATIONS TABLE - Helper applications to jobs
-- ============================================================================
CREATE TABLE job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Application details
  status application_status DEFAULT 'pending',
  message TEXT, -- Optional message from helper
  
  -- Response from tradie
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(job_id, helper_id), -- One application per helper per job
  CONSTRAINT no_self_application CHECK (
    helper_id != (SELECT tradie_id FROM jobs WHERE id = job_id)
  )
);

-- ============================================================================
-- PAYMENTS TABLE - Escrow payment system
-- ============================================================================
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  tradie_id UUID NOT NULL REFERENCES profiles(id),
  helper_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Payment amounts
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  platform_fee DECIMAL(8, 2) DEFAULT 0,
  helper_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount - platform_fee) STORED,
  
  -- Payment status and processing
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  escrowed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  
  -- Dispute handling
  dispute_reason TEXT,
  disputed_at TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_escrow_time CHECK (
    (status = 'escrow' AND escrowed_at IS NOT NULL) OR
    (status != 'escrow')
  ),
  CONSTRAINT valid_release_time CHECK (
    (status = 'released' AND released_at IS NOT NULL) OR
    (status != 'released')
  ),
  CONSTRAINT valid_platform_fee CHECK (platform_fee >= 0 AND platform_fee < amount)
);

-- ============================================================================
-- MESSAGES TABLE - Job-specific messaging
-- ============================================================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Message content
  content TEXT NOT NULL CHECK (LENGTH(content) > 0),
  
  -- Message metadata
  message_type VARCHAR(50) DEFAULT 'text',
  attachment_url TEXT,
  
  -- Status tracking
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_message CHECK (sender_id != receiver_id),
  CONSTRAINT valid_job_participants CHECK (
    sender_id IN (SELECT tradie_id FROM jobs WHERE id = job_id) OR
    sender_id IN (SELECT assigned_helper_id FROM jobs WHERE id = job_id) OR
    receiver_id IN (SELECT tradie_id FROM jobs WHERE id = job_id) OR
    receiver_id IN (SELECT assigned_helper_id FROM jobs WHERE id = job_id)
  )
);

-- ============================================================================
-- ADMIN_ACTIONS TABLE - Audit trail for admin activities
-- ============================================================================
CREATE TABLE admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type admin_action_type NOT NULL,
  
  -- Target information
  target_user_id UUID REFERENCES profiles(id),
  target_job_id UUID REFERENCES jobs(id),
  target_payment_id UUID REFERENCES payments(id),
  
  -- Action details
  reason TEXT NOT NULL,
  notes TEXT,
  evidence_urls TEXT[], -- Array of evidence file URLs
  
  -- Outcome
  outcome JSONB, -- Flexible JSON for storing action results
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS TABLE - Rating and review system (Future enhancement)
-- ============================================================================
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Review categories
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  
  -- Status
  visible BOOLEAN DEFAULT TRUE,
  flagged BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(job_id, reviewer_id), -- One review per user per job
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

-- ============================================================================
-- NOTIFICATIONS TABLE - User notifications system
-- ============================================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Related entities
  related_job_id UUID REFERENCES jobs(id),
  related_payment_id UUID REFERENCES payments(id),
  related_user_id UUID REFERENCES profiles(id),
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES - Performance optimization
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_verified ON profiles(verified) WHERE verified = TRUE;
CREATE INDEX idx_profiles_location_point ON profiles USING GIST(location_point);
CREATE INDEX idx_profiles_active ON profiles(active) WHERE active = TRUE;

-- Jobs indexes
CREATE INDEX idx_jobs_tradie_id ON jobs(tradie_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_date_time ON jobs(date_time);
CREATE INDEX idx_jobs_location_point ON jobs USING GIST(location_point);
CREATE INDEX idx_jobs_open_status_date ON jobs(status, date_time) WHERE status = 'open';
CREATE INDEX idx_jobs_assigned_helper ON jobs(assigned_helper_id) WHERE assigned_helper_id IS NOT NULL;

-- Job applications indexes
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_helper_id ON job_applications(helper_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_pending ON job_applications(job_id, status) WHERE status = 'pending';

-- Payments indexes
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_tradie_id ON payments(tradie_id);
CREATE INDEX idx_payments_helper_id ON payments(helper_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Messages indexes
CREATE INDEX idx_messages_job_id ON messages(job_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read) WHERE read = FALSE;

-- Admin actions indexes
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Reviews indexes (for future use)
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_visible ON reviews(reviewee_id, visible) WHERE visible = TRUE;

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ============================================================================
-- TRIGGERS - Automatic updates and audit trails
-- ============================================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Location point update trigger for profiles
CREATE OR REPLACE FUNCTION update_location_point_profiles()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.location_point = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_location_point BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_location_point_profiles();

-- Location point update trigger for jobs
CREATE OR REPLACE FUNCTION update_location_point_jobs()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.location_point = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_location_point BEFORE INSERT OR UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_location_point_jobs();

-- Job assignment trigger - updates job status and creates payment
CREATE OR REPLACE FUNCTION handle_job_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If application is accepted
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Update job status to assigned
        UPDATE jobs 
        SET status = 'assigned', 
            assigned_helper_id = NEW.helper_id,
            assigned_at = NOW()
        WHERE id = NEW.job_id;
        
        -- Reject other pending applications for this job
        UPDATE job_applications 
        SET status = 'rejected', 
            responded_at = NOW(),
            updated_at = NOW()
        WHERE job_id = NEW.job_id 
            AND id != NEW.id 
            AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_job_applications_assignment AFTER UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION handle_job_assignment();

-- ============================================================================
-- HELPER FUNCTIONS - Common database operations
-- ============================================================================

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
    ) / 1000; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to get jobs within radius
CREATE OR REPLACE FUNCTION get_jobs_within_radius(
    user_lat DECIMAL, 
    user_lon DECIMAL, 
    radius_km INTEGER DEFAULT 20
)
RETURNS TABLE(
    job_id UUID,
    title VARCHAR(200),
    pay_rate DECIMAL(8,2),
    date_time TIMESTAMPTZ,
    location VARCHAR(255),
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.pay_rate,
        j.date_time,
        j.location,
        (ST_Distance(
            ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
            j.location_point::geography
        ) / 1000)::DECIMAL as distance_km
    FROM jobs j
    WHERE j.status = 'open'
        AND j.date_time > NOW()
        AND j.location_point IS NOT NULL
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
            j.location_point::geography,
            radius_km * 1000
        )
    ORDER BY j.date_time ASC, distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update user ratings
CREATE OR REPLACE FUNCTION update_user_rating(user_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_jobs INTEGER;
BEGIN
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, total_jobs
    FROM reviews 
    WHERE reviewee_id = user_id AND visible = TRUE;
    
    UPDATE profiles 
    SET average_rating = avg_rating
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS - Common queries for application layer
-- ============================================================================

-- Active jobs with tradie information
CREATE VIEW active_jobs_with_tradie AS
SELECT 
    j.*,
    p.full_name as tradie_name,
    p.verified as tradie_verified,
    p.average_rating as tradie_rating
FROM jobs j
JOIN profiles p ON j.tradie_id = p.id
WHERE j.status IN ('open', 'assigned', 'in_progress')
    AND p.active = TRUE;

-- Helper applications with job details
CREATE VIEW applications_with_job_details AS
SELECT 
    ja.*,
    j.title as job_title,
    j.date_time as job_date_time,
    j.location as job_location,
    j.pay_rate as job_pay_rate,
    p.full_name as helper_name,
    p.verified as helper_verified,
    p.average_rating as helper_rating
FROM job_applications ja
JOIN jobs j ON ja.job_id = j.id
JOIN profiles p ON ja.helper_id = p.id
WHERE p.active = TRUE;

-- Payment summary view
CREATE VIEW payment_summary AS
SELECT 
    p.*,
    j.title as job_title,
    tradie.full_name as tradie_name,
    helper.full_name as helper_name
FROM payments p
JOIN jobs j ON p.job_id = j.id
JOIN profiles tradie ON p.tradie_id = tradie.id
JOIN profiles helper ON p.helper_id = helper.id;

COMMENT ON SCHEMA public IS 'Tradie Helper marketplace database schema';