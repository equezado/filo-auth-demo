# Publisher Role Troubleshooting Guide

## Issue: "Error fetching user role: {}" on first login

This error occurs when a new publisher user tries to sign in but their role hasn't been properly created or is not accessible.

## Root Causes

1. **Database Setup Not Complete**: The `publisher_setup.sql` script hasn't been run
2. **RLS Policy Issues**: Row Level Security policies preventing role creation/access
3. **Timing Issues**: Role creation happens after user authentication
4. **Permission Issues**: User doesn't have permission to access `user_roles` table

## Solutions

### Step 1: Verify Database Setup

1. **Check if tables exist**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_roles', 'posts');
   ```

2. **Check if user_roles table has data**:
   ```sql
   SELECT * FROM user_roles LIMIT 10;
   ```

3. **Verify RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_roles';
   ```

### Step 2: Run Database Setup

If tables don't exist or are incomplete, run the setup script:

```sql
-- Copy and paste the entire publisher_setup.sql content into Supabase SQL Editor
-- Execute the script
```

### Step 3: Test with Debug Page

1. **Access the debug page**: Go to `/debug-role` in your browser
2. **Check the console**: Look for detailed error messages
3. **Verify user role**: The page will show current user role status

### Step 4: Manual Role Creation

If the automatic role creation fails, manually create the role:

```sql
-- Replace 'your-user-id' with the actual user ID from the debug page
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'publisher')
ON CONFLICT (user_id) DO UPDATE SET role = 'publisher';
```

### Step 5: Check Supabase Configuration

1. **Verify RLS is enabled**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'user_roles';
   ```

2. **Check user permissions**:
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user and check if they're confirmed
   - Verify the user has the correct email

## Debug Steps

### 1. Check Browser Console

Look for these specific error messages:
- `Error fetching user role: {}`
- `Error creating user role: ...`
- `No user role found, creating default reader role`

### 2. Use Debug Page

Visit `/debug-role` and check:
- User ID is present
- User role shows correct value
- No database errors in console

### 3. Test Database Connection

Run this in Supabase SQL Editor:
```sql
-- Test if you can query user_roles
SELECT COUNT(*) FROM user_roles;

-- Test if you can insert into user_roles
INSERT INTO user_roles (user_id, role) 
VALUES ('test-user-id', 'reader')
ON CONFLICT (user_id) DO NOTHING;
```

## Common Fixes

### Fix 1: Re-run Database Setup

```sql
-- Drop and recreate user_roles table
DROP TABLE IF EXISTS user_roles CASCADE;

-- Then run the entire publisher_setup.sql script
```

### Fix 2: Fix RLS Policies

```sql
-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Recreate policies
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);
```

### Fix 3: Manual Role Assignment

For existing users without roles:

```sql
-- Get all users without roles
SELECT u.id, u.email 
FROM auth.users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE ur.user_id IS NULL;

-- Assign default reader role to all users without roles
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'reader'
FROM auth.users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE ur.user_id IS NULL;
```

## Prevention

### 1. Ensure Database Setup Runs First

Always run `publisher_setup.sql` before testing the application.

### 2. Test with New User

Create a fresh user account to test the complete flow:
1. Sign up as publisher
2. Check database for role creation
3. Sign in and verify role is loaded

### 3. Monitor Console Logs

Watch for these success messages:
- `User role 'publisher' created successfully for user ...`
- `No user role found, creating default reader role`

## Still Having Issues?

1. **Check Supabase Logs**: Go to Supabase Dashboard → Logs
2. **Verify Environment Variables**: Ensure Supabase URL and key are correct
3. **Test with Different Browser**: Clear cache and try incognito mode
4. **Check Network Tab**: Look for failed API requests to Supabase

## Quick Test Commands

```sql
-- Test 1: Check if user_roles table exists and is accessible
SELECT * FROM user_roles LIMIT 1;

-- Test 2: Check RLS policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'user_roles';

-- Test 3: Check if you can insert a test role
INSERT INTO user_roles (user_id, role) VALUES ('test-123', 'reader') ON CONFLICT DO NOTHING;
SELECT * FROM user_roles WHERE user_id = 'test-123';
DELETE FROM user_roles WHERE user_id = 'test-123';
```
