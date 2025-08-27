-- Tradie Helper Storage Configuration
-- Supabase Storage buckets and policies for file uploads
-- Handles profile images, ID documents, and White Cards

-- ============================================================================
-- CREATE STORAGE BUCKETS
-- ============================================================================

-- Public bucket for profile avatars and non-sensitive images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Private bucket for identity documents and White Cards
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'identity-documents',
    'identity-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Private bucket for job attachments and evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'job-attachments',
    'job-attachments',
    false,
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES - AVATARS BUCKET (Public)
-- ============================================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================================
-- STORAGE RLS POLICIES - IDENTITY DOCUMENTS BUCKET (Private)
-- ============================================================================

-- Users can view their own identity documents
CREATE POLICY "Users can view own identity documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'identity-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admins can view all identity documents for verification
CREATE POLICY "Admins can view identity documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'identity-documents'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can upload their own identity documents
CREATE POLICY "Users can upload identity documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'identity-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own identity documents (before verification)
CREATE POLICY "Users can update unverified documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'identity-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (verified = FALSE OR verified IS NULL)
        )
    );

-- Users can delete their own unverified identity documents
CREATE POLICY "Users can delete unverified documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'identity-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (verified = FALSE OR verified IS NULL)
        )
    );

-- ============================================================================
-- STORAGE RLS POLICIES - JOB ATTACHMENTS BUCKET (Private)
-- ============================================================================

-- Job participants can view job attachments
CREATE POLICY "Job participants can view attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'job-attachments'
        AND EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id::text = (storage.foldername(name))[1]
            AND (j.tradie_id = auth.uid() OR j.assigned_helper_id = auth.uid())
        )
    );

-- Job participants can upload attachments
CREATE POLICY "Job participants can upload attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'job-attachments'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id::text = (storage.foldername(name))[1]
            AND (j.tradie_id = auth.uid() OR j.assigned_helper_id = auth.uid())
        )
    );

-- Admins can view all job attachments
CREATE POLICY "Admins can view job attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'job-attachments'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS FOR STORAGE OPERATIONS
-- ============================================================================

-- Function to get signed URL for identity documents
CREATE OR REPLACE FUNCTION get_identity_document_url(
    user_id UUID,
    file_path TEXT,
    expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signed_url TEXT;
    current_user_role user_role;
BEGIN
    -- Get current user role
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Check if user can access this document
    IF auth.uid() = user_id OR current_user_role = 'admin' THEN
        -- Generate signed URL (this would be handled by Supabase client)
        -- For now, return the file path - client will handle signing
        RETURN 'identity-documents/' || file_path;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- Function to validate file upload requirements
CREATE OR REPLACE FUNCTION validate_file_upload(
    bucket_name TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    bucket_config RECORD;
BEGIN
    -- Get bucket configuration
    SELECT * INTO bucket_config 
    FROM storage.buckets 
    WHERE id = bucket_name;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check file size
    IF file_size > bucket_config.file_size_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Check MIME type if restrictions exist
    IF bucket_config.allowed_mime_types IS NOT NULL 
       AND NOT (mime_type = ANY(bucket_config.allowed_mime_types)) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- This would be run as a scheduled job
    -- Clean up identity documents for deleted profiles
    WITH deleted_files AS (
        DELETE FROM storage.objects
        WHERE bucket_id = 'identity-documents'
        AND NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id::text = (storage.foldername(name))[1]
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_files;
    
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- STORAGE CONFIGURATION SETTINGS
-- ============================================================================

-- File naming conventions and organization
COMMENT ON TABLE storage.buckets IS 
'Storage buckets for Tradie Helper file uploads:
- avatars: Public profile images (5MB limit)
- identity-documents: Private ID docs and White Cards (10MB limit)  
- job-attachments: Private job-related files (20MB limit)

File organization:
- avatars/{user_id}/avatar.jpg
- identity-documents/{user_id}/whitcard.pdf
- identity-documents/{user_id}/id_document.jpg
- job-attachments/{job_id}/filename.ext';

-- Security notes for storage
COMMENT ON POLICY "Users can upload own avatar" ON storage.objects IS 
'Users can only upload to their own folder in avatars bucket';

COMMENT ON POLICY "Admins can view identity documents" ON storage.objects IS 
'Admins need access to identity documents for verification process';

-- ============================================================================
-- STORAGE TRIGGERS AND AUTOMATION
-- ============================================================================

-- Function to handle file upload completion
CREATE OR REPLACE FUNCTION handle_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log file uploads for audit purposes
    INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_user_id,
        reason,
        notes,
        outcome
    )
    SELECT 
        NEW.owner,
        'verify_user'::admin_action_type,
        NEW.owner,
        'File uploaded for verification',
        'Bucket: ' || NEW.bucket_id || ', File: ' || NEW.name,
        jsonb_build_object(
            'bucket_id', NEW.bucket_id,
            'file_name', NEW.name,
            'file_size', NEW.metadata->>'size',
            'mime_type', NEW.metadata->>'mimetype'
        )
    WHERE NEW.bucket_id = 'identity-documents';
    
    RETURN NEW;
END;
$$;

-- Trigger for file upload logging
CREATE TRIGGER file_upload_trigger
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION handle_file_upload();

-- ============================================================================
-- EXAMPLE USAGE PATTERNS
-- ============================================================================

/*
-- Example: Upload avatar
-- Client-side code would handle the actual upload
-- File path: avatars/{user_id}/avatar.jpg

-- Example: Upload White Card
-- File path: identity-documents/{user_id}/whitecard.pdf

-- Example: Get signed URL for identity document (admin only)
SELECT get_identity_document_url(
    '123e4567-e89b-12d3-a456-426614174000',
    'whitecard.pdf',
    3600
);

-- Example: Validate file before upload
SELECT validate_file_upload(
    'avatars',
    'profile.jpg', 
    2048000, -- 2MB
    'image/jpeg'
);
*/

-- ============================================================================
-- MAINTENANCE AND MONITORING
-- ============================================================================

-- View for storage usage monitoring
CREATE VIEW storage_usage_summary AS
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    SUM((metadata->>'size')::bigint) as total_size_bytes,
    AVG((metadata->>'size')::bigint) as avg_size_bytes,
    MAX(created_at) as last_upload
FROM storage.objects
GROUP BY bucket_id;

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'bucket', bucket_id,
            'files', file_count,
            'total_size_mb', ROUND(total_size_bytes / 1048576.0, 2),
            'avg_size_mb', ROUND(avg_size_bytes / 1048576.0, 2),
            'last_upload', last_upload
        )
    ) INTO stats
    FROM storage_usage_summary;
    
    RETURN stats;
END;
$$;

COMMENT ON SCHEMA storage IS 'Tradie Helper file storage configuration with security policies';