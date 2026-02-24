-- Add missing selling_price_per_bird to global settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS selling_price_per_bird NUMERIC NOT NULL DEFAULT 10000;

-- Update existing settings row to match the new cost breakdown structure used in the frontend
-- This prevents calculations using sum() or specific keys from failing or being inconsistent
UPDATE settings SET cost_breakdown = '{
  "doc": 800,
  "feed": 2200,
  "medication": 350,
  "labor": 500,
  "overhead": 400
}'::JSONB WHERE id = 1;
