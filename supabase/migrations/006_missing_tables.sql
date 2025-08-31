-- ============================================================================
-- ADD MISSING TABLES (reviews, notifications, file_uploads)
-- ============================================================================
-- This migration adds tables that exist in docs/database-schema.sql but are 
-- missing from the current Supabase schema

-- ============================================================================
-- REVIEWS TABLE - Job reviews and ratings
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Review categories
  work_quality INTEGER CHECK (work_quality >= 1 AND work_quality <= 5),
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  
  -- Review status
  visible BOOLEAN DEFAULT TRUE,
  flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_review_per_job_reviewer UNIQUE (job_id, reviewer_id),
  CONSTRAINT prevent_self_review CHECK (reviewer_id != reviewee_id)
);

-- ============================================================================
-- NOTIFICATIONS TABLE - User notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Related entities
  related_job_id UUID REFERENCES jobs(id),
  related_application_id UUID REFERENCES job_applications(id),
  related_payment_id UUID REFERENCES payments(id),
  
  -- Notification status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Priority and scheduling
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  scheduled_for TIMESTAMPTZ,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FILE_UPLOADS TABLE - Track uploaded files for verification and jobs  
-- ============================================================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('profile_image', 'white_card', 'id_document', 'job_image', 'other')),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
-- Note: Index removed since 'visible' column may not exist in current schema
-- CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(reviewee_id, visible) WHERE visible = TRUE;

-- File uploads indexes  
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON file_uploads(category);
CREATE INDEX IF NOT EXISTS idx_file_uploads_verified ON file_uploads(verified) WHERE verified = TRUE;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamps on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE reviews IS 'Job reviews and ratings between tradies and helpers';
COMMENT ON TABLE notifications IS 'User notifications for app events and updates';
COMMENT ON TABLE file_uploads IS 'File upload tracking for verification documents and job attachments';

COMMENT ON COLUMN reviews.work_quality IS 'Rating for quality of work delivered';
COMMENT ON COLUMN reviews.punctuality IS 'Rating for timeliness and reliability';
COMMENT ON COLUMN reviews.communication IS 'Rating for communication during job';

COMMENT ON COLUMN notifications.type IS 'Notification type: job_assigned, payment_received, review_posted, etc.';
COMMENT ON COLUMN notifications.priority IS 'Priority level: 1=low, 2=normal, 3=high, 4=urgent, 5=critical';

COMMENT ON COLUMN file_uploads.category IS 'File category: profile_image, white_card, id_document, job_image, other';

SELECT 'Missing tables created successfully!' as status;