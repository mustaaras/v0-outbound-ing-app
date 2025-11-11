-- Add archive functionality to saved_buyers table
ALTER TABLE saved_buyers 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_saved_buyers_archived ON saved_buyers(user_id, archived);
