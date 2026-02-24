-- =====================================================
-- FlockFund — Fix Column Mismatches & Add Missing Columns
-- =====================================================
-- Run in Supabase SQL Editor

-- ─── FLOCKS: add flock_name alias + batch_size + nullable expected_end_date ───
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS flock_name TEXT;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS batch_size INT;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS mortality_count INT DEFAULT 0;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS total_feed_kg NUMERIC DEFAULT 0;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS current_count INT DEFAULT 0;

-- Sync flock_name from name for existing rows
UPDATE flocks SET flock_name = name WHERE flock_name IS NULL;
UPDATE flocks SET batch_size = total_birds WHERE batch_size IS NULL;
UPDATE flocks SET current_count = total_birds WHERE current_count IS NULL;

-- Make expected_end_date nullable (it was NOT NULL before)
ALTER TABLE flocks ALTER COLUMN expected_end_date DROP NOT NULL;

-- Add status values: growing, harvesting
ALTER TABLE flocks DROP CONSTRAINT IF EXISTS flocks_status_check;
ALTER TABLE flocks ADD CONSTRAINT flocks_status_check CHECK (status IN ('active','growing','harvesting','completed','cancelled'));

-- ─── BADGES: add icon_name + created_at ───
ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'emoji_events';
ALTER TABLE badges ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Sync icon_name from icon_url for existing default badges
UPDATE badges SET icon_name = CASE
  WHEN name = 'Early Bird' THEN 'egg_alt'
  WHEN name = 'Reinvestment Champion' THEN 'recycling'
  WHEN name = 'Flock Veteran' THEN 'military_tech'
  WHEN name = 'Referral Star' THEN 'star'
  ELSE 'emoji_events'
END WHERE icon_name = 'emoji_events' OR icon_name IS NULL;

-- ─── INVESTMENTS: add missing columns ───
ALTER TABLE investments ADD COLUMN IF NOT EXISTS amount_invested NUMERIC DEFAULT 0;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE investments ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS payment_gateway TEXT;

-- Sync amount_invested from cost_paid
UPDATE investments SET amount_invested = cost_paid WHERE amount_invested = 0 OR amount_invested IS NULL;

-- Drop any existing constraint and add one that allows all lifecycle states
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_status_check;
ALTER TABLE investments ADD CONSTRAINT investments_status_check
  CHECK (status IN ('pending','active','completed','failed','expired'));

-- ─── FARM_REPORTS: add keeper_id alias + temperature_celsius alias ───
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS keeper_id UUID;
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS temperature_celsius NUMERIC;

-- Sync keeper_id from reporter_id and temperature_celsius from temperature
UPDATE farm_reports SET keeper_id = reporter_id WHERE keeper_id IS NULL;
UPDATE farm_reports SET temperature_celsius = temperature WHERE temperature_celsius IS NULL;

-- ─── REFERRALS TABLE ───
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed_up','invested')),
  bonus_amount NUMERIC DEFAULT 0,
  bonus_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_admin_all" ON referrals;
CREATE POLICY "referrals_admin_all" ON referrals FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "referrals_own_read" ON referrals;
CREATE POLICY "referrals_own_read" ON referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- ─── TRANSACTIONS TABLE (for admin payments page) ───
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  investment_id UUID,
  type TEXT NOT NULL CHECK (type IN ('investment','withdrawal','refund','bonus')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  gateway TEXT,
  reference TEXT,
  gateway_response JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_admin_all" ON transactions;
CREATE POLICY "transactions_admin_all" ON transactions FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "transactions_own_read" ON transactions;
CREATE POLICY "transactions_own_read" ON transactions FOR SELECT
  USING (investor_id = auth.uid());

-- ─── PROFILES: add referral_code + bank columns ───
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Generate referral codes for existing users
UPDATE profiles SET referral_code = UPPER(LEFT(id::text, 8))
WHERE referral_code IS NULL;

-- ─── WITHDRAWALS TABLE ───
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  investment_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  payment_reference TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawals_admin_all" ON withdrawals;
CREATE POLICY "withdrawals_admin_all" ON withdrawals FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "withdrawals_investor_own_read" ON withdrawals;
CREATE POLICY "withdrawals_investor_own_read" ON withdrawals FOR SELECT
  USING (investor_id = auth.uid());

DROP POLICY IF EXISTS "withdrawals_investor_insert" ON withdrawals;
CREATE POLICY "withdrawals_investor_insert" ON withdrawals FOR INSERT
  WITH CHECK (investor_id = auth.uid());

-- ─── SETTINGS: add referral_bonus column ───
ALTER TABLE settings ADD COLUMN IF NOT EXISTS referral_bonus NUMERIC DEFAULT 500;

-- ─── FCR_CALCULATIONS: recreate with new simplified schema ───
DROP TABLE IF EXISTS fcr_calculations CASCADE;
CREATE TABLE fcr_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  avg_weight_kg NUMERIC DEFAULT 0,
  total_feed_kg NUMERIC DEFAULT 0,
  fcr NUMERIC DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flock_id, week_number)
);

ALTER TABLE fcr_calculations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fcr_admin_all" ON fcr_calculations;
CREATE POLICY "fcr_admin_all" ON fcr_calculations FOR ALL
  USING (public.is_admin());
DROP POLICY IF EXISTS "fcr_manager_read" ON fcr_calculations;
CREATE POLICY "fcr_manager_read" ON fcr_calculations FOR SELECT
  USING (true);

-- ─── MARKET_UPDATES: recreate with new simplified schema ───
DROP TABLE IF EXISTS market_updates CASCADE;
CREATE TABLE market_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  floor_price NUMERIC NOT NULL,
  market_cost NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "market_updates_admin_all" ON market_updates;
CREATE POLICY "market_updates_admin_all" ON market_updates FOR ALL
  USING (public.is_admin());
DROP POLICY IF EXISTS "market_updates_public_read" ON market_updates;
CREATE POLICY "market_updates_public_read" ON market_updates FOR SELECT
  USING (true);
