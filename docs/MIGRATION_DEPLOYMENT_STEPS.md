# Migration Deployment Steps

## Overview

This guide provides the exact steps to safely deploy the tradie-helper database migrations in the correct order.

## 🚨 CRITICAL: Run Order

The migrations **MUST** be run in this exact order:

1. **Pre-deployment validation** (optional but recommended)
2. **006_missing_tables_safe.sql** (table creation)
3. **007_conditional_rls_policies.sql** (security policies)
4. **Post-deployment verification** (recommended)

## Prerequisites

- ✅ Access to Supabase dashboard
- ✅ Database admin privileges
- ✅ Backup of current database (recommended)

---

## Step 1: Pre-Deployment Validation (Recommended)

### 1.1 Check Current Database State

**In Supabase SQL Editor, run:**

```sql
-- File: scripts/validate-database-state.sql
-- Copy and paste the entire contents of this file
```

**Expected results will show:**
- Which tables currently exist
- Which columns are present
- Current RLS status
- Recommended deployment steps

### 1.2 Backup Your Database (Production Only)

**In Supabase Dashboard:**
1. Go to `Settings` → `Database`
2. Click `Database backups`
3. Create manual backup before proceeding

---

## Step 2: Deploy Table Creation Migration

### 2.1 Run Missing Tables Migration

**In Supabase SQL Editor:**

```sql
-- Copy and paste the ENTIRE contents of:
-- supabase/migrations/006_missing_tables_safe.sql

-- DO NOT run line by line - copy the whole file at once
```

### 2.2 Verify Success

**Expected output:**
```
CREATE FUNCTION
...
NOTICE: Created reviews table
NOTICE: Created notifications table
NOTICE: Created file_uploads table
NOTICE: Created reviews indexes
NOTICE: Created file_uploads indexes
NOTICE: Created notifications indexes
NOTICE: Created reviews trigger
NOTICE: Created notifications trigger
NOTICE: Created file_uploads trigger
NOTICE: Added reviews table comments
NOTICE: Added notifications table comments
NOTICE: Added file_uploads table comments

=== MIGRATION COMPLETED ===
NOTICE: Reviews table: ✅ EXISTS
NOTICE: Notifications table: ✅ EXISTS
NOTICE: File uploads table: ✅ EXISTS
NOTICE: Total tables ready: 3 / 3

NOTICE: 🎉 All missing tables are now available!
```

**If tables already exist:**
```
NOTICE: Reviews table already exists - skipping creation
NOTICE: Notifications table already exists - skipping creation
NOTICE: File_uploads table already exists - skipping creation
```

### 2.3 Troubleshooting Step 2

**If you get errors:**

| Error | Solution |
|-------|----------|
| `function column_exists already exists` | Safe to ignore - function will be recreated |
| `table already exists` | Safe - migration detects existing tables |
| `column reference "table_name" is ambiguous` | You're running old migration file - use `006_missing_tables_safe.sql` |

---

## Step 3: Deploy RLS Policies Migration

### 3.1 Run Conditional RLS Policies

**In Supabase SQL Editor:**

```sql
-- Copy and paste the ENTIRE contents of:
-- supabase/migrations/007_conditional_rls_policies.sql

-- DO NOT run line by line - copy the whole file at once
```

### 3.2 Verify Success

**Expected output (if tables exist):**
```
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER TABLE
ALTER TABLE
ALTER TABLE
CREATE POLICY
CREATE POLICY
... (multiple CREATE POLICY statements)
NOTICE: ✅ Reviews table RLS policies applied
NOTICE: ✅ Notifications table RLS policies applied
NOTICE: ✅ File uploads table RLS policies applied
NOTICE: ✅ Enhanced profile visibility policies applied
NOTICE: ✅ Permissions granted for existing tables

"Conditional RLS policies applied successfully to existing tables!"
```

**If tables don't exist:**
```
NOTICE: ⏭️  Reviews table does not exist - skipping RLS policies
NOTICE: ⏭️  Notifications table does not exist - skipping RLS policies
NOTICE: ⏭️  File uploads table does not exist - skipping RLS policies
```

### 3.3 Troubleshooting Step 3

**If you get errors:**

| Error | Solution |
|-------|----------|
| `policy already exists` | Safe - policies have unique names |
| `column "is_visible" does not exist` | You're running wrong file - use `007_conditional_rls_policies.sql` |
| `policy does not exist` when adding comments | Fixed in latest version - policies checked before comments |
| `relation does not exist` | Run Step 2 first (table creation) |

---

## Step 4: Post-Deployment Verification

### 4.1 Verify All Tables Exist

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('reviews', 'notifications', 'file_uploads')
ORDER BY table_name;
```

**Expected result:**
```
file_uploads
notifications
reviews
```

### 4.2 Verify RLS is Enabled

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('reviews', 'notifications', 'file_uploads')
ORDER BY tablename;
```

**Expected result:**
```
public | file_uploads   | t
public | notifications | t  
public | reviews       | t
```

### 4.3 Verify Policies Exist

```sql
-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('reviews', 'notifications', 'file_uploads')
ORDER BY tablename, policyname;
```

**Expected result:** Multiple rows showing policies for each table.

### 4.4 Test Basic Functionality

```sql
-- Test notifications table (safest to test)
SELECT COUNT(*) FROM notifications;

-- Should return: 0 (empty table, but accessible)
```

---

## Common Deployment Scenarios

### Scenario 1: Fresh Database
```bash
# Run both migrations in sequence
1. Run 006_missing_tables_safe.sql    ✅ Creates all tables
2. Run 007_conditional_rls_policies.sql ✅ Applies all policies
```

### Scenario 2: Partial Schema Exists
```bash
# Safe migrations handle existing tables
1. Run 006_missing_tables_safe.sql    ⚠️ Creates only missing tables  
2. Run 007_conditional_rls_policies.sql ✅ Applies policies to existing tables
```

### Scenario 3: Production Database
```bash
# Extra safety steps
0. Create backup
1. Run validate-database-state.sql    📊 Check current state
2. Run 006_missing_tables_safe.sql    ✅ Safe table creation
3. Run 007_conditional_rls_policies.sql ✅ Safe policy application
4. Run verification queries           🔍 Confirm success
```

---

## Emergency Rollback

**If something goes wrong, you can rollback:**

```sql
-- EMERGENCY ROLLBACK (only if absolutely necessary)
-- WARNING: This will delete all data in these tables

DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;  
DROP TABLE IF EXISTS reviews CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS current_user_has_role(TEXT);
DROP FUNCTION IF EXISTS current_user_is_admin();
DROP FUNCTION IF EXISTS is_job_participant(UUID);
```

---

## File Locations

```
tradie-helper/
├── supabase/migrations/
│   ├── 006_missing_tables_safe.sql      ← Step 2
│   └── 007_conditional_rls_policies.sql ← Step 3
├── scripts/
│   └── validate-database-state.sql      ← Step 1 & 4
└── docs/
    └── MIGRATION_DEPLOYMENT_STEPS.md    ← This file
```

---

## Support

**If you encounter issues:**

1. **Check the troubleshooting sections above**
2. **Run the validation script to see current database state**  
3. **Verify you're using the correct migration files**
4. **Check Supabase logs for detailed error messages**

**Remember:** These migrations are designed to be safe and non-destructive. They won't break existing data or functionality.