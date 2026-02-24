-- =====================================================
-- FlockFund — Fix Admin Role
-- =====================================================
-- Run this in Supabase SQL Editor NOW.
-- It sets muftiibnalkhattab@gmail.com to admin role.
-- =====================================================

UPDATE profiles
SET role = 'admin', full_name = 'Mufti Ibn Al Khattab'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'muftiibnalkhattab@gmail.com'
  LIMIT 1
);

-- Verify it worked (returns 'admin' if successful)
SELECT id, role, full_name FROM profiles
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'muftiibnalkhattab@gmail.com'
  LIMIT 1
);
