-- Migration 021: Fix Sales Manager role and Incident updated_at trigger

-- 1. Update profiles role check to include sales_manager and accountant explicitly if missing
-- Note: Profiles table check constraint might vary, we ensure it's broad enough.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'farm_manager', 'keeper', 'investor', 'accountant', 'sales_manager'));

-- 2. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply trigger to incident_reports
ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS set_incident_updated_at ON public.incident_reports;
CREATE TRIGGER set_incident_updated_at
BEFORE UPDATE ON public.incident_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Apply trigger to farm_reports (good practice)
DROP TRIGGER IF EXISTS set_reports_updated_at ON public.farm_reports;
CREATE TRIGGER set_reports_updated_at
BEFORE UPDATE ON public.farm_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
