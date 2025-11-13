-- Add email cache table to store found emails for reuse
CREATE TABLE IF NOT EXISTS public.email_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('generic', 'personal')),
  source_url TEXT NOT NULL,
  found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_count INTEGER DEFAULT 1,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, domain)
);

-- Index for fast lookups by domain
CREATE INDEX IF NOT EXISTS idx_email_cache_domain ON public.email_cache(domain);

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS idx_email_cache_email ON public.email_cache(email);

-- Index for filtering by validity
CREATE INDEX IF NOT EXISTS idx_email_cache_valid ON public.email_cache(is_valid) WHERE is_valid = true;

-- Index for recent results
CREATE INDEX IF NOT EXISTS idx_email_cache_found_at ON public.email_cache(found_at DESC);

-- Enable RLS
ALTER TABLE public.email_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read valid cached emails
CREATE POLICY "Anyone can read valid cached emails"
  ON public.email_cache
  FOR SELECT
  USING (is_valid = true);

-- Policy: Authenticated users can insert new cached emails
CREATE POLICY "Authenticated users can cache emails"
  ON public.email_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Service role can update
CREATE POLICY "Service role can update cache"
  ON public.email_cache
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.email_cache IS 'Caches found email addresses to speed up searches and build contact database';
COMMENT ON COLUMN public.email_cache.verification_count IS 'Number of times this email has been found/verified';
COMMENT ON COLUMN public.email_cache.is_valid IS 'False if email bounces or becomes invalid';
