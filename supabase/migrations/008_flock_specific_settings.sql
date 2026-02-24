-- Add investment and pricing settings to flocks table
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS cost_per_bird NUMERIC DEFAULT 4250;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{
  "doc": 800,
  "feed": 2200,
  "medication: 350,
  "labor": 500,
  "overhead": 400
}'::JSONB;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS selling_price_per_bird NUMERIC DEFAULT 10000;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS market_floor_price NUMERIC DEFAULT 8000;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS market_cost NUMERIC DEFAULT 5000;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS investor_share_percentage NUMERIC DEFAULT 70;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS flockfund_share_percentage NUMERIC DEFAULT 30;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS reinvest_percentage NUMERIC DEFAULT 30;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS rounds_before_withdrawal INT DEFAULT 3;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS cycle_duration_days INT DEFAULT 28;
ALTER TABLE flocks ADD COLUMN IF NOT EXISTS min_birds_per_investment INT DEFAULT 10;

-- Backfill from global settings
DO $$
DECLARE
    global_cost_per_bird NUMERIC;
    global_cost_breakdown JSONB;
    global_selling_price NUMERIC;
    global_floor_price NUMERIC;
    global_market_cost NUMERIC;
    global_investor_share NUMERIC;
    global_flockfund_share NUMERIC;
    global_reinvest NUMERIC;
    global_rounds INT;
    global_cycle INT;
    global_min_birds INT;
BEGIN
    SELECT 
        cost_per_bird, cost_breakdown, market_floor_price, market_cost, 
        investor_share_percentage, flockfund_share_percentage, reinvest_percentage, 
        rounds_before_withdrawal, cycle_duration_days, min_birds_per_investment
    INTO 
        global_cost_per_bird, global_cost_breakdown, global_floor_price, global_market_cost,
        global_investor_share, global_flockfund_share, global_reinvest,
        global_rounds, global_cycle, global_min_birds
    FROM settings WHERE id = 1;

    UPDATE flocks SET
        cost_per_bird = COALESCE(global_cost_per_bird, 4250),
        cost_breakdown = COALESCE(global_cost_breakdown, '{
          "doc": 800,
          "feed": 2200,
          "medication": 350,
          "labor": 500,
          "overhead": 400
        }'::JSONB),
        market_floor_price = COALESCE(global_floor_price, 8000),
        market_cost = COALESCE(global_market_cost, 5000),
        investor_share_percentage = COALESCE(global_investor_share, 70),
        flockfund_share_percentage = COALESCE(global_flockfund_share, 30),
        reinvest_percentage = COALESCE(global_reinvest, 30),
        rounds_before_withdrawal = COALESCE(global_rounds, 3),
        cycle_duration_days = COALESCE(global_cycle, 28),
        min_birds_per_investment = COALESCE(global_min_birds, 10);
END $$;
