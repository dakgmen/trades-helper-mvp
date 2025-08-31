-- ============================================================================
-- ADD MISSING TABLES (reviews, notifications, file_uploads) - ULTRA SAFE VERSION
-- ============================================================================
-- This migration safely handles existing tables and only creates what's missing

-- ============================================================================
-- UTILITY FUNCTION: Check if column exists in table
-- ============================================================================
CREATE OR REPLACE FUNCTION column_exists(p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = p_table_name 
        AND column_name = p_column_name
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- REVIEWS TABLE - Only create if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        CREATE TABLE reviews (
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
            is_visible BOOLEAN DEFAULT TRUE,
            is_flagged BOOLEAN DEFAULT FALSE,
            flagged_reason TEXT,
            
            -- Timestamps
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- Constraints
            CONSTRAINT unique_review_per_job_reviewer UNIQUE (job_id, reviewer_id),
            CONSTRAINT prevent_self_review CHECK (reviewer_id != reviewee_id)
        );
        RAISE NOTICE 'Created reviews table';
    ELSE
        RAISE NOTICE 'Reviews table already exists - skipping creation';
    END IF;
END $$;

-- ============================================================================
-- NOTIFICATIONS TABLE - Only create if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            
            -- Notification content
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            notification_type VARCHAR(50) NOT NULL,
            
            -- Related entities
            related_job_id UUID REFERENCES jobs(id),
            related_application_id UUID REFERENCES job_applications(id),
            related_payment_id UUID REFERENCES payments(id),
            
            -- Notification status
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMPTZ,
            
            -- Priority and scheduling
            priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
            scheduled_for TIMESTAMPTZ,
            is_sent BOOLEAN DEFAULT FALSE,
            sent_at TIMESTAMPTZ,
            
            -- Timestamps
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created notifications table';
    ELSE
        RAISE NOTICE 'Notifications table already exists - skipping creation';
    END IF;
END $$;

-- ============================================================================
-- FILE_UPLOADS TABLE - Only create if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        CREATE TABLE file_uploads (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
            filename VARCHAR(255) NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL CHECK (category IN ('profile_image', 'white_card', 'id_document', 'job_image', 'other')),
            is_verified BOOLEAN DEFAULT FALSE,
            verified_at TIMESTAMPTZ,
            verified_by UUID REFERENCES profiles(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created file_uploads table';
    ELSE
        RAISE NOTICE 'File_uploads table already exists - skipping creation';
    END IF;
END $$;

-- ============================================================================
-- SAFE INDEXES - Only create if tables and columns exist
-- ============================================================================
DO $$
BEGIN
    -- Reviews indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
        
        -- Only create visibility index if column exists
        IF column_exists('reviews', 'is_visible') THEN
            CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(reviewee_id, is_visible) 
            WHERE is_visible = TRUE;
        END IF;
        
        RAISE NOTICE 'Created reviews indexes';
    END IF;

    -- File uploads indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON file_uploads(category);
        
        IF column_exists('file_uploads', 'is_verified') THEN
            CREATE INDEX IF NOT EXISTS idx_file_uploads_verified ON file_uploads(is_verified) 
            WHERE is_verified = TRUE;
        END IF;
        
        RAISE NOTICE 'Created file_uploads indexes';
    END IF;

    -- Notifications indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
        
        IF column_exists('notifications', 'is_read') THEN
            CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) 
            WHERE is_read = FALSE;
        END IF;
        
        RAISE NOTICE 'Created notifications indexes';
    END IF;
END $$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables (only if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
        CREATE TRIGGER update_reviews_updated_at
            BEFORE UPDATE ON reviews
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created reviews trigger';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
        CREATE TRIGGER update_notifications_updated_at
            BEFORE UPDATE ON notifications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created notifications trigger';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON file_uploads;
        CREATE TRIGGER update_file_uploads_updated_at
            BEFORE UPDATE ON file_uploads
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created file_uploads trigger';
    END IF;
END $$;

-- ============================================================================
-- SAFE COMMENTS - Only add if tables and columns exist
-- ============================================================================
DO $$
BEGIN
    -- Reviews table comments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        COMMENT ON TABLE reviews IS 'Job reviews and ratings between tradies and helpers';
        
        IF column_exists('reviews', 'work_quality') THEN
            COMMENT ON COLUMN reviews.work_quality IS 'Rating for quality of work delivered';
        END IF;
        
        IF column_exists('reviews', 'punctuality') THEN
            COMMENT ON COLUMN reviews.punctuality IS 'Rating for timeliness and reliability';
        END IF;
        
        IF column_exists('reviews', 'communication') THEN
            COMMENT ON COLUMN reviews.communication IS 'Rating for communication during job';
        END IF;
        
        RAISE NOTICE 'Added reviews table comments';
    END IF;

    -- Notifications table comments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        COMMENT ON TABLE notifications IS 'User notifications for app events and updates';
        
        IF column_exists('notifications', 'notification_type') THEN
            COMMENT ON COLUMN notifications.notification_type IS 'Notification type: job_assigned, payment_received, review_posted, etc.';
        END IF;
        
        IF column_exists('notifications', 'priority') THEN
            COMMENT ON COLUMN notifications.priority IS 'Priority level: 1=low, 2=normal, 3=high, 4=urgent, 5=critical';
        END IF;
        
        RAISE NOTICE 'Added notifications table comments';
    END IF;

    -- File uploads table comments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        COMMENT ON TABLE file_uploads IS 'File upload tracking for verification documents and job attachments';
        
        IF column_exists('file_uploads', 'category') THEN
            COMMENT ON COLUMN file_uploads.category IS 'File category: profile_image, white_card, id_document, job_image, other';
        END IF;
        
        RAISE NOTICE 'Added file_uploads table comments';
    END IF;
END $$;

-- ============================================================================
-- FINAL VALIDATION AND REPORTING
-- ============================================================================
DO $$
DECLARE
    reviews_exists BOOLEAN;
    notifications_exists BOOLEAN;
    file_uploads_exists BOOLEAN;
    total_tables INTEGER := 0;
BEGIN
    -- Check table existence
    reviews_exists := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews');
    notifications_exists := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');
    file_uploads_exists := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads');
    
    -- Count existing tables
    IF reviews_exists THEN total_tables := total_tables + 1; END IF;
    IF notifications_exists THEN total_tables := total_tables + 1; END IF;
    IF file_uploads_exists THEN total_tables := total_tables + 1; END IF;
    
    -- Report results
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'Reviews table: %', CASE WHEN reviews_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Notifications table: %', CASE WHEN notifications_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'File uploads table: %', CASE WHEN file_uploads_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Total tables ready: % / 3', total_tables;
    RAISE NOTICE '';
    
    IF total_tables = 3 THEN
        RAISE NOTICE '🎉 All missing tables are now available!';
    ELSE
        RAISE NOTICE '⚠️  Some tables may need manual creation';
    END IF;
END $$;

-- Clean up utility function
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);