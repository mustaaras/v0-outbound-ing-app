-- Add read status tracking for admin replies
-- Migration: 022_add_read_status_to_admin_replies.sql

-- Add read_at column to track when users read admin replies
ALTER TABLE admin_replies ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Add index for read status queries
CREATE INDEX IF NOT EXISTS idx_admin_replies_read_at ON admin_replies(read_at);

-- Update RLS policy to allow users to update read_at for their own messages
DROP POLICY IF EXISTS "Users can update read status on their admin replies" ON admin_replies;
CREATE POLICY "Users can update read status on their admin replies" ON admin_replies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_messages sm
      WHERE sm.id = admin_replies.support_message_id
      AND sm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_messages sm
      WHERE sm.id = admin_replies.support_message_id
      AND sm.user_id = auth.uid()
    )
  );