-- Create public_email_searches table to track usage
CREATE TABLE IF NOT EXISTS public_email_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  search_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_email_searches_user_month 
  ON public_email_searches(user_id, month);

-- Enable Row Level Security
ALTER TABLE public_email_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own search records
CREATE POLICY "Users can view own search records"
  ON public_email_searches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own search records
CREATE POLICY "Users can insert own search records"
  ON public_email_searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own search records
CREATE POLICY "Users can update own search records"
  ON public_email_searches
  FOR UPDATE
  USING (auth.uid() = user_id);
