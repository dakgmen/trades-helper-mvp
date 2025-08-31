-- ============================================================================
-- CONDITIONAL RLS POLICIES FOR NEW TABLES
-- ============================================================================
-- This migration only applies RLS policies to tables that actually exist
-- and checks for column existence before referencing them

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES (Reusable security functions)
-- ============================================================================

-- Check if current user has specific role
CREATE OR REPLACE FUNCTION current_user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin  
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is participant in a job (tradie or assigned helper)
CREATE OR REPLACE FUNCTION is_job_participant(job_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = job_uuid 
        AND (tradie_id = auth.uid() OR assigned_helper_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONDITIONAL RLS POLICIES BASED ON TABLE EXISTENCE
-- ============================================================================

DO $$
BEGIN
    -- ========================================================================
    -- REVIEWS TABLE RLS POLICIES (Only if table exists)
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        -- Enable RLS on reviews table
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
        
        -- Check which visibility columns exist and create appropriate policies
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_visible') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_flagged') THEN
            -- Policy for tables with is_visible and is_flagged columns (modern schema)
            CREATE POLICY "Public can view visible reviews" ON reviews
                FOR SELECT USING (is_visible = TRUE AND is_flagged = FALSE);
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'visible') AND
              EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'flagged') THEN
            -- Policy for tables with visible and flagged columns (legacy schema)
            CREATE POLICY "Public can view visible reviews" ON reviews
                FOR SELECT USING (visible = TRUE AND flagged = FALSE);
        ELSE
            -- Basic policy if visibility columns don't exist (fallback)
            CREATE POLICY "Public can view all reviews" ON reviews
                FOR SELECT USING (true);
        END IF;

        -- Job participants can create reviews (works regardless of column names)
        CREATE POLICY "Job participants can create reviews" ON reviews
            FOR INSERT WITH CHECK (
                reviewer_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM jobs 
                    WHERE id = job_id 
                    AND (tradie_id = auth.uid() OR assigned_helper_id = auth.uid())
                    AND status = 'completed'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM reviews 
                    WHERE job_id = reviews.job_id 
                    AND reviewer_id = auth.uid()
                )
            );

        -- Reviewers can update their own reviews (within time limit)
        CREATE POLICY "Reviewers can update own reviews" ON reviews
            FOR UPDATE USING (
                reviewer_id = auth.uid()
                AND created_at > NOW() - INTERVAL '7 days'
            );

        -- Admins can manage all reviews
        CREATE POLICY "Admins can manage reviews" ON reviews
            FOR ALL USING (current_user_is_admin());

        RAISE NOTICE '✅ Reviews table RLS policies applied';
    ELSE
        RAISE NOTICE '⏭️  Reviews table does not exist - skipping RLS policies';
    END IF;

    -- ========================================================================
    -- NOTIFICATIONS TABLE RLS POLICIES (Only if table exists)
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Enable RLS on notifications table
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

        -- Users can view their own notifications
        CREATE POLICY "Users can view own notifications" ON notifications
            FOR SELECT USING (user_id = auth.uid());

        -- Users can mark their notifications as read
        CREATE POLICY "Users can mark notifications read" ON notifications
            FOR UPDATE USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());

        -- Admins can view all notifications
        CREATE POLICY "Admins can view all notifications" ON notifications
            FOR SELECT USING (current_user_is_admin());

        RAISE NOTICE '✅ Notifications table RLS policies applied';
    ELSE
        RAISE NOTICE '⏭️  Notifications table does not exist - skipping RLS policies';
    END IF;

    -- ========================================================================
    -- FILE UPLOADS POLICIES (Only if table exists)
    -- ========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        -- Enable RLS on file_uploads table
        ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

        -- Users can upload their own files
        CREATE POLICY "Users can upload own files" ON file_uploads
            FOR INSERT WITH CHECK (user_id = auth.uid());

        -- Users can view their own files
        CREATE POLICY "Users can view own files" ON file_uploads
            FOR SELECT USING (user_id = auth.uid());

        -- Users can update their own files
        CREATE POLICY "Users can view own file updates" ON file_uploads
            FOR UPDATE USING (user_id = auth.uid());

        -- Users can delete their own files
        CREATE POLICY "Users can delete own files" ON file_uploads
            FOR DELETE USING (user_id = auth.uid());

        -- Admins can view all files (for verification)
        CREATE POLICY "Admins can view all files" ON file_uploads
            FOR SELECT USING (current_user_is_admin());

        -- Admins can update file verification status
        CREATE POLICY "Admins can update file verification" ON file_uploads
            FOR UPDATE USING (current_user_is_admin())
            WITH CHECK (current_user_is_admin());

        RAISE NOTICE '✅ File uploads table RLS policies applied';
    ELSE
        RAISE NOTICE '⏭️  File uploads table does not exist - skipping RLS policies';
    END IF;

