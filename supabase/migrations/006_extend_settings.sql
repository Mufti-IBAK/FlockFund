-- Add new setting columns for public page dynamics
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cycle_duration_days INT DEFAULT 28;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS min_birds_per_investment INT DEFAULT 10;
