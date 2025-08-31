-- ============================================================================
-- DEPLOYMENT READINESS CHECKLIST
-- ============================================================================
-- Run this script BEFORE deploying migrations to understand current state
-- and get exact deployment recommendations

-- ============================================================================
-- CURRENT DATABASE STATE ANALYSIS
-- ============================================================================

SELECT '🔍 DATABASE STATE ANALYSIS' as section, '===================' as divider;

-- Check core tables
SELECT 
    'Core Tables Status' as check_category,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
         THEN '✅ profiles' ELSE '❌ profiles MISSING' END as profiles,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
         THEN '✅ jobs' ELSE '❌ jobs MISSING' END as jobs,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') 
         THEN '✅ job_applications' ELSE '❌ job_applications MISSING' END as applications;

-- Check new tables
SELECT 
    'New Tables Status' as check_category,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
         THEN '✅ reviews EXISTS' ELSE '⏭️ reviews NEEDED' END as reviews,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
         THEN '✅ notifications EXISTS' ELSE '⏭️ notifications NEEDED' END as notifications,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') 
         THEN '✅ file_uploads EXISTS' ELSE '⏭️ file_uploads NEEDED' END as file_uploads;

-- ============================================================================
-- DEPLOYMENT RECOMMENDATIONS
-- ============================================================================

SELECT '📋 DEPLOYMENT PLAN' as section, '===================' as divider;

-- Generate deployment plan
WITH deployment_needs AS (
    SELECT 
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') as reviews_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') as notifications_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') as file_uploads_exists,
        EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews') as reviews_policies_exist
)
SELECT 
    'Deployment Steps Required' as plan_category,
    CASE WHEN NOT (reviews_exists AND notifications_exists AND file_uploads_exists) 
         THEN '1️⃣ RUN: 006_missing_tables_safe.sql' 
         ELSE '✅ Tables exist - skip step 1' END as step_1,
    CASE WHEN NOT reviews_policies_exist 
         THEN '2️⃣ RUN: 007_conditional_rls_policies.sql' 
         ELSE '✅ Policies exist - skip step 2' END as step_2,
    CASE WHEN (reviews_exists AND notifications_exists AND file_uploads_exists AND reviews_policies_exist)
         THEN '✅ COMPLETE: No migration needed!' 
         ELSE '⚠️ PARTIAL: Additional migrations required' END as overall_status
FROM deployment_needs;

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

SELECT '🛡️ SAFETY VALIDATION' as section, '===================' as divider;

-- Check for potential conflicts
SELECT 
    'Safety Checks' as check_category,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'column_exists') 
         THEN '⚠️ column_exists function exists (will be recreated safely)' 
         ELSE '✅ No function conflicts' END as function_conflicts,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
         THEN 
            CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_visible')
                 THEN '✅ Reviews table has modern schema (is_visible)'
                 WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'visible')
                 THEN '⚠️ Reviews table has legacy schema (visible) - policies will adapt'
                 ELSE '❓ Reviews table schema unknown - policies will use fallback'
            END
         ELSE '✅ No reviews table schema conflicts' END as schema_compatibility;

-- ============================================================================
-- PRE-DEPLOYMENT COMMANDS
-- ============================================================================

SELECT '⚡ QUICK DEPLOYMENT GUIDE' as section, '===================' as divider;

-- Show exact commands to run
SELECT 
    'Copy-Paste Commands' as guide_category,
    'Step 1: Copy entire contents of supabase/migrations/006_missing_tables_safe.sql' as command_1,
    'Step 2: Paste into Supabase SQL Editor and click RUN' as command_2,
    'Step 3: Copy entire contents of supabase/migrations/007_conditional_rls_policies.sql' as command_3,
    'Step 4: Paste into Supabase SQL Editor and click RUN' as command_4;

-- ============================================================================
-- EXPECTED OUTCOMES
-- ============================================================================

SELECT '🎯 SUCCESS INDICATORS' as section, '===================' as divider;

-- Show what success looks like
SELECT 
    'After 006_missing_tables_safe.sql' as migration_step,
    'Look for: NOTICE: 🎉 All missing tables are now available!' as success_message,
    'Verify with: SELECT COUNT(*) FROM reviews; (should return 0)' as verification_command;

SELECT 
    'After 007_conditional_rls_policies.sql' as migration_step,
    'Look for: Conditional RLS policies applied successfully to existing tables!' as success_message,
    'Verify with: SELECT COUNT(*) FROM pg_policies WHERE tablename = ''reviews'';' as verification_command;

-- ============================================================================
-- FINAL READINESS ASSESSMENT  
-- ============================================================================

SELECT '🚀 DEPLOYMENT READINESS' as section, '===================' as divider;

WITH readiness AS (
    SELECT 
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as has_core_schema,
        pg_catalog.version() LIKE '%PostgreSQL%' as has_postgresql
)
SELECT 
    'Deployment Readiness Assessment' as assessment,
    CASE WHEN has_core_schema THEN '✅ Core schema detected' ELSE '❌ Missing core tables' END as core_status,
    CASE WHEN has_postgresql THEN '✅ PostgreSQL database' ELSE '❌ Incompatible database' END as db_status,
    CASE WHEN has_core_schema AND has_postgresql 
         THEN '🟢 READY TO DEPLOY' 
         ELSE '🔴 NOT READY - Fix issues above' END as final_status
FROM readiness;

SELECT '✨ Run this checklist completed! Proceed with deployment if status is READY.' as conclusion;