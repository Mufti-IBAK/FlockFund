-- =====================================================
-- FlockFund — Fix Infinite Recursion in Profiles RLS
-- =====================================================
-- Run this in Supabase SQL Editor.
-- 
-- PROBLEM: profiles_admin_all policy queries profiles
-- table inside a profiles policy → infinite recursion.
--
-- SOLUTION: Create a SECURITY DEFINER function that
-- bypasses RLS to check admin role, then rewrite all
-- admin policies to use it.
-- =====================================================

-- 1. CREATE HELPER FUNCTION (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. FIX PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (public.is_admin());

-- 3. FIX ALL OTHER ADMIN POLICIES (they all have the same pattern)
DROP POLICY IF EXISTS "settings_admin_all" ON settings;
CREATE POLICY "settings_admin_all" ON settings FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "flocks_admin_all" ON flocks;
CREATE POLICY "flocks_admin_all" ON flocks FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "investments_admin_all" ON investments;
CREATE POLICY "investments_admin_all" ON investments FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "farm_reports_admin_all" ON farm_reports;
CREATE POLICY "farm_reports_admin_all" ON farm_reports FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "market_updates_admin_all" ON market_updates;
CREATE POLICY "market_updates_admin_all" ON market_updates FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "profit_cycles_admin_all" ON profit_cycles;
CREATE POLICY "profit_cycles_admin_all" ON profit_cycles FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "investor_payouts_admin_all" ON investor_payouts;
CREATE POLICY "investor_payouts_admin_all" ON investor_payouts FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "feed_logs_admin_all" ON feed_logs;
CREATE POLICY "feed_logs_admin_all" ON feed_logs FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "weight_records_admin_all" ON weight_records;
CREATE POLICY "weight_records_admin_all" ON weight_records FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "fcr_calculations_admin_all" ON fcr_calculations;
CREATE POLICY "fcr_calculations_admin_all" ON fcr_calculations FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "badges_admin_all" ON badges;
CREATE POLICY "badges_admin_all" ON badges FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "investor_badges_admin_all" ON investor_badges;
CREATE POLICY "investor_badges_admin_all" ON investor_badges FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "community_posts_admin_all" ON community_posts;
CREATE POLICY "community_posts_admin_all" ON community_posts FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "post_comments_admin_all" ON post_comments;
CREATE POLICY "post_comments_admin_all" ON post_comments FOR ALL
  USING (public.is_admin());

-- 4. ALSO FIX MANAGER/KEEPER POLICIES (same pattern issue)
DROP POLICY IF EXISTS "farm_reports_manager_all" ON farm_reports;
CREATE POLICY "farm_reports_manager_all" ON farm_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'farm_manager'
  ));

DROP POLICY IF EXISTS "feed_logs_manager_rw" ON feed_logs;
CREATE POLICY "feed_logs_manager_rw" ON feed_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'farm_manager'
  ));

DROP POLICY IF EXISTS "weight_records_manager_rw" ON weight_records;
CREATE POLICY "weight_records_manager_rw" ON weight_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'farm_manager'
  ));

-- 5. VERIFY: This should now return your role without error
SELECT id, role, full_name FROM profiles
WHERE id = auth.uid();
