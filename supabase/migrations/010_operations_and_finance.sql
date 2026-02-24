-- Phase 3: Operations & Finance Expansion

-- 1. Update profiles to allow accountant role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'farm_manager', 'keeper', 'investor', 'accountant'));

-- 2. Enhance farm_reports table
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS feed_brand TEXT;
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS litter_status TEXT;
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS ventilation_status TEXT;
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS handover_notes TEXT;
ALTER TABLE farm_reports ADD COLUMN IF NOT EXISTS diagnosis_category TEXT;

-- 3. Create fund_requests table
CREATE TABLE IF NOT EXISTS fund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN ('feed', 'drugs', 'water', 'maintenance', 'other')),
    description TEXT,
    admin_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES profiles(id),
    accountant_processed BOOLEAN DEFAULT FALSE,
    processed_by UUID REFERENCES profiles(id),
    receipt_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for fund_requests
ALTER TABLE fund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON fund_requests
    FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Admin and Accountant can view all requests" ON fund_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND role IN ('admin', 'accountant')
        )
    );

CREATE POLICY "Requesters can insert" ON fund_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Admin can update approval status" ON fund_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Accountant can update processed status" ON fund_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND role = 'accountant'
        )
    );

-- 4. Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    administered_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for vaccinations
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view vaccinations" ON vaccinations
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin and Farm Manager can manage vaccinations" ON vaccinations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND role IN ('admin', 'farm_manager')
        )
    );
