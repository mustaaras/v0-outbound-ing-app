-- Add admin messaging capability to support system
-- Migration: 020_add_admin_messaging.sql

-- Add admin_replies table for admin responses to support messages
CREATE TABLE IF NOT EXISTS admin_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_message_id uuid REFERENCES support_messages(id) ON DELETE CASCADE,
  admin_email text NOT NULL DEFAULT 'admin@outbound.ing',
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_replies_support_message_id ON admin_replies(support_message_id);
CREATE INDEX IF NOT EXISTS idx_admin_replies_created_at ON admin_replies(created_at DESC);

-- Enable RLS
ALTER TABLE admin_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin replies
CREATE POLICY "Admins can view all admin replies" ON admin_replies
  FOR SELECT USING (auth.jwt() ->> 'email' = 'mustafaaras91@gmail.com');

-- Policy: Admins can insert admin replies
CREATE POLICY "Admins can insert admin replies" ON admin_replies
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'mustafaaras91@gmail.com');

-- Policy: Users can view admin replies to their own support messages
CREATE POLICY "Users can view admin replies to their messages" ON admin_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_messages sm
      WHERE sm.id = admin_replies.support_message_id
      AND sm.user_id = auth.uid()
    )
  );