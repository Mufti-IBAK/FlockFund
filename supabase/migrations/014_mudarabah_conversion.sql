-- =====================================================
-- FlockFund — Migration 014: Mudarabah Al-Muqayyada Conversion
-- =====================================================
-- Converts the platform from the original investment model
-- to a Shariah-compliant Mudarabah Al-Muqayyada structure.
--
-- Key changes:
--   1. Reverse profit split: 70% FlockFund (Mudarib) / 30% Investor (Rabb-ul-Maal)
--   2. New table: mudarabah_agreements (digital contract capture)
--   3. New table: flock_costs (transparent, itemized cost tracking)
--   4. New table: incident_reports (negligence investigation workflow)
--   5. Enhanced investments table (capital_amount, agreement link, ratios)
--   6. Enhanced profit_cycles table (capital-first calculation model)
-- =====================================================

-- =====================================================
-- 1. REVERSE PROFIT SPLIT DEFAULTS
-- =====================================================

-- Global settings: investor 70→30, flockfund 30→70
UPDATE settings
  SET investor_share_percentage  = 30,
      flockfund_share_percentage = 70
WHERE id = 1;

ALTER TABLE settings
  ALTER COLUMN investor_share_percentage  SET DEFAULT 30;
ALTER TABLE settings
  ALTER COLUMN flockfund_share_percentage SET DEFAULT 70;

-- Flocks table defaults (flock-specific overrides)
ALTER TABLE flocks
  ALTER COLUMN investor_share_percentage  SET DEFAULT 30;
ALTER TABLE flocks
  ALTER COLUMN flockfund_share_percentage SET DEFAULT 70;


-- =====================================================
-- 2. MUDARABAH AGREEMENTS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS mudarabah_agreements (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id         UUID REFERENCES investments(id) ON DELETE CASCADE,
  investor_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_text        TEXT NOT NULL,
  ip_address            VARCHAR(45),
  user_agent            TEXT,
  signed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Core Mudarabah terms (embedded for legal record)
  restricted_business   TEXT NOT NULL DEFAULT 'Broiler chicken farming only',
  profit_share_agreed   VARCHAR(20) NOT NULL DEFAULT '70/30',
  loss_liability        TEXT NOT NULL DEFAULT 'Investor bears financial loss unless negligence proven',
  negligence_definition TEXT
);

ALTER TABLE mudarabah_agreements ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "mudarabah_agreements_admin_all"
  ON mudarabah_agreements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Investor: read own agreements
CREATE POLICY "mudarabah_agreements_investor_own"
  ON mudarabah_agreements FOR SELECT
  USING (investor_id = auth.uid());

-- Investor: insert own agreements (during checkout)
CREATE POLICY "mudarabah_agreements_investor_insert"
  ON mudarabah_agreements FOR INSERT
  WITH CHECK (investor_id = auth.uid());


-- =====================================================
-- 3. FLOCK COSTS TABLE (NEW) — Transparent cost tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS flock_costs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id       UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  cost_category  VARCHAR(100) NOT NULL
    CHECK (cost_category IN ('feed', 'drugs', 'maintenance', 'tax', 'stamp_duty', 'labor', 'overhead', 'other')),
  amount         NUMERIC NOT NULL CHECK (amount >= 0),
  description    TEXT,
  incurred_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url    TEXT,
  verified       BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by    UUID REFERENCES profiles(id),
  verified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE flock_costs ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "flock_costs_admin_all"
  ON flock_costs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Farm Manager: full access (add + verify costs)
CREATE POLICY "flock_costs_manager_all"
  ON flock_costs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'
  ));

-- Investor: read-only (transparency)
CREATE POLICY "flock_costs_investor_read"
  ON flock_costs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'investor'
  ));


-- =====================================================
-- 4. INCIDENT REPORTS TABLE (NEW) — Negligence tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flock_id              UUID NOT NULL REFERENCES flocks(id) ON DELETE CASCADE,
  incident_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  description           TEXT NOT NULL,
  cause                 TEXT NOT NULL
    CHECK (cause IN ('disease', 'natural_disaster', 'negligence', 'mismanagement', 'other')),
  investigation_notes   TEXT,
  findings              TEXT,
  negligence_found      BOOLEAN NOT NULL DEFAULT FALSE,
  reported_by           UUID NOT NULL REFERENCES profiles(id),
  resolved_at           TIMESTAMPTZ,
  compensation_required NUMERIC NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "incident_reports_admin_all"
  ON incident_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Farm Manager: full access (investigate + document)
CREATE POLICY "incident_reports_manager_all"
  ON incident_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'
  ));

-- Keeper: insert own reports
CREATE POLICY "incident_reports_keeper_insert"
  ON incident_reports FOR INSERT
  WITH CHECK (
    reported_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'keeper')
  );

-- Keeper: read own reports
CREATE POLICY "incident_reports_keeper_read"
  ON incident_reports FOR SELECT
  USING (
    reported_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'keeper')
  );

-- Investor: read resolved incidents for flocks they are invested in
CREATE POLICY "incident_reports_investor_read"
  ON incident_reports FOR SELECT
  USING (
    resolved_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM investments i
      WHERE i.flock_id = incident_reports.flock_id
        AND i.investor_id = auth.uid()
    )
  );


-- =====================================================
-- 5. ENHANCE INVESTMENTS TABLE
-- =====================================================
ALTER TABLE investments ADD COLUMN IF NOT EXISTS capital_amount NUMERIC;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS mudarabah_agreement_id UUID REFERENCES mudarabah_agreements(id);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS profit_ratio_investor NUMERIC DEFAULT 30;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS profit_ratio_mudarib NUMERIC DEFAULT 70;

-- Backfill capital_amount from cost_paid for existing records
UPDATE investments SET capital_amount = cost_paid WHERE capital_amount IS NULL;


-- =====================================================
-- 6. ENHANCE PROFIT_CYCLES TABLE (capital-first model)
-- =====================================================
ALTER TABLE profit_cycles ADD COLUMN IF NOT EXISTS total_capital_returned NUMERIC DEFAULT 0;
ALTER TABLE profit_cycles ADD COLUMN IF NOT EXISTS total_costs_deducted NUMERIC DEFAULT 0;
ALTER TABLE profit_cycles ADD COLUMN IF NOT EXISTS net_profit NUMERIC DEFAULT 0;
ALTER TABLE profit_cycles ADD COLUMN IF NOT EXISTS investor_profit_share NUMERIC DEFAULT 0;
ALTER TABLE profit_cycles ADD COLUMN IF NOT EXISTS mudarib_profit_share NUMERIC DEFAULT 0;


-- =====================================================
-- 7. ENABLE REALTIME FOR NEW TABLES
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE incident_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE flock_costs;
