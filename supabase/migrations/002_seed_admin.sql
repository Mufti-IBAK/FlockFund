-- =====================================================
-- FlockFund — Seed Admin User
-- =====================================================
-- Run this AFTER the 001_initial.sql migration AND after
-- the admin user has signed up via the UI or Supabase Auth.
--
-- This script finds the user by email and grants them
-- admin access with a special "super_admin" flag that
-- allows role-switching for testing purposes.
-- =====================================================

-- Step 1: Update the profile to admin role
UPDATE profiles
SET role = 'admin', full_name = 'Mufti Ibn Al-Khattab'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'muftiibnalkhattab@gmail.com'
  LIMIT 1
);

-- Step 2: Create a policy that lets this admin bypass all RLS
-- (already covered by the admin_all policies in 001_initial.sql)
-- The admin role already has full access via the existing policies.

-- Step 3: Insert a special settings flag for role-switching (stored in profile metadata)
-- We use a simple approach: the login page will allow role selection,
-- and the middleware will read the selected role from a cookie.
-- No additional DB changes needed — the role-switch is client-side only
-- for testing/review purposes.
