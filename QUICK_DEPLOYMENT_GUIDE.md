# ⚡ Quick Deployment Guide

## 🚨 Migration Files Run Order

| Step | File | Purpose | Required |
|------|------|---------|----------|
| 0 | `scripts/deployment-checklist.sql` | Pre-check | Recommended |
| 1 | `supabase/migrations/006_missing_tables_safe.sql` | Create tables | **YES** |
| 2 | `supabase/migrations/007_conditional_rls_policies.sql` | Apply security | **YES** |

---

## 🏃‍♂️ 30-Second Deployment

### Step 1: Pre-Check (Optional)
```sql
-- Copy/paste: scripts/deployment-checklist.sql
-- Look for: 🟢 READY TO DEPLOY
```

### Step 2: Create Tables
```sql
-- Copy/paste: supabase/migrations/006_missing_tables_safe.sql
-- Look for: NOTICE: 🎉 All missing tables are now available!
```

### Step 3: Apply Security  
```sql
-- Copy/paste: supabase/migrations/007_conditional_rls_policies.sql  
-- Look for: Conditional RLS policies applied successfully to existing tables!
```

### Step 4: Verify (Optional)
```sql
SELECT COUNT(*) FROM reviews;        -- Should return: 0
SELECT COUNT(*) FROM notifications; -- Should return: 0  
SELECT COUNT(*) FROM file_uploads;  -- Should return: 0
```

---

## 🔧 Troubleshooting

| Error | File to Use |
|-------|-------------|
| `column "table_name" is ambiguous` | Use `006_missing_tables_safe.sql` (not old versions) |
| `column "is_visible" does not exist` | Use `007_conditional_rls_policies.sql` (not old versions) |
| `relation "notifications" does not exist` | Run Step 1 before Step 2 |

---

## 📍 File Locations

```
tradie-helper/
├── supabase/migrations/
│   ├── 006_missing_tables_safe.sql      ← Step 1 ✅
│   └── 007_conditional_rls_policies.sql ← Step 2 ✅
└── scripts/
    └── deployment-checklist.sql         ← Step 0 📊
```

---

## ✅ Success Indicators

- **Step 1**: `NOTICE: 🎉 All missing tables are now available!`
- **Step 2**: `Conditional RLS policies applied successfully to existing tables!`
- **Verify**: All COUNT queries return `0`

---

## 🆘 Emergency Rollback

```sql
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;  
DROP TABLE IF EXISTS reviews CASCADE;
DROP FUNCTION IF EXISTS current_user_has_role(TEXT);
DROP FUNCTION IF EXISTS current_user_is_admin();
DROP FUNCTION IF EXISTS is_job_participant(UUID);
```

**⚠️ WARNING**: Rollback deletes all data in new tables!