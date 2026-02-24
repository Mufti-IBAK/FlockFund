-- Add bank details columns to profiles table for withdrawal payouts
-- Run in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create withdrawals table if not exists
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  investment_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_reference TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (investor_id = auth.uid());

CREATE POLICY "Investors can insert own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Service role can update withdrawals"
  ON withdrawals FOR UPDATE
  USING (true);
