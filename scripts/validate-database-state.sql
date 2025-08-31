-- ============================================================================
-- DATABASE STATE VALIDATION
-- ============================================================================
-- This script checks the current state of the database to determine
-- which migration files are needed and in what order

-- Check which tables exist
SELECT 
    'Table Existence Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN '✅ profiles' 
        ELSE '❌ profiles' 
    END as profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN '✅ jobs' 
        ELSE '❌ jobs' 
    END as jobs_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
        THEN '✅ reviews' 
        ELSE '❌ reviews' 
    END as reviews_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
        THEN '✅ notifications' 
        ELSE '❌ notifications' 
    END as notifications_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') 
        THEN '✅ file_uploads' 
        ELSE '❌ file_uploads' 
    END as file_uploads_status;

-- Check column existence for reviews table if it exists
SELECT 
    'Reviews Table Columns' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_visible') 
        THEN '✅ is_visible' 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'visible') 
        THEN '⚠️  visible (legacy)' 
        ELSE '❌ no visibility column' 
    END as visibility_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_flagged') 
        THEN '✅ is_flagged' 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'flagged') 
        THEN '⚠️  flagged (legacy)' 
        ELSE '❌ no flagged column' 
    END as flagged_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'work_quality') 
        THEN '✅ work_quality' 
        ELSE '❌ work_quality missing' 
    END as work_quality_column
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews');

-- Check RLS status
SELECT 
    'RLS Status Check' as check_type,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'jobs', 'reviews', 'notifications', 'file_uploads')
ORDER BY tablename;

-- Check existing policies
SELECT 
    'Existing Policies' as check_type,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE tablename IN ('profiles', 'jobs', 'reviews', 'notifications', 'file_uploads')
ORDER BY tablename, policyname;

-- Deployment recommendations
SELECT 
    'Deployment Recommendations' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
        THEN '1️⃣ Run 006_missing_tables_safe.sql first'
        ELSE '✅ Reviews table exists'
    END as step_1,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews') 
        THEN '2️⃣ Run 007_conditional_rls_policies.sql second'
        ELSE '✅ RLS policies exist'
    END as step_2,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') AND
             EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews')
        THEN '✅ Database is ready!'
        ELSE '⚠️  Additional migration steps needed'
    END as overall_status;