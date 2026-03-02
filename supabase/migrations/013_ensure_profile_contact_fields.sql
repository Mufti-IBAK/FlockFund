-- =================================================================================
-- FlockFund — Safe migration for checking/adding profile fields
-- Run this against your Supabase SQL editor to ensure your table has the right columns.
-- =================================================================================

DO $$ 
BEGIN 
    -- Check and add full_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND column_name = 'full_name'
    ) THEN 
        ALTER TABLE profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Check and add phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND column_name = 'phone'
    ) THEN 
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;

END $$;
