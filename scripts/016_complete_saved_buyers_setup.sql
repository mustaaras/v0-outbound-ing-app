-- Complete setup for saved_buyers table with all features
-- Run this single script in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.saved_buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  company text,
  title text,
  archived boolean DEFAULT FALSE,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_buyers_user_fk FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Step 2: Drop old expression-based index if it exists
DROP INDEX IF EXISTS public.saved_buyers_user_email_idx;

-- Step 3: Add unique constraint on (user_id, email)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'saved_buyers_user_email_unique'
  ) THEN
    ALTER TABLE public.saved_buyers
      ADD CONSTRAINT saved_buyers_user_email_unique UNIQUE (user_id, email);
  END IF;
END $$;

-- Step 4: Create index for archived filtering
CREATE INDEX IF NOT EXISTS idx_saved_buyers_archived ON public.saved_buyers(user_id, archived);

-- Step 5: Enable RLS
ALTER TABLE public.saved_buyers ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
DROP POLICY IF EXISTS saved_buyers_insert_own ON public.saved_buyers;
CREATE POLICY saved_buyers_insert_own
ON public.saved_buyers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_buyers_select_own ON public.saved_buyers;
CREATE POLICY saved_buyers_select_own
ON public.saved_buyers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_buyers_update_own ON public.saved_buyers;
CREATE POLICY saved_buyers_update_own
ON public.saved_buyers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_buyers_delete_own ON public.saved_buyers;
CREATE POLICY saved_buyers_delete_own
ON public.saved_buyers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify setup
SELECT 
  'saved_buyers table created' as status,
  COUNT(*) as row_count 
FROM public.saved_buyers;
