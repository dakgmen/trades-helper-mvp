-- Tradie Helper Row Level Security (RLS) Policies
-- Comprehensive security policies for all tables
-- Based on JWT token authentication with role-based access control

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Get current user's profile information
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS profiles AS $$
DECLARE
    user_profile profiles%ROWTYPE;
BEGIN
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = auth.uid();
    
    RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has specific role
CREATE OR REPLACE FUNCTION current_user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = required_role
        AND active = TRUE
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
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (after auth signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (current_user_is_admin());

-- Admins can update verification status
CREATE POLICY "Admins can update verification" ON profiles
    FOR UPDATE USING (
        current_user_is_admin() 
        AND (verified != TRUE OR verified_at IS NULL OR verified_by IS NULL)
    );

-- Tradies can view helper profiles when they have applications
CREATE POLICY "Tradies can view applicant profiles" ON profiles
    FOR SELECT USING (
        role = 'helper' 
        AND EXISTS (
            SELECT 1 FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.helper_id = profiles.id
            AND j.tradie_id = auth.uid()
        )
    );

-- Helpers can view tradie profiles for jobs they applied to
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
-- JOBS TABLE RLS POLICIES
-- ============================================================================

-- Anyone can view open jobs (public job feed)
CREATE POLICY "Anyone can view open jobs" ON jobs
    FOR SELECT USING (status = 'open' AND date_time > NOW());

-- Tradies can view their own jobs
CREATE POLICY "Tradies can view own jobs" ON jobs
    FOR SELECT USING (tradie_id = auth.uid());

-- Helpers can view jobs they applied to
CREATE POLICY "Helpers can view applied jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications
            WHERE job_id = jobs.id AND helper_id = auth.uid()
        )
    );

-- Assigned helpers can view their assigned jobs
CREATE POLICY "Assigned helpers can view their jobs" ON jobs
    FOR SELECT USING (assigned_helper_id = auth.uid());

-- Only tradies can create jobs
CREATE POLICY "Only tradies can create jobs" ON jobs
    FOR INSERT WITH CHECK (
        current_user_has_role('tradie') 
        AND tradie_id = auth.uid()
    );

-- Only job owners can update their jobs
CREATE POLICY "Job owners can update jobs" ON jobs
    FOR UPDATE USING (tradie_id = auth.uid());

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs" ON jobs
    FOR SELECT USING (current_user_is_admin());

-- ============================================================================
-- JOB_APPLICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Helpers can view their own applications
CREATE POLICY "Helpers can view own applications" ON job_applications
    FOR SELECT USING (helper_id = auth.uid());

-- Tradies can view applications to their jobs
CREATE POLICY "Tradies can view job applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = job_applications.job_id 
            AND tradie_id = auth.uid()
        )
    );

-- Only helpers can create applications
CREATE POLICY "Only helpers can apply" ON job_applications
    FOR INSERT WITH CHECK (
        current_user_has_role('helper') 
        AND helper_id = auth.uid()
        AND NOT EXISTS (
            -- Prevent duplicate applications
            SELECT 1 FROM job_applications 
            WHERE job_id = job_applications.job_id 
            AND helper_id = auth.uid()
        )
        AND EXISTS (
            -- Can only apply to open jobs
            SELECT 1 FROM jobs 
            WHERE id = job_applications.job_id 
            AND status = 'open'
            AND date_time > NOW()
            AND tradie_id != auth.uid() -- Can't apply to own jobs
        )
    );

-- Helpers can withdraw their applications (update to 'withdrawn')
CREATE POLICY "Helpers can withdraw applications" ON job_applications
    FOR UPDATE USING (
        helper_id = auth.uid() 
        AND status = 'pending'
    )
    WITH CHECK (
        helper_id = auth.uid() 
        AND status = 'withdrawn'
    );

-- Tradies can respond to applications (accept/reject)
CREATE POLICY "Tradies can respond to applications" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = job_applications.job_id 
            AND tradie_id = auth.uid()
        )
        AND status = 'pending'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = job_applications.job_id 
            AND tradie_id = auth.uid()
        )
        AND status IN ('accepted', 'rejected')
    );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON job_applications
    FOR SELECT USING (current_user_is_admin());

-- ============================================================================
-- PAYMENTS TABLE RLS POLICIES
-- ============================================================================

-- Tradies can view payments they made
CREATE POLICY "Tradies can view their payments" ON payments
    FOR SELECT USING (tradie_id = auth.uid());

