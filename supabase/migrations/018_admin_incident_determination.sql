-- Migration 018: Admin Incident Determination & Detailed Workflow

-- 1. ENUM FOR ADMIN DETERMINATION
CREATE TYPE incident_determination AS ENUM (
  'resolved_no_neg',
  'risk_alert_no_neg',
  'risk_neg_found'
);

-- 2. ENHANCE incident_reports TABLE
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS admin_determination incident_determination;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS admin_resolution_notes TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS investigation_started_at TIMESTAMPTZ;

-- 3. UPDATED SCHEMA FOR ACTIVITY LOGGING (if not exists)
-- This ensures we can track specific event types for the 9-item feed
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POLICIES
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_read_audit" ON audit_logs
  FOR SELECT USING (true);
