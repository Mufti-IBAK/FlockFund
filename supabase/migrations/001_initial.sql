-- =====================================================
-- FlockFund — Initial Database Migration
-- =====================================================
-- Run this against your Supabase project SQL editor.
-- It creates all tables, RLS policies, and seed data.
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'investor'
    CHECK (role IN ('admin','farm_manager','keeper','investor')),
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin: all operations
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Non-admin: read own
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Allow users to update their own name
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'investor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. SETTINGS (singleton — only 1 row)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cost_per_bird NUMERIC NOT NULL DEFAULT 4250,
  cost_breakdown JSONB NOT NULL DEFAULT '{
    "feed": 2500,
    "drugs": 400,
    "maintenance": 350,
    "mortality_buffer": 300,
    "operational": 400,
    "services": 300
  }'::JSONB,
  market_floor_price NUMERIC NOT NULL DEFAULT 5500,
  market_cost NUMERIC NOT NULL DEFAULT 5000,
  investor_share_percentage NUMERIC NOT NULL DEFAULT 70
    CHECK (investor_share_percentage BETWEEN 0 AND 100),
  flockfund_share_percentage NUMERIC NOT NULL DEFAULT 30,
  reinvest_percentage NUMERIC NOT NULL DEFAULT 30
    CHECK (reinvest_percentage BETWEEN 0 AND 100),
  rounds_before_withdrawal INT NOT NULL DEFAULT 3,
  payment_gateway TEXT NOT NULL DEFAULT 'flutterwave'
    CHECK (payment_gateway IN ('flutterwave','paystack','paypal')),
  payment_gateway_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  blockchain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  blockchain_network TEXT,
  blockchain_contract_address TEXT,
  data_monetization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_all" ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "settings_read_all" ON settings FOR SELECT
  USING (TRUE);

-- Seed the single settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. FLOCKS
-- =====================================================
CREATE TABLE IF NOT EXISTS flocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date DATE NOT NULL,
  total_birds INT NOT NULL CHECK (total_birds > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE flocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flocks_admin_all" ON flocks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "flocks_read_all" ON flocks FOR SELECT
  USING (TRUE);

-- =====================================================
-- 4. INVESTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  birds_owned INT NOT NULL CHECK (birds_owned > 0),
  cost_paid NUMERIC NOT NULL,
  round_count INT NOT NULL DEFAULT 0,
  payment_gateway_used TEXT NOT NULL,
  payment_transaction_id TEXT UNIQUE,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investments_admin_all" ON investments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "investments_investor_own" ON investments FOR SELECT
  USING (investor_id = auth.uid());

CREATE POLICY "investments_investor_insert" ON investments FOR INSERT
  WITH CHECK (investor_id = auth.uid());

-- =====================================================
-- 5. FARM REPORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS farm_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mortality_count INT NOT NULL DEFAULT 0,
  clinical_signs TEXT DEFAULT '',
  temperature NUMERIC,
  feed_available BOOLEAN DEFAULT TRUE,
  water_available BOOLEAN DEFAULT TRUE,
  feed_consumed_kg NUMERIC,
  weight_samples JSONB,
  additional_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES profiles(id),
  vet_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE farm_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farm_reports_admin_all" ON farm_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "farm_reports_manager_all" ON farm_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'));

CREATE POLICY "farm_reports_keeper_own" ON farm_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "farm_reports_keeper_insert" ON farm_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "farm_reports_investor_approved" ON farm_reports FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'investor')
  );

-- =====================================================
-- 6. MARKET UPDATES
-- =====================================================
CREATE TABLE IF NOT EXISTS market_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field TEXT NOT NULL,
  old_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE market_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_updates_admin_all" ON market_updates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "market_updates_read" ON market_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
    AND p.role IN ('farm_manager', 'investor')
  ));

-- =====================================================
-- 7. PROFIT CYCLES
-- =====================================================
CREATE TABLE IF NOT EXISTS profit_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  total_revenue NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  total_profit NUMERIC NOT NULL,
  investor_pool NUMERIC NOT NULL,
  flockfund_share NUMERIC NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profit_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profit_cycles_admin_all" ON profit_cycles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "profit_cycles_read" ON profit_cycles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
    AND p.role IN ('farm_manager', 'investor')
  ));

-- =====================================================
-- 8. INVESTOR PAYOUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS investor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES profit_cycles(id) ON DELETE CASCADE,
  gross_profit_share NUMERIC NOT NULL,
  reinvested_amount NUMERIC NOT NULL DEFAULT 0,
  withdrawable_amount NUMERIC NOT NULL,
  round_number INT NOT NULL,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE investor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investor_payouts_admin_all" ON investor_payouts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "investor_payouts_investor_own" ON investor_payouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM investments i
    WHERE i.id = investor_payouts.investment_id
    AND i.investor_id = auth.uid()
  ));

-- =====================================================
-- 9. FEED LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS feed_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  feed_type TEXT NOT NULL DEFAULT 'standard',
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg > 0),
  cost_per_kg NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_logs_admin_all" ON feed_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "feed_logs_manager_rw" ON feed_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'));

CREATE POLICY "feed_logs_keeper_insert" ON feed_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'keeper'));

-- =====================================================
-- 10. WEIGHT RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bird_identifier TEXT NOT NULL DEFAULT '',
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0),
  age_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_records_admin_all" ON weight_records FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "weight_records_manager_rw" ON weight_records FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'));

CREATE POLICY "weight_records_keeper_insert" ON weight_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'keeper'));

-- =====================================================
-- 11. FCR CALCULATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS fcr_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_feed_kg NUMERIC NOT NULL,
  total_weight_gain_kg NUMERIC NOT NULL,
  fcr NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fcr_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcr_calculations_admin_all" ON fcr_calculations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "fcr_calculations_manager_read" ON fcr_calculations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'));

-- =====================================================
-- 12. BADGES
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon_url TEXT NOT NULL DEFAULT '',
  criteria JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_admin_all" ON badges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "badges_read_all" ON badges FOR SELECT
  USING (TRUE);

-- Seed default badges
INSERT INTO badges (name, description, icon_url, criteria) VALUES
  ('Early Bird', 'Made your very first investment', '🐣', '{"type":"first_investment"}'::JSONB),
  ('Reinvestment Champion', 'Completed 3+ reinvestment rounds', '♻️', '{"type":"round_count","min":3}'::JSONB),
  ('Flock Veteran', 'Invested in 3+ different flocks', '🦅', '{"type":"flock_count","min":3}'::JSONB),
  ('Referral Star', 'Referred 1+ investor who completed an investment', '⭐', '{"type":"referral_count","min":1}'::JSONB)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 13. INVESTOR BADGES (junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS investor_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(investor_id, badge_id)
);

ALTER TABLE investor_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investor_badges_admin_all" ON investor_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "investor_badges_investor_own" ON investor_badges FOR SELECT
  USING (investor_id = auth.uid());

-- =====================================================
-- 14. COMMUNITY POSTS
-- =====================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_admin_all" ON community_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "community_posts_read_all" ON community_posts FOR SELECT
  USING (TRUE);

CREATE POLICY "community_posts_insert_own" ON community_posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "community_posts_update_own" ON community_posts FOR UPDATE
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- =====================================================
-- 15. POST COMMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_admin_all" ON post_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "post_comments_read_all" ON post_comments FOR SELECT
  USING (TRUE);

CREATE POLICY "post_comments_insert_own" ON post_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());


-- =====================================================
-- REALTIME: Enable for live-updating dashboards
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE farm_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE investments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE market_updates;
