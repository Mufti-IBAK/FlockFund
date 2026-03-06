-- =====================================================
-- FlockFund — Migration 016: Staff Salaries
-- =====================================================

-- 1. Add salary_amount to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_amount NUMERIC DEFAULT 0;

-- 2. Create staff_payments table
CREATE TABLE IF NOT EXISTS staff_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_month TEXT NOT NULL, -- e.g. 'March'
    payment_year INT NOT NULL,    -- e.g. 2026
    payment_reference TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    processed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;

-- Accountant & Admin full access
CREATE POLICY "staff_payments_admin_all" ON staff_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'accountant')));

-- Staff member can view own payments
CREATE POLICY "staff_payments_read_own" ON staff_payments FOR SELECT
  USING (staff_id = auth.uid());

-- 3. Update Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff_payments;
