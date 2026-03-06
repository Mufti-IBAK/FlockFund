-- =====================================================
-- FlockFund — Migration 017: Incident Workflow & Settings
-- =====================================================

-- 1. ENHANCE INCIDENT REPORTS FOR VET WORKFLOW
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received' 
  CHECK (status IN ('received', 'investigating', 'resolved', 'reported'));

ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS birds_dead INT DEFAULT 0;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS birds_culled INT DEFAULT 0;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS birds_isolated INT DEFAULT 0;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS birds_recovered INT DEFAULT 0;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS birds_sold INT DEFAULT 0;

ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS clinical_exam TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS physical_exam TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS action_plan TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS recommendations TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS history TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS affected_flock_ids UUID[];

-- 2. SETTINGS REFINEMENT
ALTER TABLE settings ADD COLUMN IF NOT EXISTS age_of_purchase_days INT DEFAULT 0;

-- Update payment_gateway to handle multiple selections (JSONB for flexibility)
-- We keep the existing column but will store an array of strings in JSON format if needed, 
-- or we can add a new column for multi-gateways. Let's add 'enabled_gateways'.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enabled_gateways TEXT[] DEFAULT ARRAY['flutterwave'];

-- 3. PERMISSIONS
-- Ensure Manager (VET) can update incidents they are investigating
CREATE POLICY "manager_investigate_incidents" ON incident_reports
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'farm_manager'));
