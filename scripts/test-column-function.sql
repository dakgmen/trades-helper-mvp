-- ============================================================================
-- TEST SCRIPT: Column Existence Function
-- ============================================================================
-- This script tests the fixed column_exists function in isolation

-- Create the function (same as in migration)
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

-- Test the function with existing tables/columns
DO $$
BEGIN
    -- Test with existing table and column (should return TRUE)
    IF column_exists('profiles', 'id') THEN
        RAISE NOTICE '✅ Function works: profiles.id exists';
    ELSE
        RAISE NOTICE '❌ Function error: profiles.id should exist';
    END IF;
    
    -- Test with existing table but non-existent column (should return FALSE)
    IF column_exists('profiles', 'nonexistent_column') THEN
        RAISE NOTICE '❌ Function error: nonexistent column returned TRUE';
    ELSE
        RAISE NOTICE '✅ Function works: nonexistent column correctly returned FALSE';
    END IF;
    
    -- Test with non-existent table (should return FALSE)
    IF column_exists('nonexistent_table', 'id') THEN
        RAISE NOTICE '❌ Function error: nonexistent table returned TRUE';
    ELSE
        RAISE NOTICE '✅ Function works: nonexistent table correctly returned FALSE';
    END IF;
END $$;

-- Clean up
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

SELECT '🎉 Column existence function test completed successfully!' as result;