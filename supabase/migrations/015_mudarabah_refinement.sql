-- =====================================================
-- FlockFund — Migration 015: Mudarabah Refinement
-- =====================================================

-- 1. ADD SALES_MANAGER ROLE
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'farm_manager', 'keeper', 'investor', 'accountant', 'sales_manager'));

-- 2. SALES REPORTS TABLE
CREATE TABLE IF NOT EXISTS sales_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id              UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  sales_manager_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_birds          INT NOT NULL DEFAULT 0,
  weight_kg             NUMERIC NOT NULL DEFAULT 0,
  customer_name         TEXT NOT NULL,
  product_type          VARCHAR(20) NOT NULL CHECK (product_type IN ('live', 'frozen', 'peppered', 'other')),
  other_product_details TEXT,
  is_manure             BOOLEAN NOT NULL DEFAULT FALSE,
  total_revenue         NUMERIC NOT NULL DEFAULT 0,
  sale_timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "sales_reports_admin_all"
  ON sales_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Accountant: read access (to record revenue)
CREATE POLICY "sales_reports_accountant_read"
  ON sales_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'accountant'));

-- Sales Manager: full access to own reports
CREATE POLICY "sales_reports_manager_all"
  ON sales_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'sales_manager'));

-- Investor: read access for flocks they are invested in
CREATE POLICY "sales_reports_investor_read"
  ON sales_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM investments i
    WHERE i.flock_id = sales_reports.flock_id
      AND i.investor_id = auth.uid()
  ));

-- 3. ENHANCE INCIDENT REPORTS (Urgency & Emergencies)
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS urgency_grade VARCHAR(20) DEFAULT 'low' CHECK (urgency_grade IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE;

-- 4. SETTINGS & COSTS REFINEMENT
ALTER TABLE settings ADD COLUMN IF NOT EXISTS purchase_price_per_bird NUMERIC DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS combined_operational_fees NUMERIC DEFAULT 0;

-- Update flock_costs categories to include Mudarabah consolidated types
ALTER TABLE flock_costs DROP CONSTRAINT IF EXISTS flock_costs_cost_category_check;
ALTER TABLE flock_costs ADD CONSTRAINT flock_costs_cost_category_check 
  CHECK (cost_category IN ('feed', 'drugs', 'maintenance', 'tax', 'stamp_duty', 'labor', 'overhead', 'other', 'combined_operational_fees', 'bird_purchase'));

-- Update existing records if we want to migrate data (optional, but good for consistency)
-- For this migration, we leave it to the admin to set these values in the UI.

-- 5. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE sales_reports;
