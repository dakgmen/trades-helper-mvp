-- ============================================================================
-- COMPREHENSIVE RLS POLICIES FOR ALL TABLES  
-- ============================================================================
-- This migration applies complete RLS policies including the missing tables
-- Run AFTER 006_missing_tables.sql

-- ============================================================================
-- ENABLE RLS ON NEW TABLES (existing tables already have RLS enabled)
-- ============================================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

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
-- REVIEWS TABLE RLS POLICIES
-- ============================================================================

-- Anyone can view visible reviews
CREATE POLICY "Anyone can view visible reviews" ON reviews
    FOR SELECT USING (is_visible = TRUE AND is_flagged = FALSE);

-- Job participants can create reviews
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
            -- Prevent duplicate reviews
            SELECT 1 FROM reviews 
            WHERE job_id = reviews.job_id 
            AND reviewer_id = auth.uid()
        )
    );

-- Reviewers can update their own reviews (within time limit)
CREATE POLICY "Reviewers can update own reviews" ON reviews
    FOR UPDATE USING (
        reviewer_id = auth.uid()
        AND created_at > NOW() - INTERVAL '7 days' -- 7-day edit window
    );

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" ON reviews
    FOR ALL USING (current_user_is_admin());

-- ============================================================================  
-- NOTIFICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can mark their notifications as read
CREATE POLICY "Users can mark notifications read" ON notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- System can create notifications (via application logic)
-- No direct INSERT policy - notifications created by application

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT USING (current_user_is_admin());

-- ============================================================================
-- FILE UPLOADS POLICIES
-- ============================================================================

-- Users can upload their own files
CREATE POLICY "Users can upload own files" ON file_uploads
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own files
CREATE POLICY "Users can view own files" ON file_uploads
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own files (for verification status updates by admin)
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

-- ============================================================================
-- ENHANCED POLICIES FOR EXISTING TABLES (Optional improvements)
-- ============================================================================

-- Enhanced job access for better UX
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

-- Enhanced helper job access
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

-- ============================================================================
-- GRANT PERMISSIONS FOR NEW TABLES
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON file_uploads TO authenticated;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- POLICY COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Anyone can view visible reviews" ON reviews IS 
'Public review feed - builds trust and transparency';

COMMENT ON POLICY "Job participants can create reviews" ON reviews IS 
'Only tradie and helper involved in a completed job can create reviews';

COMMENT ON POLICY "Users can view own notifications" ON notifications IS 
'Users can only see their own notifications for privacy';

COMMENT ON POLICY "Users can upload own files" ON file_uploads IS 
'Users can only upload files to their own account folders';

SELECT 'Comprehensive RLS policies applied successfully!' as status;