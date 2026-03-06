-- Migration: Add email to profiles and sync from auth.users
-- This ensures the Accountant can see staff emails without querying auth.users (which is restricted)

-- 1. Add email column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN 
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Create function to sync email
CREATE OR REPLACE FUNCTION public.handle_user_email_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers on auth.users for INSERT and UPDATE
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_sync();

-- 4. Backfill existing emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
