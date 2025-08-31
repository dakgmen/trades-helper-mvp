-- ============================================================================
-- TEST SCRIPT: Conditional RLS Policies
-- ============================================================================
-- This script tests the fixed conditional RLS policies in isolation

-- Step 1: Create a test reviews table with modern schema
CREATE TABLE IF NOT EXISTS test_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID,
    reviewer_id UUID,
    reviewee_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Test the conditional policy logic
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE test_reviews ENABLE ROW LEVEL SECURITY;
    
    -- Apply conditional policy (same logic as main migration)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_reviews' AND column_name = 'is_visible') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_reviews' AND column_name = 'is_flagged') THEN
        CREATE POLICY "Test public view policy" ON test_reviews
            FOR SELECT USING (is_visible = TRUE AND is_flagged = FALSE);
        RAISE NOTICE '✅ Modern schema policy created successfully';
    ELSE
        RAISE NOTICE '❌ Column detection failed';
    END IF;
END $$;

-- Step 3: Verify policy exists before adding comment
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_reviews' AND policyname = 'Test public view policy') THEN
        COMMENT ON POLICY "Test public view policy" ON test_reviews IS 'Test policy comment';
        RAISE NOTICE '✅ Policy comment added successfully';
    ELSE
        RAISE NOTICE '❌ Policy does not exist - cannot add comment';
    END IF;
END $$;

-- Step 4: Verify the complete setup
SELECT 
    'Test Results' as test_category,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_reviews')
         THEN '✅ Table created' 
         ELSE '❌ Table missing' END as table_status,
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_reviews')
         THEN '✅ Policies exist' 
         ELSE '❌ No policies' END as policy_status,
    CASE WHEN rowsecurity 
         THEN '✅ RLS enabled' 
         ELSE '❌ RLS disabled' END as rls_status
FROM pg_tables 
WHERE tablename = 'test_reviews';

-- Step 5: Show actual policy details
SELECT 
    'Policy Details' as info_type,
    tablename,
    policyname,
    cmd as policy_type,
    CASE WHEN qual IS NOT NULL THEN 'Has conditions' ELSE 'No conditions' END as conditions
FROM pg_policies 
WHERE tablename = 'test_reviews';

-- Cleanup
DROP TABLE IF EXISTS test_reviews CASCADE;

SELECT '🎉 Conditional RLS policy test completed!' as result;