END $$;

-- ============================================================================
-- ENHANCED POLICIES FOR EXISTING TABLES (Optional improvements)
-- ============================================================================

DO $$
BEGIN
    -- Enhanced job access for better UX (only if tables exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        
        -- Tradies can view helper profiles when they have applications
        CREATE POLICY "Tradies can view helper profiles when they have applications" ON profiles
            FOR SELECT USING (
                role = 'helper' 
                AND EXISTS (
                    SELECT 1 FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE ja.helper_id = profiles.id
                    AND j.tradie_id = auth.uid()
                )
            );

        -- Helpers can view job owner profiles
        CREATE POLICY "Helpers can view job owner profiles" ON profiles
            FOR SELECT USING (
                role = 'tradie' 
                AND EXISTS (
                    SELECT 1 FROM job_applications ja
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE j.tradie_id = profiles.id
                    AND ja.helper_id = auth.uid()
                )
            );

        RAISE NOTICE '✅ Enhanced profile visibility policies applied';
    END IF;
END $$;

-- ============================================================================
-- GRANT PERMISSIONS FOR NEW TABLES (Only if they exist)
-- ============================================================================

DO $$
BEGIN
    -- Grant necessary permissions to authenticated users
    GRANT USAGE ON SCHEMA public TO authenticated;
    
    -- Grant permissions on new tables if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        GRANT ALL ON reviews TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        GRANT ALL ON notifications TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        GRANT ALL ON file_uploads TO authenticated;
    END IF;

    -- Grant permissions on sequences
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

    RAISE NOTICE '✅ Permissions granted for existing tables';
END $$;

-- ============================================================================
-- POLICY COMMENTS FOR DOCUMENTATION (Only for policies that exist)
-- ============================================================================

DO $$
BEGIN
    -- Add comments only for policies that actually exist (check all possible policy names)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can view visible reviews') THEN
        COMMENT ON POLICY "Public can view visible reviews" ON reviews IS 
        'Public review feed - builds trust and transparency (filtered for visibility)';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can view all reviews') THEN
        COMMENT ON POLICY "Public can view all reviews" ON reviews IS 
        'Public review feed - builds trust and transparency (all reviews visible)';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Job participants can create reviews') THEN
        COMMENT ON POLICY "Job participants can create reviews" ON reviews IS 
        'Only tradie and helper involved in a completed job can create reviews';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviewers can update own reviews') THEN
        COMMENT ON POLICY "Reviewers can update own reviews" ON reviews IS 
        'Reviewers can edit their reviews within 7 days of creation';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Admins can manage reviews') THEN
        COMMENT ON POLICY "Admins can manage reviews" ON reviews IS 
        'Administrators have full access to all reviews for moderation';
    END IF;

    -- Notifications policy comments
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
        COMMENT ON POLICY "Users can view own notifications" ON notifications IS 
        'Users can only see their own notifications for privacy';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can mark notifications read') THEN
        COMMENT ON POLICY "Users can mark notifications read" ON notifications IS 
        'Users can update the read status of their own notifications';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can view all notifications') THEN
        COMMENT ON POLICY "Admins can view all notifications" ON notifications IS 
        'Administrators can view all notifications for system monitoring';
    END IF;

    -- File uploads policy comments  
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Users can upload own files') THEN
        COMMENT ON POLICY "Users can upload own files" ON file_uploads IS 
        'Users can only upload files to their own account folders';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Users can view own files') THEN
        COMMENT ON POLICY "Users can view own files" ON file_uploads IS 
        'Users can view their own uploaded files for verification';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Admins can view all files') THEN
        COMMENT ON POLICY "Admins can view all files" ON file_uploads IS 
        'Administrators can view all files for verification and moderation';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Admins can update file verification') THEN
        COMMENT ON POLICY "Admins can update file verification" ON file_uploads IS 
        'Administrators can update verification status of uploaded files';
    END IF;

    RAISE NOTICE '📝 Policy comments added for existing policies';
END $$;

SELECT 'Conditional RLS policies applied successfully to existing tables!' as status;