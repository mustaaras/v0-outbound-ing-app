-- Create snov_searches table to track monthly searches per user
-- This table tracks how many times each user searches for prospects

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS snov_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  search_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index to ensure one record per user per month
-- Create unique index to ensure one record per user per month
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'snov_searches_user_month_idx'
  ) THEN
    CREATE UNIQUE INDEX snov_searches_user_month_idx ON snov_searches(user_id, month);
  END IF;
END$$;

-- Create index on user_id for faster queries if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'snov_searches_user_id_idx'
  ) THEN
    CREATE INDEX snov_searches_user_id_idx ON snov_searches(user_id);
  END IF;
END$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON snov_searches TO anon, authenticated;

SELECT indexname
FROM pg_indexes
WHERE tablename = 'snov_searches';
