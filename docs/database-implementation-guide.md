# Tradie Helper Database Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the complete Tradie Helper database architecture on Supabase.

## Implementation Order

### Phase 1: Core Schema Setup
```bash
# 1. Run the main database schema
psql -h your-supabase-db-url -f docs/database-schema.sql

# 2. Apply Row Level Security policies  
psql -h your-supabase-db-url -f docs/rls-policies.sql

# 3. Configure storage buckets
psql -h your-supabase-db-url -f docs/storage-setup.sql
```

### Phase 2: Environment Configuration

1. **Supabase Project Settings**
   - Enable Row Level Security
   - Configure JWT settings
   - Set up authentication providers

2. **Environment Variables**
   ```env
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-key
   STRIPE_SECRET_KEY=your-stripe-secret
   STRIPE_WEBHOOK_SECRET=your-webhook-secret
   ```

### Phase 3: Initial Data Setup

```sql
-- Create admin user (run after first admin signs up)
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-admin-user-id';

-- Set up initial configuration data
INSERT INTO admin_actions (admin_id, action_type, reason, notes)
VALUES (
    'your-admin-user-id',
    'verify_user',
    'System initialization',
    'Initial admin setup completed'
);
```

## Testing the Implementation

### 1. Schema Validation
```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 2. RLS Policy Testing
```sql
-- Test as different user roles
SET role authenticated;
SELECT * FROM profiles; -- Should only see own profile

-- Test job visibility
SELECT * FROM jobs WHERE status = 'open'; -- Should see all open jobs
```

### 3. Storage Bucket Testing
- Upload test files to each bucket
- Verify access controls work correctly
- Test signed URL generation

## API Integration Points

### 1. Profile Management
```typescript
// Create profile after auth signup
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    role: 'helper',
    full_name: 'John Doe',
    phone: '+61400000000'
  });
```

### 2. Job Operations  
```typescript
// Create new job
const { data, error } = await supabase
  .from('jobs')
  .insert({
    tradie_id: user.id,
    title: 'Site cleanup',
    description: 'Clear debris and sweep',
    location: '123 Main St, Sydney',
    date_time: '2025-09-01T08:00:00Z',
    duration_hours: 4,
    pay_rate: 35.00
  });
```

### 3. Location-Based Queries
```typescript
// Find nearby jobs
const { data, error } = await supabase
  .rpc('get_jobs_within_radius', {
    user_lat: -33.8688,
    user_lon: 151.2093,
    radius_km: 20
  });
```

## Performance Optimization

### 1. Connection Pooling
```javascript
// Configure connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: {
      'x-connection-mode': 'session'
    }
  }
});
```

### 2. Query Optimization
- Use proper indexes for frequent queries
- Implement pagination for large result sets
- Cache frequently accessed data
- Use materialized views for complex aggregations

### 3. Monitoring Setup
```sql
-- Monitor query performance
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] JWT authentication configured
- [ ] File upload restrictions in place
- [ ] Admin permissions properly restricted
- [ ] Audit trails functioning
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] Data encryption at rest enabled

## Maintenance Tasks

### Daily
- Monitor database performance
- Check error logs
- Verify backup completion

### Weekly  
- Review audit trails
- Clean up orphaned files
- Update performance statistics

### Monthly
- Security audit review
- Capacity planning assessment
- Policy effectiveness review

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**
   ```
   Error: new row violates row-level security policy
   Solution: Check user role and policy conditions
   ```

2. **File Upload Failures**
   ```
   Error: Storage policy violation
   Solution: Verify bucket permissions and file path format
   ```

3. **Performance Issues**
   ```
   Problem: Slow location queries
   Solution: Ensure PostGIS extension is properly configured
   ```

### Debug Queries
```sql
-- Check current user context
SELECT 
    auth.uid() as user_id,
    auth.role() as auth_role,
    p.role as profile_role,
    p.verified
FROM profiles p 
WHERE p.id = auth.uid();

-- Test policy conditions
EXPLAIN (ANALYZE, VERBOSE) 
SELECT * FROM jobs 
WHERE status = 'open';
```

## Migration Strategy

### Schema Updates
```sql
-- Example migration script
BEGIN;

-- Add new column
ALTER TABLE jobs ADD COLUMN priority INTEGER DEFAULT 1;

-- Create index
CREATE INDEX idx_jobs_priority ON jobs(priority);

-- Update RLS policies if needed
DROP POLICY "existing_policy" ON jobs;
CREATE POLICY "updated_policy" ON jobs FOR SELECT USING (...);

COMMIT;
```

### Data Migrations
- Always test migrations on staging first
- Plan for rollback scenarios  
- Monitor performance during migration
- Communicate downtime to users

This implementation guide provides a comprehensive roadmap for setting up the Tradie Helper database with proper security, performance, and maintainability considerations.