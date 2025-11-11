-- Create public_email_searches table for tracking usage
CREATE TABLE IF NOT EXISTS public.public_email_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month text NOT NULL,
  search_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_email_searches_user_fk FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT public_email_searches_user_month_unique UNIQUE (user_id, month)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_email_searches_user_month ON public.public_email_searches(user_id, month);

-- Enable RLS
ALTER TABLE public.public_email_searches ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS public_email_searches_select_own ON public.public_email_searches;
CREATE POLICY public_email_searches_select_own
ON public.public_email_searches
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS public_email_searches_insert_own ON public.public_email_searches;
CREATE POLICY public_email_searches_insert_own
ON public.public_email_searches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS public_email_searches_update_own ON public.public_email_searches;
CREATE POLICY public_email_searches_update_own
ON public.public_email_searches
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify
SELECT 'public_email_searches table created' as status;
