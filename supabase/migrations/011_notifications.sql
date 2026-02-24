-- Phase 4: Real-time Notifications

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('report', 'payment', 'badge', 'flock', 'system', 'request')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  redirect_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow system/triggers to insert notifications for any user
CREATE POLICY "notifications_system_insert" ON notifications FOR INSERT
  WITH CHECK (TRUE);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Helper Function to notify admins
CREATE OR REPLACE FUNCTION notify_admins(title TEXT, message TEXT, redirect_url TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, redirect_url)
  SELECT id, title, message, 'system', redirect_url
  FROM profiles
  WHERE role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
