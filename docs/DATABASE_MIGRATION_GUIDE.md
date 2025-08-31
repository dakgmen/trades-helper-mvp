# Database Migration Guide

## Overview

This guide covers the safe deployment of missing database tables and RLS policies for the tradie-helper project.

## Migration Files

### 1. `006_missing_tables_safe.sql` - Ultra-Safe Table Creation
**Purpose**: Creates missing tables (reviews, notifications, file_uploads) with comprehensive safety checks.

**Safety Features**:
- ✅ Column existence validation before applying comments
- ✅ Table existence checks before creating indexes
- ✅ Comprehensive error handling with detailed reporting
- ✅ Automatic cleanup of utility functions
- ✅ Non-destructive operations only

### 2. `007_conditional_rls_policies.sql` - Conditional Row Level Security
**Purpose**: Applies complete RLS policies for all tables that actually exist in the database.

**Security Features**:
- ✅ Conditional policy application based on table existence
- ✅ Column existence checks for compatibility with different schema versions
- ✅ Proper role-based access control
- ✅ Job participant validation
- ✅ Admin override capabilities
- ✅ Privacy protection for user data

## Pre-Deployment Checklist

### ✅ Prerequisites Verified
- [x] Column name consistency between migration and RLS policies
- [x] Safety checks for table existence
- [x] Column existence validation before comments
- [x] Proper foreign key relationships
- [x] RLS policy column references match table schema

### ✅ Known Issues Resolved
- [x] "column work_quality does not exist" - Fixed with column existence checks
- [x] "relation notifications does not exist" - Tables created before RLS policies
- [x] Column naming inconsistency (visible vs is_visible) - Standardized to is_*
- [x] "column reference table_name is ambiguous" - Fixed function parameters with p_ prefix
- [x] "column is_visible does not exist" - Created conditional RLS policies with existence checks
- [x] "policy does not exist" when adding comments - Added policy existence checks before comments

## Deployment Steps

### Step 1: Deploy Table Creation (Safe)
```sql
-- Run in Supabase SQL Editor
-- File: 006_missing_tables_safe.sql
```

**Expected Output**:
```
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

### Step 2: Deploy Conditional RLS Policies
```sql
-- Run in Supabase SQL Editor AFTER Step 1 completes successfully
-- File: 007_conditional_rls_policies.sql
```

**Expected Output**:
```
CREATE FUNCTION
CREATE FUNCTION  
CREATE FUNCTION
NOTICE: ✅ Reviews table RLS policies applied
NOTICE: ✅ Notifications table RLS policies applied
NOTICE: ✅ File uploads table RLS policies applied
NOTICE: ✅ Enhanced profile visibility policies applied
NOTICE: ✅ Permissions granted for existing tables

"Conditional RLS policies applied successfully to existing tables!"
```

**If tables don't exist yet**:
```
NOTICE: ⏭️  Reviews table does not exist - skipping RLS policies
NOTICE: ⏭️  Notifications table does not exist - skipping RLS policies
NOTICE: ⏭️  File uploads table does not exist - skipping RLS policies
```

## Table Schema Summary

### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  reviewer_id UUID REFERENCES profiles(id),
  reviewee_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  work_quality INTEGER CHECK (work_quality >= 1 AND work_quality <= 5),
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  is_visible BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Notifications Table  
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  related_job_id UUID REFERENCES jobs(id),
  related_application_id UUID REFERENCES job_applications(id),
  related_payment_id UUID REFERENCES payments(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  scheduled_for TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### File Uploads Table
```sql
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('profile_image', 'white_card', 'id_document', 'job_image', 'other')),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS Policy Summary

### Reviews Policies
- ✅ Public can view visible, non-flagged reviews
- ✅ Job participants can create reviews for completed jobs  
- ✅ Reviewers can edit their reviews within 7 days
- ✅ Admins can manage all reviews

### Notifications Policies
- ✅ Users can view their own notifications
- ✅ Users can mark their notifications as read
- ✅ Admins can view all notifications
- ✅ System creates notifications via application logic

### File Uploads Policies
- ✅ Users can upload their own files
- ✅ Users can view/update/delete their own files
- ✅ Admins can view all files for verification
- ✅ Admins can update verification status

## Rollback Plan

If issues occur, the migration can be safely rolled back:

```sql
-- Emergency rollback (if needed)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;  
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP FUNCTION IF EXISTS current_user_has_role(TEXT);
DROP FUNCTION IF EXISTS current_user_is_admin();
DROP FUNCTION IF EXISTS is_job_participant(UUID);
```

## Verification Queries

After deployment, verify with these queries:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('reviews', 'notifications', 'file_uploads');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('reviews', 'notifications', 'file_uploads');

-- Verify policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('reviews', 'notifications', 'file_uploads');

-- Test basic functionality
INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) 
VALUES (
  (SELECT id FROM jobs LIMIT 1),
  auth.uid(),
  (SELECT id FROM profiles WHERE id != auth.uid() LIMIT 1),
  5,
  'Test review'
);
```

## Support & Troubleshooting

### Common Issues

1. **"relation does not exist"** - Run table creation migration first
2. **"column does not exist"** - Migration includes column existence checks
3. **"permission denied"** - Ensure RLS policies are applied after table creation

### Contact
For migration support, check the project's issue tracker or contact the development team.

---

**⚠️ Important**: Always test migrations in a development environment before applying to production.