-- Helpers can view payments they receive
CREATE POLICY "Helpers can view their earnings" ON payments
    FOR SELECT USING (helper_id = auth.uid());

-- Only system can create payments (via triggers/functions)
-- No direct INSERT policy - payments created by application logic

-- Tradies can update payment status for release
CREATE POLICY "Tradies can release payments" ON payments
    FOR UPDATE USING (
        tradie_id = auth.uid() 
        AND status = 'escrow'
    )
    WITH CHECK (
        tradie_id = auth.uid() 
        AND status IN ('released', 'disputed')
    );

-- Admins can view and manage all payments
CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- MESSAGES TABLE RLS POLICIES
-- ============================================================================

-- Job participants can view messages for their jobs
CREATE POLICY "Job participants can view messages" ON messages
    FOR SELECT USING (
        is_job_participant(job_id) 
        AND (sender_id = auth.uid() OR receiver_id = auth.uid())
    );

-- Job participants can send messages
CREATE POLICY "Job participants can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND is_job_participant(job_id)
        AND (
            -- Tradie can message assigned helper
            (EXISTS (
                SELECT 1 FROM jobs 
                WHERE id = job_id 
                AND tradie_id = auth.uid() 
                AND assigned_helper_id = receiver_id
            ))
            OR
            -- Helper can message tradie of assigned job
            (EXISTS (
                SELECT 1 FROM jobs 
                WHERE id = job_id 
                AND assigned_helper_id = auth.uid() 
                AND tradie_id = receiver_id
            ))
        )
    );

-- Users can mark their received messages as read
CREATE POLICY "Users can mark messages read" ON messages
    FOR UPDATE USING (receiver_id = auth.uid())
    WITH CHECK (receiver_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (current_user_is_admin());

-- ============================================================================
-- ADMIN_ACTIONS TABLE RLS POLICIES
-- ============================================================================

-- Only admins can create admin actions
CREATE POLICY "Only admins can create admin actions" ON admin_actions
    FOR INSERT WITH CHECK (
        current_user_is_admin() 
        AND admin_id = auth.uid()
    );

-- Admins can view their own actions
CREATE POLICY "Admins can view own actions" ON admin_actions
    FOR SELECT USING (admin_id = auth.uid());

-- Super admins can view all admin actions (future enhancement)
-- CREATE POLICY "Super admins can view all actions" ON admin_actions
--     FOR SELECT USING (current_user_has_role('super_admin'));

-- ============================================================================
-- REVIEWS TABLE RLS POLICIES
-- ============================================================================

-- Anyone can view visible reviews
CREATE POLICY "Anyone can view visible reviews" ON reviews
    FOR SELECT USING (visible = TRUE AND flagged = FALSE);

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
-- ADDITIONAL SECURITY FUNCTIONS
-- ============================================================================

-- Function to safely get user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val 
    FROM profiles 
    WHERE id = auth.uid() 
    AND active = TRUE;
    
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access job
CREATE OR REPLACE FUNCTION can_access_job(job_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_record jobs%ROWTYPE;
    current_role user_role;
BEGIN
    SELECT * INTO job_record FROM jobs WHERE id = job_uuid;
    current_role := get_current_user_role();
    
    -- Job doesn't exist
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Admin can access all
    IF current_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Tradie can access own jobs
    IF job_record.tradie_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Assigned helper can access
    IF job_record.assigned_helper_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Helper can access if applied
    IF current_role = 'helper' AND EXISTS (
        SELECT 1 FROM job_applications 
        WHERE job_id = job_uuid 
        AND helper_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Public can access open jobs
    IF job_record.status = 'open' AND job_record.date_time > NOW() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLICY COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON profiles IS 
'Users can view their own profile information including sensitive verification documents';

COMMENT ON POLICY "Anyone can view open jobs" ON jobs IS 
'Public job feed - anyone can see open jobs to encourage applications';

COMMENT ON POLICY "Only helpers can apply" ON job_applications IS 
'Prevents duplicate applications, self-applications, and applications to closed jobs';

COMMENT ON POLICY "Tradies can release payments" ON payments IS 
'Allows tradies to release escrowed payments to helpers after job completion';

COMMENT ON POLICY "Job participants can send messages" ON messages IS 
'Only tradie and assigned helper can message each other for job coordination';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anonymous users for job feed
GRANT SELECT ON jobs TO anon;

-- Revoke unnecessary permissions
REVOKE ALL ON admin_actions FROM anon;
REVOKE ALL ON payments FROM anon;

COMMENT ON SCHEMA public IS 'Tradie Helper RLS policies - Secure multi-tenant access control';